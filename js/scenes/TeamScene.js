// ---------- หน้าทีม: Drag & Drop ตัวละคร ----------
class TeamScene extends Phaser.Scene {

  constructor() {
    super('team');
  }

  create() {

    // =====================================================
    // STATE
    // =====================================================

    this.dragMoved = false;
    this.dragInList = false;

    this.draggingUnit = false;
    this.dragObject = null;
    this.dragKey = null;
    this.dragFromSlot = -1;

    this.dragStartX = 0;
    this.listStartX = 0;

    // =====================================================
    // BACKGROUND
    // =====================================================

    this.add.rectangle(
      W / 2,
      H / 2,
      W,
      H,
      0xd9c08a
    );

    for (let r = 0; r < 6; r++) {

      for (let c = 0; c < 10; c++) {

        this.add.rectangle(
          c * 90 + (r % 2) * 45,
          30 + r * 40,
          86,
          36,
          0xe2cb98
        )
        .setStrokeStyle(
          1,
          0xb99a62,
          0.6
        );
      }
    }

    this.add.rectangle(
      W / 2,
      352,
      W,
      196,
      0x4a3320
    );

    // =====================================================
    // HEADER
    // =====================================================

    const back =
      this.add.circle(
        32,
        30,
        20,
        0xffd23f
      )
      .setStrokeStyle(
        3,
        0x8a5a10
      )
      .setInteractive({
        useHandCursor: true
      });

    this.add.text(
      32,
      30,
      '◀',
      {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#5a3a08',
        fontStyle: 'bold'
      }
    )
    .setOrigin(0.5);

    back.on(
      'pointerdown',
      () => {
        this.scene.start('lobby');
      }
    );

    this.add.text(
      64,
      30,
      'ทีม',
      {
        fontFamily: FONT,
        fontSize: '34px',
        color: '#ffd23f',
        fontStyle: 'bold',
        stroke: '#5a3a08',
        strokeThickness: 6
      }
    )
    .setOrigin(
      0,
      0.5
    );

    this.countText =
      this.add.text(
        134,
        32,
        '',
        {
          fontFamily: FONT,
          fontSize: '20px',
          color: '#fff',
          stroke: '#5a3a08',
          strokeThickness: 4
        }
      )
      .setOrigin(
        0,
        0.5
      );

    // =====================================================
    // GOLD
    // =====================================================

    this.add.rectangle(
      690,
      26,
      150,
      26,
      0x101a30,
      0.92
    )
    .setStrokeStyle(
      2,
      0x3a4a70
    );

    this.add.circle(
      622,
      26,
      13,
      0xffb300
    )
    .setStrokeStyle(
      2,
      0xffffff,
      0.7
    );

    this.add.text(
      622,
      26,
      '$',
      {
        fontFamily: FONT,
        fontSize: '14px',
        color: '#fff',
        fontStyle: 'bold'
      }
    )
    .setOrigin(0.5);

    this.add.text(
      698,
      26,
      Math.floor(
        SAVE.gold
      ).toLocaleString('en-US'),
      {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#fff',
        fontStyle: 'bold'
      }
    )
    .setOrigin(0.5);

    // =====================================================
    // SLOT POSITIONS
    // =====================================================

    this.slotX = [
      100,
      250,
      400,
      550,
      700
    ];

    // =====================================================
    // SLOT BASE
    // =====================================================

    this.slotX.forEach(
      x => {

        this.add.ellipse(
          x,
          178,
          118,
          30,
          0x8c7a58
        );

        this.add.rectangle(
          x,
          164,
          118,
          28,
          0xa8956c
        );

        this.add.ellipse(
          x,
          150,
          118,
          30,
          0xe0d2ae
        )
        .setStrokeStyle(
          3,
          0x8c7a58
        );
      }
    );

    // =====================================================
    // HELP BAR
    // =====================================================

    this.add.rectangle(
      W / 2,
      236,
      W,
      36,
      0x6b4a2a
    )
    .setStrokeStyle(
      2,
      0x3a2410
    );

    this.add.text(
      14,
      236,
      'ลากที่รูปตัวละครเพื่อจัดทีม · ลากรูปบนแท่นเพื่อเปลี่ยนตำแหน่ง',
      {
        fontFamily: FONT,
        fontSize: '13px',
        color: '#ffe0a3'
      }
    )
    .setOrigin(
      0,
      0.5
    );

    // =====================================================
    // FILTER
    // =====================================================

    [
      'ระดับ ▾',
      'ราคา ▾',
      'ธาตุ ▾',
      'ล่าสุด ▾'
    ]
    .forEach(
      (label, i) => {

        const x =
          522 + i * 82;

        const b =
          this.add.rectangle(
            x,
            236,
            76,
            26,
            0x2f6fb0
          )
          .setStrokeStyle(
            2,
            0xffffff,
            0.85
          )
          .setInteractive({
            useHandCursor: true
          });

        this.add.text(
          x,
          236,
          label,
          {
            fontFamily: FONT,
            fontSize: '13px',
            color: '#fff',
            fontStyle: 'bold'
          }
        )
        .setOrigin(0.5);

        b.on(
          'pointerdown',
          () => {

            this.toast(
              'ตัวกรองยังไม่เปิดให้ใช้งาน'
            );
          }
        );
      }
    );

    // =====================================================
    // LAYERS
    // =====================================================

    this.slotLayer =
      this.add.container(
        0,
        0
      );

    this.listLayer =
      this.add.container(
        0,
        0
      );

    // =====================================================
    // TOAST
    // =====================================================

    this.toastText =
      this.add.text(
        W / 2,
        62,
        '',
        {
          fontFamily: FONT,
          fontSize: '17px',
          color: '#fff',
          backgroundColor: '#000000cc',
          padding: {
            x: 12,
            y: 6
          }
        }
      )
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(1000);

    // =====================================================
    // HORIZONTAL LIST SCROLL
    // =====================================================

    this.minX =
      Math.min(
        0,
        W -
        (
          20 +
          UNIT_KEYS.length * 160
        )
      );

    this.input.on(
      'pointerdown',
      this.handlePointerDown,
      this
    );

    this.input.on(
      'pointermove',
      this.handlePointerMove,
      this
    );

    this.input.on(
      'pointerup',
      this.handlePointerUp,
      this
    );

    // =====================================================
    // BUILD
    // =====================================================

    this.refresh();
  }

