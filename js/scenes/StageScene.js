// ---------- หน้าเลือกด่าน (สไตล์ Line Rangers): กด "เริ่ม" ในลอบบี้แล้วมาที่นี่ ----------
const STAGE_COUNT = 20;
const STAGE_MODES = [
  { id: 'normal', name: 'NORMAL', mult: 1 },
  { id: 'hard', name: 'HARD', mult: 2 },
  { id: 'extreme', name: 'EXTREME', mult: 3.5 },
];
const STAGE_REGIONS = [[3, 'ทุ่งเริ่มต้น'], [11, 'ป่าลึกลับ'], [17, 'สวนสนุกแห่งความมืด']];   // [ด่านที่ป้ายอยู่ใกล้, ชื่อ]

// ความคืบหน้า: จำนวนด่านที่ผ่านแล้วของแต่ละระดับ (เก็บแยกจากเซฟหลัก ไม่ต้องแก้ save.js)
const STAGE_SAVE_KEY = 'miniLaneRangers.stage.v1';
const STAGE_PROGRESS = { normal: 0, hard: 0, extreme: 0 };
try {
  const d = JSON.parse(localStorage.getItem(STAGE_SAVE_KEY)) || {};
  for (const m of STAGE_MODES) if (Number.isInteger(d[m.id])) STAGE_PROGRESS[m.id] = Math.max(0, Math.min(STAGE_COUNT, d[m.id]));
} catch (e) { /* ไม่มีเซฟก็เริ่มที่ด่าน 1 */ }

function markStageCleared(mode, n) {
  if (n <= STAGE_PROGRESS[mode]) return;
  STAGE_PROGRESS[mode] = Math.min(STAGE_COUNT, n);
  try { localStorage.setItem(STAGE_SAVE_KEY, JSON.stringify(STAGE_PROGRESS)); } catch (e) {}
}

// ---------- เลเวลผู้เล่น: ได้ EXP จากการผ่านด่าน (ยิ่งด่าน/ระดับยากยิ่งได้มาก) เลเวลอัปแจกเพชร ----------
const PLAYER_SAVE_KEY = 'miniLaneRangers.player.v1';
const PLAYER = { level: 1, exp: 0 };   // exp = EXP สะสมในเลเวลปัจจุบัน
try {
  const d = JSON.parse(localStorage.getItem(PLAYER_SAVE_KEY)) || {};
  if (Number.isInteger(d.level) && d.level >= 1) PLAYER.level = Math.min(d.level, 99);
  if (Number.isFinite(d.exp) && d.exp >= 0) PLAYER.exp = d.exp;
} catch (e) { /* ไม่มีเซฟก็เริ่มเลเวล 1 */ }

const PLAYER_MAX_LEVEL = 99;                                      // เลเวลสูงสุดของผู้เล่น
const PLAYER_REPLAY_EXP = 0.25;                                   // เล่นด่านที่เคยผ่านแล้วได้ EXP กี่ส่วน (กันฟาร์ม)
const playerExpNeed = lv => 60 + 40 * (lv - 1);                   // EXP ที่ต้องใช้เลื่อนจาก lv -> lv+1
const levelUpGems = lv => 10 + 5 * Math.floor(lv / 5);            // เพชรที่ได้เมื่อขึ้นเลเวล lv (ทุก 5 เลเวลได้เพิ่ม)
const stageExp = (mode, n) => {                                   // EXP ผ่านด่านครั้งแรก
  const m = STAGE_MODES.find(x => x.id === mode) || STAGE_MODES[0];
  return Math.round(25 * (1 + 0.2 * (n - 1)) * m.mult * (n % 5 === 0 ? 1.5 : 1));
};

