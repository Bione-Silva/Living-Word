import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import '@/styles/cea-theme.css';

const T: Record<string, Record<string, string>> = {
  title: { PT:'👤 Personagens Bíblicos', EN:'👤 Biblical Characters', ES:'👤 Personajes Bíblicos' },
  sub: { PT:'200 personagens · dados do ebook', EN:'200 characters · ebook data', ES:'200 personajes · datos del ebook' },
  all: { PT:'Todos', EN:'All', ES:'Todos' },
  genSermon: { PT:'Gerar Sermão', EN:'Generate Sermon', ES:'Generar Sermón' },
  carousel: { PT:'Carrossel', EN:'Carousel', ES:'Carrusel' },
};
const t = (k: string, l: string) => T[k]?.[l] || T[k]?.PT || k;

const CHARACTERS_FALLBACK = [
  { n: 1, test: 'AT', periodo: '~2000 aC', nome: 'Abraão', cargo: 'Patriarca / Pai da Fé', tags: ['fé', 'aliança', 'obediência'], progresso: 75, subtitle: 'Pai de uma multidão', viveu: '175 anos', origem: 'Ur dos Caldeus', nomeOriginal: 'Abrão', esposa: 'Sara (Sarai)', filhos: 'Ismael, Isaque +6', referencia: 'Gênesis 11-25', avatar: '/avatars/cea/avatar_abraao_biblical_1776994376723.png' },
  { n: 2, test: 'AT', periodo: '~1400 aC', nome: 'Moisés', cargo: 'Profeta / Libertador', tags: ['liderança', 'lei'], progresso: 100, subtitle: 'Tirado das águas', viveu: '120 anos', origem: 'Egito', nomeOriginal: 'Moisés', esposa: 'Zípora', filhos: 'Gérson, Eliézer', referencia: 'Êxodo a Deuteronômio', avatar: '/avatars/cea/avatar_moises_biblical_1776994390241.png' },
  { n: 3, test: 'AT', periodo: '~1000 aC', nome: 'Davi', cargo: 'Rei / Salmista', tags: ['adoração', 'reino', 'falha'], progresso: 50, subtitle: 'Amado de Deus', viveu: '70 anos', origem: 'Belém', nomeOriginal: 'Davi', esposa: 'Mical, Bate-Seba +', filhos: 'Salomão, Absalão +', referencia: '1 e 2 Samuel', avatar: '/avatars/cea/avatar_davi_biblical_1776994402328.png' },
  { n: 4, test: 'AT', periodo: '~850 aC', nome: 'Elias', cargo: 'Profeta', tags: ['fé', 'confronto'], progresso: 20, subtitle: 'Yahweh é meu Deus', viveu: 'Arrebatado', origem: 'Tisbé', nomeOriginal: 'Elias', esposa: '-', filhos: '-', referencia: '1 Reis 17 - 2 Reis 2', avatar: '/avatars/cea/avatar_elias_biblical_1776994415304.png' },
  { n: 5, test: 'AT', periodo: '~600 aC', nome: 'Daniel', cargo: 'Profeta / Estadista', tags: ['fidelidade', 'visões'], progresso: 10, subtitle: 'Deus é meu juiz', viveu: '~85 anos', origem: 'Jerusalém', nomeOriginal: 'Daniel / Beltessazar', esposa: '-', filhos: '-', referencia: 'Daniel', avatar: '/avatars/cea/avatar_daniel_biblical_1776994427756.png' },
  { n: 6, test: 'NT', periodo: '~30 dC', nome: 'Pedro', cargo: 'Apóstolo', tags: ['liderança', 'falha', 'restauração'], progresso: 5, subtitle: 'Pedra/Rocha', viveu: '~65 anos', origem: 'Betsaida', nomeOriginal: 'Simão', esposa: 'Sim (anônima)', filhos: '-', referencia: 'Evangelhos, Atos', avatar: '/avatars/cea/avatar_pedro_biblical_1776994439141.png' },
  { n: 7, test: 'NT', periodo: '~35-67 dC', nome: 'Paulo', cargo: 'Apóstolo / Missionário', tags: ['missão', 'doutrina'], progresso: 0, subtitle: 'Pequeno', viveu: '~62 anos', origem: 'Tarso', nomeOriginal: 'Saulo', esposa: '-', filhos: '-', referencia: 'Atos, Epístolas', avatar: '/avatars/cea/avatar_paulo_biblical_1776994450844.png' },
];

