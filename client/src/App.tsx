import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import EventosPage from "@/pages/EventosPage";
import LoginPage from "@/pages/LoginPage";
import CadastroPage from "@/pages/CadastroPage";
import EventoDetailPage from "@/pages/EventoDetailPage";
import MinhasInscricoesPage from "@/pages/MinhasInscricoesPage";
import MinhaContaPage from "@/pages/MinhaContaPage";
import ParticipantesPage from "@/pages/ParticipantesPage";
import InscricaoParticipantePage from "@/pages/InscricaoParticipantePage";
import InscricaoModalidadePage from "@/pages/InscricaoModalidadePage";
import InscricaoResumoPage from "@/pages/InscricaoResumoPage";
import InscricaoPagamentoPage from "@/pages/InscricaoPagamentoPage";
import InscricaoDetailPage from "@/pages/InscricaoDetailPage";

import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminOrganizersPage from "@/pages/admin/AdminOrganizersPage";
import AdminEventsPage from "@/pages/admin/AdminEventsPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminNotFound from "@/pages/admin/AdminNotFound";
import ProtectedAdminRoute from "@/pages/admin/ProtectedAdminRoute";

function PublicRouter() {
  return (
    <Switch>
      <Route path="/" component={EventosPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/cadastro" component={CadastroPage} />
      <Route path="/evento/:slug" component={EventoDetailPage} />
      <Route path="/evento/:slug/inscricao/participante" component={InscricaoParticipantePage} />
      <Route path="/evento/:slug/inscricao/modalidade" component={InscricaoModalidadePage} />
      <Route path="/evento/:slug/inscricao/resumo" component={InscricaoResumoPage} />
      <Route path="/evento/:slug/inscricao/pagamento" component={InscricaoPagamentoPage} />
      <Route path="/minhas-inscricoes" component={MinhasInscricoesPage} />
      <Route path="/inscricao/:id" component={InscricaoDetailPage} />
      <Route path="/minha-conta" component={MinhaContaPage} />
      <Route path="/participantes" component={ParticipantesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <Switch>
        <Route path="/admin/login" component={AdminLoginPage} />
        <Route path="/admin/organizadores">
          <ProtectedAdminRoute>
            <AdminOrganizersPage />
          </ProtectedAdminRoute>
        </Route>
        <Route path="/admin/eventos">
          <ProtectedAdminRoute>
            <AdminEventsPage />
          </ProtectedAdminRoute>
        </Route>
        <Route path="/admin/usuarios">
          <ProtectedAdminRoute>
            <AdminUsersPage />
          </ProtectedAdminRoute>
        </Route>
        <Route path="/admin">
          <ProtectedAdminRoute>
            <AdminDashboardPage />
          </ProtectedAdminRoute>
        </Route>
        <Route>
          <ProtectedAdminRoute>
            <AdminNotFound />
          </ProtectedAdminRoute>
        </Route>
      </Switch>
    </AdminAuthProvider>
  );
}

function AppRouter() {
  const [location] = useLocation();
  
  if (location.startsWith("/admin")) {
    return <AdminRoutes />;
  }
  
  return <PublicRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
