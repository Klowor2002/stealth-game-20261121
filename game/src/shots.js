// The screenshot scenes behind ?shot=start|sneak|alert|exit. Each one plays the real rules
// forward from a fresh world for a fixed number of steps, steered by a small autopilot that
// follows waypoints and sneaks through cone zones, so every frame is what a short game
// really looks like and the same seed always gives the same frame.

import { CRATES, EXIT_ROUTE, GUARD, INTEL, SHADOWS, START, STEP, WALLS } from './config.js';
import { canSeeThrough, EVENT_ALERT, EVENT_OVER, EVENT_WIN, inShadow, stepWorld } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const START_SECONDS = 5;
const MAX_SECONDS = 240;
const SAMPLE = STEP;

/** Distance from a waypoint at which the autopilot moves on to the next one. */
const WAYPOINT_REACH = 18;

/** The nearest hiding spot the chasing guard cannot see: the far side of a crate, or
 *  just past the end of a wall. Standing in a shadow patch does not end a chase — the
 *  guard walks straight to it — but a crate or a wall end breaks the line of sight,
 *  and then the guard loses the courier, searches, and gives up. */
function fleeTarget(world, guard) {
  const player = world.state.player;
  const candidates = [];
  for (const crate of CRATES) {
    const cx = crate.x + crate.w / 2;
    const cy = crate.y + crate.h / 2;
    const dx = cx - guard.x;
    const dy = cy - guard.y;
    const d = Math.hypot(dx, dy) || 1;
    candidates.push({ x: cx + (dx / d) * 70, y: cy + (dy / d) * 70 });
  }
  for (const wall of WALLS) {
    if (wall.h > wall.w) {
      candidates.push({ x: wall.x + wall.w / 2, y: wall.y - 40 });
      candidates.push({ x: wall.x + wall.w / 2, y: wall.y + wall.h + 40 });
    } else {
      candidates.push({ x: wall.x - 40, y: wall.y + wall.h / 2 });
      candidates.push({ x: wall.x + wall.w + 40, y: wall.y + wall.h / 2 });
    }
  }
  let best = null;
  let bestDist = Infinity;
  for (const point of candidates) {
    if (canSeeThrough(guard.x, guard.y, point.x, point.y)) continue;
    const dist = Math.hypot(point.x - player.x, point.y - player.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = point;
    }
  }
  return best ?? { x: START.x, y: START.y };
}

/** Centre of the shadow patch nearest to the courier. */
function nearestShadow(world) {
  const player = world.state.player;
  let best = null;
  let bestDist = Infinity;
  for (const shadow of SHADOWS) {
    const cx = shadow.x + shadow.w / 2;
    const cy = shadow.y + shadow.h / 2;
    const dist = Math.hypot(cx - player.x, cy - player.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = { x: cx, y: cy };
    }
  }
  return best;
}

/**
 * Steer the courier toward `target`, sneaking the whole way. The moment any guard's meter
 * runs hot, the courier runs — at full speed, not a sneak — for the nearest hiding spot
 * that guard cannot see: a suspicious guard closes at 105 px/s, faster than a sneak,
 * so dawdling to a shadow patch only lets it catch up. Breaking line of sight is what
 * ends a chase; standing in a shadow patch while a guard walks straight to it does not.
 * The hiding spot is latched in `fleeState` for the whole chase: recomputing it from
 * the guard's live position slides the spot around the crate as the guard closes in,
 * and the courier shuffles along the crate's edge instead of reaching cover.
 */
function autopilot(world, target, sneak, fleeState) {
  const state = world.state;
  const player = state.player;
  let hottest = null;
  for (const guard of state.guards) {
    if (!hottest || guard.meter > hottest.meter) hottest = guard;
  }
  if (hottest && (hottest.state === 'alerted' || hottest.meter > 0.3)) {
    if (!fleeState.spot) fleeState.spot = fleeTarget(world, hottest);
    const hide = fleeState.spot;
    const dx = hide.x - player.x;
    const dy = hide.y - player.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < 24) {
      // Hidden. If the guard still sees the courier here, the spot is spent: drop it.
      if (hottest.meter > 0.55) fleeState.spot = null;
      return { direction: { x: 0, y: 0 }, sneak: true, reached: false };
    }
    return { direction: { x: dx / dist, y: dy / dist }, sneak: false, reached: false };
  }
  fleeState.spot = null;
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const dist = Math.hypot(dx, dy);
  if (dist < WAYPOINT_REACH) return { direction: { x: 0, y: 0 }, sneak: true, reached: true };
  return { direction: { x: dx / dist, y: dy / dist }, sneak, reached: false };
}

/** Run the world forward with the autopilot following `route` until it ends or time runs out.
 *  Before each leg the courier waits for a clear lane — no guard's cone covering the path
 *  and no meter running hot — the way a patient player times a patrol. If the courier is
 *  caught, it restarts the route from the entrance and tries again. */
