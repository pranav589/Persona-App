"use client";

import React, { useState } from "react";
import { Trash2, AlertCircle, Menu } from "lucide-react";
import { Message, PersonaId, ToolCallState } from "@/types/chat";
import { personas } from "@/lib/agents/personas";
import { PersonaSidebar } from "@/components/persona-sidebar";
import { ChatFeed } from "@/components/chat-feed";
import { ChatInput } from "@/components/chat-input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import Image from "next/image";

export default function WorkspacePage() {
  const [activePersona, setActivePersona] = useState<PersonaId>("hitesh");
  const [hiteshChaiLevel, setHiteshChaiLevel] = useState<number>(1);
  const [piyushRoastLevel, setPiyushRoastLevel] = useState<number>(1);

  const [hiteshMessages, setHiteshMessages] = useState<Message[]>(() => [
    {
      id: "hitesh-init",
      role: "assistant",
      content: personas.hitesh.initialGreeting,
      timestamp: Date.now(),
      persona: "hitesh",
    },
  ]);
  const [piyushMessages, setPiyushMessages] = useState<Message[]>(() => [
    {
      id: "piyush-init",
      role: "assistant",
      content: personas.piyush.initialGreeting,
      timestamp: Date.now(),
      persona: "piyush",
    },
  ]);

  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeMessages =
    activePersona === "hitesh" ? hiteshMessages : piyushMessages;
  const activeParamsLevel =
    activePersona === "hitesh" ? hiteshChaiLevel : piyushRoastLevel;
  const currentPersona = personas[activePersona];

  const handleClearHistory = () => {
    const defaultMsg: Message = {
      id: `${activePersona}-init-${Date.now()}`,
      role: "assistant",
      content: currentPersona.initialGreeting,
      timestamp: Date.now(),
      persona: activePersona,
    };

    if (activePersona === "hitesh") {
      setHiteshMessages([defaultMsg]);
    } else {
      setPiyushMessages([defaultMsg]);
    }
    setErrorMsg(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setErrorMsg(null);
    const userMessageText = input.trim();
    setInput("");

    // Create user message
    const userMessage: Message = {
      id: Math.random().toString(),
      role: "user",
      content: userMessageText,
      timestamp: Date.now(),
      persona: activePersona,
    };

    const currentMessages = [...activeMessages, userMessage];

    // Update active history immediately
    if (activePersona === "hitesh") {
      setHiteshMessages(currentMessages);
    } else {
      setPiyushMessages(currentMessages);
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: currentMessages,
          persona: activePersona,
          paramLevel: activeParamsLevel,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No readable stream response from server.");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      // Add temporary placeholder for assistant response
      const assistantMessageId = Math.random().toString();
      let assistantContent = "";
      let toolCalls: ToolCallState[] = [];

      // Helper to push update to state
      const updateStreamedResponse = (
        content: string,
        tools: ToolCallState[],
      ) => {
        const updatedMessages: Message[] = [
          ...currentMessages,
          {
            id: assistantMessageId,
            role: "assistant",
            content,
            timestamp: Date.now(),
            persona: activePersona,
            toolCalls: tools.length > 0 ? [...tools] : undefined,
          },
        ];

        if (activePersona === "hitesh") {
          setHiteshMessages(updatedMessages);
        } else {
          setPiyushMessages(updatedMessages);
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Maintain trailing chunk in buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);

            if (data.type === "text") {
              assistantContent += data.content;
              updateStreamedResponse(assistantContent, toolCalls);
            } else if (data.type === "tool_start") {
              toolCalls.push({
                id: Math.random().toString(),
                tool: data.tool,
                query: data.query,
                status: "running",
              });
              updateStreamedResponse(assistantContent, toolCalls);
            } else if (data.type === "tool_end") {
              // Find matching running tool call and update its status & result
              toolCalls = toolCalls.map((tc) => {
                if (
                  tc.tool === data.tool &&
                  tc.query === data.query &&
                  tc.status === "running"
                ) {
                  return { ...tc, status: "success", result: data.result };
                }
                return tc;
              });
              updateStreamedResponse(assistantContent, toolCalls);
            } else if (data.type === "error") {
              setErrorMsg(data.message);
            }
          } catch (e) {
            console.error("Error parsing NDJSON chunk:", e, line);
          }
        }
      }
    } catch (err: any) {
      console.error("Chat message send error:", err);
      setErrorMsg(
        err.message ||
          "Failed to communicate with API. Ensure environment variable is configured.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden bg-background font-sans relative transition-colors duration-300">
      <div className="absolute top-0 inset-x-0 h-[40vh] overflow-hidden pointer-events-none z-0 opacity-40 dark:opacity-0 select-none">
        <div className="absolute inset-0 bg-canvas-soft/80 dark:bg-canvas-soft/10 transition-colors duration-300" />
        <div className="absolute w-[80%] h-[120%] -top-[40%] -left-[10%] bg-[radial-gradient(circle_at_center,#f5e9d4_0%,transparent_60%)] opacity-70 blur-[80px]" />
        <div className="absolute w-[60%] h-[100%] -top-[20%] left-[20%] bg-[radial-gradient(circle_at_center,#9b6829_0%,transparent_65%)] opacity-30 blur-[100px]" />
        <div className="absolute w-[70%] h-[120%] -top-[30%] left-[40%] bg-[radial-gradient(circle_at_center,#f96bee_0%,transparent_60%)] opacity-40 blur-[90px]" />
        <div className="absolute w-[80%] h-[120%] -top-[40%] left-[60%] bg-[radial-gradient(circle_at_center,#533afd_0%,transparent_60%)] opacity-50 blur-[90px]" />
        <div className="absolute w-[60%] h-[100%] -top-[20%] left-[80%] bg-[radial-gradient(circle_at_center,#ea2261_0%,transparent_60%)] opacity-40 blur-[80px]" />
      </div>

      {/* Desktop Sidebar Behavior Settings */}
      <div className="hidden lg:block lg:w-80 h-full flex-shrink-0">
        <PersonaSidebar
          activePersona={activePersona}
          setActivePersona={setActivePersona}
          hiteshChaiLevel={hiteshChaiLevel}
          setHiteshChaiLevel={setHiteshChaiLevel}
          piyushRoastLevel={piyushRoastLevel}
          setPiyushRoastLevel={setPiyushRoastLevel}
          personas={personas}
        />
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-full bg-background/30 relative z-10 overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-border/40 flex items-center justify-between px-6 bg-card/25 backdrop-blur-md z-10 transition-colors duration-300">
          <div className="flex items-center gap-3 select-none">
            {/* Mobile Sidebar Hamburger Trigger */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mr-1 h-8 w-8 cursor-pointer"
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                  }
                />
                <SheetContent
                  side="left"
                  className="p-0 w-80 h-full border-r border-border/30 bg-card/20 backdrop-blur-2xl"
                >
                  <div className="sr-only">
                    <SheetTitle>Behavior Settings</SheetTitle>
                    <SheetDescription>
                      Configure active agent, behavior, and traits.
                    </SheetDescription>
                  </div>
                  <PersonaSidebar
                    activePersona={activePersona}
                    setActivePersona={setActivePersona}
                    hiteshChaiLevel={hiteshChaiLevel}
                    setHiteshChaiLevel={setHiteshChaiLevel}
                    piyushRoastLevel={piyushRoastLevel}
                    setPiyushRoastLevel={setPiyushRoastLevel}
                    personas={personas}
                  />
                </SheetContent>
              </Sheet>
            </div>

            <span className="text-[12px] font-mono text-muted-foreground/80 uppercase tracking-widest hidden sm:inline">
              WORKSPACE //
            </span>
            <span
              className={`text-[12px] font-mono font-medium text-foreground flex items-center gap-2 transition-all duration-300`}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden relative border border-border/40 flex-shrink-0 select-none">
                <Image
                  src={currentPersona.avatar}
                  alt={currentPersona.name}
                  width={20}
                  height={20}
                  className="object-cover w-full h-full"
                />
              </div>
              {currentPersona.name}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Button className={"block md:hidden"} onClick={handleClearHistory}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              className="text-primary hidden md:flex hover:bg-primary-soft/10 border-primary rounded-full text-xs font-semibold px-4 py-1.5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Chat
            </Button>
          </div>
        </header>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="p-4 max-w-4xl mx-auto w-full">
            <Alert
              variant="destructive"
              className="bg-rose-950/20 border-rose-900/60 text-rose-200 rounded-xl"
            >
              <AlertCircle className="h-4 w-4 text-rose-500" />
              <AlertTitle>API Error</AlertTitle>
              <AlertDescription className="text-xs">
                {errorMsg}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Chat Feed */}
        <ChatFeed
          messages={activeMessages}
          isLoading={isLoading}
          activePersona={activePersona}
          personaName={currentPersona.name}
          personaAvatar={currentPersona.avatar}
          accentColor={currentPersona.accentDot}
        />

        {/* Chat Input Compose Box */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={handleSendMessage}
          isLoading={isLoading}
          accentColor={currentPersona.accentDot}
        />
      </div>
    </div>
  );
}
