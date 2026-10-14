class GameScene extends Phaser.Scene {

  constructor() {
    super('game');
  }


  // =========================================================
  // CREATE
  // =========================================================

  create() {

    // ---------------------------------------------------------
    // ซ่อม SAVE ก่อนเริ่มเกม
    // ---------------------------------------------------------

    normalizeSave();


    this.units = [];
    this.kills = 0;
    this.over = false;


    // ---------------------------------------------------------
    // ENERGY CAPACITY
    // ---------------------------------------------------------

    const capacityLevel =
      Math.max(
        1,
        Math.min(
          BASE_UPGRADES.energyCapacity.max,
          safeNumber(
            SAVE.up.energyCapacity,
            1
          )
        )
      );


    this.energy =
      BASE_UPGRADES
        .energyCapacity
        .value(capacityLevel);


    // ---------------------------------------------------------
    // ทีม
    // ---------------------------------------------------------

    this.teamKeys =
      Array.isArray(SAVE.team)
        ? SAVE.team.slice()
        : [];


    if (
      this.teamKeys.length === 0 &&
      typeof UNIT_KEYS !== 'undefined'
    ) {

      this.teamKeys =
        UNIT_KEYS.slice(
          0,
          TEAM_SIZE
        );
    }


    // ---------------------------------------------------------
    // Enemy
    // ---------------------------------------------------------

    this.enemyEnergy =
      BASE_MAX_ENERGY;

    this.aiTimer = 3000;

    this.econLv = 1;


    // =========================================================
    // Animation
    // =========================================================

    for (const k of UNIT_KEYS) {

      const s = UNITS[k].sprite;

      if (
        !s ||
        !this.textures.exists('unit_' + k)
      ) {

        continue;
      }


      for (const side of ['', 'e_']) {

        const o =
          side
            ? this.enemyFrameOffset(k)
            : 0;


        if (side && !o) {
          continue;
        }


        if (
          !this.anims.exists(
            side + k + '-walk'
          )
        ) {

          this.anims.create({

            key:
              side +
              k +
              '-walk',

            frameRate: 8,

            repeat: -1,

            frames:
              this.anims.generateFrameNumbers(
                'unit_' + k,
                {
                  start:
                    s.walk[0] + o,

                  end:
                    s.walk[1] + o
                }
              )
          });
        }


        if (
          !this.anims.exists(
            side + k + '-attack'
          )
        ) {

          this.anims.create({

            key:
              side +
              k +
              '-attack',

            frameRate: 14,

            repeat: 0,

            frames:
              this.anims.generateFrameNumbers(
                'unit_' + k,
                {
                  start:
                    s.attack[0] + o,

                  end:
                    s.attack[1] + o
                }
              )
          });
        }
      }
    }


    // =========================================================
    // สนาม
    // =========================================================

    this.add.rectangle(
      W / 2,
      GROUND / 2,
      W,
      GROUND,
      0x6ec6ff
    );


    this.add.rectangle(
      W / 2,
      GROUND + (H - GROUND) / 2,
      W,
      H - GROUND,
      0x3b7d3b
    );


    this.add.rectangle(
      W / 2,
      GROUND + 2,
      W,
      4,
      0x2a5c2a
    );


    // =========================================================
    // ฐาน
    // =========================================================

    this.bases = {

      player:
        this.makeBase(
          60,
          0x2d6cdf,

          BASE_UPGRADES
            .baseHp
            .value(
              safeNumber(
                SAVE.up.baseHp,
                1
              )
            )
        ),

      enemy:
        this.makeBase(
          W - 60,
          0xd9473f
        )
    };


    // =========================================================
    // HUD พลังงาน
    // =========================================================

    this.add.rectangle(
      20,
      24,
      200,
      14,
      0x000000,
      0.4
    )
    .setOrigin(0, 0.5);


    this.energyFill =
      this.add.rectangle(
        20,
        24,
        200,
        14,
        0xffd23f
      )
      .setOrigin(0, 0.5);


    this.energyText =
      this.add.text(
        228,
        24,
        '',
        {
          fontFamily: FONT,
          fontSize: '16px',
          color: '#fff'
        }
      )
      .setOrigin(0, 0.5);


    // =========================================================
    // กลับ Lobby
    // =========================================================

    const menuBtn =
      this.add.text(
        W - 16,
        24,
        '☰ ลอบบี้',
        {
          fontFamily: FONT,
          fontSize: '16px',
          color: '#fff',
          backgroundColor: '#00000066',
          padding: {
            x: 8,
            y: 4
          }
        }
      )
      .setOrigin(1, 0.5)
      .setInteractive({
        useHandCursor: true
      });


    menuBtn.on(
      'pointerdown',
      () => {

        normalizeSave();

        if (
          typeof writeSave === 'function'
        ) {

          writeSave();
        }

        this.scene.start('lobby');
      }
    );


    // =========================================================
    // ปุ่มยูนิต
    // =========================================================

    this.buttons =
      this.teamKeys.map(
        (key, i) =>
          this.makeUnitButton(
            key,
            i
          )
      );


    // =========================================================
    // ปุ่มเศรษฐกิจ
    // =========================================================

    const ebg =
      this.add.rectangle(
        66,
        392,
        116,
        56,
        0xffd23f
      )
      .setStrokeStyle(
        3,
        0xffffff,
        0.9
      )
      .setInteractive({
        useHandCursor: true
      });


    const etext =
      this.add.text(
        66,
        392,
        '',
        {
          fontFamily: FONT,
          fontSize: '13px',
          color: '#1a1a1a',
          align: 'center',
          fontStyle: 'bold'
        }
      )
      .setOrigin(0.5);


    ebg.on(
      'pointerdown',
      () => {
        this.tryUpgradeEcon();
      }
    );


    this.econBtn = {
      bg: ebg,
      text: etext
    };


    // =========================================================
    // Keyboard
    // =========================================================

    const kb =
      this.input.keyboard;


    [
      'ONE',
      'TWO',
      'THREE',
      'FOUR',
      'FIVE'
    ]
    .forEach(
      (n, i) => {

        kb.on(
          'keydown-' + n,
          () => {

            if (
              this.teamKeys[i]
            ) {

              this.trySpawnPlayer(
                this.teamKeys[i]
              );
            }
          }
        );
      }
    );


    kb.on(
      'keydown-R',
      () => {
        this.tryUpgradeEcon();
      }
    );
  }


  // =========================================================
  // BASE
  // =========================================================

  makeBase(
    x,
    color,
    hp = BASE_HP
  ) {

    hp =
      Math.max(
        1,
        safeNumber(
          hp,
          BASE_HP
        )
      );


    const container =
      this.add.container(
        0,
        0
      );


    const shadow =
      this.add.ellipse(
        x,
        GROUND - 5,
        92,
        18,
        0x000000,
        0.25
      );


    const rect =
      this.add.rectangle(
        x,
        GROUND - 60,
        60,
        120,
        color
      )
      .setStrokeStyle(
        3,
        0x000000,
        0.5
      );


    const roof =
      this.add.rectangle(
        x,
        GROUND - 125,
        78,
        18,
        color
      )
      .setStrokeStyle(
        3,
        0x000000,
        0.5
      );


    const pole =
      this.add.rectangle(
        x,
        GROUND - 155,
        4,
        35,
        0x5a4632
      );


    const flag =
      this.add.triangle(
        x + 18,
        GROUND - 160,
        0,
        0,
        34,
        10,
        0,
        20,
        color
      );


    const door =
      this.add.rectangle(
        x,
        GROUND - 40,
        18,
        40,
        0x182235
      );


    const windowL =
      this.add.rectangle(
        x - 18,
        GROUND - 82,
        12,
        16,
        0xbcecff
      );


    const windowR =
      this.add.rectangle(
        x + 18,
        GROUND - 82,
        12,
        16,
        0xbcecff
      );


    const crack1 =
      this.add.line(
        x - 8,
        GROUND - 82,
        0,
        0,
        14,
        18,
        0xffffff,
        0
      )
      .setLineWidth(3);


    const crack2 =
      this.add.line(
        x + 10,
        GROUND - 65,
        0,
        0,
        -12,
        22,
        0xffffff,
        0
      )
      .setLineWidth(3);


    const smoke1 =
      this.add.circle(
        x - 18,
        GROUND - 125,
        10,
        0x777777,
        0
      );


    const smoke2 =
      this.add.circle(
        x + 18,
        GROUND - 138,
        8,
        0x777777,
        0
      );


    const warning =
      this.add.rectangle(
        x,
        GROUND - 60,
        66,
        126,
        0xff3b30,
        0
      );


    this.add.rectangle(
      x,
      60,
      80,
      8,
      0x000000,
      0.5
    );


    const bar =
      this.add.rectangle(
        x - 40,
        60,
        80,
        8,
        0xff4d4d
      )
      .setOrigin(
        0,
        0.5
      );


    const stateText =
      this.add.text(
        x,
        78,
        '',
        {
          fontFamily: FONT,
          fontSize: '11px',
          color: '#ffffff',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3
        }
      )
      .setOrigin(0.5);


    container.add([
      shadow,
      rect,
      roof,
      pole,
      flag,
      door,
      windowL,
      windowR,
      crack1,
      crack2,
      smoke1,
      smoke2,
      warning
    ]);


    return {

      hp,

      max: hp,

      x,

      rect,

      roof,

      pole,

      flag,

      door,

      windowL,

      windowR,

      crack1,

      crack2,

      smoke1,

      smoke2,

      warning,

      stateText,

      bar,

      state: -1,

      container,

      baseY:
        GROUND - 60,

      h: 120
    };
  }


  // =========================================================
  // BASE VISUAL
  // =========================================================

  updateBaseVisual(
    base,
    force = false
  ) {

    if (!base) return;


    const max =
      Math.max(
        1,
        safeNumber(
          base.max,
          BASE_HP
        )
      );


    const hp =
      safeNumber(
        base.hp,
        0
      );


    base.max = max;
    base.hp = Math.max(0, hp);


    const ratio =
      Math.max(
        0,
        Math.min(
          1,
          base.hp /
          base.max
        )
      );


    let state = 0;


    if (base.hp <= 0) {

      state = 2;

    }
    else if (ratio <= 0.5) {

      state = 1;
    }


    if (
      !force &&
      state === base.state
    ) {

      return;
    }


    base.state = state;


    // ---------------------------------------------------------
    // ปกติ
    // ---------------------------------------------------------

    if (state === 0) {

      base.rect.setFillStyle(
        base === this.bases.player
          ? 0x2d6cdf
          : 0xd9473f
      );


      base.roof.setFillStyle(
        base === this.bases.player
          ? 0x2458b8
          : 0xb6322d
      );


      base.flag.setFillStyle(
        base === this.bases.player
          ? 0x4da6ff
          : 0xff5b52
      );


      base.crack1.setAlpha(0);
      base.crack2.setAlpha(0);

      base.smoke1.setAlpha(0);
      base.smoke2.setAlpha(0);

      base.warning.setAlpha(0);


      base.stateText
        .setText('ฐาน')
        .setColor('#ffffff');
    }


    // ---------------------------------------------------------
    // กำลังพัง
    // ---------------------------------------------------------

    else if (state === 1) {

      base.rect.setFillStyle(
        0x8c4b35
      );

      base.roof.setFillStyle(
        0x71372a
      );

      base.flag.setFillStyle(
        0xb82d27
      );


      base.crack1.setAlpha(1);
      base.crack2.setAlpha(1);

      base.smoke1.setAlpha(0.5);
      base.smoke2.setAlpha(0.35);

      base.warning.setAlpha(0.12);


      base.stateText
        .setText('⚠ กำลังพัง')
        .setColor('#ffd23f');


      this.tweens.add({

        targets: [
          base.smoke1,
          base.smoke2
        ],

        y: '-=8',

        alpha: {
          from: 0.15,
          to: 0.55
        },

        duration: 650,

        yoyo: true,

        repeat: -1
      });


      this.tweens.add({

        targets:
          base.warning,

        alpha: {
          from: 0.04,
          to: 0.18
        },

        duration: 300,

        yoyo: true,

        repeat: -1
      });
    }


    // ---------------------------------------------------------
    // พัง
    // ---------------------------------------------------------

    else {

      base.rect.setFillStyle(
        0x3b3030
      );

      base.roof.setFillStyle(
        0x2a2424
      );

      base.flag.setFillStyle(
        0x4a2424
      );


      base.crack1.setAlpha(1);
      base.crack2.setAlpha(1);

      base.smoke1.setAlpha(0.7);
      base.smoke2.setAlpha(0.55);

      base.warning.setAlpha(0);


      base.stateText
        .setText('💥 ฐานพัง')
        .setColor('#ff6666');


      base.rect.angle =
        base === this.bases.player
          ? -8
          : 8;


      base.roof.angle =
        base === this.bases.player
          ? -10
          : 10;


      this.tweens.add({

        targets: [
          base.smoke1,
          base.smoke2
        ],

        y: '-=20',

        alpha: {
          from: 0.25,
          to: 0.75
        },

        duration: 900,

        yoyo: true,

        repeat: -1
      });
    }
  }


  // =========================================================
  // UNIT BUTTON
  // =========================================================

  makeUnitButton(
    key,
    i
  ) {

    const def =
      UNITS[key];


    const x =
      190 + i * 106;

    const y =
      392;


    const bg =
      this.add.rectangle(
        x,
        y,
        100,
        56,
        def.color
      )
      .setStrokeStyle(
        3,
        0xffffff,
        0.9
      )
      .setInteractive({
        useHandCursor: true
      });


    this.add.text(
      x,
      y - 9,
      `${i + 1}. ${def.name}`,
      {
        fontFamily: FONT,
        fontSize: '16px',
        color: '#1a1a1a',
        fontStyle: 'bold'
      }
    )
    .setOrigin(0.5);


    const level =
      Math.max(
        1,
        Math.min(
          MAX_LEVEL,
          safeNumber(
            SAVE.levels[key],
            1
          )
        )
      );


    this.add.text(
      x,
      y + 14,
      `Lv${level} · ⚡${def.cost}`,
      {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#1a1a1a'
      }
    )
    .setOrigin(0.5);


    this.add.text(
      x - 43,
      y - 21,
      ELEMENTS[
        def.element
      ].icon,
      {
        fontFamily: FONT,
        fontSize: '12px'
      }
    )
    .setOrigin(0.5);


    this.add.text(
      x + 43,
      y - 21,
      TYPES[
        def.type
      ].icon,
      {
        fontFamily: FONT,
        fontSize: '12px'
      }
    )
    .setOrigin(0.5);


    bg.on(
      'pointerdown',
      () => {

        this.trySpawnPlayer(
          key
        );
      }
    );


    return {
      key,
      bg
    };
  }


  // =========================================================
  // ENERGY CAPACITY
  // =========================================================

  maxEnergy() {

    const capacityLv =
      Math.max(
        1,
        Math.min(
          BASE_UPGRADES.energyCapacity.max,
          safeNumber(
            SAVE.up.energyCapacity,
            1
          )
        )
      );


    const econLv =
      Math.max(
        1,
        Math.min(
          ECON_MAX_LEVEL,
          safeNumber(
            this.econLv,
            1
          )
        )
      );


    return (
      BASE_UPGRADES
        .energyCapacity
        .value(capacityLv)
      +
      ECON_MAX_ENERGY_PER_LEVEL *
      (econLv - 1)
    );
  }


  // =========================================================
  // REGEN
  // =========================================================

  regen() {

    const upgradeLv =
      Math.max(
        1,
        Math.min(
          BASE_UPGRADES.regen.max,
          safeNumber(
            SAVE.up.regen,
            1
          )
        )
      );


    const econLv =
      Math.max(
        1,
        Math.min(
          ECON_MAX_LEVEL,
          safeNumber(
            this.econLv,
            1
          )
        )
      );


    return (
      BASE_UPGRADES
        .regen
        .value(upgradeLv)
      +
      ECON_REGEN_PER_LEVEL *
      (econLv - 1)
    );
  }


  // =========================================================
  // ECON UPGRADE
  // =========================================================

  tryUpgradeEcon() {

    if (this.over) return;


    this.econLv =
      Math.max(
        1,
        Math.min(
          ECON_MAX_LEVEL,
          safeNumber(
            this.econLv,
            1
          )
        )
      );


    if (
      this.econLv >=
      ECON_MAX_LEVEL
    ) {

      return;
    }


    const cost =
      safeNumber(
        econUpgradeCost(
          this.econLv
        ),
        Infinity
      );


    const energy =
      safeNumber(
        this.energy,
        0
      );


    if (
      !Number.isFinite(cost) ||
      !Number.isFinite(energy)
    ) {

      this.energy = 0;

      return;
    }


    if (energy < cost) {
      return;
    }


    this.energy =
      energy - cost;


    this.econLv++;


    this.energy =
      Math.max(
        0,
        Math.min(
          this.maxEnergy(),
          this.energy
        )
      );
  }


  // =========================================================
  // SPAWN PLAYER
  // =========================================================

  trySpawnPlayer(key) {

    if (this.over) return;


    const def =
      UNITS[key];


    if (!def) return;


    const cost =
      safeNumber(
        def.cost,
        Infinity
      );


    if (
      !Number.isFinite(cost) ||
      cost < 0
    ) {

      console.warn(
        '[Unit cost ผิด]',
        key,
        def.cost
      );

      return;
    }


    if (
      !Number.isFinite(
        this.energy
      )
    ) {

      this.energy = 0;

      return;
    }


    if (
      this.energy < cost
    ) {

      return;
    }


    this.energy -= cost;


    this.energy =
      Math.max(
        0,
        Math.min(
          this.maxEnergy(),
          this.energy
        )
      );


    this.spawn(
      'player',
      key
    );
  }


  // =========================================================
  // ENEMY OFFSET
  // =========================================================

  enemyFrameOffset(key) {

    const s =
      UNITS[key].sprite;


    const tex =
      this.textures.exists(
        'unit_' + key
      )
        ? this.textures.get(
            'unit_' + key
          )
        : null;


    if (
      !s ||
      !tex ||
      !s.enemyOffset
    ) {

      return 0;
    }


    return tex.frameTotal >
      s.enemyOffset +
      s.attack[1]

      ? s.enemyOffset

      : 0;
  }


  // =========================================================
  // SPAWN
  // =========================================================

  spawn(
    team,
    key
  ) {

    const def =
      UNITS[key];


    if (!def) return;


    const x =
      team === 'player'
        ? PLAYER_BASE_EDGE +
          SPAWN_OFFSET
        : ENEMY_BASE_EDGE -
          SPAWN_OFFSET;


    const hasSprite =
      !!def.sprite &&
      this.textures.exists(
        'unit_' + key
      );


    if (team === 'player') {

      SAVE.stats.used[key] =
        safeNumber(
          SAVE.stats.used[key],
          0
        ) + 1;
    }


    if (discoverUnit(key)) {

      this.floatText(
        W / 2,
        120,
        `✨ ค้นพบ ${def.name}! +${GEM_DISCOVER} ◆`,
        '#ffe066'
      );
    }


    let body;

    let h;

    let baseY;

    let fOff = 0;

    let ak = key;


    if (hasSprite) {

      fOff =
        team === 'enemy'
          ? this.enemyFrameOffset(key)
          : 0;


      ak =
        fOff
          ? 'e_' + key
          : key;


      body =
        this.add.sprite(
          x,
          GROUND,
          'unit_' + key,
          def.sprite.walk[0] + fOff
        )
        .setOrigin(
          0.5,
          122 / 128
        )
        .setScale(
          def.sprite.scale || 1
        );


      if (
        team === 'enemy'
      ) {

        body.setFlipX(true);
      }


      h =
        body.displayHeight;

      baseY =
        GROUND;

    } else {

      h =
        def.size * 1.6;

      baseY =
        GROUND - h / 2;


      const fill =
        team === 'player'

          ? def.color

          : Phaser.Display.Color
              .IntegerToColor(
                def.color
              )
              .darken(35)
              .color;


      body =
        this.add.rectangle(
          x,
          baseY,
          def.size,
          h,
          fill
        )
        .setStrokeStyle(
          2,
          team === 'player'
            ? 0x0b3d91
            : 0x7a1111
        );
    }


    const barY =
      GROUND -
      h -
      8;


    const barBg =
      this.add.rectangle(
        x,
        barY,
        26,
        4,
        0x000000,
        0.5
      );


    const bar =
      this.add.rectangle(
        x - 13,
        barY,
        26,
        4,
        team === 'player'
          ? 0x38e07b
          : 0xff5c5c
      )
      .setOrigin(
        0,
        0.5
      );


    const level =
      Math.max(
        1,
        Math.min(
          MAX_LEVEL,
          safeNumber(
            SAVE.levels[key],
            1
          )
        )
      );


    const mult =
      team === 'player'
        ? statMult(level)
        : 1;


    const tag =
      this.add.text(
        x,
        barY - 9,
        ELEMENTS[
          def.element
        ].icon +
        TYPES[
          def.type
        ].icon,
        {
          fontFamily: FONT,
          fontSize: '10px'
        }
      )
      .setOrigin(0.5);


    this.units.push({

      team,

      key,

      def,

      hasSprite,

      mult,

      tag,

      fOff,

      ak,

      rank:
        TYPES[
          def.type
        ].rank,

      skillCd:
        def.skill
          ? def.skill.cd * 0.5
          : 0,

      maxHp:
        def.hp * mult,

      hp:
        def.hp * mult,

      dmg:
        def.dmg * mult,

      x,

      h,

      baseY,

      cd: 0,

      lunge: 0,

      phase:
        Math.random() * 6,

      moving: false,

      attacking: false,

      body,

      bar,

      barBg
    });
  }


  // =========================================================
  // AI
  // =========================================================

  enemyAI(delta) {

    this.aiTimer -= delta;


    if (this.aiTimer > 0) {
      return;
    }


    const affordable =
      UNIT_KEYS.filter(
        k =>
          UNITS[k].cost <=
          this.enemyEnergy
      );


    if (
      affordable.length === 0
    ) {

      this.aiTimer = 300;

      return;
    }


    const key =
      Phaser.Utils.Array.GetRandom(
        affordable
      );


    this.enemyEnergy -=
      UNITS[key].cost;


    this.spawn(
      'enemy',
      key
    );


    this.aiTimer =
      1200 +
      Math.random() * 1800;
  }


  // =========================================================
  // UNIT LOGIC
  // =========================================================

  stepUnit(
    u,
    dt,
    delta
  ) {

    const dir =
      u.team === 'player'
        ? 1
        : -1;


    u.cd -= delta;


    if (u.def.skill) {
      u.skillCd -= delta;
    }


    u.moving = false;


    let target = null;

    let best = Infinity;


    for (
      const o of this.units
    ) {

      if (
        o.team === u.team ||
        o.hp <= 0
      ) {

        continue;
      }


      const d =
        (o.x - u.x) *
        dir;


      if (
        d >= -TARGET_OVERLAP
      ) {

        const dd =
          Math.max(
            0,
            d
          );


        if (
          dd < best
        ) {

          best = dd;

          target = o;
        }
      }
    }


    const enemyBase =
      this.bases[
        u.team === 'player'
          ? 'enemy'
          : 'player'
      ];


    const baseEdge =
      u.team === 'player'
        ? ENEMY_BASE_EDGE
        : PLAYER_BASE_EDGE;


    const baseDist =
      (baseEdge - u.x) *
      dir;


    let isBase = false;


    if (
      !target ||
      baseDist < best
    ) {

      target =
        enemyBase;

      best =
        baseDist;

      isBase =
        true;
    }


    if (
      best <=
      u.def.range
    ) {

      if (
        u.def.skill &&
        u.skillCd <= 0 &&
        this.trySkill(
          u,
          target,
          isBase
        )
      ) {

        return;
      }


      if (
        u.cd <= 0
      ) {

        this.attack(
          u,
          target,
          isBase
        );
      }

    } else {

      if (
        u.def.skill &&
        u.def.skill.kind === 'heal' &&
        u.skillCd <= 0
      ) {

        this.trySkill(
          u,
          null,
          false
        );
      }


      let newX =
        u.x +
        dir *
        u.def.speed *
        dt;


      if (u.rank > 0) {

        let limit = null;


        for (
          const a of this.units
        ) {

          if (
            a.team !== u.team ||
            a.hp <= 0 ||
            a.rank >= u.rank
          ) {

            continue;
          }


          const l =
            a.x -
            dir *
            FORMATION_GAP *
            (
              u.rank -
              a.rank
            );


          if (
            limit === null ||
            (l - limit) * dir < 0
          ) {

            limit = l;
          }
        }


        if (
          limit !== null &&
          (newX - limit) * dir > 0
        ) {

          if (
            (u.x - limit) * dir > 0
          ) {

            newX =
              u.x +
              dir *
              u.def.speed *
              dt;

          } else {

            newX =
              limit;
          }
        }
      }


      if (
        (newX - u.x) * dir >
        0.01
      ) {

        u.x =
          newX;

        u.moving =
          true;
      }
    }
  }


  // =========================================================
  // SKILL
  // =========================================================

  trySkill(
    u,
    target,
    isBase
  ) {

    const sk =
      u.def.skill;


    const col =
      ELEMENTS[
        u.def.element
      ].color;


    if (
      sk.kind === 'heal'
    ) {

      const hurt =
        this.units.filter(
          a =>
            a.team === u.team &&
            a.hp > 0 &&
            a.hp < a.maxHp &&
            Math.abs(
              a.x - u.x
            ) <= sk.radius
        );


      if (
        !hurt.length
      ) {

        return false;
      }


      u.skillCd =
        sk.cd;

      u.cd =
        Math.max(
          u.cd,
          400
        );


      for (
        const a of hurt
      ) {

        a.hp =
          Math.min(
            a.maxHp,
            a.hp +
            sk.power *
            u.mult
          );


        this.floatText(
          a.x,
          a.baseY -
            a.h -
            22,
          '+' +
            Math.round(
              sk.power *
              u.mult
            ),
          '#7dff9b'
        );
      }


      this.ring(
        u.x,
        GROUND - 14,
        sk.radius,
        col
      );


      this.floatText(
        u.x,
        u.baseY -
          u.h -
          34,
        sk.name,
        '#ffffff'
      );


      return true;
    }


    if (
      sk.kind === 'aoe'
    ) {

      if (!target) {
        return false;
      }


      u.skillCd =
        sk.cd;

      u.cd =
        u.def.cd;


      const cx =
        isBase
          ? target.rect.x
          : target.x;


      if (isBase) {

        target.hp -=
          this.dmgOf(u) *
          sk.power;
      }


      for (
        const o of this.units
      ) {

        if (
          o.team === u.team ||
          o.hp <= 0 ||
          Math.abs(
            o.x - cx
          ) > sk.radius
        ) {

          continue;
        }


        o.hp -=
          this.dmgOf(u) *
          sk.power *
          elemMult(
            u.def.element,
            o.def.element
          );


        this.tweens.add({

          targets: o.body,

          alpha: 0.4,

          duration: 60,

          yoyo: true
        });
      }


      this.ring(
        cx,
        GROUND - 14,
        sk.radius,
        col
      );


      this.floatText(
        u.x,
        u.baseY -
          u.h -
          34,
        sk.name,
        '#ffffff'
      );


      return true;
    }


    if (
      sk.kind === 'buff'
    ) {

      const allies =
        this.units.filter(
          a =>
            a.team === u.team &&
            a.hp > 0 &&
            Math.abs(
              a.x - u.x
            ) <= sk.radius
        );


      if (
        !target ||
        allies.length < 2
      ) {

        return false;
      }


      u.skillCd =
        sk.cd;

      u.cd =
        Math.max(
          u.cd,
          400
        );


      for (
        const a of allies
      ) {

        a.buffMult =
          sk.power;

        a.buffUntil =
          this.time.now +
          sk.duration;


        this.floatText(
          a.x,
          a.baseY -
            a.h -
            22,
          '⬆ ดาเมจ',
          '#ffd23f'
        );
      }


      this.ring(
        u.x,
        GROUND - 14,
        sk.radius,
        col
      );


      this.floatText(
        u.x,
        u.baseY -
          u.h -
          34,
        sk.name,
        '#ffffff'
      );


      return true;
    }


    return false;
  }


  // =========================================================
  // DAMAGE
  // =========================================================

  dmgOf(u) {

    return u.dmg *
      (
        (u.buffUntil || 0) >
        this.time.now

          ? u.buffMult

          : 1
      );
  }


  // =========================================================
  // FLOAT TEXT
  // =========================================================

  floatText(
    x,
    y,
    text,
    color
  ) {

    const t =
      this.add.text(
        x,
        y,
        text,
        {
          fontFamily: FONT,
          fontSize: '13px',
          color,
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 3
        }
      )
      .setOrigin(0.5)
      .setDepth(5);


    this.tweens.add({

      targets: t,

      y: y - 16,

      alpha: 0,

      duration: 700,

      onComplete: () => {
        t.destroy();
      }
    });
  }


  // =========================================================
  // RING
  // =========================================================

  ring(
    x,
    y,
    r,
    color
  ) {

    const c =
      this.add.circle(
        x,
        y,
        8,
        color,
        0.35
      )
      .setStrokeStyle(
        2,
        color,
        0.9
      )
      .setDepth(4);


    this.tweens.add({

      targets: c,

      scale: r / 8,

      alpha: 0,

      duration: 450,

      onComplete: () => {
        c.destroy();
      }
    });
  }


  // =========================================================
  // ATTACK
  // =========================================================

  attack(
    u,
    target,
    isBase
  ) {

    u.cd =
      u.def.cd;


    const em =
      isBase
        ? 1
        : elemMult(
            u.def.element,
            target.def.element
          );


    target.hp -=
      this.dmgOf(u) *
      em;


    if (
      em !== 1
    ) {

      this.floatText(
        target.x,
        target.baseY -
          target.h -
          22,
        'x' + em,
        em > 1
          ? '#ffd23f'
          : '#9fb2d9'
      );
    }


    const hitObj =
      isBase
        ? target.rect
        : target.body;


    if (
      u.hasSprite
    ) {

      u.attacking =
        true;


      u.body.play(
        u.ak +
        '-attack'
      );


      u.body.once(
        'animationcomplete',
        () => {

          u.attacking =
            false;
        }
      );
    }


    this.tweens.add({

      targets: u,

      lunge: 5,

      duration: 70,

      yoyo: true
    });


    if (
      u.def.range > 60
    ) {

      const tx =
        isBase
          ? hitObj.x
          : target.x;


      const shot =
        this.add.circle(
          u.x,
          u.baseY -
            u.h / 2,
          4,
          0xffffff
        );


      this.tweens.add({

        targets: shot,

        x: tx,

        duration: 150,

        onComplete: () => {
          shot.destroy();
        }
      });
    }


    this.tweens.add({

      targets: hitObj,

      alpha: 0.4,

      duration: 60,

      yoyo: true
    });


    if (isBase) {

      this.updateBaseVisual(
        target,
        false
      );


      if (
        target.hp > 0 &&
        target.hp /
          target.max <=
          0.5
      ) {

        this.tweens.add({

          targets:
            target.container,

          x: {
            from: -3,
            to: 3
          },

          duration: 45,

          yoyo: true,

          repeat: 2
        });
      }


      if (
        target.hp <= 0
      ) {

        this.baseDestroyEffect(
          target
        );
      }
    }
  }


  // =========================================================
  // BASE DESTROY EFFECT
  // =========================================================

  baseDestroyEffect(base) {

    if (
      base.destroyEffectDone
    ) {

      return;
    }


    base.destroyEffectDone =
      true;


    const flash =
      this.add.circle(
        base.x,
        GROUND - 65,
        18,
        0xffd23f,
        0.9
      )
      .setDepth(10);


    this.tweens.add({

      targets: flash,

      scale: 5,

      alpha: 0,

      duration: 450,

      onComplete: () => {
        flash.destroy();
      }
    });


    for (
      let i = 0;
      i < 12;
      i++
    ) {

      const piece =
        this.add.rectangle(
          base.x,
          GROUND - 70,
          6,
          6,
          i % 2 === 0
            ? 0xffd23f
            : 0x777777
        )
        .setDepth(9);


      const angle =
        (
          Math.PI *
          2 /
          12
        ) * i;


      this.tweens.add({

        targets: piece,

        x:
          base.x +
          Math.cos(angle) *
          (
            40 +
            Math.random() * 50
          ),

        y:
          GROUND - 70 +
          Math.sin(angle) *
          (
            30 +
            Math.random() * 40
          ),

        alpha: 0,

        angle: 360,

        duration: 650,

        onComplete: () => {
          piece.destroy();
        }
      });
    }
  }


  // =========================================================
  // UPDATE
  // =========================================================

  update(
    time,
    delta
  ) {

    if (this.over) {
      return;
    }


    const dt =
      Math.max(
        0,
        Math.min(
          delta / 1000,
          0.1
        )
      );


    // =======================================================
    // ENERGY
    // =======================================================

    if (
      !Number.isFinite(
        this.energy
      )
    ) {

      this.energy = 0;
    }


    const maxEnergy =
      Math.max(
        1,
        safeNumber(
          this.maxEnergy(),
          BASE_MAX_ENERGY
        )
      );


    const regen =
      Math.max(
        0,
        safeNumber(
          this.regen(),
          BASE_REGEN
        )
      );


    this.energy =
      Math.min(
        maxEnergy,
        Math.max(
          0,
          this.energy +
          regen * dt
        )
      );


    // =======================================================
    // ENEMY ENERGY
    // =======================================================

    if (
      !Number.isFinite(
        this.enemyEnergy
      )
    ) {

      this.enemyEnergy =
        BASE_MAX_ENERGY;
    }


    this.enemyEnergy =
      Math.min(
        BASE_MAX_ENERGY,
        Math.max(
          0,
          this.enemyEnergy +
          ENEMY_REGEN * dt
        )
      );


    // =======================================================
    // AI
    // =======================================================

    this.enemyAI(delta);


    // =======================================================
    // UNIT LOGIC
    // =======================================================

    for (
      const u of this.units
    ) {

      if (
        u.hp > 0
      ) {

        this.stepUnit(
          u,
          dt,
          delta
        );
      }
    }


    // =======================================================
    // จัดการยูนิต
    // =======================================================

    for (
      const u of this.units
    ) {

      if (
        u.hp <= 0
      ) {

        if (
          u.team === 'enemy'
        ) {

          this.kills++;


          SAVE.stats.defeated[
            u.key
          ] =
            safeNumber(
              SAVE.stats.defeated[
                u.key
              ],
              0
            ) + 1;
        }


        u.body.destroy();

        u.bar.destroy();

        u.barBg.destroy();

        u.tag.destroy();

        continue;
      }


      const dir =
        u.team === 'player'
          ? 1
          : -1;


      const bob =
        (
          u.moving &&
          !u.hasSprite
        )

          ? Math.abs(
              Math.sin(
                time * 0.012 +
                u.phase
              )
            ) * 3

          : 0;


      u.body.x =
        u.x +
        u.lunge *
        dir;


      u.body.y =
        u.baseY -
        bob;


      u.barBg.x =
        u.x;


      u.tag.x =
        u.x;


      u.bar.x =
        u.x - 13;


      u.bar.width =
        26 *
        Math.max(
          0,
          Math.min(
            1,
            u.hp /
            u.maxHp
          )
        );


      if (
        u.hasSprite &&
        !u.attacking
      ) {

        if (
          u.moving
        ) {

          u.body.play(
            u.ak +
            '-walk',
            true
          );

        } else {

          u.body.anims.stop();


          u.body.setFrame(
            u.def.sprite.walk[0] +
            u.fOff
          );
        }
      }
    }


    this.units =
      this.units.filter(
        u =>
          u.hp > 0
      );


    // =======================================================
    // BASE VISUAL
    // =======================================================

    this.updateBaseVisual(
      this.bases.player
    );


    this.updateBaseVisual(
      this.bases.enemy
    );


    // =======================================================
    // HUD
    // =======================================================

    this.updateHud();


    // =======================================================
    // END GAME
    // =======================================================

    if (
      this.bases.enemy.hp <= 0
    ) {

      this.endGame(
        'ชนะแล้ว! 🎉',
        true
      );

    }
    else if (
      this.bases.player.hp <= 0
    ) {

      this.endGame(
        'แพ้แล้ว...',
        false
      );
    }
  }


  // =========================================================
  // HUD
  // =========================================================

  updateHud() {

    const maxEnergy =
      Math.max(
        1,
        safeNumber(
          this.maxEnergy(),
          BASE_MAX_ENERGY
        )
      );


    let energy =
      safeNumber(
        this.energy,
        0
      );


    energy =
      Math.max(
        0,
        Math.min(
          maxEnergy,
          energy
        )
      );


    this.energy =
      energy;


    this.energyFill.width =
      200 *
      (
        energy /
        maxEnergy
      );


    this.energyText.setText(
      `พลังงาน ${Math.floor(energy)}/${maxEnergy}`
    );


    // ---------------------------------------------------------
    // Unit buttons
    // ---------------------------------------------------------

    for (
      const b of this.buttons
    ) {

      const cost =
        safeNumber(
          UNITS[b.key].cost,
          Infinity
        );


      b.bg.setAlpha(
        energy >= cost
          ? 1
          : 0.4
      );
    }


    // ---------------------------------------------------------
    // Economy
    // ---------------------------------------------------------

    if (
      this.econLv >=
      ECON_MAX_LEVEL
    ) {

      this.econBtn.text.setText(
        `เศรษฐกิจ Lv${this.econLv}\nMAX`
      );


      this.econBtn.bg.setAlpha(
        0.35
      );

    } else {

      const c =
        safeNumber(
          econUpgradeCost(
            this.econLv
          ),
          Infinity
        );


      this.econBtn.text.setText(
        `R. เศรษฐกิจ Lv${this.econLv}\n▲ อัป ${c}`
      );


      this.econBtn.bg.setAlpha(
        energy >= c
          ? 1
          : 0.45
      );
    }


    // ---------------------------------------------------------
    // Base HP
    // ---------------------------------------------------------

    for (
      const k of [
        'player',
        'enemy'
      ]
    ) {

      const b =
        this.bases[k];


      const hp =
        safeNumber(
          b.hp,
          0
        );


      const max =
        Math.max(
          1,
          safeNumber(
            b.max,
            BASE_HP
          )
        );


      b.bar.width =
        80 *
        Math.max(
          0,
          Math.min(
            1,
            hp / max
          )
        );
    }
  }


  // =========================================================
  // END GAME
  // =========================================================

  endGame(
    message,
    won
  ) {

    this.over =
      true;


    const reward =
      (
        won
          ? REWARD_WIN
          : REWARD_LOSE
      ) +
      this.kills *
      REWARD_PER_KILL;


    // ---------------------------------------------------------
    // กันเงิน NaN
    // ---------------------------------------------------------

    SAVE.gold =
      safeNumber(
        SAVE.gold,
        0
      );


    SAVE.gold +=
      Math.max(
        0,
        safeNumber(
          reward,
          0
        )
      );


    normalizeSave();


    if (
      typeof writeSave === 'function'
    ) {

      writeSave();
    }


    const overlay =
      this.add.rectangle(
        W / 2,
        H / 2,
        W,
        H,
        0x000000,
        0.6
      )
      .setInteractive();


    this.add.text(
      W / 2,
      H / 2 - 60,
      message,
      {
        fontFamily: FONT,
        fontSize: '48px',
        color: '#fff',
        fontStyle: 'bold'
      }
    )
    .setOrigin(0.5);


    this.add.circle(
      W / 2 - 150,
      H / 2 - 5,
      10,
      0xffd23f
    )
    .setStrokeStyle(
      2,
      0xb8860b
    );


    this.add.text(
      W / 2 - 134,
      H / 2 - 5,
      `ได้ทอง +${reward}  (ฆ่าศัตรู ${this.kills} ตัว)`,
      {
        fontFamily: FONT,
        fontSize: '22px',
        color: '#ffe066',
        fontStyle: 'bold'
      }
    )
    .setOrigin(0, 0.5);


    this.add.text(
      W / 2,
      H / 2 + 40,
      'แตะหรือคลิกเพื่อเล่นใหม่',
      {
        fontFamily: FONT,
        fontSize: '20px',
        color: '#ddd'
      }
    )
    .setOrigin(0.5);


    const lobbyBtn =
      this.add.text(
        W / 2,
        H / 2 + 90,
        'กลับลอบบี้',
        {
          fontFamily: FONT,
          fontSize: '22px',
          color: '#1a1a1a',
          backgroundColor: '#ffffff',
          padding: {
            x: 18,
            y: 8
          },
          fontStyle: 'bold'
        }
      )
      .setOrigin(0.5)
      .setInteractive({
        useHandCursor: true
      });


    lobbyBtn.on(
      'pointerdown',
      () => {

        normalizeSave();

        this.scene.start(
          'lobby'
        );
      }
    );


    overlay.once(
      'pointerdown',
      () => {

        this.scene.restart();
      }
    );
  }
}