  // =====================================================
  // GLOBAL POINTER DOWN
  // ใช้เฉพาะเลื่อนรายการซ้าย-ขวา
  // =====================================================

  handlePointerDown(pointer) {

    if (
      this.draggingUnit
    ) {
      return;
    }

    if (
      pointer.y >= 258 &&
      pointer.y <= H
    ) {

      this.dragStartX =
        pointer.x;

      this.listStartX =
        this.listLayer.x;

      this.dragMoved = false;

      this.dragInList = true;
    }
  }

  // =====================================================
  // GLOBAL POINTER MOVE
  // =====================================================

  handlePointerMove(pointer) {

    // -----------------------------------------------------
    // ถ้ากำลังลากตัวละคร
    // -----------------------------------------------------

    if (
      this.draggingUnit
    ) {

      if (
        this.dragObject
      ) {

        this.dragObject.x =
          pointer.x;

        this.dragObject.y =
          pointer.y;
      }

      return;
    }

    // -----------------------------------------------------
    // เลื่อนรายการซ้าย-ขวา
    // -----------------------------------------------------

    if (
      !pointer.isDown ||
      !this.dragInList ||
      this.minX >= 0
    ) {
      return;
    }

    const dx =
      pointer.x -
      this.dragStartX;

    if (
      Math.abs(dx) > 8
    ) {

      this.dragMoved = true;
    }

    if (
      this.dragMoved
    ) {

      this.listLayer.x =
        Phaser.Math.Clamp(
          this.listStartX + dx,
          this.minX,
          0
        );
    }
  }

