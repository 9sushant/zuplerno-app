import { sql } from "@vercel/postgres";

export type Reel = {
  id: string;
  title: string;
  description: string;
  class: string;
  subject: string;
  chapter: string;
  filename: string;   // original filename for reference
  blob_url: string;   // Vercel Blob public URL — use this in <img>/<video>
  mimetype: string;
  filesize: number;
  created_at: string;
};

export async function getReels(): Promise<Reel[]> {
  const result = await sql`
    SELECT id, title, description, class, subject, chapter,
           filename, blob_url, mimetype, filesize, created_at
    FROM reels
    ORDER BY created_at DESC
  `;
  return result.rows as Reel[];
}

export async function addReel(
  reel: Omit<Reel, "id" | "created_at">
): Promise<Reel> {
  const id = Date.now().toString() + Math.random().toString(36).slice(2, 7);
  const result = await sql`
    INSERT INTO reels (id, title, description, class, subject, chapter,
                       filename, blob_url, mimetype, filesize, created_at)
    VALUES (
      ${id},
      ${reel.title},
      ${reel.description},
      ${reel.class},
      ${reel.subject},
      ${reel.chapter},
      ${reel.filename},
      ${reel.blob_url},
      ${reel.mimetype},
      ${reel.filesize},
      NOW()
    )
    RETURNING *
  `;
  return result.rows[0] as Reel;
}

export async function deleteReel(id: string): Promise<{ deleted: boolean; blob_url: string | null }> {
  const existing = await sql`SELECT blob_url FROM reels WHERE id = ${id}`;
  if (!existing.rows[0]) return { deleted: false, blob_url: null };
  const blob_url = existing.rows[0].blob_url as string;
  await sql`DELETE FROM reels WHERE id = ${id}`;
  return { deleted: true, blob_url };
}
