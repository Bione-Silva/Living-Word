const fs = require('fs');
const questions = JSON.parse(fs.readFileSync('extracted_questions.json', 'utf8'));

const reactCode = `import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import '@/styles/cea-theme.css';

const T: Record<string, Record<string, string>> = {
  title: { PT:'Quiz Bíblico', EN:'Bible Quiz', ES:'Quiz Bíblico' },
  sub: { PT:'Teste seus conhecimentos com perguntas geradas por IA sobre parábolas, personagens e livros.', EN:'Test your knowledge with AI-generated questions.', ES:'Pon a prueba tus conocimientos.' },
  back: { PT:'← Voltar ao Centro', EN:'← Back to Center', ES:'← Volver' },
  selCat: { PT:'Categoria', EN:'Category', ES:'Categoría' },
  selDiff: { PT:'Dificuldade', EN:'Difficulty', ES:'Dificultad' },
  selSize: { PT:'Perguntas', EN:'Questions', ES:'Preguntas' },
  start: { PT:'Começar Desafio', EN:'Start Challenge', ES:'Iniciar Desafío' },
  question: { PT:'PERGUNTA', EN:'QUESTION', ES:'PREGUNTA' },
  correct: { PT:'✓ Correto!', EN:'✓ Correct!', ES:'✓ Correcto!' },
  wrong: { PT:'✗ Incorreto', EN:'✗ Incorrect', ES:'✗ Incorrecto' },
  timeout: { PT:'⏱ Tempo esgotado!', EN:'⏱ Time\\'s up!', ES:'⏱ Tiempo agotado!' },
  next: { PT:'Avançar →', EN:'Next →', ES:'Siguiente →' },
  finish: { PT:'Ver Resultado', EN:'View Result', ES:'Ver Resultado' },
  resultTitle: { PT:'Seu Resultado', EN:'Your Result', ES:'Tu Resultado' },
  playAgain: { PT:'Jogar Novamente', EN:'Play Again', ES:'Jugar de Nuevo' }
};
const t = (k: string, l: string) => T[k]?.[l] || T[k]?.PT || k;

const FALLBACK_QUESTIONS = ${JSON.stringify(questions, null, 2)};

export default function CEAQuiz() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  
  const [questionsPool, setQuestionsPool] = useState<any[]>(FALLBACK_QUESTIONS);
  
  // Hub states
  const [view, setView] = useState<'hub'|'session'|'result'>('hub');
  const [cat, setCat] = useState('Geral');
  const [diff, setDiff] = useState('todos');
  const [size, setSize] = useState(10);
  
  // Session states
  const [sessionQs, setSessionQs] = useState<any[]>([]);
  const [curIdx, setCurIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [chosen, setChosen] = useState<string|null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [history, setHistory] = useState<any[]>([]);
  const [bestStreak, setBestStreak] = useState(0);
  const [curStreak, setCurStreak] = useState(0);
  const [streakDots, setStreakDots] = useState<string[]>([]);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Fetch external questions from Supabase knowledge.chunks
    const fetchDBQs = async () => {
      try {
        const { data, error } = await supabase
          .schema('knowledge')
          .from('chunks')
          .select('metadata')
          .eq('metadata->>item_type', 'quiz');
        if (data && !error && data.length > 0) {
          const dbQs = data.map(r => r.metadata).filter(m => m && m.q && m.opts && m.c);
          if (dbQs.length > 0) {
            setQuestionsPool(prev => {
              // merge unique based on question text
              const map = new Map(prev.map(p => [p.q, p]));
              dbQs.forEach(dq => map.set(dq.q, dq));
              return Array.from(map.values());
            });
          }
        }
      } catch (err) {}
    };
    fetchDBQs();
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => {
    if (view === 'session' && !answered) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            stopTimer();
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return stopTimer;
  }, [view, answered, curIdx, stopTimer]);

  const startQuiz = () => {
    let pool = [...questionsPool];
    if (cat !== 'Geral') pool = pool.filter(q => q.cat === cat);
    // Shuffle
    pool = pool.sort(() => Math.random() - 0.5);
    const selectedQs = pool.slice(0, Math.min(size, pool.length));
    
    setSessionQs(selectedQs);
    setCurIdx(0);
    setScore(0);
    setBestStreak(0);
    setCurStreak(0);
    setHistory([]);
    setStreakDots(new Array(selectedQs.length).fill('pending'));
    setAnswered(false);
    setChosen(null);
    setTimeLeft(30);
    setView('session');
  };

  const handleTimeout = () => {
    if (answered) return;
    setAnswered(true);
    setChosen(null);
    setCurStreak(0);
    setStreakDots(prev => {
      const n = [...prev];
      n[curIdx] = 'miss';
      return n;
    });
    const q = sessionQs[curIdx];
    setHistory(prev => [...prev, { q: q.q, chosen: null, correct: q.c, ok: false }]);
  };

  const answer = (letter: string) => {
    if (answered) return;
    stopTimer();
    setAnswered(true);
    setChosen(letter);
    const q = sessionQs[curIdx];
    const ok = letter === q.c;
    
    if (ok) {
      setScore(s => s + 1);
      const ns = curStreak + 1;
      setCurStreak(ns);
      if (ns > bestStreak) setBestStreak(ns);
    } else {
      setCurStreak(0);
    }
    
    setStreakDots(prev => {
      const n = [...prev];
      n[curIdx] = ok ? 'hit' : 'miss';
      return n;
    });
    setHistory(prev => [...prev, { q: q.q, chosen: letter, correct: q.c, ok }]);
  };

  const next = async () => {
    if (curIdx + 1 >= sessionQs.length) {
      // Save progress
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await supabase.schema('knowledge').from('user_progress').insert({
            user_id: session.user.id,
            module: 'quiz',
            score: Math.round((score / sessionQs.length) * 100),
            metadata: {
              category: cat,
              size,
              correct: score,
              total: sessionQs.length,
              best_streak: bestStreak
            }
          });
        }
      } catch (err) {}
      setView('result');
    } else {
      setCurIdx(i => i + 1);
      setAnswered(false);
      setChosen(null);
      setTimeLeft(30);
    }
  };

  if (view === 'hub') {
    return (
      <div className="cea-scope cea-fade-in" style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden', overflowY:'auto', background:'var(--cea-bg)', padding:24 }}>
        <button onClick={() => navigate('/estudos')} style={{ background:'none', border:'none', color:'var(--cea-purple)', cursor:'pointer', fontSize:13, marginBottom:16, fontWeight:600, display:'flex', alignItems:'center', gap:6, alignSelf:'flex-start' }}>{t('back', lang)}</button>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <h1 style={{ fontSize:28, fontWeight:800, color:'var(--cea-text-1)', marginBottom:8 }}>{t('title', lang)}</h1>
          <p style={{ color:'var(--cea-text-2)', maxWidth:400, margin:'0 auto' }}>{t('sub', lang)}</p>
        </div>
        
        <div style={{ background:'var(--cea-card-bg)', border:'1px solid var(--cea-border)', borderRadius:16, padding:24, maxWidth:500, margin:'0 auto', width:'100%' }}>
          {/* Categories */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--cea-text-2)', marginBottom:12, textTransform:'uppercase', letterSpacing:0.5 }}>{t('selCat', lang)}</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {['Geral','AT','NT','Personagens','Jesus','Estrutura'].map(c => (
                <button key={c} onClick={() => setCat(c)} style={{ padding:'8px 16px', borderRadius:20, fontSize:14, fontWeight:500, cursor:'pointer', transition:'all 0.2s', background: cat === c ? 'rgba(124,58,237,0.1)' : 'transparent', border: cat === c ? '1px solid var(--cea-purple)' : '1px solid var(--cea-border)', color: cat === c ? 'var(--cea-purple)' : 'var(--cea-text-1)' }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          {/* Difficulty */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--cea-text-2)', marginBottom:12, textTransform:'uppercase', letterSpacing:0.5 }}>{t('selDiff', lang)}</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {[{id:'fácil',l:'Fácil'}, {id:'médio',l:'Médio'}, {id:'difícil',l:'Difícil'}, {id:'todos',l:'Todos'}].map(d => (
                <button key={d.id} onClick={() => setDiff(d.id)} style={{ padding:'8px 16px', borderRadius:20, fontSize:14, fontWeight:500, cursor:'pointer', transition:'all 0.2s', background: diff === d.id ? 'var(--cea-text-1)' : 'transparent', border: diff === d.id ? '1px solid var(--cea-text-1)' : '1px solid var(--cea-border)', color: diff === d.id ? 'var(--cea-bg)' : 'var(--cea-text-1)' }}>
                  {d.l}
                </button>
              ))}
            </div>
          </div>
          {/* Size */}
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--cea-text-2)', marginBottom:12, textTransform:'uppercase', letterSpacing:0.5 }}>{t('selSize', lang)}</div>
            <div style={{ display:'flex', gap:8 }}>
              {[5, 10, 20, 50].map(s => (
                <button key={s} onClick={() => setSize(s)} style={{ flex:1, padding:'12px', borderRadius:12, fontSize:16, fontWeight:600, cursor:'pointer', transition:'all 0.2s', background: size === s ? 'rgba(124,58,237,0.1)' : 'transparent', border: size === s ? '1px solid var(--cea-purple)' : '1px solid var(--cea-border)', color: size === s ? 'var(--cea-purple)' : 'var(--cea-text-1)', textAlign:'center' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <button onClick={startQuiz} style={{ width:'100%', padding:'16px', borderRadius:12, background:'var(--cea-purple)', color:'#fff', fontSize:16, fontWeight:700, border:'none', cursor:'pointer' }}>
            🎯 {t('start', lang)}
          </button>
        </div>
      </div>
    );
  }

  if (view === 'result') {
    const pct = sessionQs.length > 0 ? Math.round((score / sessionQs.length) * 100) : 0;
    const color = pct >= 70 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
    return (
      <div className="cea-scope cea-fade-in" style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden', overflowY:'auto', background:'var(--cea-bg)', padding:24 }}>
        <div style={{ maxWidth:600, margin:'0 auto', width:'100%', textAlign:'center' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>{pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 50 ? '👍' : '📖'}</div>
          <h2 style={{ fontSize:28, fontWeight:800, color:'var(--cea-text-1)', marginBottom:8 }}>{t('resultTitle', lang)}</h2>
          <div style={{ fontSize:48, fontWeight:800, color, marginBottom:8 }}>{pct}%</div>
          <p style={{ color:'var(--cea-text-2)', fontSize:16, marginBottom:32 }}>Você acertou {score} de {sessionQs.length} perguntas. (Maior streak: {bestStreak})</p>
          
          <button onClick={() => setView('hub')} style={{ padding:'14px 32px', borderRadius:30, background:'var(--cea-purple)', color:'#fff', fontSize:16, fontWeight:700, border:'none', cursor:'pointer', marginBottom:40 }}>
            {t('playAgain', lang)}
          </button>

          <div style={{ textAlign:'left', background:'var(--cea-card-bg)', border:'1px solid var(--cea-border)', borderRadius:16, padding:24 }}>
            <h3 style={{ fontSize:18, fontWeight:700, color:'var(--cea-text-1)', marginBottom:16 }}>Resumo</h3>
            {history.map((h, i) => (
              <div key={i} style={{ padding:'12px 0', borderBottom:'1px solid var(--cea-border)' }}>
                <div style={{ fontSize:14, fontWeight:500, color:'var(--cea-text-1)', marginBottom:8 }}>{i+1}. {h.q}</div>
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
                  <span style={{ color: h.ok ? '#10B981' : '#EF4444', fontWeight:700 }}>{h.ok ? '✓' : '✗'}</span>
                  <span style={{ color:'var(--cea-text-2)' }}>Correta: <strong style={{ color:'var(--cea-text-1)' }}>{h.correct}</strong></span>
                  {!h.ok && <span style={{ color:'var(--cea-text-3)' }}>· Sua: {h.chosen || 'tempo'}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const q = sessionQs[curIdx];
  const timerPct = timeLeft / 30;
  const dashoffset = 87.96 * (1 - timerPct);

  return (
    <div className="cea-scope cea-fade-in" style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden', overflowY:'auto', background:'var(--cea-bg)' }}>
      <div style={{ maxWidth:600, margin:'0 auto', width:'100%', padding:24 }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => setView('hub')} style={{ background:'var(--cea-card-bg)', border:'1px solid var(--cea-border)', color:'var(--cea-text-1)', width:36, height:36, borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--cea-text-2)', textTransform:'uppercase', letterSpacing:0.5 }}>{q.cat || 'Geral'}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--cea-card-bg)', padding:'4px 12px', borderRadius:20, border:'1px solid var(--cea-border)' }}>
            <span style={{ color:'#10B981', fontWeight:700 }}>✓ {score}</span>
          </div>
        </div>

        {/* Progress & Streak */}
        <div style={{ background:'var(--cea-card-bg)', borderRadius:16, border:'1px solid var(--cea-border)', padding:16, marginBottom:24, display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ position:'relative', width:40, height:40 }}>
            <svg width="40" height="40" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--cea-border)" strokeWidth="3"/>
              <circle cx="18" cy="18" r="14" fill="none" stroke={timeLeft>10 ? 'var(--cea-purple)' : '#EF4444'} strokeWidth="3" strokeDasharray="87.96" strokeDashoffset={dashoffset} strokeLinecap="round" transform="rotate(-90 18 18)" style={{ transition:'stroke-dashoffset 1s linear' }}/>
            </svg>
            <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'var(--cea-text-1)' }}>{timeLeft}</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:600, color:'var(--cea-text-2)', marginBottom:8 }}>
              <span>{t('question', lang)} {curIdx + 1} / {sessionQs.length}</span>
              <span>🔥 {curStreak}</span>
            </div>
            <div style={{ display:'flex', gap:4 }}>
              {streakDots.map((sd, i) => (
                <div key={i} style={{ flex:1, height:4, borderRadius:2, background: sd === 'hit' ? '#10B981' : sd === 'miss' ? '#EF4444' : i === curIdx ? 'var(--cea-text-1)' : 'var(--cea-border)' }} />
              ))}
            </div>
          </div>
        </div>

        {/* Question */}
        <div style={{ background:'var(--cea-card-bg)', borderRadius:20, border:'1px solid var(--cea-border)', padding:32, marginBottom:24 }}>
          <h2 style={{ fontSize:22, fontWeight:700, color:'var(--cea-text-1)', marginBottom:32, lineHeight:1.4 }}>{q.q}</h2>
          
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {Object.entries(q.opts).map(([letter, text]) => {
              const isCorrectOpt = letter === q.c;
              const isChosen = letter === chosen;
              let bg = 'var(--cea-bg)';
              let border = 'var(--cea-border)';
              let col = 'var(--cea-text-1)';
              
              if (answered) {
                if (isCorrectOpt) { bg = 'rgba(16,185,129,0.1)'; border = '#10B981'; col = '#10B981'; }
                else if (isChosen && !isCorrectOpt) { bg = 'rgba(239,68,68,0.1)'; border = '#EF4444'; col = '#EF4444'; }
              }

              return (
                <button 
                  key={letter}
                  onClick={() => answer(letter)}
                  disabled={answered}
                  style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px', borderRadius:12, background:bg, border:\`1px solid \${border}\`, color:col, cursor: answered ? 'default' : 'pointer', transition:'all 0.2s', textAlign:'left' }}
                >
                  <div style={{ width:28, height:28, borderRadius:'50%', background: answered ? 'transparent' : 'var(--cea-card-bg)', border: answered ? \`1px solid \${col}\` : '1px solid var(--cea-border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color: answered ? col : 'var(--cea-text-2)' }}>
                    {letter}
                  </div>
                  <div style={{ fontSize:15, fontWeight:500, flex:1 }}>{String(text)}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Area */}
        {answered && (
          <div style={{ animation:'fi 0.3s ease forwards' }}>
            <div style={{ padding:20, borderRadius:16, background: chosen === q.c ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: chosen === q.c ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)', marginBottom:24 }}>
              <div style={{ fontSize:16, fontWeight:700, color: chosen === q.c ? '#10B981' : '#EF4444', marginBottom:8 }}>
                {chosen === null ? t('timeout', lang) : chosen === q.c ? t('correct', lang) : t('wrong', lang)}
              </div>
              <div style={{ fontSize:14, color:'var(--cea-text-1)', lineHeight:1.5 }}>
                {chosen === q.c 
                  ? \`Ótimo! A resposta é \${q.c}: \${q.opts[q.c]}\`
                  : \`A resposta correta é \${q.c}: \${q.opts[q.c]}\`}
              </div>
              {q.ex && <div style={{ marginTop:12, fontSize:13, color:'var(--cea-text-2)' }}>{q.ex}</div>}
              {q.ref && <div style={{ marginTop:8, fontSize:12, color:'var(--cea-purple)' }}>Ref: {q.ref}</div>}
            </div>
            
            <button onClick={next} style={{ width:'100%', padding:'16px', borderRadius:12, background:'var(--cea-text-1)', color:'var(--cea-bg)', fontSize:16, fontWeight:700, border:'none', cursor:'pointer' }}>
              {curIdx + 1 >= sessionQs.length ? t('finish', lang) : t('next', lang)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/pages/CEAQuiz.tsx', reactCode);
console.log('Done rewriting CEAQuiz.tsx');
