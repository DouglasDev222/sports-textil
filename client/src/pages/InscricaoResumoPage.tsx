import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, User, Shirt, Award } from "lucide-react";
import Header from "@/components/Header";


export default function InscricaoResumoPage() {
  const [, params] = useRoute("/evento/:slug/inscricao/resumo");
  const [, setLocation] = useLocation();
  const [equipe, setEquipe] = useState("");

  const searchParams = new URLSearchParams(window.location.search);
  const modalidade = searchParams.get("modalidade") || "";
  const tamanho = searchParams.get("tamanho") || "";
  const valorModalidade = parseFloat(searchParams.get("valor") || "0");
  const taxaComodidade = parseFloat(searchParams.get("taxaComodidade") || "0");
  const valorTotal = valorModalidade + taxaComodidade;

  const mockUsuario = {
    nome: "João Silva",
    cpf: "123.456.789-00",
    dataNascimento: "15/03/1990"
  };

  const mockEvento = {
    nome: "Maratona de São Paulo 2025"
  };

  const handleVoltar = () => {
    setLocation(`/evento/${params?.slug}/inscricao/modalidade`);
  };

  const handleContinuar = () => {
    setLocation(`/evento/${params?.slug}/inscricao/pagamento?modalidade=${encodeURIComponent(modalidade)}&tamanho=${tamanho}&valor=${valorModalidade}&taxaComodidade=${taxaComodidade}&equipe=${encodeURIComponent(equipe)}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        <Button
          variant="ghost"
          onClick={handleVoltar}
          className="mb-6"
          data-testid="button-voltar"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Resumo da Inscrição
          </h1>
          <p className="text-muted-foreground">
            Confira os dados da sua inscrição
          </p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-foreground">{mockEvento.nome}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados do Participante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Participante</p>
                <p className="font-semibold text-foreground">{mockUsuario.nome}</p>
                <p className="text-sm text-muted-foreground">CPF: {mockUsuario.cpf}</p>
                <p className="text-sm text-muted-foreground">Data de Nascimento: {mockUsuario.dataNascimento}</p>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-start gap-2 mb-2">
                  <Award className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Modalidade</p>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{modalidade}</p>
                      <p className="text-lg font-bold text-foreground">R$ {valorModalidade.toFixed(2)}</p>
                    </div>
                    {taxaComodidade > 0 && (
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-muted-foreground">Taxa de comodidade</p>
                        <p className="text-sm text-muted-foreground">R$ {taxaComodidade.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-start gap-2">
                  <Shirt className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tamanho da Camisa</p>
                    <p className="font-semibold text-foreground">{tamanho}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Equipe (Opcional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="equipe" className="text-sm text-muted-foreground">
                  Nome da equipe ou assessoria esportiva
                </Label>
                <Input
                  id="equipe"
                  placeholder="Ex: Assessoria RunFast"
                  value={equipe}
                  onChange={(e) => setEquipe(e.target.value)}
                  data-testid="input-equipe"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">
                R$ {valorModalidade.toFixed(2)} + Taxa R$ {taxaComodidade.toFixed(2)}
              </p>
              <p className="text-lg md:text-xl font-bold text-foreground">
                Total: R$ {valorTotal.toFixed(2)}
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleContinuar}
              className="font-semibold"
              data-testid="button-continuar"
            >
              Ir para Pagamento
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
