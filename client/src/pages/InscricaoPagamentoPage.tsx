import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Tag, CreditCard, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";

const mockCategorias = [
  { nome: "5km", valor: "R$ 80,00", valorNumerico: 80 },
  { nome: "10km", valor: "R$ 100,00", valorNumerico: 100 },
  { nome: "21km", valor: "R$ 150,00", valorNumerico: 150 },
  { nome: "42km", valor: "R$ 200,00", valorNumerico: 200 },
  { nome: "PCD (Pessoa com Deficiência)", valor: "R$ 40,00", valorNumerico: 40 },
];

const cuponsValidos = {
  "DESCONTO10": { desconto: 10, tipo: "percentual" },
  "CORRIDA50": { desconto: 50, tipo: "fixo" },
};

export default function InscricaoPagamentoPage() {
  const [, params] = useRoute("/evento/:slug/inscricao/pagamento");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [cupom, setCupom] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<string | null>(null);
  const [processandoPagamento, setProcessandoPagamento] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const modalidade = searchParams.get("modalidade") || "";
  const tamanho = searchParams.get("tamanho") || "";
  const equipe = searchParams.get("equipe") || "";

  const categoriaInfo = mockCategorias.find(c => c.nome === modalidade);
  const valorOriginal = categoriaInfo?.valorNumerico || 0;
  
  let valorDesconto = 0;
  if (cupomAplicado && cuponsValidos[cupomAplicado as keyof typeof cuponsValidos]) {
    const cupomInfo = cuponsValidos[cupomAplicado as keyof typeof cuponsValidos];
    if (cupomInfo.tipo === "percentual") {
      valorDesconto = valorOriginal * (cupomInfo.desconto / 100);
    } else {
      valorDesconto = cupomInfo.desconto;
    }
  }

  const valorFinal = valorOriginal - valorDesconto;

  const handleVoltar = () => {
    setLocation(`/evento/${params?.slug}/inscricao/resumo?modalidade=${modalidade}&tamanho=${tamanho}`);
  };

  const handleAplicarCupom = () => {
    const cupomUpper = cupom.toUpperCase();
    if (cuponsValidos[cupomUpper as keyof typeof cuponsValidos]) {
      setCupomAplicado(cupomUpper);
      toast({
        title: "Cupom aplicado!",
        description: "Seu desconto foi aplicado com sucesso.",
      });
    } else {
      toast({
        title: "Cupom inválido",
        description: "O cupom informado não existe ou expirou.",
        variant: "destructive",
      });
    }
  };

  const handleRemoverCupom = () => {
    setCupomAplicado(null);
    setCupom("");
  };

  const handleFinalizarPagamento = async () => {
    setProcessandoPagamento(true);
    
    setTimeout(() => {
      toast({
        title: "Pagamento realizado!",
        description: "Sua inscrição foi confirmada com sucesso.",
      });
      setProcessandoPagamento(false);
      setLocation("/minhas-inscricoes");
    }, 2000);
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
            Pagamento
          </h1>
          <p className="text-muted-foreground">
            Finalize sua inscrição
          </p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Cupom de Desconto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!cupomAplicado ? (
                <div className="space-y-3">
                  <Label htmlFor="cupom" className="text-sm text-muted-foreground">
                    Digite seu cupom de desconto
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="cupom"
                      placeholder="DESCONTO10"
                      value={cupom}
                      onChange={(e) => setCupom(e.target.value.toUpperCase())}
                      data-testid="input-cupom"
                    />
                    <Button
                      variant="outline"
                      onClick={handleAplicarCupom}
                      disabled={!cupom}
                      data-testid="button-aplicar-cupom"
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-md">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{cupomAplicado}</p>
                      <p className="text-sm text-muted-foreground">
                        Desconto aplicado: R$ {valorDesconto.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoverCupom}
                    data-testid="button-remover-cupom"
                  >
                    Remover
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Modalidade</span>
                  <span className="font-medium text-foreground">{modalidade}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Tamanho da Camisa</span>
                  <span className="font-medium text-foreground">{tamanho}</span>
                </div>
                {equipe && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-muted-foreground">Equipe</span>
                    <span className="font-medium text-foreground">{equipe}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Valor da Inscrição</span>
                  <span className="font-medium text-foreground">
                    R$ {valorOriginal.toFixed(2)}
                  </span>
                </div>
                {cupomAplicado && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-primary">Desconto</span>
                    <span className="font-medium text-primary">
                      - R$ {valorDesconto.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-lg font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    R$ {valorFinal.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Forma de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge variant="secondary" className="text-sm">
                  Pagamento via PIX ou Cartão de Crédito
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Você será redirecionado para finalizar o pagamento de forma segura.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Button
            size="lg"
            onClick={handleFinalizarPagamento}
            disabled={processandoPagamento}
            className="w-full font-semibold"
            data-testid="button-finalizar-pagamento"
          >
            {processandoPagamento ? "Processando..." : `Finalizar Pagamento - R$ ${valorFinal.toFixed(2)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
