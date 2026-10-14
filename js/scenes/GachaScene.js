// ---------- กาชา: ใช้เพชรสุ่มรางวัล (หาเพชรได้จากการสะสมตัวละครและอัปเลเวล) ----------
class GachaScene extends Phaser.Scene {
  constructor() { super('gacha'); }

  create() {
    this.busy = false;

    this.add.rectangle(W / 2, H / 2, W, H, 0x1f2a44);
    this.add.rectangle(W / 2, 28, W, 56, 0x15203a);
    this.add.text(W / 2, 28, 'กาชา', { fontFamily: FONT, fontSize: '28px', color: '#ffd23f', fontStyle: 'bold', stroke: '#5a2a00', strokeThickness: 4 }).setOrigin(0.5);
    const back = this.add.text(16, 28, '◀ กลับ', {
      fontFamily: FONT, fontSize: '18px', color: '#fff', backgroundColor: '#00000066', padding: { x: 10, y: 6 },
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('lobby'));
    this.add.circle(W - 130, 28, 10, 0xffd23f).setStrokeStyle(2, 0xb8860b);
    this.goldText = this.add.text(W - 114, 28, '', { fontFamily: FONT, fontSize: '22px', color: '#ffe066', fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.gemText = gemBadge(this, W - 262, 28);

    this.drawMachine();

    // อัตรารางวัล
    const total = GACHA_PRIZES.reduce((s, p) => s + p.w, 0);
    const pct = (kind) => Math.round(GACHA_PRIZES.filter(p => p.kind === kind).reduce((s, p) => s + p.w, 0) / total * 100);
    this.add.text(150, 322, `ทอง ${pct('gold')}%  ·  อัปเลเวลฟรี ${pct('level')}%  ·  ตัวละครใหม่ ${pct('unit')}%`, {
      fontFamily: FONT, fontSize: '12px', color: '#9fb2d9',
    }).setOrigin(0.5);

    this.btn1 = this.makeButton(85, 380, 'สุ่ม ×1', GACHA_COST, 1);
    this.btn10 = this.makeButton(215, 380, 'สุ่ม ×10', GACHA_COST_10, 10);

    // แผงผลลัพธ์
    this.add.rectangle(552, 240, 460, 340, 0x2a1f14).setStrokeStyle(4, 0x8a6a3a);
    this.add.text(552, 90, 'ผลการสุ่ม', { fontFamily: FONT, fontSize: '18px', color: '#ffd23f', fontStyle: 'bold' }).setOrigin(0.5);
    this.hint = this.add.text(552, 240, 'กดปุ่มสุ่มเพื่อลุ้นรางวัล\n\nได้เพชรจากการค้นพบตัวละครใหม่\nและการอัปเลเวลตัวละคร', {
      fontFamily: FONT, fontSize: '16px', color: '#b9a37a', align: 'center',
    }).setOrigin(0.5);
    this.res = this.add.container(0, 0);

    this.toastText = this.add.text(W / 2, 70, '', {
      fontFamily: FONT, fontSize: '17px', color: '#fff', backgroundColor: '#000000cc', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    this.refresh();
  }

  drawMachine() {
    const m = this.machine = this.add.container(150, 190);
    m.add(this.add.ellipse(0, 112, 150, 22, 0x000000, 0.3));
    m.add(this.add.rectangle(0, 92, 120, 40, 0xd7263d).setStrokeStyle(3, 0xf2c230));
    m.add(this.add.rectangle(0, 100, 36, 22, 0x2a0d12));
    m.add(this.add.circle(0, 0, 70, 0xf3e3ee, 0.35).setStrokeStyle(4, 0xffffff, 0.8));
    const cols = [0xe84a9a, 0x4da6ff, 0xffd23f, 0x7bd88f, 0xff7a59, 0xb07bff, 0x5ec8ff, 0xffa94d];
    [[-32, 20], [0, 30], [32, 18], [-18, -6], [20, -10], [-42, -22], [8, -34], [38, -26]].forEach(([x, y], i) => {
      m.add(this.add.circle(x, y, 14, cols[i]).setStrokeStyle(2, 0xffffff, 0.7));
    });
    m.add(this.add.circle(-6, -48, 8, 0xffffff, 0.6));
    this.add.text(150, 62, 'GACHA', { fontFamily: FONT, fontSize: '22px', color: '#ffd23f', fontStyle: 'bold', stroke: '#5a2a00', strokeThickness: 5 }).setOrigin(0.5);
  }

  makeButton(x, y, label, cost, count) {
    const bg = this.add.rectangle(x, y, 124, 56, 0x2ecc71).setStrokeStyle(3, 0xffffff, 0.9).setInteractive({ useHandCursor: true });
    this.add.text(x, y - 11, label, { fontFamily: FONT, fontSize: '20px', color: '#fff', fontStyle: 'bold', stroke: '#0d5c2e', strokeThickness: 4 }).setOrigin(0.5);
    this.add.polygon(x - 14, y + 13, [0, 7, 7, 0, 14, 7, 7, 14], 0xd7263d).setStrokeStyle(2, 0xffffff, 0.9);
    this.add.text(x - 2, y + 13, String(cost), { fontFamily: FONT, fontSize: '16px', color: '#fff', fontStyle: 'bold' }).setOrigin(0, 0.5);
    bg.on('pointerdown', () => this.pull(count, cost));
    return { bg, cost };
  }

  refresh() {
    this.goldText.setText(String(Math.floor(SAVE.gold)));
    this.gemText.setText(String(SAVE.gems));
    for (const b of [this.btn1, this.btn10]) b.bg.setAlpha(SAVE.gems >= b.cost ? 1 : 0.45);
  }

  // ---------- สุ่ม ----------
  pull(count, cost) {
    if (this.busy) return;
    if (SAVE.gems < cost) {
      this.toast('เพชรไม่พอ');
      this.tweens.add({ targets: this.gemText, alpha: 0.2, duration: 80, yoyo: true, repeat: 2 });
      return;
    }
    this.busy = true;
    SAVE.gems -= cost;
    const results = [];
    for (let i = 0; i < count; i++) results.push(this.roll());
    writeSave();
    this.refresh();

    this.tweens.add({
      targets: this.machine, angle: { from: -6, to: 6 }, duration: 70, yoyo: true, repeat: 5,
      onComplete: () => { this.machine.angle = 0; this.showResults(results); this.busy = false; },
    });
  }

  roll() {
    const total = GACHA_PRIZES.reduce((s, p) => s + p.w, 0);
    let r = Math.random() * total, prize = GACHA_PRIZES[0];
    for (const p of GACHA_PRIZES) { if (r < p.w) { prize = p; break; } r -= p.w; }

    if (prize.kind === 'level') {
      const c = UNIT_KEYS.filter(k => SAVE.seen[k] && SAVE.levels[k] < MAX_LEVEL);
      if (c.length) {
        const key = Phaser.Utils.Array.GetRandom(c);
        SAVE.levels[key]++;
        return { kind: 'level', key, text: `${UNITS[key].name}\nอัปเป็น Lv ${SAVE.levels[key]}` };
      }
      prize = GACHA_PRIZES[0];                       // ไม่มีตัวให้อัป: ได้ทองแทน
    }
    if (prize.kind === 'unit') {
      const c = UNIT_KEYS.filter(k => !SAVE.seen[k]);
      if (c.length) {
        const key = Phaser.Utils.Array.GetRandom(c);
        discoverUnit(key);
        return { kind: 'unit', key, text: `ค้นพบ!\n${UNITS[key].name}\n+${GEM_DISCOVER} ◆` };
      }
      prize = GACHA_PRIZES.find(p => p.kind === 'gold' && p.gold > 100) || GACHA_PRIZES[0];   // ครบทุกตัวแล้ว: ได้ทองก้อนใหญ่แทน
    }
    SAVE.gold += prize.gold;
    return { kind: 'gold', text: `+${prize.gold}\nทอง` };
  }

  showResults(results) {
    this.hint.setVisible(false);
    this.res.removeAll(true);
    const n = results.length;
    results.forEach((r, i) => {
      const col = n === 1 ? 2 : i % 5, row = n === 1 ? 0 : Math.floor(i / 5);
      const x = 552 + (col - 2) * 90, y = n === 1 ? 240 : 180 + row * 130;
      const card = this.add.container(x, y);
      const fill = r.kind === 'unit' ? 0x4a2a5a : r.kind === 'level' ? 0x1d3b52 : 0x3a2c1c;
      card.add(this.add.rectangle(0, 0, 84, 118, fill).setStrokeStyle(3, r.kind === 'unit' ? 0xffd23f : 0x8a6a3a));
      if (r.key) {
        card.add(this.add.ellipse(0, 6, 50, 8, 0x000000, 0.3));
        card.add(unitPortrait(this, 0, 6, r.key, 50));
      } else {
        card.add(this.add.circle(0, -22, 16, 0xffd23f).setStrokeStyle(3, 0xb8860b));
        card.add(this.add.text(0, -22, '$', { fontFamily: FONT, fontSize: '18px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5));
      }
      card.add(this.add.text(0, 36, r.text, { fontFamily: FONT, fontSize: '12px', color: r.kind === 'unit' ? '#ffe066' : '#fff', align: 'center', fontStyle: 'bold' }).setOrigin(0.5));
      card.setScale(0);
      this.res.add(card);
      this.tweens.add({ targets: card, scale: 1, duration: 220, delay: i * 110, ease: 'Back.easeOut' });
    });
    this.goldText.setText(String(Math.floor(SAVE.gold)));
  }

  toast(message) {
    this.toastText.setText(message).setAlpha(1);
    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1200, duration: 500 });
  }
}