// เพิ่ม EXP แล้วเลื่อนเลเวล: คืน { exp, ups, gems } (เพชรให้ผู้เรียกบวกเข้า SAVE.gems)
function addPlayerExp(amount) {
  PLAYER.exp += Math.max(0, amount);
  let ups = 0, gems = 0;
  while (PLAYER.level < PLAYER_MAX_LEVEL && PLAYER.exp >= playerExpNeed(PLAYER.level)) {
    PLAYER.exp -= playerExpNeed(PLAYER.level);
    gems += levelUpGems(++PLAYER.level);
    ups++;
  }
  if (PLAYER.level >= PLAYER_MAX_LEVEL) PLAYER.exp = 0;   // เลเวลเต็มแล้วไม่สะสม EXP ต่อ
  try { localStorage.setItem(PLAYER_SAVE_KEY, JSON.stringify(PLAYER)); } catch (e) {}
  return { exp: amount, ups, gems };
}

const stageModeUnlocked = i => i === 0 || STAGE_PROGRESS[STAGE_MODES[i - 1].id] >= STAGE_COUNT;   // ระดับถัดไปเปิดเมื่อผ่านครบทุกด่านของระดับก่อนหน้า

// ค่าความยากของด่าน (ปรับบาลานซ์ที่นี่): power = เลือด/ดาเมจศัตรู, aiDelay = เวลารอเรียกตัวของศัตรู (น้อย = ถี่)
function stageInfo(mode, n) {
  const m = STAGE_MODES.find(x => x.id === mode) || STAGE_MODES[0], boss = n % 5 === 0;
  const grow = 1 + 0.12 * (n - 1), gold = 1 + 0.15 * (n - 1);
  return {
    n, mode, boss,
    power: +(m.mult * grow * (boss ? 1.4 : 1)).toFixed(2),
    baseHp: Math.round(BASE_HP * (1 + 0.3 * (n - 1)) * (boss ? 1.3 : 1) * (m.mult > 1 ? 1.5 : 1)),
    aiDelay: Math.max(0.45, 1 - 0.03 * (n - 1)) * (boss ? 0.8 : 1),
    regen: (1 + 0.05 * (n - 1)) * (1 + (m.mult - 1) * 0.3),
    reward: Math.round(REWARD_WIN * gold * m.mult),
    lose: Math.round(REWARD_LOSE * gold * m.mult),
    kill: Math.round(REWARD_PER_KILL * m.mult),
  };
}

class StageScene extends Phaser.Scene {
  constructor() { super('stage'); }

