import { useState, useEffect, useCallback } from "react";
import { useRoute, useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  Tag, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Hash, 
  Shirt, 
  Users, 
  Clock, 
  Copy, 
  QrCode,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { useAthleteAuth } from "@/contexts/AthleteAuthContext";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface OrderData {
  order: {
    id: string;
    numeroPedido: number;
    valorTotal: number;
    valorDesconto: number;
    status: string;
    metodoPagamento: string | null;
    codigoVoucher: string | null;
    dataExpiracao: string | null;
    idPagamentoGateway: string | null;
    dataPagamento: string | null;
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

interface PaymentResponse {
  success: boolean;
  data?: {
    paymentId: string;
    status: string;
    qrCode: string;
    qrCodeBase64: string;
    expirationDate: string;
    orderId: string;
    dataExpiracao: string;
  };
  error?: string;
  errorCode?: string;
}

interface PaymentStatusResponse {
  success: boolean;
  data?: {
    orderId: string;
    orderStatus: string;
    paymentCreated: boolean;
    paymentId?: string;
    paymentStatus?: string;
  };
  error?: string;
}

interface CouponValidationResponse {
  valid: boolean;
  coupon?: {
    id: string;
    code: string;
    discountType: string;
    discountValue: string;
    discountAmount: string;
    finalValue: string;
  };
  error?: string;
  message?: string;
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function InscricaoPagamentoPage() {
  const [, params] = useRoute("/evento/:slug/inscricao/pagamento");
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const { athlete, isLoading: authLoading } = useAthleteAuth();
  
  const [cupom, setCupom] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<CouponValidationResponse["coupon"] | null>(null);
  const [cupomValidando, setCupomValidando] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [pixData, setPixData] = useState<{
    qrCode: string;
    qrCodeBase64: string;
    paymentId: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const searchParams = new URLSearchParams(searchString);
  const orderId = searchParams.get("orderId");
  const slug = params?.slug;

  useEffect(() => {
    if (!authLoading && !athlete) {
      const redirectUrl = `/evento/${slug}/inscricao/pagamento?orderId=${orderId}`;
      setLocation(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }
  }, [authLoading, athlete, slug, orderId, setLocation]);

  const { data, isLoading, error, refetch } = useQuery<{ success: boolean; data: OrderData }>({
    queryKey: ["/api/registrations/orders", orderId],
    queryFn: async () => {
      const response = await fetch(`/api/registrations/orders/${orderId}`, {
        credentials: "include"
      });
      return response.json();
    },
    enabled: !!orderId && !!athlete,
  });

  useEffect(() => {
    if (!pixData || !orderId || paymentConfirmed || isExpired) return;

    const pollPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payments/status/${orderId}`, {
          credentials: "include"
        });
        const result: PaymentStatusResponse = await response.json();
        
        if (result.success && result.data) {
          if (result.data.orderStatus === "pago" || result.data.paymentStatus === "approved") {
            setPaymentConfirmed(true);
            queryClient.invalidateQueries({ queryKey: ["/api/registrations/orders", orderId] });
            toast({
              title: "Pagamento confirmado!",
              description: "Sua inscrição foi confirmada com sucesso.",
            });
          }
        }
      } catch (error) {
        console.error("Erro ao verificar status do pagamento:", error);
      }
    };

    const interval = setInterval(pollPaymentStatus, 5000);
    pollPaymentStatus();

    return () => clearInterval(interval);
  }, [pixData, orderId, paymentConfirmed, isExpired, toast]);

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/payments/create", {
        orderId,
        paymentMethod: "pix"
      });
      return response.json() as Promise<PaymentResponse>;
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        setPixData({
          qrCode: response.data.qrCode,
          qrCodeBase64: response.data.qrCodeBase64,
          paymentId: response.data.paymentId
        });
        toast({
          title: "PIX gerado com sucesso!",
          description: "Escaneie o QR Code ou copie o código para pagar.",
        });
      } else {
        if (response.errorCode === "ORDER_EXPIRED") {
          setIsExpired(true);
        }
        toast({
          title: "Erro ao gerar PIX",
          description: response.error || "Tente novamente.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erro ao gerar PIX",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const orderData = data?.data;

  useEffect(() => {
    if (orderData?.order.status === "pago" || paymentConfirmed) {
      if (orderData?.registrations[0]?.id) {
        setLocation(`/inscricao/${orderData.registrations[0].id}?sucesso=1`);
      } else {
        setLocation("/minhas-inscricoes");
      }
    }
  }, [orderData?.order.status, orderData?.registrations, paymentConfirmed, setLocation]);

  useEffect(() => {
    if (orderData?.order.idPagamentoGateway && orderData.order.metodoPagamento === "pix" && !pixData) {
      setPixData({
        qrCode: "",
        qrCodeBase64: "",
        paymentId: orderData.order.idPagamentoGateway
      });
    }
  }, [orderData?.order.idPagamentoGateway, orderData?.order.metodoPagamento, pixData]);

  useEffect(() => {
    if (!orderData?.order.dataExpiracao) return;
    
    const updateTimeRemaining = () => {
      const expiration = new Date(orderData.order.dataExpiracao!).getTime();
      const now = Date.now();
      const remaining = expiration - now;
      
      if (remaining <= 0) {
        setTimeRemaining(0);
        setIsExpired(true);
      } else {
        setTimeRemaining(remaining);
        setIsExpired(false);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [orderData?.order.dataExpiracao]);

  const valorTotal = orderData?.order.valorTotal || 0;
  const valorDescontoFromOrder = parseFloat(orderData?.order.valorDesconto || "0");
  
  const valorDesconto = cupomAplicado ? parseFloat(cupomAplicado.discountAmount) : valorDescontoFromOrder;
  const valorFinal = valorTotal;
  const valorOriginalSemDesconto = valorTotal + valorDescontoFromOrder;

  const handleVoltar = () => {
    setLocation(`/evento/${slug}`);
  };

  const handleAplicarCupom = async () => {
    if (!orderId || !cupom.trim()) {
      toast({
        title: "Erro",
        description: "Dados incompletos para aplicar o cupom.",
        variant: "destructive",
      });
      return;
    }

    setCupomValidando(true);
    try {
      const response = await apiRequest("POST", "/api/coupons/apply", {
        orderId,
        couponCode: cupom.trim().toUpperCase(),
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        setCupomAplicado({
          id: "",
          code: result.data.couponCode,
          discountType: "",
          discountValue: "",
          discountAmount: result.data.discountAmount,
          finalValue: result.data.valorFinal,
        });
        await refetch();
        toast({
          title: "Cupom aplicado!",
          description: `Desconto de R$ ${parseFloat(result.data.discountAmount).toFixed(2)} aplicado.`,
        });
      } else {
        toast({
          title: "Cupom inválido",
          description: result.error || "O cupom informado não existe ou expirou.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao aplicar cupom",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setCupomValidando(false);
    }
  };

  const handleRemoverCupom = async () => {
    if (!orderId) return;
    
    setCupomValidando(true);
    try {
      const response = await apiRequest("POST", "/api/coupons/remove", { orderId });
      const result = await response.json();
      
      if (result.success) {
        setCupomAplicado(null);
        setCupom("");
        await refetch();
        toast({
          title: "Cupom removido",
          description: "O desconto foi removido do pedido.",
        });
      } else {
        toast({
          title: "Erro ao remover cupom",
          description: result.error || "Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao remover cupom",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setCupomValidando(false);
    }
  };

  const handleGerarPix = () => {
    if (isExpired) {
      toast({
        title: "Tempo esgotado",
        description: "O tempo para pagamento expirou. Por favor, faça uma nova inscrição.",
        variant: "destructive",
      });
      return;
    }
    createPaymentMutation.mutate();
  };

  const handleCopyPixCode = useCallback(async () => {
    if (!pixData?.qrCode) return;
    
    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      toast({
        title: "Código copiado!",
        description: "Cole no app do seu banco para pagar.",
      });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Tente copiar manualmente.",
        variant: "destructive",
      });
    }
  }, [pixData?.qrCode, toast]);

  const handleNovaInscricao = () => {
    setLocation(`/evento/${slug}`);
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
          <h1 className="text-2xl font-bold mb-2" data-testid="text-erro-pedido">Pedido não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            Não foi possível identificar o pedido para pagamento.
          </p>
          <Button onClick={() => setLocation(`/evento/${slug}`)} data-testid="button-voltar-evento">
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
          <h1 className="text-2xl font-bold mb-2" data-testid="text-erro-carregar">Erro ao carregar pedido</h1>
          <p className="text-muted-foreground mb-6">
            Não foi possível carregar os dados do pedido.
          </p>
          <Button onClick={() => setLocation(`/evento/${slug}`)} data-testid="button-voltar-evento-erro">
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
          <h1 className="text-2xl font-bold mb-2" data-testid="text-pedido-pago">Pedido já pago</h1>
          <p className="text-muted-foreground mb-6">
            Este pedido já foi pago e sua inscrição está confirmada.
          </p>
          <Button onClick={() => setLocation("/minhas-inscricoes")} data-testid="button-ver-inscricoes">
            Ver minhas inscrições
          </Button>
        </div>
      </div>
    );
  }

  if (orderData.order.status === "expirado" || isExpired) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 text-center">
          <AlertTriangle className="h-16 w-16 mx-auto text-yellow-600 mb-4" />
          <h1 className="text-2xl font-bold mb-2" data-testid="text-tempo-esgotado">Tempo esgotado</h1>
          <p className="text-muted-foreground mb-6">
            O tempo para pagamento expirou. As vagas foram liberadas.
          </p>
          <Button onClick={handleNovaInscricao} data-testid="button-nova-inscricao">
            Fazer nova inscrição
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
          <div className="flex items-center gap-2 text-muted-foreground mb-2 flex-wrap">
            <Hash className="h-4 w-4" />
            <span className="text-sm" data-testid="text-numero-pedido">Pedido #{orderData.order.numeroPedido}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Pagamento
          </h1>
          <p className="text-muted-foreground">
            Finalize sua inscrição para {orderData.evento?.nome}
          </p>
        </div>

        {timeRemaining !== null && orderData.order.dataExpiracao && (
          <Card className="mb-4 border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Tempo restante para pagamento
                  </span>
                </div>
                <Badge 
                  variant="outline" 
                  className="text-lg font-mono font-bold border-yellow-600 text-yellow-800 dark:text-yellow-200"
                  data-testid="badge-tempo-restante"
                >
                  {formatTimeRemaining(timeRemaining)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {!pixData && (
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
                        disabled={!cupom || cupomValidando}
                        data-testid="button-aplicar-cupom"
                      >
                        {cupomValidando ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Validando...
                          </>
                        ) : (
                          "Aplicar"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2 p-3 bg-primary/10 rounded-md flex-wrap">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold text-foreground">{cupomAplicado.code}</p>
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
          )}

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
                      <span className="text-sm text-muted-foreground">Valor da Inscrição</span>
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
                  <span className="text-2xl font-bold text-primary" data-testid="text-valor-total">
                    R$ {valorFinal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {pixData ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Pague com PIX
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <img 
                      src={`data:image/png;base64,${pixData.qrCodeBase64}`} 
                      alt="QR Code PIX"
                      className="w-48 h-48"
                      data-testid="img-qrcode-pix"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Escaneie o QR Code acima com o app do seu banco
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Ou copie o código PIX:
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      value={pixData.qrCode} 
                      readOnly 
                      className="font-mono text-xs"
                      data-testid="input-codigo-pix"
                    />
                    <Button
                      variant="outline"
                      onClick={handleCopyPixCode}
                      data-testid="button-copiar-pix"
                    >
                      {copied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Aguardando confirmação do pagamento...</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Forma de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 border rounded-md">
                    <QrCode className="h-6 w-6 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">PIX</p>
                      <p className="text-sm text-muted-foreground">
                        Pagamento instantâneo via QR Code
                      </p>
                    </div>
                    <Badge variant="secondary">Recomendado</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Clique no botão abaixo para gerar o código PIX e finalizar o pagamento.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {!pixData && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <Button
              size="lg"
              onClick={handleGerarPix}
              disabled={createPaymentMutation.isPending || isExpired}
              className="w-full font-semibold"
              data-testid="button-gerar-pix"
            >
              {createPaymentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando PIX...
                </>
              ) : isExpired ? (
                "Tempo esgotado"
              ) : (
                `Gerar PIX - R$ ${valorFinal.toFixed(2).replace('.', ',')}`
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
