import { useState, useCallback } from "react";

const MODELS = {
  sonnet4:  { label: "Claude Sonnet 4",   in: 3,  out: 15, cache: 0.30, color: "#1e4d2b", bg: "#e8f2eb" },
  gpt41:    { label: "GPT-4.1",           in: 2,  out: 8,  cache: 0.50, color: "#1a4fa0", bg: "#e8eef8" },
  haiku:    { label: "Claude Haiku 4.5",  in: 1,  out: 5,  cache: 0.10, color: "#5a1a9a", bg: "#f0e8fb" },
};

const IMGS = {
  imagen4fast:  { label: "Imagen 4 Fast",     cost: 0.020, note: "Mais barato · fotorrealista" },
  imagen3:      { label: "Imagen 3",           cost: 0.030, note: "Boa qualidade artística" },
  nanobanana2:  { label: "Nano Banana 2",      cost: 0.067, note: "Alta qualidade + texto nativo" },
  nanobanana:   { label: "Nano Banana Pro",    cost: 0.134, note: "Premium · evitar no MVP" },
};

const MINDS = [
  { icon: "✝️", name: "Billy Graham", era: "1918–2018 · Evangelista · EUA", bg: "#f0e8d4",
    traits: ["Chamada ao arrependimento em todo conteúdo","Linguagem simples e direta ao coração","Ecumênico — serve evangélicos e católicos","Tom urgente mas amoroso — esperança celestial"],
    promptTok: 2000 },
  { icon: "🌿", name: "Charles Spurgeon", era: "1834–1892 · Batista · Londres", bg: "#e8f0e4",
    traits: ["Exposição bíblica profunda com riqueza textual","Humor pastoral e ilustrações vívidas","Calvinismo moderado — graça soberana","Ideal: batistas, reformados, presbiterianos"],
    promptTok: 2200 },
  { icon: "🔥", name: "John Wesley", era: "1703–1791 · Metodismo · Inglaterra", bg: "#e8eef8",
    traits: ["Santificação e vida cristã prática","Tom acolhedor — próximo do povo comum","Ênfase no amor de Deus para todos","Ideal: metodistas, assembleianos, carismáticos"],
    promptTok: 1900 },
  { icon: "📖", name: "João Calvino", era: "1509–1564 · Reformado · Genebra", bg: "#fdf0e0",
    traits: ["Exposição sistemática e densa","Soberania de Deus como âncora — conforto imigrante","Providência divina — Deus governa tudo","Ideal: reformados, presbiterianos, batistas reformados"],
    promptTok: 2400 },
];

const SCALE = [
  [20,  "Plano Free (1 pastor)"],
  [40,  "Plano Pastoral (1 pastor)"],
  [100, "Plano Church parcial"],
  [200, "Plano Church completo"],
  [500, "Plano Ministry"],
  [1000,"Multi-ministério"],
  [5000,"Plataforma SaaS escala"],
];

const PRI = "#6B4F3A";
const GRN = "#1e4d2b";

function fmt(n) { return "$" + n.toFixed(4); }
function fmt2(n) { return "$" + n.toFixed(3); }
function fmtM(n) { return "$" + n.toFixed(2); }