  // =====================================================
  // GLOBAL POINTER UP
  // =====================================================

  handlePointerUp(pointer) {

    if (
      this.draggingUnit
    ) {

      this.finishUnitDrag(
        pointer
      );

      return;
    }

    this.dragInList = false;
  }

  // =====================================================
  // REFRESH
  // =====================================================

  refresh() {

    this.countText.setText(
      `${SAVE.team.length}/${TEAM_SIZE}`
    );

    this.buildSlots();

    this.buildCards();
  }

  // =====================================================
  // STAR
  // =====================================================

  starText(lv) {

    const n =
      Math.min(
        5,
        Math.ceil(lv / 2)
      );

    return (
      '★'.repeat(n) +
      '☆'.repeat(5 - n)
    );
  }

  // =====================================================
  // DIAMOND
  // =====================================================

  diamond(x, y) {

    return this.add.polygon(
      x,
      y,
      [
        0, 9,
        9, 0,
        18, 9,
        9, 18
      ],
      0x3aa7ff
    )
    .setStrokeStyle(
      2,
      0xffffff,
      0.9
    );
  }

  // =====================================================
  // PORTRAIT
  // =====================================================

  makePortrait(
    x,
    feetY,
    key,
    targetH
  ) {

    const def =
      UNITS[key];

    if (
      def.sprite &&
      this.textures.exists(
        'unit_' + key
      )
    ) {

      return this.add.sprite(
        x,
        feetY,
        'unit_' + key,
        def.sprite.walk[0]
      )
      .setOrigin(
        0.5,
        122 / 128
      )
      .setScale(
        targetH /
        def.sprite.frameHeight
      );
    }

    const f =
      targetH / 48;

    const w =
      def.size * f;

    const h =
      def.size *
      1.6 *
      f;

    return this.add.rectangle(
      x,
      feetY - h / 2,
      w,
      h,
      def.color
    )
    .setStrokeStyle(
      2,
      0x0b3d91
    );
  }

  // =====================================================
  // BUILD SLOTS
  // =====================================================

  buildSlots() {

    this.slotLayer.removeAll(
      true
    );

    for (
      let i = 0;
      i < TEAM_SIZE;
      i++
    ) {

      const x =
        this.slotX[i];

      const key =
        SAVE.team[i];

      // ---------------------------------------------------
      // ช่องแท่น
      // ---------------------------------------------------

      const hit =
        this.add.rectangle(
          x,
          120,
          118,
          130,
          0xffffff,
          0.001
        );

      // ช่องแท่นไม่ต้อง interactive
      // ถ้ามีตัวละคร เพราะเราจะลากจาก "รูป" เท่านั้น

      if (key) {

        const def =
          UNITS[key];

        // -------------------------------------------------
        // รูปตัวละคร
        // -------------------------------------------------

        const portrait =
          this.makePortrait(
            x,
            146,
            key,
            80
          );

        portrait.setInteractive({
          useHandCursor: true
        });

        portrait.on(
          'pointerdown',
          pointer => {

            if (
              pointer.event
            ) {
              pointer.event.stopPropagation();
            }

            this.startUnitDrag(
              pointer,
              key,
              i
            );
          }
        );

        // -------------------------------------------------
        // ดาว
        // -------------------------------------------------

        const stars =
          this.add.text(
            x,
            164,
            this.starText(
              SAVE.levels[key]
            ),
            {
              fontFamily: FONT,
              fontSize: '13px',
              color: '#ffd23f',
              stroke: '#5a3a08',
              strokeThickness: 3
            }
          )
          .setOrigin(0.5);

        // -------------------------------------------------
        // COST
        // -------------------------------------------------

        const dia =
          this.diamond(
            x - 22,
            202
          );

        const cost =
          this.add.text(
            x - 8,
            202,
            String(def.cost),
            {
              fontFamily: FONT,
              fontSize: '20px',
              color: '#3a2410',
              fontStyle: 'bold'
            }
          )
          .setOrigin(
            0,
            0.5
          );

        // -------------------------------------------------
        // ELEMENT / TYPE
        // -------------------------------------------------

        const tagS =
          this.add.text(
            x + 40,
            104,
            ELEMENTS[def.element].icon +
            TYPES[def.type].icon,
            {
              fontFamily: FONT,
              fontSize: '16px'
            }
          )
          .setOrigin(0.5);

        this.slotLayer.add([
          hit,
          portrait,
          stars,
          dia,
          cost,
          tagS
        ]);

      } else {

        // -------------------------------------------------
        // EMPTY SLOT
        // -------------------------------------------------

        const plus =
          this.add.text(
            x,
            112,
            '+',
            {
              fontFamily: FONT,
              fontSize: '48px',
              color: '#b99a62',
              fontStyle: 'bold'
            }
          )
          .setOrigin(0.5);

        const empty =
          this.add.text(
            x,
            202,
            'ลากมาวางที่นี่',
            {
              fontFamily: FONT,
              fontSize: '14px',
              color: '#8c7a58'
            }
          )
          .setOrigin(0.5);

        this.slotLayer.add([
          hit,
          plus,
          empty
        ]);
      }
    }
  }

