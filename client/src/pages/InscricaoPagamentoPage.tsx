import { useState, useEffect } from "react";
import { useRoute, useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Tag, CreditCard, CheckCircle2, AlertCircle, Loader2, Hash, Shirt, Users } from "lucide-react";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { useAthleteAuth } from "@/contexts/AthleteAuthContext";

interface OrderData {
  order: {
    id: string;
    numeroPedido: number;
    valorTotal: number;
    valorDesconto: number;
    status: string;
    metodoPagamento: string | null;
    codigoVoucher: string | null;
  };
  evento: {
    id: string;
    nome: string;
    slug: string;
    dataEvento: string;
    cidade: string;
    estado: string;
  } | null;
  registrations: Array<{
    id: string;
    numeroInscricao: number;
    tamanhoCamisa: string | null;
    equipe: string | null;
    valorUnitario: number;
    taxaComodidade: number;
    modalidade: {
      id: string;
      nome: string;
      distancia: string;
      unidadeDistancia: string;
      tipoAcesso: string;
    } | null;
  }>;
}

const cuponsValidos: Record<string, { desconto: number; tipo: "percentual" | "fixo" }> = {
  "DESCONTO10": { desconto: 10, tipo: "percentual" },
  "CORRIDA50": { desconto: 50, tipo: "fixo" },
};

