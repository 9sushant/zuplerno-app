import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const QUESTION_PAPER_SYSTEM_PROMPT = `You are an expert CBSE/NCERT question paper setter for Dalimss Sunbeam School. You create well-structured, board-exam-standard question papers.

When generating a question paper, follow this EXACT format:

---

DALIMSS SUNBEAM SCHOOL
[Subject] — CLASS [X]
[Exam Type] EXAMINATION [Year]

Time Allowed: [X] Hours          Maximum Marks: [Total Marks]

General Instructions:
1. All questions are compulsory unless stated otherwise.
2. Read all questions carefully before answering.
3. Write neat and legible answers.
4. Draw diagrams wherever necessary.

---

SECTION A — Multiple Choice Questions (MCQ)
[Each question: 1 mark]

Q1. [Question]
   (a) [Option A]    (b) [Option B]    (c) [Option C]    (d) [Option D]

Q2. [Question]
   (a) [Option A]    (b) [Option B]    (c) [Option C]    (d) [Option D]

[Continue for all MCQ questions...]

---

SECTION B — Short Answer Questions
[Each question: [X] marks]

Q[n]. [Question]

Q[n+1]. [Question]

[Continue for all short answer questions...]

---

SECTION C — Long Answer / Application Questions
[Each question: [X] marks]

Q[n]. [Question]

[Continue for all long answer questions...]

---

ANSWER KEY / MARKING SCHEME:
Section A: Q1-(x), Q2-(x), ... [list all MCQ answers]
Section B: [brief key points for each question]
Section C: [key points + partial marking breakdown]

---

Rules for question generation:
- Strictly follow NCERT/CBSE curriculum for the given class and subject
- MCQs must have exactly 4 options with only one correct answer
- Short answers should require 3-5 sentences
- Long answers should require detailed explanations, examples, or calculations
- Difficulty distribution: Easy questions test recall, Medium test application, Hard test analysis/evaluation
- For sciences: include numerical/calculation-based questions in long answer
- For languages: include comprehension, grammar, writing sections as appropriate
- Make questions unique and avoid repetition`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      cls,
      subject,
      chapters,
      totalMarks,
      mcqCount,
      shortCount,
      longCount,
      difficulty,
      examType,
    } = body as {
      cls: string;
      subject: string;
      chapters: string[];
      totalMarks: number;
      mcqCount: number;
      shortCount: number;
      longCount: number;
      difficulty: "easy" | "medium" | "hard" | "mixed";
      examType: string;
    };

    if (!cls || !subject) {
      return new Response(JSON.stringify({ error: "Class and subject required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const chapterStr =
      chapters && chapters.length > 0
        ? `Chapters: ${chapters.join(", ")}`
        : "All chapters covered so far";

    const difficultyMap = {
      easy: "80% easy (recall-based), 20% medium",
      medium: "20% easy, 60% medium (application), 20% hard",
      hard: "20% medium, 80% hard (analysis/evaluation)",
      mixed: "30% easy, 40% medium, 30% hard",
    };

    const shortMarks = Math.round(totalMarks * 0.3 / (shortCount || 1));
    const longMarks = Math.round(totalMarks * 0.5 / (longCount || 1));

    const prompt = `Generate a complete question paper with the following specifications:

Class: ${cls}
Subject: ${subject}
${chapterStr}
Exam Type: ${examType || "Unit Test"}
Total Marks: ${totalMarks}

Question Breakdown:
- Section A (MCQ): ${mcqCount} questions × 1 mark = ${mcqCount} marks
- Section B (Short Answer): ${shortCount} questions × ${shortMarks} marks = ${shortCount * shortMarks} marks
- Section C (Long Answer): ${longCount} questions × ${longMarks} marks = ${longCount * longMarks} marks

Difficulty: ${difficultyMap[difficulty] || difficultyMap.mixed}

Generate the complete question paper in the prescribed format including the answer key at the end.`;

    const stream = await client.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: QUESTION_PAPER_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
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
