import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { deleteReel } from "@/lib/reels-store";

export async function DELETE(req: NextRequest) {
  try {
    const { id, pin } = await req.json();

    const expectedPin = process.env.TEACHER_PIN || "1234";
    if (pin !== expectedPin) {
      return NextResponse.json({ error: "Wrong PIN." }, { status: 401 });
    }

    const { deleted, blob_url } = await deleteReel(id);
    if (!deleted) {
      return NextResponse.json({ error: "Reel not found." }, { status: 404 });
    }

    // Delete file from Vercel Blob
    if (blob_url) {
      try {
        await del(blob_url);
      } catch {
        // blob may already be gone, continue
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
