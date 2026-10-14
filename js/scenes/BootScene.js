// ---------- โหลดภาพตัวละคร (ถ้าไม่มีไฟล์ก็ข้ามไป ใช้สี่เหลี่ยมแทน) แล้วเข้าลอบบี้ ----------
// โหลดเป็นภาพเต็มก่อน แล้วค่อยหั่นเป็นเฟรมตามขนาดจริงของไฟล์ (cols/rows ใน units.js) ภาพขนาดเท่าไหร่ก็ใช้ได้
class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  preload() {
    this.load.on('loaderror', () => {});
    for (const k of UNIT_KEYS) {
      const s = UNITS[k].sprite;
      if (s) this.load.image('raw_' + k, s.file);
    }
  }

  create() {
    for (const k of UNIT_KEYS) {
      const s = UNITS[k].sprite;
      if (!s || !this.textures.exists('raw_' + k)) continue;
      const img = this.textures.get('raw_' + k).getSourceImage();
      const cols = s.cols || 8, rows = s.rows || 1;
      const fw = s.frameWidth || Math.floor(img.width / cols);
      const fh = s.frameHeight || Math.floor(img.height / rows);
      this.textures.addSpriteSheet('unit_' + k, img, { frameWidth: fw, frameHeight: fh });
      s.frameWidth = fw; s.frameHeight = fh;
      s.scale = (s.height || fh) / fh;                                      // ย่อ/ขยายให้ความสูงเฟรมบนจอ = height
      if (s.enemyOffset === undefined) s.enemyOffset = rows >= 2 ? cols : 0; // แถวที่ 2 = เฟรมศัตรู
    }
    this.scene.start('lobby');
  }
}