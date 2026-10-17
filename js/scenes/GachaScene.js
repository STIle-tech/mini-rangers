// =====================================================================
// GachaScene — หน้ากาชา: สุ่มด้วยเพชร ได้ทอง / อัปเลเวลฟรี / ค้นพบตัวละครใหม่
// =====================================================================
const GACHA_X = 300;         // กึ่งกลางแผงหลัก (ซ้าย)
const GACHA_RIGHT_X = 675;   // กึ่งกลางคอลัมน์การ์ดแบนเนอร์ (ขวา)

class GachaScene extends Phaser.Scene {
  constructor() { super('gacha'); }

  create() {
    this.busy = false;
    const x = GACHA_X, y = 250;

    // พื้นหลัง (ไม่มีรูปก็ใช้สีแทน กันจอดำ)
    this.skin('gacha_bg', W / 2, H / 2, W, H, 0, () => this.add.rectangle(W / 2, H / 2, W, H, 0x7bb9d8));

    // แถบบน
    this.add.rectangle(W / 2, 32, W, 64, 0x17243c, 0.9).setDepth(1);
    this.click(this.t(28, 32, '←', 34), () => this.scene.start('lobby'));
    this.t(95, 32, 'GACHA', 30, '#fff', { stroke: '#202b50', strokeThickness: 5 }).setOrigin(0, 0.5);
    this.roundBtn(190, 32, 15, 0xffd23f, '?', 18, '#4a2a00', 'ใช้เพชรเพื่อสุ่มรางวัล');

    // เพชร + ตั๋ว
    this.add.circle(W - 430, 32, 15, 0xe84a9a).setStrokeStyle(2, 0xffffff).setDepth(5);
    this.gemText = this.t(W - 405, 32, '', 18).setOrigin(0, 0.5);
    this.roundBtn(W - 350, 32, 13, 0x46bd59, '+', 19, '#fff', 'เพชรสามารถหาได้จากการเล่นและรางวัลสะสม');
    this.skin('gacha_ticket', W - 290, 32, 27, 27, 5, () => this.add.rectangle(W - 290, 32, 25, 25, 0x4da6ff));
    this.t(W - 270, 32, '0', 17).setOrigin(0, 0.5);

    // แผงหลัก
    this.mainPanel = this.skin('gacha_result_panel', x, y, 520, 355, 2,
      () => this.add.rectangle(x, y, 520, 355, 0x7a238f).setStrokeStyle(5, 0xf3c83b));
    this.add.rectangle(x - 200, y - 140, 90, 34, 0xe52d55).setDepth(4);
    this.t(x - 200, y - 140, 'ใหม่', 18);
    this.t(x, y - 125, 'เปิดตัวเรนเจอร์ใหม่', 25, '#fff', { stroke: '#52205f', strokeThickness: 4 });
    this.t(x, y - 92, 'ULTRA RARE', 19, '#ffd23f');
    this.add.circle(x, y + 15, 65, 0xffe9ff, 0.15).setStrokeStyle(3, 0xffffff, 0.5).setDepth(3);
    this.add.circle(x, y + 15, 30, 0xffffff, 0.8).setDepth(3);
    [[-235, '‹', 'Banner ก่อนหน้า'], [235, '›', 'Banner ถัดไป']].forEach(([dx, ch, msg]) =>
      this.click(this.t(x + dx, y + 10, ch, 70).setDepth(6), () => this.toast(msg)));
    this.t(x, y + 145, 'ULTRA RARE ★7~★8', 21, '#ffd23f', { stroke: '#542000', strokeThickness: 4 });
    this.roundBtn(x + 235, y + 145, 14, 0x8e245e, '?', 14, '#fff', 'รายละเอียดอัตราสุ่มรางวัล');

    // คอลัมน์ขวา: แท็บ + การ์ดแบนเนอร์
    const rx = GACHA_RIGHT_X;
    this.t(rx - 35, 85, 'RANGERS', 17, '#ffe066', { backgroundColor: '#7a275d', padding: { x: 12, y: 7 } });
    this.t(rx + 70, 85, 'อุปกรณ์', 16, '#fff', { fontStyle: 'normal', backgroundColor: '#6e6e6e', padding: { x: 10, y: 7 } });
    [['ULTRA RARE', '★7 ~ ★8', 0x7a3a78], ['EVENT', '31 วัน', 0x4168a8], ['EVENT', '31 วัน', 0x4168a8], ['สุ่มครบ 100 ครั้ง', '0 / 100', 0x8c4a91]]
      .forEach(([title, sub, color], i) => {
        const cy = 135 + i * 78;
        this.click(this.add.rectangle(rx, cy, 170, 70, color).setStrokeStyle(3, 0xf2d34d).setDepth(4), () => this.toast(`${title} : ${sub}`));
        this.t(rx, cy - 15, title, 15);
        this.t(rx, cy + 14, sub, 14, '#ffe066');
      });

    // ปุ่มสุ่ม + ประวัติ
    this.btn1 = this.summonBtn(x - 110, H - 95, '1 ครั้ง', GACHA_COST, 1);
    this.btn10 = this.summonBtn(x + 110, H - 95, '10 ครั้ง', GACHA_COST_10, 10);
    this.click(this.add.rectangle(W - 115, H - 30, 120, 38, 0x628e38).setStrokeStyle(3, 0xd6d95c).setDepth(5), () => this.toast('ยังไม่มีประวัติการสุ่ม'));
    this.t(W - 115, H - 30, 'ประวัติ', 16).setDepth(6);

    this.res = this.add.container(0, 0).setDepth(20);   // ผลการสุ่ม
    this.toastText = this.t(W / 2, H - 55, '', 18, '#fff', { backgroundColor: '#000000dd', padding: { x: 18, y: 9 } }).setAlpha(0).setDepth(100);
    this.input.keyboard.on('keydown-ESC', () => this.scene.start('lobby'));
    this.refresh();
  }

