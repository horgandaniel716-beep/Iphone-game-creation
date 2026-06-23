import type { Raider, Demon } from '../types';

export function buildArenaHtml(
  playerRaider: Raider,
  opponentRaider: Raider,
  opponentDemons: Demon[]
): string {
  const playerData = JSON.stringify(playerRaider);
  const opponentData = JSON.stringify(opponentRaider);
  const demonsData = JSON.stringify(opponentDemons);

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0a0a0f; overflow: hidden; }
canvas { display: block; }
#ui {
  position: fixed;
  top: 0; left: 0; right: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 16px;
  pointer-events: none;
  z-index: 10;
}
.hud-bar { width: 140px; }
.hud-name { color: #fff; font-size: 12px; font-family: sans-serif; font-weight: 700; margin-bottom: 4px; }
.hp-bg { height: 8px; background: #1e1e2e; border-radius: 4px; }
.hp-fill { height: 8px; border-radius: 4px; transition: width 0.2s; }
.hp-fill.player { background: #2ecc71; }
.hp-fill.opponent { background: #e74c3c; }
.hud-hp { color: #aaa; font-size: 10px; font-family: sans-serif; margin-top: 2px; }
#timer {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  color: #e8c84a;
  font-size: 20px;
  font-family: sans-serif;
  font-weight: 900;
  z-index: 10;
}
#result-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  align-items: center;
  justify-content: center;
  flex-direction: column;
  z-index: 20;
}
#result-overlay.show { display: flex; }
#result-text {
  font-size: 48px;
  font-weight: 900;
  font-family: sans-serif;
  margin-bottom: 8px;
}
#result-sub {
  color: #aaa;
  font-size: 16px;
  font-family: sans-serif;
}
</style>
</head>
<body>
<div id="ui">
  <div class="hud-bar">
    <div class="hud-name" id="player-name">You</div>
    <div class="hp-bg"><div class="hp-fill player" id="player-hp-bar" style="width:100%"></div></div>
    <div class="hud-hp" id="player-hp-text"></div>
  </div>
  <div class="hud-bar" style="text-align:right">
    <div class="hud-name" id="opp-name">Opponent</div>
    <div class="hp-bg"><div class="hp-fill opponent" id="opp-hp-bar" style="width:100%"></div></div>
    <div class="hud-hp" id="opp-hp-text"></div>
  </div>
</div>
<div id="timer">60</div>
<div id="result-overlay">
  <div id="result-text"></div>
  <div id="result-sub"></div>
</div>
<script>
const PLAYER = ${playerData};
const OPPONENT = ${opponentData};
const DEMONS = ${demonsData};

const W = window.innerWidth;
const H = window.innerHeight;

const canvas = document.createElement('canvas');
canvas.width = W;
canvas.height = H;
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');

// --- Game state ---
const ARENA_PAD = 40;
const arena = { x: ARENA_PAD, y: 80, w: W - ARENA_PAD*2, h: H - 160 };

const PLAYER_MAX_HP = PLAYER.stats.health;
const OPP_MAX_HP = OPPONENT.stats.health;

const player = {
  x: arena.x + 80,
  y: arena.y + arena.h / 2,
  hp: PLAYER_MAX_HP,
  speed: PLAYER.stats.speed / 60,
  atk: PLAYER.stats.attack,
  def: PLAYER.stats.defense,
  r: 18,
  attacking: false,
  atkTimer: 0,
  atkCooldown: 60,
  color: '#4a9eff',
  facing: 1,
  invincible: 0,
  isPlayer: true,
};

const opp = {
  x: arena.x + arena.w - 80,
  y: arena.y + arena.h / 2,
  hp: OPP_MAX_HP,
  speed: Math.max(OPPONENT.stats.speed / 80, 1),
  atk: OPPONENT.stats.attack,
  def: OPPONENT.stats.defense,
  r: 18,
  attacking: false,
  atkTimer: 0,
  atkCooldown: 75,
  color: '#e74c3c',
  facing: -1,
  invincible: 0,
  isPlayer: false,
  aiState: 'chase',
  aiTimer: 0,
};

// Place demons in the opponent's zone
const demonEntities = DEMONS.slice(0, 3).map((d, i) => ({
  x: arena.x + arena.w - 200 - i * 60,
  y: arena.y + 80 + i * 90,
  hp: d.stats.health,
  maxHp: d.stats.health,
  atk: d.stats.atk || d.stats.attack,
  speed: d.stats.speed / 100,
  r: d.visualTraits.size === 'massive' ? 28 : d.visualTraits.size === 'large' ? 24 : 16,
  color: d.visualTraits.primaryColor || '#b44aff',
  glowColor: d.visualTraits.glowColor || '#b44aff',
  atkTimer: 0,
  atkCooldown: 90,
  aggroRange: d.stats.aggroRange || 150,
  invincible: 0,
  alive: true,
}));

// Touch / joystick
const joystick = { active: false, startX: 0, startY: 0, dx: 0, dy: 0, id: null };
let attackPressed = false;
let attackTouchId = null;

canvas.addEventListener('touchstart', (e) => {
  for (const t of e.changedTouches) {
    if (t.clientX < W / 2 && !joystick.active) {
      joystick.active = true;
      joystick.startX = t.clientX;
      joystick.startY = t.clientY;
      joystick.dx = 0;
      joystick.dy = 0;
      joystick.id = t.identifier;
    } else if (t.clientX >= W / 2) {
      attackPressed = true;
      attackTouchId = t.identifier;
    }
  }
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === joystick.id) {
      joystick.dx = Math.max(-1, Math.min(1, (t.clientX - joystick.startX) / 50));
      joystick.dy = Math.max(-1, Math.min(1, (t.clientY - joystick.startY) / 50));
    }
  }
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === joystick.id) {
      joystick.active = false;
      joystick.dx = 0;
      joystick.dy = 0;
      joystick.id = null;
    }
    if (t.identifier === attackTouchId) {
      attackPressed = false;
      attackTouchId = null;
    }
  }
}, { passive: true });

