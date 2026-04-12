import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Trophy, Zap, CheckCircle2, XCircle, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Leaderboard } from '@/components/quiz/Leaderboard';
import { DailyBonusCard } from '@/components/quiz/DailyBonusCard';

type L = 'PT' | 'EN' | 'ES';

const labels = {
  back: { PT: 'Voltar', EN: 'Back', ES: 'Volver' },
  title: { PT: 'Quiz Bíblico', EN: 'Bible Quiz', ES: 'Quiz Bíblico' },
  subtitle: { PT: 'Teste seus conhecimentos e ganhe XP!', EN: 'Test your knowledge and earn XP!', ES: '¡Pon a prueba tus conocimientos y gana XP!' },
  start: { PT: 'Iniciar Quiz', EN: 'Start Quiz', ES: 'Iniciar Quiz' },
  generating: { PT: 'Gerando perguntas...', EN: 'Generating questions...', ES: 'Generando preguntas...' },
  question: { PT: 'Pergunta', EN: 'Question', ES: 'Pregunta' },
  correct: { PT: 'Correto! 🎉', EN: 'Correct! 🎉', ES: '¡Correcto! 🎉' },
  wrong: { PT: 'Errado!', EN: 'Wrong!', ES: '¡Incorrecto!' },
  next: { PT: 'Próxima', EN: 'Next', ES: 'Siguiente' },
  results: { PT: 'Resultados', EN: 'Results', ES: 'Resultados' },
  score: { PT: 'Pontuação', EN: 'Score', ES: 'Puntuación' },
  xpEarned: { PT: 'XP ganho', EN: 'XP earned', ES: 'XP ganado' },
  playAgain: { PT: 'Jogar novamente', EN: 'Play again', ES: 'Jugar de nuevo' },
  totalXp: { PT: 'XP Total', EN: 'Total XP', ES: 'XP Total' },
  level: { PT: 'Nível', EN: 'Level', ES: 'Nivel' },
  games: { PT: 'Partidas', EN: 'Games', ES: 'Partidas' },
  ranking: { PT: 'Ranking', EN: 'Ranking', ES: 'Ranking' },
} satisfies Record<string, Record<L, string>>;

const categories = [
  { id: 'old-testament', emoji: '📜', label: { PT: 'Antigo Testamento', EN: 'Old Testament', ES: 'Antiguo Testamento' } },
  { id: 'new-testament', emoji: '✝️', label: { PT: 'Novo Testamento', EN: 'New Testament', ES: 'Nuevo Testamento' } },
  { id: 'characters', emoji: '👤', label: { PT: 'Personagens', EN: 'Characters', ES: 'Personajes' } },
  { id: 'parables', emoji: '🌱', label: { PT: 'Parábolas', EN: 'Parables', ES: 'Parábolas' } },
  { id: 'geography', emoji: '🗺️', label: { PT: 'Geografia Bíblica', EN: 'Bible Geography', ES: 'Geografía Bíblica' } },
  { id: 'general', emoji: '📖', label: { PT: 'Conhecimento Geral', EN: 'General Knowledge', ES: 'Conocimiento General' } },
];

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

type Phase = 'hub' | 'loading' | 'playing' | 'result';

interface ScoreData { total_xp: number; games_played: number; best_streak: number; level: number; }

