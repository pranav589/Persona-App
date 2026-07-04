"use client";

import React, { useRef, useEffect } from "react";
import { Send, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  accentColor: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSubmit,
  isLoading,
  accentColor,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as text grows
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        const form = textareaRef.current?.form;
        if (form) {
          form.requestSubmit();
        }
      }
    }
  };

  const focusBorderClass = accentColor === "bg-amber-500"
    ? "focus-within:border-amber-500/40 focus-within:shadow-[0_0_20px_rgba(245,158,11,0.08)]"
    : "focus-within:border-cyan-500/40 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.08)]";

  return (
    <form onSubmit={onSubmit} className="relative w-full max-w-4xl mx-auto px-4 pb-6 z-10">
      <div className={`relative flex flex-col w-full overflow-hidden rounded-xl border border-border/40 bg-card/45 backdrop-blur-md transition-all duration-300 shadow-premium ${focusBorderClass}`}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask something... (Enter to send, Shift+Enter for new line)"
          rows={1}
          disabled={isLoading}
          className="w-full resize-none bg-transparent py-4 pl-4 pr-16 text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none min-h-[52px] leading-relaxed"
          style={{ height: "auto" }}
        />

        <div className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-border/30 text-[10px] text-muted-foreground/80 font-mono select-none">
          <div className="flex items-center gap-1.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${accentColor} animate-pulse shadow-[0_0_6px_currentColor]`} />
            <span>Ready</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">Shift+Enter for newline</span>
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-7 w-7 rounded-md bg-card border border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:border-border/80 transition-all duration-300 shadow-sm cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};
