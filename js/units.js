// =====================================================================
//  units.js — ประเภท / ธาตุ / ข้อมูลยูนิต (เพิ่มหรือแก้ตัวละครที่ไฟล์นี้)
// =====================================================================
// ---------------------------------------------------------------------
//  ประเภทยูนิต (กำหนดตำแหน่งยืนในสนาม: rank ยิ่งน้อยยิ่งยืนหน้า)
//    พลัง     = แท้งค์ ยืนหน้าสุด
//    ไหวพริบ  = สายใช้สกิล ยืนกลางแถว
//    ว่องไว   = สายตีธรรมดา ยืนหลังสุด
// ---------------------------------------------------------------------
const TYPES = {
  power: { name: 'พลัง',    icon: '🛡', rank: 0, desc: 'ยืนหน้าสุด คอยรับดาเมจ' },
  wit:   { name: 'ไหวพริบ', icon: '✨', rank: 1, desc: 'ยืนกลางแถว ใช้สกิล' },
  agile: { name: 'ว่องไว',   icon: '🏹', rank: 2, desc: 'ยืนหลังสุด ตีธรรมดา' },
};
const FORMATION_HOLD = false;          // true = ยูนิตที่ล้ำหน้าตำแหน่งแถวของตัวเองจะหยุดรอเฉยๆ
const FORMATION_AHEAD_SPEED = 0.3;     // false (ค่าเริ่มต้น) = ยังเดินต่อแต่ช้าลงเหลือสัดส่วนนี้ ให้ตัวหน้าแซงไปก่อน แล้วค่อยเข้าแถว
const FORMATION_GAP = 30;   // ระยะห่างระหว่างแถว (พิกเซล) ยูนิตประเภทเดียวกันซ้อนกันได้

// ---------------------------------------------------------------------
//  ธาตุ: ไฟ > ไม้ > น้ำ > ไฟ  (ชนะทาง x1.5, แพ้ทาง x0.75)
// ---------------------------------------------------------------------
const ELEMENTS = {
  fire:  { name: 'ไฟ',  icon: '🔥', color: 0xff6a3d, beats: 'wood'  },
  wood:  { name: 'ไม้', icon: '🌿', color: 0x4caf50, beats: 'water' },
  water: { name: 'น้ำ', icon: '💧', color: 0x3aa7ff, beats: 'fire'  },
};
const ELEM_ADV = 1.5, ELEM_DIS = 0.75;
const elemMult = (att, def) => ELEMENTS[att].beats === def ? ELEM_ADV : (ELEMENTS[def].beats === att ? ELEM_DIS : 1);

