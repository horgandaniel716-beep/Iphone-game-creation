import type { CharacterDef, Fighter } from '../types';

export function buildArenaHtml(
  playerFighter: Fighter,
  playerChar: CharacterDef,
  opponentFighter: Fighter,
  opponentChar: CharacterDef
): string {
  const p = JSON.stringify(playerChar);
  const o = JSON.stringify(opponentChar);
  const pf = JSON.stringify(playerFighter);
  const of_ = JSON.stringify(opponentFighter);

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#000;overflow:hidden;touch-action:none}
canvas{display:block}
</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
const PLAYER_CHAR = ${p};
const OPP_CHAR = ${o};
const PLAYER_FIGHTER = ${pf};
const OPP_FIGHTER = ${of_};

const c = document.getElementById('c');
const ctx = c.getContext('2d');
const W = c.width = window.innerWidth;
const H = c.height = window.innerHeight;

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const GROUND = H - 110;
const GRAVITY = 0.65;
const JUMP_VY = -16;
const WALK_SPD = 3.8;
const PUSH_DISTANCE = 52;
const ROUNDS_TO_WIN = 2;
const ROUND_TIME = 99;
const COMBO_WINDOW = 90; // frames

// ─── FIGHTER FACTORY ──────────────────────────────────────────────────────────
function makeFighter(charDef, fighterData, side) {
  const isLeft = side === 'left';
  return {
    char: charDef,
    name: fighterData.name,
    x: isLeft ? W * 0.25 : W * 0.75,
    y: GROUND,
    vy: 0,
    facing: isLeft ? 1 : -1,
    grounded: true,
    state: 'idle',
    stateFrame: 0,
    hp: charDef.stats.health,
    maxHp: charDef.stats.health,
    // attack frame data: [startup, active, recovery]
    moves: {
      light:   { frames: [4, 4, 8],  dmg: charDef.stats.attack * 0.35, pushback: 8,  hitstun: 12, range: 80 },
      heavy:   { frames: [8, 5, 18], dmg: charDef.stats.attack * 0.65, pushback: 18, hitstun: 22, range: 90 },
      kick:    { frames: [6, 5, 12], dmg: charDef.stats.attack * 0.50, pushback: 12, hitstun: 16, range: 100 },
      special: { frames: [12, 8, 20],dmg: charDef.stats.attack * 0.90, pushback: 30, hitstun: 28, range: 0 },
      crouch_light: { frames: [3,4,8], dmg: charDef.stats.attack*0.28, pushback:5, hitstun:10, range:70 },
    },
    currentMove: null,
    hitstun: 0,
    blockstun: 0,
    knockdown: 0,
    crouching: false,
    blocking: false,
    comboCount: 0,
    comboTimer: 0,
    specialCharge: 0,
    invincible: 0,
    side,
    // special projectile/state
    specialActive: false,
    specialX: 0,
    specialVX: 0,
    jumpCount: 0,
  };
}

// ─── GAME STATE ───────────────────────────────────────────────────────────────
let player = makeFighter(PLAYER_CHAR, PLAYER_FIGHTER, 'left');
let opp    = makeFighter(OPP_CHAR,    OPP_FIGHTER,    'right');
let round = 1;
let playerRoundsWon = 0;
let oppRoundsWon = 0;
let roundTimer = ROUND_TIME;
let roundFrame = 0;
let roundTimerFrame = 0;
let gamePhase = 'announce'; // announce | fight | roundover | gameover
let announceFrame = 0;
let announceText = 'ROUND 1';
let announceSubText = '';
let screenShake = 0;
let particles = [];
let hitSparks = [];
let gameResult = null;

// ─── CONTROLS ─────────────────────────────────────────────────────────────────
const dpad = { left: false, right: false, up: false, down: false };
const btns = { light: false, heavy: false, kick: false, special: false };
let dpadTouchId = null;
let dpadOrigin = { x: 0, y: 0 };
const BTN_TOUCH_IDS = {};

const DPAD_ZONE_X = W * 0.48;
const DPAD_RADIUS = 52;
const BTN_RADIUS = 34;

// Button positions (right side)
const BTN_POSITIONS = [
  { key: 'light',   x: W - 180, y: H - 160, color: '#4fc3f7', label: 'L' },
  { key: 'heavy',   x: W - 90,  y: H - 200, color: '#e53935', label: 'H' },
  { key: 'kick',    x: W - 90,  y: H - 120, color: '#ff9800', label: 'K' },
  { key: 'special', x: W - 180, y: H - 80,  color: '#ce93d8', label: 'SP' },
];

c.addEventListener('touchstart', onTouchStart, { passive: true });
c.addEventListener('touchmove',  onTouchMove,  { passive: true });
c.addEventListener('touchend',   onTouchEnd,   { passive: true });
c.addEventListener('touchcancel',onTouchEnd,   { passive: true });

function getDpadDir(tx, ty) {
  const dx = tx - dpadOrigin.x;
  const dy = ty - dpadOrigin.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 10) return { left:false, right:false, up:false, down:false };
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  return {
    right: angle > -67.5 && angle < 67.5,
    left:  angle > 112.5 || angle < -112.5,
    up:    angle > -157.5 && angle < -22.5,
    down:  angle > 22.5  && angle < 157.5,
  };
}