// Timer
let timeLeft = 60;
let gameOver = false;
let lastSec = Date.now();

function updateHUD() {
  document.getElementById('player-name').textContent = PLAYER.name;
  document.getElementById('opp-name').textContent = OPPONENT.name;
  const pPct = Math.max(0, player.hp / PLAYER_MAX_HP * 100);
  const oPct = Math.max(0, opp.hp / OPP_MAX_HP * 100);
  document.getElementById('player-hp-bar').style.width = pPct + '%';
  document.getElementById('opp-hp-bar').style.width = oPct + '%';
  document.getElementById('player-hp-text').textContent = Math.max(0, Math.ceil(player.hp)) + ' HP';
  document.getElementById('opp-hp-text').textContent = Math.max(0, Math.ceil(opp.hp)) + ' HP';
  document.getElementById('timer').textContent = timeLeft;
}

function clampToArena(entity) {
  entity.x = Math.max(arena.x + entity.r, Math.min(arena.x + arena.w - entity.r, entity.x));
  entity.y = Math.max(arena.y + entity.r, Math.min(arena.y + arena.h - entity.r, entity.y));
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function meleeHit(attacker, target) {
  const d = dist(attacker, target);
  const range = attacker.r + target.r + 20;
  if (d < range) {
    const dmg = Math.max(1, attacker.atk - target.def * 0.4 + (Math.random() * 6 - 3));
    if (target.invincible <= 0) {
      target.hp -= dmg;
      target.invincible = 20;
      spawnParticle(target.x, target.y, '#fff');
      return true;
    }
  }
  return false;
}

// Particles
const particles = [];
function spawnParticle(x, y, color) {
  for (let i = 0; i < 6; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      life: 20,
      color,
    });
  }
}

// AI for opponent
function updateOpponentAI() {
  opp.aiTimer--;
  const dx = player.x - opp.x;
  const dy = player.y - opp.y;
  const d = Math.hypot(dx, dy);

  if (d > 60) {
    opp.x += (dx / d) * opp.speed;
    opp.y += (dy / d) * opp.speed;
    opp.facing = dx > 0 ? 1 : -1;
  }

  opp.atkTimer--;
  if (opp.atkTimer <= 0 && d < 50) {
    opp.attacking = true;
    opp.atkTimer = opp.atkCooldown;
    meleeHit(opp, player);
    setTimeout(() => { opp.attacking = false; }, 300);
  }
}

function updateDemonAI() {
  for (const demon of demonEntities) {
    if (!demon.alive) continue;
    const d = dist(demon, player);
    if (d < demon.aggroRange) {
      const dx = player.x - demon.x;
      const dy = player.y - demon.y;
      const mag = Math.hypot(dx, dy);
      if (d > 40) {
        demon.x += (dx / mag) * demon.speed;
        demon.y += (dy / mag) * demon.speed;
      }
      demon.atkTimer--;
      if (demon.atkTimer <= 0 && d < 50) {
        demon.atkTimer = demon.atkCooldown;
        meleeHit(demon, player);
      }
    }
    if (demon.invincible > 0) demon.invincible--;
    clampToArena(demon);
  }
}

function endGame(playerWon) {
  gameOver = true;
  const overlay = document.getElementById('result-overlay');
  document.getElementById('result-text').textContent = playerWon ? '⚔️ VICTORY' : '💀 DEFEATED';
  document.getElementById('result-text').style.color = playerWon ? '#e8c84a' : '#e74c3c';
  const currency = playerWon ? Math.floor(50 + Math.random() * 100) : Math.floor(10 + Math.random() * 20);
  const xp = playerWon ? 120 : 30;
  document.getElementById('result-sub').textContent =
    '+' + currency + ' gold  •  +' + xp + ' XP';
  overlay.classList.add('show');

  // Post result to React Native
  setTimeout(() => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'BATTLE_RESULT',
        won: playerWon,
        currencyEarned: currency,
        xpEarned: xp,
      }));
    }
  }, 2500);
}

