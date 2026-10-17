// ---------- หน้าทีม (สไตล์ Line Rangers): ลากตัวละครขึ้นแท่นเพื่อจัดทีม ----------
// เลย์เอาต์: ด้านบน 3/4 ของจอ = แท่นตัวละคร / ด้านล่าง 1/4 = รายการการ์ด (เลื่อนซ้าย-ขวา)
const TEAM_SPLIT = 3 / 4;     // สัดส่วนพื้นที่ด้านบน (แท่น) ที่เหลือเป็นของรายการการ์ด
const TEAM_CARD_W = 182;      // ขนาดออกแบบของการ์ด (กว้าง x สูง) ตอนแสดงจริงจะย่อสเกลอัตโนมัติให้พอดีพื้นที่ 1/4 ล่าง
const TEAM_CARD_H = 132;      // ถ้ามีรูปการ์ด ให้ทำสัดส่วนเดียวกัน เช่น 728x528
const TEAM_CARD_GAP = 8;      // ช่องว่างระหว่างการ์ด (ก่อนสเกล)
const TEAM_GEM = [{ x: -10, y: -4 }, { x: -5, y: -11 }, { x: 5, y: -11 }, { x: 10, y: -4 }, { x: 0, y: 12 }];
// ภาพ UI หน้าทีม (ถ้าไม่มีไฟล์ จะใช้รูปทรงที่โค้ดวาดแทนอัตโนมัติ) วางไว้ที่ assets/ui/team/
const TEAM_ASSETS = {
  team_ped_gold: 'ped_gold.png',       // แท่นเกรด 4-5 (ขอบทอง)
  team_ped_purple: 'ped_purple.png',   // แท่นเกรด 3 (ขอบม่วงชมพู)
  team_ped_blue: 'ped_blue.png',       // แท่นเกรด 1-2 (ขอบน้ำเงินเทา)
  team_ped_empty: 'ped_empty.png',     // แท่นว่าง (ยังไม่มีตัวละคร)
  team_card_high: 'card_high.png',     // การ์ดเกรด 4-5 (กรมท่าขอบฟ้า)
  team_card_normal: 'card_normal.png', // การ์ดปกติ (ม่วงขอบทอง)
};
const TEAM_PED_W = 140;       // ความกว้างแท่นที่แสดง (px ในเกม) ความสูงปรับตามสัดส่วนภาพ
const TEAM_PED_ORIGIN_Y = 0.4; // จุดที่ตัวละครยืน อยู่ลงมากี่ส่วนของความสูงภาพแท่น (0=ขอบบน 1=ขอบล่าง) ถ้าเท้าลอย/จมให้ปรับเลขนี้
const TEAM_PORTRAIT_H = 72;   // ความสูงตัวละครบนแท่น (ก่อนคูณสเกลแท่น) เล็ก/ใหญ่ปรับเลขนี้
const teamGrade = k => Math.max(1, Math.min(5, (typeof gradeOf === 'function' ? gradeOf(k) : 1) | 0));
// เรียงรายการ: [ชื่อ, ฟังก์ชันคีย์เรียง] (null = ลำดับเดิม)
const TEAM_SORTS = [['ล่าสุด', null], ['ระดับ', k => -teamGrade(k)], ['ราคา', k => -UNITS[k].cost], ['ธาตุ', k => UNITS[k].element]];

class TeamScene extends Phaser.Scene {
  constructor() { super('team'); }

  preload() {
    if (!this.textures.exists('team_bg')) this.load.image('team_bg', 'assets/backgrounds/team/team_bg.png');   // ไม่มีไฟล์ก็ใช้พื้นหลังสำรอง
    for (const [key, file] of Object.entries(TEAM_ASSETS)) if (!this.textures.exists(key)) this.load.image(key, 'assets/ui/team/' + file);
    this.load.on('loaderror', f => (f.key === 'team_bg' || f.key in TEAM_ASSETS) && console.warn('[TEAM] ไม่พบ', f.src));
  }

