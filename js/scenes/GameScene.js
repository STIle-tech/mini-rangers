// ตัวช่วยที่ GameScene ใช้ (ถ้า save.js / ui.js ของคุณมีอยู่แล้วจะใช้ของเดิม ไม่ทับ)
globalThis.safeNumber ??= (v, d = 0) => (v !== null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : d);
globalThis.normalizeSave ??= () => {};

// ค่าคูลดาวน์การเรียกยูนิต (มิลลิวินาที) = SPAWN_CD_BASE + ราคา × SPAWN_CD_PER_COST (ยูนิตใดใส่ spawnCd เองใน units.js ได้)
const SPAWN_CD_BASE = 1500;
const SPAWN_CD_PER_COST = 40;
const GEM_SHAPE = [{ x: -10, y: -4 }, { x: -5, y: -11 }, { x: 5, y: -11 }, { x: 10, y: -4 }, { x: 0, y: 12 }];

// คริสตัลสีฟ้า (ไอคอนพลังงานแบบ Line Rangers) ใช้ทั้งตัวเลขพลังงาน ราคาการ์ด และปุ่มอัปเกรด
function crystal(scene, x, y, s = 1) {
  return scene.add.graphics({ x, y }).setScale(s)
    .fillStyle(0x38c4ff).fillPoints(GEM_SHAPE, true)
    .fillStyle(0x1a86e0).fillPoints([GEM_SHAPE[0], GEM_SHAPE[3], GEM_SHAPE[4]], true)
    .lineStyle(2, 0xffffff, 0.95).strokePoints(GEM_SHAPE, true);
}

// สีฐานตามสถานะ [ตัวตึก, หลังคา, ธง]
const BASE_COLORS = {
  player: [0x2d6cdf, 0x2458b8, 0x4da6ff],
  enemy: [0xd9473f, 0xb6322d, 0xff5b52],
  damaged: [0x8c4b35, 0x71372a, 0xb82d27],
  ruined: [0x3b3030, 0x2a2424, 0x4a2424],
};
// สถานะฐาน 0 ปกติ / 1 กำลังพัง (เลือด ≤ 50%) / 2 พัง
const BASE_STATES = [
  { text: 'ฐาน', color: '#ffffff', crack: 0, smoke: [0, 0], warn: 0 },
  { text: '⚠ กำลังพัง', color: '#ffd23f', crack: 1, smoke: [0.5, 0.35], warn: 0.12 },
  { text: '💥 ฐานพัง', color: '#ff6666', crack: 1, smoke: [0.7, 0.55], warn: 0 },
];

class GameScene extends Phaser.Scene {
  constructor() { super('game'); }

