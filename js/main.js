// =====================================================================
//  main.js — เริ่มเกม และลงทะเบียนฉากทั้งหมด (ต้องโหลดเป็นไฟล์สุดท้าย)
// =====================================================================
new Phaser.Game({
  // เปิดไฟล์ตรงๆ (file://) เบราว์เซอร์จะบล็อกภาพเข้า WebGL (จอดำ) จึงใช้ Canvas แทน / ผ่านเว็บเซิร์ฟเวอร์ใช้ AUTO (WebGL) ตามปกติ
  type: location.protocol === 'file:' ? Phaser.CANVAS : Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#1b1b2f',
  loader: { imageLoadType: 'HTMLImageElement' },   // ให้เปิดไฟล์ตรงๆ (file://) แล้วโหลดภาพได้
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, LobbyScene, TeamScene, UpgradeScene, CharacterScene, CollectionScene, GachaScene, GameScene],   // ฉากแรกในลิสต์คือฉากที่เปิดก่อน
});
