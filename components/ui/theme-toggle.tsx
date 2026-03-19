"use client";

import { Check, Moon, Sun, SunMoon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "system", label: "System", Icon: SunMoon },
] as const;

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const activeTheme = theme ?? "system";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon-sm"
          aria-label="Toggle theme"
          className="relative cursor-pointer overflow-hidden"
        >
          <Sun
            className={cn(
              "relative z-10 h-4 w-4 transition-all duration-300",
              resolvedTheme === "dark" ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
            )}
          />
          <Moon
            className={cn(
              "absolute z-10 h-4 w-4 transition-all duration-300",
              resolvedTheme === "dark" ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0",
            )}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 p-1">
        {themes.map(({ id, label, Icon }) => {
          const isActive = activeTheme === id;
          return (
            <DropdownMenuItem
              key={id}
              onClick={() => setTheme(id)}
              className={cn(
                "relative cursor-pointer px-3 py-2.5 text-xs transition-colors",
                isActive
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-lg border",
                  isActive ? "border-primary/40 bg-primary/10" : "border-border/60 bg-muted/40",
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="flex-1">{label}</span>
              <Check
                className={cn(
                  "h-3.5 w-3.5 transition-opacity",
                  isActive ? "opacity-100" : "opacity-0",
                )}
              />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
