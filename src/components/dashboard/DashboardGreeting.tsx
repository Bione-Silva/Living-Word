import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export function DashboardGreeting() {
  const { profile } = useAuth();
  const { lang } = useLanguage();
  const name = profile?.full_name?.split(' ')[0] || (lang === 'PT' ? 'Amigo' : lang === 'EN' ? 'Friend' : 'Amigo');

  const greeting = {
    PT: `Olá, ${name}! 👋`,
    EN: `Hello, ${name}! 👋`,
    ES: `Hola, ${name}! 👋`,
  };

  const subtitle = {
    PT: 'Vamos estudar, preparar e criar com mais profundidade hoje.',
    EN: 'Let\'s study, prepare and create with more depth today.',
    ES: 'Vamos a estudiar, preparar y crear con más profundidad hoy.',
  };

  return (
    <div className="px-1">
      <h1 className="font-display text-xl md:text-2xl font-bold text-foreground leading-tight">
        {greeting[lang]}
      </h1>
      <p className="text-muted-foreground text-sm mt-1 leading-relaxed max-w-lg">
        {subtitle[lang]}
      </p>
    </div>
  );
}
