// =====================================================================
// GachaScene
// หน้ากาชา
// =====================================================================

class GachaScene extends Phaser.Scene {

  constructor() {
    super('gacha');
  }


  // ===================================================================
  // CREATE
  // ===================================================================

  create() {

    this.busy = false;


    // ================================================================
    // BACKGROUND
    // ================================================================

    if (this.textures.exists('gacha_bg')) {

      this.add.image(
        W / 2,
        H / 2,
        'gacha_bg'
      )
      .setDisplaySize(W, H)
      .setDepth(0);

    } else {

      // กันจอดำกรณีไม่มีภาพ
      this.add.rectangle(
        W / 2,
        H / 2,
        W,
        H,
        0x7bb9d8
      ).setDepth(0);

    }


    // ================================================================
    // TOP BAR
    // ================================================================

    this.add.rectangle(
      W / 2,
      32,
      W,
      64,
      0x17243c,
      0.90
    ).setDepth(1);


    // ปุ่มกลับ
    const back = this.add.text(
      28,
      32,
      '←',
      {
        fontFamily: FONT,
        fontSize: '34px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    )
      .setOrigin(0.5)
      .setDepth(5)
      .setInteractive({
        useHandCursor: true
      });


    back.on('pointerdown', () => {
      this.scene.start('lobby');
    });


    // ชื่อ GACHA
    this.add.text(
      95,
      32,
      'GACHA',
      {
        fontFamily: FONT,
        fontSize: '30px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#202b50',
        strokeThickness: 5
      }
    )
      .setOrigin(0, 0.5)
      .setDepth(5);


    // เครื่องหมาย ?
    const help = this.add.circle(
      190,
      32,
      15,
      0xffd23f
    )
      .setStrokeStyle(2, 0xffffff)
      .setDepth(5)
      .setInteractive({
        useHandCursor: true
      });


    this.add.text(
      190,
      32,
      '?',
      {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#4a2a00',
        fontStyle: 'bold'
      }
    )
      .setOrigin(0.5)
      .setDepth(6);


    help.on('pointerdown', () => {
      this.toast('ใช้เพชรเพื่อสุ่มรางวัล');
    });


    // ================================================================
    // CURRENCY
    // ================================================================

    this.addCurrencyBar();


    // ================================================================
    // MAIN GACHA PANEL
    // ================================================================

    this.createMainPanel();


    // ================================================================
    // RIGHT SIDE
    // ================================================================

    this.createRightPanel();


    // ================================================================
    // BOTTOM BUTTONS
    // ================================================================

    this.createSummonButtons();


    // ================================================================
    // RESULT CONTAINER
    // ================================================================

    this.res = this.add.container(
      0,
      0
    )
      .setDepth(20);


    // ================================================================
    // TOAST
    // ================================================================

    this.toastText = this.add.text(
      W / 2,
      H - 55,
      '',
      {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#ffffff',
        backgroundColor: '#000000dd',
        padding: {
          x: 18,
          y: 9
        },
        fontStyle: 'bold'
      }
    )
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(100);


    this.refresh();
  }


  // ===================================================================
  // CURRENCY BAR
  // ===================================================================

  addCurrencyBar() {

    // เพชร
    this.add.circle(
      W - 430,
      32,
      15,
      0xe84a9a
    )
      .setStrokeStyle(2, 0xffffff)
      .setDepth(5);


    this.gemText = this.add.text(
      W - 405,
      32,
      '',
      {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    )
      .setOrigin(0, 0.5)
      .setDepth(5);


    // +
    const plus = this.add.circle(
      W - 350,
      32,
      13,
      0x46bd59
    )
      .setStrokeStyle(2, 0xffffff)
      .setDepth(5)
      .setInteractive({
        useHandCursor: true
      });


    this.add.text(
      W - 350,
      32,
      '+',
      {
        fontFamily: FONT,
        fontSize: '19px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    )
      .setOrigin(0.5)
      .setDepth(6);


    plus.on('pointerdown', () => {
      this.toast('เพชรสามารถหาได้จากการเล่นและรางวัลสะสม');
    });


    // ตั๋ว
    if (this.textures.exists('gacha_ticket')) {

      this.add.image(
        W - 290,
        32,
        'gacha_ticket'
      )
        .setDisplaySize(27, 27)
        .setDepth(5);

    } else {

      this.add.rectangle(
        W - 290,
        32,
        25,
        25,
        0x4da6ff
      )
        .setDepth(5);

    }


    this.ticketText = this.add.text(
      W - 270,
      32,
      '0',
      {
        fontFamily: FONT,
        fontSize: '17px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    )
      .setOrigin(0, 0.5)
      .setDepth(5);
  }


  // ===================================================================
  // MAIN PANEL
  // ===================================================================

  createMainPanel() {

    const x = 365;
    const y = 250;
    const w = 590;
    const h = 355;


    // แผงหลัก
    if (this.textures.exists('gacha_result_panel')) {

      this.mainPanel = this.add.image(
        x,
        y,
        'gacha_result_panel'
      )
        .setDisplaySize(w, h)
        .setDepth(2);

    } else {

      this.mainPanel = this.add.rectangle(
        x,
        y,
        w,
        h,
        0x7a238f
      )
        .setStrokeStyle(5, 0xf3c83b)
        .setDepth(2);

    }


    // แถบ NEW
    this.add.rectangle(
      x - 220,
      y - 140,
      90,
      34,
      0xe52d55
    )
      .setDepth(4);


    this.add.text(
      x - 220,
      y - 140,
      'ใหม่',
      {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    )
      .setOrigin(0.5)
      .setDepth(5);


    // ชื่อ Banner
    this.add.text(
      x,
      y - 125,
      'เปิดตัวเรนเจอร์ใหม่',
      {
        fontFamily: FONT,
        fontSize: '25px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#52205f',
        strokeThickness: 4
      }
    )
      .setOrigin(0.5)
      .setDepth(5);


    this.add.text(
      x,
      y - 92,
      'ULTRA RARE',
      {
        fontFamily: FONT,
        fontSize: '19px',
        color: '#ffd23f',
        fontStyle: 'bold'
      }
    )
      .setOrigin(0.5)
      .setDepth(5);


    // เอฟเฟกต์กลาง
    this.add.circle(
      x,
      y + 15,
      65,
      0xffe9ff,
      0.15
    )
      .setStrokeStyle(
        3,
        0xffffff,
        0.5
      )
      .setDepth(3);


    this.add.circle(
      x,
      y + 15,
      30,
      0xffffff,
      0.8
    )
      .setDepth(3);


    // ลูกศรซ้าย
    const left = this.add.text(
      x - 250,
      y + 10,
      '‹',
      {
        fontFamily: FONT,
        fontSize: '70px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    )
      .setOrigin(0.5)
      .setDepth(6)
      .setInteractive({
        useHandCursor: true
      });


    left.on('pointerdown', () => {
      this.toast('Banner ก่อนหน้า');
    });


    // ลูกศรขวา
    const right = this.add.text(
      x + 250,
      y + 10,
      '›',
      {
        fontFamily: FONT,
        fontSize: '70px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    )
      .setOrigin(0.5)
      .setDepth(6)
      .setInteractive({
        useHandCursor: true
      });


    right.on('pointerdown', () => {
      this.toast('Banner ถัดไป');
    });


    // ชื่อเรท
    this.add.text(
      x,
      y + 145,
      'ULTRA RARE ★7~★8',
      {
        fontFamily: FONT,
        fontSize: '21px',
        color: '#ffd23f',
        fontStyle: 'bold',
        stroke: '#542000',
        strokeThickness: 4
      }
    )
      .setOrigin(0.5)
      .setDepth(5);


    // Info
    const info = this.add.circle(
      x + 245,
      y + 145,
      14,
      0x8e245e
    )
      .setStrokeStyle(2, 0xffffff)
      .setDepth(5)
      .setInteractive({
        useHandCursor: true
      });


    this.add.text(
      x + 245,
      y + 145,
      '?',
      {
        fontFamily: FONT,
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    )
      .setOrigin(0.5)
      .setDepth(6);


    info.on('pointerdown', () => {
      this.toast('รายละเอียดอัตราสุ่มรางวัล');
    });
  }


  // ===================================================================
  // RIGHT PANEL
  // ===================================================================

  createRightPanel() {

    const x = 865;


    this.add.text(
      x,
      85,
      'RANGERS',
      {
        fontFamily: FONT,
        fontSize: '19px',
        color: '#ffe066',
        fontStyle: 'bold',
        backgroundColor: '#7a275d',
        padding: {
          x: 15,
          y: 7
        }
      }
    )
      .setOrigin(0.5)
      .setDepth(5);


    this.add.text(
      x + 100,
      85,
      'อุปกรณ์',
      {
        fontFamily: FONT,
        fontSize: '17px',
        color: '#ffffff',
        backgroundColor: '#6e6e6e',
        padding: {
          x: 12,
          y: 7
        }
      }
    )
      .setOrigin(0.5)
      .setDepth(5);


    // การ์ด Ultra Rare
    this.createBannerCard(
      x,
      150,
      'ULTRA RARE',
      '★7 ~ ★8',
      0x7a3a78
    );


    // การ์ด Event
    this.createBannerCard(
      x,
      245,
      'EVENT',
      '31 วัน',
      0x4168a8
    );


    this.createBannerCard(
      x,
      340,
      'EVENT',
      '31 วัน',
      0x4168a8
    );


    // การันตี
    this.createBannerCard(
      x,
      435,
      'สุ่มครบ 100 ครั้ง',
      '0 / 100',
      0x8c4a91
    );
  }


  // ===================================================================
  // BANNER CARD
  // ===================================================================

  createBannerCard(
    x,
    y,
    title,
    sub,
    color
  ) {

    const bg = this.add.rectangle(
      x,
      y,
      205,
      78,
      color
    )
      .setStrokeStyle(
        3,
        0xf2d34d
      )
      .setDepth(4)
      .setInteractive({
        useHandCursor: true
      });


    this.add.text(
      x,
      y - 17,
      title,
      {
        fontFamily: FONT,
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    )
      .setOrigin(0.5)
      .setDepth(5);


    this.add.text(
      x,
      y + 15,
      sub,
      {
        fontFamily: FONT,
        fontSize: '14px',
        color: '#ffe066',
        fontStyle: 'bold'
      }
    )
      .setOrigin(0.5)
      .setDepth(5);


    bg.on(
      'pointerdown',
      () => {
        this.toast(
          `${title} : ${sub}`
        );
      }
    );
  }


  // ===================================================================
  // SUMMON BUTTONS
  // ===================================================================

  createSummonButtons() {

    const y = H - 95;


    // ---------------------------------------------------------------
    // ×1
    // ---------------------------------------------------------------

    this.btn1 = this.createSummonButton(
      330,
      y,
      'ครั้ง',
      GACHA_COST,
      1
    );


    // ---------------------------------------------------------------
    // ×10
    // ---------------------------------------------------------------

    this.btn10 = this.createSummonButton(
      555,
      y,
      '6+1 ครั้ง',
      GACHA_COST_10,
      10
    );


    // ประวัติ
    const history = this.add.rectangle(
      W - 115,
      H - 30,
      120,
      38,
      0x628e38
    )
      .setStrokeStyle(
        3,
        0xd6d95c
      )
      .setDepth(5)
      .setInteractive({
        useHandCursor: true
      });


    this.add.text(
      W - 115,
      H - 30,
      'ประวัติ',
      {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    )
      .setOrigin(0.5)
      .setDepth(6);


    history.on(
      'pointerdown',
      () => {
        this.toast('ยังไม่มีประวัติการสุ่ม');
      }
    );
  }


  // ===================================================================
  // SUMMON BUTTON
  // ===================================================================

  createSummonButton(
    x,
    y,
    label,
    cost,
    count
  ) {

    let bg;


    if (
      this.textures.exists(
        'gacha_summon_button'
      )
    ) {

      bg = this.add.image(
        x,
        y,
        'gacha_summon_button'
      )
        .setDisplaySize(
          205,
          66
        )
        .setDepth(5)
        .setInteractive({
          useHandCursor: true
        });

    } else {

      bg = this.add.rectangle(
        x,
        y,
        205,
        66,
        0xffdc35
      )
        .setStrokeStyle(
          3,
          0xffffff
        )
        .setDepth(5)
        .setInteractive({
          useHandCursor: true
        });

    }


    this.add.text(
      x - 42,
      y,
      label,
      {
        fontFamily: FONT,
        fontSize: '19px',
        color: '#5a3b00',
        fontStyle: 'bold'
      }
    )
      .setOrigin(0.5)
      .setDepth(6);


    // ไอคอนเพชร
    this.add.circle(
      x + 35,
      y,
      11,
      0xe84a9a
    )
      .setStrokeStyle(
        2,
        0xffffff
      )
      .setDepth(6);


    this.add.text(
      x + 57,
      y,
      String(cost),
      {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#5a3b00',
        fontStyle: 'bold'
      }
    )
      .setOrigin(0.5)
      .setDepth(6);


    bg.on(
      'pointerdown',
      () => {
        this.pull(
          count,
          cost
        );
      }
    );


    bg.on(
      'pointerover',
      () => {
        this.tweens.add({
          targets: bg,
          scaleX: 1.04,
          scaleY: 1.04,
          duration: 100
        });
      }
    );


    bg.on(
      'pointerout',
      () => {
        this.tweens.add({
          targets: bg,
          scaleX: 1,
          scaleY: 1,
          duration: 100
        });
      }
    );


    return {
      bg: bg,
      cost: cost
    };
  }


  // ===================================================================
  // REFRESH
  // ===================================================================

  refresh() {

    if (this.gemText) {

      this.gemText.setText(
        String(SAVE.gems)
      );

    }


    if (this.ticketText) {

      this.ticketText.setText(
        '0'
      );

    }


    if (this.btn1) {

      this.btn1.bg.setAlpha(
        SAVE.gems >= this.btn1.cost
          ? 1
          : 0.45
      );

    }


    if (this.btn10) {

      this.btn10.bg.setAlpha(
        SAVE.gems >= this.btn10.cost
          ? 1
          : 0.45
      );

    }
  }


  // ===================================================================
  // PULL
  // ===================================================================

  pull(
    count,
    cost
  ) {

    if (this.busy) {
      return;
    }


    if (SAVE.gems < cost) {

      this.toast(
        'เพชรไม่พอ'
      );


      if (this.gemText) {

        this.tweens.add({
          targets: this.gemText,
          alpha: 0.2,
          duration: 80,
          yoyo: true,
          repeat: 2
        });

      }

      return;
    }


    this.busy = true;


    SAVE.gems -= cost;


    const results = [];


    for (
      let i = 0;
      i < count;
      i++
    ) {

      results.push(
        this.roll()
      );

    }


    writeSave();


    this.refresh();


    // Animation
    this.tweens.add({

      targets: this.mainPanel,

      scaleX: 1.025,
      scaleY: 1.025,

      duration: 100,

      yoyo: true,

      repeat: 4,

      onComplete: () => {

        this.showResults(
          results
        );

        this.busy = false;

      }

    });
  }


  // ===================================================================
  // ROLL
  // ===================================================================

  roll() {

    const total =
      GACHA_PRIZES.reduce(
        (s, p) => s + p.w,
        0
      );


    let r =
      Math.random() *
      total;


    let prize =
      GACHA_PRIZES[0];


    for (
      const p of GACHA_PRIZES
    ) {

      if (r < p.w) {

        prize = p;
        break;

      }

      r -= p.w;
    }


    // ---------------------------------------------------------------
    // LEVEL
    // ---------------------------------------------------------------

    if (
      prize.kind === 'level'
    ) {

      const candidates =
        UNIT_KEYS.filter(
          k =>
            SAVE.seen[k] &&
            SAVE.levels[k] < MAX_LEVEL
        );


      if (candidates.length) {

        const key =
          Phaser.Utils.Array.GetRandom(
            candidates
          );


        SAVE.levels[key]++;


        return {

          kind: 'level',

          key: key,

          text:
            `${UNITS[key].name}\nอัปเป็น Lv ${SAVE.levels[key]}`

        };

      }


      prize =
        GACHA_PRIZES[0];
    }


    // ---------------------------------------------------------------
    // UNIT
    // ---------------------------------------------------------------

    if (
      prize.kind === 'unit'
    ) {

      const candidates =
        UNIT_KEYS.filter(
          k =>
            !SAVE.seen[k]
        );


      if (candidates.length) {

        const key =
          Phaser.Utils.Array.GetRandom(
            candidates
          );


        discoverUnit(
          key
        );


        return {

          kind: 'unit',

          key: key,

          text:
            `ค้นพบ!\n${UNITS[key].name}\n+${GEM_DISCOVER} ◆`

        };

      }


      // ถ้าค้นพบครบแล้ว
      prize =
        GACHA_PRIZES.find(
          p =>
            p.kind === 'gold' &&
            p.gold > 100
        ) ||
        GACHA_PRIZES[0];
    }


    // ---------------------------------------------------------------
    // GOLD
    // ---------------------------------------------------------------

    SAVE.gold +=
      prize.gold;


    return {

      kind: 'gold',

      text:
        `+${prize.gold}\nทอง`

    };
  }


  // ===================================================================
  // SHOW RESULTS
  // ===================================================================

  showResults(
    results
  ) {

    this.res.removeAll(
      true
    );


    const n =
      results.length;


    results.forEach(
      (r, i) => {

        let col;
        let row;


        if (n === 1) {

          col = 0;
          row = 0;

        } else {

          col =
            i % 5;

          row =
            Math.floor(
              i / 5
            );

        }


        const x =
          n === 1
            ? W / 2
            : 430 +
              col * 95;


        const y =
          n === 1
            ? H / 2
            : 190 +
              row * 125;


        const card =
          this.add.container(
            x,
            y
          );


        let fill =
          0x3a2c1c;


        let border =
          0x8a6a3a;


        if (
          r.kind === 'unit'
        ) {

          fill =
            0x702c78;

          border =
            0xffd23f;

        }


        if (
          r.kind === 'level'
        ) {

          fill =
            0x1d3b52;

          border =
            0x4da6ff;

        }


        card.add(
          this.add.rectangle(
            0,
            0,
            86,
            112,
            fill
          )
            .setStrokeStyle(
              3,
              border
            )
        );


        // ภาพตัวละคร
        if (
          r.key &&
          typeof unitPortrait === 'function'
        ) {

          card.add(
            this.add.ellipse(
              0,
              -20,
              50,
              8,
              0x000000,
              0.3
            )
          );


          const portrait =
            unitPortrait(
              this,
              0,
              -20,
              r.key,
              52
            );


          if (portrait) {

            card.add(
              portrait
            );

          }

        } else {

          card.add(
            this.add.circle(
              0,
              -25,
              17,
              0xffd23f
            )
              .setStrokeStyle(
                3,
                0xb8860b
              )
          );


          card.add(
            this.add.text(
              0,
              -25,
              '◆',
              {
                fontFamily: FONT,
                fontSize: '17px',
                color: '#ffffff',
                fontStyle: 'bold'
              }
            )
              .setOrigin(0.5)
          );
        }


        card.add(
          this.add.text(
            0,
            30,
            r.text,
            {
              fontFamily: FONT,
              fontSize: '11px',
              color:
                r.kind === 'unit'
                  ? '#ffe066'
                  : '#ffffff',
              align: 'center',
              fontStyle: 'bold',
              wordWrap: {
                width: 78
              }
            }
          )
            .setOrigin(0.5)
        );


        card.setScale(
          0
        );


        this.res.add(
          card
        );


        this.tweens.add({

          targets: card,

          scaleX: 1,
          scaleY: 1,

          duration: 250,

          delay:
            i * 100,

          ease:
            'Back.easeOut'

        });

      }
    );


    this.refresh();


    // ปิดผลหลังจากกด
    const close = this.add.text(
      W / 2,
      H - 28,
      'แตะเพื่อปิดผลการสุ่ม',
      {
        fontFamily: FONT,
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: {
          x: 12,
          y: 6
        }
      }
    )
      .setOrigin(0.5)
      .setDepth(101)
      .setInteractive({
        useHandCursor: true
      });


    close.once(
      'pointerdown',
      () => {

        this.res.removeAll(
          true
        );

        close.destroy();

      }
    );
  }


  // ===================================================================
  // TOAST
  // ===================================================================

  toast(
    message
  ) {

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