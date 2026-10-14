// =====================================================================
// units.js
// ประเภท / ธาตุ / ข้อมูลยูนิต
// =====================================================================

// ---------------------------------------------------------------------
// ประเภท
// ---------------------------------------------------------------------

const TYPES = {

  power: {
    name: 'พลัง',
    icon: '🛡',
    rank: 0,
    desc: 'ยืนหน้าสุด คอยรับดาเมจ'
  },

  wit: {
    name: 'ไหวพริบ',
    icon: '✨',
    rank: 1,
    desc: 'ยืนกลางแถว ใช้สกิล'
  },

  agile: {
    name: 'ว่องไว',
    icon: '🏹',
    rank: 2,
    desc: 'ยืนหลังสุด ตีธรรมดา'
  }

};


// ---------------------------------------------------------------------
// Formation
// ---------------------------------------------------------------------

const FORMATION_HOLD = false;

const FORMATION_AHEAD_SPEED = 0.3;

const FORMATION_GAP = 30;


// ---------------------------------------------------------------------
// ธาตุ
// ไฟ > ไม้ > น้ำ > ไฟ
// ---------------------------------------------------------------------

const ELEMENTS = {

  fire: {
    name: 'ไฟ',
    icon: '🔥',
    color: 0xff6a3d,
    beats: 'wood'
  },

  wood: {
    name: 'ไม้',
    icon: '🌿',
    color: 0x4caf50,
    beats: 'water'
  },

  water: {
    name: 'น้ำ',
    icon: '💧',
    color: 0x3aa7ff,
    beats: 'fire'
  }

};


const ELEM_ADV = 1.5;
const ELEM_DIS = 0.75;

const elemMult = (
  att,
  def
) => {
  if (
    ELEMENTS[att].beats === def
  ) {
    return ELEM_ADV;
  }
  if (
    ELEMENTS[def].beats === att
  ) {
    return ELEM_DIS;
  }
  return 1;
};

// =====================================================================
// ข้อมูลตัวละคร
// =====================================================================
//
// รูปทั้งหมดอยู่ที่:
//
// assets/characters/
//
// ดังนั้น units.js จะชี้มาที่:
//
// assets/characters/warrior.png
// assets/characters/archer.png
// ฯลฯ
//
// =====================================================================

