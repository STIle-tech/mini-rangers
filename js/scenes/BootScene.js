// =====================================================================
// BootScene
// โหลด Assets ที่มีอยู่จริงตอนนี้ แล้วเข้า Lobby
// =====================================================================

class BootScene extends Phaser.Scene {

  constructor() {
    super('boot');
  }


  preload() {

    // ================================================================
    // ถ้า Asset ไหนหาไม่เจอ ให้ข้ามไป
    // เกมยังสามารถเปิดต่อได้
    // ================================================================

    this.load.on('loaderror', (file) => {
      console.warn(
        '[Asset ไม่พบ - ข้าม]',
        file.key,
        file.src
      );
    });


    // ================================================================
    // CHARACTER
    //
    // โหลดจาก units.js
    //
    // ตัวอย่าง:
    //
    // sprite: {
    //   file: 'assets/characters/unit01/unit01.png',
    //   cols: 8,
    //   rows: 1
    // }
    // ================================================================

    for (const k of UNIT_KEYS) {

      const s = UNITS[k].sprite;

      if (s && s.file) {

        this.load.image(
          'raw_' + k,
          s.file
        );
      }
    }


    // ================================================================
    // LOBBY BACKGROUND
    // ================================================================

    this.load.image(
      'lobby_bg',
      'assets/backgrounds/lobby/lobby_bg.png'
    );


    // ================================================================
    // LOBBY UI
    // ================================================================

    this.load.image(
      'lobby_start',
      'assets/ui/lobby/start_button.png'
    );

    this.load.image(
      'lobby_pvp',
      'assets/ui/lobby/pvp_button.png'
    );

    this.load.image(
      'lobby_mail',
      'assets/ui/lobby/mailbox.png'
    );

    this.load.image(
      'lobby_gacha',
      'assets/ui/lobby/gacha_button.png'
    );


    // ================================================================
    // LOBBY MENU
    // ================================================================

    this.load.image(
      'menu_team',
      'assets/ui/lobby/menu/team.png'
    );

    this.load.image(
      'menu_upgrade',
      'assets/ui/lobby/menu/upgrade.png'
    );

    this.load.image(
      'menu_friend',
      'assets/ui/lobby/menu/friend.png'
    );

    this.load.image(
      'menu_collection',
      'assets/ui/lobby/menu/collection.png'
    );

    this.load.image(
      'menu_treasure',
      'assets/ui/lobby/menu/treasure.png'
    );

    this.load.image(
      'menu_settings',
      'assets/ui/lobby/menu/settings.png'
    );


    // ================================================================
    // หมายเหตุ
    //
    // ตอนนี้ยังไม่โหลด:
    //
    // Team
    // Upgrade
    // Character
    // Collection
    // Gacha
    // Game
    //
    // เพราะคุณยังไม่ได้สร้าง Asset ของหน้าเหล่านี้
    //
    // พอมีภาพจริง ค่อยเพิ่มตรงนี้
    // ================================================================
  }


  create() {

    // ================================================================
    // สร้าง SpriteSheet ของตัวละคร
    // ================================================================

    for (const k of UNIT_KEYS) {

      const s = UNITS[k].sprite;


      // ไม่มีข้อมูล Sprite
      // หรือโหลดภาพไม่สำเร็จ
      // ให้ข้าม

      if (
        !s ||
        !this.textures.exists(
          'raw_' + k
        )
      ) {

        continue;
      }


      // ============================================================
      // เอาภาพต้นฉบับ
      // ============================================================

      const img =
        this.textures
          .get('raw_' + k)
          .getSourceImage();


      // ============================================================
      // จำนวนคอลัมน์ / แถว
      // ============================================================

      const cols =
        s.cols || 8;

      const rows =
        s.rows || 1;


      // ============================================================
      // คำนวณขนาด Frame
      // ============================================================

      const fw =
        s.frameWidth ||
        Math.floor(
          img.width / cols
        );


      const fh =
        s.frameHeight ||
        Math.floor(
          img.height / rows
        );


      // ============================================================
      // ป้องกัน Frame ผิดขนาด
      // ============================================================

      if (
        fw <= 0 ||
        fh <= 0
      ) {

        console.warn(
          '[SpriteSheet ผิดขนาด]',
          k,
          img.width,
          img.height
        );

        continue;
      }


      // ============================================================
      // สร้าง SpriteSheet
      // ============================================================

      this.textures.addSpriteSheet(
        'unit_' + k,
        img,
        {
          frameWidth: fw,
          frameHeight: fh
        }
      );


      // ============================================================
      // เก็บขนาด Frame
      // ============================================================

      s.frameWidth =
        fw;

      s.frameHeight =
        fh;


      // ============================================================
      // Scale ตัวละคร
      // ============================================================

      s.scale =
        (s.height || fh) /
        fh;


      // ============================================================
      // ถ้ามี 2 แถว
      // แถวที่ 2 = Enemy
      // ============================================================

      if (
        s.enemyOffset === undefined
      ) {

        s.enemyOffset =
          rows >= 2
            ? cols
            : 0;
      }
    }


    // ================================================================
    // เข้า Lobby
    // ================================================================

    this.scene.start(
      'lobby'
    );
  }
}