  create() {
    this.drag = null;                              // { key, from, obj } ระหว่างลากตัวละคร
    this.scroll = { on: false, moved: false, x0: 0, l0: 0 };
    this.sortMode = 0;

    // ---------- คำนวณเลย์เอาต์จากขนาดจอ (3/4 บน : 1/4 ล่าง) ----------
    this.listTop = Math.round(H * TEAM_SPLIT);               // เส้นแบ่งแท่น / รายการ
    this.barY = this.listTop - 18;                           // แถบคำอธิบาย + จัดเรียง
    this.slotX = [0, 1, 2, 3, 4].map(i => Math.round(W * (0.125 + 0.1875 * i)));
    // สเกลแท่น: ขยายตามความสูงที่เหลือ แต่ไม่ให้แท่นชนกัน (ระยะห่างช่อง = W*0.1875)
    const areaTop = 82, areaBot = this.barY - 8;
    this.ps = Math.max(0.7, Math.min(0.95, (areaBot - areaTop) / 165, (W * 0.1875) / TEAM_PED_W * 1.04));
    this.padY = Math.round((areaTop + areaBot) / 2 + 18 * this.ps);   // ตำแหน่งแท่น (จัดให้อยู่กลางพื้นที่ด้านบน)
    const availH = H - this.listTop - 24;                    // พื้นที่การ์ด (เว้นที่สกรอลล์บาร์ด้านล่าง)
    this.cardK = Math.min(1, availH / TEAM_CARD_H);          // สเกลการ์ด
    this.cardStep = (TEAM_CARD_W + TEAM_CARD_GAP) * this.cardK;
    this.cardCY = this.listTop + 6 + (TEAM_CARD_H * this.cardK) / 2;

    // พื้นหลัง: ใช้รูป team_bg ถ้ามี (assets/backgrounds/team/team_bg.png) ไม่มีก็ใช้ผนังอิฐทรายสำรอง
    const hasBg = this.textures.exists('team_bg');
    if (hasBg) {
      const bg = this.add.image(W / 2, H / 2, 'team_bg').setDepth(-100);
      bg.setScale(Math.max(W / bg.width, H / bg.height));
      this.add.rectangle(W / 2, 0, W, 90, 0x000000, 0.28).setOrigin(0.5, 0);   // เงาจางด้านบนให้ป้ายอ่านง่าย
    } else {
      this.add.rectangle(W / 2, H / 2, W, H, 0xe3cb98);
      for (let r = 0; r < Math.ceil(this.listTop / 36); r++) {
        for (let c = 0; c < 10; c++) {
          this.add.rectangle(c * 90 + (r % 2) * 45, 14 + r * 36, 86, 32, 0xead6a8).setStrokeStyle(1, 0xc7a96d, 0.7);
        }
      }
      this.add.ellipse(W / 2, this.padY + 18 * this.ps, 760, 120 * this.ps, 0xf1e2bc, 0.55);   // พื้นหินวงกลมใต้แท่น
    }
    // พื้นรายการตัวละคร: ไม้เข้ม (โปร่งเล็กน้อยเมื่อมีรูปพื้นหลัง) + ขอบทองด้านบน
    this.add.rectangle(W / 2, (this.listTop + H) / 2, W, H - this.listTop, 0x3a2514, hasBg ? 0.88 : 1);
    this.add.rectangle(W / 2, this.listTop, W, 3, 0xf0b429, 0.9);

    // แถบบน: ปุ่มกลับ ชื่อหน้า ปุ่มช่วยเหลือ เพชร/ทอง
    this.click(this.add.circle(30, 28, 19, 0xffd23f).setStrokeStyle(3, 0x1a1a1a), () => this.scene.start('lobby'));
    this.t(30, 28, '◀', 18, '#1a1a1a');
    this.t(58, 28, 'ทีม', 34, '#4cc2ff', { stroke: '#0b3d91', strokeThickness: 7 }).setOrigin(0, 0.5);
    this.click(this.add.circle(135, 28, 13, 0xffd23f).setStrokeStyle(2, 0x1a1a1a), () => this.toast('ลากรูปตัวละครขึ้นแท่นเพื่อจัดทีม'));
    this.t(135, 28, '?', 17, '#1a1a1a');
    this.pill(W - 250, 'gem', SAVE.gems || 0);
    this.pill(W - 115, 'gold', Math.floor(SAVE.gold || 0));

    // แถบสรุปทีม
    this.add.graphics().fillStyle(0x4a2c12).fillRoundedRect(20, 47, 372, 26, 9).fillStyle(0x8a5028).fillRoundedRect(22, 49, 368, 22, 8);
    this.infoText = this.t(34, 60, '', 15, '#fff', { stroke: '#3a1f0c', strokeThickness: 3 }).setOrigin(0, 0.5);

    this.slotLayer = this.add.container(0, 0);
    this.slotGlow = this.add.ellipse(0, this.padY, 134 * this.ps, 40 * this.ps).setStrokeStyle(4, 0xffd23f).setVisible(false).setDepth(1500);

    // แถบกลาง: คำอธิบาย + จัดเรียง + ฟิลเตอร์
    this.add.rectangle(W / 2, this.barY, W, 30, 0x6b4a2a).setStrokeStyle(2, 0x3a2410);
    this.t(12, this.barY, 'ลากรูปเพื่อจัดทีม · ลากบนแท่นเพื่อสลับ · ลากลงล่างเพื่อเอาออก', 12, '#ffe0a3', { fontStyle: 'normal' }).setOrigin(0, 0.5);
    this.woodBtn(W - 160, this.barY, 132, () => this.setSort((this.sortMode + 1) % TEAM_SORTS.length));
    this.sortText = this.t(W - 160, this.barY, '', 12);
    this.woodBtn(W - 52, this.barY, 84, () => this.toast('ฟิลเตอร์ยังไม่เปิดให้ใช้งาน'));
    this.t(W - 52, this.barY, 'ฟิลเตอร์', 12);

    this.listLayer = this.add.container(0, 0);
    this.track = this.add.rectangle(W / 2, H - 10, W - 24, 5, 0x000000, 0.35);
    this.thumb = this.add.rectangle(12, H - 10, 60, 5, 0xe0c080).setOrigin(0, 0.5);
    this.toastText = this.t(W / 2, 100, '', 17, '#fff', { backgroundColor: '#000000cc', padding: { x: 12, y: 6 } }).setAlpha(0).setDepth(1000);
    this.minX = Math.min(0, W - (12 + UNIT_KEYS.length * this.cardStep + 4));   // ขอบซ้ายสุดที่เลื่อนรายการได้

    const inp = this.input;
    inp.on('pointerdown', this.onDown, this);
    inp.on('pointermove', this.onMove, this);
    inp.on('pointerup', p => this.onUp(p), this);
    inp.on('pointerupoutside', p => this.onUp(p, true), this);   // ปล่อยนอกจอ = ยกเลิกการลาก
    inp.on('wheel', (p, over, dx, dy) => this.scrollList(this.listLayer.x - (dx || dy)));

    this.setSort(0);
  }

