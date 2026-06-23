import type { CharacterDef, Fighter } from '../types';

export type StageId = 'favelas' | 'sakura' | 'death_pit' | 'neon_city' | 'void';

export interface Stage {
  id: StageId;
  name: string;
  location: string;
  description: string;
  icon: string;
  floorColor: string;
  skyTop: string;
  skyBottom: string;
}

export const STAGES: Stage[] = [
  {
    id: 'favelas',
    name: 'FAVELA CAGE',
    location: 'Rio de Janeiro, Brazil',
    description: 'A jungle cage buried in the hillside slums. The crowd is hostile. The floor is concrete.',
    icon: '🌴',
    floorColor: '#2d4a1e',
    skyTop: '#b5651d',
    skyBottom: '#8b4513',
  },
  {
    id: 'sakura',
    name: 'SAKURA GROUNDS',
    location: 'Kyoto, Japan',
    description: 'Ancient stone court beneath cherry blossoms. The mist hides your opponent until they strike.',
    icon: '🌸',
    floorColor: '#2e2a3a',
    skyTop: '#1a0a2e',
    skyBottom: '#3d1f5e',
  },
  {
    id: 'death_pit',
    name: 'THE DEATH PIT',
    location: 'Unknown',
    description: 'A narrow platform over a molten abyss. Fall and die. No second chances.',
    icon: '💀',
    floorColor: '#1a0000',
    skyTop: '#000000',
    skyBottom: '#1a0000',
  },
  {
    id: 'neon_city',
    name: 'NEON DISTRICT',
    location: 'Neo Tokyo, 2087',
    description: 'Rain-slicked rooftops under a thousand neon signs. The city watches.',
    icon: '🌆',
    floorColor: '#0a0a1a',
    skyTop: '#050510',
    skyBottom: '#0a0020',
  },
  {
    id: 'void',
    name: 'THE VOID',
    location: '???',
    description: 'No ground. No sky. Just pure darkness and two fighters who refuse to die.',
    icon: '🌀',
    floorColor: '#000000',
    skyTop: '#000000',
    skyBottom: '#000000',
  },
];