// Preencher a lista até 200 para mostrar o scroll
for (let i = 8; i <= 200; i++) {
  CHARACTERS_FALLBACK.push({
    n: i,
    test: i <= 150 ? 'AT' : 'NT',
    periodo: 'Processando...',
    nome: `Personagem ${i}`,
    cargo: 'Dados em breve...',
    tags: ['em breve'],
    progresso: 0,
    avatar: '👤'
  });
}

export default function CEAPersonagens() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [characters, setCharacters] = useState<any[]>(CHARACTERS_FALLBACK);
  const [selected, setSelected] = useState<any | null>(CHARACTERS_FALLBACK[0]);
  const [activeTab, setActiveTab] = useState('bio');

  useEffect(() => {
    const fetchCharacters = async () => {
      const { data, error } = await supabase.from('lw_characters').select('*').order('numero');
      if (data && !error && data.length > 0) {
        const fetchedCharacters = data.map(c => {
          const fallback = CHARACTERS_FALLBACK.find(f => f.nome === c.nome) || {};
          return {
            n: c.numero,
            nome: c.nome,
            cargo: c.cargo_funcao,
            periodo: c.periodo_historico || fallback.periodo || 'Período em breve...',
            test: c.testamento,
            tags: c.temas || fallback.tags || [],
            progresso: 0,
            subtitle: c.significado_nome || fallback.subtitle || '',
            viveu: c.idade_morte || fallback.viveu || '',
            origem: fallback.origem || '',
            nomeOriginal: fallback.nomeOriginal || '',
            esposa: fallback.esposa || '',
            filhos: fallback.filhos || '',
            referencia: c.livro_principal || fallback.referencia || '',
            avatar: fallback.avatar || '👤'
          };
        });
        
        const existingIds = new Set(fetchedCharacters.map(c => c.n));
        const missingFallbacks = CHARACTERS_FALLBACK.filter(f => !existingIds.has(f.n));
        
        setCharacters([...fetchedCharacters, ...missingFallbacks].sort((a, b) => a.n - b.n));
      }
    };
    fetchCharacters();
  }, []);

  const filtered = filter === 'all' ? characters : filter === 'at' ? characters.filter(c => c.test === 'AT') : filter === 'nt' ? characters.filter(c => c.test === 'NT') : characters;

  return (
    <div className="cea-scope cea-fade-in" style={{ display:'flex', flex:1, overflow:'hidden' }}>
      <div className="char-layout">
        
        {/* LIST PANEL */}
        <div className="char-list">
          <div className="char-list-header">
            <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', color:'var(--cea-purple)', cursor:'pointer', fontSize:12, marginBottom:12, fontFamily:"'DM Sans',sans-serif", padding: 0 }}>← Voltar</button>
            <div className="cl-title">{t('title', lang)}</div>
            <div className="cl-sub">{t('sub', lang)}</div>
          </div>
          <div className="fbar">
            <button className={`fp ${filter === 'all' ? 'act' : ''}`} onClick={() => setFilter('all')}>Todos</button>
            <button className={`fp ${filter === 'at' ? 'act' : ''}`} onClick={() => setFilter('at')}>AT</button>
            <button className={`fp ${filter === 'nt' ? 'act' : ''}`} onClick={() => setFilter('nt')}>NT</button>
            <button className="fp">Profetas</button>
            <button className="fp">Reis</button>
            <button className="fp">Mulheres</button>
          </div>
          
          {/* Cards */}
          {filtered.map(c => (
            <div key={c.n} className={`ccard ${selected?.n === c.n ? 'sel' : ''}`} onClick={() => { setSelected(c); setActiveTab('bio'); }}>
              <div className="cc-period">#{String(c.n).padStart(3, '0')} · {c.test} · {c.periodo}</div>
              <div className="cc-name">{c.nome}</div>
              <div className="cc-role">{c.cargo}</div>
              <div className="cc-tags">
                {c.tags.map((tg: string) => <span key={tg} className="tag">{tg}</span>)}
              </div>
              <div className="cc-bar"><div className="cc-prog" style={{ width: `${c.progresso || 0}%` }}></div></div>
            </div>
          ))}
        </div>

        {/* DETAIL PANEL */}
        <div className="char-detail">
          {selected ? (
            <>
              {/* HERO */}
              <div className="cd-hero">
                <div className="cd-breadcrumb">Centro de Estudos › Personagens › <span>{selected.nome}</span></div>
                <div className="cd-name-row">
                  <div className="cd-avatar">
                    {selected.avatar?.startsWith('/') ? (
                      <img src={selected.avatar} alt={selected.nome} />
                    ) : (
                      selected.avatar
                    )}
                  </div>
                  <div>
                    <div className="cd-name">{selected.nome}</div>
                    <div style={{ fontSize: '14px', color: 'var(--cea-text-3)', marginTop: '3px', fontFamily: "'Crimson Pro',serif", fontStyle: 'italic' }}>
                      {selected.subtitle}
                    </div>
                    <div className="cd-role-badge">{selected.cargo}</div>
                  </div>
                </div>
                <div className="cd-meta-row">
                  <div className="cd-meta-item"><div className="lbl">Período</div><div className="val">{selected.periodo}</div></div>
                  <div className="cd-meta-item"><div className="lbl">Testamento</div><div className="val">{selected.test === 'AT' ? 'Antigo' : 'Novo'}</div></div>
                  {selected.viveu && <div className="cd-meta-item"><div className="lbl">Viveu</div><div className="val">{selected.viveu}</div></div>}
                  {selected.origem && <div className="cd-meta-item"><div className="lbl">Origem</div><div className="val">{selected.origem}</div></div>}
                  {selected.nomeOriginal && <div className="cd-meta-item"><div className="lbl">Nome original</div><div className="val">{selected.nomeOriginal}</div></div>}
                  {selected.esposa && <div className="cd-meta-item"><div className="lbl">Esposa</div><div className="val">{selected.esposa}</div></div>}
                  {selected.filhos && <div className="cd-meta-item"><div className="lbl">Filhos</div><div className="val">{selected.filhos}</div></div>}
                  {selected.referencia && <div className="cd-meta-item"><div className="lbl">Referência principal</div><div className="val">{selected.referencia}</div></div>}
                </div>
              </div>

              {/* CONTENT TABS */}
              <div className="cd-content">
                <div className="cd-tabs">
                  <div className={`cdtab ${activeTab === 'bio' ? 'act' : ''}`} onClick={() => setActiveTab('bio')}>Biografia</div>
                  <div className={`cdtab ${activeTab === 'timeline' ? 'act' : ''}`} onClick={() => setActiveTab('timeline')}>Linha do Tempo</div>
                  <div className={`cdtab ${activeTab === 'hebraico' ? 'act' : ''}`} onClick={() => setActiveTab('hebraico')}>Hebraico & Nome</div>
                  <div className={`cdtab ${activeTab === 'licoes' ? 'act' : ''}`} onClick={() => setActiveTab('licoes')}>Lições</div>
                  <div className={`cdtab ${activeTab === 'tipologia' ? 'act' : ''}`} onClick={() => setActiveTab('tipologia')}>Tipologia em Cristo</div>
                  <div className={`cdtab ${activeTab === 'nt' ? 'act' : ''}`} onClick={() => setActiveTab('nt')}>No NT</div>
                  <div className={`cdtab ${activeTab === 'fatos' ? 'act' : ''}`} onClick={() => setActiveTab('fatos')}>Fatos Rápidos</div>
                </div>

                {activeTab === 'bio' && (
                  <div className="tc act fi" id="tc-bio">
                    <div className="sec-block">
                      <div className="sec-lbl">Contexto histórico</div>
                      <div className="bio-text">
                        <p>A história de {selected.nome} é fundamental para entender o começo do povo hebreu e sua conexão com a Igreja de Cristo.</p>
                        <p>O Pai de Abraão foi Terá, e sua família era natural da cidade de Ur dos Caldeus, na Mesopotâmia — uma cidade pagã e centro de adoração ao deus da lua. Quando o irmão de Abraão morreu, a família saiu de Ur em direção à terra de Canaã, chegando até Harã (Gênesis 11:31).</p>
                        <p>Em Gênesis 12, Deus chamou Abraão para que saísse daquele cenário de idolatria. Ele deveria deixar para trás sua parentela e partir para uma terra prometida por Deus. Aos 75 anos, partiu com sua esposa Sarai, seu sobrinho Ló, todos os seus servos e bens em direção à terra de Canaã.</p>
                        <p>Após chegar à Palestina, Abraão habitou nas proximidades de Betel, Hebrom e Berseba. Devido à fome, deslocou-se ao Egito, onde omitiu que Sarai era sua esposa — ela era sua irmã por parte de pai (Gênesis 20:12). Mais tarde, Abraão e Ló se separaram pois a terra não comportava os dois. Ló escolheu as planícies do Jordão; Abraão foi para Manre (Hebrom).</p>
                      </div>
                    </div>
                    <div className="sec-block">
                      <div className="sec-lbl">A aliança e o nome mudado</div>
                      <div className="bio-text">
                        <p>No capítulo 17 de Gênesis, com 99 anos, Deus reafirmou sua aliança e mudou o nome de Abrão ("pai exaltado") para Abraão ("pai de uma multidão"). Sua esposa Sarai também teve seu nome mudado para Sara. O sinal da aliança foi a circuncisão.</p>
                        <p>Sara, com 90 anos, deu à luz Isaque — o filho da promessa. Antes, Abraão tivera Ismael com a serva Agar (aos 86 anos), por sugestão de Sara. Deus também prometeu fazer de Ismael uma grande nação — daí a origem dos árabes.</p>
                        <p>O teste máximo de Abraão foi o sacrifício de Isaque. Abraão obedeceu completamente, confiando que Deus poderia ressuscitar o filho. Deus interveio e proveu um cordeiro substituto.</p>
                        <p>Abraão viveu 175 anos e foi sepultado por Isaque e Ismael no campo de Efrom. Tudo que tinha foi dado a Isaque; para os outros filhos, apenas presentes.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="tc act fi" id="tc-timeline">
                    <div className="sec-lbl" style={{ marginBottom: '16px' }}>Cronologia de vida — baseada em Gênesis 11–25</div>
                    <div className="timeline">
                      <div className="tl-item">
                        <div className="tl-dot"></div>
                        <div className="tl-age">~2000 aC · Nascimento</div>
                        <div className="tl-evt">Nascimento em Ur dos Caldeus</div>
                        <div className="tl-desc">Filho de Terá, em uma cidade pagã e centro de culto ao deus da lua. A Bíblia nada fala de sua vida antes dos 75 anos.</div>
                        <div className="tl-ref">Gênesis 11:27-28</div>
                      </div>
                      <div className="tl-item">
                        <div className="tl-dot"></div>
                        <div className="tl-age">Aos 75 anos</div>
                        <div className="tl-evt">O chamado de Deus — saída de Harã</div>
                        <div className="tl-desc">Deus ordenou que deixasse família, terra e parentela. Partiu com Sara, Ló, servos e bens rumo a Canaã. Primeiro grande ato de fé.</div>
                        <div className="tl-ref">Gênesis 12:1-4</div>
                      </div>
                      <div className="tl-item">
                        <div className="tl-dot"></div>
                        <div className="tl-age">Período no Egito</div>
                        <div className="tl-evt">Descida ao Egito por causa da fome</div>
                        <div className="tl-desc">Apresentou Sara como irmã por medo. O Faraó recebeu Sara mas Deus enviou pragas; Sara foi devolvida. Abraão saiu com riquezas.</div>
                        <div className="tl-ref">Gênesis 12:10-20</div>
                      </div>
                      <div className="tl-item">
                        <div className="tl-dot"></div>
                        <div className="tl-age">Separação de Ló</div>
                        <div className="tl-evt">Abraão e Ló se separam</div>
                        <div className="tl-desc">As riquezas de ambos eram grandes demais. Ló escolheu as planícies verdes do Jordão; Abraão foi para Hebrom. Após a guerra, Abraão resgata Ló com 318 servos.</div>
                        <div className="tl-ref">Gênesis 13–14</div>
                      </div>
                      <div className="tl-item">
                        <div className="tl-dot"></div>
                        <div className="tl-age">Gênesis 15</div>
                        <div className="tl-evt">A aliança selada com Deus</div>
                        <div className="tl-desc">"Abraão creu em Deus, e isso lhe foi imputado como justiça." A aliança foi confirmada por um sacrifício animal e a promessa de descendência incontável.</div>
                        <div className="tl-ref">Gênesis 15:6</div>
                      </div>
                      <div className="tl-item">
                        <div className="tl-dot"></div>
                        <div className="tl-age">Aos 86 anos</div>
                        <div className="tl-evt">Nascimento de Ismael com Agar</div>
                        <div className="tl-desc">Sara ofereceu sua serva Agar (costume comum da época). Ismael nasceu — ancestral dos árabes. Tensão entre Sara e Agar.</div>
                        <div className="tl-ref">Gênesis 16</div>
                      </div>
                      <div className="tl-item">
                        <div className="tl-dot"></div>
                        <div className="tl-age">Aos 99 anos</div>
                        <div className="tl-evt">Nome mudado: Abrão → Abraão</div>
                        <div className="tl-desc">Deus reafirma a aliança. O nome é mudado de "pai exaltado" para "pai de uma multidão". Sara tem seu nome mudado. Sinal da aliança: circuncisão.</div>
                        <div className="tl-ref">Gênesis 17</div>
                      </div>
                      <div className="tl-item">
                        <div className="tl-dot"></div>
                        <div className="tl-age">Aos 100 anos</div>
                        <div className="tl-evt">Nascimento de Isaque — o filho da promessa</div>
                        <div className="tl-desc">Isaque, cujo nome significa "riso", nasceu quando Sara tinha 90 anos. Ele se tornou o centro de toda a esperança para o cumprimento das promessas divinas.</div>
                        <div className="tl-ref">Gênesis 21:1-7</div>
                      </div>
                      <div className="tl-item">
                        <div className="tl-dot"></div>
                        <div className="tl-age">O maior teste</div>
                        <div className="tl-evt">Sacrifício de Isaque no monte Moriá</div>
                        <div className="tl-desc">Deus pediu Isaque em sacrifício. Abraão obedeceu completamente. No último momento, Deus interviu e proveu um cordeiro substituto. Tipo da substituição vicária de Cristo.</div>
                        <div className="tl-ref">Gênesis 22</div>
                      </div>
                      <div className="tl-item">
                        <div className="tl-dot"></div>
                        <div className="tl-age">Aos 175 anos</div>
                        <div className="tl-evt">Morte e sepultamento</div>
                        <div className="tl-desc">Abraão foi sepultado por Isaque e Ismael no campo de Efrom. Deixou tudo para Isaque; para os outros filhos, apenas presentes.</div>
                        <div className="tl-ref">Gênesis 25:7-10</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'hebraico' && (
                  <div className="tc act fi" id="tc-hebraico">
                    <div className="sec-block">
                      <div className="sec-lbl">Análise dos nomes</div>
                      <div className="orig-pill">
                        <div className="orig-char">אַבְרָם<br/><span style={{ fontSize: '14px', color: 'var(--cea-text-3)' }}>Abrão</span></div>
                        <div className="orig-info">
                          <strong>Strong's H87 — "pai exaltado" ou "grande pai"</strong><br/>
                          Nome original até Gênesis 17:5. Composto de <em>ab</em> (pai) + <em>ram</em> (alto, exaltado). Era um nome comum no Oriente Médio antigo. A Bíblia usou este nome até os 99 anos de idade.
                        </div>
                      </div>
                      <div className="orig-pill">
                        <div className="orig-char">אַבְרָהָם<br/><span style={{ fontSize: '14px', color: 'var(--cea-text-3)' }}>Abraão</span></div>
                        <div className="orig-info">
                          <strong>Strong's H85 — "pai de uma multidão"</strong><br/>
                          Mudança em Gênesis 17:5. Deus adicionou a sílaba <em>ha</em>, transformando o sentido de "pai grande" para "pai de uma multidão de nações". É um nome profético — cumprido não apenas biologicamente, mas espiritualmente (todos os que creem são filhos de Abraão — Gálatas 3:7).
                          <br/><br/>
                          <span className="strongs">Strong H85</span>&nbsp;&nbsp;<span className="strongs" style={{ background: 'rgba(59,130,246,.12)', color: '#93C5FD' }}>Gênesis 17:5</span>
                        </div>
                      </div>
                      <div className="orig-pill">
                        <div className="orig-char">שָׂרַי / שָׂרָה<br/><span style={{ fontSize: '14px', color: 'var(--cea-text-3)' }}>Sarai → Sara</span></div>
                        <div className="orig-info">
                          <strong>Sarai (H8297) → Sara (H8283) — "princesa"</strong><br/>
                          O nome de Sara também foi mudado em Gênesis 17:15. Ambas as formas significam "princesa" ou "governanta", mas a forma atualizada <em>Sara</em> tem conotação mais ampla — ela seria mãe de nações e de reis.
                        </div>
                      </div>
                    </div>
                    <div className="sec-block">
                      <div className="sec-lbl">Palavras-chave no hebraico</div>
                      <div className="orig-pill">
                        <div className="orig-char">אֱמוּנָה<br/><span style={{ fontSize: '14px', color: 'var(--cea-text-3)' }}>emunah</span></div>
                        <div className="orig-info">
                          <strong>Strong's H530 — "fé, fidelidade, firmeza"</strong><br/>
                          A fé de Abraão não era crença intelectual passiva. Emunah vem da raiz <em>aman</em> — "ser firme, estável, confiável". Quando Abraão "creu em Deus" (Gn 15:6), ele se apoiou sobre a firmeza do caráter de Deus. Paulo cita este versículo 3 vezes no NT (Rm 4:3, Gl 3:6, Tg 2:23).
                        </div>
                      </div>
                      <div className="orig-pill">
                        <div className="orig-char">בְּרִית<br/><span style={{ fontSize: '14px', color: 'var(--cea-text-3)' }}>berit</span></div>
                        <div className="orig-info">
                          <strong>Strong's H1285 — "aliança, pacto"</strong><br/>
                          A aliança com Abraão é o centro teológico de Gênesis. Diferente de um contrato bilateral, a <em>berit</em> em Gênesis 15 foi confirmada por Deus sozinho (passando entre os animais) — indicando que era incondicional. Esta aliança é a base de toda a história da redenção.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'licoes' && (
                  <div className="tc act fi" id="tc-licoes">
                    <div className="sec-lbl" style={{ marginBottom: '12px' }}>5 lições principais de {selected.nome}</div>
                    <div className="llic-grid">
                      <div className="llic-card">
                        <div className="llic-num">01</div>
                        <div className="llic-title">Fé que obedece antes de entender</div>
                        <div className="llic-desc">Abraão saiu "sem saber para onde ia" (Hb 11:8). A fé bíblica não espera certeza total — age em resposta ao caráter de Deus.</div>
                      </div>
                      <div className="llic-card">
                        <div className="llic-num">02</div>
                        <div className="llic-title">Deus cumpre promessas no tempo Dele</div>
                        <div className="llic-desc">Isaque nasceu 25 anos após a promessa. O atraso não significa abandono — a fidelidade de Deus não é medida pelo relógio humano.</div>
                      </div>
                      <div className="llic-card">
                        <div className="llic-num">03</div>
                        <div className="llic-title">Fé não é perfeição</div>
                        <div className="llic-desc">Abraão mentiu sobre Sara duas vezes, gerou Ismael por impotência de esperar, e ainda assim é chamado "amigo de Deus". A graça cobre a falha da fé.</div>
                      </div>
                      <div className="llic-card">
                        <div className="llic-num">04</div>
                        <div className="llic-title">A aliança é incondicional</div>
                        <div className="llic-desc">Em Gênesis 15, Deus fez a aliança sozinho. A permanência das promessas não depende da performance humana, mas do caráter imutável de Deus.</div>
                      </div>
                    </div>
                    <div className="llic-card" style={{ marginBottom: '10px' }}>
                      <div className="llic-num">05</div>
                      <div className="llic-title">O sacrifício de Isaque — a maior lição de confiança</div>
                      <div className="llic-desc">Deus pediu exatamente aquilo que era mais precioso — o filho da promessa. A obediência de Abraão foi completa porque ele confiava que Deus poderia ressuscitar Isaque (Hb 11:19). Esta cena prefigura o sacrifício do Filho de Deus.</div>
                    </div>
                    <div className="insight-box" style={{ marginTop: '16px' }}>
                      <strong>Para líderes:</strong> A fé de Abraão não era otimismo — era convicção baseada no caráter de Deus. Ele não esperou sentir certeza para agir; ele agiu e então a fé cresceu. A obediência precede muitas vezes a compreensão.
                    </div>
                  </div>
                )}

                {activeTab === 'tipologia' && (
                  <div className="tc act fi" id="tc-tipologia">
                    <div className="sec-block">
                      <div className="sec-lbl">Abraão como tipo de Deus Pai</div>
                      <div className="typ-box">
                        <strong>Monte Moriá = Calvário:</strong> Assim como Abraão ofereceu seu filho unigênito amado, Deus Pai ofereceu Seu Filho unigênito (João 3:16). "Toma teu filho, teu único filho, a quem amas, Isaque" (Gn 22:2) — a linguagem é quase idêntica ao NT.
                      </div>
                      <div className="typ-box">
                        <strong>Isaque como tipo de Cristo:</strong> Isaque carregou a madeira do próprio sacrifício (Gn 22:6) — assim como Cristo carregou a cruz. Isaque foi "morto" simbolicamente e "ressurreto" (Hb 11:19).
                      </div>
                      <div className="typ-box">
                        <strong>O carneiro substituto:</strong> O carneiro preso pelos chifres no matagal (Gn 22:13) é tipo do substituto vicário — Cristo, que morreu em nosso lugar. O nome do lugar: "Jeová-Jiré" — "o Senhor proverá".
                      </div>
                      <div className="typ-box">
                        <strong>Abraão como pai de todos os crentes:</strong> Não apenas pai biológico de Israel, mas pai espiritual de todos os que têm fé (Gálatas 3:7, Romanos 4:11). A aliança abraâmica é o fundamento da salvação pela fé.
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'nt' && (
                  <div className="tc act fi" id="tc-nt">
                    <div className="sec-block">
                      <div className="sec-lbl">Abraão no Novo Testamento — citações principais</div>
                      <div className="nt-ref">
                        <div className="nt-ref-ref">Romanos 4:3 — Paulo</div>
                        <div className="nt-ref-txt">"Abraão creu em Deus, e isso lhe foi imputado como justiça." — Paulo usa Abraão para provar que a justificação é pela fé, não pelas obras da lei. Abraão foi justificado antes da circuncisão (antes de qualquer "obra religiosa").</div>
                      </div>
                      <div className="nt-ref">
                        <div className="nt-ref-ref">Gálatas 3:6-9 — Paulo</div>
                        <div className="nt-ref-txt">"Os que são da fé são filhos de Abraão." A promessa feita a Abraão foi feita à sua descendência — que é Cristo. Todo aquele que está em Cristo é herdeiro segundo a promessa.</div>
                      </div>
                      <div className="nt-ref">
                        <div className="nt-ref-ref">Hebreus 11:8-19 — Hall da Fé</div>
                        <div className="nt-ref-txt">"Pela fé, Abraão obedeceu ao ser chamado para ir a um lugar que receberia como herança, e saiu sem saber para onde ia." O capítulo mais importante sobre a fé no NT usa Abraão como exemplo central. Abraão viu "de longe" as promessas (v.13).</div>
                      </div>
                      <div className="nt-ref">
                        <div className="nt-ref-ref">João 8:56 — Jesus</div>
                        <div className="nt-ref-txt">"Abraão, o pai de vocês, exultou ao ver o meu dia; viu-o e ficou cheio de alegria." Jesus declara que Abraão viu o dia de Cristo — a consciência de que a promessa de Gênesis 12:3 apontava para o Messias.</div>
                      </div>
                      <div className="nt-ref">
                        <div className="nt-ref-ref">Tiago 2:23</div>
                        <div className="nt-ref-txt">"Abraão creu em Deus, e isso lhe foi imputado como justiça, e ele foi chamado de amigo de Deus." Tiago usa Abraão para mostrar que a fé genuína produz obras — o sacrifício de Isaque foi a demonstração visível de uma fé já existente.</div>
                      </div>
                      <div className="insight-box" style={{ marginTop: '8px' }}>
                        <strong>Dato:</strong> Abraão é, depois de Moisés, o personagem do Antigo Testamento mais citado no Novo Testamento.
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'fatos' && (
                  <div className="tc act fi" id="tc-fatos">
                    <div className="sec-block">
                      <div className="sec-lbl">Fatos notáveis — extraídos do ebook</div>
                      <ul className="fact-list">
                        <li className="fact-item"><div className="fact-dot"></div>A Bíblia nada fala da vida de Abraão antes dos 75 anos de idade</li>
                        <li className="fact-item"><div className="fact-dot"></div>Abraão era quase nômade, mas era um homem muito poderoso e rico</li>
                        <li className="fact-item"><div className="fact-dot"></div>Era homem de paz, mas utilizava seus 318 servos como exército em conflitos ocasionais</li>
                        <li className="fact-item"><div className="fact-dot"></div>Teve encontros pessoais com Deus — em um deles, Deus em forma humana o visitou com dois anjos</li>
                        <li className="fact-item"><div className="fact-dot"></div>Também recebeu a palavra de Deus em sonhos</li>
                        <li className="fact-item"><div className="fact-dot"></div>Foi chamado pelo próprio Deus de profeta (Gênesis 20:7)</li>
                        <li className="fact-item"><div className="fact-dot"></div>Por duas vezes apresentou Sara como irmã — tecnicamente verdadeiro (irmã por parte de pai)</li>
                        <li className="fact-item"><div className="fact-dot"></div>Abraão é chamado "amigo de Deus" — único título dado a um ser humano neste sentido nas Escrituras</li>
                        <li className="fact-item"><div className="fact-dot"></div>Teve Ismael aos 86 anos, Isaque aos 100 anos</li>
                        <li className="fact-item"><div className="fact-dot"></div>Viveu 175 anos — sepultado por Isaque e Ismael no campo de Efrom</li>
                        <li className="fact-item"><div className="fact-dot"></div>Através de Quetura (segunda mulher) teve mais 6 filhos: Zinrã, Jocsã, Medã, Midiã, Jisbaque e Suá</li>
                        <li className="fact-item"><div className="fact-dot"></div>Através de Ismael, originam-se os povos árabes</li>
                        <li className="fact-item"><div className="fact-dot"></div>Após Moisés, é o personagem do AT mais citado no NT</li>
                        <li className="fact-item"><div className="fact-dot"></div>Sara era sua meia-irmã por parte de pai (Gênesis 20:12)</li>
                      </ul>
                    </div>
                  </div>
                )}

              </div>

              {/* FOOTER ACTIONS */}
              <div className="cd-footer">
                <button className="fa-btn pri" onClick={() => navigate('/sermoes')}>🎙 Gerar Sermão</button>
                <button className="fa-btn pri" onClick={() => navigate('/social-studio')}>📱 Carrossel</button>
                <button className="fa-btn pri">👥 Material de Grupo</button>
                <button className="fa-btn pri">🎯 Quiz sobre {selected.nome}</button>
                <button className="fa-btn pri">📄 Exportar PDF</button>
                <button className="fa-btn pri">🔬 Pesquisa no Original</button>
              </div>

            </>
          ) : (
            <div style={{ padding: '40px', color: 'var(--cea-text-3)' }}>Selecione um personagem na lista ao lado.</div>
          )}
        </div>
      </div>
    </div>
  );
}