  // ---------- ตัวช่วย ----------
  t(x, y, s, size, color = '#fff', style = {}) {
    return this.add.text(x, y, s, { fontFamily: FONT, fontSize: size + 'px', color, fontStyle: 'bold', ...style }).setOrigin(0.5).setDepth(5);
  }

  click(obj, fn) { return obj.setInteractive({ useHandCursor: true }).on('pointerdown', fn); }

  // รูปที่ขนาด w×h ถ้าไม่มีรูปใช้ fallback()
  skin(key, x, y, w, h, depth, fallback) {
    return (this.textures.exists(key) ? this.add.image(x, y, key).setDisplaySize(w, h) : fallback()).setDepth(depth);
  }

  // ปุ่มกลม + ตัวอักษร กดแล้วขึ้น toast
  roundBtn(x, y, r, color, label, size, textColor, msg) {
    this.click(this.add.circle(x, y, r, color).setStrokeStyle(2, 0xffffff).setDepth(5), () => this.toast(msg));
    this.t(x, y, label, size, textColor).setDepth(6);
  }

  summonBtn(x, y, label, cost, count) {
    const bg = this.skin('gacha_summon_button', x, y, 205, 66, 5, () => this.add.rectangle(x, y, 205, 66, 0xffdc35).setStrokeStyle(3, 0xffffff));
    this.t(x - 42, y, label, 19, '#5a3b00').setDepth(6);
    this.add.circle(x + 35, y, 11, 0xe84a9a).setStrokeStyle(2, 0xffffff).setDepth(6);
    this.t(x + 57, y, String(cost), 18, '#5a3b00').setDepth(6);
    const base = bg.scaleX;   // ขยายจากขนาดจริง (ถ้าเป็นรูป scale ไม่ใช่ 1)
    const zoom = k => () => this.tweens.add({ targets: bg, scaleX: base * k, scaleY: base * k, duration: 100 });
    this.click(bg, () => this.pull(count, cost)).on('pointerover', zoom(1.04)).on('pointerout', zoom(1));
    return { bg, cost };
  }

