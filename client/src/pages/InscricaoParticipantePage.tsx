import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Users, ArrowLeft, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { useAthleteAuth } from "@/contexts/AthleteAuthContext";
import { useEffect } from "react";

export default function InscricaoParticipantePage() {
  const [, params] = useRoute("/evento/:slug/inscricao/participante");
  const [, setLocation] = useLocation();
  const { athlete, isLoading } = useAthleteAuth();
  const slug = params?.slug;

  useEffect(() => {
    if (!isLoading && !athlete) {
      const redirectUrl = `/evento/${slug}/inscricao/participante`;
      setLocation(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }
  }, [isLoading, athlete, slug, setLocation]);

  const handleParaMim = () => {
    setLocation(`/evento/${slug}/inscricao/modalidade`);
  };

  const handleParaOutro = () => {
    console.log("Inscrição para outra pessoa - em desenvolvimento");
  };

  const handleVoltar = () => {
    setLocation(`/evento/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
          <div className="mb-8">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={handleVoltar}
            className="mb-4 -ml-4"
            data-testid="button-voltar"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
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
                      Inscrição para {athlete.nome}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </button>

          <button 
            className="text-left opacity-50"
            onClick={handleParaOutro}
            disabled
            data-testid="button-inscricao-para-outro"
          >
            <Card className="cursor-not-allowed transition-all">
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