export function buildArenaHtml(
  playerFighter: Fighter,
  playerChar: CharacterDef,
  opponentFighter: Fighter,
  opponentChar: CharacterDef,
  stageId: StageId = 'favelas',
  multiplayerMode: boolean = false,
  playerRole: 'p1' | 'p2' = 'p1',
  matchId: string = ''
): string {
  // Apply body size stat multipliers
  const BODY_MULTS: Record<string, { health: number; attack: number; defense: number; speed: number }> = {
    runt:     { health: 0.75, attack: 0.9,  defense: 0.8,  speed: 1.3  },
    standard: { health: 1.0,  attack: 1.0,  defense: 1.0,  speed: 1.0  },
    brute:    { health: 1.4,  attack: 1.25, defense: 1.3,  speed: 0.7  },
  };
  function applySize(char: CharacterDef, fighter: Fighter): CharacterDef {
    const m = BODY_MULTS[fighter.bodySize ?? 'standard'];
    return {
      ...char,
      stats: {
        health:  Math.round(char.stats.health  * m.health),
        attack:  Math.round(char.stats.attack  * m.attack),
        defense: Math.round(char.stats.defense * m.defense),
        speed:   Math.round(char.stats.speed   * m.speed),
      },
    };
  }
  const scaledPlayerChar   = applySize(playerChar, playerFighter);
  const scaledOpponentChar = applySize(opponentChar, opponentFighter);

  const p   = JSON.stringify(scaledPlayerChar);
  const o   = JSON.stringify(scaledOpponentChar);
  const pf  = JSON.stringify(playerFighter);
  const of_ = JSON.stringify(opponentFighter);
  const sid = JSON.stringify(stageId);

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
const PLAYER_CHAR   = ${p};
const OPP_CHAR      = ${o};
const PLAYER_FIGHTER= ${pf};
const OPP_FIGHTER   = ${of_};
const STAGE_ID      = ${sid};
const MULTIPLAYER   = ${multiplayerMode};
const PLAYER_ROLE   = '${playerRole}';
const MATCH_ID      = '${matchId}';

const c   = document.getElementById('c');
const ctx = c.getContext('2d');
const W   = c.width  = window.innerWidth;
const H   = c.height = window.innerHeight;

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const GROUND        = H - 110;
const GRAVITY       = 0.65;
const JUMP_VY       = -17;
const PUSH_DISTANCE = 54;
const ROUNDS_TO_WIN = 2;
const ROUND_TIME    = 99;
const COMBO_WINDOW  = 90;
const SUPER_CHARGE_MAX = 1000;

// ─── FIGHTER FACTORY ──────────────────────────────────────────────────────────
function makeFighter(charDef, fighterData, side) {
  return {
    char: charDef,
    name: fighterData.name,
    level: fighterData.level,
    wins: fighterData.wins,
    x: side === 'left' ? W * 0.25 : W * 0.75,
    y: GROUND,
    vy: 0,
    facing: side === 'left' ? 1 : -1,
    grounded: true,
    state: 'idle',
    stateFrame: 0,
    hp: charDef.stats.health,
    maxHp: charDef.stats.health,
    shield: 80,
    maxShield: 80,
    shieldRegen: 0,
    superMeter: 0,
    maxSuper: SUPER_CHARGE_MAX,
    moves: {
      light:   { frames:[4,4,8],   dmg:charDef.stats.attack*0.35, pushback:8,  hitstun:12, range:80,  type:'normal' },
      heavy:   { frames:[8,5,18],  dmg:charDef.stats.attack*0.65, pushback:18, hitstun:22, range:90,  type:'hard'   },
      kick:    { frames:[6,5,12],  dmg:charDef.stats.attack*0.50, pushback:12, hitstun:16, range:100, type:'normal' },
      special: { frames:[12,8,20], dmg:charDef.stats.attack*0.90, pushback:30, hitstun:28, range:0,   type:'special'},
      super:   { frames:[20,10,30],dmg:charDef.stats.attack*1.8,  pushback:60, hitstun:50, range:120, type:'super'  },
    },
    currentMove: null,
    hitstun: 0,
    blockstun: 0,
    knockdown: 0,
    crouching: false,
    blocking: false,
    comboCount: 0,
    comboTimer: 0,
    invincible: 0,
    side,
    specialActive: false,
    specialX: 0,
    specialY: 0,
    specialVX: 0,
    specialVY: 0,
    superActive: false,
    superFrame: 0,
    jumpCount: 0,
    buffAtk: 0,
    buffSpd: 0,
    buffShield: 0,
    // Anime-style rendering
    limbAnim: 0,
    attackTrail: [],
    afterImages: [],
    glowPulse: 0,
  };
}

// ─── GAME STATE ───────────────────────────────────────────────────────────────
let player = makeFighter(PLAYER_CHAR, PLAYER_FIGHTER, 'left');
let opp    = makeFighter(OPP_CHAR,    OPP_FIGHTER,    'right');
let round = 1, playerRoundsWon = 0, oppRoundsWon = 0;
let roundTimer = ROUND_TIME, roundFrame = 0, roundTimerFrame = 0;
let gamePhase = 'intro';
let announceText = '', announceSubText = '';
let announceFrame = 0, introFrame = 0;
let screenShake = 0;
let screenFlash = 0, screenFlashColor = '#fff';
let particles = [], hitSparks = [], fallingPetals = [];
let artifacts = [];
let artifactSpawnTimer = 360;
let superCutsceneFrame = 0;
let superCutsceneActive = false;
let superCutsceneFighter = null;
let energyRings = [];
let slashTrails = [];

// ─── STAGE CONFIG ─────────────────────────────────────────────────────────────
const STAGE_CONFIGS = {
  favelas: {
    skyTop: '#d4500a', skyBottom: '#8b3a1a',
    groundColor: '#3d2b1f', groundLine: '#5a3f2a',
    ambientGlow: '#ff6600',
  },
  sakura: {
    skyTop: '#0d0820', skyBottom: '#2a1040',
    groundColor: '#1a1525', groundLine: '#6e3d8e',
    ambientGlow: '#ff69b4',
  },
  death_pit: {
    skyTop: '#000000', skyBottom: '#1a0000',
    groundColor: '#1a0000', groundLine: '#ff2200',
    ambientGlow: '#ff2200',
  },
  neon_city: {
    skyTop: '#020208', skyBottom: '#050515',
    groundColor: '#0a0a1a', groundLine: '#00ffff',
    ambientGlow: '#ff00aa',
  },
  void: {
    skyTop: '#000000', skyBottom: '#000000',
    groundColor: '#050505', groundLine: '#3a0a3a',
    ambientGlow: '#8800ff',
  },
};
const STAGE = STAGE_CONFIGS[STAGE_ID] || STAGE_CONFIGS.favelas;

// ─── ARTIFACT TYPES ───────────────────────────────────────────────────────────
const ARTIFACT_TYPES = [
  { id: 'heal',   label: '💊', color: '#2ecc71', glow: '#00ff88', effect: 'Heal +40 HP',    size: 16 },
  { id: 'shield', label: '🛡', color: '#4a9eff', glow: '#00aaff', effect: 'Shield Boost',   size: 14 },
  { id: 'power',  label: '⚡', color: '#e8c84a', glow: '#ffdd00', effect: '+50% ATK (5s)',  size: 15 },
  { id: 'speed',  label: '💨', color: '#ce93d8', glow: '#ee00ff', effect: '+40% SPD (5s)',  size: 14 },
  { id: 'super',  label: '🔥', color: '#ff4400', glow: '#ff8800', effect: '+SUPER METER',   size: 15 },
];

function spawnArtifact() {
  const type = ARTIFACT_TYPES[Math.floor(Math.random() * ARTIFACT_TYPES.length)];
  artifacts.push({
    ...type,
    x: 80 + Math.random() * (W - 160),
    y: -30,
    vy: 1.5 + Math.random() * 1.5,
    landed: false,
    life: 300,
    bobOffset: 0,
    bobDir: 1,
  });
}

function applyArtifact(fighter, artifact) {
  if (artifact.id === 'heal') {
    fighter.hp = Math.min(fighter.maxHp, fighter.hp + 40);
    spawnParticles(fighter.x, fighter.y - 60, '#2ecc71', 14);
  } else if (artifact.id === 'shield') {
    fighter.shield = Math.min(fighter.maxShield, fighter.shield + 50);
    spawnParticles(fighter.x, fighter.y - 60, '#4a9eff', 14);
  } else if (artifact.id === 'power') {
    fighter.buffAtk = 300;
    spawnParticles(fighter.x, fighter.y - 60, '#e8c84a', 14);
  } else if (artifact.id === 'speed') {
    fighter.buffSpd = 300;
    spawnParticles(fighter.x, fighter.y - 60, '#ce93d8', 14);
  } else if (artifact.id === 'super') {
    fighter.superMeter = Math.min(fighter.maxSuper, fighter.superMeter + 400);
    spawnParticles(fighter.x, fighter.y - 60, '#ff4400', 20);
  }
  spawnSpark(fighter.x, fighter.y - 80, artifact.glow);
}

// ─── CONTROLS ─────────────────────────────────────────────────────────────────
const dpad = { left:false, right:false, up:false, down:false };
const btns = { light:false, heavy:false, kick:false, special:false, super:false };
let dpadTouchId = null, dpadOrigin = { x:0, y:0 };
const BTN_TOUCH_IDS = {};
const DPAD_ZONE_X = W * 0.45;
const BTN_RADIUS  = 32;
const BTN_POSITIONS = [
  { key:'light',   x:W-190, y:H-155, color:'#4fc3f7', label:'L'  },
  { key:'heavy',   x:W-95,  y:H-195, color:'#e53935', label:'H'  },
  { key:'kick',    x:W-95,  y:H-115, color:'#ff9800', label:'K'  },
  { key:'special', x:W-190, y:H-75,  color:'#ce93d8', label:'SP' },
  { key:'super',   x:W-285, y:H-115, color:'#ff4400', label:'↑↑' },
];
const inputQueue = [];

function getDpadDir(tx,ty) {
  const dx=tx-dpadOrigin.x, dy=ty-dpadOrigin.y, d=Math.hypot(dx,dy);
  if(d<10) return {left:false,right:false,up:false,down:false};
  const a=Math.atan2(dy,dx)*180/Math.PI;
  return {right:a>-67.5&&a<67.5, left:a>112.5||a<-112.5, up:a>-157.5&&a<-22.5, down:a>22.5&&a<157.5};
}

c.addEventListener('touchstart',e=>{
  for(const t of e.changedTouches){
    if(t.clientX<DPAD_ZONE_X&&!dpadTouchId){
      dpadTouchId=t.identifier; dpadOrigin={x:t.clientX,y:t.clientY};
      Object.assign(dpad,getDpadDir(t.clientX,t.clientY));
    } else if(t.clientX>=DPAD_ZONE_X){
      for(const btn of BTN_POSITIONS){
        if(Math.hypot(t.clientX-btn.x,t.clientY-btn.y)<BTN_RADIUS+14){
          BTN_TOUCH_IDS[t.identifier]=btn.key; btns[btn.key]=true;
          inputQueue.push({key:btn.key,frame:roundFrame});
        }
      }
    }
  }
},{passive:true});
c.addEventListener('touchmove',e=>{
  for(const t of e.changedTouches)
    if(t.identifier===dpadTouchId) Object.assign(dpad,getDpadDir(t.clientX,t.clientY));
},{passive:true});
c.addEventListener('touchend',e=>{
  for(const t of e.changedTouches){
    if(t.identifier===dpadTouchId){dpadTouchId=null;dpad.left=dpad.right=dpad.up=dpad.down=false;}
    if(BTN_TOUCH_IDS[t.identifier]){btns[BTN_TOUCH_IDS[t.identifier]]=false;delete BTN_TOUCH_IDS[t.identifier];}
  }
},{passive:true});
c.addEventListener('touchcancel',e=>{
  for(const t of e.changedTouches){
    if(t.identifier===dpadTouchId){dpadTouchId=null;dpad.left=dpad.right=dpad.up=dpad.down=false;}
    if(BTN_TOUCH_IDS[t.identifier]){btns[BTN_TOUCH_IDS[t.identifier]]=false;delete BTN_TOUCH_IDS[t.identifier];}
  }
},{passive:true});

function consumeInput(key){
  const idx=inputQueue.findIndex(i=>i.key===key&&roundFrame-i.frame<8);
  if(idx!==-1){inputQueue.splice(idx,1);return true;}return false;
}

// ─── PHYSICS ──────────────────────────────────────────────────────────────────
function updateMovement(f, isPlayer) {
  if(f.hitstun>0||f.blockstun>0||f.knockdown>0||f.currentMove) return;
  const enemy = isPlayer ? opp : player;
  f.facing = f.x < enemy.x ? 1 : -1;
  f.crouching = isPlayer ? (dpad.down && f.grounded) : false;
  const holdBack = isPlayer ? (f.facing===1?dpad.left:dpad.right) : false;
  f.blocking = holdBack && f.grounded && !f.crouching;
  const spd = (f.char.stats.speed / 25) * (f.buffSpd>0 ? 1.4 : 1);
  if(isPlayer){
    if(dpad.left)  f.x-=spd;
    if(dpad.right) f.x+=spd;
    if(dpad.up && f.grounded && f.jumpCount===0){
      f.vy=JUMP_VY; f.grounded=false; f.jumpCount=1;
      f.state='jump'; f.crouching=false; f.blocking=false;
    }
  }
  f.x=Math.max(40,Math.min(W-40,f.x));
}

function updatePhysics(f) {
  if(!f.grounded){ f.vy+=GRAVITY; f.y+=f.vy; }
  if(f.y>=GROUND){ f.y=GROUND; f.vy=0; f.grounded=true; f.jumpCount=0; if(f.state==='jump')f.state='idle'; }
  if(STAGE_ID==='death_pit' && f.y > H + 20){ f.hp=0; }
  const dx=opp.x-player.x;
  if(Math.abs(dx)<PUSH_DISTANCE&&player.grounded&&opp.grounded){
    const push=(PUSH_DISTANCE-Math.abs(dx))/2, dir=dx>0?-1:1;
    player.x+=dir*push; opp.x-=dir*push;
    player.x=Math.max(40,Math.min(W-40,player.x));
    opp.x=Math.max(40,Math.min(W-40,opp.x));
  }
}

function tickTimers(f){
  if(f.hitstun>0)   f.hitstun--;
  if(f.blockstun>0) f.blockstun--;
  if(f.invincible>0)f.invincible--;
  if(f.knockdown>0) f.knockdown--;
  if(f.comboTimer>0)f.comboTimer--;
  else if(f.comboTimer===0&&f.comboCount>0) f.comboCount=0;
  if(f.buffAtk>0)   f.buffAtk--;
  if(f.buffSpd>0)   f.buffSpd--;
  f.glowPulse=(f.glowPulse+0.08)%(Math.PI*2);
  if(f.shieldRegen>0){ f.shieldRegen--; } else {
    f.shield=Math.min(f.maxShield,f.shield+0.08);
  }
  if(f.currentMove){
    f.stateFrame++;
    const move=f.moves[f.currentMove];
    const total=move.frames[0]+move.frames[1]+move.frames[2];
    if(f.stateFrame>=total){f.currentMove=null;f.stateFrame=0;f.state='idle';}
  }
  if(f.specialActive){
    f.specialX+=f.specialVX; f.specialY+=f.specialVY;
    f.specialVY+=0.3;
    if(f.specialX<-50||f.specialX>W+50||f.specialY>H) f.specialActive=false;
  }
  // after-image trail when moving fast or in super
  if(f.buffSpd>0||(f.currentMove==='super'&&f.stateFrame<30)){
    f.afterImages.push({x:f.x,y:f.y,facing:f.facing,alpha:0.5,color:f.char.primaryColor});
  }
  if(f.afterImages.length>8) f.afterImages.shift();
  f.afterImages.forEach(a=>{a.alpha-=0.06;});
  f.afterImages=f.afterImages.filter(a=>a.alpha>0);
  // limb animation
  f.limbAnim+=0.12;
}

// ─── ATTACK ───────────────────────────────────────────────────────────────────
function tryAttack(f,moveKey,enemy){
  if(f.currentMove||f.hitstun>0||f.blockstun>0||f.knockdown>0) return;
  if(moveKey==='super' && f.superMeter<f.maxSuper) return;
  if(!consumeInput(moveKey)) return;
  f.currentMove=moveKey; f.stateFrame=0; f.state=moveKey; f.crouching=false;
  if(moveKey==='special') triggerSpecial(f,enemy);
  if(moveKey==='super') triggerSuper(f,enemy);
  // build super meter on attack
  if(moveKey!=='super') f.superMeter=Math.min(f.maxSuper,f.superMeter+60);
}

function triggerSpecial(f,enemy){
  if(f.char.archetype==='zoner'||f.char.id==='apex'){
    f.specialActive=true; f.specialX=f.x+f.facing*40; f.specialY=f.y-55; f.specialVX=f.facing*14; f.specialVY=-2;
  } else if(f.char.archetype==='assassin'||f.char.id==='ghost'){
    f.invincible=15;
    setTimeout(()=>{f.x=Math.max(40,Math.min(W-40,f.x+f.facing*180));screenShake=6;spawnParticles(f.x,f.y-60,f.char.glowColor,20);},80);
  } else if(f.char.archetype==='tank'||f.char.id==='titan'){
    f.invincible=30;
    spawnEnergyRing(f.x,f.y-60,f.char.glowColor,100);
  } else if(f.char.archetype==='rushdown'){
    f.invincible=10;
    setTimeout(()=>{f.x=Math.max(40,Math.min(W-40,enemy.x-f.facing*50));screenShake=8;checkHit(f,enemy,f.moves.special);},60);
  } else {
    f.specialActive=true; f.specialX=f.x+f.facing*40; f.specialY=f.y-55; f.specialVX=f.facing*12; f.specialVY=0;
  }
}

function triggerSuper(f,enemy){
  f.superMeter=0;
  f.invincible=60;
  superCutsceneActive=true;
  superCutsceneFrame=0;
  superCutsceneFighter=f;
  screenFlash=20; screenFlashColor=f.char.glowColor;
  screenShake=20;
  spawnEnergyRing(f.x,f.y-60,f.char.glowColor,200);
  // deal damage mid-super
  setTimeout(()=>{
    checkHit(f,enemy,f.moves.super);
    spawnParticles(f.x,f.y-60,f.char.accentColor,40);
    spawnParticles(enemy.x,enemy.y-80,f.char.glowColor,30);
    screenShake=15;
  },400);
  setTimeout(()=>{superCutsceneActive=false;},900);
}

function spawnEnergyRing(x,y,color,radius){
  energyRings.push({x,y,color,radius:10,maxRadius:radius,alpha:1});
}

function checkHit(attacker,defender,move){
  if(defender.invincible>0) return;
  const dx=Math.abs(attacker.x-defender.x);
  const range=move.range||90;
  if(dx>range&&!attacker.specialActive) return;
  if(attacker.specialActive){
    if(Math.abs(attacker.specialX-defender.x)>40) return;
    attacker.specialActive=false;
  }
  const atkMult = attacker.buffAtk>0 ? 1.5 : 1;
  let dmg = move.dmg * atkMult * (1 - defender.char.stats.defense/300);
  if(defender.blocking&&defender.grounded){
    dmg*=0.15; defender.blockstun=move.hitstun;
    spawnSpark(defender.x,defender.y-80,'#4fc3f7');
    spawnSlashTrail(attacker.x,attacker.y-60,defender.x,defender.y-60,'#4fc3f7');
    return;
  }
  if(defender.shield>0){
    const absorbed=Math.min(defender.shield,dmg*0.6);
    defender.shield=Math.max(0,defender.shield-absorbed);
    dmg-=absorbed;
    defender.shieldRegen=180;
  }
  defender.hp=Math.max(0,defender.hp-dmg);
  defender.hitstun=move.hitstun;
  defender.x+=-attacker.facing*move.pushback;
  defender.x=Math.max(40,Math.min(W-40,defender.x));
  if(attacker.comboTimer>0) attacker.comboCount++;
  else attacker.comboCount=1;
  attacker.comboTimer=COMBO_WINDOW;
  // build super on hit
  attacker.superMeter=Math.min(attacker.maxSuper,attacker.superMeter+40);
  defender.superMeter=Math.min(defender.maxSuper,defender.superMeter+20);
  screenShake=move.pushback>20?10:4;
  spawnSpark(defender.x,defender.y-80,attacker.char.accentColor);
  spawnParticles(defender.x,defender.y-80,attacker.char.accentColor,8);
  spawnSlashTrail(attacker.x,attacker.y-55,defender.x,defender.y-55,attacker.char.glowColor);
  if(move.type==='hard'||move.type==='super'){
    if(defender.hp>0){defender.vy=-8;defender.grounded=false;defender.knockdown=40;}
    if(move.type==='super'){
      screenFlash=12; screenFlashColor=attacker.char.glowColor;
      spawnEnergyRing(defender.x,defender.y-60,attacker.char.accentColor,120);
    }
  }
}

function spawnSlashTrail(x1,y1,x2,y2,color){
  slashTrails.push({x1,y1,x2,y2,color,life:12,maxLife:12});
}

function resolveAttacks(){
  for(const key of ['super','special','light','heavy','kick'])
    if(inputQueue.find(i=>i.key===key)) tryAttack(player,key,opp);
  if(player.currentMove){
    const move=player.moves[player.currentMove];
    const as=move.frames[0], ae=as+move.frames[1];
    if(player.stateFrame>=as&&player.stateFrame<ae) checkHit(player,opp,move);
  }
  if(player.specialActive&&Math.abs(player.specialX-opp.x)<40) checkHit(player,opp,player.moves.special);
  if(opp.specialActive&&Math.abs(opp.specialX-player.x)<40) checkHit(opp,player,opp.moves.special);
}

// ─── AI ───────────────────────────────────────────────────────────────────────
let aiTimer=0, aiInputTimer=0;
function updateAI(){
  if(opp.hitstun>0||opp.blockstun>0||opp.knockdown>0||opp.currentMove) return;
  aiTimer--; aiInputTimer--;
  const dx=player.x-opp.x, dist=Math.abs(dx);
  const spd=(opp.char.stats.speed/30)*(opp.buffSpd>0?1.4:1);
  if(dist>100) opp.x+=Math.sign(dx)*spd;
  opp.atkTimer=(opp.atkTimer||0)-1;
  if(dist<110&&aiInputTimer<=0){
    const useSuperChance = opp.superMeter>=opp.maxSuper ? 0.3 : 0;
    const roll=Math.random();
    let move='light';
    if(roll<useSuperChance) move='super';
    else if(roll<useSuperChance+0.2) move='special';
    else if(roll<useSuperChance+0.45) move='light';
    else if(roll<useSuperChance+0.65) move='heavy';
    else move='kick';
    inputQueue.push({key:move,frame:roundFrame,forAI:true});
    tryAttack(opp,move,player);
    if(opp.currentMove){
      const m=opp.moves[opp.currentMove];
      if(dist<(m.range||90)) checkHit(opp,player,m);
    }
    aiInputTimer=28+Math.floor(Math.random()*28);
  }
  for(const art of artifacts){
    if(!art.landed) continue;
    const adx=Math.abs(opp.x-art.x);
    if(adx<200&&opp.hp<opp.maxHp*0.5&&Math.random()<0.02) opp.x+=Math.sign(art.x-opp.x)*spd;
    if(adx<30){applyArtifact(opp,art);art.life=0;}
  }
  if(Math.random()<0.002&&opp.grounded){opp.vy=JUMP_VY*0.85;opp.grounded=false;opp.state='jump';}
  opp.x=Math.max(40,Math.min(W-40,opp.x));
  if(opp.specialActive){
    opp.specialX+=opp.specialVX; opp.specialY+=opp.specialVY; opp.specialVY+=0.3;
    if(opp.specialX<-50||opp.specialX>W+50||opp.specialY>H) opp.specialActive=false;
  }
}

// ─── ARTIFACTS ────────────────────────────────────────────────────────────────
function updateArtifacts(){
  artifactSpawnTimer--;
  if(artifactSpawnTimer<=0){
    spawnArtifact();
    artifactSpawnTimer=400+Math.floor(Math.random()*300);
  }
  for(const art of artifacts){
    if(!art.landed){
      art.y+=art.vy; art.vy+=0.04;
      if(art.y>=GROUND-art.size){art.y=GROUND-art.size;art.landed=true;}
    } else {
      art.life--;
      art.bobOffset+=0.05*art.bobDir;
      if(Math.abs(art.bobOffset)>4) art.bobDir*=-1;
      if(Math.abs(player.x-art.x)<36&&Math.abs((player.y-50)-(art.y))<40){
        applyArtifact(player,art); art.life=0;
      }
    }
  }
  artifacts=artifacts.filter(a=>a.life>0);
}

// ─── PARTICLES ────────────────────────────────────────────────────────────────
function spawnParticles(x,y,color,count){
  for(let i=0;i<count;i++){
    const a=(Math.PI*2*i)/count+Math.random()*0.5,s=2+Math.random()*5;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2,life:22+Math.floor(Math.random()*18),maxLife:40,color,size:3+Math.random()*5});
  }
}
function spawnSpark(x,y,color){
  for(let i=0;i<16;i++){
    const a=Math.random()*Math.PI*2,s=3+Math.random()*7;
    hitSparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:12,color});
  }
}
function updateParticles(){
  for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.vy+=0.2;p.life--;}
  particles=particles.filter(p=>p.life>0);
  for(const s of hitSparks){s.x+=s.vx;s.y+=s.vy;s.vx*=0.9;s.vy*=0.9;s.life--;}
  hitSparks=hitSparks.filter(s=>s.life>0);
  for(const r of energyRings){r.radius+=12;r.alpha-=0.05;}
  energyRings=energyRings.filter(r=>r.alpha>0);
  for(const s of slashTrails){s.life--;}
  slashTrails=slashTrails.filter(s=>s.life>0);
}

