import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { addReel } from "@/lib/reels-store";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const pin = (formData.get("pin") as string) || "";
    const expectedPin = process.env.TEACHER_PIN || "1234";
    if (pin !== expectedPin) {
      return NextResponse.json({ error: "Wrong PIN. Access denied." }, { status: 401 });
    }

    // PIN-only verification request — return early without processing upload
    if (formData.get("__pin_check__") === "1") {
      return NextResponse.json({ ok: true });
    }

    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() ?? "";
    const cls = (formData.get("class") as string)?.trim();
    const subject = (formData.get("subject") as string)?.trim();
    const chapter = (formData.get("chapter") as string)?.trim() ?? "";

    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
    if (!cls) return NextResponse.json({ error: "Class is required." }, { status: 400 });
    if (!subject) return NextResponse.json({ error: "Subject is required." }, { status: 400 });

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File exceeds 10 MB limit." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use MP4, WebM, JPG, PNG, GIF or WebP." },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() || "bin";
    const filename = randomUUID() + "." + ext;

    // Upload to Vercel Blob
    const blob = await put(`reels/${filename}`, file, {
      access: "public",
      contentType: file.type,
    });

    const reel = await addReel({
      title,
      description,
      class: cls,
      subject,
      chapter,
      filename,
      blob_url: blob.url,
      mimetype: file.type,
      filesize: file.size,
    });

    return NextResponse.json({ success: true, id: reel.id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
