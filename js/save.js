// =====================================================================
//  save.js — เซฟ/โหลดข้อมูลผู้เล่น (localStorage)
// =====================================================================
// ---------------------------------------------------------------------
//  เซฟข้อมูล (ทอง + เลเวลตัวละคร) เก็บใน localStorage ของเบราว์เซอร์
// ---------------------------------------------------------------------
const SAVE_KEY = 'miniLaneRangers.v1';
const SAVE = {
  gold: 0,
  gems: 0,                                                  // เพชร (ใช้สุ่มกาชา)
  levels: Object.fromEntries(UNIT_KEYS.map(k => [k, 1])),
  team: UNIT_KEYS.slice(0, TEAM_SIZE),                       // ตัวละครที่ขึ้นแท่นในทีม (ลำดับ = ปุ่มในเกม)
  up: { baseHp: 1, startEnergy: 1, regen: 1 },               // เลเวลอัปเกรดก่อนไปสู้
  seen: {},                                                  // ตัวละครที่ค้นพบแล้ว (หน้าสะสม)
  claimed: [],                                               // รางวัลสะสมที่รับแล้ว (เก็บเป็นจำนวน n)
  stats: { used: {}, defeated: {} },                         // สถิติต่อตัวละคร: ลงสนามกี่ครั้ง / ปราบศัตรูชนิดนี้กี่ตัว
};
const statMult = (lv) => 1 + LEVEL_STEP * (lv - 1);

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) readSave(JSON.parse(raw));
  } catch (e) { /* เซฟใช้ไม่ได้ก็เล่นต่อได้ตามปกติ */ }
  // ตัวที่อยู่ในทีม หรือเคยอัปเกรดไว้ ถือว่าค้นพบแล้ว (รองรับเซฟเก่า)
  for (const k of UNIT_KEYS) if (SAVE.team.includes(k) || SAVE.levels[k] > 1) SAVE.seen[k] = true;
}

function readSave(d) {
  try {
    if (typeof d.gold === 'number') SAVE.gold = d.gold;
    if (Number.isInteger(d.gems) && d.gems >= 0) SAVE.gems = d.gems;
    if (d.levels) {
      for (const k of UNIT_KEYS) {
        if (Number.isInteger(d.levels[k])) SAVE.levels[k] = Math.min(MAX_LEVEL, Math.max(1, d.levels[k]));
      }
    }
    if (d.up) {
      for (const k of UP_KEYS) {
        if (Number.isInteger(d.up[k])) SAVE.up[k] = Math.min(BASE_UPGRADES[k].max, Math.max(1, d.up[k]));
      }
    }
    if (Array.isArray(d.team)) {
      const t = [...new Set(d.team.filter(k => UNITS[k]))].slice(0, TEAM_SIZE);
      if (t.length) SAVE.team = t;
    }
    if (d.seen) for (const k of UNIT_KEYS) if (d.seen[k]) SAVE.seen[k] = true;
    if (Array.isArray(d.claimed)) SAVE.claimed = d.claimed.filter(Number.isInteger);
    if (d.stats) for (const f of ['used', 'defeated']) {
      for (const k of UNIT_KEYS) if (d.stats[f] && Number.isInteger(d.stats[f][k])) SAVE.stats[f][k] = d.stats[f][k];
    }
  } catch (e) { /* เซฟใช้ไม่ได้ก็เล่นต่อได้ตามปกติ */ }
}
// ค้นพบตัวละคร: คืน true ถ้าเพิ่งค้นพบครั้งแรก (ได้เพชร)
function discoverUnit(key) {
  if (SAVE.seen[key]) return false;
  SAVE.seen[key] = true;
  SAVE.gems += GEM_DISCOVER;
  writeSave();
  return true;
}

function writeSave() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {}
}
loadSave();