// ─── STAGE BACKGROUNDS ────────────────────────────────────────────────────────
function drawFavelas(){
  const sky=ctx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,'#d4500a'); sky.addColorStop(0.5,'#8b3a1a'); sky.addColorStop(1,'#3d1a0a');
  ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
  const colors=['#c0392b','#e67e22','#2980b9','#16a085','#8e44ad','#d4ac0d'];
  const buildings=[[0,H-300,55,300],[55,H-260,45,260],[100,H-340,60,340],[160,H-280,50,280],[210,H-360,65,360],[275,H-300,55,300],[330,H-240,45,240],[W-380,H-260,55,260],[W-325,H-320,60,320],[W-265,H-280,50,280],[W-215,H-350,65,350],[W-150,H-300,55,300],[W-95,H-260,95,260]];
  for(let i=0;i<buildings.length;i++){
    const [x,y,w,h]=buildings[i]; ctx.fillStyle=colors[i%colors.length]; ctx.fillRect(x,y,w,h);
    ctx.fillStyle='#ffffff18';
    for(let wx=x+5;wx<x+w-8;wx+=12) for(let wy=y+8;wy<y+h-8;wy+=16) ctx.fillRect(wx,wy,7,8);
  }
  ctx.strokeStyle='#2d5a1b'; ctx.lineWidth=3;
  for(let x=0;x<W;x+=60){const hang=40+Math.sin(x*0.05)*20;ctx.beginPath();ctx.moveTo(x,0);ctx.quadraticCurveTo(x+15,hang/2,x,hang);ctx.stroke();}
  ctx.strokeStyle='#88888888'; ctx.lineWidth=2;
  for(let x=0;x<W;x+=18){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  const ground=ctx.createLinearGradient(0,GROUND,0,H);
  ground.addColorStop(0,'#4a3728'); ground.addColorStop(1,'#1e1209');
  ctx.fillStyle=ground; ctx.fillRect(0,GROUND,W,H-GROUND);
  ctx.strokeStyle='#6b5040'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,GROUND); ctx.lineTo(W,GROUND); ctx.stroke();
}

