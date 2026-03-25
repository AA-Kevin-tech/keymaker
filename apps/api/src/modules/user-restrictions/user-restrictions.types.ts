import type { UserRestrictionType } from "@prisma/client";

/** Parsed request body for admin restrict endpoints (see `restrictUserBodySchema`). */
export type RestrictUserBody = {
  restrictionType: UserRestrictionType;
  communityId?: string | null;
  reasonCode: string;
  reasonText?: string | null;
  endsAt?: string | null;
};