function onTouchStart(e) {
  for (const t of e.changedTouches) {
    if (t.clientX < DPAD_ZONE_X) {
      if (!dpadTouchId) {
        dpadTouchId = t.identifier;
        dpadOrigin = { x: t.clientX, y: t.clientY };
        Object.assign(dpad, getDpadDir(t.clientX, t.clientY));
      }
    } else {
      for (const btn of BTN_POSITIONS) {
        if (Math.hypot(t.clientX - btn.x, t.clientY - btn.y) < BTN_RADIUS + 14) {
          BTN_TOUCH_IDS[t.identifier] = btn.key;
          btns[btn.key] = true;
          // One-shot attack input
          queueInput(btn.key);
        }
      }
    }
  }
}

function onTouchMove(e) {
  for (const t of e.changedTouches) {
    if (t.identifier === dpadTouchId) {
      Object.assign(dpad, getDpadDir(t.clientX, t.clientY));
    }
  }
}

function onTouchEnd(e) {
  for (const t of e.changedTouches) {
    if (t.identifier === dpadTouchId) {
      dpadTouchId = null;
      dpad.left = dpad.right = dpad.up = dpad.down = false;
    }
    if (BTN_TOUCH_IDS[t.identifier]) {
      btns[BTN_TOUCH_IDS[t.identifier]] = false;
      delete BTN_TOUCH_IDS[t.identifier];
    }
  }
}

// Input queue (so taps register even during lag frames)
const inputQueue = [];
function queueInput(key) {
  inputQueue.push({ key, frame: roundFrame });
}
function consumeInput(key) {
  const idx = inputQueue.findIndex(i => i.key === key && roundFrame - i.frame < 8);
  if (idx !== -1) { inputQueue.splice(idx, 1); return true; }
  return false;
}

// ─── PHYSICS & MOVEMENT ───────────────────────────────────────────────────────
function updateMovement(f, isPlayer) {
  if (f.hitstun > 0 || f.blockstun > 0 || f.knockdown > 0 || f.state === 'special_active') return;
  if (f.currentMove) return; // locked in attack animation

  const left  = isPlayer ? dpad.left  : false;
  const right = isPlayer ? dpad.right : false;
  const up    = isPlayer ? dpad.up    : false;
  const down  = isPlayer ? dpad.down  : false;

  // Facing
  const oEnemy = isPlayer ? opp : player;
  f.facing = f.x < oEnemy.x ? 1 : -1;

  // Crouch
  f.crouching = down && f.grounded;

  // Block: hold away from opponent
  const holdingBack = isPlayer ? (f.facing === 1 ? left : right) : false;
  f.blocking = holdingBack && f.grounded && !f.crouching;

  // Walk
  const spd = f.char.stats.speed / 25;
  if (left)  f.x -= spd;
  if (right) f.x += spd;

  // Jump
  if (up && f.grounded && f.jumpCount === 0) {
    f.vy = JUMP_VY;
    f.grounded = false;
    f.jumpCount = 1;
    f.state = 'jump';
    f.crouching = false;
    f.blocking = false;
  }

  // Bounds
  f.x = Math.max(40, Math.min(W - 40, f.x));
}

function updatePhysics(f) {
  if (!f.grounded) {
    f.vy += GRAVITY;
    f.y  += f.vy;
    if (f.y >= GROUND) {
      f.y = GROUND;
      f.vy = 0;
      f.grounded = true;
      f.jumpCount = 0;
      if (f.knockdown > 0) {
        // bounce effect handled separately
      }
      f.state = 'idle';
    }
  }

  // Push fighters apart
  const dx = opp.x - player.x;
  if (Math.abs(dx) < PUSH_DISTANCE && player.grounded && opp.grounded) {
    const push = (PUSH_DISTANCE - Math.abs(dx)) / 2;
    const dir = dx > 0 ? -1 : 1;
    player.x += dir * push;
    opp.x    -= dir * push;
    player.x = Math.max(40, Math.min(W - 40, player.x));
    opp.x    = Math.max(40, Math.min(W - 40, opp.x));
  }
}