  create(data) {
    normalizeSave();   // ซ่อม SAVE ก่อนเริ่มเกม
    this.units = [];
    this.kills = 0;
    this.over = false;
    this.mode = data?.mode || 'normal';   // ส่งมาจากหน้าเลือกด่าน (ไม่มี = เล่นแบบไม่จำกัด)
    this.stageNo = data?.stage || 0;
    this.stage = this.stageNo ? stageInfo(this.mode, this.stageNo) : null;
    this.paused = false;
    this.clock = 0;      // นาฬิกาในเกม (นับตามความเร็วเกม) ใช้กับบัฟ
    this.spawnCd = {};   // คูลดาวน์ที่เหลือของแต่ละยูนิต (ms)
    this.econLv = 1;
    this.aiTimer = 3000;
    this.enemyEnergy = BASE_MAX_ENERGY;
    this.teamKeys = Array.isArray(SAVE.team) && SAVE.team.length ? SAVE.team.slice() : UNIT_KEYS.slice(0, TEAM_SIZE);
    this.energy = BASE_UPGRADES.energyCapacity.value(this.lv(SAVE.up.energyCapacity, BASE_UPGRADES.energyCapacity.max));

    this.createAnimations();
    this.setSpeed(1);
    this.events.once('shutdown', () => { this.anims.resumeAll(); this.anims.globalTimeScale = 1; });

    // สนาม
    this.add.rectangle(W / 2, GROUND / 2, W, GROUND, 0x6ec6ff);
    this.add.rectangle(W / 2, GROUND + (H - GROUND) / 2, W, H - GROUND, 0x3b7d3b);
    this.add.rectangle(W / 2, GROUND + 2, W, 4, 0x2a5c2a);

    this.bases = {
      player: this.makeBase(60, BASE_COLORS.player[0], BASE_UPGRADES.baseHp.value(safeNumber(SAVE.up.baseHp, 1))),
      enemy: this.makeBase(W - 60, BASE_COLORS.enemy[0], this.stage ? this.stage.baseHp : BASE_HP),
    };

    // แถบล่างให้การ์ดเด่นขึ้น
    this.add.rectangle(W / 2, GROUND + (H - GROUND) / 2 + 8, W, H - GROUND - 16, 0x000000, 0.22);

    // HUD ขวาบน (สไตล์ Line Rangers): ◆ พลังงาน/สูงสุด · ปุ่มเร่ง x2 · ปุ่มพัก
    this.add.rectangle(W - 187, 49, 150, 7, 0x000000, 0.45);
    this.energyFill = this.add.rectangle(W - 262, 49, 150, 7, 0x38c4ff).setOrigin(0, 0.5);
    this.energyText = this.t(W - 112, 28, '', 26, '#fff', { fontStyle: 'bold', stroke: '#0a4a7a', strokeThickness: 6 }).setOrigin(1, 0.5);
    this.energyIcon = crystal(this, 0, 28, 1.3);
    this.makeRoundButton(W - 78, 30, 18, 0x2b8f8c, 0xffc830, () => this.setSpeed(this.speed > 1 ? 1 : 2));
    this.speedText = this.t(W - 78, 30, 'x1', 17, '#fff', { fontStyle: 'bold', stroke: '#0a3a3a', strokeThickness: 4 });
    this.speedRing = this.add.circle(W - 78, 30, 22).setStrokeStyle(3, 0xfff2a0, 0.9).setVisible(false);
    this.makeRoundButton(W - 30, 30, 20, 0x7a3f1d, 0x3a1f0c, () => this.togglePause());
    this.add.rectangle(W - 36, 30, 5, 17, 0xffffff);
    this.add.rectangle(W - 24, 30, 5, 17, 0xffffff);
    this.setSpeed(1);
    if (this.stage) {   // ป้ายด่านมุมซ้ายบน
      this.t(16, 22, `ด่าน ${this.stageNo}${this.stage.boss ? ' 👹 บอส' : ''}`, 20, this.stage.boss ? '#ff8a80' : '#fff', { fontStyle: 'bold', stroke: '#1a1a1a', strokeThickness: 5 }).setOrigin(0, 0.5);
      this.t(16, 44, STAGE_MODES.find(m => m.id === this.mode).name, 12, '#ffe9b0', { fontStyle: 'bold', stroke: '#1a1a1a', strokeThickness: 3 }).setOrigin(0, 0.5);
    }

    this.buttons = this.teamKeys.map((key, i) => this.makeUnitButton(key, i));
    this.econBtn = this.makeEconButton();

    // คีย์ลัด: 1-5 = เรียกยูนิตตามลำดับในทีม, R = อัปเกรดเศรษฐกิจ, Esc/P = พักเกม
    const kb = this.input.keyboard;
    ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'].forEach((n, i) =>
      kb.on('keydown-' + n, () => this.teamKeys[i] && this.trySpawnPlayer(this.teamKeys[i])));
    kb.on('keydown-R', () => this.tryUpgradeEcon());
    kb.on('keydown-ESC', () => this.togglePause());
    kb.on('keydown-P', () => this.togglePause());
  }

  // ---------- ปุ่มกลม / ความเร็ว / พักเกม ----------
  makeRoundButton(x, y, r, fill, stroke, fn) {
    return this.add.circle(x, y, r, fill).setStrokeStyle(3, stroke)
      .setInteractive({ useHandCursor: true }).on('pointerdown', fn);
  }

  setSpeed(s) {
    this.speed = s;
    this.time.paused = false;
    this.time.timeScale = this.tweens.timeScale = this.anims.globalTimeScale = s;
    this.speedText?.setText('x' + s);
    this.speedRing?.setVisible(s > 1);
  }

  togglePause() {
    if (this.over) return;
    this.paused = !this.paused;
    if (!this.paused) {
      this.pauseUi.destroy();
      this.tweens.resumeAll(); this.anims.resumeAll(); this.time.paused = false;
      return;
    }
    this.tweens.pauseAll(); this.anims.pauseAll(); this.time.paused = true;
    const btn = (y, label, fn) => this.t(W / 2, y, label, 22, '#1a1a1a', { backgroundColor: '#ffffff', padding: { x: 22, y: 8 }, fontStyle: 'bold' })
      .setInteractive({ useHandCursor: true }).on('pointerdown', fn);
    this.pauseUi = this.add.container(0, 0, [
      this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setInteractive(),
      this.t(W / 2, H / 2 - 70, 'พักเกม', 44, '#fff', { fontStyle: 'bold' }),
      btn(H / 2, 'เล่นต่อ', () => this.togglePause()),
      btn(H / 2 + 56, this.stage ? 'ออกไปเลือกด่าน' : 'กลับลอบบี้', () => { normalizeSave(); if (typeof writeSave === 'function') writeSave(); this.scene.start(this.stage ? 'stage' : 'lobby', { mode: this.mode, stage: this.stageNo }); }),
    ]).setDepth(3000);
  }

  // ---------- ตัวช่วย ----------
  t(x, y, s, size, color, style = {}) {
    return this.add.text(x, y, s, { fontFamily: FONT, fontSize: size + 'px', color, ...style }).setOrigin(0.5);
  }

  lv(v, max) { return Math.max(1, Math.min(max, safeNumber(v, 1))); }   // เลเวลที่ปลอดภัย 1..max

  setEnergy(v) { this.energy = Math.max(0, Math.min(this.maxEnergy(), v)); }

  // อนิเมชันเดิน/โจมตี (ฝั่งศัตรูใช้เฟรมแถวที่ 2 ถ้ามี)
  createAnimations() {
    for (const k of UNIT_KEYS) {
      const s = UNITS[k].sprite;
      if (!s || !this.textures.exists('unit_' + k)) continue;
      for (const side of ['', 'e_']) {
        const o = side ? this.enemyFrameOffset(k) : 0;
        if (side && !o) continue;   // ไม่มีเฟรมศัตรู: ใช้ชุดของฝั่งเราแทน
        for (const [name, frames, frameRate, repeat] of [['walk', s.walk, 8, -1], ['attack', s.attack, 14, 0]]) {
          const key = side + k + '-' + name;
          if (this.anims.exists(key)) continue;
          this.anims.create({ key, frameRate, repeat,
            frames: this.anims.generateFrameNumbers('unit_' + k, { start: frames[0] + o, end: frames[1] + o }) });
        }
      }
    }
  }

  // ---------- ฐาน ----------
  makeBase(x, color, hp = BASE_HP) {
    hp = Math.max(1, safeNumber(hp, BASE_HP));
    const a = this.add, g = GROUND;
    const parts = {
      shadow: a.ellipse(x, g - 5, 92, 18, 0x000000, 0.25),
      rect: a.rectangle(x, g - 60, 60, 120, color).setStrokeStyle(3, 0x000000, 0.5),
      roof: a.rectangle(x, g - 125, 78, 18, color).setStrokeStyle(3, 0x000000, 0.5),
      pole: a.rectangle(x, g - 155, 4, 35, 0x5a4632),
      flag: a.triangle(x + 18, g - 160, 0, 0, 34, 10, 0, 20, color),
      door: a.rectangle(x, g - 40, 18, 40, 0x182235),
      windowL: a.rectangle(x - 18, g - 82, 12, 16, 0xbcecff),
      windowR: a.rectangle(x + 18, g - 82, 12, 16, 0xbcecff),
      crack1: a.line(x - 8, g - 82, 0, 0, 14, 18, 0xffffff, 0).setLineWidth(3),
      crack2: a.line(x + 10, g - 65, 0, 0, -12, 22, 0xffffff, 0).setLineWidth(3),
      smoke1: a.circle(x - 18, g - 125, 10, 0x777777, 0),
      smoke2: a.circle(x + 18, g - 138, 8, 0x777777, 0),
      warning: a.rectangle(x, g - 60, 66, 126, 0xff3b30, 0),
    };
    const container = a.container(0, 0, Object.values(parts));
    a.rectangle(x, 60, 80, 8, 0x000000, 0.5);
    const bar = a.rectangle(x - 40, 60, 80, 8, 0xff4d4d).setOrigin(0, 0.5);
    const stateText = this.t(x, 78, '', 11, '#ffffff', { fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 });
    return { hp, max: hp, x, ...parts, container, bar, stateText, state: -1, baseY: g - 60, h: 120 };
  }

  updateBaseVisual(base, force = false) {
    if (!base) return;
    base.max = Math.max(1, safeNumber(base.max, BASE_HP));
    base.hp = Math.max(0, safeNumber(base.hp, 0));
    const state = base.hp <= 0 ? 2 : base.hp / base.max <= 0.5 ? 1 : 0;
    if (!force && state === base.state) return;
    base.state = state;

    const mine = base === this.bases.player, st = BASE_STATES[state];
    const [rect, roof, flag] = [BASE_COLORS[mine ? 'player' : 'enemy'], BASE_COLORS.damaged, BASE_COLORS.ruined][state];
    base.rect.setFillStyle(rect);
    base.roof.setFillStyle(roof);
    base.flag.setFillStyle(flag);
    base.crack1.setAlpha(st.crack);
    base.crack2.setAlpha(st.crack);
    base.smoke1.setAlpha(st.smoke[0]);
    base.smoke2.setAlpha(st.smoke[1]);
    base.warning.setAlpha(st.warn);
    base.stateText.setText(st.text).setColor(st.color);

    // หยุดเอฟเฟกต์ของสถานะก่อนหน้า แล้วเริ่มของสถานะใหม่
    this.tweens.killTweensOf([base.smoke1, base.smoke2, base.warning]);
    base.smoke1.y = GROUND - 125;
    base.smoke2.y = GROUND - 138;
    if (state === 1) {
      this.tweens.add({ targets: [base.smoke1, base.smoke2], y: '-=8', alpha: { from: 0.15, to: 0.55 }, duration: 650, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: base.warning, alpha: { from: 0.04, to: 0.18 }, duration: 300, yoyo: true, repeat: -1 });
    } else if (state === 2) {
      base.rect.angle = mine ? -8 : 8;
      base.roof.angle = mine ? -10 : 10;
      this.tweens.add({ targets: [base.smoke1, base.smoke2], y: '-=20', alpha: { from: 0.25, to: 0.75 }, duration: 900, yoyo: true, repeat: -1 });
    }
  }

  // ฐานโดนตี: อัปเดตสภาพ สั่นเมื่อเลือดต่ำ ระเบิดเมื่อพัง
  onBaseHit(base) {
    this.updateBaseVisual(base);
    if (base.hp <= 0) return this.baseDestroyEffect(base);
    if (base.hp / base.max <= 0.5) {
      this.tweens.add({ targets: base.container, x: { from: -3, to: 3 }, duration: 45, yoyo: true, repeat: 2 });
    }
  }

  baseDestroyEffect(base) {
    if (base.destroyEffectDone) return;
    base.destroyEffectDone = true;

    const flash = this.add.circle(base.x, GROUND - 65, 18, 0xffd23f, 0.9).setDepth(10);
    this.tweens.add({ targets: flash, scale: 5, alpha: 0, duration: 450, onComplete: () => flash.destroy() });

    for (let i = 0; i < 12; i++) {
      const piece = this.add.rectangle(base.x, GROUND - 70, 6, 6, i % 2 ? 0x777777 : 0xffd23f).setDepth(9);
      const angle = (Math.PI * 2 / 12) * i;
      this.tweens.add({
        targets: piece, alpha: 0, angle: 360, duration: 650,
        x: base.x + Math.cos(angle) * (40 + Math.random() * 50),
        y: GROUND - 70 + Math.sin(angle) * (30 + Math.random() * 40),
        onComplete: () => piece.destroy(),
      });
    }
  }

  // ---------- การ์ดเรียกยูนิต (สไตล์ Line Rangers: ม่วง ดาเกรด ราคาคริสตัล แถบคูลดาวน์) ----------
  cdMax(key) { const d = UNITS[key]; return safeNumber(d.spawnCd, SPAWN_CD_BASE + safeNumber(d.cost, 0) * SPAWN_CD_PER_COST); }

  makeUnitButton(key, i) {
    const def = UNITS[key], w = 100, h = 92, x = 116 + i * 106, y = 392;
    const grade = typeof gradeOf === 'function' ? gradeOf(key) : 1;
    const bg = this.add.graphics()
      .fillStyle(0x000000, 0.35).fillRoundedRect(-w / 2, -h / 2 + 4, w, h, 12)
      .fillStyle(0x2a0f4d).fillRoundedRect(-w / 2, -h / 2, w, h, 12)
      .fillStyle(0x5a2a92).fillRoundedRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 10)
      .fillStyle(0x7b43bd, 0.6).fillRoundedRect(-w / 2 + 3, -h / 2 + 3, w - 6, 28, { tl: 10, tr: 10, bl: 0, br: 0 })
      .lineStyle(3, 0xb35cff).strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    const mask = this.add.rectangle(-w / 2 + 3, h / 2 - 3, w - 6, 0, 0x000000, 0.62).setOrigin(0, 0);
    const hit = this.add.rectangle(0, 0, w, h, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    const cdText = this.t(0, 0, '', 24, '#fff', { fontStyle: 'bold', stroke: '#000', strokeThickness: 5 });
    const c = this.add.container(x, y, [
      bg,
      unitPortrait(this, 0, 22, key, 62),
      this.t(0, -36, '★'.repeat(Math.max(1, Math.floor(grade) || 1)), 14, '#ffd23f', { stroke: '#5a3a08', strokeThickness: 3 }),
      this.t(-40, -37, String(i + 1), 11, '#e8d4ff'),
      crystal(this, -22, 36, 0.75),
      this.t(-9, 36, String(def.cost), 20, '#fff', { fontStyle: 'bold', stroke: '#1a0a33', strokeThickness: 4 }).setOrigin(0, 0.5),
      this.t(36, 36, ELEMENTS[def.element].icon + TYPES[def.type].icon, 11),
      mask,
      cdText,
      hit,
    ]);
    hit.on('pointerdown', () => this.trySpawnPlayer(key));
    return { key, c, mask, cdText, w, h };
  }

  makeEconButton() {
    const w = 120, h = 92, x = 674, y = 392;
    const bg = this.add.graphics()
      .fillStyle(0x000000, 0.35).fillRoundedRect(-w / 2, -h / 2 + 4, w, h, 12)
      .fillStyle(0x3a1f0c).fillRoundedRect(-w / 2, -h / 2, w, h, 12)
      .fillStyle(0x8a5028).fillRoundedRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 10)
      .fillStyle(0xa8693a, 0.6).fillRoundedRect(-w / 2 + 3, -h / 2 + 3, w - 6, 28, { tl: 10, tr: 10, bl: 0, br: 0 })
      .lineStyle(3, 0xd9a05a).strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    const hit = this.add.rectangle(0, 0, w, h, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    const lv = this.t(26, -14, '', 26, '#fff', { fontStyle: 'bold', stroke: '#0a4a7a', strokeThickness: 6 });
    const cost = this.t(10, 32, '', 20, '#fff', { fontStyle: 'bold', stroke: '#1a0a33', strokeThickness: 4 });
    const icon = crystal(this, -28, 30, 0.75);
    const c = this.add.container(x, y, [
      bg, crystal(this, -30, -8, 2.2), crystal(this, -6, 4, 1.4), lv, icon, cost,
      this.t(-50, -37, 'R', 11, '#ffe9c0'), hit,
    ]);
    hit.on('pointerdown', () => this.tryUpgradeEcon());
    return { c, lv, cost, icon };
  }

  // ---------- เศรษฐกิจ ----------
  maxEnergy() {
    const cap = BASE_UPGRADES.energyCapacity;
    return cap.value(this.lv(SAVE.up.energyCapacity, cap.max)) + ECON_MAX_ENERGY_PER_LEVEL * (this.lv(this.econLv, ECON_MAX_LEVEL) - 1);
  }

  regen() {
    return BASE_UPGRADES.regen.value(this.lv(SAVE.up.regen, BASE_UPGRADES.regen.max)) + ECON_REGEN_PER_LEVEL * (this.lv(this.econLv, ECON_MAX_LEVEL) - 1);
  }

  tryUpgradeEcon() {
    if (this.over || this.paused) return;
    this.econLv = this.lv(this.econLv, ECON_MAX_LEVEL);
    if (this.econLv >= ECON_MAX_LEVEL) return;
    const cost = safeNumber(econUpgradeCost(this.econLv), Infinity);
    if (!Number.isFinite(cost)) { this.energy = 0; return; }
    if (this.energy < cost) return;
    this.econLv++;
    this.setEnergy(this.energy - cost);
  }

  // ---------- การกระทำของผู้เล่น ----------
  trySpawnPlayer(key) {
    const def = UNITS[key];
    if (this.over || this.paused || !def || this.spawnCd[key] > 0) return;
    const cost = safeNumber(def.cost, Infinity);
    if (!Number.isFinite(cost) || cost < 0) return console.warn('[Unit cost ผิด]', key, def.cost);
    if (!Number.isFinite(this.energy)) { this.energy = 0; return; }
    if (this.energy < cost) return;
    this.setEnergy(this.energy - cost);
    this.spawnCd[key] = this.cdMax(key);
    const b = this.buttons.find(b => b.key === key);
    if (b) this.tweens.add({ targets: b.c, scale: 0.93, duration: 60, yoyo: true });
    this.spawn('player', key);
  }

  // เลื่อนเฟรมสำหรับฝั่งศัตรู (สไปรท์ชีตมีแถวที่ 2 เป็นสีศัตรู) คืน 0 ถ้าชีตนั้นไม่มีเฟรมของศัตรู
  enemyFrameOffset(key) {
    const s = UNITS[key].sprite;
    const tex = this.textures.exists('unit_' + key) ? this.textures.get('unit_' + key) : null;
    if (!s || !tex || !s.enemyOffset) return 0;
    return tex.frameTotal > s.enemyOffset + s.attack[1] ? s.enemyOffset : 0;
  }

  // ---------- สร้างยูนิต ----------
  spawn(team, key) {
    const def = UNITS[key];
    if (!def) return;
    // ทุกตัวเกิดจุดเดียวกัน หน้าฐาน (ห่างจากขอบฐาน SPAWN_OFFSET)
    const x = team === 'player' ? PLAYER_BASE_EDGE + SPAWN_OFFSET : ENEMY_BASE_EDGE - SPAWN_OFFSET;
    const hasSprite = !!def.sprite && this.textures.exists('unit_' + key);

    // บันทึกลงสมุดสะสม (เจอทั้งฝั่งเราและศัตรู) และสถิติการลงสนาม
    if (team === 'player') SAVE.stats.used[key] = safeNumber(SAVE.stats.used[key], 0) + 1;
    if (discoverUnit(key)) this.floatText(W / 2, 120, `✨ ค้นพบ ${def.name}! +${GEM_DISCOVER} ◆`, '#ffe066');

    let body, h, baseY, fOff = 0, ak = key;
    if (hasSprite) {
      fOff = team === 'enemy' ? this.enemyFrameOffset(key) : 0;
      ak = fOff ? 'e_' + key : key;   // ชื่ออนิเมชันที่ใช้
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
    const mult = team === 'player' ? statMult(this.lv(SAVE.levels[key], MAX_LEVEL)) : this.stage?.power ?? 1;   // ผู้เล่น: ตามเลเวล / ศัตรู: ตามความยากของด่าน
    const tag = this.t(x, barY - 9, ELEMENTS[def.element].icon + TYPES[def.type].icon, 10);

    this.units.push({
      team, key, def, hasSprite, mult, tag, fOff, ak, x, h, baseY, body, bar, barBg,
      rank: TYPES[def.type].rank,   // ตำแหน่งยืน: 0 หน้า / 1 กลาง / 2 หลัง
      skillCd: def.skill ? def.skill.cd * 0.5 : 0,
      maxHp: def.hp * mult, hp: def.hp * mult, dmg: def.dmg * mult,
      cd: 0, lunge: 0, phase: Math.random() * 6, moving: false, attacking: false,
    });
  }

  // ---------- AI ศัตรู ----------
  enemyAI(delta) {
    this.aiTimer -= delta;
    if (this.aiTimer > 0) return;
    const affordable = UNIT_KEYS.filter(k => UNITS[k].cost <= this.enemyEnergy);
    if (!affordable.length) { this.aiTimer = 300; return; }
    const key = Phaser.Utils.Array.GetRandom(affordable);
    this.enemyEnergy -= UNITS[key].cost;
    this.spawn('enemy', key);
    this.aiTimer = (1200 + Math.random() * 1800) * (this.stage?.aiDelay ?? 1);
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
      if (d >= -TARGET_OVERLAP) {   // ศัตรูที่อยู่ข้างหน้า หรือซ้อน/เหลื่อมอยู่ข้างหลังนิดเดียว
        const dd = Math.max(0, d);
        if (dd < best) { best = dd; target = o; }
      }
    }

    const enemyBase = this.bases[u.team === 'player' ? 'enemy' : 'player'];
    const baseDist = ((u.team === 'player' ? ENEMY_BASE_EDGE : PLAYER_BASE_EDGE) - u.x) * dir;
    let isBase = false;
    if (!target || baseDist < best) { target = enemyBase; best = baseDist; isBase = true; }

    if (best <= u.def.range) {
      // สายไหวพริบ: ใช้สกิลก่อนถ้าพร้อม ไม่งั้นตีธรรมดา
      if (u.def.skill && u.skillCd <= 0 && this.trySkill(u, target, isBase)) return;
      if (u.cd <= 0) this.attack(u, target, isBase);
      return;
    }

    if (u.def.skill && u.def.skill.kind === 'heal' && u.skillCd <= 0) this.trySkill(u, null, false);

    // เดินไปข้างหน้า ทะลุตัวอื่นได้ แต่ต้องรักษาแถว: ประเภทที่ rank สูงกว่าห้ามล้ำหน้าประเภทที่อยู่หน้ากว่า
    // (พลัง หน้าสุด -> ไหวพริบ ถอยหลังมา 1 แถว -> ว่องไว ถอยหลังมา 2 แถว) ประเภทเดียวกันซ้อนกันได้
    const step = dir * u.def.speed * dt;
    let newX = u.x + step;
    if (u.rank > 0) {
      let limit = null;
      for (const a of this.units) {
        if (a.team !== u.team || a.hp <= 0 || a.rank >= u.rank) continue;
        const l = a.x - dir * FORMATION_GAP * (u.rank - a.rank);
        if (limit === null || (l - limit) * dir < 0) limit = l;
      }
      if (limit !== null && (newX - limit) * dir > 0) {
        newX = (u.x - limit) * dir > 0 ? u.x + step : limit;   // ล้ำแถวอยู่แล้ว (เกิดจุดเดียวกัน) เดินปกติ / ไม่งั้นหยุดที่แถว
      }
    }
    if ((newX - u.x) * dir > 0.01) { u.x = newX; u.moving = true; }
  }

  // ---------- สกิล (คืนค่า true ถ้าใช้สำเร็จ) ----------
  trySkill(u, target, isBase) {
    const sk = u.def.skill, col = ELEMENTS[u.def.element].color;
    const allies = this.units.filter(a => a.team === u.team && a.hp > 0 && Math.abs(a.x - u.x) <= sk.radius);
    let ringX = u.x;

    if (sk.kind === 'heal') {
      const hurt = allies.filter(a => a.hp < a.maxHp);
      if (!hurt.length) return false;
      u.skillCd = sk.cd;
      u.cd = Math.max(u.cd, 400);
      for (const a of hurt) {
        a.hp = Math.min(a.maxHp, a.hp + sk.power * u.mult);
        this.floatText(a.x, a.baseY - a.h - 22, '+' + Math.round(sk.power * u.mult), '#7dff9b');
      }
    } else if (sk.kind === 'aoe') {
      if (!target) return false;
      u.skillCd = sk.cd;
      u.cd = u.def.cd;
      ringX = isBase ? target.rect.x : target.x;
      if (isBase) { target.hp -= this.dmgOf(u) * sk.power; this.onBaseHit(target); }
      for (const o of this.units) {
        if (o.team === u.team || o.hp <= 0 || Math.abs(o.x - ringX) > sk.radius) continue;
        o.hp -= this.dmgOf(u) * sk.power * elemMult(u.def.element, o.def.element);
        this.tweens.add({ targets: o.body, alpha: 0.4, duration: 60, yoyo: true });
      }
    } else if (sk.kind === 'buff') {
      if (!target || allies.length < 2) return false;   // ใช้เมื่อกำลังสู้ และมีเพื่อนอยู่ใกล้
      u.skillCd = sk.cd;
      u.cd = Math.max(u.cd, 400);
      for (const a of allies) {
        a.buffMult = sk.power;
        a.buffUntil = this.clock + sk.duration;
        this.floatText(a.x, a.baseY - a.h - 22, '⬆ ดาเมจ', '#ffd23f');
      }
    } else {
      return false;
    }

    this.ring(ringX, GROUND - 14, sk.radius, col);
    this.floatText(u.x, u.baseY - u.h - 34, sk.name, '#ffffff');
    return true;
  }

  // ดาเมจจริงของยูนิต (รวมบัฟที่ยังไม่หมดเวลา)
  dmgOf(u) { return u.dmg * ((u.buffUntil || 0) > this.clock ? u.buffMult : 1); }

  floatText(x, y, text, color) {
    const t = this.t(x, y, text, 13, color, { fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }).setDepth(5);
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

    if (u.hasSprite) {   // ท่าโจมตี
      u.attacking = true;
      u.body.play(u.ak + '-attack');
      u.body.once('animationcomplete', () => { u.attacking = false; });
    }
    this.tweens.add({ targets: u, lunge: 5, duration: 70, yoyo: true });   // พุ่งไปข้างหน้านิดหน่อย

    if (u.def.range > 60) {   // ตัวยิง: กระสุนพุ่งไปหาเป้า
      const shot = this.add.circle(u.x, u.baseY - u.h / 2, 4, 0xffffff);
      this.tweens.add({ targets: shot, x: isBase ? hitObj.x : target.x, duration: 150, onComplete: () => shot.destroy() });
    }
    this.tweens.add({ targets: hitObj, alpha: 0.4, duration: 60, yoyo: true });
    if (isBase) this.onBaseHit(target);
  }

  // ---------- วนลูปหลัก ----------
  update(time, delta) {
    if (this.over || this.paused) return;
    delta *= this.speed;   // x2 = เวลาในเกมเดินเร็วเป็นสองเท่า
    this.clock += delta;
    for (const k in this.spawnCd) this.spawnCd[k] = Math.max(0, this.spawnCd[k] - delta);
    const dt = Math.max(0, Math.min(delta / 1000, 0.1 * this.speed));

    const maxEnergy = Math.max(1, safeNumber(this.maxEnergy(), BASE_MAX_ENERGY));
    const regen = Math.max(0, safeNumber(this.regen(), BASE_REGEN));
    this.energy = Math.min(maxEnergy, Math.max(0, safeNumber(this.energy, 0) + regen * dt));
    this.enemyEnergy = Math.min(BASE_MAX_ENERGY, Math.max(0, safeNumber(this.enemyEnergy, BASE_MAX_ENERGY) + ENEMY_REGEN * (this.stage?.regen ?? 1) * dt));
    this.enemyAI(delta);

    for (const u of this.units) if (u.hp > 0) this.stepUnit(u, dt, delta);

    // วาดยูนิต / ลบตัวที่ตาย
    for (const u of this.units) {
      if (u.hp <= 0) {
        if (u.team === 'enemy') {
          this.kills++;
          SAVE.stats.defeated[u.key] = safeNumber(SAVE.stats.defeated[u.key], 0) + 1;
        }
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
      u.bar.width = 26 * Math.max(0, Math.min(1, u.hp / u.maxHp));

      if (u.hasSprite && !u.attacking) {
        if (u.moving) u.body.play(u.ak + '-walk', true);
        else { u.body.anims.stop(); u.body.setFrame(u.def.sprite.walk[0] + u.fOff); }
      }
    }
    this.units = this.units.filter(u => u.hp > 0);

    this.updateBaseVisual(this.bases.player);
    this.updateBaseVisual(this.bases.enemy);
    this.updateHud();

    if (this.bases.enemy.hp <= 0) this.endGame('ชนะแล้ว! 🎉', true);
    else if (this.bases.player.hp <= 0) this.endGame('แพ้แล้ว...', false);
  }

  updateHud() {
    const maxEnergy = Math.max(1, safeNumber(this.maxEnergy(), BASE_MAX_ENERGY));
    const energy = Math.max(0, Math.min(maxEnergy, safeNumber(this.energy, 0)));
    this.energy = energy;
    this.energyFill.width = 150 * (energy / maxEnergy);
    this.energyText.setText(`${Math.floor(energy)}/${maxEnergy}`);
    this.energyIcon.x = this.energyText.x - this.energyText.width - 20;

    for (const b of this.buttons) {
      const cd = this.spawnCd[b.key] || 0, frac = cd / this.cdMax(b.key);
      b.mask.setPosition(-b.w / 2 + 3, b.h / 2 - 3 - (b.h - 6) * frac).setSize(b.w - 6, (b.h - 6) * frac);
      b.cdText.setText(cd > 0 ? (cd / 1000).toFixed(1) : '');
      b.c.setAlpha(energy >= safeNumber(UNITS[b.key].cost, Infinity) ? 1 : 0.55);
    }

    const e = this.econBtn, max = this.econLv >= ECON_MAX_LEVEL, c = max ? 0 : safeNumber(econUpgradeCost(this.econLv), Infinity);
    e.lv.setText('Lv.' + this.econLv);
    e.cost.setText(max ? 'MAX' : String(c)).setX(max ? 0 : 14);
    e.icon.setVisible(!max);
    e.c.setAlpha(max ? 0.6 : energy >= c ? 1 : 0.55);

    for (const b of [this.bases.player, this.bases.enemy]) {
      b.bar.width = 80 * Math.max(0, Math.min(1, safeNumber(b.hp, 0) / Math.max(1, safeNumber(b.max, BASE_HP))));
    }
  }

  endGame(message, won) {
    this.over = true;
    this.setSpeed(1);
    const st = this.stage;
    const reward = st ? (won ? st.reward : st.lose) + this.kills * st.kill : (won ? REWARD_WIN : REWARD_LOSE) + this.kills * REWARD_PER_KILL;
    let xp = null;   // ผลเลเวลผู้เล่น (เฉพาะชนะในโหมดด่าน)
    if (st && won) {
      const first = this.stageNo > STAGE_PROGRESS[this.mode];
      markStageCleared(this.mode, this.stageNo);
      xp = addPlayerExp(Math.round(stageExp(this.mode, this.stageNo) * (first ? 1 : PLAYER_REPLAY_EXP)));
      SAVE.gems = safeNumber(SAVE.gems, 0) + xp.gems;
    }

    // แจกทองหลังจบรอบ (กันเงิน NaN) แล้วเซฟ
    SAVE.gold = safeNumber(SAVE.gold, 0) + Math.max(0, safeNumber(reward, 0));
    normalizeSave();
    if (typeof writeSave === 'function') writeSave();

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setInteractive();
    this.t(W / 2, H / 2 - 70, message, 48, '#fff', { fontStyle: 'bold' });
    this.add.circle(W / 2 - 150, H / 2 - 25, 10, 0xffd23f).setStrokeStyle(2, 0xb8860b);
    this.t(W / 2 - 134, H / 2 - 25, `ได้ทอง +${reward}  (ฆ่าศัตรู ${this.kills} ตัว)`, 22, '#ffe066', { fontStyle: 'bold' }).setOrigin(0, 0.5);

    if (xp) {
      this.t(W / 2, H / 2 + 5, `EXP +${xp.exp}   ·   เลเวลผู้เล่น ${PLAYER.level}`, 18, '#9be7ff', { fontStyle: 'bold' });
      if (xp.ups) this.t(W / 2, H / 2 + 31, `เลเวลอัป! ${'▲'.repeat(Math.min(xp.ups, 3))}  ได้เพชร +${xp.gems}`, 20, '#ffd23f', { fontStyle: 'bold', stroke: '#5a3a00', strokeThickness: 3 });
    }

    // ปุ่มหลังจบรอบ: เล่นใหม่ / เลือกด่าน / ด่านถัดไป (ชนะและยังมีด่านต่อ)
    const hasNext = st && won && this.stageNo < STAGE_COUNT;
    const go = [['เล่นใหม่', () => this.scene.restart({ mode: this.mode, stage: this.stageNo })],
                [st ? 'เลือกด่าน' : 'กลับลอบบี้', () => this.scene.start(st ? 'stage' : 'lobby', { mode: this.mode, stage: hasNext ? this.stageNo + 1 : this.stageNo })]];
    if (hasNext) go.push(['ด่านถัดไป ▶', () => this.scene.restart({ mode: this.mode, stage: this.stageNo + 1 }), '#2ecc71', '#ffffff']);
    go.forEach(([label, fn, bg = '#ffffff', color = '#1a1a1a'], i) => {
      this.t(W / 2 + (i - (go.length - 1) / 2) * 190, H / 2 + 80, label, 22, color, { backgroundColor: bg, padding: { x: 18, y: 8 }, fontStyle: 'bold' })
        .setInteractive({ useHandCursor: true }).on('pointerdown', () => { normalizeSave(); fn(); });
    });
  }
}