import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, hashPassword } from "@/lib/auth";
import { connectDb } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  login: z.string().trim().min(1).max(80),
  password: z.string().min(6).max(200),
});

export async function POST(request: Request) {
  try {
    const body = schema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        { error: "ENTER A NAME, LOGIN, AND PASSWORD OF AT LEAST 6 CHARACTERS" },
        { status: 400 },
      );
    }

    await connectDb();
    const login = body.data.login;
    const existing = await User.findOne({ login });
    if (existing) {
      return NextResponse.json(
        { error: "THAT LOGIN IS ALREADY IN USE" },
        { status: 409 },
      );
    }

    const user = await User.create({
      name: body.data.name,
      login,
      passwordHash: await hashPassword(body.data.password),
    });

    await createSession({
      id: String(user._id),
      login: user.login,
      name: user.name,
    });

    return NextResponse.json({
      user: { id: String(user._id), login: user.login, name: user.name },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the database. Start MongoDB and try again." },
      { status: 503 },
    );
  }
}
