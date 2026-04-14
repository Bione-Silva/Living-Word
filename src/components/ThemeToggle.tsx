import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial state
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
      setIsDark(false);
    } else {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
      setIsDark(true);
    }
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} title="Alternar tema" className="shrink-0 text-foreground">
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
