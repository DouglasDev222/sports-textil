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

function Router() {
  return (
    <Switch>
      <Route path="/" component={EventosPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/cadastro" component={CadastroPage} />
      <Route path="/evento/:slug" component={EventoDetailPage} />
      <Route path="/minhas-inscricoes" component={MinhasInscricoesPage} />
      <Route path="/minha-conta" component={MinhaContaPage} />
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