// ---------------------------------------------------------------------
//  ข้อมูลยูนิต
//  type = ประเภท (power / wit / agile)   element = ธาตุ (fire / wood / water)
//  skill (เฉพาะสายไหวพริบ):
//    kind 'aoe'  = ระเบิดดาเมจเป็นวง  (ดาเมจ = dmg x power, ครอบคลุม radius พิกเซล)
//    kind 'heal' = ฟื้นเลือดเพื่อนรอบตัว (ฟื้น power x เลเวลบัฟ, ครอบคลุม radius)
//    kind 'buff' = เพิ่มดาเมจเพื่อนรอบตัว (คูณ power นาน duration มิลลิวินาที, ใช้ตอนเจอศัตรูในระยะ)
//  sprite: ใส่ไฟล์ภาพของคุณเองที่นี่ ถ้าไม่มีไฟล์ เกมจะใช้สี่เหลี่ยมแทนอัตโนมัติ
//    file   = ที่อยู่ไฟล์ spritesheet (ขนาดภาพเท่าไหร่ก็ได้ เกมคำนวณขนาดเฟรมให้เองจาก cols/rows)
//    cols   = จำนวนเฟรมต่อ 1 แถว (ปกติ 8)    rows = จำนวนแถว (2 = แถวบนฝั่งเรา แถวล่างฝั่งศัตรู / 1 = มีแถวเดียว)
//    walk   = [เฟรมแรก, เฟรมสุดท้าย] ของท่าเดิน (นับจากซ้ายไปขวา บนลงล่าง เริ่มที่ 0)
//    attack = [เฟรมแรก, เฟรมสุดท้าย] ของท่าโจมตี
//    height = ความสูง 1 เฟรมบนจอเกม (พิกเซล) ปรับขนาดตัวละครที่ตัวนี้ ไม่ต้องย่อภาพเอง
//    frameWidth / frameHeight = (ไม่บังคับ) ระบุขนาดเฟรมเองเมื่อภาพมีขอบเกิน คำนวณจาก cols/rows ไม่ตรง
//    enemyOffset = (ไม่บังคับ) เกมใช้ = cols อัตโนมัติเมื่อ rows >= 2 ถ้าไม่มีแถวศัตรู ศัตรูจะใช้เฟรมชุดเดียวกับฝั่งเรา แล้วกลับด้านให้
//  ภาพควรหันหน้าไปทางขวา (ศัตรูจะถูกกลับด้านให้เอง)
// ---------------------------------------------------------------------
const UNITS = {
  warrior: { name: 'นักรบ',   type: 'power', element: 'fire',  cost: 20, hp: 100, dmg: 10, range: 36,  speed: 60, cd: 700,  color: 0xff7a59, size: 18,
             sprite: { file: 'assets/warrior.png', cols: 8, rows: 2, walk: [0, 3], attack: [4, 7], height: 52 } },
  archer:  { name: 'นักธนู', type: 'agile', element: 'wood',  cost: 30, hp: 60,  dmg: 8,  range: 150, speed: 50, cd: 900,  color: 0x9be37e, size: 14,
             sprite: { file: 'assets/archer.png', cols: 8, rows: 2, walk: [0, 3], attack: [4, 7], height: 52 } },
  tank:    { name: 'แทงค์',  type: 'power', element: 'wood',  cost: 50, hp: 260, dmg: 14, range: 40,  speed: 35, cd: 1100, color: 0x4caf50, size: 24,
             sprite: { file: 'assets/tank.png', cols: 8, rows: 2, walk: [0, 3], attack: [4, 7], height: 68 } },
  mage:    { name: 'นักเวทย์', type: 'wit',  element: 'fire',  cost: 40, hp: 70,  dmg: 10, range: 130, speed: 45, cd: 1200, color: 0xffa94d, size: 15,
             skill: { kind: 'aoe',  name: 'ลูกไฟระเบิด', cd: 4500, power: 2.5, radius: 60,  desc: 'ระเบิดใส่ศัตรูเป็นวงกว้าง' } ,
             sprite: { file: 'assets/mage.png', cols: 8, rows: 2, walk: [0, 3], attack: [4, 7], height: 52 } },
  healer:  { name: 'นักบวช',  type: 'wit',   element: 'water', cost: 40, hp: 80,  dmg: 4,  range: 100, speed: 45, cd: 1200, color: 0x5ec8ff, size: 15,
             skill: { kind: 'heal', name: 'น้ำพุรักษา',  cd: 5000, power: 40,  radius: 110, desc: 'ฟื้นเลือดเพื่อนรอบตัว' } ,
             sprite: { file: 'assets/healer.png', cols: 8, rows: 2, walk: [0, 3], attack: [4, 7], height: 52 } },
  sniper:  { name: 'ซุ่มยิง',  type: 'agile', element: 'water', cost: 45, hp: 45,  dmg: 22, range: 220, speed: 40, cd: 1800, color: 0x2f6fe0, size: 13 , sprite: { file: 'assets/sniper.png', cols: 8, rows: 2, walk: [0, 3], attack: [4, 7], height: 52 } },
  knight:  { name: 'อัศวิน',  type: 'power', element: 'water', cost: 35, hp: 180, dmg: 11, range: 38,  speed: 45, cd: 900,  color: 0x3aa7ff, size: 20,
             sprite: { file: 'assets/knight.png', cols: 8, rows: 2, walk: [0, 3], attack: [4, 7], height: 52 } },
  druid:   { name: 'ดรูอิด',  type: 'wit',   element: 'wood',  cost: 40, hp: 75,  dmg: 6,  range: 110, speed: 45, cd: 1200, color: 0x8bd450, size: 15,
             skill: { kind: 'buff', name: 'พรแห่งป่า', cd: 6000, power: 1.3, radius: 110, duration: 4000, desc: 'เพิ่มดาเมจเพื่อนรอบตัว +30% นาน 4 วิ' } ,
             sprite: { file: 'assets/druid.png', cols: 8, rows: 2, walk: [0, 3], attack: [4, 7], height: 52 } },
  gunner:  { name: 'นักปืนไฟ', type: 'agile', element: 'fire',  cost: 35, hp: 55,  dmg: 12, range: 170, speed: 48, cd: 650,  color: 0xff9a3c, size: 14 , sprite: { file: 'assets/gunner.png', cols: 8, rows: 2, walk: [0, 3], attack: [4, 7], height: 52 } },
};
const UNIT_KEYS = Object.keys(UNITS);
const FONT = 'Sarabun, Tahoma, sans-serif';