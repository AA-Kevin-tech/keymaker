export interface CreateCommunityBody {
  name: string;
  slug: string;
  weightClarity?: number;
  weightEvidence?: number;
  weightKindness?: number;
  weightNovelty?: number;
  decayHalfLifeSeconds?: number;
}
