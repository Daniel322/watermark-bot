export const POSITION_COORDINATES_COEFFICIENTS = {
  s: {
    top: {
      center: 0.45,
      bottom: 0.9,
    },
    left: {
      center: 0.45,
      right: 0.9,
    },
  },
  m: {
    top: {
      center: 0.4,
      bottom: 0.8,
    },
    left: {
      center: 0.4,
      right: 0.8,
    },
  },
  l: {
    top: {
      center: 0.35,
      bottom: 0.7,
    },
    left: {
      center: 0.35,
      right: 0.7,
    },
  },
} as const;

export const PATTERNS_FOR_COMPOSITE = {
  s: { rows: 4, columns: 4 },
  m: { rows: 3, columns: 3 },
  l: { rows: 2, columns: 2 },
} as const;
