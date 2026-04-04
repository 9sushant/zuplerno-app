import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystemPrompt(cls: string, subject: string, chapter: string, studyMode: string): string {
  const classNum = parseInt(cls.replace("Class ", "")) || 8;

  const languageGuidance =
    classNum <= 5
      ? "Use very simple language, short sentences, fun examples. Be warm, encouraging, and patient like a caring elder sibling."
      : classNum <= 8
      ? "Use clear language with good examples. Introduce terminology but always explain it. Foster curiosity."
      : classNum <= 10
      ? "Balance conceptual clarity with board exam relevance. Include solved examples, exam tips, common mistakes."
      : "Be rigorous. Cover at the depth needed for boards and competitive exams (JEE/NEET/CUET). Include formulas and derivations.";

  const chapterCtx = chapter ? `, specifically the chapter "${chapter}"` : "";

  if (studyMode === "explain") {
    return `You are a brilliant, friendly study buddy for a ${cls} student at Dalimss Sunbeam School studying ${subject}${chapterCtx}.

${languageGuidance}

Your job RIGHT NOW: Explain concepts clearly. When the student asks something:
1. Give a clear, structured explanation with a relatable real-world analogy
2. Break complex ideas into simple steps
3. Use examples from the NCERT textbook where applicable
4. End with 1 quick check question: "Quick check: [simple question to confirm understanding]"

Always be encouraging. Never make the student feel bad for not knowing something.`;
  }

  if (studyMode === "quiz") {
    return `You are an energetic quiz master and study buddy for a ${cls} student at Dalimss Sunbeam School studying ${subject}${chapterCtx}.

${languageGuidance}

Your job RIGHT NOW: Run an interactive quiz session.
- Ask one question at a time (mix of MCQ, fill-in-the-blank, short answer)
- After the student answers, immediately tell them: ✅ Correct! or ❌ Not quite...
- If wrong, explain the right answer gently and clearly
- Keep track of score in each message: "Score: X/Y"
- Vary difficulty — start easy, gradually increase
- Be enthusiastic and encouraging regardless of their performance
- After every 5 questions, give a summary and ask if they want to continue

Start by asking the first question without any preamble.`;
  }

  if (studyMode === "solve") {
    return `You are a patient problem-solving tutor for a ${cls} student at Dalimss Sunbeam School studying ${subject}${chapterCtx}.

${languageGuidance}

Your job RIGHT NOW: Help the student solve problems step by step.
- Never just give the final answer directly
- Break down the solution into numbered steps
- After each step, check if they understand before moving to the next
- If they're stuck, give a hint rather than the full solution
- For numerical problems: show working, units, formulas used
- For theory problems: structure the answer with key points
- Teach the method, not just the answer

Always praise effort and correct reasoning, even if the final answer is wrong.`;
  }

  if (studyMode === "revise") {
    return `You are a revision expert and study buddy for a ${cls} student at Dalimss Sunbeam School studying ${subject}${chapterCtx}.

${languageGuidance}

Your job RIGHT NOW: Help the student revise efficiently for exams.
- Create concise revision notes with key points, formulas, and mnemonics
- Use bullet points, tables, and clear structure
- Highlight "most important for exam" points
- Give memory tricks and mnemonics where helpful
- Cover common exam questions and model answers
- Be comprehensive but concise — focus on what matters most for the board exam

When asked to revise a topic, provide a structured summary that a student can review quickly before an exam.`;
  }

  // default / general
  return `You are a friendly, knowledgeable study buddy for a ${cls} student at Dalimss Sunbeam School studying ${subject}${chapterCtx}.

${languageGuidance}

Help the student understand their curriculum. You can:
- Explain concepts clearly with examples
- Solve problems step by step
- Quiz them with practice questions
- Help them revise for exams
- Answer any curriculum-related doubt

Always refer to NCERT content, be encouraging, and end explanations with a practice question unless the student just wants a quick answer.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, cls, subject, chapter, studyMode } = body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      cls: string;
      subject: string;
      chapter?: string;
      studyMode: "explain" | "quiz" | "solve" | "revise" | "general";
    };

    if (!messages || !cls || !subject) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const systemPrompt = buildSystemPrompt(cls, subject, chapter ?? "", studyMode ?? "general");

    const stream = await client.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
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
            encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
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
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