  // ---------- ตัวช่วย ----------
  t(x, y, s, size, color = '#fff', style = {}) {
    return this.add.text(x, y, s, { fontFamily: FONT, fontSize: size + 'px', color, fontStyle: 'bold', ...style }).setOrigin(0.5);
  }

  click(obj, fn) { return obj.setInteractive({ useHandCursor: true }).on('pointerdown', fn); }

  // คริสตัล/เพชร (graphics วาดที่ x,y ขนาด s)
  gem(x, y, s = 1, color = 0x38c4ff, dark = 0x1a86e0) {
    return this.add.graphics({ x, y }).setScale(s)
      .fillStyle(color).fillPoints(TEAM_GEM, true)
      .fillStyle(dark).fillPoints([TEAM_GEM[0], TEAM_GEM[3], TEAM_GEM[4]], true)
      .lineStyle(2, 0xffffff, 0.95).strokePoints(TEAM_GEM, true);
  }

  // ป้ายสกุลเงินขวาบน (ไอคอนเป็น GIF เหมือนลอบบี้) + ปุ่ม +
  pill(cx, type, value) {
    const y = 22, w = 124, left = cx - w / 2, right = cx + w / 2;
    this.add.graphics().fillStyle(0x101a30, 0.92).fillRoundedRect(left, y - 14, w, 28, 14).lineStyle(2, 0x3a4a70).strokeRoundedRect(left, y - 14, w, 28, 14);
    addCurrencyGif(this, type, left + 17, y);
    // ตัวเลขชิดซ้ายถัดจากไอคอน (ไม่ทับ) และย่อขนาดอัตโนมัติถ้ายาวเกินช่องก่อนปุ่ม +
    const num = this.t(left + 35, y, Number(value).toLocaleString('en-US'), 15, type === 'gold' ? '#ffe066' : '#fff').setOrigin(0, 0.5);
    for (let s = 15; num.width > right - 28 - (left + 35) && s > 8;) num.setFontSize(--s);
    this.click(this.add.circle(right - 14, y, 11, 0x4ab34a), () => this.toast('ยังไม่เปิดให้ใช้งาน'));
    this.t(right - 14, y - 1, '+', 16);
  }

