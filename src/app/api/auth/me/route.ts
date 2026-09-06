import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDb } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectDb();
  } catch {
    return NextResponse.json({ user: null, db: false });
  }
  const user = await getSession();
  return NextResponse.json({ user, db: true });
}