  // =====================================================
  // BUILD CARDS
  // =====================================================

  buildCards() {

    this.listLayer.removeAll(
      true
    );

    const top = 264;

    UNIT_KEYS.forEach(
      (key, i) => {

        const def =
          UNITS[key];

        const lv =
          SAVE.levels[key];

        const inTeam =
          SAVE.team.includes(key);

        const cx =
          95 + i * 160;

        // -------------------------------------------------
        // CARD
        // ไม่มีกรอบเขียว
        // -------------------------------------------------

        const bg =
          this.add.rectangle(
            cx,
            top + 82,
            150,
            164,
            0xffd23f
          )
          .setStrokeStyle(
            4,
            0xb88a00
          );

        const inner =
          this.add.rectangle(
            cx,
            top + 82,
            138,
            152,
            0xfff0a8
          );

        // -------------------------------------------------
        // STAR
        // -------------------------------------------------

        const stars =
          this.add.text(
            cx,
            top + 16,
            this.starText(lv),
            {
              fontFamily: FONT,
              fontSize: '17px',
              color: '#e39b00'
            }
          )
          .setOrigin(0.5);

        // -------------------------------------------------
        // PORTRAIT
        // -------------------------------------------------

        const portrait =
          this.makePortrait(
            cx - 38,
            top + 112,
            key,
            66
          );

        // =================================================
        // สำคัญ:
        // ลากได้ "เฉพาะรูปตัวละคร"
        // =================================================

        portrait.setInteractive({
          useHandCursor: true
        });

        portrait.on(
          'pointerdown',
          pointer => {

            if (
              pointer.event
            ) {
              pointer.event.stopPropagation();
            }

            this.startUnitDrag(
              pointer,
              key,
              SAVE.team.indexOf(key)
            );
          }
        );

        // -------------------------------------------------
        // NAME
        // -------------------------------------------------

        const name =
          this.add.text(
            cx + 30,
            top + 54,
            def.name,
            {
              fontFamily: FONT,
              fontSize: '18px',
              color: '#3a2410',
              fontStyle: 'bold'
            }
          )
          .setOrigin(0.5);

        // -------------------------------------------------
        // LEVEL
        // -------------------------------------------------

        const lvText =
          this.add.text(
            cx + 30,
            top + 78,
            `LV ${lv}/${MAX_LEVEL}`,
            {
              fontFamily: FONT,
              fontSize: '14px',
              color: '#5a3a08',
              fontStyle: 'bold'
            }
          )
          .setOrigin(0.5);

        // -------------------------------------------------
        // COST
        // -------------------------------------------------

        const dia =
          this.diamond(
            cx + 14,
            top + 103
          );

        const cost =
          this.add.text(
            cx + 28,
            top + 103,
            String(def.cost),
            {
              fontFamily: FONT,
              fontSize: '18px',
              color: '#3a2410',
              fontStyle: 'bold'
            }
          )
          .setOrigin(
            0,
            0.5
          );

        // -------------------------------------------------
        // STATUS
        // -------------------------------------------------

        const strip =
          this.add.rectangle(
            cx,
            top + 148,
            138,
            24,
            inTeam
              ? 0x8c7a58
              : 0xc9a24a
          );

        const stripText =
          this.add.text(
            cx,
            top + 148,
            inTeam
              ? 'อยู่ในทีม'
              : 'ลากรูปเพื่อเลือก',
            {
              fontFamily: FONT,
              fontSize: '13px',
              color: '#fff',
              fontStyle: 'bold'
            }
          )
          .setOrigin(0.5);

        // -------------------------------------------------
        // INFO BUTTON
        // -------------------------------------------------

        const infoBg =
          this.add.circle(
            cx + 60,
            top + 15,
            11,
            0x7a4a24
          )
          .setStrokeStyle(
            2,
            0xffffff,
            0.9
          )
          .setInteractive({
            useHandCursor: true
          });

        const infoText =
          this.add.text(
            cx + 60,
            top + 15,
            'i',
            {
              fontFamily: FONT,
              fontSize: '14px',
              color: '#fff',
              fontStyle: 'bold'
            }
          )
          .setOrigin(0.5);

        infoBg.on(
          'pointerdown',
          pointer => {

            if (
              pointer.event
            ) {
              pointer.event.stopPropagation();
            }

            this.scene.start(
              'character',
              {
                sel: i,
                from: 'team'
              }
            );
          }
        );

        // -------------------------------------------------
        // ELEMENT / TYPE
        // -------------------------------------------------

        const tag =
          this.add.text(
            cx + 30,
            top + 124,
            `${ELEMENTS[def.element].icon} ${TYPES[def.type].icon} ${TYPES[def.type].name}`,
            {
              fontFamily: FONT,
              fontSize: '12px',
              color: '#5a3a08',
              fontStyle: 'bold'
            }
          )
          .setOrigin(0.5);

        // -------------------------------------------------
        // ADD TO LIST
        // -------------------------------------------------

        this.listLayer.add([
          bg,
          inner,
          stars,
          portrait,
          name,
          lvText,
          dia,
          cost,
          tag,
          strip,
          stripText,
          infoBg,
          infoText
        ]);
      }
    );
  }