  woodBtn(x, y, w, fn) {
    this.add.graphics().fillStyle(0x3a2410).fillRoundedRect(x - w / 2, y - 12, w, 24, 8).fillStyle(0x8a5028).fillRoundedRect(x - w / 2 + 2, y - 10, w - 4, 20, 7);
    return this.click(this.add.rectangle(x, y, w, 24, 0xffffff, 0.001), fn);
  }

  setSort(i) {
    this.sortMode = i;
    this.sortText.setText(`จัดเรียง: ${TEAM_SORTS[i][0]} ▾`);
    this.refresh();
  }

  sortedKeys() {
    const f = TEAM_SORTS[this.sortMode][1];
    return f ? UNIT_KEYS.slice().sort((a, b) => (f(a) > f(b)) - (f(a) < f(b))) : UNIT_KEYS.slice();
  }

  // ภาพตัวละคร (สไปรต์เฟรมแรก หรือสี่เหลี่ยมถ้าไม่มีรูป) วางเท้าที่ feetY
  makePortrait(x, feetY, key, targetH) {
    const def = UNITS[key];
    if (def.sprite && this.textures.exists('unit_' + key)) {
      return this.add.sprite(x, feetY, 'unit_' + key, def.sprite.walk[0]).setOrigin(0.5, 122 / 128).setScale(targetH / def.sprite.frameHeight);
    }
    const f = targetH / 48, h = def.size * 1.6 * f;
    return this.add.rectangle(x, feetY - h / 2, def.size * f, h, def.color).setStrokeStyle(2, 0x0b3d91);
  }

  // รูปที่กดลากได้ (from = ช่องในทีม หรือ -1 ถ้ามาจากรายการ)
  draggable(portrait, key) {
    return this.click(portrait, p => {
      p.event?.stopPropagation();
      this.startDrag(p, key, SAVE.team.indexOf(key), portrait);
    });
  }

  // ---------- สร้างหน้าจอ ----------
  refresh() {
    const team = SAVE.team;
    this.infoText.setText(`ทีม : ${team.length}/${TEAM_SIZE}   ·   พลังงานรวม ${team.reduce((s, k) => s + UNITS[k].cost, 0)}`);
    this.buildSlots();
    this.buildCards();
  }

