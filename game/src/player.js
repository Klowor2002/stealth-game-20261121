// The courier: WASD/arrows to move, Shift to sneak (slower, quieter, harder to spot).
// Movement slides along walls axis by axis, so hugging a wall never snags the courier.

import { FIELD, PLAYER } from './config.js';

export function createPlayer() {
  return {
    x: 0,
    y: 0,
    facing: -Math.PI / 2,
    sneaking: false,
    moving: false,
    invulnerableLeft: 0,
  };
}

export function resetPlayer(player, start) {
  player.x = start.x;
  player.y = start.y;
  player.facing = -Math.PI / 2;
  player.sneaking = false;
  player.moving = false;
  player.invulnerableLeft = PLAYER.invulnerable;
}

/**
 * Move the courier one fixed step. `direction` is a normalised {x, y}; `moveCircle`
 * slides the circle against walls and crates and clamps it inside the field.
 */
export function updatePlayer(player, direction, sneaking, dt, moveCircle) {
  player.sneaking = sneaking;
  const speed = sneaking ? PLAYER.sneakSpeed : PLAYER.speed;
  const dx = direction.x * speed * dt;
  const dy = direction.y * speed * dt;
  player.moving = dx !== 0 || dy !== 0;
  if (player.moving) player.facing = Math.atan2(dy, dx);
  moveCircle(player, dx, dy);
  if (player.invulnerableLeft > 0) player.invulnerableLeft -= dt;
  // Keep the courier inside the archive even if a mover ever lets it slip out.
  player.x = Math.min(FIELD.width - PLAYER.radius, Math.max(PLAYER.radius, player.x));
  player.y = Math.min(FIELD.height - PLAYER.radius, Math.max(PLAYER.radius, player.y));
}
