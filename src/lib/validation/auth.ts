import { z } from "zod";

export const tokenLoginSchema = z.object({
  email: z.string().trim().email().min(1).max(320),
  password: z.string().min(1).max(256),
});
