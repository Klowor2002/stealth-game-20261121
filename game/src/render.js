// The renderer: one canvas, one logical 1280x720 field scaled to the window. It paints the
// archive floor, walls, crates and shadow patches, the guards with their vision cones
// (yellow calm, orange suspicious, red alerted), the courier, the intel and the exit, then
// the lighting (darkness with a pool of light around the courier) and the HUD and screens.

import { CRATES, EXIT, FIELD, FONT, INTEL, PALETTE, SHADOWS, WALLS } from './config.js';
import { GUARD } from './config.js';
import { STATE_ALERTED, STATE_SEARCH, STATE_SUSPICIOUS } from './guard.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const light = document.createElement('canvas');
  light.width = FIELD.width;
  light.height = FIELD.height;
  const lightCtx = light.getContext('2d');

  function fit() {
    const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
    canvas.width = Math.round(FIELD.width * scale);
    canvas.height = Math.round(FIELD.height * scale);
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
  }
  fit();
  window.addEventListener('resize', fit);

  function drawFloor() {
    for (let y = 0; y < FIELD.height; y += 40) {
      for (let x = 0; x < FIELD.width; x += 40) {
        ctx.fillStyle = ((x + y) / 40) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
        ctx.fillRect(x, y, 40, 40);
      }
    }
    ctx.strokeStyle = PALETTE.floorLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 40; x < FIELD.width; x += 40) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, FIELD.height);
    }
    for (let y = 40; y < FIELD.height; y += 40) {
      ctx.moveTo(0, y);
      ctx.lineTo(FIELD.width, y);
    }
    ctx.stroke();
  }

  function drawShadows() {
    for (const shadow of SHADOWS) {
      ctx.fillStyle = PALETTE.shadow;
      ctx.beginPath();
      ctx.ellipse(shadow.x + shadow.w / 2, shadow.y + shadow.h / 2, shadow.w / 2, shadow.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120, 160, 255, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function drawWalls() {
    for (const wall of WALLS) {
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.fillStyle = PALETTE.wallTop;
      ctx.fillRect(wall.x, wall.y, wall.w, 4);
      ctx.fillRect(wall.x, wall.y, 4, wall.h);
    }
  }

  function drawCrates() {
    for (const crate of CRATES) {
      ctx.fillStyle = PALETTE.crate;
      ctx.fillRect(crate.x, crate.y, crate.w, crate.h);
      ctx.strokeStyle = PALETTE.crateEdge;
      ctx.lineWidth = 2;
      ctx.strokeRect(crate.x + 1, crate.y + 1, crate.w - 2, crate.h - 2);
      ctx.beginPath();
      ctx.moveTo(crate.x, crate.y);
      ctx.lineTo(crate.x + crate.w, crate.y + crate.h);
      ctx.moveTo(crate.x + crate.w, crate.y);
      ctx.lineTo(crate.x, crate.y + crate.h);
      ctx.stroke();
    }
  }

  function drawIntel(state) {
    for (const file of state.intel) {
      if (file.taken) continue;
      const pulse = 0.6 + 0.4 * Math.sin(state.time * 4 + file.x);
      ctx.save();
      ctx.translate(file.x, file.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = PALETTE.intel;
      ctx.globalAlpha = 0.25 + 0.35 * pulse;
      ctx.fillRect(-14, -14, 28, 28);
      ctx.globalAlpha = 1;
      ctx.fillRect(-8, -8, 16, 16);
      ctx.restore();
      ctx.fillStyle = PALETTE.text;
      ctx.font = `bold 11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('INTEL', file.x, file.y - 20);
    }
  }

  function drawExit(state) {
    const open = state.intelTaken === INTEL.length;
    ctx.save();
    if (open) {
      ctx.fillStyle = PALETTE.exitGlow;
      ctx.fillRect(EXIT.x - 14, EXIT.y - 14, EXIT.w + 28, EXIT.h + 28);
    }
    ctx.fillStyle = open ? PALETTE.exit : '#2c6b46';
    ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
    ctx.strokeStyle = open ? '#b8ffd4' : '#5a8a70';
    ctx.lineWidth = 2;
    ctx.strokeRect(EXIT.x + 1, EXIT.y + 1, EXIT.w - 2, EXIT.h - 2);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2 + 5);
    ctx.font = `11px ${FONT}`;
    ctx.fillStyle = open ? PALETTE.exit : PALETTE.muted;
    ctx.fillText(open ? 'OPEN — GO!' : `${INTEL.length - state.intelTaken} intel left`, EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h + 18);
    ctx.restore();
  }

  function coneColour(guard) {
    if (guard.state === STATE_ALERTED) return PALETTE.coneAlert;
    if (guard.state === STATE_SUSPICIOUS || guard.state === STATE_SEARCH) return PALETTE.coneSuspicious;
    return PALETTE.coneCalm;
  }

  function drawGuard(guard) {
    // Vision cone: a wedge from the guard's facing, coloured by alert state.
    ctx.fillStyle = coneColour(guard);
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.arc(guard.x, guard.y, GUARD.sightRange, guard.facing - GUARD.halfAngle, guard.facing + GUARD.halfAngle);
    ctx.closePath();
    ctx.fill();
    // Body: a red disc with a facing tick, readable against the dark floor.
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.guardRing;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.facing) * (GUARD.radius + 8), guard.y + Math.sin(guard.facing) * (GUARD.radius + 8));
    ctx.stroke();
    // Detection meter arc over the guard while it is filling.
    if (guard.meter > 0.02) {
      ctx.strokeStyle = guard.meter >= 1 ? PALETTE.danger : PALETTE.gold;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, GUARD.radius + 7, -Math.PI / 2, -Math.PI / 2 + guard.meter * Math.PI * 2);
      ctx.stroke();
    }
    // Alerted guards shout a "!".
    if (guard.state === STATE_ALERTED) {
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 26px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - GUARD.radius - 12);
    }
    ctx.fillStyle = PALETTE.text;
    ctx.font = `11px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(guard.name, guard.x, guard.y + GUARD.radius + 14);
  }

  function drawPlayer(player) {
    if (player.invulnerableLeft > 0 && Math.floor(player.invulnerableLeft * 8) % 2 === 0) return;
    ctx.fillStyle = PALETTE.player;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.playerRing;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(player.facing) * 20, player.y + Math.sin(player.facing) * 20);
    ctx.stroke();
    if (player.sneaking) {
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `10px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('SNEAKING', player.x, player.y + 26);
    }
  }

  function drawLighting(state) {
    lightCtx.clearRect(0, 0, FIELD.width, FIELD.height);
    lightCtx.fillStyle = 'rgba(4, 6, 12, 0.45)';
    lightCtx.fillRect(0, 0, FIELD.width, FIELD.height);
    lightCtx.globalCompositeOperation = 'destination-out';
    const glow = lightCtx.createRadialGradient(state.player.x, state.player.y, 30, state.player.x, state.player.y, 260);
    glow.addColorStop(0, 'rgba(0,0,0,0.95)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    lightCtx.fillStyle = glow;
    lightCtx.beginPath();
    lightCtx.arc(state.player.x, state.player.y, 260, 0, Math.PI * 2);
    lightCtx.fill();
    for (const guard of state.guards) {
      const g = lightCtx.createRadialGradient(guard.x, guard.y, 10, guard.x, guard.y, 110);
      g.addColorStop(0, 'rgba(0,0,0,0.7)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      lightCtx.fillStyle = g;
      lightCtx.beginPath();
      lightCtx.arc(guard.x, guard.y, 110, 0, Math.PI * 2);
      lightCtx.fill();
    }
    lightCtx.globalCompositeOperation = 'source-over';
    ctx.drawImage(light, 0, 0);
  }

  function drawHud(state, best) {
    ctx.fillStyle = 'rgba(10, 13, 20, 0.82)';
    ctx.fillRect(0, 0, FIELD.width, 40);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 15px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('NIGHT ARCHIVE', 16, 26);
    ctx.font = `14px ${FONT}`;
    ctx.fillText(`INTEL ${state.intelTaken}/${INTEL.length}`, 220, 26);
    ctx.fillStyle = PALETTE.danger;
    ctx.fillText('♥'.repeat(Math.max(0, state.lives)) + '♡'.repeat(Math.max(0, 3 - state.lives)), 340, 26);
    ctx.fillStyle = PALETTE.text;
    const minutes = Math.floor(state.time / 60);
    const seconds = Math.floor(state.time % 60);
    ctx.fillText(`${minutes}:${String(seconds).padStart(2, '0')}`, 470, 26);
    ctx.fillText(`SCORE ${state.score}`, 560, 26);
    // The alert bar: the loudest guard's meter, the recovery chance made visible.
    const level = state.alertLevel;
    ctx.fillStyle = '#2a3040';
    ctx.fillRect(760, 14, 180, 12);
    ctx.fillStyle = level >= 1 ? PALETTE.danger : level >= 0.3 ? '#f28c3c' : PALETTE.gold;
    ctx.fillRect(760, 14, 180 * level, 12);
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(level >= 1 ? 'SPOTTED!' : level >= 0.3 ? 'SUSPICIOUS' : 'UNSEEN', 950, 26);
    ctx.fillStyle = PALETTE.muted;
    ctx.textAlign = 'right';
    ctx.fillText(`BEST ${best}`, FIELD.width - 16, 26);
    ctx.textAlign = 'left';
    // Caught flash: a red edge when a life is lost.
    if (state.caughtFlash > 0) {
      ctx.fillStyle = `rgba(229, 83, 75, ${state.caughtFlash * 0.5})`;
      ctx.fillRect(0, 0, FIELD.width, 8);
      ctx.fillRect(0, FIELD.height - 8, FIELD.width, 8);
      ctx.fillRect(0, 0, 8, FIELD.height);
      ctx.fillRect(FIELD.width - 8, 0, 8, FIELD.height);
    }
  }

  function drawPanel(title, lines, accent) {
    ctx.fillStyle = 'rgba(8, 10, 16, 0.78)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.panel;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    const w = 560;
    const h = 120 + lines.length * 30;
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.font = `bold 34px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(title, FIELD.width / 2, y + 58);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `16px ${FONT}`;
    lines.forEach((line, index) => {
      ctx.fillText(line, FIELD.width / 2, y + 100 + index * 30);
    });
  }

  function drawTitle(state) {
    drawPanel('NIGHT ARCHIVE', [
      'Slip through the guarded archive. Lift 3 intel files.',
      'Reach the green EXIT unseen — guards patrol with vision cones.',
      'WASD / arrows to move · Shift to sneak · P to pause',
      'Hide in shadows and behind crates — a filling meter can still drain.',
      'Press Space or click to begin the night shift.',
    ], PALETTE.gold);
  }

  function draw(state, screen, best) {
    const scale = canvas.width / FIELD.width;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    drawFloor();
    drawShadows();
    drawExit(state);
    drawIntel(state);
    drawCrates();
    drawWalls();
    for (const guard of state.guards) drawGuard(guard);
    drawPlayer(state.player);
    drawLighting(state);
    drawHud(state, best);
    if (screen === SCREEN_TITLE) drawTitle(state);
    else if (screen === SCREEN_PAUSED) {
      drawPanel('PAUSED', ['The archive waits. Press P or Space to keep sneaking.'], PALETTE.muted);
    } else if (screen === SCREEN_OVER) {
      drawPanel('CAUGHT', [`The guards found the courier. Score ${state.score}.`, 'Press Space or click to try again.'], PALETTE.danger);
    } else if (screen === SCREEN_WIN) {
      const minutes = Math.floor(state.time / 60);
      const seconds = Math.floor(state.time % 60);
      drawPanel('ESCAPED!', [
        `All 3 intel files lifted in ${minutes}:${String(seconds).padStart(2, '0')}. Score ${state.score}.`,
        'The archive never knew you were there. Press Space to play again.',
      ], PALETTE.exit);
    }
  }

  return { draw, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER, SCREEN_WIN };
}
