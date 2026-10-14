class LobbyScene extends Phaser.Scene {

  constructor() {
    super('lobby');
    this.currencyGifs = [];
  }

  preload() {

    // BACKGROUND
    this.load.image(
      'lobby_bg',
      'assets/backgrounds/lobby/lobby_bg.png'
    );

    // LOBBY UI
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

    // MENU
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

    // ไม่โหลด GIF ด้วย Phaser
    // gem.gif และ gold.gif จะใช้ HTML Image โดยตรง

    this.load.on('loaderror', file => {
      console.error(
        '[LOBBY LOAD ERROR]',
        file.key,
        file.src
      );
    });
  }

  create() {

    this.currencyGifs = [];

    this.drawBackground();
    this.drawShowcase();
    this.drawTopBar();
    this.drawSideItems();
    this.drawStartButton();
    this.drawMenuBar();

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
      '🔥ไฟ > 🌿ไม้ > 💧น้ำ > 🔥ไฟ (ชนะทาง x1.5) · หน้า🛡พลัง กลาง✨ไหวพริบ หลัง🏹ว่องไว',
      {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#9fc4d6'
      }
    ).setOrigin(0.5);

    this.toastText = this.add.text(
      W / 2,
      100,
      '',
      {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#000000cc',
        padding: { x: 14, y: 7 }
      }
    )
    .setOrigin(0.5)
    .setAlpha(0)
    .setDepth(999);

    // อัปเดตตำแหน่ง GIF เมื่อ Canvas เปลี่ยนขนาด/ตำแหน่ง
    this.events.on('update', this.updateCurrencyGifPositions, this);

    // ลบ GIF เมื่อออกจาก Lobby ป้องกันภาพค้างและภาพซ้อน
    this.events.once(
      Phaser.Scenes.Events.SHUTDOWN,
      this.cleanupCurrencyGifs,
      this
    );

    this.events.once(
      Phaser.Scenes.Events.DESTROY,
      this.cleanupCurrencyGifs,
      this
    );
  }

  // =====================================================
  // GIF จริงจาก assets
  // ตำแหน่ง x, y ใช้พิกัดเดียวกับ Phaser
  // =====================================================

  createCurrencyGif(type, x, y, size = 25) {

    const img = document.createElement('img');

    img.src = `assets/icons/currency/${type}.gif`;
    img.alt = type;
    img.draggable = false;

    img.style.position = 'fixed';
    img.style.width = `${size}px`;
    img.style.height = `${size}px`;
    img.style.objectFit = 'contain';
    img.style.pointerEvents = 'none';
    img.style.userSelect = 'none';
    img.style.zIndex = '9999';
    img.style.margin = '0';
    img.style.padding = '0';
    img.style.border = '0';
    img.style.transform = 'none';

    document.body.appendChild(img);

    const item = {
      img,
      x,
      y,
      size
    };

    this.currencyGifs.push(item);
    this.positionCurrencyGif(item);

    img.onerror = () => {
      console.error(
        '[GIF LOAD ERROR]',
        img.src
      );
    };

    return img;
  }

  // =====================================================
  // ตำแหน่ง GIF ตาม Canvas จริง
  // =====================================================

  positionCurrencyGif(item) {

    const canvas = this.game.canvas;

    if (!canvas || !item.img.isConnected) {
      return;
    }

    const rect = canvas.getBoundingClientRect();

    const scaleX = rect.width / W;
    const scaleY = rect.height / H;

    const displayW = item.size * scaleX;
    const displayH = item.size * scaleY;

    item.img.style.width = `${displayW}px`;
    item.img.style.height = `${displayH}px`;

    item.img.style.left =
      `${rect.left + item.x * scaleX - displayW / 2}px`;

    item.img.style.top =
      `${rect.top + item.y * scaleY - displayH / 2}px`;
  }

  updateCurrencyGifPositions() {

    for (const item of this.currencyGifs) {
      this.positionCurrencyGif(item);
    }
  }

  cleanupCurrencyGifs() {

    this.events.off(
      'update',
      this.updateCurrencyGifPositions,
      this
    );

    for (const item of this.currencyGifs) {
      item.img.onerror = null;
      item.img.remove();
    }

    this.currencyGifs = [];
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
      console.error('[LOBBY] ไม่พบ lobby_bg');
      return;
    }

    const bg = this.add.image(
      W / 2,
      H / 2,
      'lobby_bg'
    );

    bg.setScale(
      Math.max(
        W / bg.width,
        H / bg.height
      )
    );

    bg.setOrigin(0.5);
    bg.setDepth(-100);
  }

  // =====================================================
  // CHARACTER SHOWCASE
  // =====================================================

  drawShowcase() {

    const xs = [190, 285, 380, 475, 570];
    const FEET = 248;

    for (let i = 0; i < 5; i++) {

      const x = xs[i];
      const key = SAVE.team[i];

      this.add.ellipse(
        x,
        FEET + 4,
        70,
        14,
        0x000000,
        0.3
      );

      if (!key) {

        this.add.rectangle(
          x,
          FEET - 40,
          40,
          80,
          0x0b2229,
          0.55
        );

        this.add.text(
          x,
          FEET - 40,
          '?',
          {
            fontFamily: FONT,
            fontSize: '34px',
            color: '#4f8798',
            fontStyle: 'bold'
          }
        ).setOrigin(0.5);

        continue;
      }

      const def = UNITS[key];

      if (!def) {
        console.warn('[LOBBY] ไม่พบ UNIT:', key);
        continue;
      }

      const lv = SAVE.levels[key] || 1;
      let obj;

      if (
        def.sprite &&
        this.textures.exists('unit_' + key)
      ) {

        obj = this.add.sprite(
          x,
          FEET,
          'unit_' + key,
          def.sprite.walk[0]
        );

        obj
          .setOrigin(0.5, 122 / 128)
          .setScale((def.sprite.scale || 1) * 1.5);

        // คลิกตัวภาพเท่านั้น ไม่สร้างพื้นที่คลิกขนาดใหญ่
        if (obj.type === 'Sprite') {
          obj.setInteractive({
            useHandCursor: true,
            pixelPerfect: true,
            alphaTolerance: 1
          });
        }

      } else {

        const w = def.size * 2.4;
        const h = def.size * 1.6 * 2.4;

        obj = this.add.rectangle(
          x,
          FEET - h / 2,
          w,
          h,
          def.color
        );

        obj.setInteractive({
          useHandCursor: true
        });
      }

      obj.on('pointerdown', pointer => {

        if (pointer.event) {
          pointer.event.stopPropagation();
        }

        this.scene.start('character', {
          sel: UNIT_KEYS.indexOf(key),
          from: 'lobby'
        });

      });

      const stars = Math.min(
        5,
        Math.ceil(lv / 2)
      );

      this.add.text(
        x,
        FEET + 30,
        '★'.repeat(stars) + '☆'.repeat(5 - stars),
        {
          fontFamily: FONT,
          fontSize: '15px',
          color: '#ffd23f'
        }
      ).setOrigin(0.5);

      this.add.rectangle(
        x,
        FEET + 58,
        80,
        24,
        0x153443
      ).setStrokeStyle(2, 0x2c6a7c);

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

    const playerLv = Math.max(
      1,
      UNIT_KEYS.reduce(
        (s, k) => s + (SAVE.levels[k] || 1),
        0
      ) - UNIT_KEYS.length + 1
    );

    this.add.rectangle(
      75,
      38,
      118,
      46,
      0x6b3f1d
    ).setStrokeStyle(3, 0x3a2410);

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

    // มีเพียงเพชรและทอง ไม่มี P

    this.makeCurrencyPill(
      W - 240,
      String(SAVE.gems),
      'gem'
    );

    this.makeCurrencyPill(
      W - 115,
      Math.floor(SAVE.gold).toLocaleString('en-US'),
      'gold'
    );
  }

  // =====================================================
  // CURRENCY PILL + GIF
  // =====================================================

  makeCurrencyPill(cx, value, type) {

    const y = 22;
    const w = 106;

    this.add.rectangle(
      cx,
      y,
      w,
      28,
      0x101a30,
      0.92
    ).setStrokeStyle(2, 0x3a4a70);

    // GIF อยู่ด้านซ้ายของตัวเลข
    this.createCurrencyGif(
      type,
      cx - 34,
      y,
      24
    );

    this.add.text(
      cx - 5,
      y,
      String(value),
      {
        fontFamily: FONT,
        fontSize: '15px',
        color: type === 'gold' ? '#ffe066' : '#ffffff',
        fontStyle: 'bold'
      }
    ).setOrigin(0.5);

    const plus = this.add.circle(
      cx + w / 2 - 2,
      y,
      12,
      0x4ab34a
    ).setInteractive({
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

    plus.on('pointerdown', () => {
      this.toast('ยังไม่เปิดให้ใช้งาน');
    });
  }

  // =====================================================
  // MAIL + GACHA
  // =====================================================

  drawSideItems() {

    if (this.textures.exists('lobby_mail')) {

      const mail = this.add.image(
        745,
        100,
        'lobby_mail'
      );

      mail.setDisplaySize(70, 70);
      mail.setInteractive({ useHandCursor: true });

      mail.on('pointerdown', () => {
        this.toast('กล่องข้อความยังไม่เปิดให้ใช้งาน');
      });
    }

    if (this.textures.exists('lobby_gacha')) {

      const gacha = this.add.image(
        745,
        178,
        'lobby_gacha'
      );

      gacha.setDisplaySize(90, 90);
      gacha.setInteractive({ useHandCursor: true });

      gacha.on('pointerdown', () => {
        this.scene.start('gacha');
      });
    }
  }

  // =====================================================
  // START + PVP — ไม่มี Animation
  // =====================================================

  drawStartButton() {

    if (this.textures.exists('lobby_start')) {

      const start = this.add.image(
        725,
        372,
        'lobby_start'
      );

      start.setDisplaySize(120, 120);
      start.setInteractive({ useHandCursor: true });

      // ไม่มี Tween ไม่มีการเด้ง
      start.on('pointerdown', () => {
        this.scene.start('game');
      });

    } else {

      const start = this.add.text(
        725,
        372,
        'เริ่ม',
        {
          fontFamily: FONT,
          fontSize: '38px',
          color: '#ffd23f',
          fontStyle: 'bold'
        }
      ).setOrigin(0.5).setInteractive({
        useHandCursor: true
      });

      start.on('pointerdown', () => {
        this.scene.start('game');
      });
    }

    if (this.textures.exists('lobby_pvp')) {

      const pvp = this.add.image(
        610,
        402,
        'lobby_pvp'
      );

      pvp.setDisplaySize(100, 55);
      pvp.setInteractive({ useHandCursor: true });

      pvp.on('pointerdown', () => {
        this.toast('PvP ยังไม่เปิดให้เล่น');
      });
    }
  }

  // =====================================================
  // BOTTOM MENU — อยู่นิ่ง
  // =====================================================

  drawMenuBar() {

    const items = [
      { key: 'menu_team', label: 'ทีม', go: 'team' },
      { key: 'menu_upgrade', label: 'อัปเกรด', go: 'upgrade' },
      { key: 'menu_friend', label: 'เพื่อน' },
      { key: 'menu_collection', label: 'สะสม', go: 'collection' },
      { key: 'menu_treasure', label: 'สมบัติ' },
      { key: 'menu_settings', label: 'การตั้งค่า' }
    ];

    items.forEach((item, i) => {

      const x = 45 + i * 70;
      const y = 402;

      if (this.textures.exists(item.key)) {

        const button = this.add.image(
          x,
          y,
          item.key
        );

        button.setDisplaySize(64, 68);
        button.setInteractive({ useHandCursor: true });

        // ไม่มี Hover Scale / ไม่มี Tween
        button.on('pointerdown', () => {

          if (item.go) {
            this.scene.start(item.go);
          } else {
            this.toast(`${item.label} ยังไม่เปิดให้ใช้งาน`);
          }

        });

      } else {

        const button = this.add.rectangle(
          x,
          y,
          64,
          68,
          0x7a4a24
        ).setStrokeStyle(3, 0x3a2410)
          .setInteractive({ useHandCursor: true });

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

        button.on('pointerdown', () => {

          if (item.go) {
            this.scene.start(item.go);
          } else {
            this.toast(`${item.label} ยังไม่เปิดให้ใช้งาน`);
          }

        });
      }
    });
  }

  // =====================================================
  // TOAST
  // =====================================================

  toast(message) {

    if (!this.toastText) return;

    this.toastText
      .setText(message)
      .setAlpha(1);

    this.tweens.killTweensOf(this.toastText);

    this.tweens.add({
      targets: this.toastText,
      alpha: 0,
      delay: 1200,
      duration: 500
    });
  }
}