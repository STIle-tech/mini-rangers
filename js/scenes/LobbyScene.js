// รูปที่ลอบบี้ใช้ (ถ้าไฟล์ไหนไม่มี จะใช้รูปทรงสำรองแทนอัตโนมัติ)
const LOBBY_ASSETS = {
  lobby_bg: 'backgrounds/lobby/lobby_bg.png',
  lobby_start: 'ui/lobby/start_button.png',
  lobby_pvp: 'ui/lobby/pvp_button.png',
  lobby_mail: 'ui/lobby/mailbox.png',
  lobby_gacha: 'ui/lobby/gacha_button.png',
  menu_team: 'ui/lobby/menu/team.png',
  menu_upgrade: 'ui/lobby/menu/upgrade.png',
  menu_friend: 'ui/lobby/menu/friend.png',
  menu_collection: 'ui/lobby/menu/collection.png',
  menu_treasure: 'ui/lobby/menu/treasure.png',
  menu_settings: 'ui/lobby/menu/settings.png',
  lobby_level_badge: 'ui/lobby/level_badge.png',
  lobby_profile: 'ui/lobby/profile.png'
};

const LOBBY_MENU = [
  ['menu_team', 'ทีม', 'team'],
  ['menu_upgrade', 'อัปเกรด', 'upgrade'],
  ['menu_friend', 'เพื่อน'],
  ['menu_collection', 'สะสม', 'collection'],
  ['menu_treasure', 'สมบัติ'],
  ['menu_settings', 'การตั้งค่า']
];

// ตำแหน่งตัวละคร: พื้นหินในรูปพื้นหลังอยู่ราวๆ y 265-345 ให้ตัวละครยืนกลางพื้น เงาอยู่ใต้เท้า แล้วตามด้วยดาและป้ายเลเวล
const SHOWCASE_X = [190, 285, 380, 475, 570];
const FEET_Y = 290;

class LobbyScene extends Phaser.Scene {
  constructor() {
    super('lobby');
  }

  preload() {
    for (const [key, path] of Object.entries(LOBBY_ASSETS)) this.load.image(key, 'assets/' + path);
    this.load.on('loaderror', f => console.error('[LOBBY LOAD ERROR]', f.key, f.src));
    // gem.gif / gold.gif ไม่ผ่าน Phaser (Phaser เล่น GIF เคลื่อนไหวไม่ได้) ใช้แท็ก <img> ซ้อนบน canvas แทน
  }

  create() {
    this.currencyGifs = [];
    this.drawBackground();
    this.drawShowcase();
    this.drawTopBar();
    this.drawSideItems();
    this.drawStartButton();
    this.drawMenuBar();

    // GIF ต้องขยับตามตำแหน่ง/ขนาด canvas และถูกลบเมื่อออกจากลอบบี้ (กันภาพค้าง/ซ้อน)
    this.events.on('update', this.positionGifs, this);
    this.events.once('shutdown', this.cleanupGifs, this);
    this.events.once('destroy', this.cleanupGifs, this);
  }

  // ---------- ตัวช่วย ----------
  text(x, y, s, size, color, style = {}) {
    return this.add.text(x, y, s, { fontFamily: FONT, fontSize: size + 'px', color, ...style }).setOrigin(0.5);
  }

  // ทำให้คลิกได้ ถ้าไม่ส่ง fn จะแสดง toast ว่ายังไม่เปิดใช้งาน
  clickable(obj, fn, opts = {}) {
    return obj
      .setInteractive({ useHandCursor: true, ...opts })
      .on('pointerdown', fn || (() => this.toast('ยังไม่เปิดให้ใช้งาน')));
  }

  // รูปปุ่มขนาด w×h ถ้าไม่มีรูปคืน null
  img(key, x, y, w, h) {
    return this.textures.exists(key) ? this.add.image(x, y, key).setDisplaySize(w, h) : null;
  }

