import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Copy, Mail, Shield, Eye, Edit3, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const mockTeam = [
  { id: '1', email: 'carlos@equipe.com', role: 'admin', status: 'active', name: 'Carlos Admin' },
  { id: '2', email: 'maria@equipe.com', role: 'editor', status: 'active', name: 'Maria Editora' },
  { id: '3', email: 'joao@equipe.com', role: 'viewer', status: 'pending', name: '' },
];

const roleLabels: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: 'Admin', icon: Shield, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  editor: { label: 'Editor', icon: Edit3, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  viewer: { label: 'Visualizador', icon: Eye, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
};

export function TeamSection() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const inviteLink = 'https://living-word.lovable.app/invite/abc123xyz';

  const handleInvite = () => {
    if (!inviteEmail.includes('@')) {
      toast.error('Email inválido');
      return;
    }
    toast.success(`Convite enviado para ${inviteEmail}`);
    setInviteEmail('');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Link de convite copiado!');
  };

  return (
    <Card className="admin-card border-0">
      <CardHeader>
        <CardTitle className="text-base font-semibold admin-text flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Gerenciamento de Equipe
        </CardTitle>
        <CardDescription className="admin-muted text-sm">
          Convide funcionários por email ou link e defina a hierarquia de acesso.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invite form */}
        <div className="flex items-end gap-3 p-4 rounded-xl bg-muted/10 border border-border/30">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium admin-muted">Email do funcionário</label>
            <Input
              placeholder="email@equipe.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="admin-input"
            />
          </div>
          <div className="w-40 space-y-1.5">
            <label className="text-xs font-medium admin-muted">Papel</label>
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="admin-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Visualizador</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleInvite} className="gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Enviar Convite
          </Button>
        </div>

        {/* Invite link */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/5 border border-border/20">
          <span className="text-xs admin-muted flex-1 truncate font-mono">{inviteLink}</span>
          <Button variant="ghost" size="sm" onClick={handleCopyLink} className="gap-1">
            <Copy className="h-3 w-3" />
            Copiar link
          </Button>
        </div>

        {/* Team list */}
        <div className="space-y-2">
          {mockTeam.map((m) => {
            const r = roleLabels[m.role];
            return (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/5 border border-border/20 hover:bg-muted/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted/30 flex items-center justify-center text-xs font-bold admin-text">
                    {(m.name || m.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium admin-text">{m.name || m.email}</p>
                    <p className="text-xs admin-muted">{m.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.status === 'pending' && (
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">
                      Pendente
                    </Badge>
                  )}
                  <Badge variant="outline" className={`text-[10px] ${r.color}`}>
                    <r.icon className="h-3 w-3 mr-1" />
                    {r.label}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
