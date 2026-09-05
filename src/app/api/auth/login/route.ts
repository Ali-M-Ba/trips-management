import { NextResponse } from "next/server";
import { z } from "zod";
import { User } from "@/lib/models/User";
import {
  createSession,
  ensureSeedUser,
  verifyPassword,
} from "@/lib/auth";
import { connectDb } from "@/lib/mongodb";

const schema = z.object({
  login: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    await connectDb();
    await ensureSeedUser();

    const body = schema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json(
        { error: "WRONG LOGIN OR PASSWORD" },
        { status: 401 },
      );
    }

    const user = await User.findOne({ login: body.data.login });
    if (!user || !(await verifyPassword(body.data.password, user.passwordHash))) {
      return NextResponse.json(
        { error: "WRONG LOGIN OR PASSWORD" },
        { status: 401 },
      );
    }

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
