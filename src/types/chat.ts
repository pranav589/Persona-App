export type PersonaId = "hitesh" | "piyush";

export interface ToolCallState {
  id: string;
  tool: "web_search" | "search_youtube" | "get_weather";
  query: string;
  status: "running" | "success" | "error";
  result?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  persona: PersonaId;
  toolCalls?: ToolCallState[];
}

export interface Persona {
  id: PersonaId;
  name: string;
  avatar: string;
  accentColor: string;
  accentBg: string;
  accentText: string;
  bio: string;
  traits: string[];
  sliderLabel: string;
  sliderDefault: number;
  initialGreeting: string;
  systemPrompt: string;
}

export interface ChatConfig {
  activePersona: PersonaId;
  hiteshChaiLevel: number; // 0 = Mild, 1 = Strong, 2 = Kadak
  piyushRoastLevel: number; // 0 = Mild, 1 = Constructive, 2 = Brutal
}
