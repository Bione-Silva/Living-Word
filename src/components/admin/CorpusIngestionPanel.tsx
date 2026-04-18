import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Play, RefreshCw, Library, AlertTriangle } from "lucide-react";
import { WESLEY_PILOT } from "@/data/corpus-seeds/wesley-pilot";
import { SPURGEON_PILOT } from "@/data/corpus-seeds/spurgeon-pilot";

type StatusSummary = Record<string, Record<string, number>>;

interface CorpusRow {
  mind: string;
  docs: number;
  chunks: number;
}

const PILOT_CONFIG: Record<string, { label: string; jobs: typeof WESLEY_PILOT }> = {
  wesley: { label: "Wesley — 52 Standard Sermons", jobs: WESLEY_PILOT },
  spurgeon: { label: "Spurgeon — 50 Metropolitan Tabernacle", jobs: SPURGEON_PILOT },
};

export function CorpusIngestionPanel() {
  const [summary, setSummary] = useState<StatusSummary>({});
  const [corpus, setCorpus] = useState<CorpusRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [autoRun, setAutoRun] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    const { data: s } = await supabase.functions.invoke("kb-batch-ingest", {
      body: { action: "status" },
    });
    if (s?.summary) setSummary(s.summary);

    // contagem real do corpus já indexado (via RPC seria ideal — usamos jobs ingested como proxy)
    const { data: jobs } = await supabase
      .from("kb_ingestion_jobs")
      .select("mind, status, chunks_count")
      .eq("status", "ingested");
    if (jobs) {
      const map = new Map<string, CorpusRow>();
      for (const j of jobs) {
        const r = map.get(j.mind) ?? { mind: j.mind, docs: 0, chunks: 0 };
        r.docs += 1;
        r.chunks += j.chunks_count ?? 0;
        map.set(j.mind, r);
      }
      setCorpus([...map.values()].sort((a, b) => a.mind.localeCompare(b.mind)));
    }
  }, []);

  useEffect(() => {
    loadStatus();
    const t = setInterval(loadStatus, 5000);
    return () => clearInterval(t);
  }, [loadStatus]);

  const handleEnqueue = async (mind: string) => {
    setBusy(`enqueue-${mind}`);
    const cfg = PILOT_CONFIG[mind];
    try {
      const { data, error } = await supabase.functions.invoke("kb-batch-ingest", {
        body: {
          action: "enqueue",
          jobs: cfg.jobs.map((j) => ({ ...j, batch_id: `${mind}-pilot-${Date.now()}` })),
        },
      });
      if (error) throw error;
      toast.success(`${data.enqueued} jobs enfileirados para ${cfg.label}`);
      loadStatus();
    } catch (e) {
      toast.error(`Erro: ${(e as Error).message}`);
    }
    setBusy(null);
  };

  const handleProcess = async (mind?: string) => {
    setBusy(`process-${mind ?? "all"}`);
    try {
      const { data, error } = await supabase.functions.invoke("kb-batch-ingest", {
        body: { action: "process", mind, limit: 4 },
      });
      if (error) throw error;
      const ok = data.results?.filter((r: { status: string }) => r.status === "ingested").length ?? 0;
      const errs = data.results?.filter((r: { status: string }) => r.status === "error").length ?? 0;
      if (data.processed === 0) {
        toast.info("Nenhum job pendente");
        setAutoRun(null);
      } else {
        toast.success(`${ok} ingestados, ${errs} erros`);
      }
      loadStatus();
    } catch (e) {
      toast.error(`Erro: ${(e as Error).message}`);
      setAutoRun(null);
    }
    setBusy(null);
  };

  // Loop auto: continua processando enquanto houver pendentes
  useEffect(() => {
    if (!autoRun || busy) return;
    const t = setTimeout(() => handleProcess(autoRun), 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, busy, summary]);

  const startAutoRun = (mind: string) => {
    setAutoRun(mind);
    toast.info(`Esteira automática iniciada para ${mind}. Pode fechar a aba — continua no servidor.`);
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Library className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-display font-semibold">Pastoral Minds Corpus</h2>
          <p className="text-sm text-muted-foreground">
            Esteira de ingestão do RAG — Wesley, Spurgeon, Billy Graham
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs flex gap-2">
        <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
        <div>
          <strong>Billy Graham:</strong> sem corpus textual em domínio público.
          Apenas áudios no BGEA. Marcado como pendente até obter transcrições oficiais.
        </div>
      </div>

      {/* Tabela de corpus indexado */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Corpus indexado</h3>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left">Mente</th>
                <th className="px-3 py-2 text-right">Documentos</th>
                <th className="px-3 py-2 text-right">Chunks</th>
              </tr>
            </thead>
            <tbody>
              {corpus.length === 0 && (
                <tr><td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">
                  Nenhum corpus pastoral ingestado ainda.
                </td></tr>
              )}
              {corpus.map((r) => (
                <tr key={r.mind} className="border-t">
                  <td className="px-3 py-2 font-medium capitalize">{r.mind}</td>
                  <td className="px-3 py-2 text-right">{r.docs}</td>
                  <td className="px-3 py-2 text-right">{r.chunks.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pilotos */}
      {Object.entries(PILOT_CONFIG).map(([mind, cfg]) => {
        const s = summary[mind] ?? {};
        const total = Object.values(s).reduce((a, b) => a + b, 0);
        const ingested = s.ingested ?? 0;
        const errors = s.error ?? 0;
        const pending = (s.pending ?? 0) + (s.fetching ?? 0) + (s.embedding ?? 0) + (s.translating ?? 0) + (s.chunking ?? 0);
        return (
          <div key={mind} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{cfg.label}</h3>
                <p className="text-xs text-muted-foreground">
                  {total > 0
                    ? `${ingested} ingestados · ${pending} em andamento · ${errors} erros (de ${total} total)`
                    : `${cfg.jobs.length} sermões prontos para enfileirar (EN + PT)`}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy !== null}
                  onClick={() => handleEnqueue(mind)}
                >
                  {busy === `enqueue-${mind}` ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enfileirar"}
                </Button>
                <Button
                  size="sm"
                  disabled={busy !== null || total === 0}
                  onClick={() => handleProcess(mind)}
                >
                  {busy === `process-${mind}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Processar 4
                </Button>
                <Button
                  size="sm"
                  variant={autoRun === mind ? "destructive" : "default"}
                  disabled={busy !== null || total === 0}
                  onClick={() => autoRun === mind ? setAutoRun(null) : startAutoRun(mind)}
                >
                  <RefreshCw className={`h-4 w-4 ${autoRun === mind ? "animate-spin" : ""}`} />
                  {autoRun === mind ? "Parar auto" : "Auto-rodar"}
                </Button>
              </div>
            </div>
            {total > 0 && (
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(ingested / total) * 100}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}