function tickTimers(f) {
  if (f.hitstun   > 0) f.hitstun--;
  if (f.blockstun > 0) f.blockstun--;
  if (f.invincible > 0) f.invincible--;
  if (f.knockdown > 0) f.knockdown--;
  if (f.comboTimer > 0) f.comboTimer--;
  else if (f.comboTimer === 0 && f.comboCount > 0) f.comboCount = 0;

  // Advance attack animation
  if (f.currentMove) {
    f.stateFrame++;
    const move = f.moves[f.currentMove];
    const total = move.frames[0] + move.frames[1] + move.frames[2];
    if (f.stateFrame >= total) {
      f.currentMove = null;
      f.stateFrame = 0;
      f.state = 'idle';
    }
  }

  // Special projectile
  if (f.specialActive) {
    f.specialX += f.specialVX;
    if (f.specialX < 0 || f.specialX > W) f.specialActive = false;
  }
}

// ─── ATTACK LOGIC ─────────────────────────────────────────────────────────────
function tryAttack(f, moveKey, enemy) {
  if (f.currentMove || f.hitstun > 0 || f.blockstun > 0 || f.knockdown > 0) return;
  if (f.state === 'special_active') return;
  if (!consumeInput(moveKey)) return;

  f.currentMove = moveKey;
  f.stateFrame = 0;
  f.state = moveKey;
  f.crouching = false;

  // Special move: launch projectile or teleport
  if (moveKey === 'special') {
    triggerSpecial(f, enemy);
  }
}

function triggerSpecial(f, enemy) {
  const id = f.char.id;
  if (id === 'apex') {
    // Projectile
    f.specialActive = true;
    f.specialX = f.x + f.facing * 40;
    f.specialVX = f.facing * 12;
  } else if (id === 'venom') {
    // Slide dash — instant reposition
    f.invincible = 20;
    setTimeout(() => {
      f.x = Math.max(40, Math.min(W - 40, f.x + f.facing * 160));
      screenShake = 6;
      checkHit(f, enemy, f.moves.special);
    }, 100);
  } else if (id === 'titan') {
    // Armor super — invincible during startup
    f.invincible = 30;
  } else if (id === 'ghost') {
    // Teleport behind enemy
    f.invincible = 15;
    setTimeout(() => {
      f.x = enemy.x - f.facing * 60;
      spawnParticles(f.x, f.y - 60, f.char.glowColor, 20);
    }, 80);
  }
}

function checkHit(attacker, defender, move) {
  if (attacker.invincible > 0 && attacker !== defender) return;
  if (defender.invincible > 0) return;

  const dx = Math.abs(attacker.x - defender.x);
  const range = move.range || 90;
  if (dx > range && !attacker.specialActive) return;

  // Check special projectile hit
  if (attacker.specialActive) {
    const pdx = Math.abs(attacker.specialX - defender.x);
    if (pdx > 40) return;
    attacker.specialActive = false;
  }

  const defense = defender.char.stats.defense;
  let dmg = move.dmg * (1 - defense / 300);

  if (defender.blocking && defender.grounded) {
    dmg *= 0.15;
    defender.blockstun = move.hitstun;
    spawnSpark(defender.x, defender.y - 80, '#4fc3f7');
    return;
  }

  if (defender.crouching && defender.blocking) {
    dmg *= 0.1;
    defender.blockstun = move.hitstun;
    return;
  }

  defender.hp = Math.max(0, defender.hp - dmg);
  defender.hitstun = move.hitstun;
  defender.x += -attacker.facing * move.pushback;
  defender.x = Math.max(40, Math.min(W - 40, defender.x));

  // Combo
  if (attacker.comboTimer > 0) {
    attacker.comboCount++;
  } else {
    attacker.comboCount = 1;
  }
  attacker.comboTimer = COMBO_WINDOW;

  // Screen effects
  screenShake = move.pushback > 20 ? 10 : 4;
  spawnSpark(defender.x, defender.y - 80, attacker.char.accentColor);
  spawnParticles(defender.x, defender.y - 80, attacker.char.accentColor, 8);

  // Knockdown on heavy/special
  if (move === attacker.moves.heavy || move === attacker.moves.special) {
    if (defender.hp > 0) {
      defender.vy = -8;
      defender.grounded = false;
      defender.knockdown = 40;
    }
  }
}

