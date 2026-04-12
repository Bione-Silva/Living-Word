import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, Clock, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const THEME_COLORS: Record<string, string> = {
  amber: '45 93% 31%',
  blue: '221 83% 53%',
  green: '142 71% 45%',
  rose: '347 77% 50%',
  purple: '263 70% 58%',
  teal: '173 80% 32%',
  indigo: '239 84% 67%',
  orange: '21 90% 48%',
  black: '0 0% 15%',
};

const FONT_FAMILIES: Record<string, string> = {
  cormorant: "'Cormorant Garamond', serif",
  montserrat: "'Montserrat', sans-serif",
  playfair: "'Playfair Display', serif",
  inter: "'Inter', sans-serif",
  merriweather: "'Merriweather', serif",
  dm_sans: "'DM Sans', sans-serif",
  lora: "'Lora', serif",
};

interface PublicBlogProfile {
  id: string;
  full_name: string;
  bio: string | null;
  avatar_url: string | null;
  blog_name: string | null;
  blog_handle: string;
  church_name: string | null;
  city: string | null;
  country: string | null;
  font_family: string | null;
  language: string;
  layout_style: string | null;
  theme_color: string | null;
}

interface PublicBlogArticleListItem {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  language: string | null;
  passage: string | null;
  article_images: unknown;
  published_at: string | null;
}

function isCustomHex(color: string | null): boolean {
  return !!color && color.startsWith('#');
}