function drawSakura(){
  const sky=ctx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,'#080515'); sky.addColorStop(0.6,'#1e0a35'); sky.addColorStop(1,'#2a1040');
  ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
  ctx.shadowColor='#ffe4f0'; ctx.shadowBlur=40; ctx.fillStyle='#fff0f8';
  ctx.beginPath(); ctx.arc(W*0.75,80,45,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
  for(let i=0;i<4;i++){
    const mg=ctx.createLinearGradient(0,GROUND-120+i*30,0,GROUND-60+i*30);
    mg.addColorStop(0,'#ffffff00'); mg.addColorStop(0.5,'#ffffff08'); mg.addColorStop(1,'#ffffff00');
    ctx.fillStyle=mg; ctx.fillRect(0,GROUND-120+i*30,W,60);
  }
  function drawTree(tx,ty,side){
    ctx.strokeStyle='#4a2810'; ctx.lineWidth=12;
    ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(tx+(side*20),ty-180); ctx.stroke();
    ctx.lineWidth=7;
    ctx.beginPath(); ctx.moveTo(tx+(side*20),ty-180); ctx.lineTo(tx+(side*80),ty-260); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx+(side*20),ty-180); ctx.lineTo(tx+(side*30),ty-270); ctx.stroke();
    const clusters=[[tx+(side*60),ty-280,70],[tx+(side*30),ty-260,60],[tx+(side*90),ty-250,55],[tx+(side*50),ty-230,50]];
    for(const [bx,by,br] of clusters){
      ctx.shadowColor='#ff69b4'; ctx.shadowBlur=20; ctx.fillStyle='#ffb7d5cc';
      ctx.beginPath(); ctx.arc(bx,by,br,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ff8fba99'; ctx.beginPath(); ctx.arc(bx-20,by+10,br*0.7,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    }
  }
  drawTree(0,GROUND,1); drawTree(W,GROUND,-1);
  if(fallingPetals.length<40) fallingPetals.push({x:Math.random()*W,y:-10,vy:0.5+Math.random()*1,vx:(Math.random()-0.5)*1.5,rot:Math.random()*Math.PI*2,rotV:(Math.random()-0.5)*0.1,life:999});
  const ground=ctx.createLinearGradient(0,GROUND,0,H);
  ground.addColorStop(0,'#1e1825'); ground.addColorStop(1,'#0d0b14');
  ctx.fillStyle=ground; ctx.fillRect(0,GROUND,W,H-GROUND);
  ctx.strokeStyle='#6e3d8e44'; ctx.lineWidth=1;
  for(let x=0;x<W;x+=60){ctx.beginPath();ctx.moveTo(x,GROUND);ctx.lineTo(x,H);ctx.stroke();}
  ctx.strokeStyle='#9b59b6'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,GROUND); ctx.lineTo(W,GROUND); ctx.stroke();
  ctx.shadowColor='#ff6699'; ctx.shadowBlur=20; ctx.fillStyle='#ff3366';
  ctx.fillRect(W*0.25-8,GROUND-84,16,28); ctx.fillRect(W*0.75-8,GROUND-84,16,28);
  ctx.shadowBlur=0;
}

function drawDeathPit(){
  ctx.fillStyle='#000000'; ctx.fillRect(0,0,W,H);
  const lavaGlow=ctx.createRadialGradient(W/2,H,10,W/2,H,H*0.6);
  lavaGlow.addColorStop(0,'#ff3300aa'); lavaGlow.addColorStop(0.5,'#ff110044'); lavaGlow.addColorStop(1,'#00000000');
  ctx.fillStyle=lavaGlow; ctx.fillRect(0,0,W,H);
  const lavaY=GROUND+20;
  const lava=ctx.createLinearGradient(0,lavaY,0,H);
  lava.addColorStop(0,'#ff4500'); lava.addColorStop(0.3,'#cc2200'); lava.addColorStop(1,'#330000');
  ctx.fillStyle=lava; ctx.fillRect(0,lavaY,W,H-lavaY);
  ctx.strokeStyle='#ff8800'; ctx.lineWidth=2;
  for(let x=0;x<W;x+=40){const bh=Math.sin(roundFrame*0.05+x*0.1)*8;ctx.beginPath();ctx.arc(x,lavaY+10+bh,12,Math.PI,0);ctx.stroke();}
  if(Math.random()<0.3){particles.push({x:Math.random()*W,y:H,vx:(Math.random()-0.5)*1,vy:-(0.5+Math.random()*2),life:80+Math.floor(Math.random()*80),maxLife:160,color:Math.random()<0.5?'#ff4500':'#ff8800',size:2+Math.random()*3});}
  ctx.fillStyle='#1a0800'; ctx.fillRect(0,GROUND,W,20);
  ctx.strokeStyle='#ff2200'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(0,GROUND); ctx.lineTo(W,GROUND); ctx.stroke();
}