function resolveAttacks() {
  // Player attacks
  for (const key of ['light','heavy','kick','special']) {
    if (inputQueue.find(i => i.key === key)) {
      tryAttack(player, key, opp);
    }
  }

  // Check if in active frames → register hit
  if (player.currentMove) {
    const move = player.moves[player.currentMove];
    const activeStart = move.frames[0];
    const activeEnd   = activeStart + move.frames[1];
    if (player.stateFrame >= activeStart && player.stateFrame < activeEnd) {
      checkHit(player, opp, move);
    }
  }

  // Projectile hit check
  if (player.specialActive) {
    const pdx = Math.abs(player.specialX - opp.x);
    if (pdx < 40) {
      checkHit(player, opp, player.moves.special);
    }
  }
  if (opp.specialActive) {
    const pdx = Math.abs(opp.specialX - player.x);
    if (pdx < 40) {
      checkHit(opp, player, opp.moves.special);
    }
  }
}

// ─── AI ───────────────────────────────────────────────────────────────────────
let aiState = 'approach';
let aiTimer = 0;
let aiInputTimer = 0;

function updateAI() {
  if (opp.hitstun > 0 || opp.blockstun > 0 || opp.knockdown > 0) return;
  if (opp.currentMove) return;

  aiTimer--;
  aiInputTimer--;

  const dx = player.x - opp.x;
  const dist = Math.abs(dx);
  const spd = opp.char.stats.speed / 30;
  const facing = opp.facing;

  if (aiState === 'approach') {
    if (dist > 120) {
      opp.x += Math.sign(dx) * spd;
    } else {
      aiState = 'attack';
      aiTimer = 20 + Math.floor(Math.random() * 40);
    }
  } else if (aiState === 'attack') {
    if (aiTimer <= 0) {
      if (dist < 110 && aiInputTimer <= 0) {
        const roll = Math.random();
        let move;
        if (roll < 0.45) move = 'light';
        else if (roll < 0.70) move = 'heavy';
        else if (roll < 0.88) move = 'kick';
        else move = 'special';
        inputQueue.push({ key: move, frame: roundFrame, forAI: true });
        tryAttack(opp, move, player);
        // Check active frames for AI
        if (opp.currentMove) {
          const m = opp.moves[opp.currentMove];
          // Instant check since AI has direct state access
          if (dist < (m.range || 90)) {
            checkHit(opp, player, m);
          }
        }
        aiInputTimer = 30 + Math.floor(Math.random() * 30);
      }
      aiState = 'approach';
      aiTimer = 10 + Math.floor(Math.random() * 30);
    }
  }

  // AI blocking when being attacked
  if (player.currentMove) {
    const pm = player.moves[player.currentMove];
    const activeStart = pm.frames[0];
    if (player.stateFrame >= activeStart - 4 && dist < 100) {
      if (Math.random() < 0.3) {
        opp.blocking = true;
        setTimeout(() => { opp.blocking = false; }, 300);
      }
    }
  }

  // AI jump (occasional)
  if (Math.random() < 0.002 && opp.grounded) {
    opp.vy = JUMP_VY * 0.85;
    opp.grounded = false;
    opp.state = 'jump';
  }

  opp.x = Math.max(40, Math.min(W - 40, opp.x));

  // Update special projectile
  if (opp.specialActive) {
    opp.specialX += opp.specialVX;
    if (opp.specialX < 0 || opp.specialX > W) opp.specialActive = false;
  }
}

// ─── PARTICLES / FX ───────────────────────────────────────────────────────────
function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const spd = 2 + Math.random() * 4;
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 2,
      life: 20 + Math.floor(Math.random() * 15),
      maxLife: 35,
      color,
      size: 3 + Math.random() * 4,
    });
  }
}

function spawnSpark(x, y, color) {
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = 3 + Math.random() * 6;
    hitSparks.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      life: 10,
      color,
    });
  }
}

function updateParticles() {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    p.life--;
  }
  particles = particles.filter(p => p.life > 0);

  for (const s of hitSparks) {
    s.x += s.vx;
    s.y += s.vy;
    s.life--;
  }
  hitSparks = hitSparks.filter(s => s.life > 0);
}