  // ---------- GIF สกุลเงิน (พิกัดเดียวกับ Phaser) ----------
  createCurrencyGif(type, x, y, size = 24) {
    const img = Object.assign(document.createElement('img'), {
      src: `assets/icons/currency/${type}.gif`,
      alt: type,
      draggable: false
    });
    Object.assign(img.style, {
      position: 'fixed',
      objectFit: 'contain',
      pointerEvents: 'none',
      userSelect: 'none',
      zIndex: '9999',
      margin: '0',
      padding: '0',
      border: '0'
    });
    img.onerror = () => console.error('[GIF LOAD ERROR]', img.src);
    document.body.appendChild(img);
    this.currencyGifs.push({ img, x, y, size });
    this.positionGifs();
  }

  positionGifs() {
    const canvas = this.game.canvas;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect(),
      sx = r.width / W,
      sy = r.height / H;
    for (const { img, x, y, size } of this.currencyGifs) {
      if (!img.isConnected) continue;
      const w = size * sx,
        h = size * sy;
      Object.assign(img.style, {
        width: w + 'px',
        height: h + 'px',
        left: r.left + x * sx - w / 2 + 'px',
        top: r.top + y * sy - h / 2 + 'px'
      });
    }
  }

  cleanupGifs() {
    this.events.off('update', this.positionGifs, this);
    for (const { img } of this.currencyGifs) {
      img.onerror = null;
      img.remove();
    }
    this.currencyGifs = [];
  }

