// =====================================================================
//  main.js — เริ่มเกม และลงทะเบียนฉากทั้งหมด (ต้องโหลดเป็นไฟล์สุดท้าย)
// =====================================================================
// มือถือ: กันเมนูกดค้าง / ซูมสองนิ้วบน iOS
addEventListener('contextmenu', e => e.preventDefault());
['gesturestart', 'gesturechange'].forEach(t => addEventListener(t, e => e.preventDefault()));

const game = new Phaser.Game({
  // เปิดไฟล์ตรงๆ (file://) เบราว์เซอร์จะบล็อกภาพเข้า WebGL (จอดำ) จึงใช้ Canvas แทน / ผ่านเว็บเซิร์ฟเวอร์ใช้ AUTO (WebGL) ตามปกติ
  type: location.protocol === 'file:' ? Phaser.CANVAS : Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#1b1b2f',
  loader: { imageLoadType: 'HTMLImageElement' },   // ให้เปิดไฟล์ตรงๆ (file://) แล้วโหลดภาพได้
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, fullscreenTarget: 'game' },
  input: { activePointers: 2 },                    // รองรับสัมผัส 2 นิ้ว
  render: { powerPreference: 'high-performance' },
  scene: [BootScene, LobbyScene, ...(typeof StageScene === 'undefined' ? [] : [StageScene]), TeamScene, UpgradeScene, CharacterScene, CollectionScene, GachaScene, GameScene],   // ฉากแรกในลิสต์คือฉากที่เปิดก่อน
});

// แตะครั้งแรกบนมือถือ (Android) -> เข้าเต็มจอ + ล็อกแนวนอน (iOS ไม่รองรับ: ให้ใช้ "เพิ่มลงหน้าจอหลัก" แทน)
if (matchMedia('(pointer: coarse)').matches && !matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches) {
  game.input.once('pointerup', () => {
    if (game.scale.isFullscreen) return;
    game.scale.startFullscreen();
    screen.orientation?.lock?.('landscape').catch(() => {});
  });
}