// ─── DRAWING ──────────────────────────────────────────────────────────────────
function drawBackground() {
  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  skyGrad.addColorStop(0, '#0a0010');
  skyGrad.addColorStop(0.6, '#1a0030');
  skyGrad.addColorStop(1, '#0d0020');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // City skyline silhouette
  ctx.fillStyle = '#0d0025';
  const buildings = [
    [0,H-200,80,200],[80,H-250,60,250],[140,H-180,90,180],
    [230,H-300,70,300],[300,H-220,100,220],[400,H-270,80,270],
    [480,H-190,90,190],[570,H-310,75,310],[645,H-230,85,230],
    [730,H-260,90,260],[820,H-200,70,200],[890,H-280,80,280],
    [970,H-210,W-970,210],
  ];
  for (const [x,y,w,h] of buildings) {
    ctx.fillRect(x, y, w, h);
    // Windows
    ctx.fillStyle = '#ffffff08';
    for (let wx = x+8; wx < x+w-8; wx += 14) {
      for (let wy = y+10; wy < y+h-10; wy += 18) {
        if (Math.random() < 0.6) ctx.fillRect(wx, wy, 8, 10);
      }
    }
    ctx.fillStyle = '#0d0025';
  }

  // Neon ground
  const groundGrad = ctx.createLinearGradient(0, GROUND, 0, H);
  groundGrad.addColorStop(0, '#1a0035');
  groundGrad.addColorStop(1, '#0a0015');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, GROUND, W, H - GROUND);

  // Ground reflection line
  ctx.strokeStyle = '#6600ff44';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND);
  ctx.lineTo(W, GROUND);
  ctx.stroke();

  // Neon lane lines
  for (let x = 0; x < W; x += 80) {
    ctx.strokeStyle = '#33006622';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, GROUND);
    ctx.lineTo(x + 40, H);
    ctx.stroke();
  }
}

// Draw a stylized fighter
function drawFighter(f) {
  ctx.save();
  const x = f.x;
  const y = f.y;
  const flip = f.facing === -1;
  const color = f.char.primaryColor;
  const accent = f.char.accentColor;
  const glow = f.char.glowColor;

  // Flash white on hit
  const flash = f.hitstun > 0 && Math.floor(f.hitstun / 3) % 2 === 0;
  const alpha = (f.knockdown > 0 && Math.floor(f.knockdown / 5) % 2 === 0) ? 0.4 : 1;

  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);

  const crouchOffset = f.crouching ? 18 : 0;
  const blockAnim = f.blocking ? 1 : 0;

  // Shadow
  ctx.fillStyle = '#00000066';
  ctx.beginPath();
  ctx.ellipse(0, 2, 24, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glow
  ctx.shadowColor = glow;
  ctx.shadowBlur = flash ? 30 : 14;

  // Determine pose
  const inAttack = !!f.currentMove;
  const activeStart = inAttack ? f.moves[f.currentMove].frames[0] : 0;
  const isActive = inAttack && f.stateFrame >= activeStart && f.stateFrame < activeStart + f.moves[f.currentMove].frames[1];

  // LEGS
  ctx.strokeStyle = flash ? '#fff' : color;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';

  if (f.crouching) {
    // Crouched legs
    ctx.beginPath(); ctx.moveTo(-10,-18); ctx.lineTo(-16,0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6,-18);   ctx.lineTo(14,0);  ctx.stroke();
  } else if (!f.grounded) {
    // Air pose
    ctx.beginPath(); ctx.moveTo(-8,-20); ctx.lineTo(-12,-44); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6,-20);  ctx.lineTo(14,-40);  ctx.stroke();
  } else if (f.blocking) {
    ctx.beginPath(); ctx.moveTo(-10,-18); ctx.lineTo(-8,0);  ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6,-18);   ctx.lineTo(4,0);   ctx.stroke();
  } else if (inAttack && (f.currentMove==='kick' || f.currentMove==='special')) {
    ctx.beginPath(); ctx.moveTo(-10,-20); ctx.lineTo(-8,0);  ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6,-20);   ctx.lineTo(28,-10);ctx.stroke(); // kick leg extended
  } else {
    // Idle stance (slight offset)
    const bob = Math.sin(roundFrame * 0.08) * 2;
    ctx.beginPath(); ctx.moveTo(-10,-18+bob); ctx.lineTo(-12,0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6,-18-bob);   ctx.lineTo(8,0);   ctx.stroke();
  }

  // TORSO
  ctx.strokeStyle = flash ? '#fff' : accent;
  ctx.lineWidth = 10;
  const torsoY = -crouchOffset;
  ctx.beginPath();
  ctx.moveTo(0, -18 - crouchOffset);
  ctx.lineTo(0, -58 - crouchOffset);
  ctx.stroke();

  // ARMS
  ctx.strokeStyle = flash ? '#fff' : color;
  ctx.lineWidth = 6;
  if (f.blocking) {
    // Guard pose: arms crossed in front
    ctx.beginPath(); ctx.moveTo(0,-52-crouchOffset); ctx.lineTo(22,-38-crouchOffset); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,-46-crouchOffset); ctx.lineTo(22,-52-crouchOffset); ctx.stroke();
  } else if (inAttack && f.currentMove === 'light') {
    ctx.beginPath(); ctx.moveTo(0,-52-crouchOffset); ctx.lineTo(36 + (isActive?8:0),-46-crouchOffset); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,-46-crouchOffset); ctx.lineTo(-14,-54-crouchOffset); ctx.stroke();
  } else if (inAttack && f.currentMove === 'heavy') {
    ctx.beginPath(); ctx.moveTo(0,-52-crouchOffset); ctx.lineTo(40 + (isActive?12:0),-40-crouchOffset); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,-46-crouchOffset); ctx.lineTo(-10,-38-crouchOffset); ctx.stroke();
  } else if (inAttack && f.currentMove === 'special') {
    ctx.beginPath(); ctx.moveTo(0,-52-crouchOffset); ctx.lineTo(50,-48-crouchOffset); ctx.stroke();
    if (isActive) {
      // Energy burst on hand
      ctx.shadowColor = glow;
      ctx.shadowBlur = 30;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(50, -48-crouchOffset, 10, 0, Math.PI*2);
      ctx.fill();
    }
  } else {
    const swing = Math.sin(roundFrame * 0.08) * 6;
    ctx.beginPath(); ctx.moveTo(0,-52-crouchOffset); ctx.lineTo(16+swing,-40-crouchOffset); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,-46-crouchOffset); ctx.lineTo(-14-swing,-40-crouchOffset); ctx.stroke();
  }

  // HEAD
  ctx.shadowBlur = flash ? 20 : 10;
  ctx.fillStyle = flash ? '#fff' : color;
  const headY = -68 - crouchOffset;
  ctx.beginPath();
  ctx.arc(0, headY, 14, 0, Math.PI * 2);
  ctx.fill();

  // Visor / face accent
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(5, headY - 2, 5, 0, Math.PI * 2);
  ctx.fill();

  // Character-specific flair
  if (f.char.id === 'apex') {
    // Electric gauntlet glow
    ctx.strokeStyle = glow;
    ctx.lineWidth = 2;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(30, -48-crouchOffset, 8, 0, Math.PI*2); ctx.stroke();
  } else if (f.char.id === 'ghost') {
    // Trailing ghost effect
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, headY, 18, 0, Math.PI*2);
    ctx.fill();
    ctx.globalAlpha = alpha;
  } else if (f.char.id === 'titan') {
    // Thick outline = bulk
    ctx.strokeStyle = glow + '44';
    ctx.lineWidth = 18;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -18-crouchOffset);
    ctx.lineTo(0, -58-crouchOffset);
    ctx.stroke();
  }

  ctx.restore();
}