  // =====================================================
  // START DRAG
  // =====================================================

  startUnitDrag(
    pointer,
    key,
    fromSlot
  ) {

    if (
      !key ||
      this.draggingUnit
    ) {
      return;
    }

    this.draggingUnit = true;

    this.dragKey = key;

    this.dragFromSlot =
      fromSlot;

    // -----------------------------------------------------
    // ถ้าลากจากแท่น
    // เอาออกจาก SAVE ชั่วคราว
    // -----------------------------------------------------

    if (
      fromSlot >= 0
    ) {

      SAVE.team.splice(
        fromSlot,
        1
      );
    }

    // -----------------------------------------------------
    // สร้างรูปที่กำลังลาก
    // -----------------------------------------------------

    const def =
      UNITS[key];

    if (
      def.sprite &&
      this.textures.exists(
        'unit_' + key
      )
    ) {

      this.dragObject =
        this.add.sprite(
          pointer.x,
          pointer.y,
          'unit_' + key,
          def.sprite.walk[0]
        )
        .setOrigin(
          0.5,
          122 / 128
        )
        .setScale(
          0.85
        );

    } else {

      const h = 65;

      this.dragObject =
        this.add.rectangle(
          pointer.x,
          pointer.y - h / 2,
          45,
          h,
          def.color
        )
        .setStrokeStyle(
          3,
          0xffffff
        );
    }

    this.dragObject
      .setDepth(2000)
      .setAlpha(0.85);

    this.toast(
      'ลากไปวางบนแท่น'
    );
  }

  // =====================================================
  // FINISH DRAG
  // =====================================================

