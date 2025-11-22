import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, User, Shirt, Award } from "lucide-react";
import Header from "@/components/Header";

const mockCategorias = [
  { nome: "5km", valor: "R$ 80,00" },
  { nome: "10km", valor: "R$ 100,00" },
  { nome: "21km", valor: "R$ 150,00" },
  { nome: "42km", valor: "R$ 200,00" },
  { nome: "PCD (Pessoa com Deficiência)", valor: "R$ 40,00" },
];

export default function InscricaoResumoPage() {
  const [, params] = useRoute("/evento/:slug/inscricao/resumo");
  const [, setLocation] = useLocation();
  const [equipe, setEquipe] = useState("");

  const searchParams = new URLSearchParams(window.location.search);
  const modalidade = searchParams.get("modalidade") || "";
  const tamanho = searchParams.get("tamanho") || "";

  const mockUsuario = {
    nome: "João Silva",
    cpf: "123.456.789-00"
  };

  const mockEvento = {
    nome: "Maratona de São Paulo 2025"
  };

  const modalidadeValor = mockCategorias.find(c => c.nome === modalidade)?.valor;

  const handleVoltar = () => {
    setLocation(`/evento/${params?.slug}/inscricao/modalidade`);
  };

  const handleContinuar = () => {
    setLocation(`/evento/${params?.slug}/inscricao/pagamento?modalidade=${modalidade}&tamanho=${tamanho}&equipe=${encodeURIComponent(equipe)}`);
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
                Participante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{mockUsuario.nome}</p>
                <p className="text-sm text-muted-foreground">CPF: {mockUsuario.cpf}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5" />
                Modalidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">{modalidade}</p>
                <p className="text-lg font-bold text-primary">{modalidadeValor}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shirt className="h-5 w-5" />
                Tamanho da Camisa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-foreground">{tamanho}</p>
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
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg md:text-xl font-bold text-foreground">{modalidadeValor}</p>
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