function drawProjectile(f) {
  if (!f.specialActive) return;
  ctx.save();
  ctx.shadowColor = f.char.glowColor;
  ctx.shadowBlur = 24;
  ctx.fillStyle = f.char.accentColor;
  ctx.beginPath();
  ctx.arc(f.specialX, f.y - 55, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
  }
  for (const s of hitSparks) {
    ctx.globalAlpha = s.life / 10;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + s.vx * 3, s.y + s.vy * 3);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawHUD() {
  const BAR_W = W * 0.36;
  const BAR_H = 18;
  const BAR_Y = 20;
  const BAR_PAD = 16;

  // Player HP bar (left)
  const pPct = Math.max(0, player.hp / player.maxHp);
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(BAR_PAD, BAR_Y, BAR_W, BAR_H);
  const pColor = pPct > 0.5 ? '#2ecc71' : pPct > 0.25 ? '#f39c12' : '#e74c3c';
  ctx.fillStyle = pColor;
  ctx.fillRect(BAR_PAD, BAR_Y, BAR_W * pPct, BAR_H);
  ctx.strokeStyle = '#ffffff22';
  ctx.lineWidth = 1;
  ctx.strokeRect(BAR_PAD, BAR_Y, BAR_W, BAR_H);

  // Opponent HP bar (right, fills left)
  const oPct = Math.max(0, opp.hp / opp.maxHp);
  const oBarX = W - BAR_PAD - BAR_W;
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(oBarX, BAR_Y, BAR_W, BAR_H);
  const oColor = oPct > 0.5 ? '#e74c3c' : oPct > 0.25 ? '#f39c12' : '#888';
  // Fill from right
  ctx.fillStyle = oColor;
  ctx.fillRect(oBarX + BAR_W * (1 - oPct), BAR_Y, BAR_W * oPct, BAR_H);
  ctx.strokeStyle = '#ffffff22';
  ctx.strokeRect(oBarX, BAR_Y, BAR_W, BAR_H);

  // Names
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(player.name.toUpperCase(), BAR_PAD, BAR_Y - 4);
  ctx.textAlign = 'right';
  ctx.fillText(opp.name.toUpperCase(), W - BAR_PAD, BAR_Y - 4);

  // Round pips
  const pipY = BAR_Y + BAR_H + 8;
  for (let i = 0; i < ROUNDS_TO_WIN; i++) {
    ctx.fillStyle = i < playerRoundsWon ? '#e8c84a' : '#333';
    ctx.beginPath(); ctx.arc(W/2 - 20 + i*-18, pipY, 5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = i < oppRoundsWon ? '#e74c3c' : '#333';
    ctx.beginPath(); ctx.arc(W/2 + 20 + i*18, pipY, 5, 0, Math.PI*2); ctx.fill();
  }

  // Timer
  ctx.fillStyle = roundTimer <= 10 ? '#e74c3c' : '#fff';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(String(Math.ceil(roundTimer)).padStart(2, '0'), W/2, BAR_Y + BAR_H - 2);

  // Combo counter
  if (player.comboCount >= 2) {
    ctx.fillStyle = player.char.accentColor;
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'left';
    ctx.shadowColor = player.char.glowColor;
    ctx.shadowBlur = 20;
    ctx.fillText(player.comboCount + ' HIT', 20, H - 180);
    ctx.shadowBlur = 0;
  }
  if (opp.comboCount >= 2) {
    ctx.fillStyle = opp.char.accentColor;
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'right';
    ctx.shadowColor = opp.char.glowColor;
    ctx.shadowBlur = 20;
    ctx.fillText(opp.comboCount + ' HIT', W - 20, H - 180);
    ctx.shadowBlur = 0;
  }
}

function drawControls() {
  // D-pad area hint
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(80, H - 100, DPAD_RADIUS + 10, 0, Math.PI*2);
  ctx.fill();

  // Joystick dot if active
  if (dpadTouchId !== null) {
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(dpadOrigin.x, dpadOrigin.y, DPAD_RADIUS, 0, Math.PI*2);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(
      dpadOrigin.x + dpad.right ? 30 : dpad.left ? -30 : 0,
      dpadOrigin.y + dpad.down  ? 30 : dpad.up   ? -30 : 0,
      14, 0, Math.PI*2
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Attack buttons
  for (const btn of BTN_POSITIONS) {
    const pressed = btns[btn.key];
    ctx.globalAlpha = pressed ? 0.85 : 0.38;
    ctx.fillStyle = btn.color;
    ctx.shadowColor = btn.color;
    ctx.shadowBlur = pressed ? 20 : 6;
    ctx.beginPath();
    ctx.arc(btn.x, btn.y, BTN_RADIUS, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, btn.x, btn.y);
    ctx.textBaseline = 'alphabetic';
  }
}

function drawAnnounce() {
  if (gamePhase !== 'announce' && gamePhase !== 'roundover' && gamePhase !== 'gameover') return;

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, H);

  const scale = Math.min(1, announceFrame / 12);
  ctx.save();
  ctx.translate(W/2, H/2 - 20);
  ctx.scale(scale, scale);

  ctx.textAlign = 'center';
  ctx.shadowColor = '#e8c84a';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#e8c84a';
  ctx.font = 'bold 52px sans-serif';
  ctx.fillText(announceText, 0, 0);

  if (announceSubText) {
    ctx.shadowColor = '#fff';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(announceSubText, 0, 44);
  }
  ctx.restore();
  ctx.shadowBlur = 0;
}

// ─── ROUND MANAGEMENT ─────────────────────────────────────────────────────────
function startRound() {
  announceText = 'ROUND ' + round;
  announceSubText = '';
  gamePhase = 'announce';
  announceFrame = 0;

  // Reset fighter positions and HP
  player.x = W * 0.25;
  player.y = GROUND;
  player.vy = 0;
  player.grounded = true;
  player.hp = player.maxHp;
  player.hitstun = 0; player.blockstun = 0; player.knockdown = 0;
  player.currentMove = null; player.stateFrame = 0;
  player.comboCount = 0; player.comboTimer = 0;
  player.specialActive = false;
  player.state = 'idle';

  opp.x = W * 0.75;
  opp.y = GROUND;
  opp.vy = 0;
  opp.grounded = true;
  opp.hp = opp.maxHp;
  opp.hitstun = 0; opp.blockstun = 0; opp.knockdown = 0;
  opp.currentMove = null; opp.stateFrame = 0;
  opp.comboCount = 0; opp.comboTimer = 0;
  opp.specialActive = false;
  opp.state = 'idle';

  roundTimer = ROUND_TIME;
  roundTimerFrame = 0;
  inputQueue.length = 0;
}

function endRound(playerWonRound) {
  gamePhase = 'roundover';
  if (playerWonRound) {
    playerRoundsWon++;
    announceText = 'K.O.';
    announceSubText = player.name.toUpperCase() + ' WINS ROUND ' + round;
  } else {
    oppRoundsWon++;
    announceText = 'K.O.';
    announceSubText = opp.name.toUpperCase() + ' WINS ROUND ' + round;
  }
  announceFrame = 0;

  // Check if match over
  setTimeout(() => {
    if (playerRoundsWon >= ROUNDS_TO_WIN || oppRoundsWon >= ROUNDS_TO_WIN) {
      endMatch(playerRoundsWon >= ROUNDS_TO_WIN);
    } else {
      round++;
      startRound();
    }
  }, 2200);
}

function endMatch(playerWon) {
  gamePhase = 'gameover';
  announceText = playerWon ? 'YOU WIN!' : 'GAME OVER';
  announceSubText = playerWon
    ? '+' + (80 + Math.floor(Math.random()*60)) + ' gold  •  +120 XP'
    : '+15 gold  •  +30 XP';
  announceFrame = 0;

  const currency = playerWon ? 80 + Math.floor(Math.random()*60) : 15 + Math.floor(Math.random()*15);
  const xp       = playerWon ? 120 : 30;

  setTimeout(() => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'BATTLE_RESULT',
        won: playerWon,
        currencyEarned: currency,
        xpEarned: xp,
        roundsWon: playerRoundsWon,
      }));
    }
  }, 2800);
}