function drawNeonCity(){
  ctx.fillStyle='#020208'; ctx.fillRect(0,0,W,H);
  // Rain
  ctx.strokeStyle='#ffffff18'; ctx.lineWidth=1;
  for(let i=0;i<60;i++){
    const rx=(roundFrame*2+i*37)%W;
    const ry=(roundFrame*3+i*53)%H;
    ctx.beginPath(); ctx.moveTo(rx,ry); ctx.lineTo(rx-2,ry+12); ctx.stroke();
  }
  // Neon signs on buildings
  const signs=[
    {x:0,w:80,h:H-80,color:'#ff00aa'},
    {x:90,w:60,h:H-140,color:'#00ffff'},
    {x:160,w:90,h:H-60,color:'#ff6600'},
    {x:260,w:70,h:H-110,color:'#ff00ff'},
    {x:W-340,w:80,h:H-90,color:'#00ff88'},
    {x:W-250,w:60,h:H-130,color:'#ff0044'},
    {x:W-180,w:90,h:H-70,color:'#4400ff'},
    {x:W-80,w:80,h:H-100,color:'#ffcc00'},
  ];
  for(const s of signs){
    ctx.fillStyle='#0a0a14'; ctx.fillRect(s.x,s.h,s.w,H-s.h);
    ctx.shadowColor=s.color; ctx.shadowBlur=20;
    // neon window lights
    for(let wy=s.h+10;wy<H-20;wy+=18){
      for(let wx=s.x+5;wx<s.x+s.w-8;wx+=12){
        if(Math.random()<0.6){ctx.fillStyle=s.color+'88';ctx.fillRect(wx,wy,8,10);}
      }
    }
    // vertical neon strips
    ctx.strokeStyle=s.color; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(s.x+s.w-2,s.h); ctx.lineTo(s.x+s.w-2,H); ctx.stroke();
    ctx.shadowBlur=0;
  }
  // Wet ground reflection
  const gnd=ctx.createLinearGradient(0,GROUND,0,H);
  gnd.addColorStop(0,'#0a0a18'); gnd.addColorStop(1,'#020208');
  ctx.fillStyle=gnd; ctx.fillRect(0,GROUND,W,H-GROUND);
  ctx.shadowColor='#00ffff'; ctx.shadowBlur=8;
  ctx.strokeStyle='#00ffff88'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,GROUND); ctx.lineTo(W,GROUND); ctx.stroke();
  ctx.shadowBlur=0;
}

function drawVoid(){
  ctx.fillStyle='#000000'; ctx.fillRect(0,0,W,H);
  // Floating rune circles
  const t=roundFrame*0.005;
  for(let i=0;i<3;i++){
    const rx=W/2+Math.cos(t+i*2.09)*W*0.35, ry=H/2+Math.sin(t*0.7+i*2.09)*H*0.2;
    ctx.strokeStyle='#3a0a3a'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(rx,ry,40+i*20,0,Math.PI*2); ctx.stroke();
  }
  // Ground line — barely visible
  ctx.fillStyle='#080808'; ctx.fillRect(0,GROUND,W,H-GROUND);
  ctx.shadowColor='#8800ff'; ctx.shadowBlur=15;
  ctx.strokeStyle='#3a0a3a'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(0,GROUND); ctx.lineTo(W,GROUND); ctx.stroke();
  ctx.shadowBlur=0;
}

// ─── ANIME-STYLE FIGHTER RENDERER ─────────────────────────────────────────────
function drawFighter(f){
  // After-images (speed / super)
  for(const img of f.afterImages){
    ctx.save(); ctx.globalAlpha=img.alpha*0.4;
    ctx.translate(img.x,img.y);
    if(img.facing===-1) ctx.scale(-1,1);
    ctx.strokeStyle=img.color; ctx.lineWidth=5; ctx.lineCap='round';
    ctx.shadowColor=img.color; ctx.shadowBlur=10;
    // simple silhouette
    ctx.beginPath(); ctx.moveTo(0,-18); ctx.lineTo(0,-58); ctx.stroke();
    ctx.beginPath(); ctx.arc(0,-68,12,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  ctx.save();
  const flash=f.hitstun>0&&Math.floor(f.hitstun/3)%2===0;
  const alpha=(f.knockdown>0&&Math.floor(f.knockdown/5)%2===0)?0.3:1;
  ctx.globalAlpha=alpha;
  ctx.translate(f.x,f.y);
  if(f.facing===-1) ctx.scale(-1,1);

  const crouchOffset=f.crouching?18:0;
  const inAttack=!!f.currentMove;
  const move=inAttack?f.moves[f.currentMove]:null;
  const activeStart=move?move.frames[0]:0;
  const isActive=move&&f.stateFrame>=activeStart&&f.stateFrame<activeStart+move.frames[1];
  const isSuper=f.currentMove==='super';
  const glow=Math.sin(f.glowPulse)*0.5+0.5;

  // Shadow
  ctx.fillStyle='#00000066';
  ctx.beginPath(); ctx.ellipse(0,2,24,6,0,0,Math.PI*2); ctx.fill();

  // Super aura — large spinning ring
  if(f.superMeter>=f.maxSuper){
    ctx.strokeStyle=f.char.accentColor+'88'; ctx.lineWidth=3;
    ctx.shadowColor=f.char.glowColor; ctx.shadowBlur=25;
    const spinAngle=roundFrame*0.08;
    for(let i=0;i<3;i++){
      ctx.beginPath(); ctx.arc(0,-55-crouchOffset,40+i*6,spinAngle+i*1.05,(spinAngle+i*1.05)+Math.PI*1.2); ctx.stroke();
    }
  }

  // Power/speed buff aura
  if(f.buffAtk>0){
    ctx.strokeStyle=f.char.accentColor+(Math.floor(glow*88+68)).toString(16); ctx.lineWidth=3;
    ctx.shadowColor=f.char.glowColor; ctx.shadowBlur=20+glow*10;
    ctx.beginPath(); ctx.arc(0,-50-crouchOffset,36,0,Math.PI*2); ctx.stroke();
  }
  if(f.buffSpd>0){
    ctx.strokeStyle='#ce93d888'; ctx.lineWidth=2; ctx.shadowColor='#ee00ff'; ctx.shadowBlur=15;
    ctx.beginPath(); ctx.arc(0,-50-crouchOffset,30,0,Math.PI*2); ctx.stroke();
  }

  ctx.shadowColor=f.char.glowColor; ctx.shadowBlur=flash?30:(isActive?20:12);
  const mainColor=flash?'#ffffff':f.char.primaryColor;
  const accentC=flash?'#ffffff':f.char.accentColor;

  // ─ LEGS ─
  ctx.strokeStyle=mainColor; ctx.lineWidth=7; ctx.lineCap='round';
  if(f.crouching){
    ctx.beginPath();ctx.moveTo(-10,-18);ctx.lineTo(-22,0);ctx.stroke();
    ctx.beginPath();ctx.moveTo(8,-18);ctx.lineTo(18,0);ctx.stroke();
  } else if(!f.grounded){
    // airborne — legs tuck up
    ctx.beginPath();ctx.moveTo(-8,-20);ctx.lineTo(-14,-48);ctx.stroke();
    ctx.beginPath();ctx.moveTo(8,-20);ctx.lineTo(16,-44);ctx.stroke();
  } else if(f.blocking){
    ctx.beginPath();ctx.moveTo(-10,-18);ctx.lineTo(-8,0);ctx.stroke();
    ctx.beginPath();ctx.moveTo(8,-18);ctx.lineTo(6,0);ctx.stroke();
  } else if(inAttack&&f.currentMove==='kick'){
    ctx.beginPath();ctx.moveTo(-10,-20);ctx.lineTo(-8,0);ctx.stroke();
    ctx.beginPath();ctx.moveTo(8,-20);ctx.lineTo(36+(isActive?16:0),-14);ctx.stroke();
    // kick glow
    if(isActive){ctx.shadowBlur=20;ctx.strokeStyle=accentC;ctx.beginPath();ctx.moveTo(32,-14);ctx.lineTo(48,-10);ctx.stroke();}
  } else if(isSuper&&isActive){
    // super — legs wide power stance
    ctx.beginPath();ctx.moveTo(-10,-20);ctx.lineTo(-22,0);ctx.stroke();
    ctx.beginPath();ctx.moveTo(8,-20);ctx.lineTo(20,0);ctx.stroke();
  } else {
    const bob=Math.sin(f.limbAnim)*2.5;
    ctx.beginPath();ctx.moveTo(-10,-18+bob);ctx.lineTo(-12,0);ctx.stroke();
    ctx.beginPath();ctx.moveTo(8,-18-bob);ctx.lineTo(10,0);ctx.stroke();
  }

  // ─ TORSO ─
  ctx.strokeStyle=accentC; ctx.lineWidth=10;
  ctx.shadowColor=f.char.glowColor; ctx.shadowBlur=flash?25:10;
  ctx.beginPath(); ctx.moveTo(0,-18-crouchOffset); ctx.lineTo(0,-58-crouchOffset); ctx.stroke();

  // ─ ARMS ─
  ctx.strokeStyle=mainColor; ctx.lineWidth=6;
  if(f.blocking){
    // crossed arms guard
    ctx.beginPath();ctx.moveTo(0,-52-crouchOffset);ctx.lineTo(26,-34-crouchOffset);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-46-crouchOffset);ctx.lineTo(26,-54-crouchOffset);ctx.stroke();
    ctx.shadowColor='#4fc3f7'; ctx.shadowBlur=10;
    ctx.fillStyle='#4fc3f744'; ctx.beginPath(); ctx.arc(22,-44-crouchOffset,14,0,Math.PI*2); ctx.fill();
  } else if(inAttack&&f.currentMove==='light'){
    const ext=isActive?14:0;
    ctx.beginPath();ctx.moveTo(0,-52-crouchOffset);ctx.lineTo(40+ext,-44-crouchOffset);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-46-crouchOffset);ctx.lineTo(-14,-52-crouchOffset);ctx.stroke();
    if(isActive){ctx.shadowBlur=20;ctx.strokeStyle=accentC;ctx.beginPath();ctx.moveTo(36,-44-crouchOffset);ctx.lineTo(52,-42-crouchOffset);ctx.stroke();}
  } else if(inAttack&&f.currentMove==='heavy'){
    const ext=isActive?18:0;
    ctx.beginPath();ctx.moveTo(0,-52-crouchOffset);ctx.lineTo(46+ext,-36-crouchOffset);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-46-crouchOffset);ctx.lineTo(-12,-38-crouchOffset);ctx.stroke();
    if(isActive){ctx.shadowColor=f.char.glowColor;ctx.shadowBlur=28;ctx.fillStyle=accentC+'88';ctx.beginPath();ctx.arc(44+ext,-36-crouchOffset,12,0,Math.PI*2);ctx.fill();}
  } else if(inAttack&&f.currentMove==='special'&&isActive){
    ctx.strokeStyle=accentC; ctx.lineWidth=7;
    ctx.beginPath();ctx.moveTo(0,-52-crouchOffset);ctx.lineTo(56,-46-crouchOffset);ctx.stroke();
    ctx.shadowColor=f.char.glowColor; ctx.shadowBlur=35;
    ctx.fillStyle=f.char.glowColor+'cc';
    ctx.beginPath();ctx.arc(56,-46-crouchOffset,14,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath();ctx.arc(56,-46-crouchOffset,6,0,Math.PI*2);ctx.fill();
  } else if(isSuper){
    const t2=f.stateFrame/f.moves.super.frames[0];
    const ext=isActive?Math.sin(t2*Math.PI)*80:0;
    ctx.strokeStyle=accentC; ctx.lineWidth=8;
    ctx.shadowColor=f.char.glowColor; ctx.shadowBlur=30;
    ctx.beginPath();ctx.moveTo(0,-52-crouchOffset);ctx.lineTo(50+ext,-40-crouchOffset);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-46-crouchOffset);ctx.lineTo(-20,-40-crouchOffset);ctx.stroke();
    if(isActive){
      ctx.fillStyle=f.char.glowColor;
      ctx.beginPath();ctx.arc(50+ext,-40-crouchOffset,18,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff'; ctx.beginPath();ctx.arc(50+ext,-40-crouchOffset,8,0,Math.PI*2);ctx.fill();
    }
  } else {
    const swing=Math.sin(f.limbAnim)*7;
    ctx.beginPath();ctx.moveTo(0,-52-crouchOffset);ctx.lineTo(18+swing,-40-crouchOffset);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-46-crouchOffset);ctx.lineTo(-16-swing,-40-crouchOffset);ctx.stroke();
  }

  // ─ HEAD ─
  ctx.shadowColor=f.char.glowColor; ctx.shadowBlur=flash?22:(12+glow*8);
  ctx.fillStyle=mainColor;
  const headY=-70-crouchOffset;
  ctx.beginPath(); ctx.arc(0,headY,14,0,Math.PI*2); ctx.fill();
  // face glint
  ctx.fillStyle=accentC;
  ctx.beginPath(); ctx.arc(5,headY-2,5,0,Math.PI*2); ctx.fill();
  // angry eyes during attack
  if(inAttack&&isActive){
    ctx.fillStyle='#fff'; ctx.fillRect(-4,headY-6,4,3); ctx.fillRect(4,headY-6,4,3);
  }
  // hair spikes (anime style)
  ctx.fillStyle=mainColor;
  ctx.shadowBlur=8;
  for(let i=0;i<5;i++){
    const sx=(-10+i*5), syBase=headY-13;
    const h2=10+Math.sin(i*1.3)*6;
    ctx.beginPath(); ctx.moveTo(sx-3,syBase); ctx.lineTo(sx,syBase-h2); ctx.lineTo(sx+3,syBase); ctx.closePath(); ctx.fill();
  }

  ctx.restore();
}

