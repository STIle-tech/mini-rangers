class GameScene extends Phaser.Scene {
  constructor() { super('game'); }

  create() {
    this.units = [];
    this.kills = 0;
    this.over = false;
    this.energy = BASE_UPGRADES.startEnergy.value(SAVE.up.startEnergy);   // พลังงานเริ่มต้นจากอัปเกรด
    this.teamKeys = SAVE.team.slice();                                    // ตัวละครในทีมที่เลือกไว้
    this.enemyEnergy = 30;
    this.aiTimer = 3000;
    this.econLv = 1;

    // สร้างอนิเมชันสำหรับยูนิตที่มีไฟล์ภาพจริง
    for (const k of UNIT_KEYS) {
      const s = UNITS[k].sprite;
      if (!s || !this.textures.exists('unit_' + k)) continue;
      for (const side of ['', 'e_']) {
        const o = side ? this.enemyFrameOffset(k) : 0;
        if (side && !o) continue;                                   // ไม่มีเฟรมศัตรู: ใช้ชุดของฝั่งเราแทน
        if (!this.anims.exists(side + k + '-walk')) {
          this.anims.create({ key: side + k + '-walk', frameRate: 8, repeat: -1,
            frames: this.anims.generateFrameNumbers('unit_' + k, { start: s.walk[0] + o, end: s.walk[1] + o }) });
        }
        if (!this.anims.exists(side + k + '-attack')) {
          this.anims.create({ key: side + k + '-attack', frameRate: 14, repeat: 0,
            frames: this.anims.generateFrameNumbers('unit_' + k, { start: s.attack[0] + o, end: s.attack[1] + o }) });
        }
      }
    }

    // พื้นหลัง
    this.add.rectangle(W / 2, GROUND / 2, W, GROUND, 0x6ec6ff);
    this.add.rectangle(W / 2, GROUND + (H - GROUND) / 2, W, H - GROUND, 0x3b7d3b);
    this.add.rectangle(W / 2, GROUND + 2, W, 4, 0x2a5c2a);

    // ฐาน
    this.bases = {
      player: this.makeBase(60, 0x2d6cdf, BASE_UPGRADES.baseHp.value(SAVE.up.baseHp)),   // เลือดฐานจากอัปเกรด
      enemy:  this.makeBase(W - 60, 0xd9473f),
    };

    // HUD ด้านบน (แถบพลังงาน)
    this.add.rectangle(20, 24, 200, 14, 0x000000, 0.4).setOrigin(0, 0.5);
    this.energyFill = this.add.rectangle(20, 24, 200, 14, 0xffd23f).setOrigin(0, 0.5);
    this.energyText = this.add.text(228, 24, '', { fontFamily: FONT, fontSize: '16px', color: '#fff' }).setOrigin(0, 0.5);

    // ปุ่มกลับลอบบี้
    const menuBtn = this.add.text(W - 16, 24, '☰ ลอบบี้', {
      fontFamily: FONT, fontSize: '16px', color: '#fff', backgroundColor: '#00000066', padding: { x: 8, y: 4 },
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => { writeSave(); this.scene.start('lobby'); });

    // ปุ่มเรียกยูนิต
    this.buttons = this.teamKeys.map((key, i) => this.makeUnitButton(key, i));

    // ปุ่มอัปเกรดเศรษฐกิจ (ใช้พลังงานจ่าย)
    const ebg = this.add.rectangle(66, 392, 116, 56, 0xffd23f).setStrokeStyle(3, 0xffffff, 0.9).setInteractive({ useHandCursor: true });
    const etext = this.add.text(66, 392, '', { fontFamily: FONT, fontSize: '13px', color: '#1a1a1a', align: 'center', fontStyle: 'bold' }).setOrigin(0.5);
    ebg.on('pointerdown', () => this.tryUpgradeEcon());
    this.econBtn = { bg: ebg, text: etext };

    // คีย์ลัด: 1-5 = เรียกยูนิตตามลำดับในทีม, R = อัปเกรดเศรษฐกิจ
    const kb = this.input.keyboard;
    ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'].forEach((n, i) => kb.on('keydown-' + n, () => {
      if (this.teamKeys[i]) this.trySpawnPlayer(this.teamKeys[i]);
    }));
    kb.on('keydown-R', () => this.tryUpgradeEcon());
  }

  // ---------- สร้างส่วนต่างๆ ----------
  makeBase(x, color, hp = BASE_HP) {
    const rect = this.add.rectangle(x, GROUND - 60, 60, 120, color).setStrokeStyle(3, 0x000000, 0.5);
    this.add.rectangle(x, GROUND - 80, 60, 8, 0x000000, 0.25);
    this.add.rectangle(x, 60, 80, 8, 0x000000, 0.5);
    const bar = this.add.rectangle(x - 40, 60, 80, 8, 0xff4d4d).setOrigin(0, 0.5);
    return { hp, max: hp, rect, bar };
  }

  makeUnitButton(key, i) {
    const def = UNITS[key];
    const x = 190 + i * 106;
    const y = 392;
    const bg = this.add.rectangle(x, y, 100, 56, def.color).setStrokeStyle(3, 0xffffff, 0.9).setInteractive({ useHandCursor: true });
    this.add.text(x, y - 9, `${i + 1}. ${def.name}`, { fontFamily: FONT, fontSize: '16px', color: '#1a1a1a', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(x, y + 14, `Lv${SAVE.levels[key]} · ⚡${def.cost}`, { fontFamily: FONT, fontSize: '12px', color: '#1a1a1a' }).setOrigin(0.5);
    this.add.text(x - 43, y - 21, ELEMENTS[def.element].icon, { fontFamily: FONT, fontSize: '12px' }).setOrigin(0.5);
    this.add.text(x + 43, y - 21, TYPES[def.type].icon, { fontFamily: FONT, fontSize: '12px' }).setOrigin(0.5);
    bg.on('pointerdown', () => this.trySpawnPlayer(key));
    return { key, bg };
  }

  // ---------- เศรษฐกิจ ----------
  maxEnergy() { return BASE_MAX_ENERGY + ECON_MAX_ENERGY_PER_LEVEL * (this.econLv - 1); }
  regen()     { return BASE_UPGRADES.regen.value(SAVE.up.regen) + ECON_REGEN_PER_LEVEL * (this.econLv - 1); }

  tryUpgradeEcon() {
    if (this.over) return;
    if (this.econLv >= ECON_MAX_LEVEL) return;
    const cost = econUpgradeCost(this.econLv);
    if (this.energy < cost) return;
    this.energy -= cost;
    this.econLv++;
  }

  // ---------- การกระทำของผู้เล่น ----------
  trySpawnPlayer(key) {
    if (this.over) return;
    const def = UNITS[key];
    if (this.energy < def.cost) return;
    this.energy -= def.cost;
    this.spawn('player', key);
  }

  // เลื่อนเฟรมสำหรับฝั่งศัตรู (สไปรท์ชีตมีแถวที่ 2 เป็นสีศัตรู) คืน 0 ถ้าชีตนั้นไม่มีเฟรมของศัตรู
  enemyFrameOffset(key) {
    const s = UNITS[key].sprite, tex = this.textures.exists('unit_' + key) && this.textures.get('unit_' + key);
    if (!s || !tex || !s.enemyOffset) return 0;
    return tex.frameTotal > s.enemyOffset + s.attack[1] ? s.enemyOffset : 0;
  }

  // ---------- สร้างยูนิต ----------
  spawn(team, key) {
    const def = UNITS[key];
    // ทุกตัวเกิดจุดเดียวกัน หน้าฐาน (ห่างจากขอบฐาน SPAWN_OFFSET)
    const x = team === 'player' ? PLAYER_BASE_EDGE + SPAWN_OFFSET : ENEMY_BASE_EDGE - SPAWN_OFFSET;
    const hasSprite = !!def.sprite && this.textures.exists('unit_' + key);

    // บันทึกลงสมุดสะสม (เจอทั้งฝั่งเราและศัตรู) และสถิติการลงสนาม
    if (team === 'player') SAVE.stats.used[key] = (SAVE.stats.used[key] || 0) + 1;
    if (discoverUnit(key)) {
      this.floatText(W / 2, 120, `✨ ค้นพบ ${def.name}!  +${GEM_DISCOVER} ◆`, '#ffe066');
    }

    let body, h, baseY, fOff = 0, ak = key;
    if (hasSprite) {
      fOff = team === 'enemy' ? this.enemyFrameOffset(key) : 0;
      ak = fOff ? 'e_' + key : key;                              // ชื่ออนิเมชันที่ใช้
      body = this.add.sprite(x, GROUND, 'unit_' + key, def.sprite.walk[0] + fOff).setOrigin(0.5, 122 / 128).setScale(def.sprite.scale || 1);
      if (team === 'enemy') body.setFlipX(true);
      h = body.displayHeight;
      baseY = GROUND;
    } else {
      h = def.size * 1.6;
      baseY = GROUND - h / 2;
      const fill = team === 'player' ? def.color : Phaser.Display.Color.IntegerToColor(def.color).darken(35).color;
      body = this.add.rectangle(x, baseY, def.size, h, fill).setStrokeStyle(2, team === 'player' ? 0x0b3d91 : 0x7a1111);
    }

    const barY = GROUND - h - 8;
    const barBg = this.add.rectangle(x, barY, 26, 4, 0x000000, 0.5);
    const bar = this.add.rectangle(x - 13, barY, 26, 4, team === 'player' ? 0x38e07b : 0xff5c5c).setOrigin(0, 0.5);

    const mult = team === 'player' ? statMult(SAVE.levels[key]) : 1;   // เลเวลตัวละครมีผลกับฝั่งผู้เล่นเท่านั้น
    const tag = this.add.text(x, barY - 9, ELEMENTS[def.element].icon + TYPES[def.type].icon, { fontFamily: FONT, fontSize: '10px' }).setOrigin(0.5);
    this.units.push({
      team, key, def, hasSprite, mult, tag, fOff, ak,
      rank: TYPES[def.type].rank,                       // ตำแหน่งยืน: 0 หน้า / 1 กลาง / 2 หลัง
      skillCd: def.skill ? def.skill.cd * 0.5 : 0,
      maxHp: def.hp * mult, hp: def.hp * mult, dmg: def.dmg * mult,
      x, h, baseY, cd: 0, lunge: 0, phase: Math.random() * 6,
      moving: false, attacking: false,
      body, bar, barBg,
    });
  }

  // ---------- AI ศัตรู ----------
  enemyAI(delta) {
    this.aiTimer -= delta;
    if (this.aiTimer > 0) return;
    const affordable = UNIT_KEYS.filter(k => UNITS[k].cost <= this.enemyEnergy);
    if (affordable.length === 0) { this.aiTimer = 300; return; }
    const key = Phaser.Utils.Array.GetRandom(affordable);
    this.enemyEnergy -= UNITS[key].cost;
    this.spawn('enemy', key);
    this.aiTimer = 1200 + Math.random() * 1800;
  }

  // ---------- ตรรกะยูนิตแต่ละตัว ----------
  stepUnit(u, dt, delta) {
    const dir = u.team === 'player' ? 1 : -1;
    u.cd -= delta;
    if (u.def.skill) u.skillCd -= delta;
    u.moving = false;

    let target = null, best = Infinity;
    for (const o of this.units) {
      if (o.team === u.team || o.hp <= 0) continue;
      const d = (o.x - u.x) * dir;
      if (d >= -TARGET_OVERLAP) {                         // ศัตรูที่อยู่ข้างหน้า หรือซ้อน/เหลื่อมอยู่ข้างหลังนิดเดียว
        const dd = Math.max(0, d);
        if (dd < best) { best = dd; target = o; }
      }
    }

    const enemyBase = this.bases[u.team === 'player' ? 'enemy' : 'player'];
    const baseEdge = u.team === 'player' ? ENEMY_BASE_EDGE : PLAYER_BASE_EDGE;
    const baseDist = (baseEdge - u.x) * dir;
    let isBase = false;
    if (!target || baseDist < best) { target = enemyBase; best = baseDist; isBase = true; }

    if (best <= u.def.range) {
      // สายไหวพริบ: ใช้สกิลก่อนถ้าพร้อม ไม่งั้นตีธรรมดา
      if (u.def.skill && u.skillCd <= 0 && this.trySkill(u, target, isBase)) return;
      if (u.cd <= 0) this.attack(u, target, isBase);
    } else {
      if (u.def.skill && u.def.skill.kind === 'heal' && u.skillCd <= 0) this.trySkill(u, null, false);

      // เดินไปข้างหน้า ทะลุตัวอื่นได้ แต่ต้องรักษาแถว: ประเภทที่ rank สูงกว่าห้ามล้ำหน้าประเภทที่อยู่หน้ากว่า
      // (พลัง หน้าสุด -> ไหวพริบ ถอยหลังมา 1 แถว -> ว่องไว ถอยหลังมา 2 แถว) ประเภทเดียวกันซ้อนกันได้
      let newX = u.x + dir * u.def.speed * dt;
      if (u.rank > 0) {
        let limit = null;
        for (const a of this.units) {
          if (a.team !== u.team || a.hp <= 0 || a.rank >= u.rank) continue;
          const l = a.x - dir * FORMATION_GAP * (u.rank - a.rank);
          if (limit === null || (l - limit) * dir < 0) limit = l;
        }
        if (limit !== null && (newX - limit) * dir > 0) {
          if ((u.x - limit) * dir > 0) {                                      // ล้ำหน้าแถวอยู่แล้ว (เช่น เกิดจุดเดียวกับตัวหน้า)
            newX = u.x + dir * u.def.speed * dt;   // เดินปกติ ไม่ลดความเร็ว (ผ่านกันได้เลย)
          }
          else newX = limit;                                                  // ยังอยู่หลังแถว: เดินตามได้ไม่เกินตำแหน่งแถว
        }
      }
      if ((newX - u.x) * dir > 0.01) { u.x = newX; u.moving = true; }
    }
  }

  // ---------- สกิล (คืนค่า true ถ้าใช้สกิลสำเร็จ) ----------
  trySkill(u, target, isBase) {
    const sk = u.def.skill;
    const col = ELEMENTS[u.def.element].color;

    if (sk.kind === 'heal') {
      const hurt = this.units.filter(a => a.team === u.team && a.hp > 0 && a.hp < a.maxHp && Math.abs(a.x - u.x) <= sk.radius);
      if (!hurt.length) return false;
      u.skillCd = sk.cd;
      u.cd = Math.max(u.cd, 400);
      for (const a of hurt) {
        a.hp = Math.min(a.maxHp, a.hp + sk.power * u.mult);
        this.floatText(a.x, a.baseY - a.h - 22, '+' + Math.round(sk.power * u.mult), '#7dff9b');
      }
      this.ring(u.x, GROUND - 14, sk.radius, col);
      this.floatText(u.x, u.baseY - u.h - 34, sk.name, '#ffffff');
      return true;
    }

    if (sk.kind === 'aoe') {
      if (!target) return false;
      u.skillCd = sk.cd;
      u.cd = u.def.cd;
      const cx = isBase ? target.rect.x : target.x;
      if (isBase) target.hp -= this.dmgOf(u) * sk.power;
      for (const o of this.units) {
        if (o.team === u.team || o.hp <= 0 || Math.abs(o.x - cx) > sk.radius) continue;
        o.hp -= this.dmgOf(u) * sk.power * elemMult(u.def.element, o.def.element);
        this.tweens.add({ targets: o.body, alpha: 0.4, duration: 60, yoyo: true });
      }
      this.ring(cx, GROUND - 14, sk.radius, col);
      this.floatText(u.x, u.baseY - u.h - 34, sk.name, '#ffffff');
      return true;
    }
    if (sk.kind === 'buff') {
      const allies = this.units.filter(a => a.team === u.team && a.hp > 0 && Math.abs(a.x - u.x) <= sk.radius);
      if (!target || allies.length < 2) return false;   // ใช้เมื่อกำลังสู้ และมีเพื่อนอยู่ใกล้
      u.skillCd = sk.cd;
      u.cd = Math.max(u.cd, 400);
      for (const a of allies) {
        a.buffMult = sk.power;
        a.buffUntil = this.time.now + sk.duration;
        this.floatText(a.x, a.baseY - a.h - 22, '⬆ ดาเมจ', '#ffd23f');
      }
      this.ring(u.x, GROUND - 14, sk.radius, col);
      this.floatText(u.x, u.baseY - u.h - 34, sk.name, '#ffffff');
      return true;
    }
    return false;
  }

  // ดาเมจจริงของยูนิต (รวมบัฟที่ยังไม่หมดเวลา)
  dmgOf(u) {
    return u.dmg * ((u.buffUntil || 0) > this.time.now ? u.buffMult : 1);
  }

  floatText(x, y, text, color) {
    const t = this.add.text(x, y, text, { fontFamily: FONT, fontSize: '13px', color, fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5).setDepth(5);
    this.tweens.add({ targets: t, y: y - 16, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  ring(x, y, r, color) {
    const c = this.add.circle(x, y, 8, color, 0.35).setStrokeStyle(2, color, 0.9).setDepth(4);
    this.tweens.add({ targets: c, scale: r / 8, alpha: 0, duration: 450, onComplete: () => c.destroy() });
  }

  attack(u, target, isBase) {
    u.cd = u.def.cd;
    const em = isBase ? 1 : elemMult(u.def.element, target.def.element);   // ธาตุชนะ/แพ้ทาง
    target.hp -= this.dmgOf(u) * em;
    if (em !== 1) this.floatText(target.x, target.baseY - target.h - 22, 'x' + em, em > 1 ? '#ffd23f' : '#9fb2d9');
    const hitObj = isBase ? target.rect : target.body;

    // ท่าโจมตี
    if (u.hasSprite) {
      u.attacking = true;
      u.body.play(u.ak + '-attack');
      u.body.once('animationcomplete', () => { u.attacking = false; });
    }
    this.tweens.add({ targets: u, lunge: 5, duration: 70, yoyo: true });   // พุ่งไปข้างหน้านิดหน่อย

    if (u.def.range > 60) {
      const tx = isBase ? hitObj.x : target.x;
      const shot = this.add.circle(u.x, u.baseY - u.h / 2, 4, 0xffffff);
      this.tweens.add({ targets: shot, x: tx, duration: 150, onComplete: () => shot.destroy() });
    }
    this.tweens.add({ targets: hitObj, alpha: 0.4, duration: 60, yoyo: true });
  }

  // ---------- วนลูปหลัก ----------
  update(time, delta) {
    if (this.over) return;
    const dt = delta / 1000;

    this.energy = Math.min(this.maxEnergy(), this.energy + this.regen() * dt);
    this.enemyEnergy = Math.min(BASE_MAX_ENERGY, this.enemyEnergy + ENEMY_REGEN * dt);
    this.enemyAI(delta);

    for (const u of this.units) if (u.hp > 0) this.stepUnit(u, dt, delta);

    // วาดยูนิต / ลบตัวที่ตาย
    for (const u of this.units) {
      if (u.hp <= 0) {
        if (u.team === 'enemy') { this.kills++; SAVE.stats.defeated[u.key] = (SAVE.stats.defeated[u.key] || 0) + 1; }
        u.body.destroy(); u.bar.destroy(); u.barBg.destroy(); u.tag.destroy();
        continue;
      }
      const dir = u.team === 'player' ? 1 : -1;
      const bob = (u.moving && !u.hasSprite) ? Math.abs(Math.sin(time * 0.012 + u.phase)) * 3 : 0;
      u.body.x = u.x + u.lunge * dir;
      u.body.y = u.baseY - bob;
      u.barBg.x = u.x;
      u.tag.x = u.x;
      u.bar.x = u.x - 13;
      u.bar.width = 26 * Math.max(0, u.hp / u.maxHp);

      if (u.hasSprite && !u.attacking) {
        if (u.moving) u.body.play(u.ak + '-walk', true);
        else { u.body.anims.stop(); u.body.setFrame(u.def.sprite.walk[0] + u.fOff); }
      }
    }
    this.units = this.units.filter(u => u.hp > 0);

    this.updateHud();

    if (this.bases.enemy.hp <= 0) this.endGame('ชนะแล้ว! 🎉', true);
    else if (this.bases.player.hp <= 0) this.endGame('แพ้แล้ว...', false);
  }

  updateHud() {
    this.energyFill.width = 200 * (this.energy / this.maxEnergy());
    this.energyText.setText(`พลังงาน ${Math.floor(this.energy)}/${this.maxEnergy()}`);

    for (const b of this.buttons) {
      b.bg.setAlpha(this.energy >= UNITS[b.key].cost ? 1 : 0.4);
    }

    if (this.econLv >= ECON_MAX_LEVEL) {
      this.econBtn.text.setText(`เศรษฐกิจ Lv${this.econLv}\nMAX`);
      this.econBtn.bg.setAlpha(0.35);
    } else {
      const c = econUpgradeCost(this.econLv);
      this.econBtn.text.setText(`R. เศรษฐกิจ Lv${this.econLv}\n▲ อัป ${c}`);
      this.econBtn.bg.setAlpha(this.energy >= c ? 1 : 0.45);
    }

    for (const k of ['player', 'enemy']) {
      const b = this.bases[k];
      b.bar.width = 80 * Math.max(0, b.hp / b.max);
    }
  }

  endGame(message, won) {
    this.over = true;

    // แจกทองหลังจบรอบ แล้วเซฟ
    const reward = (won ? REWARD_WIN : REWARD_LOSE) + this.kills * REWARD_PER_KILL;
    SAVE.gold += reward;
    writeSave();

    const overlay = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setInteractive();
    this.add.text(W / 2, H / 2 - 60, message, { fontFamily: FONT, fontSize: '48px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.circle(W / 2 - 150, H / 2 - 5, 10, 0xffd23f).setStrokeStyle(2, 0xb8860b);
    this.add.text(W / 2 - 134, H / 2 - 5, `ได้ทอง +${reward}  (ฆ่าศัตรู ${this.kills} ตัว)`, {
      fontFamily: FONT, fontSize: '22px', color: '#ffe066', fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    this.add.text(W / 2, H / 2 + 40, 'แตะหรือคลิกเพื่อเล่นใหม่', { fontFamily: FONT, fontSize: '20px', color: '#ddd' }).setOrigin(0.5);
    const lobbyBtn = this.add.text(W / 2, H / 2 + 90, 'กลับลอบบี้', {
      fontFamily: FONT, fontSize: '22px', color: '#1a1a1a', backgroundColor: '#ffffff', padding: { x: 18, y: 8 }, fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    lobbyBtn.on('pointerdown', () => this.scene.start('lobby'));
    overlay.once('pointerdown', () => this.scene.restart());
  }
}