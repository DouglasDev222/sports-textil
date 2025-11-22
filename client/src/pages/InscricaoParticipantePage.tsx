import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Users } from "lucide-react";
import Header from "@/components/Header";

export default function InscricaoParticipantePage() {
  const [, params] = useRoute("/evento/:slug/inscricao/participante");
  const [, setLocation] = useLocation();

  const mockUsuario = {
    nome: "João Silva"
  };

  const handleParaMim = () => {
    setLocation(`/evento/${params?.slug}/inscricao/modalidade`);
  };

  const handleParaOutro = () => {
    console.log("Inscrição para outra pessoa - em desenvolvimento");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Nova Inscrição
          </h1>
          <p className="text-muted-foreground">
            Para quem você está fazendo esta inscrição?
          </p>
        </div>

        <div className="grid gap-4">
          <button 
            className="text-left"
            onClick={handleParaMim}
            data-testid="button-inscricao-para-mim"
          >
            <Card className="hover-elevate cursor-pointer transition-all">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">Para mim</CardTitle>
                    <CardDescription>
                      Inscrição para {mockUsuario.nome}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          <button 
            className="text-left opacity-50"
            onClick={handleParaOutro}
            data-testid="button-inscricao-para-outro"
          >
            <Card className="hover-elevate cursor-pointer transition-all">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">Para outra pessoa</CardTitle>
                    <CardDescription>
                      Inscrever um amigo ou familiar
                    </CardDescription>
                    <p className="text-xs text-muted-foreground mt-1">Em breve</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>
        </div>
      </div>
    </div>
  );
}