function drawProjectile(f){
  if(!f.specialActive) return;
  ctx.save();
  ctx.shadowColor=f.char.glowColor; ctx.shadowBlur=28;
  // energy ball with spiral
  ctx.fillStyle=f.char.accentColor;
  ctx.beginPath(); ctx.arc(f.specialX,f.specialY,14,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#fff'; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.arc(f.specialX,f.specialY,14,0,Math.PI*2); ctx.stroke();
  // core
  ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.arc(f.specialX,f.specialY,6,0,Math.PI*2); ctx.fill();
  // trailing sparks
  for(let i=0;i<4;i++){
    const angle=roundFrame*0.3+i*1.57;
    ctx.fillStyle=f.char.glowColor+'88';
    ctx.beginPath(); ctx.arc(f.specialX+Math.cos(angle)*18,f.specialY+Math.sin(angle)*18,4,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

// ─── DRAW EFFECTS ─────────────────────────────────────────────────────────────
function drawEnergyRings(){
  for(const r of energyRings){
    ctx.globalAlpha=r.alpha;
    ctx.strokeStyle=r.color; ctx.shadowColor=r.color; ctx.shadowBlur=20;
    ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(r.x,r.y,r.radius,0,Math.PI*2); ctx.stroke();
    ctx.shadowBlur=0; ctx.globalAlpha=1;
  }
}

function drawSlashTrails(){
  for(const s of slashTrails){
    ctx.globalAlpha=(s.life/s.maxLife)*0.8;
    ctx.strokeStyle=s.color; ctx.shadowColor=s.color; ctx.shadowBlur=12;
    ctx.lineWidth=4+((s.maxLife-s.life)/s.maxLife)*6;
    ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(s.x1,s.y1); ctx.lineTo(s.x2,s.y2); ctx.stroke();
    ctx.shadowBlur=0; ctx.globalAlpha=1;
  }
}

function drawArtifacts(){
  for(const art of artifacts){
    ctx.save();
    const pulse=Math.sin(roundFrame*0.1)*0.2+0.8;
    ctx.globalAlpha=art.landed?(art.life<60?art.life/60:1)*pulse:1;
    ctx.shadowColor=art.glow; ctx.shadowBlur=20;
    if(!art.landed){ctx.strokeStyle=art.glow+'44';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(art.x,art.y-20);ctx.lineTo(art.x,art.y+10);ctx.stroke();}
    ctx.strokeStyle=art.glow; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(art.x,art.y+art.bobOffset,art.size+6,0,Math.PI*2); ctx.stroke();
    ctx.font=\`\${art.size*1.6}px sans-serif\`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(art.label,art.x,art.y+art.bobOffset);
    if(art.landed){ctx.fillStyle='#ffffffcc';ctx.font='10px sans-serif';ctx.fillText(art.effect,art.x,art.y+art.bobOffset-art.size-12);}
    ctx.restore();
  }
}

function drawParticles(){
  for(const p of particles){ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=8;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}
  for(const s of hitSparks){ctx.globalAlpha=s.life/12;ctx.strokeStyle=s.color;ctx.lineWidth=2;ctx.shadowColor=s.color;ctx.shadowBlur=6;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x+s.vx*3,s.y+s.vy*3);ctx.stroke();}
  ctx.globalAlpha=1; ctx.shadowBlur=0;
}

function drawPetals(){
  for(const p of fallingPetals){
    p.x+=p.vx; p.y+=p.vy; p.rot+=p.rotV;
    if(p.y>H+20){p.y=-10;p.x=Math.random()*W;}
    ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot);
    ctx.fillStyle='#ff8fbba0'; ctx.shadowColor='#ff69b4'; ctx.shadowBlur=4;
    ctx.beginPath(); ctx.ellipse(0,0,5,3,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  ctx.shadowBlur=0;
}

// ─── SUPER CUTSCENE ───────────────────────────────────────────────────────────
function drawSuperCutscene(){
  if(!superCutsceneActive||!superCutsceneFighter) return;
  superCutsceneFrame++;
  const f=superCutsceneFighter;
  const prog=superCutsceneFrame/60;

  // Black bars cinematic
  const barH=H*0.12*(1-Math.max(0,(prog-0.7)/0.3));
  ctx.fillStyle='#000'; ctx.fillRect(0,0,W,barH); ctx.fillRect(0,H-barH,W,barH);

  // Name flash
  if(prog<0.5){
    ctx.globalAlpha=1-prog*2;
    ctx.fillStyle=f.char.glowColor; ctx.font='bold 36px sans-serif'; ctx.textAlign='center';
    ctx.shadowColor=f.char.glowColor; ctx.shadowBlur=40;
    ctx.fillText(f.char.superName||'SUPER MOVE',W/2,H*0.35);
    ctx.shadowBlur=0; ctx.globalAlpha=1;
  }
}

// ─── HUD ──────────────────────────────────────────────────────────────────────
function drawHUD(){
  const BAR_W=W*0.35, BAR_H=14, SHIELD_H=5, SUPER_H=5, BAR_Y=24, BAR_PAD=14;

  // Player HP
  const pPct=Math.max(0,player.hp/player.maxHp);
  ctx.fillStyle='#1a1a2e'; ctx.fillRect(BAR_PAD,BAR_Y,BAR_W,BAR_H);
  const pHpColor=pPct>0.5?'#2ecc71':pPct>0.25?'#f39c12':'#e74c3c';
  ctx.fillStyle=pHpColor; ctx.fillRect(BAR_PAD,BAR_Y,BAR_W*pPct,BAR_H);
  ctx.strokeStyle='#ffffff22'; ctx.lineWidth=1; ctx.strokeRect(BAR_PAD,BAR_Y,BAR_W,BAR_H);

  // Player Shield
  const pShield=player.shield/player.maxShield;
  ctx.fillStyle='#0a1a2e'; ctx.fillRect(BAR_PAD,BAR_Y+BAR_H+2,BAR_W,SHIELD_H);
  ctx.fillStyle='#4a9eff'; ctx.fillRect(BAR_PAD,BAR_Y+BAR_H+2,BAR_W*pShield,SHIELD_H);

  // Player Super Meter
  const pSuper=player.superMeter/player.maxSuper;
  ctx.fillStyle='#1a0a00'; ctx.fillRect(BAR_PAD,BAR_Y+BAR_H+SHIELD_H+4,BAR_W,SUPER_H);
  const superGrad=ctx.createLinearGradient(BAR_PAD,0,BAR_PAD+BAR_W,0);
  superGrad.addColorStop(0,'#ff4400'); superGrad.addColorStop(1,'#ffcc00');
  ctx.fillStyle=superGrad;
  if(pSuper>=1){ctx.shadowColor='#ffcc00'; ctx.shadowBlur=8;}
  ctx.fillRect(BAR_PAD,BAR_Y+BAR_H+SHIELD_H+4,BAR_W*pSuper,SUPER_H);
  ctx.shadowBlur=0;

  // Opponent HP
  const oPct=Math.max(0,opp.hp/opp.maxHp);
  const oBarX=W-BAR_PAD-BAR_W;
  ctx.fillStyle='#1a1a2e'; ctx.fillRect(oBarX,BAR_Y,BAR_W,BAR_H);
  ctx.fillStyle=oPct>0.5?'#e74c3c':oPct>0.25?'#f39c12':'#888';
  ctx.fillRect(oBarX+BAR_W*(1-oPct),BAR_Y,BAR_W*oPct,BAR_H);
  ctx.strokeStyle='#ffffff22'; ctx.strokeRect(oBarX,BAR_Y,BAR_W,BAR_H);

  // Opponent Shield
  const oShield=opp.shield/opp.maxShield;
  ctx.fillStyle='#0a1a2e'; ctx.fillRect(oBarX,BAR_Y+BAR_H+2,BAR_W,SHIELD_H);
  ctx.fillStyle='#4a9eff'; ctx.fillRect(oBarX+BAR_W*(1-oShield),BAR_Y+BAR_H+2,BAR_W*oShield,SHIELD_H);

  // Opponent Super
  const oSuper=opp.superMeter/opp.maxSuper;
  ctx.fillStyle='#1a0a00'; ctx.fillRect(oBarX,BAR_Y+BAR_H+SHIELD_H+4,BAR_W,SUPER_H);
  ctx.fillStyle=superGrad;
  ctx.fillRect(oBarX+BAR_W*(1-oSuper),BAR_Y+BAR_H+SHIELD_H+4,BAR_W*oSuper,SUPER_H);

  // Names
  ctx.fillStyle='#fff'; ctx.font='bold 11px sans-serif';
  ctx.textAlign='left'; ctx.fillText(player.name.toUpperCase(),BAR_PAD,BAR_Y-4);
  ctx.fillStyle=PLAYER_CHAR.primaryColor; ctx.font='bold 10px sans-serif';
  ctx.fillText(PLAYER_CHAR.name+'  LV'+player.level,BAR_PAD,BAR_Y+BAR_H+SHIELD_H+SUPER_H+10);

  ctx.fillStyle='#fff'; ctx.font='bold 11px sans-serif';
  ctx.textAlign='right'; ctx.fillText(opp.name.toUpperCase(),W-BAR_PAD,BAR_Y-4);
  ctx.fillStyle=OPP_CHAR.primaryColor; ctx.font='bold 10px sans-serif';
  ctx.fillText('LV'+opp.level+'  '+OPP_CHAR.name,W-BAR_PAD,BAR_Y+BAR_H+SHIELD_H+SUPER_H+10);

  // Round pips
  const pipY=BAR_Y+BAR_H+SHIELD_H+4;
  for(let i=0;i<ROUNDS_TO_WIN;i++){
    ctx.fillStyle=i<playerRoundsWon?'#e8c84a':'#333';
    ctx.beginPath();ctx.arc(W/2-24+i*-20,pipY,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=i<oppRoundsWon?'#e74c3c':'#333';
    ctx.beginPath();ctx.arc(W/2+24+i*20,pipY,5,0,Math.PI*2);ctx.fill();
  }

  // Timer
  ctx.fillStyle=roundTimer<=10?'#e74c3c':'#fff';
  ctx.font='bold 24px monospace'; ctx.textAlign='center';
  ctx.fillText(String(Math.ceil(roundTimer)).padStart(2,'0'),W/2,BAR_Y+BAR_H-1);

  // Combo
  if(player.comboCount>=2){
    ctx.fillStyle=player.char.accentColor; ctx.font='bold 28px sans-serif'; ctx.textAlign='left';
    ctx.shadowColor=player.char.glowColor; ctx.shadowBlur=18;
    ctx.fillText(player.comboCount+' HIT',20,H-190); ctx.shadowBlur=0;
  }
  if(opp.comboCount>=2){
    ctx.fillStyle=opp.char.accentColor; ctx.font='bold 28px sans-serif'; ctx.textAlign='right';
    ctx.shadowColor=opp.char.glowColor; ctx.shadowBlur=18;
    ctx.fillText(opp.comboCount+' HIT',W-20,H-190); ctx.shadowBlur=0;
  }

  // Super ready indicator
  if(player.superMeter>=player.maxSuper){
    ctx.fillStyle='#ffcc00'; ctx.font='bold 11px sans-serif'; ctx.textAlign='left';
    ctx.shadowColor='#ffcc00'; ctx.shadowBlur=10;
    ctx.fillText('↑↑ SUPER READY',BAR_PAD,H-200); ctx.shadowBlur=0;
  }

  // Buff icons
  let buffY=H-200;
  if(player.buffAtk>0){ctx.fillStyle='#e8c84a';ctx.font='bold 10px sans-serif';ctx.textAlign='left';ctx.fillText('⚡ POWER',BAR_PAD,buffY+=14);}
  if(player.buffSpd>0){ctx.fillStyle='#ce93d8';ctx.font='bold 10px sans-serif';ctx.textAlign='left';ctx.fillText('💨 SPEED',BAR_PAD,buffY+=14);}
}

function drawControls(){
  ctx.globalAlpha=0.18; ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.arc(70,H-100,60,0,Math.PI*2); ctx.fill();
  if(dpadTouchId!==null){
    ctx.globalAlpha=0.4; ctx.strokeStyle='#fff'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(dpadOrigin.x,dpadOrigin.y,50,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle='#fff'; ctx.globalAlpha=0.6;
    ctx.beginPath(); ctx.arc(dpadOrigin.x+(dpad.right?28:dpad.left?-28:0),dpadOrigin.y+(dpad.down?28:dpad.up?-28:0),12,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;
  for(const btn of BTN_POSITIONS){
    const pressed=btns[btn.key];
    const isSuperBtn=btn.key==='super';
    const superReady=player.superMeter>=player.maxSuper;
    const effectiveColor=isSuperBtn?(superReady?'#ffcc00':'#333'):btn.color;
    ctx.globalAlpha=pressed?0.95:(isSuperBtn&&superReady)?0.7:0.38;
    ctx.fillStyle=effectiveColor; ctx.shadowColor=effectiveColor; ctx.shadowBlur=pressed?22:isSuperBtn&&superReady?15:6;
    ctx.beginPath(); ctx.arc(btn.x,btn.y,BTN_RADIUS,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0; ctx.globalAlpha=1;
    ctx.fillStyle=isSuperBtn&&superReady?'#000':'#fff'; ctx.font='bold 12px sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(btn.label,btn.x,btn.y); ctx.textBaseline='alphabetic';
  }
}

// ─── INTRO SCREEN ─────────────────────────────────────────────────────────────
function drawIntro(){
  ctx.fillStyle='rgba(0,0,0,0.88)'; ctx.fillRect(0,0,W,H);
  const progress=Math.min(1,introFrame/60);
  ctx.globalAlpha=progress;
  const stageNames={favelas:'🌴 FAVELA CAGE',sakura:'🌸 SAKURA GROUNDS',death_pit:'💀 THE DEATH PIT',neon_city:'🌆 NEON DISTRICT',void:'🌀 THE VOID'};
  ctx.fillStyle='#e8c84a'; ctx.font='bold 15px sans-serif'; ctx.textAlign='center';
  ctx.fillText(stageNames[STAGE_ID]||'ARENA',W/2,38);
  ctx.fillStyle='#e8c84a'; ctx.font='bold 42px sans-serif';
  ctx.shadowColor='#e8c84a'; ctx.shadowBlur=30; ctx.fillText('VS',W/2,H/2); ctx.shadowBlur=0;
  const lpx=W*0.22, lpy=H/2;
  ctx.textAlign='center';
  ctx.fillStyle=PLAYER_CHAR.primaryColor; ctx.font='bold 44px sans-serif'; ctx.fillText(PLAYER_CHAR.icon,lpx,lpy-90);
  ctx.fillStyle='#fff'; ctx.font='bold 16px sans-serif'; ctx.fillText(PLAYER_FIGHTER.name.toUpperCase(),lpx,lpy-50);
  ctx.fillStyle=PLAYER_CHAR.accentColor; ctx.font='bold 12px sans-serif'; ctx.fillText(PLAYER_CHAR.name,lpx,lpy-32);
  ctx.fillStyle='#888'; ctx.font='11px sans-serif';
  ctx.fillText('LVL '+PLAYER_FIGHTER.level,lpx,lpy-14);
  ctx.fillStyle='#e8c84a'; ctx.font='bold 10px sans-serif'; ctx.fillText('✦ '+PLAYER_CHAR.specialName,lpx,lpy+4);
  ctx.fillStyle='#ff4400'; ctx.fillText('★ '+PLAYER_CHAR.superName,lpx,lpy+20);
  const rpx=W*0.78;
  ctx.fillStyle=OPP_CHAR.primaryColor; ctx.font='bold 44px sans-serif'; ctx.fillText(OPP_CHAR.icon,rpx,lpy-90);
  ctx.fillStyle='#fff'; ctx.font='bold 16px sans-serif'; ctx.fillText(OPP_FIGHTER.name.toUpperCase(),rpx,lpy-50);
  ctx.fillStyle=OPP_CHAR.accentColor; ctx.font='bold 12px sans-serif'; ctx.fillText(OPP_CHAR.name,rpx,lpy-32);
  ctx.fillStyle='#888'; ctx.font='11px sans-serif'; ctx.fillText('LVL '+OPP_FIGHTER.level,rpx,lpy-14);
  ctx.fillStyle='#e8c84a'; ctx.font='bold 10px sans-serif'; ctx.fillText('✦ '+OPP_CHAR.specialName,rpx,lpy+4);
  ctx.fillStyle='#ff4400'; ctx.fillText('★ '+OPP_CHAR.superName,rpx,lpy+20);
  if(introFrame>110){
    const countdown=Math.max(0,3-Math.floor((introFrame-110)/60));
    if(countdown>0){
      ctx.fillStyle='#e8c84a'; ctx.font='bold 60px sans-serif';
      ctx.shadowColor='#e8c84a'; ctx.shadowBlur=40; ctx.fillText(countdown,W/2,H*0.78); ctx.shadowBlur=0;
    } else {
      ctx.fillStyle='#fff'; ctx.font='bold 46px sans-serif';
      ctx.shadowColor='#fff'; ctx.shadowBlur=28; ctx.fillText('FIGHT!',W/2,H*0.78); ctx.shadowBlur=0;
      if(introFrame>300) gamePhase='fight';
    }
  }
  ctx.globalAlpha=1;
}

function drawAnnounce(){
  if(gamePhase!=='roundover'&&gamePhase!=='gameover') return;
  ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H);
  const scale=Math.min(1,announceFrame/12);
  ctx.save(); ctx.translate(W/2,H/2-20); ctx.scale(scale,scale);
  ctx.textAlign='center'; ctx.shadowColor='#e8c84a'; ctx.shadowBlur=30;
  ctx.fillStyle='#e8c84a'; ctx.font='bold 52px sans-serif'; ctx.fillText(announceText,0,0);
  if(announceSubText){ctx.shadowColor='#fff';ctx.fillStyle='#fff';ctx.font='bold 18px sans-serif';ctx.fillText(announceSubText,0,44);}
  ctx.restore(); ctx.shadowBlur=0;
}

// ─── SCREEN FLASH ─────────────────────────────────────────────────────────────
function drawScreenFlash(){
  if(screenFlash<=0) return;
  ctx.globalAlpha=screenFlash/20*0.6;
  ctx.fillStyle=screenFlashColor;
  ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=1;
  screenFlash--;
}

// ─── ROUND MANAGEMENT ─────────────────────────────────────────────────────────
function resetFighters(){
  function reset(f,side){
    f.x=side==='left'?W*0.25:W*0.75; f.y=GROUND; f.vy=0; f.grounded=true;
    f.hp=f.maxHp; f.shield=f.maxShield;
    f.hitstun=0;f.blockstun=0;f.knockdown=0;f.currentMove=null;f.stateFrame=0;
    f.comboCount=0;f.comboTimer=0;f.specialActive=false;f.state='idle';
    f.buffAtk=0;f.buffSpd=0;f.afterImages=[];f.attackTrail=[];
  }
  reset(player,'left'); reset(opp,'right');
  artifacts=[]; artifactSpawnTimer=360;
  roundTimer=ROUND_TIME; roundTimerFrame=0; inputQueue.length=0;
  particles=[]; hitSparks=[]; energyRings=[]; slashTrails=[];
}

function endRound(playerWonRound){
  gamePhase='roundover';
  if(playerWonRound){playerRoundsWon++;announceText='K.O.';announceSubText=player.name.toUpperCase()+' WINS ROUND '+round;}
  else{oppRoundsWon++;announceText='K.O.';announceSubText=opp.name.toUpperCase()+' WINS ROUND '+round;}
  announceFrame=0;
  setTimeout(()=>{
    if(playerRoundsWon>=ROUNDS_TO_WIN||oppRoundsWon>=ROUNDS_TO_WIN){endMatch(playerRoundsWon>=ROUNDS_TO_WIN);}
    else{round++;resetFighters();gamePhase='fight';}
  },2200);
}

function endMatch(playerWon){
  gamePhase='gameover';
  announceText=playerWon?'YOU WIN!':'DEFEATED';
  const currency=playerWon?100+Math.floor(Math.random()*80):20+Math.floor(Math.random()*20);
  const xp=playerWon?150:40;
  announceSubText='+'+currency+' gold  •  +'+xp+' XP';
  announceFrame=0;
  setTimeout(()=>{
    if(window.ReactNativeWebView){
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'BATTLE_RESULT',won:playerWon,currencyEarned:currency,xpEarned:xp,roundsWon:playerRoundsWon}));
    }
  },2800);
}

// ─── MAIN LOOP ────────────────────────────────────────────────────────────────
function loop(){
  roundFrame++;

  let sx=0,sy=0;
  if(screenShake>0){sx=(Math.random()-0.5)*screenShake*2;sy=(Math.random()-0.5)*screenShake*2;screenShake=Math.max(0,screenShake-1);}
  ctx.save(); ctx.translate(sx,sy);

  // Draw stage
  if(STAGE_ID==='favelas') drawFavelas();
  else if(STAGE_ID==='sakura') drawSakura();
  else if(STAGE_ID==='death_pit') drawDeathPit();
  else if(STAGE_ID==='neon_city') drawNeonCity();
  else drawVoid();

  if(STAGE_ID==='sakura') drawPetals();

  if(gamePhase==='intro'){
    introFrame++;
    drawFighter(player); drawFighter(opp);
    drawIntro();
    ctx.restore(); requestAnimationFrame(loop); return;
  }

  if(gamePhase==='roundover'||gamePhase==='gameover'){
    announceFrame++;
    drawArtifacts(); drawFighter(player); drawFighter(opp); drawParticles(); drawHUD(); drawAnnounce();
    ctx.restore(); requestAnimationFrame(loop); return;
  }

  // FIGHT phase
  roundTimerFrame++;
  if(roundTimerFrame%60===0){roundTimer=Math.max(0,roundTimer-1);if(roundTimer===0){endRound(player.hp>=opp.hp);ctx.restore();return;}}

  tickTimers(player); tickTimers(opp);
  updateMovement(player,true);
  if(!MULTIPLAYER) updateAI();
  updatePhysics(player); updatePhysics(opp);
  resolveAttacks();
  updateArtifacts();
  updateParticles();

  if(player.hp<=0){endRound(false);ctx.restore();return;}
  if(opp.hp<=0){endRound(true);ctx.restore();return;}

  // Draw order
  drawArtifacts();
  drawSlashTrails();
  drawEnergyRings();
  drawProjectile(player); drawProjectile(opp);
  drawFighter(opp); drawFighter(player);
  drawParticles();
  drawScreenFlash();
  drawSuperCutscene();
  drawHUD();
  drawControls();
  ctx.restore();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
</script>
</body>
</html>`;
}
