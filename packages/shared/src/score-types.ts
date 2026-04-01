/**
 * Types for three-axis evaluation. No single karma or upvote/downvote.
 */

export type AxisName = "clarity" | "evidence" | "novelty";

export type TargetType = "post" | "comment";

export interface RatingDimensions {
  clarity: number;
  evidence: number;
  novelty: number;
}

export interface CachedScores extends RatingDimensions {
  ratingCount: number;
}
