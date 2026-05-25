import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is deprecated. Logout uses Supabase Auth signOut()." },
    { status: 410 }
  );
}
