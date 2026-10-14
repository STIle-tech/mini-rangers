// ---------- หน้าอัปเกรดก่อนไปสู้: เลือดฐาน / พลังงานเริ่มต้น / ความเร็วฟื้นพลังงาน ----------
class UpgradeScene extends Phaser.Scene {
  constructor() { super('upgrade'); }

  create() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x1f2a44);
    this.add.rectangle(W / 2, 36, W, 72, 0x15203a);
    this.add.text(W / 2, 36, 'อัปเกรด', { fontFamily: FONT, fontSize: '28px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

    const back = this.add.text(16, 36, '◀ กลับ', {
      fontFamily: FONT, fontSize: '18px', color: '#fff', backgroundColor: '#00000066', padding: { x: 10, y: 6 },
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('lobby'));

    this.add.circle(W - 130, 36, 10, 0xffd23f).setStrokeStyle(2, 0xb8860b);
    this.goldText = this.add.text(W - 114, 36, '', { fontFamily: FONT, fontSize: '22px', color: '#ffe066', fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.gemText = gemBadge(this, W - 262, 36);

    this.cards = UP_KEYS.map((k, i) => this.makeCard(k, 140 + i * 260));

    this.add.text(W / 2, 424, `ได้ทองจากการเล่นจบรอบ: ชนะ +${REWARD_WIN}, แพ้ +${REWARD_LOSE}, ฆ่าศัตรูตัวละ +${REWARD_PER_KILL}`, {
      fontFamily: FONT, fontSize: '15px', color: '#9fb2d9',
    }).setOrigin(0.5);

    this.refresh();
  }

  makeCard(k, cx) {
    const def = BASE_UPGRADES[k];
    const cy = 238;
    this.add.rectangle(cx, cy, 230, 290, 0x2a1f14).setStrokeStyle(4, 0x8a6a3a);
    this.add.circle(cx, cy - 100, 34, 0x3a2c1c).setStrokeStyle(3, 0xffd23f);
    const icon = this.add.text(cx, cy - 100, def.icon, { fontFamily: FONT, fontSize: '34px' }).setOrigin(0.5);
    this.add.text(cx, cy - 50, def.name, { fontFamily: FONT, fontSize: '20px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    const lvText = this.add.text(cx, cy - 24, '', { fontFamily: FONT, fontSize: '18px', color: '#ffd23f', fontStyle: 'bold' }).setOrigin(0.5);
    const valText = this.add.text(cx, cy + 12, '', { fontFamily: FONT, fontSize: '24px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(cx, cy + 40, def.desc, { fontFamily: FONT, fontSize: '13px', color: '#9fb2d9' }).setOrigin(0.5);

    const pips = [];
    const startX = cx - ((def.max - 1) * 18) / 2;
    for (let n = 0; n < def.max; n++) pips.push(this.add.rectangle(startX + n * 18, cy + 68, 12, 10, 0x444444));

    const btn = this.add.rectangle(cx, cy + 104, 190, 52, 0x2ecc71).setStrokeStyle(3, 0xffffff, 0.9).setInteractive({ useHandCursor: true });
    const label = this.add.text(cx, cy + 94, 'LEVEL UP', { fontFamily: FONT, fontSize: '22px', color: '#fff', fontStyle: 'bold', stroke: '#0d5c2e', strokeThickness: 4 }).setOrigin(0.5);
    const coin = this.add.circle(cx - 22, cy + 118, 8, 0xffd23f).setStrokeStyle(2, 0xb8860b);
    const costText = this.add.text(cx - 10, cy + 118, '', { fontFamily: FONT, fontSize: '16px', color: '#fff', fontStyle: 'bold' }).setOrigin(0, 0.5);
    btn.on('pointerdown', () => this.levelUp(k));

    return { k, icon, lvText, valText, pips, btn, label, coin, costText };
  }

  fmt(k, v) { return v.toLocaleString('en-US'); }

  refresh() {
    this.goldText.setText(String(Math.floor(SAVE.gold)));
    this.gemText.setText(String(SAVE.gems));
    for (const c of this.cards) {
      const def = BASE_UPGRADES[c.k];
      const lv = SAVE.up[c.k];
      const maxed = lv >= def.max;
      const cur = def.value(lv);

      c.lvText.setText(`Lv ${lv} / ${def.max}`);
      c.valText.setText(maxed ? `${this.fmt(c.k, cur)}${def.unit}` : `${this.fmt(c.k, cur)} → ${this.fmt(c.k, def.value(lv + 1))}${def.unit}`);
      c.pips.forEach((p, n) => p.setFillStyle(n < lv ? 0xffd23f : 0x444444));

      if (maxed) {
        c.label.setText('MAX LEVEL').setY(c.btn.y);
        c.coin.setVisible(false);
        c.costText.setVisible(false);
        c.btn.setAlpha(0.4);
      } else {
        const cost = def.cost(lv);
        c.label.setText('LEVEL UP').setY(c.btn.y - 10);
        c.coin.setVisible(true);
        c.costText.setVisible(true).setText(String(cost));
        c.btn.setAlpha(SAVE.gold >= cost ? 1 : 0.45);
      }
    }
  }

  levelUp(k) {
    const def = BASE_UPGRADES[k];
    const lv = SAVE.up[k];
    if (lv >= def.max) return;
    const cost = def.cost(lv);
    if (SAVE.gold < cost) {
      this.tweens.add({ targets: this.goldText, alpha: 0.2, duration: 80, yoyo: true, repeat: 2 });   // ทองไม่พอ
      return;
    }
    SAVE.gold -= cost;
    SAVE.up[k] = lv + 1;
    SAVE.gems += GEM_UPGRADE;
    writeSave();
    this.refresh();
    popText(this, 400, 180, `+${GEM_UPGRADE} ◆`);
    const card = this.cards.find(c => c.k === k);
    this.tweens.add({ targets: [card.icon, card.valText], scale: 1.2, duration: 120, yoyo: true });
  }
}