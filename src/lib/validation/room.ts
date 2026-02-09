import { z } from "zod";

export const roomIdSchema = z.uuid();

export const createRoomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .transform((value) => value.replace(/\s+/g, " ")),
});

export const joinRoomSchema = z.object({
  code: z
    .string()
    .trim()
    .min(8)
    .max(200)
    .transform((value) => value.replace(/\s+/g, "")),
});
