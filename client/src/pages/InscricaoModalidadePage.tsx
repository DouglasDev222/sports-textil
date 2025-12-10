import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ShieldCheck, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import { useAthleteAuth } from "@/contexts/AthleteAuthContext";

interface ModalityInfo {
  id: string;
  nome: string;
  distancia: string;
  unidadeDistancia: string;
  horarioLargada: string;
  descricao: string | null;
  tipoAcesso: string;
  preco: number;
  taxaComodidade: number;
  limiteVagas: number | null;
  vagasDisponiveis: number | null;
  idadeMinima: number | null;
  ordem: number;
}

interface ShirtSize {
  id: string;
  tamanho: string;
  disponivel: number;
}

interface RegistrationInfo {
  event: {
    id: string;
    nome: string;
    slug: string;
    entregaCamisaNoKit: boolean;
  };
  modalities: ModalityInfo[];
  activeBatch: {
    id: string;
    nome: string;
  } | null;
  shirtSizes: {
    byModality: boolean;
    data: ShirtSize[] | { modalityId: string; sizes: ShirtSize[] }[];
  };
}

export default function InscricaoModalidadePage() {
  const [, params] = useRoute("/evento/:slug/inscricao/modalidade");
  const [, setLocation] = useLocation();
  const { athlete, isLoading: authLoading } = useAthleteAuth();
  const slug = params?.slug;
  
  const [modalidadeSelecionada, setModalidadeSelecionada] = useState("");
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState("");
  const [codigoComprovacao, setCodigoComprovacao] = useState("");

  useEffect(() => {
    if (!authLoading && !athlete) {
      const redirectUrl = `/evento/${slug}/inscricao/modalidade`;
      setLocation(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }
  }, [authLoading, athlete, slug, setLocation]);

  const { data, isLoading, error } = useQuery<{ success: boolean; data: RegistrationInfo }>({
    queryKey: ["/api/registrations/events", slug, "registration-info"],
    queryFn: async () => {
      const response = await fetch(`/api/registrations/events/${slug}/registration-info`);
      return response.json();
    },
    enabled: !!slug && !!athlete,
  });

  const handleVoltar = () => {
    setLocation(`/evento/${slug}/inscricao/participante`);
  };

  const handleContinuar = () => {
    if (modalidadeSelecionada && tamanhoSelecionado) {
      const modality = data?.data?.modalities.find(m => m.id === modalidadeSelecionada);
      
      if (!modality) return;
      
      if (modality.tipoAcesso === "voucher" && !codigoComprovacao) {
        return;
      }
      
      const url = `/evento/${slug}/inscricao/resumo?modalidade=${encodeURIComponent(modalidadeSelecionada)}&tamanho=${encodeURIComponent(tamanhoSelecionado)}${codigoComprovacao ? `&codigo=${encodeURIComponent(codigoComprovacao)}` : ''}`;
      
      setLocation(url);
    }
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
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
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

  if (error || !data?.success) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Erro ao carregar dados</h1>
          <p className="text-muted-foreground mb-6">
            Não foi possível carregar as informações do evento.
          </p>
          <Button onClick={() => setLocation(`/evento/${slug}`)}>
            Voltar para o evento
          </Button>
        </div>
      </div>
    );
  }

  const { modalities, shirtSizes, activeBatch } = data.data;
  const selectedModality = modalities.find(m => m.id === modalidadeSelecionada);
  
  let availableSizes: ShirtSize[] = [];
  if (shirtSizes.byModality && modalidadeSelecionada) {
    const modalitySizes = (shirtSizes.data as { modalityId: string; sizes: ShirtSize[] }[])
      .find(s => s.modalityId === modalidadeSelecionada);
    availableSizes = modalitySizes?.sizes || [];
  } else if (!shirtSizes.byModality) {
    availableSizes = shirtSizes.data as ShirtSize[];
  }

  const taxaComodidadeValor = selectedModality?.taxaComodidade ?? 0;
  const valorModalidade = selectedModality?.preco ?? 0;
  const valorTotal = valorModalidade + taxaComodidadeValor;

  const requiresCode = selectedModality?.tipoAcesso === "voucher";
  const requiresApproval = selectedModality?.tipoAcesso === "aprovacao_manual" || selectedModality?.tipoAcesso === "pcd";
  
  const requiresShirtSize = availableSizes.length > 0;
  
  const podeAvancar = modalidadeSelecionada && 
    (!requiresShirtSize || tamanhoSelecionado) && 
    (!requiresCode || codigoComprovacao.trim() !== "");

  const getTipoAcessoBadge = (tipoAcesso: string) => {
    switch (tipoAcesso) {
      case "gratuita":
        return <Badge variant="secondary">Gratuita</Badge>;
      case "paga":
        return null;
      case "voucher":
        return <Badge>Código</Badge>;
      case "pcd":
        return <Badge>PCD</Badge>;
      case "aprovacao_manual":
        return <Badge>Aprovação</Badge>;
      default:
        return null;
    }
  };

  const formatPrice = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "Preço indisponível";
    if (value === 0) return "Gratuito";
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
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
            Escolha a Modalidade
          </h1>
          <p className="text-muted-foreground">
            Selecione a distância e o tamanho da sua camisa
          </p>
          {activeBatch && (
            <p className="text-sm text-primary mt-1">
              Lote atual: {activeBatch.nome}
            </p>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Modalidade</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={modalidadeSelecionada} onValueChange={setModalidadeSelecionada}>
                <div className="space-y-2">
                  {modalities.map((modality, idx) => {
                    const isSoldOut = modality.vagasDisponiveis !== null && modality.vagasDisponiveis <= 0;
                    const isBlocked = (modality as any).inscricaoBloqueada === true;
                    const blockReason = (modality as any).motivoBloqueio;
                    const isUnavailable = isSoldOut || isBlocked;
                    
                    return (
                      <div
                        key={modality.id}
                        className={`flex items-center justify-between p-4 border rounded-md transition-all ${
                          modalidadeSelecionada === modality.id 
                            ? 'border-primary bg-primary/5' 
                            : isUnavailable 
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'hover-elevate'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <RadioGroupItem 
                            value={modality.id} 
                            id={`modalidade-${idx}`}
                            disabled={isUnavailable}
                            data-testid={`radio-modalidade-${idx}`}
                          />
                          <Label htmlFor={`modalidade-${idx}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-foreground">{modality.nome}</span>
                                {getTipoAcessoBadge(modality.tipoAcesso)}
                                {isSoldOut && (
                                  <Badge variant="destructive">Esgotado</Badge>
                                )}
                                {isBlocked && !isSoldOut && (
                                  <Badge variant="destructive">Indisponível</Badge>
                                )}
                              </div>
                              <Badge variant="secondary" className="font-semibold">
                                {formatPrice(modality.preco)}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                              <span>{modality.distancia} {modality.unidadeDistancia}</span>
                              <span>Largada: {modality.horarioLargada}</span>
                              {modality.vagasDisponiveis !== null && !isSoldOut && (
                                <span>{modality.vagasDisponiveis} vagas</span>
                              )}
                              {isBlocked && blockReason && (
                                <span className="text-destructive">{blockReason}</span>
                              )}
                            </div>
                          </Label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {requiresCode && (
            <Alert className="border-primary/50 bg-primary/5">
              <div className="flex gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <AlertDescription className="text-sm">
                    Esta modalidade requer um código de acesso. Insira o código fornecido para continuar.
                  </AlertDescription>
                  
                  <div className="mt-3">
                    <Label htmlFor="codigo-comprovacao" className="text-sm font-medium mb-2 block">
                      Código de Acesso
                    </Label>
                    <Input
                      id="codigo-comprovacao"
                      placeholder="Ex: VOUCHER2025-ABC123"
                      value={codigoComprovacao}
                      onChange={(e) => setCodigoComprovacao(e.target.value)}
                      className="max-w-xs"
                      data-testid="input-codigo-comprovacao"
                    />
                  </div>
                </div>
              </div>
            </Alert>
          )}

          {requiresApproval && (
            <Alert className="border-primary/50 bg-primary/5">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <AlertDescription className="text-sm">
                    Esta modalidade requer aprovação. Sua inscrição será analisada e você receberá a confirmação por email em até 48 horas.
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {availableSizes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tamanho da Camisa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {availableSizes.map((size, idx) => {
                    const isUnavailable = size.disponivel <= 0;
                    return (
                      <Button
                        key={size.id}
                        variant={tamanhoSelecionado === size.tamanho ? "default" : "outline"}
                        onClick={() => !isUnavailable && setTamanhoSelecionado(size.tamanho)}
                        className={`font-semibold ${isUnavailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isUnavailable}
                        data-testid={`button-tamanho-${size.tamanho}`}
                      >
                        {size.tamanho}
                        {isUnavailable && " (Esgotado)"}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              {selectedModality ? (
                <>
                  {valorTotal > 0 ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(valorModalidade)} + Taxa R$ {taxaComodidadeValor.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-lg md:text-xl font-bold text-foreground">
                        Total: R$ {valorTotal.toFixed(2).replace('.', ',')}
                      </p>
                    </>
                  ) : (
                    <p className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Inscrição Gratuita
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg md:text-xl font-bold text-foreground">
                    Selecione uma modalidade
                  </p>
                </>
              )}
            </div>
            <Button
              size="lg"
              onClick={handleContinuar}
              disabled={!podeAvancar}
              className="font-semibold"
              data-testid="button-continuar"
            >
              Continuar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