function hexToHsl(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return `0 0% ${Math.round(l * 100)}%`;
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default function BlogPublic() {
  const { handle } = useParams<{ handle: string }>();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: profile, isLoading: profileLoading } = useQuery<PublicBlogProfile | null>({
    queryKey: ['blog-profile', handle],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_public_blog_profile', { p_handle: handle! });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row || null;
    },
    enabled: !!handle,
  });

  // Derive theme
  const themeColor = profile?.theme_color || 'amber';
  const fontFamily = profile?.font_family || 'cormorant';
  const primaryHsl = isCustomHex(themeColor) ? hexToHsl(themeColor) : (THEME_COLORS[themeColor] || THEME_COLORS.amber);
  const blogFont = FONT_FAMILIES[fontFamily] || FONT_FAMILIES.cormorant;

  useEffect(() => {
    document.documentElement.classList.add('theme-blog');
    document.body.classList.add('theme-blog');
    document.documentElement.style.setProperty('--blog-primary', primaryHsl);
    document.documentElement.style.setProperty('--blog-font', blogFont);

    return () => {
      document.documentElement.classList.remove('theme-blog');
      document.body.classList.remove('theme-blog');
      document.documentElement.style.removeProperty('--blog-primary');
      document.documentElement.style.removeProperty('--blog-font');
    };
  }, [primaryHsl, blogFont]);

  const { data: articles, isLoading: articlesLoading } = useQuery<PublicBlogArticleListItem[]>({
    queryKey: ['blog-articles', handle],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .rpc('get_public_blog_articles', { p_handle: handle! });
      if (error) throw error;
      return data || [];
    },
    enabled: !!handle,
  });

  const filteredArticles = articles?.filter(a =>
    !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const estimateReadTime = (content: string) => {
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  const getExcerpt = (content: string) => {
    return content
      .replace(/^#.*$/gm, '')
      .replace(/[#*_`>]/g, '')
      .trim()
      .substring(0, 160)
      .trim() + '...';
  };

  const blogName = profile?.blog_name || `Blog de ${profile?.full_name}`;
  const blogDesc = profile?.bio || (profile?.church_name ? `${profile.church_name}${profile.city ? ` · ${profile.city}` : ''}` : '');
  const initials = profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';

  const langLabels = useMemo(() => {
    const lang = profile?.language || 'PT';
    return {
      search: lang === 'EN' ? 'Search articles...' : lang === 'ES' ? 'Buscar artículos...' : 'Buscar artigos no blog...',
      latest: lang === 'EN' ? 'Latest Articles' : lang === 'ES' ? 'Últimos Artículos' : 'Últimos Artigos Publicados',
      readTime: lang === 'EN' ? 'min read' : lang === 'ES' ? 'min de lectura' : 'min de leitura',
      notFound: lang === 'EN' ? 'Blog not found' : lang === 'ES' ? 'Blog no encontrado' : 'Blog não encontrado',
      noArticles: lang === 'EN' ? 'No articles published yet' : lang === 'ES' ? 'Aún no hay artículos' : 'Nenhum artigo publicado ainda',
      noResults: lang === 'EN' ? 'No articles found' : lang === 'ES' ? 'Ningún artículo encontrado' : 'Nenhum artigo encontrado',
      home: lang === 'EN' ? 'Home' : lang === 'ES' ? 'Inicio' : 'Início',
      readMore: lang === 'EN' ? 'Read more' : lang === 'ES' ? 'Leer más' : 'Ler mais',
      backHome: lang === 'EN' ? 'Back to home' : lang === 'ES' ? 'Volver al inicio' : 'Voltar ao início',
    };
  }, [profile?.language]);

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: `hsl(${primaryHsl})` }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">{langLabels.notFound}</h1>
          <p className="text-gray-500">O handle "{handle}" não existe.</p>
          <Link to="/">
            <Button variant="outline">{langLabels.backHome}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: blogFont }}>
      {/* Top nav bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border" style={{ borderColor: `hsl(${primaryHsl} / 0.3)` }}>
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
              <AvatarFallback className="text-xs font-bold text-white" style={{ backgroundColor: `hsl(${primaryHsl})` }}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-base font-bold text-gray-900" style={{ fontFamily: blogFont }}>
              {profile.full_name}
            </span>
          </div>
          <nav className="flex items-center gap-4 text-sm text-gray-500">
            <span className="hover:text-gray-900 cursor-pointer transition-colors">{langLabels.home}</span>
          </nav>
        </div>
      </header>

      {/* Hero section — inspired by the reference image */}
      <div
        className="py-16 md:py-20 text-center"
        style={{ backgroundColor: `hsl(${primaryHsl})` }}
      >
        <div className="max-w-3xl mx-auto px-4">
          <h1
            className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: blogFont }}
          >
            {blogName}
          </h1>
          {blogDesc && (
            <p className="text-white/80 text-sm md:text-base mb-8 max-w-xl mx-auto leading-relaxed">
              {blogDesc}
            </p>
          )}

          <div className="max-w-md mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={langLabels.search}
                className="pl-4 pr-10 h-12 bg-white border-0 text-gray-900 placeholder:text-gray-400 rounded-lg shadow-lg"
              />
            </div>
            <Button
              size="icon"
              className="h-12 w-12 rounded-lg shadow-lg text-white"
              style={{ backgroundColor: `hsl(${primaryHsl})`, filter: 'brightness(0.85)' }}
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Articles section */}
      <main className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        <h2
          className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-10"
          style={{ fontFamily: blogFont }}
        >
          {langLabels.latest}
        </h2>

        {articlesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden bg-white border border-gray-100 rounded-xl shadow-sm">
                <Skeleton className="h-52 w-full rounded-none" />
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !filteredArticles?.length ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 mx-auto mb-4" style={{ color: `hsl(${primaryHsl} / 0.4)` }} />
            <h3 className="text-xl text-gray-900" style={{ fontFamily: blogFont }}>
              {searchQuery ? langLabels.noResults : langLabels.noArticles}
            </h3>
            <p className="text-gray-500 mt-2">
              {searchQuery ? 'Tente buscar com outros termos.' : 'Volte em breve para novos conteúdos.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(article => {
              const coverUrl = (article as any).cover_image_url;
              return (
                <Link key={article.id} to={`/blog/${handle}/${article.id}`} className="group">
                  <Card className="overflow-hidden bg-white border border-gray-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col rounded-xl">
                    <div className="relative h-52 overflow-hidden bg-gray-50">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, hsl(${primaryHsl} / 0.08), hsl(${primaryHsl} / 0.02))` }}
                        >
                          <BookOpen className="w-12 h-12" style={{ color: `hsl(${primaryHsl} / 0.25)` }} />
                        </div>
                      )}
                    </div>

                    <CardContent className="p-5 flex flex-col flex-1">
                      <h3
                        className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 transition-colors"
                        style={{ fontFamily: blogFont }}
                      >
                        <span className="group-hover:text-opacity-100" style={{ color: undefined }}>
                          {article.title}
                        </span>
                      </h3>
                      <p className="text-xs text-gray-400 mb-3">
                        {new Date(article.published_at || article.created_at).toLocaleDateString(
                          profile.language === 'EN' ? 'en-US' : profile.language === 'ES' ? 'es-ES' : 'pt-BR',
                          { day: 'numeric', month: 'long', year: 'numeric' }
                        )}
                      </p>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-3 flex-1 leading-relaxed">
                        {getExcerpt(article.content)}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-auto pt-3 border-t border-gray-50">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {estimateReadTime(article.content)} {langLabels.readTime}
                        </span>
                        <span
                          className="flex items-center gap-0.5 font-medium transition-colors group-hover:translate-x-0.5"
                          style={{ color: `hsl(${primaryHsl})` }}
                        >
                          {langLabels.readMore} <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        <footer className="text-center py-10 mt-10 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Feito com ❤️ por{' '}
            <Link to="/" className="font-semibold hover:underline" style={{ color: `hsl(${primaryHsl})` }}>Living Word</Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
