// ---------- หน้ารายละเอียด/อัปเกรดเลเวลตัวละคร (เปิดจากลอบบี้หรือหน้าทีม) ----------
class CharacterScene extends Phaser.Scene {
  constructor() { super('character'); }

  create(data) {
    this.from = (data && data.from) || 'lobby';                       // กดกลับแล้วไปหน้าที่เปิดมา
    this.sel = (data && Number.isInteger(data.sel)) ? data.sel : 0;   // เปิดที่ตัวละครตัวไหน
    this.preview = null;

    this.add.rectangle(W / 2, H / 2, W, H, 0x1f2a44);
    this.add.rectangle(W / 2, 36, W, 72, 0x15203a);
    this.add.text(W / 2, 36, 'อัปเกรดตัวละคร', { fontFamily: FONT, fontSize: '28px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

    const back = this.add.text(16, 36, '◀ กลับ', {
      fontFamily: FONT, fontSize: '18px', color: '#fff', backgroundColor: '#00000066', padding: { x: 10, y: 6 },
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start(this.from));

    this.add.circle(W - 130, 36, 10, 0xffd23f).setStrokeStyle(2, 0xb8860b);
    this.goldText = this.add.text(W - 114, 36, '', { fontFamily: FONT, fontSize: '22px', color: '#ffe066', fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.gemText = gemBadge(this, W - 262, 36);

    // แท็บเลือกตัวละคร (ซ้าย)
    // จัดเป็นตาราง: แถว = ประเภท (พลัง/ไหวพริบ/ว่องไว), คอลัมน์ = ตัวละครในประเภทนั้น
    const rows = Object.keys(TYPES).sort((p, q) => TYPES[p].rank - TYPES[q].rank);
    const inRow = {};
    rows.forEach(t => { inRow[t] = UNIT_KEYS.filter(k => UNITS[k].type === t); });
    const cw = Math.min(78, 236 / Math.max(1, ...rows.map(t => inRow[t].length)));
    this.tabs = [];
    rows.forEach((t, r) => {
      inRow[t].forEach((key, c) => {
        const idx = UNIT_KEYS.indexOf(key);
        const x = 8 + cw / 2 + c * cw, y = 130 + r * 106;
        const bg = this.add.rectangle(x, y, cw - 4, 98, 0x2b3a5e).setStrokeStyle(3, 0x5b7bbd).setInteractive({ useHandCursor: true });
        this.add.text(x, y - 38, ELEMENTS[UNITS[key].element].icon + TYPES[UNITS[key].type].icon, { fontFamily: FONT, fontSize: '13px' }).setOrigin(0.5);
        this.add.rectangle(x, y - 10, 24, 34, UNITS[key].color).setStrokeStyle(2, 0xffffff, 0.8);
        this.add.text(x, y + 16, UNITS[key].name, { fontFamily: FONT, fontSize: '14px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
        const lv = this.add.text(x, y + 36, '', { fontFamily: FONT, fontSize: '13px', color: '#bcd0ff' }).setOrigin(0.5);
        bg.on('pointerdown', () => { this.sel = idx; this.refresh(); });
        this.tabs[idx] = { bg, lv };
      });
    });

    // แผงแสดงตัวละคร + สถิติ (ขวา)
    this.add.rectangle(515, 240, 530, 320, 0x2a1f14).setStrokeStyle(4, 0x8a6a3a);
    this.add.ellipse(400, 326, 160, 28, 0x7a5a2a);
    this.nameText = this.add.text(640, 118, '', { fontFamily: FONT, fontSize: '28px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    this.lvText = this.add.text(640, 162, '', { fontFamily: FONT, fontSize: '22px', color: '#ffd23f', fontStyle: 'bold' }).setOrigin(0.5);
    this.hpText = this.add.text(640, 208, '', { fontFamily: FONT, fontSize: '20px', color: '#ffb3b3' }).setOrigin(0.5);
    this.dmgText = this.add.text(640, 240, '', { fontFamily: FONT, fontSize: '20px', color: '#ffe0a3' }).setOrigin(0.5);
    this.typeText = this.add.text(640, 187, '', { fontFamily: FONT, fontSize: '17px', color: '#bfe3ff', fontStyle: 'bold' }).setOrigin(0.5);
    this.skillText = this.add.text(640, 268, '', { fontFamily: FONT, fontSize: '14px', color: '#9fe6b0', align: 'center', wordWrap: { width: 270 } }).setOrigin(0.5);

    // ปุ่ม LEVEL UP
    this.upBg = this.add.rectangle(640, 322, 230, 70, 0x2ecc71).setStrokeStyle(3, 0xffffff, 0.9).setInteractive({ useHandCursor: true });
    this.upLabel = this.add.text(640, 308, 'LEVEL UP', { fontFamily: FONT, fontSize: '26px', color: '#fff', fontStyle: 'bold', stroke: '#0d5c2e', strokeThickness: 4 }).setOrigin(0.5);
    this.coin = this.add.circle(596, 338, 9, 0xffd23f).setStrokeStyle(2, 0xb8860b);
    this.costText = this.add.text(610, 338, '', { fontFamily: FONT, fontSize: '20px', color: '#fff', fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.upBg.on('pointerdown', () => this.levelUp());

    this.add.text(W / 2, 424, `ได้ทองจากการเล่นจบรอบ: ชนะ +${REWARD_WIN}, แพ้ +${REWARD_LOSE}, ฆ่าศัตรูตัวละ +${REWARD_PER_KILL}`, {
      fontFamily: FONT, fontSize: '15px', color: '#9fb2d9',
    }).setOrigin(0.5);

    this.refresh();
  }

  refresh() {
    const key = UNIT_KEYS[this.sel];
    const def = UNITS[key];
    const lv = SAVE.levels[key];
    const maxed = lv >= MAX_LEVEL;

    this.goldText.setText(String(Math.floor(SAVE.gold)));
    this.gemText.setText(String(SAVE.gems));
    UNIT_KEYS.forEach((k, i) => {
      this.tabs[i].bg.setStrokeStyle(3, i === this.sel ? 0xffd23f : 0x5b7bbd);
      this.tabs[i].lv.setText(`Lv ${SAVE.levels[k]}`);
    });

    const curHp = Math.round(def.hp * statMult(lv)), curDmg = Math.round(def.dmg * statMult(lv));
    const nxtHp = Math.round(def.hp * statMult(lv + 1)), nxtDmg = Math.round(def.dmg * statMult(lv + 1));
    this.nameText.setText(def.name);
    this.lvText.setText(maxed ? `Lv ${lv} (สูงสุด)` : `Lv ${lv}  →  Lv ${lv + 1}`);
    this.hpText.setText(maxed ? `เลือด ${curHp}` : `เลือด ${curHp} → ${nxtHp}`);
    this.dmgText.setText(maxed ? `ดาเมจ ${curDmg}` : `ดาเมจ ${curDmg} → ${nxtDmg}`);
    const T = TYPES[def.type], E = ELEMENTS[def.element];
    this.typeText.setText(`${T.icon} ${T.name}   ${E.icon} ธาตุ${E.name}`);
    this.skillText.setText(def.skill ? `สกิล ${def.skill.name}: ${def.skill.desc}` : T.desc);

    if (maxed) {
      this.upLabel.setText('MAX LEVEL').setY(322);
      this.coin.setVisible(false);
      this.costText.setVisible(false);
      this.upBg.setAlpha(0.4);
    } else {
      const cost = unitUpgradeCost(lv);
      this.upLabel.setText('LEVEL UP').setY(308);
      this.coin.setVisible(true);
      this.costText.setVisible(true).setText(String(cost));
      this.upBg.setAlpha(SAVE.gold >= cost ? 1 : 0.45);
    }

    // ภาพตัวอย่างตัวละคร
    if (this.preview) this.preview.destroy();
    if (def.sprite && this.textures.exists('unit_' + key)) {
      this.preview = this.add.sprite(400, 322, 'unit_' + key, def.sprite.walk[0]).setOrigin(0.5, 122 / 128).setScale((def.sprite.scale || 1) * 2);
    } else {
      const w = def.size * 3, h = def.size * 1.6 * 3;
      this.preview = this.add.rectangle(400, 322 - h / 2, w, h, def.color).setStrokeStyle(3, 0x0b3d91);
    }
  }

  levelUp() {
    const key = UNIT_KEYS[this.sel];
    const lv = SAVE.levels[key];
    if (lv >= MAX_LEVEL) return;
    const cost = unitUpgradeCost(lv);
    if (SAVE.gold < cost) {
      this.tweens.add({ targets: this.goldText, alpha: 0.2, duration: 80, yoyo: true, repeat: 2 });   // ทองไม่พอ
      return;
    }
    SAVE.gold -= cost;
    SAVE.levels[key] = lv + 1;
    const gems = GEM_LEVELUP + (GEM_LEVELUP_BONUS[lv + 1] || 0);   // อัปเลเวลได้เพชร
    SAVE.gems += gems;
    writeSave();
    this.refresh();
    popText(this, 640, 280, `+${gems} ◆`);
    this.tweens.add({ targets: this.preview, scaleX: this.preview.scaleX * 1.12, scaleY: this.preview.scaleY * 1.12, duration: 120, yoyo: true });
  }
}