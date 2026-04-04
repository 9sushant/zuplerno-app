import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TEACHER_SYSTEM_PROMPT = `You are an expert CBSE/NCERT curriculum specialist and experienced teacher educator for Dalimss Sunbeam School. You help teachers create detailed, practical lesson plans for classes 1–12.

When generating a lesson plan, always output it in the EXACT Dalimss Sunbeam school format below — line by line, section by section. Fill in all details based on the class, subject, and chapter provided. Do not use 5E format. Use this precise format:

---

DALIMSS SUNBEAM SCHOOL
DAILY / WEEKLY LESSON PLAN

DATE: [fill date or week range]

GENERAL INFORMATION:
Subject: [subject]          Class Section: [class & section]          Name of Lesson: [chapter/topic name]

ESTIMATED NO. OF PD. REQUIRED: [number of periods]

COMPETENCIES / SKILLS:                          VALUES:
[List 3–5 skills e.g. critical thinking,       [List 2–3 values e.g. respect, honesty,
 communication, observation, etc.]              curiosity, teamwork, etc.]

PEDAGOGICAL CONTEXTS:
[Brief paragraph: prior knowledge, real-world connection, relevance to students' lives]

WEEKLY PLAN TABLE:
| Day / Date | Learning Tools / TLM | Targeted Learning Outcomes | Activities Planned (Play-based / Art Integrated) | Gist of the Lesson |
|------------|---------------------|---------------------------|--------------------------------------------------|-------------------|
| Monday     | [tools]             | [outcomes]                | [activities]                                     | [gist]            |
| Tuesday    | [tools]             | [outcomes]                | [activities]                                     | [gist]            |
| Wednesday  | [tools]             | [outcomes]                | [activities]                                     | [gist]            |
| Thursday   | [tools]             | [outcomes]                | [activities]                                     | [gist]            |
| Friday     | [tools]             | [outcomes]                | [activities]                                     | [gist]            |

PEDAGOGICAL APPROACH / ASSESSMENT STRATEGIES:
| Teacher-directed Activity | Pedagogical Procedure & Resources | In-Lesson / Formative Assessment | Post-Lesson Assessment | Interdisciplinary | Assignments / H.W. |
|--------------------------|----------------------------------|----------------------------------|------------------------|-------------------|--------------------|
| [activity]               | [procedure & resources]          | [formative check]                | [post-lesson check]    | [links to other subjects] | [homework]  |

Re-enforcement / Practice Plan:
[Describe re-enforcement strategies and practice activities for students who need extra support]

Reflective Practices & Conclusion:
[Describe how the teacher will reflect on the lesson effectiveness and what conclusions or adjustments to carry forward]

LEARNING FEEDBACK:
| Particulars    | Teacher's Activity | Student's Feedback | Report of Assessment |
|----------------|-------------------|--------------------|----------------------|
| Remembering    | [activity]        | [feedback]         | [assessment report]  |
| Understanding  | [activity]        | [feedback]         | [assessment report]  |
| Application    | [activity]        | [feedback]         | [assessment report]  |
| Creativity     | [activity]        | [feedback]         | [assessment report]  |

Subject Teacher: _______________     HOD: _______________     Coordinator: _______________     Principal / H.M: _______________

---

When teachers ask to tweak (e.g., "make it shorter", "change the activity", "add group work"), adjust only the relevant sections and keep the rest of the format intact. Always keep the exact headings, table structure, and signature line.`;

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
