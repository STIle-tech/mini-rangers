//  ui.js — ตัวช่วยวาด UI ที่ใช้ร่วมกันหลายฉาก (ป้ายเพชร, ตัวเลขเด้ง, ภาพตัวละคร)
// ป้ายเพชร (◆ สีแดง + จำนวน) คืนค่า text เพื่อเอาไปอัปเดตตัวเลข
function gemBadge(scene, x, y) {
  scene.add.polygon(x, y, [0, 9, 9, 0, 18, 9, 9, 18], 0xd7263d).setStrokeStyle(2, 0xffffff, 0.9);
  return scene.add
    .text(x + 16, y, '', { fontFamily: FONT, fontSize: '22px', color: '#ff8fa3', fontStyle: 'bold' })
    .setOrigin(0, 0.5);
}

// ตัวหนังสือเด้งขึ้นแล้วจางหาย
function popText(scene, x, y, text, color = '#ff8fa3') {
  const t = scene.add
    .text(x, y, text, {
      fontFamily: FONT,
      fontSize: '22px',
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    })
    .setOrigin(0.5)
    .setDepth(20);
  scene.tweens.add({ targets: t, y: y - 36, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
}

// ภาพตัวละคร (สไปรท์เฟรมแรก หรือสี่เหลี่ยมถ้าไม่มีไฟล์ภาพ) วางเท้าที่ feetY
function unitPortrait(scene, x, feetY, key, targetH) {
  const def = UNITS[key];
  if (def.sprite && scene.textures.exists('unit_' + key)) {
    return scene.add
      .sprite(x, feetY, 'unit_' + key, def.sprite.walk[0])
      .setOrigin(0.5, 1)
      .setScale(targetH / def.sprite.frameHeight);
  }
  const f = targetH / 48,
    w = def.size * f,
    h = def.size * 1.6 * f;
  return scene.add.rectangle(x, feetY - h / 2, w, h, def.color).setStrokeStyle(2, 0xffffff, 0.8);
}

// สัดส่วนความสูงเฟรมที่เป็น "เท้า" (แถวล่างสุดที่มีสี) ใช้ตั้ง origin ให้ตัวละครยืนติดพื้น/เงาพอดี ไม่ลอย
// อ่านพิกเซลไม่ได้ (เช่น เปิดไฟล์ตรงๆ แทนที่จะรันผ่านเซิร์ฟเวอร์) จะใช้ค่า 0.97
const FOOT_CACHE = {};
function footOrigin(scene, key) {
  if (FOOT_CACHE[key] !== undefined) return FOOT_CACHE[key];
  let r = 0.97;
  try {
    const tex = 'unit_' + key, f = scene.textures.getFrame(tex, 0);
    scan: for (let y = f.height - 1; y >= 0; y--)
      for (let x = 0; x < f.width; x += 2)
        if (scene.textures.getPixelAlpha(x, y, tex, 0) > 20) { r = (y + 1) / f.height; break scan; }
  } catch (e) {}
  return (FOOT_CACHE[key] = r);
}

// GIF สกุลเงิน (type = 'gem' | 'gold'): Phaser เล่น GIF เคลื่อนไหวไม่ได้ จึงใช้แท็ก <img> ซ้อนบน canvas ที่พิกัดเกม (x, y)
// รูปจะขยับตามขนาด/ตำแหน่ง canvas และถูกลบเองเมื่อออกจากฉาก ถ้าโหลดไฟล์ไม่ได้ จะวาดรูปสำรองแทน (ไม่ให้ขึ้นไอคอนรูปแตก)
function addCurrencyGif(scene, type, x, y, size = 24) {
  if (!scene.currencyGifs) {
    const list = (scene.currencyGifs = []);
    const place = () => {
      const r = scene.game.canvas.getBoundingClientRect(), sx = r.width / W, sy = r.height / H;
      for (const g of list) {
        Object.assign(g.img.style, {
          width: g.size * sx + 'px', height: g.size * sy + 'px',
          left: r.left + (g.x - g.size / 2) * sx + 'px', top: r.top + (g.y - g.size / 2) * sy + 'px'
        });
      }
    };
    const clean = () => {
      scene.events.off('update', place);
      for (const g of list.splice(0)) g.img.remove();
      scene.currencyGifs = null;
    };
    list.place = place;
    scene.events.on('update', place);
    scene.events.once('shutdown', clean);
    scene.events.once('destroy', clean);
  }
  const list = scene.currencyGifs, img = Object.assign(document.createElement('img'), { src: `assets/icons/currency/${type}.gif`, alt: type, draggable: false });
  Object.assign(img.style, { position: 'fixed', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none', zIndex: '9999' });
  img.onerror = () => {
    img.remove();
    list.splice(list.findIndex(g => g.img === img), 1);
    if (!scene.sys.isActive()) return;
    if (type === 'gem') scene.add.polygon(x, y, [0, 9, 9, 0, 18, 9, 9, 18], 0xd7263d).setStrokeStyle(2, 0xffffff, 0.9);
    else scene.add.circle(x, y, size / 2 - 2, 0xffb300).setStrokeStyle(2, 0xfff2a0);
  };
  document.body.appendChild(img);
  list.push({ img, x, y, size });
  list.place();
}