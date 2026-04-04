import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Sparkles, Globe, ArrowRight, BookOpen, Search, Clock, Check } from 'lucide-react';

const COLOR_PALETTES = [
  { id: 'amber', label: 'Âmbar', primary: '#8B6914', accent: '#C4956A', bg: '#F7F3ED' },
  { id: 'blue', label: 'Azul', primary: '#2563EB', accent: '#60A5FA', bg: '#F0F4FF' },
  { id: 'green', label: 'Verde', primary: '#16A34A', accent: '#4ADE80', bg: '#F0FDF4' },
  { id: 'rose', label: 'Rosa', primary: '#E11D48', accent: '#FB7185', bg: '#FFF1F2' },
  { id: 'purple', label: 'Roxo', primary: '#7C3AED', accent: '#A78BFA', bg: '#F5F3FF' },
  { id: 'teal', label: 'Turquesa', primary: '#0D9488', accent: '#2DD4BF', bg: '#F0FDFA' },
];

export default function BlogOnboarding() {
  const { profile, user } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [handle, setHandle] = useState(profile?.blog_handle || '');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTES[0]);
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    if (!handle.trim()) {
      toast.error('Digite um nome para seu blog.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ blog_handle: handle.toLowerCase().replace(/[^a-z0-9-]/g, '') })
        .eq('id', user!.id);
      if (error) throw error;
      toast.success('Blog configurado com sucesso!');
      navigate('/dashboard');
    } catch {
      toast.error('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  const blogName = profile?.full_name || 'Meu Blog';
  const cleanHandle = handle.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'meu-blog';

  return (
    <div className="theme-app min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        {/* Skip */}
        <div className="text-center mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Pular onboarding e ativar conta
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: Form */}
          <div className="space-y-6">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                {blogName.split(' ')[0]}, criamos o seu blog!
              </h1>
              <p className="text-muted-foreground mt-2">
                Não se preocupe, você sempre poderá mudar estas opções!
              </p>
            </div>

            {/* Success banner */}
            <Card className="border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-primary">Você ganhou um blog profissional de graça!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Isso que você está vendo ao lado já é o seu blog profissional no ar... legal, né? 
                    Otimizamos ele para aparecer no Google, com todas as configurações necessárias... 
                    tudo para você não precisar mais se preocupar com isso :)
                  </p>
                </div>
              </div>
            </Card>

            {/* Handle input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Escolha o link do seu blog</label>
              <div className="flex items-center gap-0 border border-input rounded-lg overflow-hidden bg-background">
                <Input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="border-0 focus-visible:ring-0 text-base"
                  placeholder="pastor-marcos"
                />
                <span className="text-sm text-muted-foreground px-3 whitespace-nowrap bg-muted/50 py-2.5 border-l border-input">
                  .livingword.app
                </span>
              </div>
              {handle && (
                <div className="flex items-center gap-2 text-xs">
                  <Globe className="w-3 h-3 text-primary" />
                  <span className="text-muted-foreground">
                    Seu blog ficará em:{' '}
                    <span className="font-mono font-semibold text-primary">{cleanHandle}.livingword.app</span>
                  </span>
                </div>
              )}
            </div>

            {/* Color palette */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Escolha a cor do seu portal</label>
              <div className="flex flex-wrap gap-3">
                {COLOR_PALETTES.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color)}
                    className={`w-12 h-12 rounded-xl border-2 transition-all duration-200 flex items-center justify-center ${
                      selectedColor.id === color.id
                        ? 'border-foreground scale-110 shadow-md'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.primary }}
                    title={color.label}
                  >
                    {selectedColor.id === color.id && (
                      <Check className="w-5 h-5 text-white" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Cor selecionada: <span className="font-medium">{selectedColor.label}</span>
              </p>
            </div>

            {/* CTA */}
            <Button
              onClick={handleFinish}
              disabled={saving || !handle.trim()}
              className="w-full h-12 text-base font-semibold gap-2"
              style={{ backgroundColor: selectedColor.primary }}
            >
              {saving ? 'Salvando...' : 'Concluir Onboarding'}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Right: Live Preview */}
          <div className="relative">
            {/* "This is your blog" badge */}
            <div className="absolute -top-2 -right-2 z-10 bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-lg shadow-lg">
              <p>Este já é o seu blog</p>
              <p>100% funcional! 💛</p>
            </div>

            {/* Browser chrome */}
            <div className="rounded-2xl border border-border shadow-xl overflow-hidden bg-card">
              {/* Title bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-center gap-1.5 bg-background rounded-md px-3 py-1 text-xs text-muted-foreground border border-border/50">
                    <Globe className="w-3 h-3" />
                    <span className="font-mono">{cleanHandle}.livingword.app</span>
                  </div>
                </div>
              </div>

              {/* Preview content */}
              <div className="p-6 space-y-6" style={{ backgroundColor: selectedColor.bg }}>
                {/* Header */}
                <div className="text-center">
                  <h2 className="font-display text-xl font-bold" style={{ color: selectedColor.primary }}>
                    {blogName}
                  </h2>
                </div>

                {/* Hero */}
                <div
                  className="rounded-xl p-6 text-center"
                  style={{ background: `linear-gradient(135deg, ${selectedColor.primary}15, ${selectedColor.accent}15)` }}
                >
                  <h3 className="font-display text-2xl font-bold mb-4" style={{ color: '#2D2118' }}>
                    Blog
                  </h3>
                  <div className="flex items-center gap-2 max-w-xs mx-auto">
                    <div className="flex-1 flex items-center bg-white rounded-lg px-3 py-2 text-xs text-gray-400 border border-gray-200">
                      Buscar artigos no blog...
                    </div>
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: selectedColor.primary }}
                    >
                      <Search className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Section title */}
                <h4 className="font-display text-lg font-bold text-center" style={{ color: '#2D2118' }}>
                  Últimos Artigos Publicados
                </h4>

                {/* Mock article card */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
                  <div className="h-32 flex items-center justify-center" style={{ backgroundColor: `${selectedColor.primary}10` }}>
                    <BookOpen className="w-8 h-8" style={{ color: `${selectedColor.primary}40` }} />
                  </div>
                  <div className="p-4 space-y-2">
                    <h5 className="font-display text-sm font-bold" style={{ color: '#2D2118' }}>
                      O Senhor é meu pastor: encontrando paz
                    </h5>
                    <p className="text-xs text-gray-400">
                      {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      Você já sentiu que o ritmo da vida moderna parece uma corrida que nunca termina? No meio desse ruído, uma voz antiga e eterna continua a ecoar...
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 pt-2 border-t border-gray-100">
                      <Clock className="w-3 h-3" />
                      3 min de leitura
                    </div>
                  </div>
                </div>

                {/* Powered by footer */}
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-[10px] text-gray-400">
                    Feito com ❤️ por <span className="font-semibold">Living Word</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
