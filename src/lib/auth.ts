import { randomBytes, pbkdf2Sync, createHmac, timingSafeEqual as nodeTimingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

type TokenPayload = {
  uid: string;
  role: "owner" | "member";
  exp: number; // epoch seconds
  v: 1;
};

const COOKIE_NAME = "spi_admin_session";
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function hashPassword(raw: string, saltHex?: string) {
  const salt = saltHex ? Buffer.from(saltHex, "hex") : randomBytes(16);
  const hash = pbkdf2Sync(raw, salt, 120000, 32, "sha256");
  return {
    salt: salt.toString("hex"),
    hash: hash.toString("hex"),
  };
}

export function verifyPassword(raw: string, saltHex: string, hashHex: string) {
  const { hash } = hashPassword(raw, saltHex);
  return timingSafeEqual(hash, hashHex);
}

function timingSafeEqual(aHex: string, bHex: string) {
  const a = Buffer.from(aHex, "hex");
  const b = Buffer.from(bHex, "hex");
  if (a.length !== b.length) return false;
  return nodeTimingSafeEqual(a, b);
}

function base64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b.toString("base64").replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function sign(payload: TokenPayload) {
  const secret = env.SESSION_SECRET || "dev-secret";
  const body = base64url(Buffer.from(JSON.stringify(payload)));
  const sig = createHmac("sha256", secret).update(body).digest();
  return `${body}.${base64url(sig)}`;
}

function verifyInternal(token: string): TokenPayload | null {
  const [bodyB64, sigB64] = token.split(".");
  if (!bodyB64 || !sigB64) return null;
  const secret = env.SESSION_SECRET || "dev-secret";
  const expected = createHmac("sha256", secret)
    .update(bodyB64)
    .digest();
  const provided = Buffer.from(sigB64.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  if (expected.length !== provided.length || !expected.equals(provided)) return null;
  const json = Buffer.from(bodyB64.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString();
  const obj = JSON.parse(json) as TokenPayload;
  if (obj.exp && Date.now() / 1000 > obj.exp) return null;
  return obj;
}

export function createSessionCookie(user: { id: string; role: string }) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload: TokenPayload = {
    uid: user.id,
    role: (user.role === "owner" ? "owner" : "member"),
    exp,
    v: 1,
  };
  const token = sign(payload);
  const secure = process.env.NODE_ENV === "production";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TOKEN_TTL_SECONDS};${secure ? " Secure;" : ""}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;`;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyInternal(token);
  if (!payload) return null;
  const user = await prisma.adminUser.findUnique({ where: { id: payload.uid } });
  if (!user || !user.active) return null;
  return { user: { id: user.id, email: user.email, name: user.name, role: user.role as "owner" | "member" } };
}

// Ensure owner exists based on env
export async function ensureOwnerFromEnv() {
  const email = env.ADMIN_OWNER_EMAIL;
  const password = env.ADMIN_OWNER_PASSWORD;
  if (!email || !password) return null;
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) return existing;
  const { salt, hash } = hashPassword(password);
  const created = await prisma.adminUser.create({
    data: {
      email,
      name: env.ADMIN_OWNER_NAME || "Owner",
      role: "owner",
      active: true,
      passwordHash: hash,
      passwordSalt: salt,
    },
  });
  return created;
}