  create(data) {
    this.mode = STAGE_MODES.some(m => m.id === data?.mode) ? data.mode : 'normal';
    this.prog = STAGE_PROGRESS[this.mode];
    this.sel = Math.max(1, Math.min(this.prog + 1, STAGE_COUNT, data?.stage || this.prog + 1));   // เปิดที่ด่านล่าสุดที่เล่นได้
    this.pos = this.nodePositions();

    this.drawMap();
    this.pos.forEach((p, i) => this.drawNode(i + 1, p));

    // ตัวละครของเรายืนข้างด่านที่เลือก + วงเรืองแสงรอบด่าน
    const lead = SAVE.team[0] || UNIT_KEYS[0], p0 = this.pos[this.sel - 1];
    this.glow = this.add.circle(p0.x, p0.y, 24).setStrokeStyle(4, 0xfff176).setDepth(5);
    this.tweens.add({ targets: this.glow, scale: 1.18, alpha: 0.6, duration: 600, yoyo: true, repeat: -1 });
    this.marker = unitPortrait(this, p0.x - 28, p0.y + 10, lead, 48).setDepth(6);
    this.tweens.add({ targets: this.marker, y: '-=4', duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // แถบบน: ปุ่มกลับ ชื่อหน้า เพชร/ทอง
    this.click(this.add.circle(30, 28, 19, 0xffd23f).setStrokeStyle(3, 0x1a1a1a).setDepth(10), () => this.scene.start('lobby'));
    this.t(30, 28, '◀', 18, '#1a1a1a').setDepth(11);
    this.t(58, 28, 'สเตจหลัก', 34, '#4cc2ff', { stroke: '#0b3d91', strokeThickness: 7 }).setOrigin(0, 0.5).setDepth(10);
    this.pill(W - 240, 'gem', SAVE.gems || 0);
    this.pill(W - 115, 'gold', Math.floor(SAVE.gold || 0));

    // แท็บระดับความยาก (ซ้ายล่าง)
    STAGE_MODES.forEach((m, i) => {
      const x = 56 + i * 94, on = m.id === this.mode, open = stageModeUnlocked(i);
      const bg = this.add.graphics().setDepth(10)
        .fillStyle(0x1a1a1a).fillRoundedRect(x - 46, 396, 92, 38, 8)
        .fillStyle(on ? 0xffd23f : 0x6b7280).fillRoundedRect(x - 43, 399, 86, 32, 6);
      this.click(this.add.rectangle(x, 415, 92, 38, 0xffffff, 0.001).setDepth(11), () => {
        if (open) this.scene.restart({ mode: m.id });
        else this.toast(`ผ่านครบทุกด่านของ ${STAGE_MODES[i - 1].name} ก่อน`);
      });
      this.t(x, 415, (open ? '' : '🔒 ') + m.name, 14, on ? '#4a2c00' : '#e5e7eb').setDepth(12);
    });

    // แผงข้อมูลด่าน + ปุ่มเริ่ม (ขวาล่าง)
    this.add.graphics().setDepth(10)
      .fillStyle(0x0b1424, 0.55).fillRoundedRect(394, 396, 398, 48, 10)
      .fillStyle(0x14233b, 0.95).fillRoundedRect(392, 392, 398, 48, 10).lineStyle(2, 0x5b7bbd).strokeRoundedRect(392, 392, 398, 48, 10);
    this.infoTitle = this.t(406, 408, '', 17, '#fff').setOrigin(0, 0.5).setDepth(11);
    this.infoSub = this.t(406, 428, '', 12, '#bcd0ff', { fontStyle: 'normal' }).setOrigin(0, 0.5).setDepth(11);
    this.add.graphics().setDepth(11)
      .fillStyle(0x0d5c2e).fillRoundedRect(676, 396, 106, 40, 10).fillStyle(0x2ecc71).fillRoundedRect(678, 398, 102, 36, 8)
      .fillStyle(0xffffff, 0.2).fillRoundedRect(678, 398, 102, 14, { tl: 8, tr: 8, bl: 0, br: 0 });
    this.click(this.add.rectangle(729, 416, 106, 40, 0xffffff, 0.001).setDepth(13), () => this.start());
    this.t(729, 416, 'เริ่ม ▶', 20, '#fff', { stroke: '#0d5c2e', strokeThickness: 4 }).setDepth(12);
    this.toastText = this.t(W / 2, 80, '', 17, '#fff', { backgroundColor: '#000000cc', padding: { x: 12, y: 6 } }).setAlpha(0).setDepth(1000);

    const kb = this.input.keyboard;
    kb.on('keydown-ENTER', () => this.start());
    kb.on('keydown-ESC', () => this.scene.start('lobby'));
    kb.on('keydown-LEFT', () => this.select(Math.max(1, this.sel - 1)));
    kb.on('keydown-RIGHT', () => this.select(Math.min(this.prog + 1, STAGE_COUNT, this.sel + 1)));
    this.showInfo();
  }

  // ---------- ตัวช่วย ----------
  t(x, y, s, size, color = '#fff', style = {}) {
    return this.add.text(x, y, s, { fontFamily: FONT, fontSize: size + 'px', color, fontStyle: 'bold', ...style }).setOrigin(0.5);
  }

  click(obj, fn) { return obj.setInteractive({ useHandCursor: true }).on('pointerdown', fn); }

  pill(cx, type, value) {
    this.add.rectangle(cx, 22, 106, 26, 0x101a30, 0.92).setStrokeStyle(2, 0x3a4a70).setDepth(10);
    if (type === 'gem') {
      const P = [{ x: -10, y: -4 }, { x: -5, y: -11 }, { x: 5, y: -11 }, { x: 10, y: -4 }, { x: 0, y: 12 }];
      this.add.graphics({ x: cx - 36, y: 22 }).setScale(0.9).setDepth(11).fillStyle(0xff4d6d).fillPoints(P, true).lineStyle(2, 0xffffff, 0.9).strokePoints(P, true);
    } else {
      this.add.circle(cx - 36, 22, 10, 0xffb300).setStrokeStyle(2, 0xfff2a0).setDepth(11);
    }
    this.t(cx - 2, 22, Number(value).toLocaleString('en-US'), 14, type === 'gold' ? '#ffe066' : '#fff').setDepth(11);
  }

  toast(message) {
    this.toastText.setText(message).setAlpha(1);
    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1400, duration: 500 });
  }

