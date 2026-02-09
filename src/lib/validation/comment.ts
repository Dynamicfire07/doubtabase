import { z } from "zod";

const commentBodySchema = z.string().trim().min(1).max(2000);

export const createCommentSchema = z.object({
  body: commentBodySchema,
});
