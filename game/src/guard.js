// One guard: a patrol route, a facing, an alert state, and a detection meter.
// States: patrol -> suspicious (meter past the threshold, walks to the last-seen point)
// -> alerted (meter full, chases the courier) -> search (lost the courier, looks around)
// -> patrol again. The meter is the recovery chance: hide and it drains.

import { GUARD } from './config.js';

export const STATE_PATROL = 'patrol';
export const STATE_SUSPICIOUS = 'suspicious';
export const STATE_ALERTED = 'alerted';
export const STATE_SEARCH = 'search';

export function createGuard(def) {
  const start = def.waypoints[0];
  return {
    name: def.name,
    waypoints: def.waypoints,
    waypointIndex: 1 % def.waypoints.length,
    x: start.x,
    y: start.y,
    facing: 0,
    state: STATE_PATROL,
    meter: 0,
    lastSeen: null,
    loseSight: 0,
    searchLeft: 0,
    pauseLeft: 0,
    stepPhase: Math.random() * Math.PI * 2,
    stepped: false,
  };
}

/** Angle from the guard toward a point. */
function angleTo(guard, x, y) {
  return Math.atan2(y - guard.y, x - guard.x);
}

/** Smallest absolute difference between two angles, in radians. */
function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/**
 * True when the courier stands inside this guard's vision cone with a clear line of sight.
 * `canSeeThrough(x1, y1, x2, y2)` is the world's line-of-sight test (walls and crates block it).
 */
export function guardSees(guard, player, canSeeThrough) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD.sightRange) return false;
  if (dist > GUARD.radius + 4 && angleDiff(angleTo(guard, player.x, player.y), guard.facing) > GUARD.halfAngle) return false;
  return canSeeThrough(guard.x, guard.y, player.x, player.y);
}

/** Walk toward a point at `speed`, sliding along walls via the world's mover. Returns true on arrival. */
function walkToward(guard, x, y, speed, dt, moveCircle) {
  const dx = x - guard.x;
  const dy = y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return true;
  const step = Math.min(dist, speed * dt);
  guard.facing = Math.atan2(dy, dx);
  moveCircle(guard, (dx / dist) * step, (dy / dist) * step);
  return dist - step < 4;
}

/**
 * Advance one guard a fixed step. `world` supplies the player, the line-of-sight test, the
 * circle mover, and the shadow test; `events` collects what happened for sound and the HUD.
 */
export function updateGuard(guard, dt, world, events) {
  const player = world.player;
  const seen = guardSees(guard, player, world.canSeeThrough) && player.invulnerableLeft <= 0;
  const dist = Math.hypot(player.x - guard.x, player.y - guard.y);

  // The detection meter fills while seen (faster up close, slower while the courier
  // sneaks or hides in shadow) and drains while unseen: that drain is the recovery chance.
  if (seen) {
    let rate = GUARD.detectRate * (1 - (dist / GUARD.sightRange) * 0.5);
    if (player.sneaking) rate *= GUARD.sneakFactor;
    if (world.inShadow(player.x, player.y)) rate *= GUARD.shadowFactor;
    guard.meter = Math.min(1, guard.meter + rate * dt);
    guard.lastSeen = { x: player.x, y: player.y };
    guard.loseSight = 0;
  } else {
    guard.meter = Math.max(0, guard.meter - GUARD.drainRate * dt);
    guard.loseSight += dt;
  }

  const wasState = guard.state;
  if (guard.meter >= 1) guard.state = STATE_ALERTED;
  else if (guard.state === STATE_ALERTED && guard.loseSight > GUARD.loseSightDelay) {
    guard.state = STATE_SEARCH;
    guard.searchLeft = GUARD.searchTime;
  } else if (guard.state === STATE_SEARCH) {
    guard.searchLeft -= dt;
    if (guard.searchLeft <= 0) {
      guard.state = STATE_PATROL;
      guard.meter = 0;
    }
  } else if (guard.state === STATE_PATROL && guard.meter >= GUARD.suspiciousAt) {
    guard.state = STATE_SUSPICIOUS;
  } else if (guard.state === STATE_SUSPICIOUS && guard.meter <= 0.05) {
    guard.state = STATE_PATROL;
  }
  if (guard.state !== wasState && guard.state === STATE_ALERTED) events.alerted = true;

  // Movement per state.
  if (guard.state === STATE_PATROL) {
    if (guard.pauseLeft > 0) {
      guard.pauseLeft -= dt;
    } else {
      const target = guard.waypoints[guard.waypointIndex];
      if (walkToward(guard, target.x, target.y, GUARD.patrolSpeed, dt, world.moveCircle)) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
        guard.pauseLeft = 0.7;
      }
    }
  } else if (guard.state === STATE_SUSPICIOUS) {
    if (guard.lastSeen) {
      if (walkToward(guard, guard.lastSeen.x, guard.lastSeen.y, GUARD.suspiciousSpeed, dt, world.moveCircle)) {
        guard.facing += dt * 1.6;
      }
    }
  } else if (guard.state === STATE_ALERTED) {
    if (seen) {
      walkToward(guard, player.x, player.y, GUARD.chaseSpeed, dt, world.moveCircle);
    } else if (guard.lastSeen) {
      walkToward(guard, guard.lastSeen.x, guard.lastSeen.y, GUARD.chaseSpeed, dt, world.moveCircle);
    }
  } else if (guard.state === STATE_SEARCH) {
    if (guard.lastSeen) {
      const arrived = walkToward(guard, guard.lastSeen.x, guard.lastSeen.y, GUARD.suspiciousSpeed, dt, world.moveCircle);
      if (arrived) guard.facing += dt * 2.2;
    }
  }

  // Footstep timing: guards step about twice a second while moving, faster while chasing.
  const moving = guard.state !== STATE_PATROL || guard.pauseLeft <= 0;
  if (moving) {
    const stepRate = guard.state === STATE_ALERTED ? 3.4 : 2.1;
    guard.stepPhase += dt * stepRate * Math.PI;
    if (guard.stepPhase >= Math.PI * 2) {
      guard.stepPhase -= Math.PI * 2;
      guard.stepped = true;
    }
  }
  return guard;
}
