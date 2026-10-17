// ---------- หน้าอัปเกรดตัวละคร (สไตล์ Line Rangers) เปิดจากลอบบี้หรือหน้าทีม ----------
class CharacterScene extends Phaser.Scene {
  constructor() { super('character'); }

  create(data) {
    this.from = data?.from || 'lobby';                          // กดกลับแล้วไปหน้าที่เปิดมา
    this.sel = Number.isInteger(data?.sel) ? data.sel : 0;      // เปิดที่ตัวละครตัวไหน
    this.preview = null;

    // พื้นหลัง: ผนังอิฐทราย + แถบล่างสีน้ำตาลเข้ม
    this.add.rectangle(W / 2, H / 2, W, H, 0xe3cb98);
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 10; c++) this.add.rectangle(c * 90 + (r % 2) * 45, 14 + r * 36, 86, 32, 0xead6a8).setStrokeStyle(1, 0xc7a96d, 0.7);
    }
    this.add.rectangle(W / 2, 412, W, 76, 0x4a3320);

    // แถบบน: ปุ่มกลับ ชื่อหน้า เพชร/ทอง + ข้อความแนะนำ
    this.click(this.add.circle(30, 28, 19, 0xffd23f).setStrokeStyle(3, 0x1a1a1a), () => this.scene.start(this.from));
    this.t(30, 28, '◀', 18, '#1a1a1a');
    this.t(58, 28, 'อัปเกรดตัวละคร', 30, '#4cc2ff', { stroke: '#0b3d91', strokeThickness: 7 }).setOrigin(0, 0.5);
    this.gemText = this.pill(W - 240, 'gem');
    this.goldText = this.pill(W - 115, 'gold');
    this.add.rectangle(W / 2, 66, W, 22, 0x000000, 0.45);
    this.t(W / 2, 66, 'เลือกตัวละครด้านล่าง แล้วกด LEVEL UP เพื่อเพิ่มเลเวลให้สูงขึ้น', 13, '#ffe9b0', { fontStyle: 'normal' });

    // แท่นตัวละคร (ซ้าย)
    this.add.graphics()
      .fillStyle(0x000000, 0.22).fillEllipse(160, 350, 200, 34)
      .fillStyle(0x6b4a2a).fillRect(76, 312, 168, 30).fillEllipse(160, 342, 168, 44)
      .fillStyle(0xd9c79a).fillEllipse(160, 312, 190, 52)
      .fillStyle(0xefe3c4).fillEllipse(160, 311, 166, 40)
      .fillStyle(0x3a2410).fillRoundedRect(92, 318, 136, 24, 8).fillStyle(0x8a5028).fillRoundedRect(94, 320, 132, 20, 7);
    this.nameTag = this.t(160, 330, '', 15, '#fff');
    this.starText = this.t(160, 104, '', 20, '#ffd23f', { stroke: '#5a3a08', strokeThickness: 4 });

    // แผงไม้ผลลัพธ์ (ขวา)
    this.add.graphics()
      .fillStyle(0x000000, 0.25).fillRoundedRect(352, 96, 424, 280, 14)
      .fillStyle(0x3a2410).fillRoundedRect(350, 92, 424, 280, 14)
      .fillStyle(0x8a5a2e).fillRoundedRect(354, 96, 416, 272, 11)
      .fillStyle(0x5a3a1c).fillRoundedRect(512, 84, 100, 26, 9)
      .fillStyle(0xe8cf9a).fillRoundedRect(366, 118, 392, 172, 9)
      .lineStyle(2, 0xb88a4a).strokeRoundedRect(366, 118, 392, 172, 9);
    this.t(562, 97, 'ผลลัพธ์', 15, '#ffe9b0');
    this.nameText = this.t(562, 136, '', 22, '#5a3a08');
    this.typeText = this.t(562, 159, '', 14, '#7a5a2a');
    this.lvText = this.t(562, 190, '', 25, '#fff', { stroke: '#5a3a08', strokeThickness: 6 });
    this.hpText = this.t(562, 220, '', 18, '#9a2323');
    this.dmgText = this.t(562, 243, '', 18, '#8a5208');
    this.skillText = this.t(562, 268, '', 12, '#2f6b3a', { fontStyle: 'normal', align: 'center', wordWrap: { width: 370 } });
    this.t(562, 358, `ได้ทองจากการเล่นจบรอบ: ชนะ +${REWARD_WIN} · แพ้ +${REWARD_LOSE} · ฆ่าศัตรูตัวละ +${REWARD_PER_KILL}`, 11, '#ffe9b0', { fontStyle: 'normal' });

    // ปุ่ม LEVEL UP สีเขียว (กดค้างเพื่ออัปต่อเนื่อง)
    this.upBtn = this.add.container(562, 322, [
      this.add.graphics()
        .fillStyle(0x000000, 0.3).fillRoundedRect(-130, -26, 260, 60, 14)
        .fillStyle(0x0d5c2e).fillRoundedRect(-130, -30, 260, 60, 14)
        .fillStyle(0x2ecc71).fillRoundedRect(-127, -27, 254, 54, 12)
        .fillStyle(0xffffff, 0.2).fillRoundedRect(-127, -27, 254, 22, { tl: 12, tr: 12, bl: 0, br: 0 }),
      this.coin = this.add.circle(-22, -17, 8, 0xffd23f).setStrokeStyle(2, 0xb8860b),
      this.costText = this.t(-8, -17, '', 16, '#fff', { stroke: '#0d5c2e', strokeThickness: 3 }).setOrigin(0, 0.5),
      this.upLabel = this.t(0, 6, 'LEVEL UP', 26, '#fff', { stroke: '#0d5c2e', strokeThickness: 5 }),
      this.add.rectangle(0, 0, 260, 60, 0xffffff, 0.001),
    ]);
    const stop = () => { this.hold?.remove(); this.hold = null; };
    this.upBtn.list[4].setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        if (!this.levelUp()) return;
        this.hold = this.time.delayedCall(400, () => {
          this.hold = this.time.addEvent({ delay: 130, loop: true, callback: () => this.levelUp() || stop() });
        });
      }).on('pointerup', stop).on('pointerout', stop);

    // แถบเลือกตัวละคร (ล่าง)
    const n = UNIT_KEYS.length, cw = Math.min(96, (W - 16) / n);
    this.tabs = UNIT_KEYS.map((key, i) => {
      const x = W / 2 + (i - (n - 1) / 2) * cw, def = UNITS[key];
      const bg = this.add.rectangle(x, 412, cw - 6, 66, 0x2a1f14).setStrokeStyle(3, 0x8a6a3a);
      this.click(bg, () => { this.sel = i; this.refresh(); });
      this.t(x - cw / 2 + 12, 386, ELEMENTS[def.element].icon + TYPES[def.type].icon, 11, '#fff', { fontStyle: 'normal' }).setOrigin(0, 0.5);
      unitPortrait(this, x, 420, key, 38);
      return { bg, lv: this.t(x, 436, '', 12, '#ffe9b0') };
    });

    // คีย์ลัด: ← → เลือกตัวละคร, Esc กลับ
    const kb = this.input.keyboard;
    kb.on('keydown-LEFT', () => { this.sel = (this.sel + n - 1) % n; this.refresh(); });
    kb.on('keydown-RIGHT', () => { this.sel = (this.sel + 1) % n; this.refresh(); });
    kb.on('keydown-ESC', () => this.scene.start(this.from));

    this.refresh();
  }

  // ---------- ตัวช่วย ----------
  t(x, y, s, size, color = '#fff', style = {}) {
    return this.add.text(x, y, s, { fontFamily: FONT, fontSize: size + 'px', color, fontStyle: 'bold', ...style }).setOrigin(0.5);
  }

  click(obj, fn) { return obj.setInteractive({ useHandCursor: true }).on('pointerdown', fn); }

  // ป้ายสกุลเงินขวาบน คืน text ตัวเลขไว้อัปเดต
  pill(cx, type) {
    this.add.rectangle(cx, 22, 106, 26, 0x101a30, 0.92).setStrokeStyle(2, 0x3a4a70);
    if (type === 'gem') {
      const P = [{ x: -10, y: -4 }, { x: -5, y: -11 }, { x: 5, y: -11 }, { x: 10, y: -4 }, { x: 0, y: 12 }];
      this.add.graphics({ x: cx - 36, y: 22 }).setScale(0.9).fillStyle(0xff4d6d).fillPoints(P, true).lineStyle(2, 0xffffff, 0.9).strokePoints(P, true);
    } else {
      this.add.circle(cx - 36, 22, 10, 0xffb300).setStrokeStyle(2, 0xfff2a0);
    }
    return this.t(cx - 2, 22, '', 14, type === 'gold' ? '#ffe066' : '#fff');
  }

  // ---------- แสดงผล ----------
  refresh() {
    const key = UNIT_KEYS[this.sel], def = UNITS[key];
    const lv = SAVE.levels[key] || 1, maxed = lv >= MAX_LEVEL;
    const grade = Math.max(1, Math.min(5, (typeof gradeOf === 'function' ? gradeOf(key) : 1) | 0));

    this.goldText.setText(Math.floor(SAVE.gold).toLocaleString('en-US'));
    this.gemText.setText(String(SAVE.gems || 0));
    UNIT_KEYS.forEach((k, i) => {
      this.tabs[i].bg.setStrokeStyle(3, i === this.sel ? 0xffd23f : 0x8a6a3a).setFillStyle(i === this.sel ? 0x6a2fa8 : 0x2a1f14);
      this.tabs[i].lv.setText(`Lv ${SAVE.levels[k] || 1}`);
    });

    // สถิติปัจจุบัน → เลเวลถัดไป (พร้อมส่วนที่เพิ่ม)
    const stat = (base, name) => {
      const cur = Math.round(base * statMult(lv)), nxt = Math.round(base * statMult(lv + 1));
      return maxed ? `${name} ${cur}` : `${name} ${cur}  ▶  ${nxt}  (+${nxt - cur})`;
    };
    const T = TYPES[def.type], E = ELEMENTS[def.element];
    this.nameTag.setText(def.name);
    this.starText.setText('★'.repeat(grade));
    this.nameText.setText(def.name);
    this.typeText.setText(`${T.icon} ${T.name}   ${E.icon} ธาตุ${E.name}`);
    this.lvText.setText(maxed ? `LEVEL ${lv}  (MAX)` : `LEVEL ${lv}  ▶  LEVEL ${lv + 1}`);
    this.hpText.setText(stat(def.hp, 'เลือด'));
    this.dmgText.setText(stat(def.dmg, 'ดาเมจ'));
    this.skillText.setText(def.skill ? `สกิล ${def.skill.name}: ${def.skill.desc}` : T.desc);

    const cost = maxed ? 0 : unitUpgradeCost(lv);
    this.upLabel.setText(maxed ? 'MAX LEVEL' : 'LEVEL UP').setY(maxed ? 0 : 6);
    this.coin.setVisible(!maxed);
    this.costText.setVisible(!maxed).setText(String(cost));
    this.upBtn.setAlpha(maxed ? 0.4 : SAVE.gold >= cost ? 1 : 0.5);

    // ภาพตัวละครบนแท่น (เด้งเข้ามาตอนเปลี่ยนตัว/อัปเลเวล)
    if (this.preview) { this.tweens.killTweensOf(this.preview); this.preview.destroy(); }
    this.preview = unitPortrait(this, 160, 310, key, 150);
    const s = this.preview.scale;
    this.preview.setScale(s * 0.88);
    this.tweens.add({ targets: this.preview, scale: s, duration: 160, ease: 'Back.easeOut' });
  }

  // คืน true ถ้าอัปสำเร็จ
  levelUp() {
    const key = UNIT_KEYS[this.sel], lv = SAVE.levels[key] || 1;
    if (lv >= MAX_LEVEL) return false;
    const cost = unitUpgradeCost(lv);
    if (SAVE.gold < cost) {
      this.tweens.add({ targets: this.goldText, alpha: 0.2, duration: 80, yoyo: true, repeat: 2 });   // ทองไม่พอ
      return false;
    }
    SAVE.gold -= cost;
    SAVE.levels[key] = lv + 1;
    const gems = GEM_LEVELUP + (GEM_LEVELUP_BONUS[lv + 1] || 0);   // อัปเลเวลได้เพชร
    SAVE.gems = (SAVE.gems || 0) + gems;
    writeSave();
    this.refresh();
    popText(this, 160, 150, `+${gems} ◆`);
    const glow = this.add.ellipse(160, 311, 120, 30, 0xffd23f, 0.6);   // วงแสงบนแท่น
    this.tweens.add({ targets: glow, scale: 2, alpha: 0, duration: 400, onComplete: () => glow.destroy() });
    return true;
  }
}