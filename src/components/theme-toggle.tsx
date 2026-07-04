"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useTheme } from "@/components/theme-provider";

export const ThemeToggle: React.FC = () => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        className="relative flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent hover:border-border/30 rounded-lg overflow-hidden transition-all duration-300 shadow-sm"
        disabled
      >
        <div className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent hover:border-border/30 rounded-lg overflow-hidden transition-all duration-300 shadow-sm animate-fade-in"
      title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
    >
      <motion.div
        initial={false}
        animate={{
          rotate: isDark ? 0 : 90,
          scale: isDark ? 1 : 0,
          opacity: isDark ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="absolute"
      >
        <Moon className="h-4 w-4" />
      </motion.div>
      <motion.div
        initial={false}
        animate={{
          rotate: !isDark ? 0 : -90,
          scale: !isDark ? 1 : 0,
          opacity: !isDark ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="absolute"
      >
        <Sun className="h-4 w-4 text-amber-500" />
      </motion.div>
    </Button>
  );
};
