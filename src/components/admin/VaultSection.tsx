import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Save, Brain, TrendingUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  providers: { id: string; label: string; desc: string }[];
  aiSettings: { key: string; label: string; options: string[]; default: string }[];
  vaultKeys: Record<string, string>;
  vaultVisible: Record<string, boolean>;
  aiSettingsValues: Record<string, string>;
  savingKey: string | null;
  cfoInsight: string;
  cfoLoading: boolean;
  onVaultKeyChange: (id: string, value: string) => void;
  onVaultVisibleToggle: (id: string) => void;
  onSaveKey: (id: string) => void;
  onSaveSetting: (key: string, value: string) => void;
  onLoadCfo: () => void;
}

export function VaultSection({
  providers, aiSettings, vaultKeys, vaultVisible,
  aiSettingsValues, savingKey, cfoInsight, cfoLoading,
  onVaultKeyChange, onVaultVisibleToggle, onSaveKey,
  onSaveSetting, onLoadCfo,
}: Props) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Vault */}
      <Card className="admin-card border-0">
        <CardHeader>
          <CardTitle className="text-base font-semibold admin-text">🔐 The Vault</CardTitle>
          <CardDescription className="admin-muted text-sm">API Keys dos provedores de IA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {providers.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <span className="text-sm admin-text w-24 shrink-0">{p.label}</span>
              <div className="relative flex-1">
                <Input
                  type={vaultVisible[p.id] ? 'text' : 'password'}
                  placeholder={`Chave ${p.label}...`}
                  value={vaultKeys[p.id] || ''}
                  onChange={(e) => onVaultKeyChange(p.id, e.target.value)}
                  className="pr-10 admin-input"
                />
                <button
                  type="button"
                  onClick={() => onVaultVisibleToggle(p.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 admin-muted hover:text-foreground"
                >
                  {vaultVisible[p.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button size="sm" variant="outline" onClick={() => onSaveKey(p.id)} disabled={savingKey === p.id}>
                <Save className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          <div className="pt-4 border-t border-border/30 space-y-3">
            <h3 className="text-xs font-semibold admin-muted uppercase tracking-wider">⚙️ Modelos IA</h3>
            {aiSettings.map((s) => (
              <div key={s.key} className="flex items-center gap-2">
                <span className="text-sm admin-text flex-1">{s.label}</span>
                <Select value={aiSettingsValues[s.key] || s.default} onValueChange={(v) => onSaveSetting(s.key, v)}>
                  <SelectTrigger className="w-44 admin-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {s.options.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CFO Agent */}
      <Card className="admin-card border-0 bg-gradient-to-br from-emerald-500/5 to-violet-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-base font-semibold admin-text">Conselheiro AI (CFO)</CardTitle>
            </div>
            <Button onClick={onLoadCfo} disabled={cfoLoading} size="sm" variant="outline">
              <TrendingUp className="h-3.5 w-3.5 mr-1" />
              {cfoLoading ? 'Analisando...' : 'Analisar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cfoInsight ? (
            <div className="rounded-lg p-4 text-sm admin-text leading-relaxed prose prose-sm max-w-none bg-muted/5 border border-border/20">
              <ReactMarkdown>{cfoInsight}</ReactMarkdown>
            </div>
          ) : (
            <div className="rounded-lg p-4 text-sm admin-muted italic bg-muted/5 border border-border/20">
              Clique em "Analisar" para receber insights financeiros do SaaS com IA.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