  refresh() {
    this.gemText.setText(String(SAVE.gems));
    [this.btn1, this.btn10].forEach(b => b.bg.setAlpha(SAVE.gems >= b.cost ? 1 : 0.45));
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
    const results = Array.from({ length: count }, () => this.roll());
    writeSave();
    this.refresh();

    const s = this.mainPanel.scaleX;
    this.tweens.add({
      targets: this.mainPanel, scaleX: s * 1.025, scaleY: s * 1.025, duration: 100, yoyo: true, repeat: 4,
      onComplete: () => { this.showResults(results); this.busy = false; },
    });
  }

  // สุ่ม 1 ครั้ง ตามน้ำหนักใน GACHA_PRIZES (ถ้าของที่ได้ใช้ไม่ได้ จะถอยเป็นทอง)
  roll() {
    let r = Math.random() * GACHA_PRIZES.reduce((s, p) => s + p.w, 0);
    let prize = GACHA_PRIZES.find(p => (r -= p.w) < 0) || GACHA_PRIZES[0];
    const pick = ok => {
      const list = UNIT_KEYS.filter(ok);
      return list.length ? Phaser.Utils.Array.GetRandom(list) : null;
    };

    if (prize.kind === 'level') {
      const key = pick(k => SAVE.seen[k] && SAVE.levels[k] < MAX_LEVEL);
      if (key) {
        SAVE.levels[key]++;
        return { kind: 'level', key, text: `${UNITS[key].name}\nอัปเป็น Lv ${SAVE.levels[key]}` };
      }
      prize = GACHA_PRIZES[0];
    }

    if (prize.kind === 'unit') {
      const key = pick(k => !SAVE.seen[k]);
      if (key) {
        discoverUnit(key);
        return { kind: 'unit', key, text: `ค้นพบ!\n${UNITS[key].name}\n+${GEM_DISCOVER} ◆` };
      }
      prize = GACHA_PRIZES.find(p => p.kind === 'gold' && p.gold > 100) || GACHA_PRIZES[0];   // ค้นพบครบแล้ว
    }

    SAVE.gold += prize.gold;
    return { kind: 'gold', text: `+${prize.gold}\nทอง` };
  }

  // แสดงผลเป็นการ์ดบนฉากมืด (แตะที่ไหนก็ได้เพื่อปิด)
  showResults(results) {
    const n = results.length;
    this.res.removeAll(true);
    this.res.add([
      this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setInteractive().once('pointerdown', () => this.res.removeAll(true)),
      this.t(GACHA_X, H - 28, 'แตะเพื่อปิดผลการสุ่ม', 14, '#fff', { fontStyle: 'normal', backgroundColor: '#000000aa', padding: { x: 12, y: 6 } }),
    ]);

    results.forEach((r, i) => {
      const x = n === 1 ? GACHA_X : GACHA_X + (i % 5 - 2) * 96;
      const y = n === 1 ? 230 : 190 + Math.floor(i / 5) * 125;
      const [fill, border] = r.kind === 'unit' ? [0x702c78, 0xffd23f] : r.kind === 'level' ? [0x1d3b52, 0x4da6ff] : [0x3a2c1c, 0x8a6a3a];

      const card = this.add.container(x, y, [this.add.rectangle(0, 0, 86, 112, fill).setStrokeStyle(3, border)]);
      if (r.key) {
        card.add([this.add.ellipse(0, -6, 50, 8, 0x000000, 0.3), unitPortrait(this, 0, -6, r.key, 46)]);
      } else {
        card.add([this.add.circle(0, -25, 17, 0xffd23f).setStrokeStyle(3, 0xb8860b), this.t(0, -25, '$', 17)]);
      }
      card.add(this.t(0, 30, r.text, 11, r.kind === 'unit' ? '#ffe066' : '#fff', { align: 'center', wordWrap: { width: 78 } }));

      card.setScale(0);
      this.res.add(card);
      this.tweens.add({ targets: card, scale: n === 1 ? 1.6 : 1, duration: 250, delay: i * 100, ease: 'Back.easeOut' });
    });
    this.refresh();
  }

  toast(message) {
    this.toastText.setText(message).setAlpha(1);
    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1200, duration: 500 });
  }
}