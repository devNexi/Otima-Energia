import { useState, useEffect } from "react";
import { Palette, Zap, Sparkles, Heart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const themes = [
  {
    id: "default",
    name: "Original Trust",
    description: "Corporate Blue & Green. Safe, established.",
    icon: Palette,
    color: "bg-[#2563EB]", // Blue
  },
  {
    id: "violet",
    name: "Future Violet",
    description: "Vibrant Purple & Pink. Modern tech feel.",
    icon: Zap,
    color: "bg-[#8B5CF6]", // Purple
  },
  {
    id: "magenta",
    name: "Electric Magenta",
    description: "Dark mode with Neon Pink. Bold & Disruptive.",
    icon: Sparkles,
    color: "bg-[#EC4899]", // Pink
  },
  {
    id: "lavender",
    name: "Soft Lavender",
    description: "Pastel Purple & Pink. Friendly & Approachable.",
    icon: Heart,
    color: "bg-[#D8B4FE]", // Lavender
  },
];

export function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState("default");

  useEffect(() => {
    // Apply theme to body
    const root = window.document.body;
    
    // Remove all previous theme attributes
    root.removeAttribute("data-theme");
    
    if (currentTheme !== "default") {
      root.setAttribute("data-theme", currentTheme);
    }

    // Special handling for magenta (forces dark mode behavior)
    if (currentTheme === "magenta") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [currentTheme]);

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="lg" 
            className="rounded-full shadow-2xl border-2 border-primary/20 bg-background/80 backdrop-blur-md hover:scale-105 transition-all gap-2"
          >
            <Palette className="w-5 h-5 text-primary" />
            <span className="hidden sm:inline">Change Branding</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72 p-2">
          <DropdownMenuLabel className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
            Select Brand Identity
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {themes.map((theme) => (
            <DropdownMenuItem
              key={theme.id}
              onClick={() => setCurrentTheme(theme.id)}
              className="flex items-start gap-3 p-3 cursor-pointer focus:bg-accent focus:text-accent-foreground rounded-lg mb-1"
            >
              <div className={`w-10 h-10 rounded-full ${theme.color} flex items-center justify-center shrink-0 shadow-sm mt-0.5`}>
                <theme.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">{theme.name}</span>
                  {currentTheme === theme.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-tight">
                  {theme.description}
                </p>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
