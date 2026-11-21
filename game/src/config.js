// Night Archive — every tuning number, colour and the whole level in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the window,
// so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  speed: 165,
  sneakSpeed: 92,
  invulnerable: 2,
};

export const GUARD = {
  radius: 15,
  patrolSpeed: 72,
  suspiciousSpeed: 105,
  chaseSpeed: 152,
  /** How far a guard can see, in pixels. */
  sightRange: 235,
  /** Half of the vision cone's angle, in radians. */
  halfAngle: 0.62,
  /** Seconds a guard keeps chasing after losing sight before it starts searching. */
  loseSightDelay: 2.5,
  /** Seconds a guard searches its last-seen point before giving up. */
  searchTime: 3.5,
  /** Detection meter fill per second at point-blank range, before modifiers. */
  detectRate: 1.15,
  /** Detection meter drain per second while the player is unseen. */
  drainRate: 0.55,
  /** Fill-rate multiplier while the player sneaks. */
  sneakFactor: 0.4,
  /** Fill-rate multiplier while the player stands in a shadow patch. */
  shadowFactor: 0.4,
  /** Meter level that makes a guard suspicious. */
  suspiciousAt: 0.3,
};

export const LIVES = 3;

/** The archive's walls: solid rectangles that block movement and sight. */
export const WALLS = [
  { x: 280, y: 0, w: 24, h: 380 }, // west divider, open below
  { x: 620, y: 340, w: 24, h: 380 }, // middle divider, open above
  { x: 880, y: 0, w: 24, h: 300 }, // east divider, open below
  { x: 980, y: 460, w: 300, h: 24 }, // south-east shelf wall
];

/** Crates: cover that blocks movement and sight, and hides the player behind it.
 *  Every crate sits clear of the guards' patrol lanes, so no guard can wedge against one. */
export const CRATES = [
  { x: 40, y: 180, w: 56, h: 56 },
  { x: 420, y: 120, w: 56, h: 56 },
  { x: 340, y: 480, w: 56, h: 56 },
  { x: 700, y: 120, w: 56, h: 56 },
  { x: 760, y: 540, w: 56, h: 56 },
  { x: 1240, y: 520, w: 56, h: 56 },
  { x: 1120, y: 560, w: 56, h: 56 },
  { x: 240, y: 600, w: 56, h: 56 },
];

/** Shadow patches: standing inside one makes the guards' meters fill much slower. */
export const SHADOWS = [
  { x: 60, y: 420, w: 190, h: 120 },
  { x: 660, y: 280, w: 170, h: 110 },
  { x: 1020, y: 330, w: 180, h: 120 },
  { x: 340, y: 620, w: 170, h: 80 },
];

/** The three intel files the courier must lift before the exit opens. */
export const INTEL = [
  { x: 150, y: 140 },
  { x: 700, y: 600 },
  { x: 1150, y: 120 },
];

/** Where the courier starts, and the exit door that ends the run. */
export const START = { x: 64, y: 652 };
export const EXIT = { x: 1215, y: 58, w: 56, h: 56 };

/** Guard patrol definitions: name, waypoints, and where each guard starts. */
export const GUARD_DEFS = [
  { name: 'Mara', waypoints: [{ x: 120, y: 300 }, { x: 250, y: 300 }, { x: 250, y: 120 }, { x: 120, y: 120 }] },
  { name: 'Bram', waypoints: [{ x: 430, y: 210 }, { x: 590, y: 210 }, { x: 590, y: 480 }, { x: 430, y: 480 }] },
  { name: 'Sable', waypoints: [{ x: 950, y: 200 }, { x: 1160, y: 200 }, { x: 1160, y: 380 }, { x: 950, y: 380 }] },
  { name: 'Ivo', waypoints: [{ x: 380, y: 652 }, { x: 900, y: 652 }] },
];

/** The courier's route for the exit screenshot: waypoints that lift every intel, then the exit.
 *  Every leg clears the crates and walls by at least a body radius, so a greedy autopilot
 *  never snags: the west lane runs at x=200, past the crate at (60,300). */
export const EXIT_ROUTE = [
  { x: 200, y: 560 },
  { x: 200, y: 200 },
  { x: 150, y: 140 },
  { x: 200, y: 200 },
  { x: 200, y: 430 },
  { x: 420, y: 430 },
  { x: 560, y: 430 },
  { x: 560, y: 280 },
  { x: 700, y: 280 },
  { x: 700, y: 600 },
  { x: 700, y: 280 },
  { x: 820, y: 280 },
  { x: 820, y: 430 },
  { x: 1010, y: 430 },
  { x: 1215, y: 430 },
  { x: 1215, y: 140 },
  { x: 1150, y: 120 },
  { x: 1243, y: 86 },
];

export const PALETTE = {
  backdrop: '#0b0e14',
  floorA: '#171c26',
  floorB: '#1a202c',
  floorLine: '#232b3a',
  wall: '#3a4356',
  wallTop: '#4d5870',
  crate: '#6b4f2a',
  crateEdge: '#8a6a3a',
  shadow: '#0a1226',
  player: '#4fd8e8',
  playerRing: '#b8f4ff',
  guard: '#e5534b',
  guardRing: '#ffb3ad',
  coneCalm: 'rgba(242, 201, 76, 0.27)',
  coneSuspicious: 'rgba(242, 140, 60, 0.36)',
  coneAlert: 'rgba(229, 83, 75, 0.44)',
  intel: '#f2c94c',
  exit: '#3fce7a',
  exitGlow: 'rgba(63, 206, 122, 0.25)',
  panel: '#12161f',
  text: '#eef1f5',
  muted: '#9aa3b2',
  danger: '#ff6b61',
  gold: '#f2c94c',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'night-archive.best';
