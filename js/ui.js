// =====================================================================
//  ui.js — ตัวช่วยวาด UI ที่ใช้ร่วมกันหลายฉาก (ป้ายเพชร, ตัวเลขเด้ง, ภาพตัวละคร)
// =====================================================================

// ป้ายเพชร (◆ สีแดง + จำนวน) คืนค่า text เพื่อเอาไปอัปเดตตัวเลข
function gemBadge(scene, x, y) {
  scene.add.polygon(x, y, [0, 9, 9, 0, 18, 9, 9, 18], 0xd7263d).setStrokeStyle(2, 0xffffff, 0.9);
  return scene.add.text(x + 16, y, '', { fontFamily: FONT, fontSize: '22px', color: '#ff8fa3', fontStyle: 'bold' }).setOrigin(0, 0.5);
}

// ตัวหนังสือเด้งขึ้นแล้วจางหาย
function popText(scene, x, y, text, color = '#ff8fa3') {
  const t = scene.add.text(x, y, text, { fontFamily: FONT, fontSize: '22px', color, fontStyle: 'bold', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(20);
  scene.tweens.add({ targets: t, y: y - 36, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
}

// ภาพตัวละคร (สไปรท์เฟรมแรก หรือสี่เหลี่ยมถ้าไม่มีไฟล์ภาพ) วางเท้าที่ feetY
function unitPortrait(scene, x, feetY, key, targetH) {
  const def = UNITS[key];
  if (def.sprite && scene.textures.exists('unit_' + key)) {
    return scene.add.sprite(x, feetY, 'unit_' + key, def.sprite.walk[0]).setOrigin(0.5, 1).setScale(targetH / def.sprite.frameHeight);
  }
  const f = targetH / 48, w = def.size * f, h = def.size * 1.6 * f;
  return scene.add.rectangle(x, feetY - h / 2, w, h, def.color).setStrokeStyle(2, 0xffffff, 0.8);
}
