/**
 * Keymaker shared constants.
 * Used by API (ranking, validation) and can be used by web for display.
 */

export const AXIS_NAMES = ["clarity", "evidence", "novelty"] as const;

export const SCORE_MIN = -2;
export const SCORE_MAX = 2;

/** Minimum number of ratings before content score is fully counted in feed ranking. */
export const MIN_RATINGS_DAMPENING = 2;

/** Default decay half-life in seconds (24 hours). */
export const DEFAULT_DECAY_HALF_LIFE_SECONDS = 86400;
