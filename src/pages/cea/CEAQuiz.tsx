import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Gamepad2, CheckCircle2, XCircle, Clock, Trophy, ArrowRight, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CATEGORIES = [
  { key: 'parabolas', label: 'Parábolas', icon: '📖' },
  { key: 'personagens', label: 'Personagens', icon: '👥' },
  { key: 'panorama', label: 'Panorama', icon: '📚' },
  { key: 'eventos', label: 'Eventos Bíblicos', icon: '⚡' },
  { key: 'geografia', label: 'Geografia', icon: '🗺️' },
  { key: 'doutrina', label: 'Doutrina', icon: '✝️' },
];

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  category: string;
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 1, category: 'parabolas',
    question: 'Em qual evangelho encontramos a Parábola do Bom Samaritano?',
    options: ['Mateus', 'Marcos', 'Lucas', 'João'],
    correct: 2,
    explanation: 'A Parábola do Bom Samaritano é exclusiva do Evangelho de Lucas (10:25-37). Lucas, companheiro de Paulo, enfatiza temas de compaixão e inclusão social.'
  },
  {
    id: 2, category: 'personagens',
    question: 'Quem disse: "Eis que sou a serva do Senhor"?',
    options: ['Ester', 'Rute', 'Maria', 'Ana'],
    correct: 2,
    explanation: 'Maria, mãe de Jesus, pronunciou essas palavras em Lucas 1:38 ao aceitar o anúncio do anjo Gabriel. Sua resposta demonstra submissão à vontade divina.'
  },
  {
    id: 3, category: 'panorama',
    question: 'Quantos livros compõem o Antigo Testamento no cânon protestante?',
    options: ['36', '39', '46', '27'],
    correct: 1,
    explanation: 'O cânon protestante do AT possui 39 livros: do Gênesis a Malaquias. O cânon católico inclui 7 livros deuterocanônicos adicionais, totalizando 46.'
  },
  {
    id: 4, category: 'eventos',
    question: 'Qual foi o primeiro milagre de Jesus registrado no Evangelho de João?',
    options: ['Cura de um cego', 'Multiplicação dos pães', 'Transformação da água em vinho', 'Ressurreição de Lázaro'],
    correct: 2,
    explanation: 'A transformação da água em vinho nas bodas de Caná (João 2:1-11) é o primeiro "sinal" registrado por João, demonstrando a glória de Cristo na esfera do cotidiano.'
  },
  {
    id: 5, category: 'doutrina',
    question: 'A palavra grega "ágape" (ἀγάπη) refere-se a que tipo de amor?',
    options: ['Amor fraternal', 'Amor romântico', 'Amor incondicional e sacrificial', 'Amor à sabedoria'],
    correct: 2,
    explanation: 'Ágape (ἀγάπη) é o amor incondicional, sacrificial e divino — distinto de philía (fraternal) e éros (romântico). É o tipo de amor descrito em 1 Coríntios 13.'
  },
];

type Phase = 'select' | 'playing' | 'result';

export default function CEAQuiz() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(30);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  const questions = SAMPLE_QUESTIONS;
  const current = questions[currentIndex];

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || answered) return;
    if (timer <= 0) {
      handleAnswer(null);
      return;
    }
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [phase, timer, answered]);

  const startQuiz = (category: string) => {
    setSelectedCategory(category);
    setCurrentIndex(0);
    setScore(0);
    setAnswers([]);
    setPhase('playing');
    setTimer(30);
    setSelected(null);
    setAnswered(false);
  };

  const handleAnswer = useCallback((optionIndex: number | null) => {
    if (answered) return;
    setSelected(optionIndex);
    setAnswered(true);
    const correct = optionIndex === current.correct;
    if (correct) setScore(s => s + 1);
    setAnswers(prev => [...prev, optionIndex]);
  }, [answered, current]);

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      setPhase('result');
      return;
    }
    setCurrentIndex(i => i + 1);
    setSelected(null);
    setAnswered(false);
    setTimer(30);
  };

  const restart = () => {
    setPhase('select');
    setSelectedCategory(null);
    setCurrentIndex(0);
    setScore(0);
    setAnswers([]);
  };

  // Timer circle
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (timer / 30) * circumference;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => phase === 'select' ? navigate('/estudos') : restart()} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quiz Bíblico</h1>
          <p className="text-sm text-muted-foreground">Teste seu conhecimento teológico</p>
        </div>
      </div>

      {/* Category Selection */}
      {phase === 'select' && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Escolha uma categoria</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => startQuiz(cat.key)}
                className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all text-center group"
              >
                <span className="text-3xl block mb-3">{cat.icon}</span>
                <h3 className="text-sm font-semibold text-foreground">{cat.label}</h3>
                <p className="text-xs text-muted-foreground mt-1 group-hover:text-primary transition-colors">
                  Iniciar Quiz →
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Playing */}
      {phase === 'playing' && current && (
        <div className="space-y-6">
          {/* Progress + Timer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                {currentIndex + 1} / {questions.length}
              </Badge>
              <div className="h-1.5 w-40 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* SVG Timer Circle */}
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" strokeWidth="4" className="stroke-border" />
                <circle
                  cx="50" cy="50" r="40" fill="none" strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  className={`transition-all duration-1000 ${timer > 10 ? 'stroke-primary' : timer > 5 ? 'stroke-amber-500' : 'stroke-destructive'}`}
                />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${timer > 10 ? 'text-foreground' : timer > 5 ? 'text-amber-500' : 'text-destructive'}`}>
                {timer}
              </span>
            </div>
          </div>

          {/* Question */}
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
            <p className="text-lg font-semibold text-foreground leading-relaxed">{current.question}</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3">
            {current.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              let style = 'border-border bg-card hover:border-primary/30';
              if (answered) {
                if (i === current.correct) style = 'border-emerald-500 bg-emerald-50 text-emerald-900';
                else if (i === selected) style = 'border-destructive bg-red-50 text-destructive';
                else style = 'border-border bg-muted/30 opacity-60';
              } else if (i === selected) {
                style = 'border-primary bg-primary/5';
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={answered}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${style}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-bold shrink-0">
                    {letter}
                  </div>
                  <span className="text-sm font-medium flex-1">{opt}</span>
                  {answered && i === current.correct && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                  {answered && i === selected && i !== current.correct && <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {answered && (
            <div className="rounded-xl border border-border bg-muted/30 p-5 animate-in slide-in-from-bottom-2">
              <p className="text-sm font-semibold text-foreground mb-1">
                {selected === current.correct ? '✅ Correto!' : '❌ Incorreto'}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{current.explanation}</p>
              <button
                onClick={nextQuestion}
                className="mt-4 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                {currentIndex + 1 < questions.length ? 'Próxima' : 'Ver Resultado'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Result */}
      {phase === 'result' && (
        <div className="text-center space-y-6">
          <div className="rounded-2xl border border-border bg-card p-8 md:p-12">
            <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {score} / {questions.length}
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              {score === questions.length ? 'Perfeito! 🏆' : score >= questions.length * 0.7 ? 'Excelente! 🌟' : score >= questions.length * 0.5 ? 'Bom trabalho! 👍' : 'Continue estudando! 📚'}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={restart}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Jogar Novamente
              </button>
              <button
                onClick={() => navigate('/estudos')}
                className="px-5 py-2.5 bg-background border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                Voltar ao CEA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
