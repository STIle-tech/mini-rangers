class LobbyScene extends Phaser.Scene {

  constructor() {
    super('lobby');
  }

  preload() {

    // =====================================================
    // BACKGROUND
    // =====================================================

    this.load.image(
      'lobby_bg',
      'assets/backgrounds/lobby/lobby_bg.png'
    );

    // =====================================================
    // LOBBY UI
    // =====================================================

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

    // =====================================================
    // LOBBY MENU
    // =====================================================

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

    // =====================================================
    // ERROR CHECK
    // =====================================================

    this.load.on('loaderror', file => {

      console.error(
        '[LOBBY LOAD ERROR]',
        file.key,
        file.src
      );

    });
  }

  create() {

    this.drawBackground();

    this.drawShowcase();

    this.drawTopBar();

    this.drawSideItems();

    this.drawStartButton();

    this.drawMenuBar();

    // =====================================================
    // HELP TEXT
    // =====================================================

    this.add.text(
      300,
      338,
      '1-5 = เรียกยูนิต   ·   R = อัปเกรดเศรษฐกิจ',
      {
        fontFamily: FONT,
        fontSize: '13px',
        color: '#9fc4d6'
      }
    ).setOrigin(0.5);

    this.add.text(
      300,
      358,
      '🔥ไฟ > 🌿ไม้ > 💧น้ำ > 🔥ไฟ (ชนะทาง x1.5)  ·  หน้า🛡พลัง  กลาง✨ไหวพริบ  หลัง🏹ว่องไว',
      {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#9fc4d6'
      }
    ).setOrigin(0.5);

    // =====================================================
    // TOAST
    // =====================================================

    this.toastText = this.add.text(
      W / 2,
      100,
      '',
      {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#000000cc',
        padding: {
          x: 14,
          y: 7
        }
      }
    )
    .setOrigin(0.5)
    .setAlpha(0)
    .setDepth(999);
  }

  // =====================================================
  // BACKGROUND
  // =====================================================

  drawBackground() {

    this.add.rectangle(
      W / 2,
      H / 2,
      W,
      H,
      0x0d1a38
    ).setDepth(-200);

    if (!this.textures.exists('lobby_bg')) {

      console.error(
        '[LOBBY] ไม่พบ lobby_bg'
      );

      return;
    }

    const bg = this.add.image(
      W / 2,
      H / 2,
      'lobby_bg'
    );

    const scaleX = W / bg.width;
    const scaleY = H / bg.height;

    const scale = Math.max(
      scaleX,
      scaleY
    );

    bg
      .setScale(scale)
      .setOrigin(0.5)
      .setDepth(-100);
  }

  // =====================================================
  // CHARACTER SHOWCASE
  // =====================================================

  drawShowcase() {

    const xs = [
      190,
      285,
      380,
      475,
      570
    ];

    const FEET = 248;

    for (let i = 0; i < 5; i++) {

      const x = xs[i];

      const key = SAVE.team[i];

      // ===================================================
      // SHADOW
      // ===================================================

      this.add.ellipse(
        x,
        FEET + 4,
        70,
        14,
        0x000000,
        0.3
      );

      // ===================================================
      // EMPTY SLOT
      // ===================================================

      if (!key) {

        this.add.text(
          x,
          FEET - 40,
          '+',
          {
            fontFamily: FONT,
            fontSize: '34px',
            color: '#4f8798',
            fontStyle: 'bold'
          }
        ).setOrigin(0.5);

        continue;
      }

      // ===================================================
      // UNIT DATA
      // ===================================================

      const def = UNITS[key];

      if (!def) {

        console.warn(
          '[LOBBY] ไม่พบข้อมูล UNIT:',
          key
        );

        continue;
      }

      const lv =
        SAVE.levels[key] || 1;

      let obj = null;

      // ===================================================
      // CHARACTER SPRITE
      // ===================================================

      if (
        def.sprite &&
        this.textures.exists(
          'unit_' + key
        )
      ) {

        obj = this.add.sprite(
          x,
          FEET,
          'unit_' + key,
          def.sprite.walk
            ? def.sprite.walk[0]
            : 0
        );

        obj
          .setOrigin(
            0.5,
            122 / 128
          )
          .setScale(
            (def.sprite.scale || 1) * 1.5
          );

      }

      // ===================================================
      // FALLBACK
      // ===================================================

      else {

        const w =
          def.size * 2.4;

        const h =
          def.size * 1.6 * 2.4;

        obj =
          this.add.rectangle(
            x,
            FEET - h / 2,
            w,
            h,
            def.color
          );

        // ไม่มีกรอบ
        // ไม่มี setStrokeStyle()
      }

      if (!obj) {
        continue;
      }

      // ===================================================
      // CLICK เฉพาะตัวละคร
      // ===================================================

      if (obj.type === 'Sprite') {

        obj.setInteractive({
          useHandCursor: true,
          pixelPerfect: true,
          alphaTolerance: 1
        });

      } else {

        obj.setInteractive({
          useHandCursor: true
        });

      }

      // ===================================================
      // CLICK CHARACTER
      // ===================================================

      obj.on(
        'pointerdown',
        pointer => {

          if (
            pointer &&
            pointer.event
          ) {

            pointer.event.stopPropagation();

          }

          this.scene.start(
            'character',
            {
              sel: UNIT_KEYS.indexOf(key),
              from: 'lobby'
            }
          );

        }
      );

      // ===================================================
      // HOVER
      // =====================================================

      obj.on(
        'pointerover',
        () => {

          obj.setAlpha(0.85);

        }
      );

      obj.on(
        'pointerout',
        () => {

          obj.setAlpha(1);

        }
      );

      // ===================================================
      // CHARACTER FLOAT
      // =====================================================

      this.tweens.add({

        targets: obj,

        y: obj.y - 6,

        duration:
          900 + i * 120,

        yoyo: true,

        repeat: -1,

        ease: 'Sine.easeInOut'

      });

      // ===================================================
      // STARS
      // ===================================================

      const stars =
        Math.min(
          5,
          Math.ceil(lv / 2)
        );

      this.add.text(
        x,
        FEET + 30,
        '★'.repeat(stars) +
        '☆'.repeat(5 - stars),
        {
          fontFamily: FONT,
          fontSize: '15px',
          color: '#ffd23f'
        }
      ).setOrigin(0.5);

      // ===================================================
      // LEVEL
      // ===================================================

      this.add.rectangle(
        x,
        FEET + 58,
        80,
        24,
        0x153443
      )
      .setStrokeStyle(
        2,
        0x2c6a7c
      );

      this.add.text(
        x,
        FEET + 58,
        `Lv. ${lv}`,
        {
          fontFamily: FONT,
          fontSize: '15px',
          color: '#ffffff',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5);
    }
  }

  // =====================================================
  // TOP BAR
  // =====================================================

  drawTopBar() {

    const playerLv =
      Math.max(
        1,

        UNIT_KEYS.reduce(
          (s, k) =>
            s + (
              SAVE.levels[k] || 1
            ),
          0
        )
        -
        UNIT_KEYS.length
        +
        1
      );

    // ===================================================
    // LEVEL
    // ===================================================

    this.add.rectangle(
      75,
      38,
      118,
      46,
      0x6b3f1d
    )
    .setStrokeStyle(
      3,
      0x3a2410
    );

    this.add.text(
      42,
      28,
      'ระดับ',
      {
        fontFamily: FONT,
        fontSize: '11px',
        color: '#5a3a08',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    this.add.text(
      42,
      46,
      String(playerLv),
      {
        fontFamily: FONT,
        fontSize: '24px',
        color: '#3a2410',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    // ===================================================
    // CURRENCY
    // ===================================================

    this.makePill(
      506,
      String(SAVE.gems),
      0xd7263d,
      '◆'
    );

    this.makePill(
      622,
      Math.floor(
        SAVE.gold
      ).toLocaleString('en-US'),
      0xffb300,
      '$'
    );

    this.makePill(
      738,
      '0',
      0x2f6fe0,
      'P'
    );
  }

  // =====================================================
  // CURRENCY PILL
  // =====================================================

  makePill(
    cx,
    text,
    iconColor,
    iconText
  ) {

    const y = 22;
    const w = 106;

    this.add.rectangle(
      cx,
      y,
      w,
      24,
      0x101a30,
      0.92
    )
    .setStrokeStyle(
      2,
      0x3a4a70
    );

    this.add.circle(
      cx - w / 2 + 2,
      y,
      13,
      iconColor
    );

    this.add.text(
      cx - w / 2 + 2,
      y,
      iconText,
      {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    this.add.text(
      cx - 2,
      y,
      text,
      {
        fontFamily: FONT,
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    const plus =
      this.add.circle(
        cx + w / 2 - 2,
        y,
        12,
        0x4ab34a
      )
      .setInteractive({
        useHandCursor: true
      });

    this.add.text(
      cx + w / 2 - 2,
      y - 1,
      '+',
      {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    plus.on(
      'pointerdown',
      () => {

        this.toast(
          'ยังไม่เปิดให้ใช้งาน'
        );

      }
    );
  }

  // =====================================================
  // MAIL + GACHA
  // =====================================================

  drawSideItems() {

    // ===================================================
    // MAIL
    // ===================================================

    if (
      this.textures.exists(
        'lobby_mail'
      )
    ) {

      const mail =
        this.add.image(
          745,
          100,
          'lobby_mail'
        );

      mail.setDisplaySize(
        70,
        70
      );

      mail.setInteractive({
        useHandCursor: true
      });

      mail.on(
        'pointerdown',
        () => {

          this.toast(
            'กล่องข้อความยังไม่เปิดให้ใช้งาน'
          );

        }
      );
    }

    // ===================================================
    // GACHA
    // ===================================================

    if (
      this.textures.exists(
        'lobby_gacha'
      )
    ) {

      const gacha =
        this.add.image(
          745,
          178,
          'lobby_gacha'
        );

      gacha.setDisplaySize(
        90,
        80
      );

      gacha.setInteractive({
        useHandCursor: true
      });

      gacha.on(
        'pointerdown',
        () => {

          this.scene.start(
            'gacha'
          );

        }
      );
    }
  }

  // =====================================================
  // START + PVP
  // =====================================================

  drawStartButton() {

    // ===================================================
    // START
    // ===================================================

    if (
      this.textures.exists(
        'lobby_start'
      )
    ) {

      const start =
        this.add.image(
          725,
          372,
          'lobby_start'
        );

      start.setDisplaySize(
        120,
        120
      );

      start.setInteractive({
        useHandCursor: true
      });

      // =================================================
      // ไม่มี Tween
      // ปุ่ม START อยู่นิ่ง
      // =================================================

      start.on(
        'pointerdown',
        () => {

          this.scene.start(
            'game'
          );

        }
      );

    } else {

      // =================================================
      // FALLBACK START
      // =================================================

      const start =
        this.add.text(
          725,
          372,
          'เริ่ม',
          {
            fontFamily: FONT,
            fontSize: '38px',
            color: '#ffd23f',
            fontStyle: 'bold'
          }
        )
        .setOrigin(0.5)
        .setInteractive({
          useHandCursor: true
        });

      start.on(
        'pointerdown',
        () => {

          this.scene.start(
            'game'
          );

        }
      );
    }

    // ===================================================
    // PVP
    // ===================================================

    if (
      this.textures.exists(
        'lobby_pvp'
      )
    ) {

      const pvp =
        this.add.image(
          610,
          402,
          'lobby_pvp'
        );

      pvp.setDisplaySize(
        100,
        55
      );

      pvp.setInteractive({
        useHandCursor: true
      });

      pvp.on(
        'pointerdown',
        () => {

          this.toast(
            'PvP ยังไม่เปิดให้เล่น'
          );

        }
      );
    }
  }

  // =====================================================
  // BOTTOM MENU
  // =====================================================

  drawMenuBar() {

    const items = [

      {
        key: 'menu_team',
        label: 'ทีม',
        go: 'team'
      },

      {
        key: 'menu_upgrade',
        label: 'อัพเกรด',
        go: 'upgrade'
      },

      {
        key: 'menu_friend',
        label: 'เพื่อน'
      },

      {
        key: 'menu_collection',
        label: 'สะสม',
        go: 'collection'
      },

      {
        key: 'menu_treasure',
        label: 'สมบัติ'
      },

      {
        key: 'menu_settings',
        label: 'การตั้งค่า'
      }

    ];

    items.forEach(
      (item, i) => {

        const x =
          45 + i * 70;

        const y =
          402;

        // =================================================
        // IMAGE BUTTON
        // =================================================

        if (
          this.textures.exists(
            item.key
          )
        ) {

          const button =
            this.add.image(
              x,
              y,
              item.key
            );

          button.setDisplaySize(
            64,
            68
          );

          button.setInteractive({
            useHandCursor: true
          });

          // =================================================
          // ไม่มี pointerover
          // ไม่มี pointerout
          // ไม่มี scale
          // ไม่มี tween
          // เมนูอยู่นิ่ง
          // =================================================

          button.on(
            'pointerdown',
            () => {

              if (item.go) {

                this.scene.start(
                  item.go
                );

              } else {

                this.toast(
                  `${item.label} ยังไม่เปิดให้ใช้งาน`
                );

              }

            }
          );

        }

        // =================================================
        // FALLBACK BUTTON
        // =================================================

        else {

          const button =
            this.add.rectangle(
              x,
              y,
              64,
              68,
              0x7a4a24
            )
            .setStrokeStyle(
              3,
              0x3a2410
            )
            .setInteractive({
              useHandCursor: true
            });

          this.add.text(
            x,
            y,
            item.label,
            {
              fontFamily: FONT,
              fontSize: '11px',
              color: '#ffffff'
            }
          ).setOrigin(0.5);

          button.on(
            'pointerdown',
            () => {

              if (item.go) {

                this.scene.start(
                  item.go
                );

              } else {

                this.toast(
                  `${item.label} ยังไม่เปิดให้ใช้งาน`
                );

              }

            }
          );
        }
      }
    );
  }

  // =====================================================
  // TOAST
  // =====================================================

  toast(message) {

    if (!this.toastText) {
      return;
    }

    this.toastText
      .setText(message)
      .setAlpha(1);

    this.tweens.killTweensOf(
      this.toastText
    );

    this.tweens.add({

      targets:
        this.toastText,

      alpha: 0,

      delay: 1200,

      duration: 500

    });
  }
}