import { OpenAI } from "openai";
import { getSystemPrompt } from "./personas";
import { getWeather, webSearch, searchYouTube } from "./tools";

export interface AgentRunParams {
  messages: any[];
  persona: string;
  paramLevel: number;
  openaiApiKey: string;
  openrouterApiKey?: string;
}

const encoder = new TextEncoder();

function parseToolCall(
  text: string,
): { toolName: string; query: string; fullMatch: string } | null {
  const regex = /\[TOOL:\s*(\w+)\s*\((["'])(.*?)\2\)\s*\]/;
  const match = regex.exec(text);

  if (match) {
    return {
      toolName: match[1],
      query: match[3],
      fullMatch: match[0],
    };
  }
  return null;
}

export function runAgentStream(params: AgentRunParams): ReadableStream {
  const { messages, persona, paramLevel, openrouterApiKey } = params;

  const openai = new OpenAI({
    baseURL: "https://api.mistral.ai/v1",
    apiKey: openrouterApiKey,
  });

  const systemPrompt = getSystemPrompt(persona, paramLevel);

  // Initial messages array for OpenAI
  const apiMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m: any) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
  ];

  return new ReadableStream({
    async start(controller) {
      const activeMessages = [...apiMessages];
      let runIteration = 0;
      const maxIterations = 3; // Prevent infinite tool loops

      while (runIteration < maxIterations) {
        try {
          const completion = await openai.chat.completions.create({
            model: "mistral-small-2603",
            messages: activeMessages,
            stream: true,
            temperature: 0.7,
          });

          let accumulatedText = "";
          let toolCalled = false;

          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (!text) continue;

            accumulatedText += text;

            // Check if we contain a potential tool call start
            const toolInfo = parseToolCall(accumulatedText);

            if (toolInfo && !toolCalled) {
              toolCalled = true;

              // Stream the text up to the tool call start (if any)
              const preToolText = accumulatedText.split(toolInfo.fullMatch)[0];
              if (preToolText) {
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({ type: "text", content: preToolText }) +
                      "\n",
                  ),
                );
              }

              // Notify client of tool start
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "tool_start",
                    tool: toolInfo.toolName,
                    query: toolInfo.query,
                  }) + "\n",
                ),
              );

              // Run the tool on the server
              let toolResult = "";
              if (toolInfo.toolName === "get_weather") {
                const res = await getWeather(toolInfo.query);
                toolResult = JSON.stringify(res);
              } else if (toolInfo.toolName === "web_search") {
                const res = await webSearch(toolInfo.query);
                toolResult = JSON.stringify(res);
              } else if (toolInfo.toolName === "search_youtube") {
                const res = await searchYouTube(toolInfo.query, persona);
                toolResult = JSON.stringify(res);
              } else {
                toolResult = JSON.stringify({
                  error: `Unknown tool: ${toolInfo.toolName}`,
                });
              }

              // Notify client of tool end with results
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "tool_end",
                    tool: toolInfo.toolName,
                    query: toolInfo.query,
                    result: toolResult,
                  }) + "\n",
                ),
              );

              // Append assistant message  and the tool result message to the history
              activeMessages.push({
                role: "assistant",
                content: accumulatedText,
              });
              activeMessages.push({
                role: "user", // Feed tool result as user instruction context for next completion
                content: `[TOOL OUTPUT for ${toolInfo.toolName}("${toolInfo.query}")]: ${toolResult}\n\nBased on these search/tool results, finish your explanation or answer in your persona style.`,
              });

              break; // Break the stream iteration loop to start a new OpenAI call
            }
          }

          // If a tool was called  break the loop and start the next iteration with OpenAI
          if (toolCalled) {
            runIteration++;
            continue;
          }

          // If no tool was called stream the remaining text and close the connection
          if (accumulatedText && !toolCalled) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ type: "text", content: accumulatedText }) +
                  "\n",
              ),
            );
          }
          break; // Finished generation without tool calls
        } catch (err: any) {
          console.error("OpenAI stream error:", err);
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                message: `AI generation failed: ${err.message}`,
              }) + "\n",
            ),
          );
          break;
        }
      }
      controller.close();
    },
  });
}
