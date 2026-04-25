import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Trophy, Flame, BookOpen, Brain, Languages,
  Gamepad2, Clock, Star, TrendingUp, Users, Library
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCEAProgress } from '@/hooks/useCEAData';

const ACHIEVEMENTS = [
  { icon: '📖', title: 'Primeira Parábola', desc: 'Completou seu primeiro estudo', pts: 50, unlocked: true },
  { icon: '🔬', title: 'Exegeta', desc: 'Pesquisou 10 palavras no original', pts: 200, unlocked: true },
  { icon: '🏆', title: 'Mestre do Quiz', desc: 'Acertou 100% em um quiz', pts: 300, unlocked: false },
  { icon: '📚', title: 'Panorama Completo', desc: 'Estudou todos os 66 livros', pts: 500, unlocked: false },
  { icon: '👥', title: 'Conhecedor de Personagens', desc: 'Estudou 50 personagens', pts: 250, unlocked: false },
  { icon: '🔥', title: 'Chama Sagrada', desc: '7 dias seguidos de estudo', pts: 350, unlocked: false },
  { icon: '🌟', title: 'Mestre do CEA', desc: 'Completou todos os módulos', pts: 1000, unlocked: false },
  { icon: '💎', title: 'Teólogo Avançado', desc: 'Pesquisou 50 palavras no original', pts: 500, unlocked: false },
];

const MODULE_STATS = [
  { id: 'parabolas', label: 'Parábolas', icon: BookOpen, color: 'bg-amber-500', total: 40 },
  { id: 'personagens', label: 'Personagens', icon: Users, color: 'bg-blue-500', total: 200 },
  { id: 'panorama', label: 'Panorama', icon: Library, color: 'bg-emerald-500', total: 66 },
  { id: 'pesquisa', label: 'Pesquisa', icon: Languages, color: 'bg-purple-500', total: 100 },
  { id: 'quiz', label: 'Quiz', icon: Gamepad2, color: 'bg-rose-500', total: 250 },
];

export default function CEAProgresso() {
  const navigate = useNavigate();
  const { progress, loading, getModuleProgress } = useCEAProgress();

  // Calculate global stats
  const streak = 3; // TODO: calculate from real data
  const totalStudied = progress.filter(p => p.status === 'concluido').length;
  const quizAccuracy = 78; // TODO: calculate from real data
  const wordsResearched = 12; // TODO: calculate from real data

  const OVERVIEW_STATS = [
    { icon: Flame, label: 'Streak', value: `${streak} dias`, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { icon: BookOpen, label: 'Estudos', value: String(totalStudied), color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { icon: Brain, label: 'Quiz %', value: `${quizAccuracy}%`, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: Languages, label: 'Palavras', value: String(wordsResearched), color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { icon: Clock, label: 'Tempo Total', value: '4h 32m', color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { icon: Star, label: 'Pontos', value: '250', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/estudos')} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meu Progresso</h1>
          <p className="text-sm text-muted-foreground">Suas estatísticas e conquistas no CEA</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {OVERVIEW_STATS.map(stat => (
          <div key={stat.label} className="p-4 rounded-xl border border-border bg-card text-center">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Module Progress */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Progresso por Módulo
        </h2>
        <div className="space-y-3">
          {MODULE_STATS.map(mod => {
            const pct = getModuleProgress(mod.id);
            const completed = Math.round((pct / 100) * mod.total);
            return (
              <div key={mod.id} className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${mod.color}/10 flex items-center justify-center`}>
                      <mod.icon className={`w-4 h-4 ${mod.color.replace('bg-', 'text-')}`} />
                    </div>
                    <span className="text-sm font-medium text-foreground">{mod.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{completed} / {mod.total}</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full ${mod.color} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{pct}% concluído</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="pb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          Conquistas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ACHIEVEMENTS.map((ach, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border transition-all ${
                ach.unlocked
                  ? 'border-amber-500/30 bg-amber-50/50'
                  : 'border-border bg-card opacity-60 grayscale'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{ach.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{ach.title}</h3>
                  <p className="text-[10px] text-muted-foreground">{ach.desc}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`text-[9px] ${ach.unlocked ? 'border-amber-500/30 text-amber-600' : ''}`}>
                  +{ach.pts} pts
                </Badge>
                {ach.unlocked && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px]">Desbloqueada</Badge>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
