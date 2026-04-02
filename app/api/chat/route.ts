import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TEACHER_SYSTEM_PROMPT = `You are an expert CBSE/NCERT curriculum specialist and experienced teacher educator for Dalimss Sunbeam School. You help teachers create detailed, practical lesson plans for classes 1–12.

When generating a lesson plan, structure it with these sections:
1. **Lesson Overview** — Class, Subject, Chapter, Duration, Learning Objectives (aligned with Bloom's Taxonomy)
2. **NCERT Alignment** — Specific NCERT textbook references, learning outcomes from the curriculum
3. **5E Methodology**
   - Engage (Hook/motivation activity, 5–10 min)
   - Explore (Student-centered discovery, 10–15 min)
   - Explain (Direct instruction / concept delivery, 10–15 min)
   - Elaborate (Application, practice, 10 min)
   - Evaluate (Assessment activity, 5–10 min)
4. **Teaching Aids & Resources** — Materials, TLMs, digital tools
5. **Differentiation** — Strategies for fast learners and slow learners
6. **Assessment** — Formative checks, practice questions, board exam connection
7. **Homework / Follow-up Activity**

Keep plans practical, classroom-ready, and aligned to CBSE board exam patterns. When teachers ask to tweak (e.g., "make it shorter", "add group activity", "simplify for slow learners"), adjust only the relevant sections and respond efficiently.`;

const STUDENT_SYSTEM_PROMPT = `You are a friendly, encouraging CBSE/NCERT tutor for Dalimss Sunbeam School students from Class 1 to Class 12. Your job is to help students understand their curriculum clearly.

Guidelines:
- For Class 1–5: Use very simple language, relatable examples, analogies from everyday life. Short sentences. Be warm and encouraging.
- For Class 6–8: Use clear explanations with examples, introduce some terminology but always explain it. Encourage curiosity.
- For Class 9–10: Balance conceptual understanding with board exam relevance. Include solved examples, common mistakes to avoid, tips for exams.
- For Class 11–12: Be rigorous. Explain concepts at the depth needed for board exams and competitive entrance exams (JEE/NEET/CUET). Include formulas, derivations when asked, solved problems.

Always:
- Refer to NCERT textbook content and examples when relevant
- Connect to what they already know
- End with 1–2 practice questions to test understanding (unless the student just wants a quick clarification)
- Never make the student feel bad for not knowing something`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, mode, cls, subject } = body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      mode: "teacher" | "student";
      cls: string;
      subject: string;
    };

    if (!messages || !mode) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const systemPrompt =
      mode === "teacher"
        ? TEACHER_SYSTEM_PROMPT +
          (cls ? `\n\nContext: The teacher is working on ${cls}${subject ? `, Subject: ${subject}` : ""}.` : "")
        : STUDENT_SYSTEM_PROMPT +
          (cls ? `\n\nContext: This student is in ${cls}${subject ? `, studying ${subject}` : ""}.` : "");

    const stream = await client.messages.stream({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: String(err) })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
