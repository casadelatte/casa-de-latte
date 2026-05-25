import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is deprecated. Admin login uses Supabase Auth." },
    { status: 410 }
  );
}
