import { Switch, Route } from "wouter";
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

function Router() {
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
