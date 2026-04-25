const fs = require('fs');

const content = fs.readFileSync('src/pages/CEAQuiz.tsx', 'utf8');

const hubStart = content.indexOf(`  if (view === 'hub') {`);

const preHub = content.substring(0, hubStart);

const replacement = `  if (view === 'hub') {
    return (
      <div className="cea-scope view act" id="hub">
        <div className="hub-inner">
          <div className="hub-hero">
            <div className="hub-eyebrow">Living Word · CEA</div>
            <div className="hub-title"><span>Mais de 200</span> Quiz<br/>Bíblico</div>
            <div className="hub-sub">Perguntas e respostas para testar seu conhecimento bíblico.<br/>Do básico ao avançado — escolha sua categoria.</div>
            <div className="hub-stats">
              <div className="hs"><div className="n">200+</div><div className="l">Perguntas</div></div>
              <div className="hs"><div className="n">6</div><div className="l">Categorias</div></div>
              <div className="hs"><div className="n">3</div><div className="l">Níveis</div></div>
            </div>
          </div>

          <div style={{fontSize:13, fontWeight:600, color:'var(--cea-text-1)', marginBottom:12}}>Escolha a categoria</div>
          <div className="cat-grid">
            <div className="cat-card cc-1" onClick={() => setCat('Geral')} style={{ borderColor: cat === 'Geral' ? 'var(--cea-purple)' : 'var(--cea-border)', background: cat === 'Geral' ? 'var(--cea-purple-soft)' : '' }}>
              <div className="cat-icon">📖</div>
              <div><div className="cat-name">Geral</div><div className="cat-count">Todas as perguntas</div></div>
            </div>
            <div className="cat-card cc-2" onClick={() => setCat('Personagens')} style={{ borderColor: cat === 'Personagens' ? 'var(--cea-purple)' : 'var(--cea-border)', background: cat === 'Personagens' ? 'var(--cea-purple-soft)' : '' }}>
              <div className="cat-icon">👤</div>
              <div><div className="cat-name">Personagens</div><div className="cat-count">Reis, profetas, apóstolos</div></div>
            </div>
            <div className="cat-card cc-3" onClick={() => setCat('Jesus')} style={{ borderColor: cat === 'Jesus' ? 'var(--cea-purple)' : 'var(--cea-border)', background: cat === 'Jesus' ? 'var(--cea-purple-soft)' : '' }}>
              <div className="cat-icon">✝️</div>
              <div><div className="cat-name">Vida de Jesus</div><div className="cat-count">Nascimento, ministério, ressurreição</div></div>
            </div>
            <div className="cat-card cc-4" onClick={() => setCat('AT')} style={{ borderColor: cat === 'AT' ? 'var(--cea-purple)' : 'var(--cea-border)', background: cat === 'AT' ? 'var(--cea-purple-soft)' : '' }}>
              <div className="cat-icon">📜</div>
              <div><div className="cat-name">Antigo Testamento</div><div className="cat-count">Patriarcas, Êxodo, Profetas</div></div>
            </div>
            <div className="cat-card cc-5" onClick={() => setCat('NT')} style={{ borderColor: cat === 'NT' ? 'var(--cea-purple)' : 'var(--cea-border)', background: cat === 'NT' ? 'var(--cea-purple-soft)' : '' }}>
              <div className="cat-icon">🕊</div>
              <div><div className="cat-name">Novo Testamento</div><div className="cat-count">Apóstolos, Igreja, Epístolas</div></div>
            </div>
            <div className="cat-card cc-6" onClick={() => setCat('Estrutura')} style={{ borderColor: cat === 'Estrutura' ? 'var(--cea-purple)' : 'var(--cea-border)', background: cat === 'Estrutura' ? 'var(--cea-purple-soft)' : '' }}>
              <div className="cat-icon">🗂</div>
              <div><div className="cat-name">Estrutura da Bíblia</div><div className="cat-count">Livros, capítulos, cânon</div></div>
            </div>
          </div>

          <div className="diff-row">
            <span className="diff-lbl">Nível:</span>
            {[{id:'todos',l:'Todos'}, {id:'fácil',l:'Básico'}, {id:'médio',l:'Intermediário'}, {id:'difícil',l:'Avançado'}].map(d => (
              <button key={d.id} className={\`diff-btn \${diff === d.id ? 'sel' : ''}\`} onClick={() => setDiff(d.id)}>{d.l}</button>
            ))}
          </div>

          <div style={{fontSize:13, fontWeight:600, color:'var(--cea-text-1)', marginBottom:10}}>Quantas perguntas?</div>
          <div className="size-row">
            {[10, 20, 50].map(s => (
              <div key={s} className={\`size-card \${size === s ? 'sel' : ''}\`} onClick={() => setSize(s)}>
                <div className="size-n">{s}</div>
                <div className="size-l">perguntas</div>
                <div className="size-t">~{Math.round(s/2)} min</div>
              </div>
            ))}
          </div>

          <button className="start-btn" onClick={startQuiz}>
            🎯 Iniciar Quiz →
          </button>
        </div>
      </div>
    );
  }

  if (view === 'result') {
    const pct = sessionQs.length > 0 ? Math.round((score / sessionQs.length) * 100) : 0;
    const isWin = pct >= 60;
    
    return (
      <div className="cea-scope view act" id="result">
        <div className="res-inner">
          <div className="res-hero">
            <span className="res-emoji">{pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 50 ? '👍' : '📖'}</span>
            <div className="res-title">{isWin ? 'Parabéns!' : 'Foi quase!'}</div>
            <div className="res-score-big" style={{ color: isWin ? 'var(--cea-green)' : 'var(--cea-gold)' }}>{pct}%</div>
            <div className="res-score-lbl">de acerto geral</div>
          </div>

          <div className="res-grid">
            <div className="res-stat">
              <div className="rs-n green">{score}</div>
              <div className="rs-l">Corretas</div>
            </div>
            <div className="res-stat">
              <div className="rs-n red">{sessionQs.length - score}</div>
              <div className="rs-l">Incorretas</div>
            </div>
            <div className="res-stat">
              <div className="rs-n gold">{bestStreak}</div>
              <div className="rs-l">Maior Combo</div>
            </div>
          </div>

          <div className="msg-box">
            {isWin ? <>Você tem um <strong>ótimo</strong> conhecimento sobre <strong>{cat === 'Geral' ? 'a Bíblia' : cat}</strong>!</> : <>Continue estudando sobre <strong>{cat === 'Geral' ? 'a Bíblia' : cat}</strong>. O CEA está aqui para ajudar.</>}
          </div>

          <div className="res-actions">
            <button className="ra-btn ra-primary" onClick={() => setView('hub')}>Jogar Novamente</button>
            <button className="ra-btn ra-ghost" onClick={() => navigate('/estudos')}>Voltar ao CEA</button>
          </div>

          <div className="review-title">Resumo das suas respostas</div>
          <div>
            {history.map((h, i) => (
              <div className="review-item" key={i}>
                <div className="ri-q">{i+1}. {h.q}</div>
                <div className="ri-row">
                  <div className={\`ri-badge \${h.ok ? 'ri-correct' : 'ri-wrong'}\`}>{h.ok ? 'CORRETO' : 'INCORRETO'}</div>
                  <div className="ri-ans">{h.ok ? h.chosen : \`Sua: \${h.chosen || '—'} · Certa: \${h.correct}\`}</div>
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
  const dashoffset = 94.25 * (1 - timerPct);

  return (
    <div className="cea-scope view act" id="session">
      <div className="sess-top">
        <button className="sess-back" onClick={() => {stopTimer(); setView('hub');}}>←</button>
        <div className="prog-wrap">
          <div className="prog-fill" style={{ width: \`\${Math.max(4, (curIdx / sessionQs.length) * 100)}%\` }}></div>
        </div>
        <div className="sess-counter">{curIdx + 1} / {sessionQs.length}</div>
        <div className="timer-wrap">
          <div className="timer-ring">
            <svg width="38" height="38" viewBox="0 0 38 38">
              <circle cx="19" cy="19" r="15" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="3"/>
              <circle cx="19" cy="19" r="15" fill="none" stroke={timeLeft > 10 ? '#7C3AED' : '#EF4444'} strokeWidth="3"
                strokeDasharray="94.25" strokeDashoffset={dashoffset} strokeLinecap="round" style={{ transition:'stroke-dashoffset 1s linear' }} />
            </svg>
            <div className="timer-num">{timeLeft}</div>
          </div>
        </div>
        <div className="score-badge">✓ {score}</div>
      </div>

      <div className="sess-body">
        <div className="q-wrap fi">
          <div className="streak-bar">
            {streakDots.map((s, i) => (
              <div key={i} className={\`streak-dot \${s} \${i === curIdx ? 'active' : ''}\`}></div>
            ))}
          </div>
          <div className="q-num-lbl">PERGUNTA {curIdx + 1} · {cat}</div>
          <div className="q-card">
            <div className="q-text">{q ? q.q : 'Carregando pergunta...'}</div>
          </div>
          
          <div className="opts">
            {q && Object.entries(q.opts).map(([letter, txt]) => {
              let optClass = "opt";
              if (answered) {
                if (letter === q.c) optClass += " correct";
                else if (letter === chosen) optClass += " wrong";
                optClass += " disabled";
              }
              return (
                <div key={letter} className={optClass} onClick={() => pickAnswer(letter)}>
                  <div className="opt-letter">{letter}</div>
                  <div className="opt-text">{String(txt)}</div>
                </div>
              );
            })}
          </div>

          <div className={\`feedback-box \${answered ? 'show' : ''} \${chosen === q?.c ? 'ok' : 'fail'}\`}>
            <div className={\`fb-result \${chosen === q?.c ? 'ok' : 'fail'}\`}>
              {chosen === q?.c ? '✓ Correto!' : chosen === null ? '⏱ Tempo esgotado!' : '✗ Incorreto'}
            </div>
            {q?.exp && <div className="fb-explain">{q.exp}</div>}
            {!q?.exp && chosen !== q?.c && <div className="fb-explain">A resposta correta era: {q?.opts[q?.c as keyof typeof q.opts]}</div>}
          </div>

          <button className={\`next-btn \${answered ? 'show' : ''}\`} onClick={next}>
            {curIdx + 1 >= sessionQs.length ? 'Finalizar Quiz →' : 'Próxima pergunta →'}
          </button>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/pages/CEAQuiz.tsx', preHub + replacement);
console.log('CEAQuiz updated successfully');
