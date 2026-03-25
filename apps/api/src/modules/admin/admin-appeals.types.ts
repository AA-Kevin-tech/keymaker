import type { z } from "zod";
import type { adminAppealListQuerySchema } from "../appeals/appeals.schema.js";

export type AdminAppealListQueryInput = z.infer<typeof adminAppealListQuerySchema>;
