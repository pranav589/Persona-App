"use client";

import React from "react";
import { Coffee, Flame, ShieldAlert, Sparkles, Terminal, BookOpen } from "lucide-react";
import { StaticPersona } from "@/lib/agents/personas";
import { PersonaId } from "@/types/chat";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface PersonaSidebarProps {
  activePersona: PersonaId;
  setActivePersona: (id: PersonaId) => void;
  hiteshChaiLevel: number;
  setHiteshChaiLevel: (val: number) => void;
  piyushRoastLevel: number;
  setPiyushRoastLevel: (val: number) => void;
  personas: Record<string, StaticPersona>;
}

export const PersonaSidebar: React.FC<PersonaSidebarProps> = ({
  activePersona,
  setActivePersona,
  hiteshChaiLevel,
  setHiteshChaiLevel,
  piyushRoastLevel,
  setPiyushRoastLevel,
  personas,
}) => {
  const currentPersona = personas[activePersona];

  const getHiteshSliderLabel = (val: number) => {
    switch (val) {
      case 0:
        return "Mild (Clear & Concise)";
      case 1:
        return "Strong (Balanced & Warm)";
      case 2:
        return "Kadak (Rich Stories & CAS)";
      default:
        return "Balanced";
    }
  };

  const getPiyushSliderLabel = (val: number) => {
    switch (val) {
      case 0:
        return "Mild (Encouraging)";
      case 1:
        return "Constructive (PR Review)";
      case 2:
        return "Brutal (Roast Mode ⚡)";
      default:
        return "Constructive";
    }
  };

  return (
    <div className="w-full lg:w-80 h-full flex flex-col border-r border-border/30 bg-card/25 backdrop-blur-xl transition-all duration-300 relative z-20">
      {/* Upper Panel: Persona Selection */}
      <div className="p-4 border-b border-border/30 flex flex-col gap-3">
        <div className="flex items-center justify-between select-none">
          <span className="text-[11px] font-mono text-muted-foreground/80 uppercase tracking-wider">ACTIVE AGENT</span>
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-500 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
            ONLINE
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mt-1">
          {Object.values(personas).map((p) => {
            const isSelected = p.id === activePersona;
            return (
              <Button
                key={p.id}
                variant="ghost"
                onClick={() => setActivePersona(p.id)}
                className={`relative flex flex-col items-center justify-center p-3 h-20 rounded-xl border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                  isSelected
                    ? `${p.accentBorder} bg-card/60 shadow-premium text-foreground`
                    : "border-border/40 bg-card/30 hover:bg-card/50 hover:border-border/60 text-muted-foreground"
                }`}
              >
                {/* Visual Avatar */}
                <div className={`w-8 h-8 rounded-lg overflow-hidden relative border transition-all duration-300 flex-shrink-0 ${
                  isSelected ? p.accentBorder : "border-border/40"
                }`}>
                  <Image
                    src={p.avatar}
                    alt={p.name}
                    width={32}
                    height={32}
                    className="object-cover w-full h-full"
                  />
                </div>
                <span
                  className={`text-[11px] font-semibold mt-2 transition-all duration-300 ${
                    isSelected ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {p.name.split(" ")[0]}
                </span>

                {isSelected && (
                  <span className={`absolute top-1.5 right-1.5 w-1 h-1 rounded-full ${p.accentDot} shadow-[0_0_6px_currentColor]`} />
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Main Content: Info & Controls */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Info Card */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 select-none">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="text-xs font-semibold text-muted-foreground">Persona Profile</span>
          </div>

          <div className="rounded-xl border border-border/40 bg-card/20 p-4 space-y-3.5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden relative border border-border/40 shadow-sm flex-shrink-0 select-none">
                <Image
                  src={currentPersona.avatar}
                  alt={currentPersona.name}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-foreground tracking-tight">{currentPersona.name}</h3>
                <p className="text-[11px] text-muted-foreground/80 font-mono">Role: Tech Educator</p>
              </div>
            </div>

            <p className="text-[12px] leading-relaxed text-muted-foreground/95 font-light">{currentPersona.bio}</p>

            {/* Traits */}
            <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-border/30">
              {currentPersona.traits.map((t, idx) => (
                <span
                  key={idx}
                  className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-full border border-border/40 bg-muted/40 text-muted-foreground/90 transition-all duration-200 hover:bg-muted/80"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Controls Card */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 select-none">
            <Terminal className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="text-xs font-semibold text-muted-foreground">Behavior Controls</span>
          </div>

          <div className="rounded-xl border border-border/40 bg-card/20 p-4 space-y-5 shadow-sm backdrop-blur-sm">
            {activePersona === "hitesh" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono select-none">
                  <span className="text-muted-foreground">CHAI STEEPING</span>
                  <span className="text-amber-500 font-semibold tnum">{hiteshChaiLevel}/2</span>
                </div>
                <Slider
                  defaultValue={[hiteshChaiLevel]}
                  value={[hiteshChaiLevel]}
                  onValueChange={(val) => {
                    if (Array.isArray(val)) {
                      setHiteshChaiLevel(val[0]);
                    } else if (typeof val === "number") {
                      setHiteshChaiLevel(val);
                    }
                  }}
                  min={0}
                  max={2}
                  step={1}
                  className="cursor-pointer transition-transform hover:scale-[1.01]"
                />
                <p className="text-[10px] text-muted-foreground/80 font-mono mt-1 select-none">
                  Active: {getHiteshSliderLabel(hiteshChaiLevel)}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono select-none">
                  <span className="text-muted-foreground">ROAST INTENSITY</span>
                  <span className="text-cyan-500 font-semibold tnum">{piyushRoastLevel}/2</span>
                </div>
                <Slider
                  defaultValue={[piyushRoastLevel]}
                  value={[piyushRoastLevel]}
                  onValueChange={(val) => {
                    if (Array.isArray(val)) {
                      setPiyushRoastLevel(val[0]);
                    } else if (typeof val === "number") {
                      setPiyushRoastLevel(val);
                    }
                  }}
                  min={0}
                  max={2}
                  step={1}
                  className="cursor-pointer transition-transform hover:scale-[1.01]"
                />
                <p className="text-[10px] text-muted-foreground/80 font-mono mt-1 select-none">
                  Active: {getPiyushSliderLabel(piyushRoastLevel)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      
    </div>
  );
};
