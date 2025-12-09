import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Clock, Award, Info, FileText, Download, Package, Map, AlertCircle } from "lucide-react";
import heroImage from '@assets/generated_images/Marathon_runners_landscape_hero_b439e181.png';
import { formatDateOnlyLong } from "@/lib/timezone";
import type { Event, Modality, RegistrationBatch, Price, Attachment } from "@shared/schema";

interface EventWithDetails extends Event {
  modalities: Modality[];
  activeBatch: RegistrationBatch | null;
  prices: Price[];
  attachments: Attachment[];
}

export default function EventoDetailPage() {
  const [, params] = useRoute("/evento/:slug");
  const [, setLocation] = useLocation();
  const slug = params?.slug;

  const { data, isLoading, error } = useQuery<{ success: boolean; data: EventWithDetails }>({
    queryKey: ["/api/events", slug],
    queryFn: async () => {
      const response = await fetch(`/api/events/${slug}`);
      return response.json();
    },
    enabled: !!slug,
  });

  const event = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Skeleton className="w-full h-[300px] md:h-[500px]" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Evento não encontrado</h1>
          <p className="text-muted-foreground mb-6">
            O evento que você está procurando não existe ou não está mais disponível.
          </p>
          <Button onClick={() => setLocation("/")}>
            Ver todos os eventos
          </Button>
        </div>
      </div>
    );
  }

  const formattedDate = formatDateOnlyLong(event.dataEvento);

  const handleInscricao = () => {
    setLocation(`/evento/${event.slug}/inscricao/participante`);
  };

  const handleDownload = (url: string, nome: string) => {
    window.open(url, '_blank');
  };

  const getPrice = (modalityId: string): string => {
    const modality = modalities.find(m => m.id === modalityId);
    if (modality?.tipoAcesso === "gratuita") return "Gratuito";
    
    const price = event.prices?.find(p => p.modalityId === modalityId);
    if (!price) return "Consulte";
    
    const valor = parseFloat(price.valor);
    if (valor === 0) return "Gratuito";
    
    return `R$ ${valor.toFixed(2).replace('.', ',')}`;
  };

  const modalities = event.modalities || [];
  const attachments = event.attachments || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary/75 z-10"></div>
        <img
          src={event.bannerUrl || heroImage}
          alt={event.nome}
          className="w-full h-[300px] md:h-[500px] object-cover"
        />
        <div className="absolute inset-0 z-20 flex items-end">
          <div className="w-full px-4 md:px-6 pb-8 md:pb-12">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                {event.nome}
              </h1>
              <div className="flex flex-wrap gap-2">
                {modalities.map((mod) => (
                  <Badge key={mod.id} variant="secondary" className="text-sm">
                    {mod.distancia} {mod.unidadeDistancia}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 pb-24 md:pb-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-foreground">{formattedDate}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Local
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-foreground">{event.endereco}</p>
                  <p className="text-sm text-muted-foreground">{event.cidade}, {event.estado}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Largadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-0.5">
                    {modalities.map((mod) => (
                      <div key={mod.id} className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-muted-foreground">{mod.distancia} {mod.unidadeDistancia}</span>
                        <span className="font-medium text-foreground">{mod.horarioLargada}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="sobre" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="sobre" data-testid="tab-sobre">Sobre</TabsTrigger>
                <TabsTrigger value="modalidades" data-testid="tab-modalidades">Modalidades</TabsTrigger>
                <TabsTrigger value="retirada" data-testid="tab-retirada">Retirada Kit</TabsTrigger>
                <TabsTrigger value="documentos" data-testid="tab-documentos">Documentos</TabsTrigger>
              </TabsList>

              <TabsContent value="sobre" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Sobre o Evento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {event.descricao}
                    </p>
                  </CardContent>
                </Card>

                <Card className="lg:hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Valores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-0.5">
                      {modalities.map((mod) => (
                        <div key={mod.id} className="flex items-center justify-between text-xs py-0.5">
                          <span className="text-muted-foreground">{mod.nome}</span>
                          <span className="font-medium text-foreground">{getPrice(mod.id)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="modalidades" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Modalidades Disponíveis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {modalities.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {modalities.map((mod) => (
                          <div key={mod.id} className="p-4 border rounded-md space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-base">
                                {mod.distancia} {mod.unidadeDistancia}
                              </Badge>
                              <span className="font-semibold">{getPrice(mod.id)}</span>
                            </div>
                            <p className="font-medium">{mod.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              Largada: {mod.horarioLargada}
                            </p>
                            {mod.descricao && (
                              <p className="text-sm text-muted-foreground">{mod.descricao}</p>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              {mod.limiteVagas && (
                                <span>Limite: {mod.limiteVagas} vagas</span>
                              )}
                              {(mod.idadeMinima !== null && mod.idadeMinima !== undefined) || event.idadeMinimaEvento ? (
                                <span>Idade mínima: {mod.idadeMinima ?? event.idadeMinimaEvento} anos</span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-8 text-muted-foreground">
                        Nenhuma modalidade cadastrada
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="retirada" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Retirada de Kit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground font-medium mb-2">
                        Informações em breve
                      </p>
                      <p className="text-sm text-muted-foreground">
                        As informações sobre retirada de kit serão divulgadas em breve.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documentos" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Documentos do Evento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {attachments.length > 0 ? (
                      <div className="space-y-3">
                        {attachments.map((doc, idx) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 border rounded-md hover-elevate transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-foreground">{doc.nome}</p>
                                {doc.obrigatorioAceitar && (
                                  <span className="text-xs text-destructive">Aceite obrigatório</span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(doc.url, doc.nome)}
                              data-testid={`button-download-${idx}`}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Baixar
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-8 text-muted-foreground">
                        Nenhum documento cadastrado
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Valores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    {modalities.map((mod) => (
                      <div key={mod.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <span className="text-sm text-muted-foreground">{mod.nome}</span>
                        <span className="font-semibold text-foreground">{getPrice(mod.id)}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full font-semibold"
                    onClick={handleInscricao}
                    data-testid="button-inscricao"
                  >
                    Inscrever-se Agora
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
        <div className="px-4 py-3">
          <Button
            variant="secondary"
            size="lg"
            className="w-full font-semibold"
            onClick={handleInscricao}
            data-testid="button-inscricao-mobile"
          >
            Inscrever-se Agora
          </Button>
        </div>
      </div>
    </div>
  );
}