// Draw functions
function drawArena() {
  ctx.fillStyle = '#12121a';
  ctx.fillRect(0, 0, W, H);

  // Arena floor
  ctx.fillStyle = '#1a1a28';
  ctx.beginPath();
  ctx.roundRect(arena.x, arena.y, arena.w, arena.h, 12);
  ctx.fill();

  // Grid lines
  ctx.strokeStyle = '#1e1e30';
  ctx.lineWidth = 1;
  const step = 40;
  for (let x = arena.x; x < arena.x + arena.w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, arena.y);
    ctx.lineTo(x, arena.y + arena.h);
    ctx.stroke();
  }
  for (let y = arena.y; y < arena.y + arena.h; y += step) {
    ctx.beginPath();
    ctx.moveTo(arena.x, y);
    ctx.lineTo(arena.x + arena.w, y);
    ctx.stroke();
  }

  // Border
  ctx.strokeStyle = '#e8c84a33';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(arena.x, arena.y, arena.w, arena.h, 12);
  ctx.stroke();
}

function drawEntity(e, label, isPlayer) {
  if (e.invincible > 0 && Math.floor(e.invincible / 3) % 2 === 0) return;

  // Glow
  const glow = isPlayer ? '#4a9eff' : '#e74c3c';
  ctx.shadowColor = e.glowColor || glow;
  ctx.shadowBlur = e.attacking ? 20 : 8;

  ctx.fillStyle = e.color;
  ctx.beginPath();
  ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Simple body indicator (facing)
  ctx.fillStyle = '#ffffff44';
  ctx.beginPath();
  ctx.arc(e.x + e.facing * e.r * 0.4, e.y - e.r * 0.2, e.r * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Attack flash
  if (e.attacking) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r + 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Label
  if (label) {
    ctx.fillStyle = '#ffffff88';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, e.x, e.y - e.r - 6);
  }
}

function drawDemon(d) {
  if (!d.alive) return;
  ctx.shadowColor = d.glowColor;
  ctx.shadowBlur = 16;
  ctx.fillStyle = d.color;
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // HP bar above demon
  const barW = d.r * 2;
  ctx.fillStyle = '#1e1e2e';
  ctx.fillRect(d.x - barW / 2, d.y - d.r - 12, barW, 4);
  ctx.fillStyle = '#b44aff';
  ctx.fillRect(d.x - barW / 2, d.y - d.r - 12, barW * (d.hp / d.maxHp), 4);
}

function drawJoystick() {
  if (!joystick.active) return;
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(joystick.startX, joystick.startY, 50, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(
    joystick.startX + joystick.dx * 50,
    joystick.startY + joystick.dy * 50,
    18, 0, Math.PI * 2
  );
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawAttackButton() {
  const bx = W - 60, by = H - 80;
  ctx.globalAlpha = attackPressed ? 0.9 : 0.4;
  ctx.fillStyle = '#e8c84a';
  ctx.beginPath();
  ctx.arc(bx, by, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚔', bx, by);
  ctx.textBaseline = 'alphabetic';
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = p.life / 20;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Main loop
function loop() {
  if (gameOver) return;

  // Timer
  const now = Date.now();
  if (now - lastSec >= 1000) {
    timeLeft--;
    lastSec = now;
    if (timeLeft <= 0) {
      endGame(player.hp > opp.hp);
      return;
    }
  }

  // Player movement
  if (joystick.active) {
    player.x += joystick.dx * player.speed;
    player.y += joystick.dy * player.speed;
    if (Math.abs(joystick.dx) > 0.1) player.facing = joystick.dx > 0 ? 1 : -1;
  }
  clampToArena(player);

  // Player attack
  player.atkTimer--;
  if (attackPressed && player.atkTimer <= 0) {
    player.attacking = true;
    player.atkTimer = player.atkCooldown;
    meleeHit(player, opp);
    // Also check demons
    for (const d of demonEntities) {
      if (d.alive) meleeHit(player, d);
    }
    setTimeout(() => { player.attacking = false; }, 250);
  }

  // Invincibility frames
  if (player.invincible > 0) player.invincible--;
  if (opp.invincible > 0) opp.invincible--;

  // AI
  updateOpponentAI();
  updateDemonAI();
  clampToArena(opp);

  // Kill check
  for (const d of demonEntities) {
    if (d.alive && d.hp <= 0) {
      d.alive = false;
      spawnParticle(d.x, d.y, d.glowColor);
    }
  }

  if (opp.hp <= 0) { endGame(true); return; }
  if (player.hp <= 0) { endGame(false); return; }

  // Particles
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  }
  particles.splice(0, particles.findIndex((p) => p.life > 0));

  // Draw
  drawArena();
  for (const d of demonEntities) drawDemon(d);
  drawEntity(player, 'YOU', true);
  drawEntity(opp, OPPONENT.name.split(' ')[0], false);
  drawParticles();
  drawJoystick();
  drawAttackButton();
  updateHUD();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
</script>
</body>
</html>`;
}