  // แท่นยืน: รูปทรงกระบอก ขอบสีตามเกรด แถบดำมีดาเกรด
  pedestal(x, rim, top, band, tex) {
    const y = this.padY, k = this.ps;
    if (this.textures.exists(tex)) {
      const img = this.add.image(x, y, tex).setOrigin(0.5, TEAM_PED_ORIGIN_Y);
      return img.setScale(TEAM_PED_W * k / img.width);
    }
    return this.add.graphics()
      .fillStyle(0x000000, 0.22).fillEllipse(x, y + 32 * k, 136 * k, 26 * k)
      .fillStyle(band).fillRect(x - 60 * k, y, 120 * k, 24 * k).fillEllipse(x, y + 24 * k, 120 * k, 30 * k)
      .fillStyle(rim).fillEllipse(x, y, 124 * k, 36 * k)
      .fillStyle(top).fillEllipse(x, y - k, 106 * k, 27 * k);
  }

  buildSlots() {
    this.slotLayer.removeAll(true);
    const y = this.padY, k = this.ps;
    this.slotX.forEach((x, i) => {
      const key = SAVE.team[i];
      if (!key) {
        this.slotLayer.add([
          this.pedestal(x, 0xb9c0cc, 0xdfe4ea, 0x6c7685, 'team_ped_empty'),
          this.t(x, y - 34 * k, '+', Math.round(44 * k), '#aab3c2'),
          this.t(x, y + 52 * k, 'ลากมาวางที่นี่', Math.round(13 * k), '#8c7a58', { fontStyle: 'normal' }),
        ]);
        return;
      }
      const def = UNITS[key], g = teamGrade(key);
      const rim = g >= 4 ? 0xf0b429 : g === 3 ? 0xd24fb8 : 0x5b8bd6;
      this.slotLayer.add([
        this.pedestal(x, rim, 0xefe3c4, 0x1b1b24, g >= 4 ? 'team_ped_gold' : g === 3 ? 'team_ped_purple' : 'team_ped_blue'),
        this.draggable(this.makePortrait(x, y - 2 * k, key, TEAM_PORTRAIT_H * k), key),
        this.add.circle(x - 52 * k, y - 12 * k, 11 * k, ELEMENTS[def.element].color || 0x888888).setStrokeStyle(2, 0xffffff),
        this.t(x - 52 * k, y - 12 * k, ELEMENTS[def.element].icon, Math.round(12 * k), '#fff', { fontStyle: 'normal' }),
        this.t(x, y + 15 * k, '★'.repeat(g), Math.round(14 * k), '#ffd23f', { stroke: '#3a2410', strokeThickness: 3 }),
        this.gem(x - 26 * k, y + 52 * k, 0.8 * k),
        this.t(x - 12 * k, y + 52 * k, String(def.cost), Math.round(19 * k), '#fff', { stroke: '#3a2410', strokeThickness: 4 }).setOrigin(0, 0.5),
      ]);
    });
  }

  // เส้นประแนวนอน (เส้นคั่นในการ์ด)
  dashes(g, x0, x1, y) {
    for (let x = x0; x < x1; x += 5) g.lineBetween(x, y, Math.min(x + 3, x1), y);
  }

