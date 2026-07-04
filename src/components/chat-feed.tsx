"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  CloudRain,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  ExternalLink,
} from "lucide-react";
import { Message, ToolCallState, PersonaId } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import Image from "next/image";

const Youtube = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={props.className}
    style={props.style}
  >
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

interface ChatFeedProps {
  messages: Message[];
  isLoading: boolean;
  activePersona: PersonaId;
  personaName: string;
  personaAvatar: string;
  accentColor: string;
}

// Simple Copy Button Component
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md transition-colors duration-250 cursor-pointer"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
};

// Custom ReactMarkdown parser
const parseMarkdown = (text: string, isUser: boolean = false) => {
  if (!text) return null;

  return (
    <ReactMarkdown
      components={{
        a: ({ node, ...props }) => (
          <a
            target="_blank"
            rel="noopener noreferrer"
            className={
              isUser
                ? "text-white/90 hover:text-white font-semibold underline underline-offset-4 decoration-white/30 hover:decoration-white transition-colors cursor-pointer"
                : "text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold underline underline-offset-4 decoration-indigo-600/30 hover:decoration-indigo-600 transition-colors cursor-pointer"
            }
            {...props}
          />
        ),
        code: ({ node, className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || "");
          const isInline = !match;

          return !isInline ? (
            <div className="my-4 overflow-hidden rounded-xl border border-border/40 bg-card/50 shadow-sm transition-all duration-300">
              <div className="flex items-center justify-between border-b border-border/40 bg-muted/40 px-4 py-1.5 text-xs text-muted-foreground font-mono select-none">
                <span>{match[1]}</span>
                <CopyButton text={String(children).replace(/\n$/, "")} />
              </div>
              <pre className="overflow-x-auto p-4 text-xs font-mono text-foreground leading-relaxed bg-card/20">
                <code>{children}</code>
              </pre>
            </div>
          ) : (
            <code
              className={
                isUser
                  ? "px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-white text-xs font-mono"
                  : "px-1.5 py-0.5 rounded bg-muted border border-border/50 text-foreground text-xs font-mono"
              }
              {...props}
            >
              {children}
            </code>
          );
        },
        p: ({ node, ...props }) => (
          <p className={`text-[14px] leading-relaxed font-sans mb-3 last:mb-0 ${isUser ? "text-white" : "text-foreground"}`} {...props} />
        ),
        strong: ({ node, ...props }) => (
          <strong className={`font-semibold ${isUser ? "text-white" : "text-foreground"}`} {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul className={`list-disc pl-5 my-2.5 space-y-1.5 ${isUser ? "text-white/95" : "text-muted-foreground"}`} {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className={`list-decimal pl-5 my-2.5 space-y-1.5 ${isUser ? "text-white/95" : "text-muted-foreground"}`} {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className={`text-[14px] leading-relaxed font-sans ${isUser ? "text-white" : "text-foreground"}`} {...props} />
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
};

// Weather Widget component
const WeatherWidget: React.FC<{ data: string }> = ({ data }) => {
  let weather: any = null;
  try {
    weather = JSON.parse(data);
  } catch {
    // handled below
  }

  if (!weather) {
    return <div className="text-xs text-muted-foreground italic">Failed to render weather data.</div>;
  }

  if (weather.error) {
    return (
      <div className="text-xs text-muted-foreground italic px-2 py-1 bg-muted/30 border border-border/40 rounded-md">
        {weather.error}
      </div>
    );
  }

  return (
    <Card className="my-3 border border-border/40 bg-card/30 backdrop-blur-md max-w-sm shadow-premium transition-all duration-300 hover:scale-[1.01]">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="space-y-1 font-sans">
          <p className="text-[10px] text-muted-foreground/60 font-mono select-none">WEATHER REPORT</p>
          <p className="text-sm font-semibold text-foreground">{weather.location}</p>
          <p className="text-xs text-muted-foreground">{weather.condition}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-light text-foreground tnum">{Math.round(weather.temperature)}°C</p>
          <p className="text-[10px] text-muted-foreground/50 tnum">Feels like {Math.round(weather.apparentTemperature)}°C</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Web Search Results Widget
const SearchWidget: React.FC<{ data: string }> = ({ data }) => {
  const [expanded, setExpanded] = useState(false);

  let results: any = null;
  try {
    results = JSON.parse(data);
  } catch {
    // handled below
  }

  if (!results) {
    return <div className="text-xs text-muted-foreground italic">Failed to render search data.</div>;
  }

  if (results.error) {
    return (
      <div className="text-xs text-muted-foreground italic px-2 py-1 bg-muted/30 border border-border/40 rounded-md">
        {results.error}
      </div>
    );
  }

  if (!Array.isArray(results)) return null;

  return (
    <div className="my-3 border border-border/40 rounded-xl overflow-hidden bg-card/30 backdrop-blur-md max-w-xl shadow-premium transition-all duration-300">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 text-xs font-mono text-muted-foreground hover:bg-muted/60 transition-colors border-b border-border/40 cursor-pointer"
      >
        <span className="flex items-center gap-1.5 select-none">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          Web Search Results (<span className="tnum">{results.length}</span>)
        </span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden divide-y divide-border/20"
          >
            <div className="p-3 space-y-2.5 max-h-[250px] overflow-y-auto">
              {results.slice(0, 4).map((res: any, idx: number) => {
                let hostname = "";
                try {
                  hostname = new URL(res.url).hostname;
                } catch {
                  hostname = "web-search";
                }

                return (
                  <div key={idx} className="space-y-0.5 text-xs font-sans">
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 font-semibold text-foreground hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer group"
                    >
                      {res.title}
                      <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    <p className="text-[10px] text-muted-foreground/60 font-mono select-none">{hostname}</p>
                    <p className="text-muted-foreground leading-normal text-[11px] mt-0.5">{res.snippet}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// YouTube Search Results Widget
const YouTubeWidget: React.FC<{ data: string }> = ({ data }) => {
  const [expanded, setExpanded] = useState(false);

  let videos: any = null;
  try {
    videos = JSON.parse(data);
  } catch {
    // handled below
  }

  if (!videos) {
    return <div className="text-xs text-muted-foreground italic">Failed to render video recommendations.</div>;
  }

  if (videos.error) {
    return (
      <div className="text-xs text-muted-foreground italic px-2 py-1 bg-muted/30 border border-border/40 rounded-md">
        {videos.error}
      </div>
    );
  }

  if (!Array.isArray(videos)) return null;

  const isPlaylist = videos.length > 0 && videos[0].type === "playlist";

  return (
    <div className="my-3 border border-border/40 rounded-xl overflow-hidden bg-card/30 backdrop-blur-md max-w-2xl shadow-premium transition-all duration-300">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 text-xs font-mono text-muted-foreground hover:bg-muted/60 transition-colors border-b border-border/40 cursor-pointer"
      >
        <span className="flex items-center gap-1.5 select-none">
          <Youtube className="h-3.5 w-3.5 text-rose-500" />
          YouTube {isPlaylist ? "Playlists" : "Videos"} Found (<span className="tnum">{videos.length}</span>)
        </span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto">
              {videos.map((vid: any, idx: number) => (
                <a
                  key={idx}
                  href={vid.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col rounded-lg border border-border/40 bg-card/40 overflow-hidden hover:border-border/80 hover:bg-card/60 transition-all duration-200 group cursor-pointer"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {vid.thumbnail ? (
                      <img
                        src={vid.thumbnail}
                        alt={vid.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/60">
                        <Youtube className="h-8 w-8" />
                      </div>
                    )}
                    
                    {vid.type === "playlist" && (
                      <span className="absolute top-1.5 left-1.5 bg-rose-600 text-zinc-100 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shadow select-none">
                        PLAYLIST
                      </span>
                    )}
                  </div>
                  <div className="p-2 flex-grow flex flex-col justify-between font-sans">
                    <p className="text-[11px] font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-rose-500 dark:hover:text-rose-400 transition-colors">
                      {vid.title}
                    </p>
                    <p className="text-[9px] text-muted-foreground/60 font-mono mt-1.5 select-none">{vid.channelTitle}</p>
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Console Log Component for Tool Executions
const ToolBadge: React.FC<{ call: ToolCallState }> = ({ call }) => {
  const getToolIcon = () => {
    switch (call.tool) {
      case "web_search":
        return <Search className="h-3 w-3" />;
      case "search_youtube":
        return <Youtube className="h-3 w-3 text-rose-500" />;
      case "get_weather":
        return <CloudRain className="h-3 w-3 text-cyan-400" />;
    }
  };

  const getToolLabel = () => {
    switch (call.tool) {
      case "web_search":
        return "Searching Web";
      case "search_youtube":
        return "Searching YouTube";
      case "get_weather":
        return "Checking Weather";
    }
  };

  return (
    <div className="flex flex-col gap-1.5 my-2">
      <div className="flex items-center gap-2 text-xs font-mono select-none">
        <span className="p-1 rounded bg-muted border border-border/40 text-muted-foreground">
          {getToolIcon()}
        </span>
        <span className="text-muted-foreground/80">Searching Web for</span>
        <span className="px-1.5 py-0.5 rounded bg-muted/30 border border-border/40 text-foreground font-medium">
          &ldquo;{call.query}&rdquo;
        </span>

        {call.status === "running" && (
          <span className="flex items-center gap-1 text-[10px] text-amber-500 animate-pulse ml-2 font-mono">
            <Terminal className="h-2.5 w-2.5 animate-spin" />
            Executing...
          </span>
        )}

        {call.status === "success" && (
          <span className="text-[10px] text-emerald-500 ml-2 font-mono">✓ Success</span>
        )}

        {call.status === "error" && (
          <span className="text-[10px] text-rose-500 ml-2 font-mono">✗ Error</span>
        )}
      </div>

      {call.status === "success" && call.result && (
        <div className="pl-7">
          {call.tool === "get_weather" && <WeatherWidget data={call.result} />}
          {call.tool === "web_search" && <SearchWidget data={call.result} />}
          {call.tool === "search_youtube" && <YouTubeWidget data={call.result} />}
        </div>
      )}
    </div>
  );
};

export const ChatFeed: React.FC<ChatFeedProps> = ({
  messages,
  isLoading,
  personaName,
  personaAvatar,
  accentColor,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  return (
    <div className="flex-1 w-full overflow-hidden relative">
      <ScrollArea className="h-full w-full px-4 sm:px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-8 pr-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const isUser = message.role === "user";

              // Skip system messages in visual chat feed
              if (message.role === "system") return null;

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className={`flex gap-4 w-full ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="h-8 w-8 rounded-lg border border-border/40 bg-card shadow-sm overflow-hidden flex-shrink-0 relative select-none">
                      <Image
                        src={personaAvatar}
                        alt={personaName}
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? "items-end" : "items-start"} space-y-1`}>
                    {/* Message Header */}
                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/60 select-none">
                      <span>{isUser ? "You" : personaName}</span>
                      <span>•</span>
                      <span className="tnum" suppressHydrationWarning>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {/* Message Content */}
                    <div
                      className={`px-4 py-3 rounded-2xl border text-sm transition-all duration-300 leading-relaxed ${
                        isUser
                          ? "bg-primary text-primary-foreground border-transparent shadow-premium font-sans"
                          : `bg-card/45 border-border/40 border-l-4 ${accentColor.replace("bg-", "border-")} shadow-premium backdrop-blur-[3px] text-foreground`
                      }`}
                    >
                      {/* Visual rendering of tools called during this turn */}
                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className="border-b border-border/30 pb-2.5 mb-3 space-y-1.5">
                          {message.toolCalls.map((call) => (
                            <ToolBadge key={call.id} call={call} />
                          ))}
                        </div>
                      )}

                      {/* Main Message Text (Markdown) */}
                      {parseMarkdown(message.content, isUser)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Active typing loader indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4 w-full justify-start items-center"
            >
              <Avatar className="h-8 w-8 rounded-lg border border-border/40 bg-card animate-pulse shadow-sm">
                <AvatarFallback className="text-[10px] font-mono text-muted-foreground bg-muted select-none" />
              </Avatar>
              <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground select-none">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${accentColor} animate-bounce [animation-delay:-0.3s] shadow-[0_0_6px_currentColor]`} />
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${accentColor} animate-bounce [animation-delay:-0.15s] shadow-[0_0_6px_currentColor]`} />
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${accentColor} animate-bounce shadow-[0_0_6px_currentColor]`} />
                <span className="ml-1.5 italic">{personaName} is thinking...</span>
              </div>
            </motion.div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} className="h-2" />
        </div>
      </ScrollArea>
    </div>
  );
};