const UNITS = {

  // ===================================================================
  // นักรบ
  // ===================================================================

  warrior: {
    name: 'นักรบ',
    type: 'power',
    element: 'fire',
    cost: 20,
    hp: 100,
    dmg: 10,
    range: 36,
    speed: 60,
    cd: 700,
    color: 0xff7a59,
    size: 18,
    sprite: {
      file:
        'assets/characters/warrior.png',
      cols: 8,
      rows: 2,
      walk: [0, 3],
      attack: [4, 7],
      height: 52
    }
  },

  // ===================================================================
  // นักธนู
  // ===================================================================

  archer: {
    name: 'นักธนู',
    type: 'agile',
    element: 'wood',
    cost: 30,
    hp: 60,
    dmg: 8,
    range: 150,
    speed: 50,
    cd: 900,
    color: 0x9be37e,
    size: 14,
    sprite: {
      file:
        'assets/characters/archer.png',
      cols: 8,
      rows: 2,
      walk: [0, 3],
      attack: [4, 7],
      height: 52
    }
  },

  // ===================================================================
  // แทงค์
  // ===================================================================

  tank: {
    name: 'แทงค์',
    type: 'power',
    element: 'wood',
    cost: 50,
    hp: 260,
    dmg: 14,
    range: 40,
    speed: 35,
    cd: 1100,
    color: 0x4caf50,
    size: 24,
    sprite: {
      file:
        'assets/characters/tank.png',
      cols: 8,
      rows: 2,
      walk: [0, 3],
      attack: [4, 7],
      height: 68
    }
  },

  // ===================================================================
  // นักเวทย์
  // ===================================================================

  mage: {
    name: 'นักเวทย์',
    type: 'wit',
    element: 'fire',
    cost: 40,
    hp: 70,
    dmg: 10,
    range: 130,
    speed: 45,
    cd: 1200,
    color: 0xffa94d,
    size: 15,
    skill: {
      kind: 'aoe',
      name: 'ลูกไฟระเบิด',
      cd: 4500,
      power: 2.5,
      radius: 60,
      desc:
        'ระเบิดใส่ศัตรูเป็นวงกว้าง'
    },
    sprite: {
      file:
        'assets/characters/mage.png',
      cols: 8,
      rows: 2,
      walk: [0, 3],
      attack: [4, 7],
      height: 52
    }
  },


  // ===================================================================
  // นักบวช
  // ===================================================================

  healer: {
    name: 'นักบวช',
    type: 'wit',
    element: 'water',
    cost: 40,
    hp: 80,
    dmg: 4,
    range: 100,
    speed: 45,
    cd: 1200,
    color: 0x5ec8ff,
    size: 15,
    skill: {
      kind: 'heal',
      name: 'น้ำพุรักษา',
      cd: 5000,
      power: 40,
      radius: 110,
      desc:
        'ฟื้นเลือดเพื่อนรอบตัว'
    },
    sprite: {
      file:
        'assets/characters/healer.png',
      cols: 8,
      rows: 2,
      walk: [0, 3],
      attack: [4, 7],
      height: 52
    }
  },

  // ===================================================================
  // ซุ่มยิง
  // ===================================================================

  sniper: {
    name: 'ซุ่มยิง',
    type: 'agile',
    element: 'water',
    cost: 45,
    hp: 45,
    dmg: 22,
    range: 220,
    speed: 40,
    cd: 1800,
    color: 0x2f6fe0,
    size: 13,
    sprite: {
      file:
        'assets/characters/sniper.png',
      cols: 8,
      rows: 2,
      walk: [0, 3],
      attack: [4, 7],
      height: 52
    }
  },

  // ===================================================================
  // อัศวิน
  // ===================================================================

  knight: {
    name: 'อัศวิน',
    type: 'power',
    element: 'water',
    cost: 35,
    hp: 180,
    dmg: 11,
    range: 38,
    speed: 45,
    cd: 900,
    color: 0x3aa7ff,
    size: 20,
    sprite: {
      file:
        'assets/characters/knight.png',
      cols: 8,
      rows: 2,
      walk: [0, 3],
      attack: [4, 7],
      height: 52
    }
  },

  // ===================================================================
  // ดรูอิด
  // ===================================================================

  druid: {
    name: 'ดรูอิด',
    type: 'wit',
    element: 'wood',
    cost: 40,
    hp: 75,
    dmg: 6,
    range: 110,
    speed: 45,
    cd: 1200,
    color: 0x8bd450,
    size: 15,
    skill: {
      kind: 'buff',
      name: 'พรแห่งป่า',
      cd: 6000,
      power: 1.3,
      radius: 110,
      duration: 4000,
      desc:
        'เพิ่มดาเมจเพื่อนรอบตัว +30% นาน 4 วิ'
    },
    sprite: {
      file:
        'assets/characters/druid.png',
      cols: 8,
      rows: 2,
      walk: [0, 3],
      attack: [4, 7],
      height: 52
    }
  },

  // ===================================================================
  // นักปืนไฟ
  // ===================================================================

  gunner: {
    name: 'นักปืนไฟ',
    type: 'agile',
    element: 'fire',
    cost: 35,
    hp: 55,
    dmg: 12,
    range: 170,
    speed: 48,
    cd: 650,
    color: 0xff9a3c,
    size: 14,
    sprite: {
      file:
        'assets/characters/gunner.png',
      cols: 8,
      rows: 2,
      walk: [0, 3],
      attack: [4, 7],
      height: 52
    }
  }
};


// =====================================================================
// KEY
// =====================================================================

const UNIT_KEYS =
  Object.keys(
    UNITS
  );


// =====================================================================
// FONT
// =====================================================================

const FONT =
  'Sarabun, Tahoma, sans-serif';