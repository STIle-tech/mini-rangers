// ---------- หน้าสะสม: สมุดตัวละคร (ค้นพบเมื่อได้ลงสนามหรือเจอเป็นศัตรู) + รางวัลสะสมครบ ----------
class CollectionScene extends Phaser.Scene {
  constructor() { super('collection'); }

  create(data) {
    this.sel = (data && Number.isInteger(data.sel)) ? data.sel : 0;

    this.add.rectangle(W / 2, H / 2, W, H, 0x1f2a44);
    this.add.rectangle(W / 2, 28, W, 56, 0x15203a);
    this.add.text(W / 2, 28, 'สะสม', { fontFamily: FONT, fontSize: '28px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    const back = this.add.text(16, 28, '◀ กลับ', {
      fontFamily: FONT, fontSize: '18px', color: '#fff', backgroundColor: '#00000066', padding: { x: 10, y: 6 },
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('lobby'));
    this.add.circle(W - 130, 28, 10, 0xffd23f).setStrokeStyle(2, 0xb8860b);
    this.goldText = this.add.text(W - 114, 28, '', { fontFamily: FONT, fontSize: '22px', color: '#ffe066', fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.gemText = gemBadge(this, W - 262, 28);

    // แถบความคืบหน้า
    this.add.rectangle(W / 2 - 60, 74, 300, 12, 0x0b1426).setStrokeStyle(2, 0x3a4a70);
    this.progFill = this.add.rectangle(W / 2 - 60 - 150, 74, 300, 12, 0x4ab34a).setOrigin(0, 0.5);
    this.progText = this.add.text(W / 2 + 108, 74, '', { fontFamily: FONT, fontSize: '16px', color: '#fff', fontStyle: 'bold' }).setOrigin(0, 0.5);

    this.dyn = this.add.container(0, 0);   // ส่วนที่วาดใหม่ทุกครั้งที่ refresh
    this.toastText = this.add.text(W / 2, 100, '', {
      fontFamily: FONT, fontSize: '17px', color: '#fff', backgroundColor: '#000000cc', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    this.refresh();
  }

  A(obj) { this.dyn.add(obj); return obj; }

  seenCount() { return UNIT_KEYS.filter(k => SAVE.seen[k]).length; }

  // เฟรมแรกของตัวละคร (สไปรท์) หรือสี่เหลี่ยมถ้าไม่มีไฟล์ภาพ
  portrait(x, feetY, key, targetH, animate) {
    const def = UNITS[key];
    if (def.sprite && this.textures.exists('unit_' + key)) {
      const sp = this.add.sprite(x, feetY, 'unit_' + key, def.sprite.walk[0]).setOrigin(0.5, 122 / 128).setScale(targetH / def.sprite.frameHeight);
      if (animate) {
        const ak = 'pv_' + key;
        if (!this.anims.exists(ak)) {
          this.anims.create({ key: ak, frameRate: 8, repeat: -1,
            frames: this.anims.generateFrameNumbers('unit_' + key, { start: def.sprite.walk[0], end: def.sprite.walk[1] }) });
        }
        sp.play(ak);
      }
      return sp;
    }
    const f = targetH / 48, w = def.size * f, h = def.size * 1.6 * f;
    return this.add.rectangle(x, feetY - h / 2, w, h, def.color).setStrokeStyle(2, 0xffffff, 0.8);
  }

  refresh() {
    this.dyn.removeAll(true);
    this.goldText.setText(String(Math.floor(SAVE.gold)));
    this.gemText.setText(String(SAVE.gems));
    const seen = this.seenCount(), total = UNIT_KEYS.length;
    this.progFill.width = 300 * (seen / total);
    this.progText.setText(`ค้นพบ ${seen}/${total}`);

    this.buildGrid();
    this.buildDetail();
    this.buildRewards();
  }

  // ---------- ตารางตัวละคร: แถว = ประเภท ----------
  buildGrid() {
    const rows = Object.keys(TYPES).sort((p, q) => TYPES[p].rank - TYPES[q].rank);
    rows.forEach((t, r) => {
      UNIT_KEYS.filter(k => UNITS[k].type === t).forEach((key, c) => {
        const def = UNITS[key], idx = UNIT_KEYS.indexOf(key), known = !!SAVE.seen[key];
        const x = 14 + 68 + c * 140, y = 148 + r * 102;
        const picked = idx === this.sel;
        const bg = this.A(this.add.rectangle(x, y, 134, 96, known ? 0x2b3a5e : 0x1a2238).setStrokeStyle(3, picked ? 0xffd23f : 0x5b7bbd).setInteractive({ useHandCursor: true }));
        bg.on('pointerdown', () => { this.sel = idx; this.refresh(); });
        if (known) {
          this.A(this.add.text(x - 54, y - 36, ELEMENTS[def.element].icon, { fontFamily: FONT, fontSize: '14px' }).setOrigin(0.5));
          this.A(this.add.text(x + 54, y - 36, TYPES[def.type].icon, { fontFamily: FONT, fontSize: '14px' }).setOrigin(0.5));
          this.A(this.add.text(x, y - 36, `Lv ${SAVE.levels[key]}`, { fontFamily: FONT, fontSize: '12px', color: '#bcd0ff' }).setOrigin(0.5));
          this.A(this.add.ellipse(x, y + 28, 60, 10, 0x000000, 0.3));
          this.A(this.portrait(x, y + 28, key, 56, false));
          this.A(this.add.text(x, y + 39, def.name, { fontFamily: FONT, fontSize: '13px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5));
        } else {
          this.A(this.add.text(x, y - 4, '?', { fontFamily: FONT, fontSize: '44px', color: '#3a4a70', fontStyle: 'bold' }).setOrigin(0.5));
          this.A(this.add.text(x, y + 36, 'ยังไม่ค้นพบ', { fontFamily: FONT, fontSize: '12px', color: '#5b6b90' }).setOrigin(0.5));
        }
      });
    });
  }

  // ---------- แผงรายละเอียดด้านขวา ----------
  buildDetail() {
    const key = UNIT_KEYS[this.sel], def = UNITS[key], known = !!SAVE.seen[key];
    this.A(this.add.rectangle(612, 250, 340, 306, 0x2a1f14).setStrokeStyle(4, 0x8a6a3a));
    if (!known) {
      this.A(this.add.text(612, 230, '???', { fontFamily: FONT, fontSize: '40px', color: '#6b5a40', fontStyle: 'bold' }).setOrigin(0.5));
      this.A(this.add.text(612, 290, 'ลงสนามหรือเจอตัวละครนี้เป็นศัตรู\nในการต่อสู้เพื่อบันทึกลงสมุดสะสม', { fontFamily: FONT, fontSize: '15px', color: '#b9a37a', align: 'center' }).setOrigin(0.5));
      return;
    }
    const lv = SAVE.levels[key], m = statMult(lv), T = TYPES[def.type], E = ELEMENTS[def.element];
    this.A(this.add.ellipse(500, 214, 100, 16, 0x7a5a2a));
    this.A(this.portrait(500, 214, key, 96, true));
    this.A(this.add.text(565, 120, def.name, { fontFamily: FONT, fontSize: '26px', color: '#fff', fontStyle: 'bold' }).setOrigin(0, 0.5));
    this.A(this.add.text(565, 150, `${T.icon} ${T.name}   ${E.icon} ธาตุ${E.name}`, { fontFamily: FONT, fontSize: '15px', color: '#bfe3ff', fontStyle: 'bold' }).setOrigin(0, 0.5));
    this.A(this.add.text(565, 172, `Lv ${lv} / ${MAX_LEVEL}`, { fontFamily: FONT, fontSize: '16px', color: '#ffd23f', fontStyle: 'bold' }).setOrigin(0, 0.5));

    const btn = this.A(this.add.rectangle(675, 204, 190, 28, 0x2ecc71).setStrokeStyle(2, 0xffffff, 0.9).setInteractive({ useHandCursor: true }));
    this.A(this.add.text(675, 204, 'อัปเกรดตัวละคร ▶', { fontFamily: FONT, fontSize: '14px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5));
    btn.on('pointerdown', () => this.scene.start('character', { sel: this.sel, from: 'collection' }));

    const stat = (x, y, label, value) => {
      this.A(this.add.text(x, y, label, { fontFamily: FONT, fontSize: '14px', color: '#b9a37a' }).setOrigin(0, 0.5));
      this.A(this.add.text(x + 150, y, String(value), { fontFamily: FONT, fontSize: '15px', color: '#fff', fontStyle: 'bold' }).setOrigin(1, 0.5));
    };
    stat(458, 244, 'เลือด', Math.round(def.hp * m));
    stat(458, 266, 'ดาเมจ', Math.round(def.dmg * m));
    stat(458, 288, 'ราคาพลังงาน', def.cost);
    stat(622, 244, 'ระยะโจมตี', def.range);
    stat(622, 266, 'ความเร็วเดิน', def.speed);
    stat(622, 288, 'ตีทุก (วิ)', (def.cd / 1000).toFixed(2));

    this.A(this.add.text(612, 318, def.skill ? `สกิล ${def.skill.name}: ${def.skill.desc}` : `${T.desc} (ไม่มีสกิล)`, {
      fontFamily: FONT, fontSize: '14px', color: '#9fe6b0', align: 'center', wordWrap: { width: 310 },
    }).setOrigin(0.5));

    const strong = ELEMENTS[def.element].beats;
    const weak = Object.keys(ELEMENTS).find(e => ELEMENTS[e].beats === def.element);
    this.A(this.add.text(612, 350, `ชนะทาง ${ELEMENTS[strong].icon}${ELEMENTS[strong].name}   ·   แพ้ทาง ${ELEMENTS[weak].icon}${ELEMENTS[weak].name}`, {
      fontFamily: FONT, fontSize: '14px', color: '#ffe0a3',
    }).setOrigin(0.5));
    const st = SAVE.stats;
    this.A(this.add.text(612, 380, `ลงสนาม ${st.used[key] || 0} ครั้ง  ·  ปราบศัตรูชนิดนี้ ${st.defeated[key] || 0} ตัว`, {
      fontFamily: FONT, fontSize: '13px', color: '#9fb2d9',
    }).setOrigin(0.5));
  }

  // ---------- รางวัลสะสมครบตามจำนวน ----------
  buildRewards() {
    const seen = this.seenCount();
    const list = COLLECTION_REWARDS.filter(r => r.n <= UNIT_KEYS.length);
    const cw = 250, gap = 14, x0 = (W - (list.length * cw + (list.length - 1) * gap)) / 2 + cw / 2;
    list.forEach((r, i) => {
      const x = x0 + i * (cw + gap), y = 426;
      const claimed = SAVE.claimed.includes(r.n), ready = !claimed && seen >= r.n;
      const color = claimed ? 0x2e6b3e : ready ? 0xf2c230 : 0x2b3a5e;
      const bg = this.A(this.add.rectangle(x, y, cw, 32, color).setStrokeStyle(3, ready ? 0xffffff : 0x5b7bbd, ready ? 0.9 : 1));
      const label = claimed ? `✓ รับแล้ว (ค้นพบ ${r.n} ตัว)` : ready ? `รับ! ${r.n} ตัว: +${r.gold} ทอง +${r.gems} ◆` : `${r.n} ตัว → ${r.gold} ทอง +${r.gems} ◆  (${seen}/${r.n})`;
      this.A(this.add.text(x, y, label, { fontFamily: FONT, fontSize: '13px', color: ready ? '#3a2410' : '#fff', fontStyle: 'bold' }).setOrigin(0.5));
      if (ready) {
        bg.setInteractive({ useHandCursor: true });
        bg.on('pointerdown', () => {
          SAVE.claimed.push(r.n);
          SAVE.gold += r.gold;
          SAVE.gems += r.gems || 0;
          writeSave();
          this.refresh();
          this.toast(`ได้รับ ${r.gold} ทอง และ ${r.gems || 0} เพชร!`);
        });
      }
    });
  }

  toast(message) {
    this.toastText.setText(message).setAlpha(1);
    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1200, duration: 500 });
  }
}
