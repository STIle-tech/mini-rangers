// ---------- หน้าทีม: แท่น 5 ช่องด้านบน + การ์ดตัวละครด้านล่าง ----------
class TeamScene extends Phaser.Scene {
  constructor() { super('team'); }

  create() {
    this.dragMoved = false;
    this.dragInList = false;

    // ผนังหินด้านบน + พื้นที่รายการตัวละครด้านล่าง
    this.add.rectangle(W / 2, H / 2, W, H, 0xd9c08a);
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 10; c++) {
        this.add.rectangle(c * 90 + (r % 2) * 45, 30 + r * 40, 86, 36, 0xe2cb98).setStrokeStyle(1, 0xb99a62, 0.6);
      }
    }
    this.add.rectangle(W / 2, 352, W, 196, 0x4a3320);

    // หัวข้อ + ปุ่มกลับ + ทอง
    const back = this.add.circle(32, 30, 20, 0xffd23f).setStrokeStyle(3, 0x8a5a10).setInteractive({ useHandCursor: true });
    this.add.text(32, 30, '◀', { fontFamily: FONT, fontSize: '20px', color: '#5a3a08', fontStyle: 'bold' }).setOrigin(0.5);
    back.on('pointerdown', () => this.scene.start('lobby'));
    this.add.text(64, 30, 'ทีม', { fontFamily: FONT, fontSize: '34px', color: '#ffd23f', fontStyle: 'bold', stroke: '#5a3a08', strokeThickness: 6 }).setOrigin(0, 0.5);
    this.countText = this.add.text(134, 32, '', { fontFamily: FONT, fontSize: '20px', color: '#fff', stroke: '#5a3a08', strokeThickness: 4 }).setOrigin(0, 0.5);

    this.add.rectangle(690, 26, 150, 26, 0x101a30, 0.92).setStrokeStyle(2, 0x3a4a70);
    this.add.circle(622, 26, 13, 0xffb300).setStrokeStyle(2, 0xffffff, 0.7);
    this.add.text(622, 26, '$', { fontFamily: FONT, fontSize: '14px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(698, 26, Math.floor(SAVE.gold).toLocaleString('en-US'), { fontFamily: FONT, fontSize: '16px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

    // แท่น 5 ช่อง
    this.slotX = [100, 250, 400, 550, 700];
    this.slotX.forEach((x) => {
      this.add.ellipse(x, 178, 118, 30, 0x8c7a58);
      this.add.rectangle(x, 164, 118, 28, 0xa8956c);
      this.add.ellipse(x, 150, 118, 30, 0xe0d2ae).setStrokeStyle(3, 0x8c7a58);
    });

    // แถบตัวกรอง (ตกแต่งไว้ก่อน)
    this.add.rectangle(W / 2, 236, W, 36, 0x6b4a2a).setStrokeStyle(2, 0x3a2410);
    this.add.text(14, 236, '♪ แตะการ์ดเพื่อเลือกเข้า/ออกทีม · แตะ (i) เพื่อดูและอัปเกรดตัวละคร', {
      fontFamily: FONT, fontSize: '13px', color: '#ffe0a3',
    }).setOrigin(0, 0.5);
    ['ระดับ ▾', 'ราคา ▾', 'ธาตุ ▾', 'ล่าสุด ▾'].forEach((label, i) => {
      const x = 522 + i * 82;
      const b = this.add.rectangle(x, 236, 76, 26, 0x2f6fb0).setStrokeStyle(2, 0xffffff, 0.85).setInteractive({ useHandCursor: true });
      this.add.text(x, 236, label, { fontFamily: FONT, fontSize: '13px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
      b.on('pointerdown', () => this.toast('ตัวกรองยังไม่เปิดให้ใช้งาน'));
    });

    this.slotLayer = this.add.container(0, 0);
    this.listLayer = this.add.container(0, 0);

    this.toastText = this.add.text(W / 2, 62, '', {
      fontFamily: FONT, fontSize: '17px', color: '#fff', backgroundColor: '#000000cc', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    // ลากซ้าย-ขวาเพื่อเลื่อนรายการการ์ด (ใช้เมื่อมีตัวละครเยอะจนล้นจอ)
    this.minX = Math.min(0, W - (20 + UNIT_KEYS.length * 160));
    this.input.on('pointerdown', (p) => {
      this.dragStartX = p.x;
      this.listStartX = this.listLayer.x;
      this.dragMoved = false;
      this.dragInList = p.y >= 258;
    });
    this.input.on('pointermove', (p) => {
      if (!p.isDown || !this.dragInList || this.minX >= 0) return;
      const dx = p.x - this.dragStartX;
      if (Math.abs(dx) > 8) this.dragMoved = true;
      if (this.dragMoved) this.listLayer.x = Phaser.Math.Clamp(this.listStartX + dx, this.minX, 0);
    });

    this.refresh();
  }

  refresh() {
    this.countText.setText(`${SAVE.team.length}/${TEAM_SIZE}`);
    this.buildSlots();
    this.buildCards();
  }

  starText(lv) {
    const n = Math.min(5, Math.ceil(lv / 2));
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  diamond(x, y) {
    return this.add.polygon(x, y, [0, 9, 9, 0, 18, 9, 9, 18], 0x3aa7ff).setStrokeStyle(2, 0xffffff, 0.9);
  }

  makePortrait(x, feetY, key, targetH) {
    const def = UNITS[key];
    if (def.sprite && this.textures.exists('unit_' + key)) {
      return this.add.sprite(x, feetY, 'unit_' + key, def.sprite.walk[0]).setOrigin(0.5, 122 / 128).setScale(targetH / def.sprite.frameHeight);
    }
    const f = targetH / 48;
    const w = def.size * f, h = def.size * 1.6 * f;
    return this.add.rectangle(x, feetY - h / 2, w, h, def.color).setStrokeStyle(2, 0x0b3d91);
  }

  // ---------- แท่นด้านบน ----------
  buildSlots() {
    this.slotLayer.removeAll(true);
    for (let i = 0; i < TEAM_SIZE; i++) {
      const x = this.slotX[i];
      const key = SAVE.team[i];
      const hit = this.add.rectangle(x, 120, 118, 130, 0xffffff, 0.001).setInteractive({ useHandCursor: !!key });
      const items = [hit];

      if (key) {
        const def = UNITS[key];
        const portrait = this.makePortrait(x, 146, key, 80);
        const stars = this.add.text(x, 164, this.starText(SAVE.levels[key]), { fontFamily: FONT, fontSize: '13px', color: '#ffd23f', stroke: '#5a3a08', strokeThickness: 3 }).setOrigin(0.5);
        const dia = this.diamond(x - 22, 202);
        const cost = this.add.text(x - 8, 202, String(def.cost), { fontFamily: FONT, fontSize: '20px', color: '#3a2410', fontStyle: 'bold' }).setOrigin(0, 0.5);
        const tagS = this.add.text(x + 40, 104, ELEMENTS[def.element].icon + TYPES[def.type].icon, { fontFamily: FONT, fontSize: '16px' }).setOrigin(0.5);
        items.push(portrait, stars, dia, cost, tagS);
        hit.on('pointerdown', () => this.removeFromTeam(key));
      } else {
        const plus = this.add.text(x, 112, '+', { fontFamily: FONT, fontSize: '48px', color: '#b99a62', fontStyle: 'bold' }).setOrigin(0.5);
        const empty = this.add.text(x, 202, 'ว่าง', { fontFamily: FONT, fontSize: '16px', color: '#8c7a58' }).setOrigin(0.5);
        items.push(plus, empty);
        hit.on('pointerdown', () => this.toast('เลือกตัวละครจากการ์ดด้านล่างเพื่อเพิ่มเข้าทีม'));
      }
      this.slotLayer.add(items);
    }
  }

  // ---------- การ์ดตัวละครด้านล่าง ----------
  buildCards() {
    this.listLayer.removeAll(true);
    const top = 264;
    UNIT_KEYS.forEach((key, i) => {
      const def = UNITS[key];
      const lv = SAVE.levels[key];
      const inTeam = SAVE.team.includes(key);
      const cx = 95 + i * 160;

      const bg = this.add.rectangle(cx, top + 82, 150, 164, 0xffd23f).setStrokeStyle(4, inTeam ? 0x2e9e4f : 0xb88a00).setInteractive({ useHandCursor: true });
      const inner = this.add.rectangle(cx, top + 82, 138, 152, 0xfff0a8);
      const stars = this.add.text(cx, top + 16, this.starText(lv), { fontFamily: FONT, fontSize: '17px', color: '#e39b00' }).setOrigin(0.5);
      const portrait = this.makePortrait(cx - 38, top + 112, key, 66);
      const name = this.add.text(cx + 30, top + 54, def.name, { fontFamily: FONT, fontSize: '18px', color: '#3a2410', fontStyle: 'bold' }).setOrigin(0.5);
      const lvText = this.add.text(cx + 30, top + 78, `LV ${lv}/${MAX_LEVEL}`, { fontFamily: FONT, fontSize: '14px', color: '#5a3a08', fontStyle: 'bold' }).setOrigin(0.5);
      const dia = this.diamond(cx + 14, top + 103);
      const cost = this.add.text(cx + 28, top + 103, String(def.cost), { fontFamily: FONT, fontSize: '18px', color: '#3a2410', fontStyle: 'bold' }).setOrigin(0, 0.5);
      const strip = this.add.rectangle(cx, top + 148, 138, 24, inTeam ? 0x2e9e4f : 0xc9a24a);
      const stripText = this.add.text(cx, top + 148, inTeam ? '✓ อยู่ในทีม' : 'แตะเพื่อเลือก', { fontFamily: FONT, fontSize: '13px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
      const infoBg = this.add.circle(cx + 60, top + 15, 11, 0x7a4a24).setStrokeStyle(2, 0xffffff, 0.9).setInteractive({ useHandCursor: true });
      const infoText = this.add.text(cx + 60, top + 15, 'i', { fontFamily: FONT, fontSize: '14px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

      const tag = this.add.text(cx + 30, top + 124, `${ELEMENTS[def.element].icon} ${TYPES[def.type].icon} ${TYPES[def.type].name}`, { fontFamily: FONT, fontSize: '12px', color: '#5a3a08', fontStyle: 'bold' }).setOrigin(0.5);
      bg.on('pointerup', () => { if (!this.dragMoved) this.toggleTeam(key); });
      infoBg.on('pointerup', () => { if (!this.dragMoved) this.scene.start('character', { sel: i, from: 'team' }); });

      this.listLayer.add([bg, inner, stars, portrait, name, lvText, dia, cost, tag, strip, stripText, infoBg, infoText]);
    });
  }

  toggleTeam(key) {
    if (SAVE.team.includes(key)) { this.removeFromTeam(key); return; }
    if (SAVE.team.length >= TEAM_SIZE) { this.toast(`ทีมเต็มแล้ว (${TEAM_SIZE} ตัว) แตะตัวละครบนแท่นเพื่อเอาออกก่อน`); return; }
    SAVE.team.push(key);
    writeSave();
    this.refresh();
  }

  removeFromTeam(key) {
    if (SAVE.team.length <= 1) { this.toast('ต้องมีตัวละครในทีมอย่างน้อย 1 ตัว'); return; }
    SAVE.team = SAVE.team.filter(k => k !== key);
    writeSave();
    this.refresh();
  }

  toast(message) {
    this.toastText.setText(message).setAlpha(1);
    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1400, duration: 500 });
  }
}
