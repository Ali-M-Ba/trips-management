import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { connectDb } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import type { SessionUser } from "@/lib/types";

const COOKIE = "trips_session";

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(value);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    id: user.id,
    login: user.login,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: String(payload.id),
      login: String(payload.login),
      name: String(payload.name ?? payload.login),
    };
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    const error = new Error("UNAUTHORIZED");
    throw error;
  }
  return session;
}

export async function ensureSeedUser() {
  await connectDb();
  const login = process.env.SEED_LOGIN || "staff";
  const existing = await User.findOne({ login });
  if (existing) return;

  await User.create({
    login,
    name: process.env.SEED_NAME || "Dispatcher",
    passwordHash: await hashPassword(process.env.SEED_PASSWORD || "staff123"),
  });
}
