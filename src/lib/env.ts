import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  SPOTIFY_CLIENT_ID: z.string().optional(),
  SPOTIFY_CLIENT_SECRET: z.string().optional(),
  ADMIN_BASIC_USER: z.string().optional(),
  ADMIN_BASIC_PASS: z.string().optional(),
  ADMIN_BASIC_REALM: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  API_REQUEST_KEY: z.string().optional(),
  SESSION_SECRET: z.string().optional(),
  ADMIN_OWNER_EMAIL: z.string().optional(),
  ADMIN_OWNER_PASSWORD: z.string().optional(),
  ADMIN_OWNER_NAME: z.string().optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
  ADMIN_BASIC_USER: process.env.ADMIN_BASIC_USER,
  ADMIN_BASIC_PASS: process.env.ADMIN_BASIC_PASS,
  ADMIN_BASIC_REALM:
    process.env.ADMIN_BASIC_REALM ??
    (process.env.ADMIN_BASIC_USER && process.env.ADMIN_BASIC_PASS
      ? "SPI Admin"
      : undefined),
  CRON_SECRET: process.env.CRON_SECRET,
  API_REQUEST_KEY: process.env.API_REQUEST_KEY,
  SESSION_SECRET: process.env.SESSION_SECRET,
  ADMIN_OWNER_EMAIL: process.env.ADMIN_OWNER_EMAIL,
  ADMIN_OWNER_PASSWORD: process.env.ADMIN_OWNER_PASSWORD,
  ADMIN_OWNER_NAME: process.env.ADMIN_OWNER_NAME,
});