  // ---------- ฉากหลัง ----------
  drawBackground() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x0d1a38).setDepth(-200);
    if (!this.textures.exists('lobby_bg')) return console.error('[LOBBY] ไม่พบ lobby_bg');
    const bg = this.add.image(W / 2, H / 2, 'lobby_bg').setDepth(-100);
    bg.setScale(Math.max(W / bg.width, H / bg.height));
  }

  // ---------- ตัวละคร 5 ช่อง: ยืนบนพื้น + ดาเกรด + ป้ายเลเวล ----------
  drawShowcase() {
    SHOWCASE_X.forEach((x, i) => {
      const key = SAVE.team[i];
      this.add.ellipse(x, FEET_Y + 2, 74, 14, 0x000000, 0.4);

      if (!key) {
        // ช่องว่าง
        this.add.rectangle(x, FEET_Y - 40, 40, 80, 0x0b2229, 0.55);
        return this.text(x, FEET_Y - 40, '?', 34, '#4f8798', { fontStyle: 'bold' });
      }
      const def = UNITS[key];
      if (!def) return console.warn('[LOBBY] ไม่พบ UNIT:', key);

      const hasSprite = def.sprite && this.textures.exists('unit_' + key);
      let obj;
      if (hasSprite) {
        // origin ที่เท้าจริงของภาพ (ไม่ใช่ขอบล่างเฟรม) ตัวละครจึงติดพื้นพอดี
        obj = this.add
          .sprite(x, FEET_Y, 'unit_' + key, def.sprite.walk[0])
          .setOrigin(0.5, footOrigin(this, key))
          .setScale((def.sprite.scale || 1) * 1.6);
        this.randomWalk(obj, key, def.sprite);
      } else {
        const h = def.size * 1.6 * 2.4;
        obj = this.add.rectangle(x, FEET_Y - h / 2, def.size * 2.4, h, def.color);
      }

      // คลิกเฉพาะตัวภาพ ไม่สร้างพื้นที่คลิกใหญ่
      this.clickable(
        obj,
        p => {
          p?.event?.stopPropagation();
          this.scene.start('character', { sel: UNIT_KEYS.indexOf(key), from: 'lobby' });
        },
        hasSprite && location.protocol !== 'file:' ? { pixelPerfect: true, alphaTolerance: 1 } : {}   // pixelPerfect อ่านพิกเซลภาพ: เปิดแบบ file:// ไม่ได้ (canvas tainted)
      );

      this.drawStars(x, FEET_Y + 26, gradeOf(key));
      this.drawLevelPlate(x, FEET_Y + 52, SAVE.levels[key] || 1);
    });
  }

  // ดา 5 ดวง = เกรดตัวละคร (ค่าคงที่ใน units.js ไม่เพิ่มตามเลเวล) ดวงที่ไม่ได้เกรดเป็นสีหม่น
  drawStars(x, y, grade) {
    for (let i = 0; i < 5; i++) {
      const on = i < grade;
      this.text(x + (i - 2) * 17, y, '★', 17, on ? '#ffd23f' : '#34626f', {
        stroke: on ? '#8a5200' : '#0c2a33',
        strokeThickness: 3
      });
    }
  }

  // ป้ายเลเวล: ขอบมน สีเขียวอมฟ้าเข้ม มีแถบสว่างด้านบน ตัวหนังสือขาวมีขอบ
  drawLevelPlate(x, y, lv) {
    const w = 84,
      h = 26,
      l = x - w / 2,
      t = y - h / 2;
    this.add
      .graphics()
      .fillStyle(0x000000, 0.4)
      .fillRoundedRect(l, t + 3, w, h, 9)
      .fillStyle(0x0f3b49)
      .fillRoundedRect(l, t, w, h, 9)
      .fillStyle(0x2c8196, 0.95)
      .fillRoundedRect(l + 2, t + 2, w - 4, h / 2 - 1, { tl: 7, tr: 7, bl: 2, br: 2 })
      .lineStyle(2, 0x5bd3e3)
      .strokeRoundedRect(l, t, w, h, 9);
    this.text(x, y, `Lv. ${lv}`, 16, '#ffffff', { fontStyle: 'bold', stroke: '#052630', strokeThickness: 3 });
  }

  // ตัวละครยืนนิ่งที่เฟรม 0 แล้วสุ่มทำท่าเป็นพักๆ: เดินอยู่กับที่ หรือโจมตี 1-2 ครั้ง (แต่ละตัวสุ่มเวลาของตัวเอง)
  randomWalk(sprite, key, { walk, attack }) {
    const make = (name, [start, end], frameRate, repeat) => {
      const k = `${key}-lobby-${name}`;
      if (!this.anims.exists(k)) {
        this.anims.create({ key: k, frameRate, repeat, frames: this.anims.generateFrameNumbers('unit_' + key, { start, end }) });
      }
      return k;
    };
    const walkAnim = make('walk', walk, 8, -1);
    const attackAnim = attack && make('attack', attack, 10, 0);
    const wait = (ms, fn) => this.time.delayedCall(ms, () => sprite.active && fn());

    const idle = () => {
      sprite.anims.stop();
      sprite.setFrame(walk[0]);
      wait(Phaser.Math.Between(2000, 5500), act);
    };
    const act = () => {
      if (attackAnim && Math.random() < 0.5) {
        sprite.play({ key: attackAnim, repeat: Phaser.Math.Between(0, 1) }); // โจมตี 1-2 ครั้งแล้วกลับยืนนิ่ง
        sprite.once('animationcomplete', idle);
      } else {
        sprite.play(walkAnim);
        wait(Phaser.Math.Between(1200, 2600), idle);
      }
    };
    wait(Phaser.Math.Between(500, 4000), act); // ตัวแรกๆ เริ่มไม่พร้อมกัน
  }

  // ---------- แถบด้านบน: ระดับผู้เล่น + สกุลเงิน ----------
  drawTopBar() {
    const playerLv = typeof PLAYER !== 'undefined' ? PLAYER.level : 1;   // เลเวลผู้เล่น: ได้จาก EXP การผ่านด่าน (StageScene.js)
    this.drawLevelBadge(playerLv);

    this.makeCurrencyPill(W - 250, Math.floor(SAVE.gems || 0).toLocaleString('en-US'), 'gem');
    this.makeCurrencyPill(W - 115, Math.floor(SAVE.gold).toLocaleString('en-US'), 'gold');
  }

  // ป้ายเลเวลแบบโล่ทอง (หลอดเขียว + LEVEL + ตัวเลข) + กรอบไม้ด้านขวาไว้ใส่รูปโปรไฟล์ในอนาคต
  // ใส่รูปเองได้: ui/lobby/level_badge.png (โล่ 64x76) และ ui/lobby/profile.png (รูปโปรไฟล์) ถ้าไม่มีไฟล์จะใช้รูปทรงสำรอง
  drawLevelBadge(lv) {
    const exp = typeof PLAYER !== 'undefined' ? (PLAYER.level >= PLAYER_MAX_LEVEL ? 1 : Phaser.Math.Clamp(PLAYER.exp / playerExpNeed(PLAYER.level), 0, 1)) : 0;   // สัดส่วนหลอด 0-1
    const g = this.add.graphics();

    // กรอบโปรไฟล์ (อยู่หลังโล่): รูปอยู่กึ่งกลางส่วนที่โผล่พ้นโล่ (x 72-136) ขอบเท่ากันทุกด้าน
    const fx = 52, fy = 15, fw = 78, fh = 52, px = 101, py = fy + fh / 2, pw = 44, ph = 38;   // โล่กลาง y≈41 กรอบกลางเท่ากัน
    g.fillStyle(0x000000, 0.35).fillRoundedRect(fx, fy + 3, fw, fh, 10)
      .fillStyle(0x6b3f1d).fillRoundedRect(fx, fy, fw, fh, 10)
      .fillStyle(0x8a5528).fillRoundedRect(fx + 3, fy + 3, fw - 6, fh - 6, 8)
      .lineStyle(2, 0x3a2410).strokeRoundedRect(fx, fy, fw, fh, 10)
      .fillStyle(0x2a6fb0).fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 7);
    if (this.textures.exists('lobby_profile')) this.add.image(px, py, 'lobby_profile').setDisplaySize(pw, ph);
    else g.fillStyle(0x9cd0ff).fillCircle(px, py - 6, 8).fillEllipse(px, py + 14, 28, 12);   // เงาคนสำรอง (อยู่ในกรอบ)

    // โล่ทอง
    const sx = 8, sy = 4, sw = 64, sh = 74, pts = [[sx, sy + 8], [sx + 8, sy], [sx + sw - 8, sy], [sx + sw, sy + 8], [sx + sw, sy + 50], [sx + sw / 2, sy + sh], [sx, sy + 50]];
    const shape = (dx, dy, k) => pts.map(([x, y]) => ({ x: sx + sw / 2 + (x - sx - sw / 2) * k + dx, y: sy + 36 + (y - sy - 36) * k + dy }));
    if (this.textures.exists('lobby_level_badge')) this.add.image(sx + sw / 2, sy + sh / 2, 'lobby_level_badge').setDisplaySize(sw, sh);
    else {
      g.fillStyle(0x000000, 0.35).fillPoints(shape(0, 3, 1), true)
        .fillStyle(0x8a5a0a).fillPoints(shape(0, 0, 1), true)
        .fillStyle(0xf2b52a).fillPoints(shape(0, 0, 0.9), true)
        .fillStyle(0xffd966, 0.8).fillRoundedRect(sx + 7, sy + 5, sw - 14, 22, 6)
        .lineStyle(2, 0xfff0b0, 0.9).strokePoints(shape(0, 0, 0.9), true);
    }

    // หลอดเขียว (EXP) วาดทับรูปเสมอ
    const g2 = this.add.graphics().lineStyle(2, 0x3a2410).strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 7);
    const bx = sx + 10, by = sy + 10, bw = sw - 20, bh = 10;
    g2.fillStyle(0x3a2a10).fillRoundedRect(bx, by, bw, bh, 5);
    if (exp > 0) g2.fillStyle(0x5ed23a).fillRoundedRect(bx + 1, by + 1, Math.max(bh - 2, (bw - 2) * exp), bh - 2, 4)
      .fillStyle(0xffffff, 0.35).fillRoundedRect(bx + 3, by + 2, Math.max(4, (bw - 6) * exp), 3, 2);
    g2.lineStyle(1.5, 0x2a1a06).strokeRoundedRect(bx, by, bw, bh, 5);

    this.text(sx + sw / 2, sy + 29, 'LEVEL', 9, '#ffffff', { fontStyle: 'bold', stroke: '#8a5200', strokeThickness: 2 });
    this.fitText(this.text(sx + sw / 2, sy + 45, String(lv), 22, '#ffffff', { fontStyle: 'bold', stroke: '#8a5200', strokeThickness: 4 }), 40, 22);
  }

  // ย่อขนาดตัวอักษรถ้ากว้างเกิน maxW
  fitText(t, maxW, size) {
    while (t.width > maxW && size > 8) t.setFontSize(--size);
    return t;
  }

  // ป้ายสกุลเงิน: [ไอคอน GIF] [ตัวเลขชิดซ้าย ไม่ทับไอคอน] [ปุ่ม +]
  makeCurrencyPill(cx, value, type) {
    const y = 22, w = 124, left = cx - w / 2, right = cx + w / 2;
    this.add.graphics().fillStyle(0x101a30, 0.92).fillRoundedRect(left, y - 14, w, 28, 14).lineStyle(2, 0x3a4a70).strokeRoundedRect(left, y - 14, w, 28, 14);
    this.createCurrencyGif(type, left + 17, y);
    const num = this.text(left + 35, y, value, 15, type === 'gold' ? '#ffe066' : '#ffffff', { fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.fitText(num, right - 28 - (left + 35), 15);
    this.clickable(this.add.circle(right - 14, y, 11, 0x4ab34a));
    this.text(right - 14, y - 1, '+', 18, '#ffffff', { fontStyle: 'bold' });
  }

  // ---------- กล่องจดหมาย + กาชา ----------
  drawSideItems() {
    const mail = this.img('lobby_mail', 745, 100, 70, 70);
    if (mail) this.clickable(mail, () => this.toast('กล่องข้อความยังไม่เปิดให้ใช้งาน'));
    const gacha = this.img('lobby_gacha', 745, 178, 90, 90);
    if (gacha) this.clickable(gacha, () => this.scene.start('gacha'));
  }

  // ---------- ปุ่มเริ่ม (อยู่นิ่ง) + PvP ----------
  drawStartButton() {
    const start =
      this.img('lobby_start', 725, 372, 120, 120) ||
      this.text(725, 372, 'เริ่ม', 38, '#ffd23f', { fontStyle: 'bold' });
    this.clickable(start, () => this.scene.start(this.scene.get('stage') ? 'stage' : 'game'));

    const pvp = this.img('lobby_pvp', 610, 402, 100, 55);
    if (pvp) this.clickable(pvp, () => this.toast('PvP ยังไม่เปิดให้เล่น'));
  }

  // ---------- แถบเมนูด้านล่างซ้าย (อยู่นิ่ง ไม่มี hover) ----------
  drawMenuBar() {
    LOBBY_MENU.forEach(([key, label, go], i) => {
      const x = 45 + i * 70,
        y = 402;
      let btn = this.img(key, x, y, 64, 68);
      if (!btn) {
        btn = this.add.rectangle(x, y, 64, 68, 0x7a4a24).setStrokeStyle(3, 0x3a2410);
        this.text(x, y, label, 11, '#ffffff');
      }
      this.clickable(btn, () => (go ? this.scene.start(go) : this.toast(`${label} ยังไม่เปิดให้ใช้งาน`)));
    });
  }

  toast(message) {
    if (!this.toastText) return;
    this.toastText.setText(message).setAlpha(1);
    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1200, duration: 500 });
  }
}