  // การ์ดตัวละคร: วาดที่ขนาดออกแบบ 182x132 ใน container แล้วย่อสเกลให้พอดีพื้นที่ 1/3 ล่าง
  // ซ้าย = รูปตัวละครในกรอบเข้ม / ขวา = ชื่อ, เลเวล, ราคา (เส้นประคั่น) / ดาเกรดอยู่กลางขอบบน
  buildCards() {
    this.listLayer.removeAll(true);
    const w = TEAM_CARD_W, h = TEAM_CARD_H;
    this.sortedKeys().forEach((key, n) => {
      const def = UNITS[key], lv = SAVE.levels[key] || 1, g = teamGrade(key), inTeam = SAVE.team.includes(key);
      const hi = g >= 4;   // เกรดสูง = การ์ดกรมท่าขอบฟ้า / ปกติ = ม่วงขอบทอง
      const [fill, border, inset, star, nameCol] = hi ? [0x1c2547, 0x2fd0c0, 0x10173a, '#5fe8e0', '#d7def5'] : [0x6a2fa8, 0xf0b429, 0x4a1f7e, '#ffd23f', '#ffffff'];
      // พิกัดภายใน container: จุดกึ่งกลางการ์ด = (0,0)
      const cx = 0, cy = 0, L = -w / 2, T = -h / 2, R = w / 2;
      const colL = L + 90, colM = (colL + R - 8) / 2;   // คอลัมน์ขวา: ชื่อ/เลเวล/ราคา
      const info = this.add.circle(R - 15, T + 17, 10, hi ? 0x3a4a90 : 0x4a1f7e).setStrokeStyle(2, 0xffffff, 0.85);
      this.click(info, p => {
        p.event?.stopPropagation();
        this.scene.start('character', { sel: UNIT_KEYS.indexOf(key), from: 'team' });
      });

      const tex = hi ? 'team_card_high' : 'team_card_normal';
      const card = this.textures.exists(tex) ? this.add.image(cx, cy, tex).setDisplaySize(w, h) : this.add.graphics()
        .fillStyle(0x000000, 0.3).fillRoundedRect(L, T + 4, w, h, 12)
        .fillStyle(border).fillRoundedRect(L, T, w, h, 12)
        .fillStyle(fill).fillRoundedRect(L + 3, T + 3, w - 6, h - 6, 10)
        .fillStyle(0xffffff, 0.1).fillRoundedRect(L + 3, T + 3, w - 6, 34, { tl: 10, tr: 10, bl: 0, br: 0 })
        .fillStyle(inset).fillRoundedRect(L + 8, T + 24, 74, h - 32, 8)
        .lineStyle(1, 0xffffff, 0.35);
      const lines = this.add.graphics().lineStyle(1, 0xffffff, 0.4);
      this.dashes(lines, colL, R - 10, T + 62);
      this.dashes(lines, colL, R - 10, T + 90);
      const items = [
        card, lines,
        this.add.graphics().fillStyle(border).fillRoundedRect(cx - 34, T - 2, 68, 20, 8).fillStyle(0x140c24, 0.92).fillRoundedRect(cx - 32, T, 64, 17, 7),   // ป้ายดาเกรดบนขอบการ์ด
        this.t(cx, T + 9, '★'.repeat(g), 13, star, { stroke: '#1a1030', strokeThickness: 2 }),
        info,
        this.t(R - 15, T + 16, 'i', 13),
        this.draggable(this.makePortrait(L + 45, T + h - 28, key, 66), key),   // ลากได้เฉพาะรูปตัวละคร
        this.add.circle(L + 20, T + 38, 9, ELEMENTS[def.element].color || 0x888888).setStrokeStyle(2, 0xffffff),
        this.t(L + 20, T + 38, ELEMENTS[def.element].icon, 10, '#fff', { fontStyle: 'normal' }),
        this.t(L + 70, T + 38, TYPES[def.type].icon, 11, '#fff', { fontStyle: 'normal' }),
        this.t(colM - 4, T + 45, def.name, 15, nameCol),
        this.t(colM - 4, T + 76, `Lv. ${lv}/${MAX_LEVEL}`, 13, '#c9d0ee'),
        this.gem(colL + 8, T + 108, 0.8),
        this.t(R - 12, T + 108, String(def.cost), 18, '#fff', { stroke: '#1a1030', strokeThickness: 4 }).setOrigin(1, 0.5),
      ];
      if (inTeam) {
        items.push(this.add.graphics().fillStyle(0x38b04a).fillRoundedRect(L + 17, T + h - 24, 56, 14, 6), this.t(L + 45, T + h - 17, 'ในทีม', 10));
      }
      const cardC = this.add.container(12 + (w * this.cardK) / 2 + n * this.cardStep, this.cardCY, items).setScale(this.cardK);
      this.listLayer.add(cardC);
    });
    this.scrollList(this.listLayer.x);
  }