  // ---------- แผนที่ ----------
  // ตำแหน่งด่านเรียงเป็นงูเลื้อย 3 แถว: ล่าง (ซ้าย→ขวา) → กลาง (ขวา→ซ้าย) → บน (ซ้าย→ขวา)
  nodePositions() {
    const rows = [7, 7, STAGE_COUNT - 14], ys = [338, 236, 134], out = [];
    rows.forEach((count, r) => {
      for (let k = 0; k < count; k++) {
        const t = k / Math.max(1, count - 1);
        out.push({ x: r % 2 ? 734 - t * 668 : 66 + t * 668, y: ys[r] + 16 * Math.sin(t * Math.PI * 2 + r * 1.3) });
      }
    });
    return out;
  }

  drawMap() {
    const g = this.add.graphics();
    g.fillStyle(0x1f7a45).fillRect(0, 0, W, H)
      .fillStyle(0x2a86d6).fillEllipse(170, 30, 560, 160).fillStyle(0x4aa3e8).fillEllipse(150, 22, 420, 90)   // แม่น้ำมุมซ้ายบน
      .fillStyle(0x86d84e).fillEllipse(230, 300, 580, 330).fillStyle(0xa4e86a).fillEllipse(210, 312, 400, 210)   // ทุ่งหญ้า
      .fillStyle(0x145c33).fillEllipse(640, 240, 430, 400).fillStyle(0x0f4a28).fillEllipse(660, 250, 300, 280)   // ป่าทึบ
      .fillStyle(0x2a86d6).fillEllipse(640, 392, 170, 64).fillStyle(0x4aa3e8).fillEllipse(630, 388, 110, 34);   // สระน้ำ

    // เส้นทางดินผ่านทุกด่าน (มีโค้งกลับตัวที่ปลายแถว)
    const pts = this.pos.map(p => new Phaser.Math.Vector2(p.x, p.y));
    [13, 6].forEach(i => {
      const dir = i === 6 ? 1 : -1;
      pts.splice(i + 1, 0, new Phaser.Math.Vector2(pts[i].x + dir * 38, (pts[i].y + pts[i + 1].y) / 2));
    });
    pts.unshift(new Phaser.Math.Vector2(20, 372));
    const curve = new Phaser.Curves.Spline(pts);
    g.lineStyle(34, 0x5a3418).strokePoints(curve.getPoints(160))
      .lineStyle(28, 0x8a5a2e).strokePoints(curve.getPoints(160))
      .lineStyle(18, 0xa8733c).strokePoints(curve.getPoints(160));
    const road = curve.getPoints(160);

    // ต้นไม้/หินกระจายนอกเส้นทาง (สุ่มแบบคงที่ ไม่เปลี่ยนทุกครั้งที่เปิด)
    let seed = 12345;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const free = (x, y, r) => !road.some(q => Math.hypot(q.x - x, q.y - y) < r) && !this.pos.some(q => Math.hypot(q.x - x, q.y - y) < r + 14);
    const items = [];
    for (let i = 0; i < 160 && items.length < 46; i++) {
      const x = 14 + rnd() * 772, y = 64 + rnd() * 370;
      if (free(x, y, 34) && !(y > 385 && x < 300) && !(y > 385 && x > 390)) items.push([x, y, rnd() < 0.15]);
    }
    items.sort((a, b) => a[1] - b[1]).forEach(([x, y, rock]) => {
      const deep = x > 400 || y < 150;
      if (rock) g.fillStyle(0x000000, 0.2).fillEllipse(x, y + 6, 30, 10).fillStyle(0xc9b48a).fillEllipse(x, y, 28, 18).fillStyle(0xe2d0a6).fillEllipse(x - 4, y - 3, 16, 9);
      else g.fillStyle(0x000000, 0.2).fillEllipse(x, y + 12, 28, 9).fillStyle(0x5a3a1c).fillRect(x - 3, y, 6, 12)
        .fillStyle(deep ? 0x0b3d1f : 0x2e8f3a).fillCircle(x, y - 6, 15).fillStyle(deep ? 0x1d7a3e : 0x58b84a).fillCircle(x - 4, y - 10, 10);
    });

    // ป้ายไม้ชื่อพื้นที่
    STAGE_REGIONS.forEach(([n, name]) => {
      const p = this.pos[n - 1], x = Phaser.Math.Clamp(p.x, 70, 730), y = p.y + (p.y > 200 ? 46 : -46);
      this.add.graphics().fillStyle(0x000000, 0.25).fillRoundedRect(x - 56, y - 10, 116, 26, 6)
        .fillStyle(0x4a2c12).fillRoundedRect(x - 58, y - 14, 116, 26, 6).fillStyle(0x8a5a2e).fillRoundedRect(x - 55, y - 11, 110, 20, 5);
      this.t(x, y - 2, name, 12, '#ffe9b0');
    });
  }