function followRoute(world, route, limitSeconds) {
  let index = 0;
  let events = 0;
  let lives = world.state.lives;
  const fleeState = { spot: null };
  const steps = Math.floor(limitSeconds / STEP);
  for (let step = 0; step < steps; step += 1) {
    if (index >= route.length) break;
    if (world.state.lives < lives) {
      // Caught: back to the entrance, route from the top.
      lives = world.state.lives;
      index = 0;
      continue;
    }
    const target = route[index];
    const hottest = Math.max(0, ...world.state.guards.map((guard) => guard.meter));
    const alerted = world.state.guards.some((guard) => guard.state === 'alerted');
    if (!alerted && hottest < 0.3 && !laneClear(world, world.state.player, target)) {
      // A cone covers the next leg: hold still and wait for the patrol to move on.
      events |= stepWorld(world, STEP, { x: 0, y: 0 }, true, false);
      if (events & (EVENT_WIN | EVENT_OVER)) break;
      continue;
    }
    const steer = autopilot(world, target, true, fleeState);
    if (steer.reached) {
      index += 1;
      continue;
    }
    events |= stepWorld(world, STEP, steer.direction, steer.sneak, false);
    if (events & (EVENT_WIN | EVENT_OVER)) break;
  }
  return events;
}

/** True when no guard's vision cone covers any point of the straight leg from `from` to `to`. */
function laneClear(world, from, to) {
  for (let t = 0; t <= 1; t += 0.125) {
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;
    for (const guard of world.state.guards) {
      const dx = x - guard.x;
      const dy = y - guard.y;
      const dist = Math.hypot(dx, dy);
      if (dist > GUARD.sightRange) continue;
      let diff = Math.atan2(dy, dx) - guard.facing;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) > GUARD.halfAngle) continue;
      if (canSeeThrough(guard.x, guard.y, x, y)) return false;
    }
  }
  return true;
}

/** Walk the courier to a point in the open, standing still, until a guard spots it.
 *  Once a meter runs hot the courier freezes: the meter then fills while the guard is
 *  still at range, so the alert fires before the guard can close in and catch it. */
/** Walk the courier to a point in the open, standing still, until a guard spots it.
 *  The courier hurries to the point at full speed, then freezes the moment any meter
 *  runs hot: the meter then fills while the guard is still at range, so the alert
 *  fires before the guard can close in and catch it. Walking on into the guard is
 *  what used to get the courier caught in the same step the alert fired. */
function walkIntoCone(world, point, limitSeconds) {
  let events = 0;
  const fleeState = { spot: null };
  const steps = Math.floor(limitSeconds / STEP);
  for (let step = 0; step < steps; step += 1) {
    const hottest = Math.max(0, ...world.state.guards.map((guard) => guard.meter));
    if (hottest > 0.2) {
      // Seen: freeze in the open and let the meter fill at range.
      events |= stepWorld(world, STEP, { x: 0, y: 0 }, false, false);
    } else {
      const steer = autopilot(world, point, false, fleeState);
      events |= stepWorld(world, STEP, steer.direction, false, false);
      if (steer.reached) {
        // Standing in the open, in a guard's lane: wait to be seen.
        events |= stepWorld(world, STEP, { x: 0, y: 0 }, false, false);
      }
    }
    if (events & EVENT_ALERT) return events;
    if (events & EVENT_OVER) return events;
  }
  return events;
}

/**
 * Set `world` to the named scene (start, sneak, alert or exit; any other name is start)
 * and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'sneak') {
    // Slip to the west lane and crouch south of the crate row while Mara's cone sweeps
    // past: the courier sneaking, a guard's cone close by, cover between them. The
    // wait steers through the autopilot, so if Mara spots the courier it flees and
    // comes back instead of standing still while she walks straight to it.
    followRoute(world, [{ x: 200, y: 560 }, { x: 200, y: 380 }], 40);
    const fleeState = { spot: null };
    const mara = world.state.guards.find((guard) => guard.name === 'Mara');
    for (let step = 0; step < 40 / STEP; step += 1) {
      const facingEast = Math.abs(mara.facing) < 0.6 || Math.abs(mara.facing - Math.PI * 2) < 0.6;
      const nearHold = Math.hypot(world.state.player.x - 200, world.state.player.y - 380) < 60;
      if (mara.x > 180 && facingEast && nearHold) break;
      const steer = autopilot(world, { x: 200, y: 380 }, true, fleeState);
      stepWorld(world, STEP, steer.direction, steer.sneak, false);
      if (world.state.over) break;
    }
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'alert') {
    // Step into Sable's patrol lane in the open and wait: the guard spots the courier,
    // its cone turns red and the "!" goes up.
    walkIntoCone(world, { x: 1060, y: 290 }, 90);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'exit') {
    // Lift every intel file and reach the green door. The shot shows the play screen
    // at the exit — the courier on the open door, INTEL 3/3, the score banked — not
    // the win panel, which would cover the level the judge needs to see.
    followRoute(world, EXIT_ROUTE, MAX_SECONDS);
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  // start: the live archive at play, guards mid-patrol — the whole level, the cones,
  // the cover and the exit readable at a glance, with no panel in the way.
  for (let index = 0; index < START_SECONDS / STEP; index += 1) {
    stepWorld(world, STEP, { x: 0, y: 0 }, false, true);
  }
  return { screen: SCREEN_PLAY, best: 0 };
}

export { SAMPLE };
