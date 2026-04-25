import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import '@/styles/cea-theme.css';

const T: Record<string, Record<string, string>> = {
  title: { PT:'Meu Progresso', EN:'My Progress', ES:'Mi Progreso' },
  sub: { PT:'Streak, conquistas, histórico de estudos e dashboard de desempenho.', EN:'Streak, achievements, study history and performance dashboard.', ES:'Racha, logros, historial de estudios y panel de rendimiento.' },
  back: { PT:'← Voltar', EN:'← Back', ES:'← Volver' },
  totalHours: { PT:'Total de horas', EN:'Total hours', ES:'Total de horas' },
  streak: { PT:'Streak atual', EN:'Current streak', ES:'Racha actual' },
  quizAcc: { PT:'Precisão Quiz', EN:'Quiz accuracy', ES:'Precisión Quiz' },
  up: { PT:'↑ esta semana', EN:'↑ this week', ES:'↑ esta semana' },
  days: { PT:'dias', EN:'days', ES:'días' },
  achievements: { PT:'Conquistas', EN:'Achievements', ES:'Logros' },
  modules: { PT:'Progresso por módulo', EN:'Progress by module', ES:'Progreso por módulo' },
};
const t = (k: string, l: string) => T[k]?.[l] || T[k]?.PT || k;

const STATS = [
  { label:'totalHours', value:'24h', sub:'+3h', subKey:'up' },
  { label:'streak', value:'7', sub:'', subKey:'days' },
  { label:'quizAcc', value:'78%', sub:'+5%', subKey:'up' },
];

const ACHIEVEMENTS = [
  { icon:'🏆', name:{ PT:'Primeiro Estudo', EN:'First Study', ES:'Primer Estudio' }, pts:'50 XP', locked:false },
  { icon:'🔥', name:{ PT:'Streak 7 dias', EN:'7-Day Streak', ES:'Racha 7 días' }, pts:'100 XP', locked:false },
  { icon:'📖', name:{ PT:'10 Parábolas', EN:'10 Parables', ES:'10 Parábolas' }, pts:'150 XP', locked:false },
  { icon:'🎯', name:{ PT:'Quiz Perfeito', EN:'Perfect Quiz', ES:'Quiz Perfecto' }, pts:'200 XP', locked:true },
  { icon:'👤', name:{ PT:'50 Personagens', EN:'50 Characters', ES:'50 Personajes' }, pts:'250 XP', locked:true },
  { icon:'🔬', name:{ PT:'Mestre do Grego', EN:'Greek Master', ES:'Maestro del Griego' }, pts:'300 XP', locked:true },
  { icon:'📚', name:{ PT:'66 Livros', EN:'66 Books', ES:'66 Libros' }, pts:'500 XP', locked:true },
  { icon:'⭐', name:{ PT:'Teólogo Completo', EN:'Complete Theologian', ES:'Teólogo Completo' }, pts:'1000 XP', locked:true },
];

const MODS = [
  { icon:'📖', name:{ PT:'Parábolas', EN:'Parables', ES:'Parábolas' }, pct:20, color:'#14B8A6' },
  { icon:'👤', name:{ PT:'Personagens', EN:'Characters', ES:'Personajes' }, pct:10, color:'#3B82F6' },
  { icon:'📚', name:{ PT:'Panorama', EN:'Overview', ES:'Panorama' }, pct:30, color:'#F59E0B' },
  { icon:'🔬', name:{ PT:'Original', EN:'Original', ES:'Original' }, pct:15, color:'#F97316' },
  { icon:'🎯', name:{ PT:'Quiz', EN:'Quiz', ES:'Quiz' }, pct:40, color:'#7C3AED' },
];

export default function CEAProgresso() {
  const { lang } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="cea-scope cea-fade-in" style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden' }}>
      <div className="cea-prog-scroll">
        <button onClick={() => navigate('/estudos')} style={{ background:'none', border:'none', color:'var(--cea-purple)', cursor:'pointer', fontSize:12, marginBottom:12, fontFamily:"'DM Sans',sans-serif" }}>{t('back', lang)}</button>
        <div className="cea-grid-title">{t('title', lang)}</div>
        <div className="cea-grid-sub">{t('sub', lang)}</div>

        {/* Stats */}
        <div className="cea-prog-grid">
          {STATS.map((s, i) => (
            <div key={i} className="cea-prog-stat">
              <div className="cea-psc-label">{t(s.label, lang)}</div>
              <div className="cea-psc-val">{s.value}{s.subKey === 'days' ? ` ${t('days', lang)}` : ''}</div>
              {s.sub && <div className="cea-psc-sub">{s.sub} {t(s.subKey, lang)}</div>}
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div className="cea-section-head"><div className="cea-section-title">{t('achievements', lang)}</div></div>
        <div className="cea-ach-grid">
          {ACHIEVEMENTS.map((a, i) => (
            <div key={i} className={`cea-achievement${a.locked ? ' locked' : ''}`}>
              <div className="cea-ach-icon">{a.icon}</div>
              <div className="cea-ach-name">{a.name[lang as keyof typeof a.name] || a.name.PT}</div>
              <div className="cea-ach-pts">{a.pts}</div>
            </div>
          ))}
        </div>

        {/* Module progress */}
        <div className="cea-section-head"><div className="cea-section-title">{t('modules', lang)}</div></div>
        <div className="cea-mp-list">
          {MODS.map((m, i) => (
            <div key={i} className="cea-mp-item">
              <div className="cea-mp-icon">{m.icon}</div>
              <div className="cea-mp-info">
                <div className="cea-mp-name">{m.name[lang as keyof typeof m.name] || m.name.PT}</div>
                <div className="cea-mp-track"><div className="cea-mp-fill" style={{ width:`${m.pct}%`, background:m.color }} /></div>
              </div>
              <div className="cea-mp-pct" style={{ color:m.color }}>{m.pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
