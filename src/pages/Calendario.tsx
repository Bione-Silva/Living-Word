import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Lock, Crown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const monthNames: Record<string, string[]> = {
  PT: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  EN: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ES: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
};

const dayNames: Record<string, string[]> = {
  PT: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  EN: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ES: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
};

export default function Calendario() {
  const { profile } = useAuth();
  const { t, lang } = useLanguage();
  const isFree = profile?.plan === 'free';
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">{t('calendar.title')}</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="font-display text-xl">
              {monthNames[lang]?.[month] || monthNames.PT[month]} {year}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {(dayNames[lang] || dayNames.PT).map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
            {days.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const isSunday = new Date(year, month, day).getDay() === 0;
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

              return (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <div
                      className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm cursor-pointer transition-colors ${
                        isSunday ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-secondary'
                      } ${isToday ? 'ring-2 ring-primary' : ''}`}
                    >
                      {day}
                      {isSunday && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5" />}
                    </div>
                  </TooltipTrigger>
                  {isFree && (
                    <TooltipContent>
                      <p className="text-xs flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Agendar disponível no Pastoral
                      </p>
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {isFree && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5 text-center">
            <Lock className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">Agendamento editorial</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Disponível no plano Pastoral</p>
            <Button size="sm" className="bg-primary text-primary-foreground gap-1" asChild>
              <a href="/upgrade"><Crown className="h-3 w-3" /> {t('upgrade.cta')}</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