export default function App() {
  const [tab, setTab] = useState("calc");
  const [words, setWords] = useState(500);
  const [imgs, setImgs] = useState(1);
  const [promptTok, setPromptTok] = useState(2000);
  const [cacheRate, setCacheRate] = useState(80);
  const [modelKey, setModelKey] = useState("sonnet4");
  const [imgKey, setImgKey] = useState("imagen4fast");

  const calc = useCallback(() => {
    const m = MODELS[modelKey];
    const outTok = Math.round(words * 1.4);
    const freshIn = Math.round(promptTok * (1 - cacheRate / 100));
    const cacheIn = Math.round(promptTok * (cacheRate / 100));
    const textCost = (freshIn / 1e6) * m.in + (cacheIn / 1e6) * m.cache + (outTok / 1e6) * m.out;
    const imgCost = imgs * IMGS[imgKey].cost;
    const total = textCost + imgCost;
    return { textCost, imgCost, total, outTok, freshIn, cacheIn };
  }, [words, imgs, promptTok, cacheRate, modelKey, imgKey]);

  const { textCost, imgCost, total, outTok, freshIn, cacheIn } = calc();

  const tabs = [
    { id: "calc", label: "Calculadora" },
    { id: "mentes", label: "Mentes pastorais" },
    { id: "escala", label: "Projeção mensal" },
  ];

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 860, padding: "16px 0" }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 500, color: "#3D2B1F" }}>Custo por artigo gerado</div>
        <div style={{ fontSize: 12, color: "#8B6B54", marginTop: 3 }}>
          400–600 palavras · imagem Gemini · persona pastoral (Billy Graham, etc.)
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, borderBottom: "0.5px solid rgba(107,79,58,.2)", marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            fontSize: 12, padding: "8px 14px", cursor: "pointer", background: "none",
            border: "none", borderBottom: tab === t.id ? `2px solid ${PRI}` : "2px solid transparent",
            color: tab === t.id ? PRI : "#888", fontWeight: tab === t.id ? 500 : 400
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "calc" && (
        <div>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10, marginBottom: 20 }}>
            {[
              { v: fmt2(total), l: "Custo por artigo", s: "texto + imagem", c: GRN },
              { v: fmt2(textCost), l: "Custo texto", s: MODELS[modelKey].label, c: "#1a4fa0" },
              { v: fmt2(imgCost), l: "Custo imagem", s: IMGS[imgKey].label, c: "#7a4a10" },
              { v: fmtM(total * 100), l: "100 artigos/mês", s: "projeção mensal", c: "#3D2B1F" },
            ].map((m, i) => (
              <div key={i} style={{ background: "#f5f5f3", borderRadius: 8, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 500, color: m.c }}>{m.v}</div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 3 }}>{m.l}</div>
                <div style={{ fontSize: 10, color: m.c, marginTop: 2, fontWeight: 500 }}>{m.s}</div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ border: "0.5px solid rgba(107,79,58,.15)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#8B6B54", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Texto</div>
              {[
                { label: `Palavras por artigo: ${words}`, val: words, min: 300, max: 800, step: 50, set: setWords },
                { label: `Prompt master tokens: ${promptTok.toLocaleString()}`, val: promptTok, min: 800, max: 4000, step: 200, set: setPromptTok },
                { label: `Cache hit rate: ${cacheRate}%`, val: cacheRate, min: 0, max: 100, step: 10, set: setCacheRate },
              ].map(({ label, val, min, max, step, set }) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "#666" }}>{label}</span>
                  </div>
                  <input type="range" min={min} max={max} step={step} value={val}
                    onChange={e => set(+e.target.value)} style={{ width: "100%" }} />
                </div>
              ))}
              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>Modelo de texto</div>
                <select value={modelKey} onChange={e => setModelKey(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "0.5px solid rgba(107,79,58,.2)", fontSize: 12, background: "white" }}>
                  {Object.entries(MODELS).map(([k, m]) => (
                    <option key={k} value={k}>{m.label} (${m.in}/${m.out}/M)</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ border: "0.5px solid rgba(107,79,58,.15)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#8B6B54", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Imagem Gemini</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>Imagens por artigo: {imgs}</div>
                <input type="range" min={0} max={3} step={1} value={imgs}
                  onChange={e => setImgs(+e.target.value)} style={{ width: "100%" }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>Modelo de imagem</div>
                <select value={imgKey} onChange={e => setImgKey(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "0.5px solid rgba(107,79,58,.2)", fontSize: 12, background: "white" }}>
                  {Object.entries(IMGS).map(([k, m]) => (
                    <option key={k} value={k}>{m.label} (${m.cost.toFixed(3)}/img) — {m.note}</option>
                  ))}
                </select>
              </div>
              <div style={{ background: "#f5f5f3", borderRadius: 8, padding: 10, fontSize: 11, color: "#666", lineHeight: 1.6 }}>
                <div style={{ fontWeight: 500, color: "#3D2B1F", marginBottom: 4 }}>Detalhamento tokens:</div>
                <div>Input fresh: {freshIn.toLocaleString()} tok</div>
                <div>Input cached: {cacheIn.toLocaleString()} tok</div>
                <div>Output: {outTok.toLocaleString()} tok</div>
              </div>
            </div>
          </div>

          {/* Cost breakdown */}
          <div style={{ background: "#f9fcf9", border: "1.5px solid rgba(30,77,43,.2)", borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: GRN }}>
                  {MODELS[modelKey].label} + {IMGS[imgKey].label}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>
                  ${MODELS[modelKey].in}/${MODELS[modelKey].out}/M tokens + ${IMGS[imgKey].cost}/imagem · cache {cacheRate}%
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 32, fontWeight: 500, color: GRN }}>{fmt2(total)}</div>
                <div style={{ fontSize: 11, color: "#666" }}>por artigo completo</div>
              </div>
            </div>
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 11 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 500, color: "#1a4fa0" }}>{fmt2(textCost)}</div>
                <div style={{ color: "#666" }}>texto ({Math.round(textCost/total*100)}%)</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 500, color: "#7a4a10" }}>{fmt2(imgCost)}</div>
                <div style={{ color: "#666" }}>imagem ({Math.round(imgCost/total*100)}%)</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 500, color: GRN }}>{fmtM(total * 200)}</div>
                <div style={{ color: "#666" }}>200 artigos/mês</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "mentes" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {MINDS.map((m, i) => (
              <div key={i} style={{ border: "0.5px solid rgba(107,79,58,.15)", borderRadius: 12, padding: 16, background: "white" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {m.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#3D2B1F" }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: "#8B6B54" }}>{m.era}</div>
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  {m.traits.map((t, j) => (
                    <div key={j} style={{ fontSize: 11, color: "#3D2B1F", display: "flex", gap: 6, marginBottom: 5, lineHeight: 1.4 }}>
                      <span style={{ color: PRI, fontWeight: 500, flexShrink: 0 }}>·</span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#f5f5f3", borderRadius: 8, padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#8B6B54" }}>Tokens do persona</div>
                    <div style={{ fontSize: 12, color: "#666" }}>~{m.promptTok.toLocaleString()} tok</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "#8B6B54" }}>Custo extra/artigo</div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: GRN }}>
                      +${((m.promptTok * 0.2 / 1e6) * 3 + (m.promptTok * 0.8 / 1e6) * 0.3).toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ border: "0.5px solid rgba(107,79,58,.15)", borderRadius: 12, padding: 16, background: "#f9fcf9", borderLeft: `3px solid ${GRN}`, borderRadius: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: GRN, marginBottom: 6 }}>Insight crítico sobre custo das Mentes</div>
            <div style={{ fontSize: 12, color: "#666", lineHeight: 1.6 }}>
              O prompt master com Billy Graham tem ~2.000 tokens. Com cache 80%, o custo de texto extra é apenas <strong style={{ color: GRN }}>$0,0002/artigo</strong>. A imagem Gemini ($0,020) representa <strong style={{ color: "#7a4a10" }}>64% do custo total</strong>. Conclusão: a qualidade teológica da Mente custa quase nada. A decisão econômica é escolher o modelo de imagem certo.
            </div>
          </div>
        </div>
      )}

      {tab === "escala" && (
        <div>
          <div style={{ fontSize: 11, color: "#8B6B54", marginBottom: 12 }}>
            Claude Sonnet 4 + Imagen 4 Fast + Billy Graham · $0,031/artigo
          </div>
          <div style={{ border: "0.5px solid rgba(107,79,58,.12)", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f5f5f3" }}>
                  {["Artigos/mês", "Custo texto", "Custo imagens", "Custo total", "$/artigo", "Contexto"].map(h => (
                    <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8B6B54", fontWeight: 500, borderBottom: "0.5px solid rgba(107,79,58,.12)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SCALE.map(([n, ctx], i) => {
                  const tc = n * 0.011;
                  const ic = n * 0.020;
                  const tot = n * 0.031;
                  const hl = n === 200;
                  return (
                    <tr key={i} style={{ background: hl ? "#f0f8f0" : i % 2 === 0 ? "white" : "#fafaf8" }}>
                      <td style={{ padding: "9px 12px", borderBottom: "0.5px solid rgba(107,79,58,.08)", fontWeight: hl ? 500 : 400, color: hl ? GRN : "#3D2B1F" }}>{n.toLocaleString()}</td>
                      <td style={{ padding: "9px 12px", borderBottom: "0.5px solid rgba(107,79,58,.08)", color: "#1a4fa0" }}>{fmtM(tc)}</td>
                      <td style={{ padding: "9px 12px", borderBottom: "0.5px solid rgba(107,79,58,.08)", color: "#7a4a10" }}>{fmtM(ic)}</td>
                      <td style={{ padding: "9px 12px", borderBottom: "0.5px solid rgba(107,79,58,.08)", fontWeight: 500, color: hl ? GRN : "#3D2B1F" }}>{fmtM(tot)}</td>
                      <td style={{ padding: "9px 12px", borderBottom: "0.5px solid rgba(107,79,58,.08)", color: "#666" }}>$0.031</td>
                      <td style={{ padding: "9px 12px", borderBottom: "0.5px solid rgba(107,79,58,.08)", color: "#8B6B54" }}>{ctx}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginBottom: 16 }}>
            {[
              { v: "64%", l: "Custo vem da imagem", s: "$0,020 de $0,031", c: "#7a4a10" },
              { v: "$0,011", l: "Artigo só texto", s: "sem imagem", c: GRN },
              { v: "97%", l: "Margem Pastoral", s: "$9 − $0,31 = $8,69", c: GRN },
              { v: "$0,0002", l: "Custo extra da Mente", s: "Billy Graham vs genérico", c: PRI },
            ].map((m, i) => (
              <div key={i} style={{ background: "#f5f5f3", borderRadius: 8, padding: 12, textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 500, color: m.c }}>{m.v}</div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 3 }}>{m.l}</div>
                <div style={{ fontSize: 10, color: m.c, marginTop: 2, fontWeight: 500 }}>{m.s}</div>
              </div>
            ))}
          </div>

          <div style={{ border: "0.5px solid rgba(107,79,58,.15)", borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#8B6B54", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Estratégia por volume</div>
            {[
              { range: "< 100 artigos/mês", rec: "Imagen 4 Fast ($0,020)", why: "Custo total < $3,10. Sem otimização necessária.", c: GRN },
              { range: "100–500 artigos/mês", rec: "Imagen 4 Fast + cache agressivo (90%)", why: "Custo $3–$15. Cache no prompt master reduz 30% do custo.", c: "#1a4fa0" },
              { range: "> 500 artigos/mês", rec: "Imagen 4 Fast em batch + cache 90%", why: "Batch API 50% desconto nas imagens. $0,01/img = $0,021/artigo.", c: PRI },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < 2 ? "0.5px solid rgba(107,79,58,.08)" : "none" }}>
                <div style={{ width: 3, background: s.c, borderRadius: 2, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#3D2B1F" }}>{s.range} — {s.rec}</div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{s.why}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