// ─── MAIN LOOP ────────────────────────────────────────────────────────────────
function loop() {
  roundFrame++;

  // Screen shake
  let sx = 0, sy = 0;
  if (screenShake > 0) {
    sx = (Math.random() - 0.5) * screenShake * 2;
    sy = (Math.random() - 0.5) * screenShake * 2;
    screenShake = Math.max(0, screenShake - 1);
  }
  ctx.save();
  ctx.translate(sx, sy);

  // ── PHASE: ANNOUNCE ──
  if (gamePhase === 'announce') {
    announceFrame++;
    drawBackground();
    drawFighter(player);
    drawFighter(opp);
    drawHUD();
    drawAnnounce();
    if (announceFrame > 90) {
      // Show "FIGHT!" before starting
      announceText = 'FIGHT!';
      if (announceFrame > 130) {
        gamePhase = 'fight';
      }
    }
    ctx.restore();
    requestAnimationFrame(loop);
    return;
  }

  // ── PHASE: ROUNDOVER / GAMEOVER ──
  if (gamePhase === 'roundover' || gamePhase === 'gameover') {
    announceFrame++;
    drawBackground();
    drawFighter(player);
    drawFighter(opp);
    drawParticles();
    drawHUD();
    drawAnnounce();
    ctx.restore();
    requestAnimationFrame(loop);
    return;
  }

  // ── PHASE: FIGHT ──
  // Round timer
  roundTimerFrame++;
  if (roundTimerFrame % 60 === 0) {
    roundTimer = Math.max(0, roundTimer - 1);
    if (roundTimer === 0) {
      endRound(player.hp >= opp.hp);
      ctx.restore();
      return;
    }
  }

  // Update
  tickTimers(player);
  tickTimers(opp);
  updateMovement(player, true);
  updateAI();
  updatePhysics(player);
  updatePhysics(opp);
  resolveAttacks();
  updateParticles();

  // Check KO
  if (player.hp <= 0) { endRound(false); ctx.restore(); return; }
  if (opp.hp <= 0)    { endRound(true);  ctx.restore(); return; }

  // Draw
  drawBackground();
  drawProjectile(player);
  drawProjectile(opp);
  drawFighter(opp);
  drawFighter(player);
  drawParticles();
  drawHUD();
  drawControls();

  ctx.restore();
  requestAnimationFrame(loop);
}

// Kick off
startRound();
requestAnimationFrame(loop);
</script>
</body>
</html>`;
}
