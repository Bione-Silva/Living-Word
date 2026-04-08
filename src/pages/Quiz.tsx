import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft, Trophy, Gamepad2 } from 'lucide-react';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  back: { PT: 'Voltar', EN: 'Back', ES: 'Volver' },
  title: { PT: 'Quiz Bíblico', EN: 'Bible Quiz', ES: 'Quiz Bíblico' },
  subtitle: {
    PT: 'Teste seus conhecimentos bíblicos e ganhe XP!',
    EN: 'Test your biblical knowledge and earn XP!',
    ES: '¡Pon a prueba tus conocimientos bíblicos y gana XP!',
  },
  coming: {
    PT: 'Em breve! Estamos preparando perguntas incríveis para você.',
    EN: 'Coming soon! We are preparing amazing questions for you.',
    ES: '¡Próximamente! Estamos preparando preguntas increíbles para ti.',
  },
} satisfies Record<string, Record<L, string>>;

export default function Quiz() {
  const { lang } = useLanguage();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> {labels.back[lang]}
      </Link>

      <div className="text-center space-y-3">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          🏆 {labels.title[lang]}
        </h1>
        <p className="text-sm text-muted-foreground">{labels.subtitle[lang]}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
        <Gamepad2 className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <p className="text-sm text-muted-foreground">{labels.coming[lang]}</p>
      </div>
    </div>
  );
}
