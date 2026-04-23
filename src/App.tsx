import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PWAUpdater } from "@/components/PWAUpdater";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Blog from "./pages/Blog";
import Biblioteca from "./pages/Biblioteca";
import Calendario from "./pages/Calendario";
import Configuracoes from "./pages/Configuracoes";
import Upgrade from "./pages/Upgrade";
import MentesBrilhantes from "./pages/MentesBrilhantes";
import MindProfile from "./pages/MindProfile";
import MenteChat from "./pages/MenteChat";
import AppLayout from "./layouts/AppLayout";
import BlogPublic from "./pages/BlogPublic";
import BlogArticle from "./pages/BlogArticle";
import BlogOnboarding from "./pages/BlogOnboarding";
import NotFound from "./pages/NotFound";
import EstudoBiblicoPage from "./pages/EstudoBiblicoPage";
import AdminDashboard from "./pages/AdminDashboard";
import AIBillingDashboard from "./pages/AIBillingDashboard";
import AcceptInvite from "./pages/AcceptInvite";
import HelpCenter from "./pages/HelpCenter";
import HelpArticlePage from "./pages/HelpArticlePage";
import ExposStudioPage from "./pages/ExposStudioPage";
import Workspaces from "./pages/Workspaces";
import SocialStudio from "./pages/SocialStudio";
import BibleReader from "./pages/BibleReader";
import Pricing from "./pages/Pricing";
import Onboarding from "./pages/Onboarding";
import Devocional from "./pages/Devocional";
import DevocionalPublico from "./pages/DevocionalPublico";
import BomAmigo from "./pages/BomAmigo";
import Sermoes from "./pages/Sermoes";
import Pulpito from "./pages/Pulpito";
import SeriesDetail from "./pages/SeriesDetail";
import Quiz from "./pages/Quiz";
import Kids from "./pages/Kids";
import Ferramentas from "./pages/Ferramentas";
import Unsubscribe from "./pages/Unsubscribe";
import CEAHome from "./pages/CEAHome";
// MinhaIgreja agora vive como aba dentro de /configuracoes?tab=church
import { SubdomainRedirect } from "./components/SubdomainRedirect";

const queryClient = new QueryClient();

const MASTER_EMAIL = 'bionicaosilva@gmail.com';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const [timedOut, setTimedOut] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading && !timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  // Master email skips onboarding redirect
  const isMaster = user.email === MASTER_EMAIL;

  // Redirect to blog onboarding if profile not completed (except if already there or on upgrade, or master)
  const skipRedirectPaths = ['/onboarding', '/upgrade', '/blog-onboarding'];
  if (
    !isMaster &&
    profile &&
    !profile.profile_completed &&
    !skipRedirectPaths.some(p => location.pathname.startsWith(p))
  ) {
    return <Navigate to="/blog-onboarding" replace />;
  }

  return <>{children}</>;
}

function SyncLanguageWithProfile() {
  const { profile } = useAuth();
  const { setLang } = useLanguage();

  React.useEffect(() => {
    const profileLang = profile?.language as "PT" | "EN" | "ES" | undefined;
    if (profileLang) {
      setLang(profileLang);
    }
  }, [profile?.language, setLang]);

  return null;
}

/* LangKeyedApp removed — components react to lang changes via useLanguage() context.
   A full remount was destructive: it wiped form inputs, open modals, scroll position,
   sermon content, and any local state the user was working with. */

// eslint-disable-next-line react-refresh/only-export-components
const App = () => (
  <ErrorBoundary context="Aplicação Living Word">
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <SyncLanguageWithProfile />
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <PWAUpdater />
            <BrowserRouter>
              <>
                <Routes>
                {/* Subdomain detection: pastorjoao.livingwordgo.com → /blog/pastorjoao */}
                <Route path="/" element={<><SubdomainRedirect /><Landing /></>} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/blog/:handle" element={<BlogPublic />} />
                <Route path="/blog/:handle/:articleId" element={<BlogArticle />} />
                <Route path="/invite/:token" element={<AcceptInvite />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/lp" element={<Landing />} />
                <Route path="/devocional/publico/:shareToken" element={<DevocionalPublico />} />
                <Route path="/unsubscribe" element={<Unsubscribe />} />

                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/blog-onboarding" element={<BlogOnboarding />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/devocional" element={<Devocional />} />
                  <Route path="/bom-amigo" element={<BomAmigo />} />
                  <Route path="/sermoes" element={<Sermoes />} />
                  <Route path="/pulpito" element={<Pulpito />} />
                  <Route path="/series/:id" element={<SeriesDetail />} />
                  <Route path="/quiz" element={<Quiz />} />
                  <Route path="/kids" element={<Kids />} />
                  <Route path="/ferramentas" element={<Ferramentas />} />
                  <Route path="/minha-igreja" element={<Navigate to="/configuracoes?tab=church" replace />} />
                  <Route path="/estudio" element={<Navigate to="/dashboard?tool=studio" replace />} />
                  <Route path="/estudos/novo" element={<EstudoBiblicoPage />} />
                  <Route path="/estudos" element={<CEAHome />} />
                  <Route path="/estudos/parabolas" element={<CEAHome />} />
                  <Route path="/estudos/personagens" element={<CEAHome />} />
                  <Route path="/estudos/livros" element={<CEAHome />} />
                  <Route path="/estudos/pesquisa" element={<CEAHome />} />
                  <Route path="/estudos/quiz" element={<CEAHome />} />
                  <Route path="/estudos/meu-progresso" element={<CEAHome />} />
                  <Route path="/expos" element={<ExposStudioPage />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/biblioteca" element={<Biblioteca />} />
                  <Route path="/workspaces" element={<Workspaces />} />
                  <Route path="/social-studio" element={<SocialStudio />} />
                  <Route path="/bible" element={<BibleReader />} />
                  <Route path="/calendario" element={<Calendario />} />
                  <Route path="/configuracoes" element={<Configuracoes />} />
                  <Route path="/upgrade" element={<Upgrade />} />
                  <Route path="/dashboard/mentes" element={<MentesBrilhantes />} />
                  <Route path="/dashboard/mentes/:id" element={<MindProfile />} />
                  <Route path="/dashboard/mentes/chat" element={<MenteChat />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/ai-billing" element={<AIBillingDashboard />} />
                  <Route path="/ajuda" element={<HelpCenter />} />
                  <Route path="/ajuda/:toolId" element={<HelpArticlePage />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
