import { NextRequest } from "next/server";
import { runAgentStream } from "@/lib/agents/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

export async function POST(req: NextRequest) {
  try {
    const { messages, persona, paramLevel } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        encoder.encode(
          JSON.stringify({
            type: "error",
            message:
              "OpenAI API Key is missing. Please add OPENAI_API_KEY to your .env.local file in the project root.",
          }) + "\n",
        ),
        {
          headers: { "Content-Type": "application/x-ndjson" },
        },
      );
    }

    // Delegate stream generation to the agent controller
    const stream = runAgentStream({
      messages,
      persona,
      paramLevel,
      openaiApiKey: apiKey,
      openrouterApiKey: process.env.OPENROUTER_API_KEY,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("API POST error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
