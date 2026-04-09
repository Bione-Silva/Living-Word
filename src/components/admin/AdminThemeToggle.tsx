import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export function AdminThemeToggle() {
  const [dark, setDark] = useState(() => {
    return document.documentElement.classList.contains('admin-dark');
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('admin-dark');
    } else {
      document.documentElement.classList.remove('admin-dark');
    }
    return () => document.documentElement.classList.remove('admin-dark');
  }, [dark]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setDark(!dark)}
      className="rounded-full"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