  finishUnitDrag(
    pointer
  ) {

    if (
      !this.draggingUnit
    ) {
      return;
    }

    const key =
      this.dragKey;

    const targetSlot =
      this.getSlotAt(
        pointer.x,
        pointer.y
      );

    // -----------------------------------------------------
    // วางบนแท่น
    // -----------------------------------------------------

    if (
      targetSlot >= 0
    ) {

      const oldKey =
        SAVE.team[targetSlot];

      // ---------------------------------------------------
      // ช่องมีตัวละคร
      // ---------------------------------------------------

      if (oldKey) {

        // ลากจากแท่น
        if (
          this.dragFromSlot >= 0
        ) {

          // ใส่ตัวเดิมกลับเข้าไป
          SAVE.team.splice(
            this.dragFromSlot,
            0,
            oldKey
          );

          // หาตำแหน่งใหม่ของช่องปลายทาง
          let targetIndex =
            targetSlot;

          if (
            this.dragFromSlot <
            targetSlot
          ) {
            targetIndex--;
          }

          // ย้าย key ไปตำแหน่งปลายทาง
          SAVE.team.splice(
            this.dragFromSlot <
              targetIndex
              ? targetIndex
              : targetIndex,
            0,
            key
          );

          // ลบตัวซ้ำ
          const seen = [];

          SAVE.team =
            SAVE.team.filter(
              k => {

                if (
                  seen.includes(k)
                ) {
                  return false;
                }

                seen.push(k);

                return true;
              }
            );

        } else {

          // จากการ์ดด้านล่าง
          // ถ้าตัวนี้อยู่ในทีมแล้ว ไม่เพิ่มซ้ำ
          if (
            !SAVE.team.includes(key)
          ) {

            SAVE.team[targetSlot] =
              key;
          }
        }

      } else {

        // -------------------------------------------------
        // ช่องว่าง
        // -------------------------------------------------

        if (
          !SAVE.team.includes(key)
        ) {

          SAVE.team.splice(
            targetSlot,
            0,
            key
          );

        } else {

          // ถ้ามีอยู่แล้วแต่ลากจากแท่น
          if (
            this.dragFromSlot >= 0
          ) {

            SAVE.team.splice(
              targetSlot,
              0,
              key
            );
          }
        }
      }

      // ---------------------------------------------------
      // จำกัดจำนวนทีม
      // ---------------------------------------------------

      SAVE.team =
        SAVE.team
          .filter(
            (v, i, arr) =>
              arr.indexOf(v) === i
          )
          .slice(
            0,
            TEAM_SIZE
          );

      writeSave();

      this.cleanupDrag();

      this.refresh();

      return;
    }

    // =====================================================
    // ปล่อยนอกแท่น
    // =====================================================

    if (
      this.dragFromSlot >= 0
    ) {

      SAVE.team.splice(
        this.dragFromSlot,
        0,
        key
      );

      writeSave();
    }

    this.cleanupDrag();

    this.refresh();
  }

  // =====================================================
  // FIND SLOT
  // =====================================================

  getSlotAt(
    x,
    y
  ) {

    // พื้นที่แท่น
    if (
      y < 85 ||
      y > 220
    ) {
      return -1;
    }

    let nearest = -1;

    let distance = 9999;

    this.slotX.forEach(
      (slotX, i) => {

        const d =
          Math.abs(
            x - slotX
          );

        if (
          d < 60 &&
          d < distance
        ) {

          distance = d;

          nearest = i;
        }
      }
    );

    return nearest;
  }

  // =====================================================
  // CLEANUP DRAG
  // =====================================================

  cleanupDrag() {

    if (
      this.dragObject
    ) {

      this.dragObject.destroy();

      this.dragObject = null;
    }

    this.draggingUnit = false;

    this.dragKey = null;

    this.dragFromSlot = -1;

    this.dragInList = false;

    this.dragMoved = false;
  }

  // =====================================================
  // TOAST
  // =====================================================

  toast(message) {

    if (
      !this.toastText
    ) {
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

      delay: 1400,

      duration: 500
    });
  }
}