export default function Quiz() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>('hub');
  const [category, setCategory] = useState('general');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [startTime] = useState(Date.now());

  // Load user score
  useEffect(() => {
    if (!user) return;
    supabase.from('quiz_scores').select('*').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => { if (data) setScoreData(data as ScoreData); });
  }, [user]);

  const generateQuestions = async () => {
    setPhase('loading');
    try {
      const cat = categories.find(c => c.id === category);
      const { data, error } = await supabase.functions.invoke('ai-tool', {
        body: {
          systemPrompt: `You are a Bible quiz generator. Generate 10 multiple-choice questions about ${cat?.label.EN || 'the Bible'}.
Each question must have 4 options with exactly one correct answer.
Return ONLY valid JSON array: [{"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}]
- "correct" is the 0-based index of the correct option
- Questions should be in ${lang === 'PT' ? 'Portuguese' : lang === 'ES' ? 'Spanish' : 'English'}
- Mix easy, medium, and hard questions
- Make them educational and interesting`,
          userPrompt: `Generate 10 Bible quiz questions about ${cat?.label[lang]}`,
          toolId: 'bible-quiz',
        },
      });

      if (error) throw error;
      const content = data?.content;
      if (content) {
        const parsed = JSON.parse(content);
        setQuestions(Array.isArray(parsed) ? parsed : []);
        setCurrentQ(0);
        setCorrectCount(0);
        setStreak(0);
        setBestStreak(0);
        setSelected(null);
        setPhase('playing');
      }
    } catch {
      toast.error(lang === 'PT' ? 'Erro ao gerar quiz' : 'Error generating quiz');
      setPhase('hub');
    }
  };

  const handleAnswer = useCallback((idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const q = questions[currentQ];
    if (q && idx === q.correct) {
      setCorrectCount(prev => prev + 1);
      setStreak(prev => {
        const newStreak = prev + 1;
        setBestStreak(best => Math.max(best, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }
  }, [selected, questions, currentQ]);

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      finishQuiz();
    } else {
      setCurrentQ(prev => prev + 1);
      setSelected(null);
    }
  };

  const finishQuiz = async () => {
    const xp = correctCount * 10 + bestStreak * 5;
    const timeSec = Math.round((Date.now() - startTime) / 1000);
    setPhase('result');

    if (!user) return;

    // Save session
    await supabase.from('quiz_sessions').insert({
      user_id: user.id,
      category,
      score: correctCount,
      total_questions: questions.length,
      correct_answers: correctCount,
      xp_earned: xp,
      time_seconds: timeSec,
    });

    // Update accumulated score
    if (scoreData) {
      const newData = {
        total_xp: scoreData.total_xp + xp,
        games_played: scoreData.games_played + 1,
        best_streak: Math.max(scoreData.best_streak, bestStreak),
        level: Math.floor((scoreData.total_xp + xp) / 100) + 1,
      };
      await supabase.from('quiz_scores').update(newData).eq('user_id', user.id);
      setScoreData({ ...scoreData, ...newData });
    } else {
      const newData = { user_id: user.id, total_xp: xp, games_played: 1, best_streak: bestStreak, level: Math.floor(xp / 100) + 1 };
      await supabase.from('quiz_scores').insert(newData);
      setScoreData(newData as ScoreData);
    }
  };

  const xpEarned = correctCount * 10 + bestStreak * 5;
  const q = questions[currentQ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> {labels.back[lang]}
      </Link>

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-display font-bold text-foreground">🏆 {labels.title[lang]}</h1>
        <p className="text-sm text-muted-foreground">{labels.subtitle[lang]}</p>
      </div>

      {/* Stats bar */}
      {scoreData && phase === 'hub' && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Star, label: labels.totalXp[lang], value: scoreData.total_xp },
            { icon: Trophy, label: labels.level[lang], value: scoreData.level },
            { icon: Zap, label: labels.games[lang], value: scoreData.games_played },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-3 text-center">
              <stat.icon className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* HUB */}
      {phase === 'hub' && (
        <div className="space-y-4">
          <DailyBonusCard onXpClaimed={(xp) => {
            if (scoreData) setScoreData({ ...scoreData, total_xp: scoreData.total_xp + xp, level: Math.floor((scoreData.total_xp + xp) / 100) + 1 });
          }} />
          <Leaderboard />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                  category === cat.id
                    ? 'bg-primary/10 border-primary/50 shadow-sm'
                    : 'bg-card border-border hover:border-primary/30'
                }`}
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-xs font-medium text-foreground text-center">{cat.label[lang]}</span>
              </button>
            ))}
          </div>

          <button
            onClick={generateQuestions}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            🎮 {labels.start[lang]}
          </button>
        </div>
      )}

      {/* LOADING */}
      {phase === 'loading' && (
        <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">{labels.generating[lang]}</p>
        </div>
      )}

      {/* PLAYING */}
      {phase === 'playing' && q && (
        <div className="space-y-4">
          {/* Progress & Timer */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {labels.question[lang]} {currentQ + 1}/{questions.length}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="h-3 w-3 text-primary" /> {streak}🔥
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
          </div>

          {/* Question */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
            <p className="text-sm font-semibold text-foreground leading-relaxed">{q.question}</p>

            <div className="space-y-2">
              {q.options.map((opt, idx) => {
                let style = 'bg-background border-border text-foreground hover:border-primary/40';
                if (selected !== null) {
                  if (idx === q.correct) style = 'bg-green-500/10 border-green-500/50 text-green-700';
                  else if (idx === selected) style = 'bg-destructive/10 border-destructive/50 text-destructive';
                  else style = 'bg-muted/50 border-border text-muted-foreground';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={selected !== null}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center gap-3 ${style}`}
                  >
                    <span className="w-6 h-6 rounded-full border border-current/30 flex items-center justify-center text-xs font-bold shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                    {selected !== null && idx === q.correct && <CheckCircle2 className="h-4 w-4 ml-auto shrink-0" />}
                    {selected !== null && idx === selected && idx !== q.correct && <XCircle className="h-4 w-4 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Feedback + explanation */}
            {selected !== null && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className={`text-sm font-medium ${selected === q.correct ? 'text-green-600' : 'text-destructive'}`}>
                  {selected === q.correct ? labels.correct[lang] : labels.wrong[lang]}
                </p>
                {q.explanation && (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">{q.explanation}</p>
                )}
                <button
                  onClick={handleNext}
                  className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  {currentQ + 1 >= questions.length ? labels.results[lang] : labels.next[lang]} →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RESULTS */}
      {phase === 'result' && (
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-2">
            <Trophy className="h-12 w-12 text-primary mx-auto" />
            <h2 className="text-xl font-display font-bold text-foreground">{labels.results[lang]}</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-2xl font-bold text-foreground">{correctCount}/{questions.length}</p>
              <p className="text-[10px] text-muted-foreground">{labels.score[lang]}</p>
            </div>
            <div className="rounded-xl bg-primary/10 p-3">
              <p className="text-2xl font-bold text-primary">+{xpEarned}</p>
              <p className="text-[10px] text-muted-foreground">{labels.xpEarned[lang]}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-2xl font-bold text-foreground">{bestStreak}🔥</p>
              <p className="text-[10px] text-muted-foreground">Best streak</p>
            </div>
          </div>

          <button
            onClick={() => setPhase('hub')}
            className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            🎮 {labels.playAgain[lang]}
          </button>
        </div>
      )}
    </div>
  );
}