export default function InscricaoPagamentoPage() {
  const [, params] = useRoute("/evento/:slug/inscricao/pagamento");
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const { athlete, isLoading: authLoading } = useAthleteAuth();
  
  const [cupom, setCupom] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<string | null>(null);
  const [processandoPagamento, setProcessandoPagamento] = useState(false);

  const searchParams = new URLSearchParams(searchString);
  const orderId = searchParams.get("orderId");
  const slug = params?.slug;

  useEffect(() => {
    if (!authLoading && !athlete) {
      const redirectUrl = `/evento/${slug}/inscricao/pagamento?orderId=${orderId}`;
      setLocation(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }
  }, [authLoading, athlete, slug, orderId, setLocation]);

  const { data, isLoading, error } = useQuery<{ success: boolean; data: OrderData }>({
    queryKey: ["/api/registrations/orders", orderId],
    queryFn: async () => {
      const response = await fetch(`/api/registrations/orders/${orderId}`, {
        credentials: "include"
      });
      return response.json();
    },
    enabled: !!orderId && !!athlete,
  });

  const orderData = data?.data;
  const valorOriginal = orderData?.order.valorTotal || 0;
  
  let valorDesconto = 0;
  if (cupomAplicado && cuponsValidos[cupomAplicado]) {
    const cupomInfo = cuponsValidos[cupomAplicado];
    if (cupomInfo.tipo === "percentual") {
      valorDesconto = valorOriginal * (cupomInfo.desconto / 100);
    } else {
      valorDesconto = Math.min(cupomInfo.desconto, valorOriginal);
    }
  }

  const valorFinal = Math.max(0, valorOriginal - valorDesconto);

  const handleVoltar = () => {
    setLocation(`/evento/${slug}`);
  };

  const handleAplicarCupom = () => {
    const cupomUpper = cupom.toUpperCase();
    if (cuponsValidos[cupomUpper]) {
      setCupomAplicado(cupomUpper);
      toast({
        title: "Cupom aplicado!",
        description: "Seu desconto foi aplicado com sucesso.",
      });
    } else {
      toast({
        title: "Cupom invalido",
        description: "O cupom informado nao existe ou expirou.",
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
        description: "Sua inscricao foi confirmada com sucesso.",
      });
      setProcessandoPagamento(false);
      if (orderData?.registrations[0]?.id) {
        setLocation(`/inscricao/${orderData.registrations[0].id}?sucesso=1`);
      } else {
        setLocation("/minhas-inscricoes");
      }
    }, 2000);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
          <Skeleton className="h-8 w-24 mb-6" />
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
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

  if (!orderId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Pedido nao encontrado</h1>
          <p className="text-muted-foreground mb-6">
            Nao foi possivel identificar o pedido para pagamento.
          </p>
          <Button onClick={() => setLocation(`/evento/${slug}`)}>
            Voltar para o evento
          </Button>
        </div>
      </div>
    );
  }

  if (error || !data?.success || !orderData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Erro ao carregar pedido</h1>
          <p className="text-muted-foreground mb-6">
            Nao foi possivel carregar os dados do pedido.
          </p>
          <Button onClick={() => setLocation(`/evento/${slug}`)}>
            Voltar para o evento
          </Button>
        </div>
      </div>
    );
  }

  if (orderData.order.status === "pago") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 text-center">
          <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Pedido ja pago</h1>
          <p className="text-muted-foreground mb-6">
            Este pedido ja foi pago e sua inscricao esta confirmada.
          </p>
          <Button onClick={() => setLocation("/minhas-inscricoes")}>
            Ver minhas inscricoes
          </Button>
        </div>
      </div>
    );
  }

  const registration = orderData.registrations[0];

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
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Hash className="h-4 w-4" />
            <span className="text-sm">Pedido #{orderData.order.numeroPedido}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Pagamento
          </h1>
          <p className="text-muted-foreground">
            Finalize sua inscricao para {orderData.evento?.nome}
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
                <div className="flex items-center justify-between gap-2 p-3 bg-primary/10 rounded-md flex-wrap">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{cupomAplicado}</p>
                      <p className="text-sm text-muted-foreground">
                        Desconto aplicado: R$ {valorDesconto.toFixed(2).replace('.', ',')}
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
                {registration && (
                  <>
                    <div className="flex items-center justify-between gap-2 py-2 border-b flex-wrap">
                      <span className="text-sm text-muted-foreground">Modalidade</span>
                      <span className="font-medium text-foreground">
                        {registration.modalidade?.nome} ({registration.modalidade?.distancia} {registration.modalidade?.unidadeDistancia})
                      </span>
                    </div>
                    {registration.tamanhoCamisa && (
                      <div className="flex items-center justify-between gap-2 py-2 border-b flex-wrap">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Shirt className="h-4 w-4" />
                          Tamanho da Camisa
                        </span>
                        <span className="font-medium text-foreground">{registration.tamanhoCamisa}</span>
                      </div>
                    )}
                    {registration.equipe && (
                      <div className="flex items-center justify-between gap-2 py-2 border-b flex-wrap">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Equipe
                        </span>
                        <span className="font-medium text-foreground">{registration.equipe}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 py-2 border-b flex-wrap">
                      <span className="text-sm text-muted-foreground">Valor da Inscricao</span>
                      <span className="font-medium text-foreground">
                        R$ {registration.valorUnitario.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    {registration.taxaComodidade > 0 && (
                      <div className="flex items-center justify-between gap-2 py-2 border-b flex-wrap">
                        <span className="text-sm text-muted-foreground">Taxa de Comodidade</span>
                        <span className="font-medium text-foreground">
                          R$ {registration.taxaComodidade.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {cupomAplicado && valorDesconto > 0 && (
                  <div className="flex items-center justify-between gap-2 py-2 border-b flex-wrap">
                    <span className="text-sm text-green-600 dark:text-green-400">Desconto</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      - R$ {valorDesconto.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between gap-2 pt-2 flex-wrap">
                  <span className="text-lg font-semibold text-foreground">Total a Pagar</span>
                  <span className="text-2xl font-bold text-primary">
                    R$ {valorFinal.toFixed(2).replace('.', ',')}
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
                  Pagamento via PIX ou Cartao de Credito
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Voce sera redirecionado para finalizar o pagamento de forma segura.
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
            {processandoPagamento ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              `Finalizar Pagamento - R$ ${valorFinal.toFixed(2).replace('.', ',')}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
