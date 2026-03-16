/**
 * Types for four-axis evaluation. No single karma or upvote/downvote.
 */

export type AxisName = "clarity" | "evidence" | "kindness" | "novelty";

export type TargetType = "post" | "comment";

export interface RatingDimensions {
  clarity: number;
  evidence: number;
  kindness: number;
  novelty: number;
}

export interface CachedScores extends RatingDimensions {
  ratingCount: number;
}
