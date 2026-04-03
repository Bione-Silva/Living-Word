import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Estudio from "./pages/Estudio";
import Blog from "./pages/Blog";
import Biblioteca from "./pages/Biblioteca";
import Calendario from "./pages/Calendario";
import Configuracoes from "./pages/Configuracoes";
import Upgrade from "./pages/Upgrade";
import MentesBrilhantes from "./pages/MentesBrilhantes";
import MenteChat from "./pages/MenteChat";
import AppLayout from "./layouts/AppLayout";
import BlogPublic from "./pages/BlogPublic";
import BlogArticle from "./pages/BlogArticle";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
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
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cadastro" element={<Cadastro />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/blog/:handle" element={<BlogPublic />} />
              <Route path="/blog/:handle/:articleId" element={<BlogArticle />} />

              {/* Protected routes with AppLayout */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/estudio" element={<Estudio />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/biblioteca" element={<Biblioteca />} />
                <Route path="/calendario" element={<Calendario />} />
                <Route path="/configuracoes" element={<Configuracoes />} />
                <Route path="/upgrade" element={<Upgrade />} />
                <Route path="/mentes" element={<MentesBrilhantes />} />
                <Route path="/mentes/:id" element={<MenteChat />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
