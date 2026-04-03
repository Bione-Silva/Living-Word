import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Brain, Send } from 'lucide-react';
import { useState } from 'react';

const mindNames: Record<string, string> = {
  'billy-graham': 'Billy Graham',
  'charles-spurgeon': 'Charles Spurgeon',
  'martyn-lloyd-jones': 'Martyn Lloyd-Jones',
};

export default function MenteChat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [message, setMessage] = useState('');
  const name = mindNames[id || ''] || 'Mentor';
  const initials = name.split(' ').map(w => w[0]).join('');

  const placeholder: Record<string, string> = {
    PT: `Pergunte algo a ${name}...`,
    EN: `Ask ${name} something...`,
    ES: `Pregunta algo a ${name}...`,
  };

  const comingSoon: Record<string, string> = {
    PT: 'Chat em breve. A mente está se preparando para você.',
    EN: 'Chat coming soon. The mind is preparing for you.',
    ES: 'Chat próximamente. La mente se está preparando para ti.',
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate('/mentes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(43,55%,58%)]/30 to-[hsl(43,55%,58%)]/10 border-2 border-[hsl(43,55%,58%)]/40 flex items-center justify-center">
          <span className="text-sm font-display font-bold text-[hsl(43,55%,58%)]">{initials}</span>
        </div>
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">{name}</h2>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] text-emerald-500">Online</span>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Brain className="h-12 w-12 mx-auto text-[hsl(43,55%,58%)]/40" />
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">{comingSoon[lang]}</p>
        </div>
      </div>

      {/* Input */}
      <div className="pt-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder[lang]}
            className="flex-1 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(43,55%,58%)]/30"
          />
          <Button size="icon" className="h-11 w-11 rounded-xl bg-[hsl(43,55%,58%)] hover:bg-[hsl(43,55%,65%)] text-[hsl(210,40%,6%)]">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
