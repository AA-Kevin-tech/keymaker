import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(1, "username is required").trim().min(2, "username must be 2–32 characters").max(32),
  password: z.string().min(8, "password must be at least 8 characters"),
});

export const loginSchema = z.object({
  username: z.string().min(1, "username is required").trim(),
  password: z.string().min(1, "password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