  drawNode(n, p) {
    const open = n <= this.prog + 1, cleared = n <= this.prog, boss = n % 5 === 0, r = boss ? 20 : 16;
    const fill = !open ? 0x8b8b8b : boss ? 0xc0392b : cleared ? 0xe8c88a : 0xffe08a;
    this.add.ellipse(p.x, p.y + 9, 40, 13, 0x000000, 0.3);
    const disc = this.add.circle(p.x, p.y, r, fill).setStrokeStyle(4, !open ? 0x555555 : boss ? 0x7a1010 : 0xb88a4a);
    this.add.circle(p.x, p.y, r - 6).setStrokeStyle(2, 0xffffff, 0.45);
    this.add.rectangle(p.x, p.y + r + 6, 34, 9, open ? 0xc0392b : 0x666666).setStrokeStyle(1, 0x000000, 0.3);
    if (!open) this.t(p.x, p.y, '🔒', 14);
    else if (boss) this.t(p.x, p.y, '👹', 20);
    else this.t(p.x, p.y, String(n), 16, '#5a3a08', { stroke: '#fff3c4', strokeThickness: 3 });
    if (cleared) {
      this.add.rectangle(p.x, p.y + r + 20, 20, 18, 0xffffff).setStrokeStyle(2, 0xb88a4a);
      this.t(p.x, p.y + r + 20, '✔', 14, '#27ae60');
    }
    this.click(disc, () => (open ? this.select(n) : this.toast('ต้องผ่านด่านก่อนหน้าก่อน')));
  }

  select(n) {
    if (n === this.sel) return;
    this.sel = n;
    const p = this.pos[n - 1];
    this.tweens.add({ targets: this.glow, x: p.x, y: p.y, duration: 200 });
    this.tweens.killTweensOf(this.marker);
    this.tweens.add({
      targets: this.marker, x: p.x - 28, y: p.y + 10, duration: 280, ease: 'Sine.easeInOut',
      onComplete: () => this.tweens.add({ targets: this.marker, y: '-=4', duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }),
    });
    this.showInfo();
  }

  showInfo() {
    const s = stageInfo(this.mode, this.sel);
    this.infoTitle.setText(`ด่าน ${s.n}${s.boss ? ' · บอส 👹' : ''}  ·  ${STAGE_MODES.find(m => m.id === this.mode).name}`);
    this.infoSub.setText(`ศัตรู ×${s.power.toFixed(1)}  ·  รางวัลชนะ ${s.reward.toLocaleString('en-US')} ทอง`);
  }

  start() { this.scene.start('game', { mode: this.mode, stage: this.sel }); }
}