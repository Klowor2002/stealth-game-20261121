// The world: the archive's walls, crates, shadows, intel and exit, the courier and the
// guards, and the one fixed-step update that moves them all. The world owns the rules:
// line of sight, the detection meter's recovery, intel pickups, the exit, and being caught.

import { CRATES, EXIT, FIELD, GUARD_DEFS, INTEL, LIVES, PLAYER, SHADOWS, START, WALLS } from './config.js';
import { createGuard, updateGuard, STATE_ALERTED } from './guard.js';
import { createPlayer, resetPlayer, updatePlayer } from './player.js';

export const EVENT_NONE = 0;
export const EVENT_PICKUP = 1;
export const EVENT_CAUGHT = 2;
export const EVENT_WIN = 4;
export const EVENT_OVER = 8;
export const EVENT_ALERT = 16;

function circleHitsRect(x, y, r, rect) {
  const cx = Math.min(rect.x + rect.w, Math.max(rect.x, x));
  const cy = Math.min(rect.y + rect.h, Math.max(rect.y, y));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy < r * r;
}

function segmentsCross(x1, y1, x2, y2, x3, y3, x4, y4) {
  const d1 = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
  const d2 = (x2 - x1) * (y4 - y1) - (y2 - y1) * (x4 - x1);
  const d3 = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
  const d4 = (x4 - x3) * (y2 - y3) - (y4 - y3) * (x2 - x3);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Inside the rectangle already counts as blocked.
  if (x1 >= rect.x && x1 <= rect.x + rect.w && y1 >= rect.y && y1 <= rect.y + rect.h) return true;
  if (x2 >= rect.x && x2 <= rect.x + rect.w && y2 >= rect.y && y2 <= rect.y + rect.h) return true;
  const { x, y, w, h } = rect;
  return (
    segmentsCross(x1, y1, x2, y2, x, y, x + w, y) ||
    segmentsCross(x1, y1, x2, y2, x + w, y, x + w, y + h) ||
    segmentsCross(x1, y1, x2, y2, x + w, y + h, x, y + h) ||
    segmentsCross(x1, y1, x2, y2, x, y + h, x, y)
  );
}

export function createWorld(random) {
  const state = {
    player: createPlayer(),
    guards: GUARD_DEFS.map((def) => createGuard(def)),
    intel: INTEL.map((spot) => ({ ...spot, taken: false })),
    intelTaken: 0,
    lives: LIVES,
    time: 0,
    score: 0,
    won: false,
    over: false,
    alertLevel: 0,
    caughtFlash: 0,
  };
  resetWorld(state, random);
  return { state, random, reset: () => resetWorld(state, random) };
}

function resetWorld(state, random) {
  resetPlayer(state.player, START);
  state.guards = GUARD_DEFS.map((def) => createGuard(def));
  state.intel = INTEL.map((spot) => ({ ...spot, taken: false }));
  state.intelTaken = 0;
  state.lives = LIVES;
  state.time = 0;
  state.score = 0;
  state.won = false;
  state.over = false;
  state.alertLevel = 0;
  state.caughtFlash = 0;
  void random;
}

/** True when a straight line between two points crosses no wall or crate. */
export function canSeeThrough(x1, y1, x2, y2) {
  for (const wall of WALLS) if (segmentHitsRect(x1, y1, x2, y2, wall)) return false;
  for (const crate of CRATES) if (segmentHitsRect(x1, y1, x2, y2, crate)) return false;
  return true;
}

/** True when a point stands inside one of the archive's shadow patches. */
export function inShadow(x, y) {
  for (const shadow of SHADOWS) {
    if (x >= shadow.x && x <= shadow.x + shadow.w && y >= shadow.y && y <= shadow.y + shadow.h) return true;
  }
  return false;
}

/**
 * Slide a circle (the courier or a guard) by (dx, dy), axis by axis so it slides along
 * walls instead of snagging, and clamp it inside the field. `radius` is the circle's own.
 */
export function moveCircle(body, dx, dy, radius) {
  const tryX = body.x + dx;
  if (!hitsSolid(tryX, body.y, radius)) body.x = tryX;
  const tryY = body.y + dy;
  if (!hitsSolid(body.x, tryY, radius)) body.y = tryY;
  body.x = Math.min(FIELD.width - radius, Math.max(radius, body.x));
  body.y = Math.min(FIELD.height - radius, Math.max(radius, body.y));
}

function hitsSolid(x, y, radius) {
  for (const wall of WALLS) if (circleHitsRect(x, y, radius, wall)) return true;
  for (const crate of CRATES) if (circleHitsRect(x, y, radius, crate)) return true;
  return false;
}

/**
 * One fixed step of the game. `direction` is the courier's steering vector, `sneaking`
 * the Shift key. Returns an EVENT_* bitmask: pickup, caught, win, game over, alert.
 * In attract mode (`attract` true) the courier stands still and the guards patrol.
 */
export function stepWorld(world, dt, direction, sneaking, attract) {
  const state = world.state;
  if (state.won || state.over) return EVENT_NONE;
  state.time += dt;
  if (state.caughtFlash > 0) state.caughtFlash -= dt;

  const api = {
    player: state.player,
    canSeeThrough,
    inShadow,
    moveCircle: (body, dx, dy) => moveCircle(body, dx, dy, body === state.player ? PLAYER.radius : 15),
  };

  if (!attract) updatePlayer(state.player, direction, sneaking, dt, api.moveCircle);
  const events = { alerted: false };
  for (const guard of state.guards) {
    updateGuard(guard, dt, api, events);
    if (guard.stepped) {
      guard.stepped = false;
      state.lastStepGuard = guard;
    }
  }
  state.alertLevel = Math.max(0, ...state.guards.map((guard) => guard.meter));

  let out = EVENT_NONE;
  if (events.alerted) out |= EVENT_ALERT;

  // Intel pickups: walk over a file to lift it.
  for (const file of state.intel) {
    if (!file.taken && Math.hypot(state.player.x - file.x, state.player.y - file.y) < 30) {
      file.taken = true;
      state.intelTaken += 1;
      state.score += 100;
      out |= EVENT_PICKUP;
    }
  }

  // Being caught: an alerted guard reaches the courier. Lose a life and restart from the
  // checkpoint (the entrance); the guards fall back to patrol. No instant unfair death.
  if (state.player.invulnerableLeft <= 0) {
    for (const guard of state.guards) {
      if (guard.state === STATE_ALERTED && Math.hypot(state.player.x - guard.x, state.player.y - guard.y) < 30) {
        state.lives -= 1;
        state.caughtFlash = 0.6;
        out |= EVENT_CAUGHT;
        if (state.lives <= 0) {
          state.over = true;
          out |= EVENT_OVER;
        } else {
          resetPlayer(state.player, START);
          state.guards = GUARD_DEFS.map((def) => createGuard(def));
          state.alertLevel = 0;
        }
        break;
      }
    }
  }

  // The exit: once every intel file is lifted, reaching the green door wins the run.
  if (
    !state.won &&
    state.intelTaken === INTEL.length &&
    state.player.x >= EXIT.x &&
    state.player.x <= EXIT.x + EXIT.w &&
    state.player.y >= EXIT.y &&
    state.player.y <= EXIT.y + EXIT.h
  ) {
    state.won = true;
    state.score += Math.max(0, Math.round(600 - state.time)) * 2;
    out |= EVENT_WIN;
  }
  return out;
}