  // ---------- เลื่อนรายการ ----------
  scrollList(x) {
    this.listLayer.x = Phaser.Math.Clamp(x, this.minX, 0);
    const scrollable = this.minX < 0;
    this.track.setVisible(scrollable);
    this.thumb.setVisible(scrollable);
    if (scrollable) {
      const total = -this.minX + W, w = (W - 24) * W / total;
      this.thumb.setSize(w, 5).setX(12 + (W - 24 - w) * (-this.listLayer.x / -this.minX));
    }
  }

  onDown(p) {
    if (this.drag || p.y < this.listTop) return;
    Object.assign(this.scroll, { on: true, moved: false, x0: p.x, l0: this.listLayer.x });
  }

  onMove(p) {
    if (this.drag) {
      this.drag.obj.setPosition(p.x, p.y);
      const slot = this.slotAt(p.x, p.y);
      this.slotGlow.setVisible(slot >= 0).setX(this.slotX[Math.max(0, slot)]);
      return;
    }
    const s = this.scroll;
    if (!p.isDown || !s.on || this.minX >= 0) return;
    if (Math.abs(p.x - s.x0) > 8) s.moved = true;
    if (s.moved) this.scrollList(s.l0 + p.x - s.x0);
  }

  onUp(p, outside = false) {
    this.scroll.on = false;
    if (this.drag) this.finishDrag(p, outside);
  }

  // ---------- ลาก & วาง ----------
  startDrag(p, key, from, src) {
    if (this.drag) return;
    const obj = this.makePortrait(p.x, p.y, key, 90).setDepth(2000).setAlpha(0.85);
    src.setAlpha(0.3);   // ตัวต้นทางจางลงระหว่างลาก (ยังไม่แตะ SAVE จนกว่าจะปล่อย)
    this.drag = { key, from, obj };
    this.toast('ลากไปวางบนแท่น');
  }

  // คำนวณทีมใหม่หลังวาง (ไม่แก้ของเดิม)
  //   slot  = ช่องแท่นที่วาง (-1 = ไม่ได้วางบนแท่น), toList = ปล่อยที่พื้นที่รายการด้านล่าง
  //   from  = ช่องเดิมในทีม (-1 = ลากมาจากรายการ)
  moveUnit(team, key, from, slot, toList) {
    team = team.slice();
    if (slot >= 0) {
      if (from >= 0) {   // ลากจากแท่น: ช่องมีตัวอยู่ = สลับที่, ช่องว่าง = ไปต่อท้ายทีม
        if (slot < team.length) [team[from], team[slot]] = [team[slot], team[from]];
        else { team.splice(from, 1); team.push(key); }
      } else if (slot < team.length) {   // ลากจากรายการ: วางทับตัวเดิม / เติมช่องว่าง
        team[slot] = key;
      } else {
        team.push(key);
      }
    } else if (from >= 0 && toList && team.length > 1) {
      team.splice(from, 1);   // ลากลงรายการ = เอาออกจากทีม (เหลืออย่างน้อย 1 ตัว)
    }
    return team.filter((k, i) => team.indexOf(k) === i).slice(0, TEAM_SIZE);
  }

  finishDrag(p, cancel) {
    const { key, from, obj } = this.drag;
    obj.destroy();
    this.drag = null;
    this.slotGlow.setVisible(false);
    if (!cancel) {
      const next = this.moveUnit(SAVE.team, key, from, this.slotAt(p.x, p.y), p.y >= this.listTop);
      if (next.join() !== SAVE.team.join()) { SAVE.team = next; writeSave(); }
    }
    this.refresh();
  }

  // ช่องแท่นที่ใกล้ตำแหน่งที่สุด (ห่างไม่เกิน 60) หรือ -1
  slotAt(x, y) {
    if (y < 75 || y > this.barY - 14) return -1;
    let best = -1, dist = 60 * this.ps;
    this.slotX.forEach((sx, i) => { if (Math.abs(x - sx) < dist) { dist = Math.abs(x - sx); best = i; } });
    return best;
  }

  toast(message) {
    this.toastText.setText(message).setAlpha(1);
    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1400, duration: 500 });
  }
}