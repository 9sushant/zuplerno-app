import { NextResponse } from "next/server";
import { getReels } from "@/lib/reels-store";

export async function GET() {
  try {
    const reels = await getReels();
    return NextResponse.json(reels);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
