// =====================================================================
//  units.js — ประเภท / ธาตุ / ข้อมูลตัวละคร (เพิ่มหรือแก้ตัวละครที่ไฟล์นี้)
// =====================================================================

// ประเภท = ตำแหน่งยืนในสนาม (rank น้อย = ยืนหน้า)
const TYPES = {
  power: { name: 'พลัง', icon: '🛡', rank: 0, desc: 'ยืนหน้าสุด คอยรับดาเมจ' },
  wit: { name: 'ไหวพริบ', icon: '✨', rank: 1, desc: 'ยืนกลางแถว ใช้สกิล' },
  agile: { name: 'ว่องไว', icon: '🏹', rank: 2, desc: 'ยืนหลังสุด ตีธรรมดา' }
};

// การเข้าแถว: GAP = ระยะห่างระหว่างแถว, HOLD = ตัวที่ล้ำหน้าแถวหยุดรอ, AHEAD_SPEED = ถ้าไม่หยุดรอจะเดินช้าลงเหลือสัดส่วนนี้
const FORMATION_GAP = 30;
const FORMATION_HOLD = false;
const FORMATION_AHEAD_SPEED = 0.3;

// ธาตุ: ไฟ > ไม้ > น้ำ > ไฟ (ชนะทาง x1.5, แพ้ทาง x0.75)
const ELEMENTS = {
  fire: { name: 'ไฟ', icon: '🔥', color: 0xff6a3d, beats: 'wood' },
  wood: { name: 'ไม้', icon: '🌿', color: 0x4caf50, beats: 'water' },
  water: { name: 'น้ำ', icon: '💧', color: 0x3aa7ff, beats: 'fire' }
};
const ELEM_ADV = 1.5;
const ELEM_DIS = 0.75;
const elemMult = (att, def) => (ELEMENTS[att].beats === def ? ELEM_ADV : ELEMENTS[def].beats === att ? ELEM_DIS : 1);

// ตัวละคร
//  grade   = เกรดตัวละคร 1-5 (จำนวนดาที่โชว์ในลอบบี้/หน้าทีม ค่าคงที่ ไม่เพิ่มตามเลเวล)
//  skill   = (เฉพาะสายไหวพริบ) kind: 'aoe' ระเบิดเป็นวง / 'heal' ฟื้นเลือดเพื่อน / 'buff' เพิ่มดาเมจเพื่อน
//  sprite  = file: ไฟล์ spritesheet, cols/rows: จำนวนเฟรมต่อแถว/จำนวนแถว (แถวล่าง = ฝั่งศัตรู),
//            walk/attack: [เฟรมแรก, เฟรมสุดท้าย], height: ความสูง 1 เฟรมบนจอ (พิกเซล)
//            (ไม่บังคับ) frameWidth/frameHeight ระบุขนาดเฟรมเอง, enemyOffset ระบุเฟรมเริ่มของฝั่งศัตรู
//            ไม่มีไฟล์ภาพ = ใช้สี่เหลี่ยมสี color/size แทนอัตโนมัติ
const UNITS = {
  warrior: { name: 'นักรบ', type: 'power', element: 'fire', grade: 2, cost: 20, hp: 100, dmg: 10, range: 36, speed: 60, cd: 700, color: 0xff7a59, size: 18,
    sprite: { file: 'assets/characters/warrior.png', cols: 8, rows: 2, walk: [0, 3], attack: [4, 7], height: 52 } },
  archer: { name: 'นักธนู', type: 'agile', element: 'wood', grade: 2, cost: 30, hp: 60, dmg: 8, range: 150, speed: 50, cd: 900, color: 0x9be37e, size: 14,
    sprite: { file: 'assets/characters/archer.png', cols: 8, rows: 2, walk: [0, 3], attack: [4, 7], height: 52 } },
  tank: { name: 'แทงค์', type: 'power', element: 'wood', grade: 3, cost: 50, hp: 260, dmg: 14, range: 40, speed: 35, cd: 1100, color: 0x4caf50, size: 24,
    sprite: { file: 'assets/characters/tank.png', cols: 8, rows: 2, walk: [0, 3], attack: [4, 7], height: 68 } },
  mage: { name: 'นักเวทย์', type: 'wit', element: 'fire', grade: 3, cost: 40, hp: 70, dmg: 10, range: 130, speed: 45, cd: 1200, color: 0xffa94d, size: 15,
    skill: { kind: 'aoe', name: 'ลูกไฟระเบิด', cd: 4500, power: 2.5, radius: 60, desc: 'ระเบิดใส่ศัตรูเป็นวงกว้าง' },
    sprite: { file: 'assets/characters/mage.png', cols: 8, rows: 2, walk: [0, 3], attack: [4, 7], height: 52 } },
  healer: { name: 'นักบวช', type: 'wit', element: 'water', grade: 3, cost: 40, hp: 80, dmg: 4, range: 100, speed: 45, cd: 1200, color: 0x5ec8ff, size: 15,
    skill: { kind: 'heal', name: 'น้ำพุรักษา', cd: 5000, power: 40, radius: 110, desc: 'ฟื้นเลือดเพื่อนรอบตัว' },
    sprite: { file: 'assets/characters/healer.png', cols: 8, rows: 2, walk: [0, 3], attack: [4, 7], height: 52 } },
  sniper: { name: 'ซุ่มยิง', type: 'agile', element: 'water', grade: 4, cost: 45, hp: 45, dmg: 22, range: 220, speed: 40, cd: 1800, color: 0x2f6fe0, size: 13,
    sprite: { file: 'assets/characters/sniper.png', cols: 8, rows: 2, walk: [0, 3], attack: [4, 7], height: 52 } },
  knight: { name: 'อัศวิน', type: 'power', element: 'water', grade: 4, cost: 35, hp: 180, dmg: 11, range: 38, speed: 45, cd: 900, color: 0x3aa7ff, size: 20,
    sprite: { file: 'assets/characters/knight.png', cols: 8, rows: 2, walk: [0, 3], attack: [4, 7], height: 52 } },
  druid: { name: 'ดรูอิด', type: 'wit', element: 'wood', grade: 4, cost: 40, hp: 75, dmg: 6, range: 110, speed: 45, cd: 1200, color: 0x8bd450, size: 15,
    skill: { kind: 'buff', name: 'พรแห่งป่า', cd: 6000, power: 1.3, radius: 110, duration: 4000, desc: 'เพิ่มดาเมจเพื่อนรอบตัว +30% นาน 4 วิ' },
    sprite: { file: 'assets/characters/druid.png', cols: 8, rows: 2, walk: [0, 3], attack: [4, 7], height: 52 } },
  gunner: { name: 'นักปืนไฟ', type: 'agile', element: 'fire', grade: 3, cost: 35, hp: 55, dmg: 12, range: 170, speed: 48, cd: 650, color: 0xff9a3c, size: 14,
    sprite: { file: 'assets/characters/gunner.png', cols: 8, rows: 2, walk: [0, 3], attack: [4, 7], height: 52 } },
};
const UNIT_KEYS = Object.keys(UNITS);
const gradeOf = key => Math.min(5, Math.max(1, UNITS[key]?.grade || 1));

const FONT = 'Sarabun, Tahoma, sans-serif';