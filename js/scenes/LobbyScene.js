class LobbyScene extends Phaser.Scene {
  constructor() { super('lobby'); }

  create() {
    this.drawBackground();
    this.drawShowcase();
    this.drawTopBar();
    this.drawSideItems();
    this.drawStartButton();
    this.drawMenuBar();

    this.add.text(300, 338, '1-5 = เรียกยูนิต   ·   R = อัปเกรดเศรษฐกิจ', {
      fontFamily: FONT, fontSize: '13px', color: '#9fc4d6',
    }).setOrigin(0.5);

    this.add.text(300, 358, '🔥ไฟ > 🌿ไม้ > 💧น้ำ > 🔥ไฟ (ชนะทาง x1.5)  ·  หน้า🛡พลัง  กลาง✨ไหวพริบ  หลัง🏹ว่องไว', {
      fontFamily: FONT, fontSize: '12px', color: '#9fc4d6',
    }).setOrigin(0.5);

    this.toastText = this.add.text(W / 2, 100, '', {
      fontFamily: FONT, fontSize: '18px', color: '#fff', backgroundColor: '#000000bb', padding: { x: 14, y: 7 },
    }).setOrigin(0.5).setAlpha(0).setDepth(10);
  }

  // ---------- ฉากหลังกลางคืน ----------
  drawBackground() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x0d1a38);
    this.add.rectangle(W / 2, 170, W, 220, 0x16305a, 0.8);

    for (let i = 0; i < 45; i++) {
      const s = this.add.circle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, 210), Phaser.Math.Between(1, 2), 0xffffff, Phaser.Math.FloatBetween(0.4, 0.9));
      this.tweens.add({ targets: s, alpha: 0.15, duration: Phaser.Math.Between(800, 2200), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1500) });
    }
    this.add.circle(610, 95, 52, 0xfff3c4, 0.12);
    this.add.circle(610, 95, 30, 0xfff3c4, 0.9);

    // เนินเขา ต้นสน และพื้น
    this.add.ellipse(140, 290, 560, 150, 0x123a42);
    this.add.ellipse(620, 300, 640, 160, 0x0f2f38);
    [[30, 250], [75, 262], [735, 255], [775, 265]].forEach(([x, y]) => {
      this.add.triangle(x, y, 0, 70, 24, 0, 48, 70, 0x0a2429);
    });
    this.add.rectangle(W / 2, 360, W, 180, 0x1d4e5c);
    this.add.rectangle(W / 2, 270, W, 4, 0x2b6a7a);
  }

  // ---------- ตัวละคร 5 ช่อง พร้อมดาวและเลเวล ----------
  drawShowcase() {
    const xs = [190, 285, 380, 475, 570];
    const FEET = 248;

    for (let i = 0; i < 5; i++) {
      const x = xs[i];
      const key = SAVE.team[i];
      this.add.ellipse(x, FEET + 4, 70, 14, 0x000000, 0.3);

      if (key) {
        const def = UNITS[key];
        const lv = SAVE.levels[key];
        let obj;
        if (def.sprite && this.textures.exists('unit_' + key)) {
          obj = this.add.sprite(x, FEET, 'unit_' + key, def.sprite.walk[0]).setOrigin(0.5, 122 / 128).setScale((def.sprite.scale || 1) * 1.5);
        } else {
          const w = def.size * 2.4, h = def.size * 1.6 * 2.4;
          obj = this.add.rectangle(x, FEET - h / 2, w, h, def.color).setStrokeStyle(3, 0xffffff, 0.8);
        }
        obj.setInteractive({ useHandCursor: true });
        obj.on('pointerdown', () => this.scene.start('character', { sel: UNIT_KEYS.indexOf(key), from: 'lobby' }));
        this.tweens.add({ targets: obj, y: obj.y - 6, duration: 900 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        const stars = Math.min(5, Math.ceil(lv / 2));
        this.add.text(x, FEET + 30, '★'.repeat(stars) + '☆'.repeat(5 - stars), { fontFamily: FONT, fontSize: '15px', color: '#ffd23f' }).setOrigin(0.5);
        this.add.rectangle(x, FEET + 58, 80, 24, 0x153443).setStrokeStyle(2, 0x2c6a7c);
        this.add.text(x, FEET + 58, `Lv. ${lv}`, { fontFamily: FONT, fontSize: '15px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
      } else {
        // ช่องที่ยังว่าง (รอตัวละครใหม่)
        this.add.rectangle(x, FEET - 40, 40, 80, 0x0b2229, 0.55);
        this.add.text(x, FEET - 40, '?', { fontFamily: FONT, fontSize: '34px', color: '#4f8798', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.rectangle(x, FEET + 58, 80, 24, 0x153443, 0.6).setStrokeStyle(2, 0x2c6a7c, 0.6);
        this.add.text(x, FEET + 58, 'ว่าง', { fontFamily: FONT, fontSize: '14px', color: '#6f9aa8' }).setOrigin(0.5);
      }
    }
  }

  // ---------- แถบด้านบน: ระดับผู้เล่น + สกุลเงิน ----------
  drawTopBar() {
    // ป้ายระดับ (คำนวณจากผลรวมเลเวลตัวละคร)
    const playerLv = Math.max(1, UNIT_KEYS.reduce((s, k) => s + SAVE.levels[k], 0) - UNIT_KEYS.length + 1);
    this.add.rectangle(75, 38, 118, 46, 0x6b3f1d).setStrokeStyle(3, 0x3a2410);
    this.add.rectangle(104, 38, 40, 36, 0x20304f).setStrokeStyle(2, 0xd9a14a);
    this.add.text(104, 38, '👤', { fontSize: '20px' }).setOrigin(0.5);
    this.add.polygon(42, 40, [0, 0, 52, 0, 52, 40, 26, 58, 0, 40], 0xf2c230).setStrokeStyle(3, 0x8a5a10);
    this.add.text(42, 28, 'ระดับ', { fontFamily: FONT, fontSize: '11px', color: '#5a3a08', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(42, 46, String(playerLv), { fontFamily: FONT, fontSize: '24px', color: '#3a2410', fontStyle: 'bold' }).setOrigin(0.5);

    // สกุลเงิน: ทองใช้งานจริง ส่วนอื่นเป็นตัวอย่างไว้ก่อน
    this.makePill(506, String(SAVE.gems), 0xd7263d, '◆');
    this.makePill(622, Math.floor(SAVE.gold).toLocaleString('en-US'), 0xffb300, '$');
    this.makePill(738, '0', 0x2f6fe0, 'P');
  }

  makePill(cx, text, iconColor, iconText) {
    const y = 22, w = 106;
    this.add.rectangle(cx, y, w, 24, 0x101a30, 0.92).setStrokeStyle(2, 0x3a4a70);
    this.add.text(cx - 2, y, text, { fontFamily: FONT, fontSize: '15px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.circle(cx - w / 2 + 2, y, 13, iconColor).setStrokeStyle(2, 0xffffff, 0.7);
    this.add.text(cx - w / 2 + 2, y, iconText, { fontFamily: FONT, fontSize: '14px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    const plus = this.add.circle(cx + w / 2 - 2, y, 12, 0x4ab34a).setStrokeStyle(2, 0xffffff, 0.85).setInteractive({ useHandCursor: true });
    this.add.text(cx + w / 2 - 2, y - 1, '+', { fontFamily: FONT, fontSize: '18px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    plus.on('pointerdown', () => this.toast('ยังไม่เปิดให้ใช้งาน'));
  }

  // ---------- กล่องจดหมาย + กาชา (ขวา) ----------
  drawSideItems() {
    // กล่องจดหมาย
    const mailY = 100;
    this.add.rectangle(745, mailY + 6, 54, 34, 0xf2c230).setStrokeStyle(3, 0x8a5a10);
    this.add.ellipse(745, mailY - 12, 54, 24, 0xf7d34a).setStrokeStyle(3, 0x8a5a10);
    this.add.rectangle(745, mailY + 8, 22, 6, 0x8a5a10);
    const mail = this.add.rectangle(745, mailY, 64, 60, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    mail.on('pointerdown', () => this.toast('กล่องข้อความ ยังไม่เปิดให้ใช้งาน'));

    // กาชา
    const gy = 178;
    this.add.circle(745, gy, 34, 0xf3e3ee).setStrokeStyle(3, 0xffffff, 0.8);
    this.add.circle(745, gy + 8, 28, 0xe84a9a, 0.9);
    this.add.circle(735, gy - 14, 8, 0xffffff, 0.7);
    this.add.text(745, gy + 48, 'GACHA', { fontFamily: FONT, fontSize: '18px', color: '#ffd23f', fontStyle: 'bold', stroke: '#5a2a00', strokeThickness: 4 }).setOrigin(0.5);
    const gacha = this.add.circle(745, gy + 10, 46, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    gacha.on('pointerdown', () => this.scene.start('gacha'));
  }

  // ---------- ปุ่ม "เริ่ม" รูปโล่ + ปุ่ม PvP ----------
  drawStartButton() {
    const cx = 725, cy = 372;
    const outer = this.add.polygon(cx, cy, [0, 0, 100, 0, 100, 70, 50, 112, 0, 70], 0xd7263d).setStrokeStyle(5, 0xf2c230);
    const inner = this.add.polygon(cx, cy - 2, [0, 0, 80, 0, 80, 54, 40, 90, 0, 54], 0xb01c30);
    const label = this.add.text(cx, cy - 8, 'เริ่ม', { fontFamily: FONT, fontSize: '38px', color: '#ffd23f', fontStyle: 'bold', stroke: '#5a0d17', strokeThickness: 6 }).setOrigin(0.5);
    this.tweens.add({ targets: [outer, inner, label], scale: 1.06, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const hit = this.add.rectangle(cx, cy, 100, 112, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.scene.start('game'));

    // PvP (ยังไม่เปิด)
    const pvp = this.add.rectangle(610, 402, 84, 46, 0x6b3f1d, 0.6).setStrokeStyle(3, 0xd9a14a, 0.6).setInteractive({ useHandCursor: false });
    this.add.text(610, 396, '⚔ PvP', { fontFamily: FONT, fontSize: '16px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0.7);
    this.add.text(610, 414, 'เร็วๆ นี้', { fontFamily: FONT, fontSize: '11px', color: '#ffe0a3' }).setOrigin(0.5).setAlpha(0.7);
    pvp.on('pointerdown', () => this.toast('PvP ยังไม่เปิดให้เล่น'));
  }

  // ---------- แถบเมนูไม้ด้านล่างซ้าย ----------
  drawMenuBar() {
    const items = [
      { icon: '★', label: 'ทีม', go: 'team' },
      { icon: '▲', label: 'อัพเกรด', go: 'upgrade' },
      { icon: '☺', label: 'เพื่อน' },
      { icon: '▤', label: 'สะสม', go: 'collection' },
      { icon: '▣', label: 'สมบัติ' },
      { icon: '⚙', label: 'การตั้งค่า' },
    ];
    items.forEach((it, i) => {
      const x = 45 + i * 70, y = 402;
      const bg = this.add.rectangle(x, y, 64, 68, 0x7a4a24).setStrokeStyle(3, 0x3a2410).setInteractive({ useHandCursor: true });
      this.add.rectangle(x, y - 31, 56, 4, 0xb98245);   // ขอบไฮไลต์ด้านบน
      this.add.text(x, y - 10, it.icon, { fontFamily: FONT, fontSize: '26px', color: '#fff3d6' }).setOrigin(0.5);
      this.add.text(x, y + 22, it.label, { fontFamily: FONT, fontSize: '13px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
      bg.on('pointerover', () => bg.setFillStyle(0x93602f));
      bg.on('pointerout', () => bg.setFillStyle(0x7a4a24));
      bg.on('pointerdown', () => {
        if (it.go) this.scene.start(it.go);
        else this.toast(`${it.label} ยังไม่เปิดให้ใช้งาน`);
      });
    });
  }

  toast(message) {
    this.toastText.setText(message).setAlpha(1);
    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1200, duration: 500 });
  }
}
