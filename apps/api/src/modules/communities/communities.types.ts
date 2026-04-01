export interface CreateCommunityBody {
  name: string;
  slug: string;
  weightClarity?: number;
  weightEvidence?: number;
  weightNovelty?: number;
  decayHalfLifeSeconds?: number;
}
