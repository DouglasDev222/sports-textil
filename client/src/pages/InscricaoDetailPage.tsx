import { useRoute, useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Award, 
  User, 
  Shirt,
  CheckCircle2,
  Clock,
  Users,
  Hash,
  Package,
  AlertCircle,
  PartyPopper
} from "lucide-react";
import heroImage from '@assets/generated_images/Marathon_runners_landscape_hero_b439e181.png';
import { formatDateOnlyLong, formatDateOnlyBrazil, formatCPF, formatPhone } from "@/lib/timezone";
import { useAthleteAuth } from "@/contexts/AthleteAuthContext";
import { useEffect } from "react";

interface RegistrationDetail {
  id: string;
  numeroInscricao: number;
  status: string;
  tamanhoCamisa: string | null;
  equipe: string | null;
  dataInscricao: string;
  valorPago: number;
  participanteNome: string;
  participanteCpf: string | null;
  participanteDataNascimento: string | null;
  participanteSexo: string | null;
  participanteTelefone: string | null;
  participanteEmail: string | null;
  evento: {
    id: string;
    nome: string;
    slug: string;
    dataEvento: string;
    cidade: string;
    estado: string;
  } | null;
  modalidade: {
    id: string;
    nome: string;
    distancia: string;
    unidadeDistancia: string;
  } | null;
  pedido: {
    numeroPedido: number;
    status: string;
  } | null;
}

export default function InscricaoDetailPage() {
  const [, params] = useRoute("/inscricao/:id");
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const isSuccess = searchParams.get("sucesso") === "1";
  const { athlete, isLoading: authLoading } = useAthleteAuth();
  const registrationId = params?.id;

  useEffect(() => {
    if (!authLoading && !athlete) {
      setLocation(`/login?redirect=${encodeURIComponent(`/inscricao/${registrationId}`)}`);
    }
  }, [authLoading, athlete, registrationId, setLocation]);

  const { data, isLoading, error } = useQuery<{ success: boolean; data: RegistrationDetail[] }>({
    queryKey: ["/api/registrations/my-registrations"],
    enabled: !!athlete,
  });

  const handleVoltar = () => {
    setLocation("/minhas-inscricoes");
  };

  const handleVerEvento = (slug: string) => {
    setLocation(`/evento/${slug}`);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Skeleton className="w-full h-[200px] md:h-[300px]" />
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!athlete) {
    return null;
  }

  const registration = data?.data?.find(r => r.id === registrationId);

  if (error || !data?.success || !registration) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-16 text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Inscrição não encontrada</h1>
          <p className="text-muted-foreground mb-6">
            A inscrição que você está procurando não existe ou não está disponível.
          </p>
          <Button onClick={() => setLocation("/minhas-inscricoes")}>
            Ver minhas inscrições
          </Button>
        </div>
      </div>
    );
  }

  const formattedEventDate = registration.evento ? formatDateOnlyLong(registration.evento.dataEvento) : "";
  const formattedInscricaoDate = formatDateOnlyLong(registration.dataInscricao);

  const statusConfig = {
    confirmada: {
      variant: "default" as const,
      label: "Confirmada",
      icon: CheckCircle2,
      description: "Sua inscrição está confirmada! Você receberá um e-mail com mais informações sobre a retirada do kit."
    },
    pendente: {
      variant: "secondary" as const,
      label: "Aguardando Pagamento",
      icon: Clock,
      description: "Estamos aguardando a confirmação do pagamento. Isso pode levar até 48 horas."
    },
    cancelada: {
      variant: "destructive" as const,
      label: "Cancelada",
      icon: AlertCircle,
      description: "Esta inscrição foi cancelada."
    }
  };

  const currentStatus = statusConfig[registration.status as keyof typeof statusConfig] || statusConfig.pendente;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary/75 z-10"></div>
        <img
          src={heroImage}
          alt={registration.evento?.nome || "Evento"}
          className="w-full h-[200px] md:h-[300px] object-cover"
        />
        <div className="absolute inset-0 z-20 flex items-end">
          <div className="w-full px-4 md:px-6 pb-6 md:pb-8">
            <div className="max-w-5xl mx-auto">
              <Button 
                variant="ghost" 
                onClick={handleVoltar}
                className="mb-4 text-white hover:bg-white/20"
                data-testid="button-voltar"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center gap-3 mb-2 text-white/80 flex-wrap">
                {registration.pedido && (
                  <>
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      <span className="text-sm font-medium">Pedido #{registration.pedido.numeroPedido}</span>
                    </div>
                    <span className="text-white/50">|</span>
                  </>
                )}
                <div className="flex items-center gap-1">
                  <Hash className="h-4 w-4" />
                  <span className="text-sm font-medium">Inscrição #{registration.numeroInscricao}</span>
                </div>
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
                {registration.evento?.nome || "Evento"}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                {registration.modalidade && (
                  <Badge variant="secondary" className="text-sm">
                    {registration.modalidade.distancia} {registration.modalidade.unidadeDistancia}
                  </Badge>
                )}
                <Badge variant={currentStatus.variant} className="text-sm">
                  {currentStatus.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {isSuccess && (
          <Card className="mb-6 border-green-500 bg-green-50 dark:bg-green-950/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <PartyPopper className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-400">
                    Inscrição realizada com sucesso!
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-500">
                    Sua inscrição foi confirmada. Guarde o número da inscrição para referência.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <StatusIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Status da Inscrição</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {currentStatus.description}
                </p>
              </CardContent>
            </Card>

            {registration.evento && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Informações do Evento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Data</p>
                    <p className="font-semibold text-foreground">{formattedEventDate}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Local</p>
                    <p className="font-semibold text-foreground">
                      {registration.evento.cidade}, {registration.evento.estado}
                    </p>
                  </div>
                  <Separator />
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleVerEvento(registration.evento!.slug)}
                    data-testid="button-ver-evento"
                  >
                    Ver Página do Evento
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Participante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nome</p>
                  <p className="font-semibold text-foreground">{registration.participanteNome}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">CPF</p>
                    <p className="text-sm text-foreground">{formatCPF(registration.participanteCpf)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Data de Nascimento</p>
                    <p className="text-sm text-foreground">{formatDateOnlyBrazil(registration.participanteDataNascimento)}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">E-mail</p>
                    <p className="text-sm text-foreground">{registration.participanteEmail || athlete?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Telefone</p>
                    <p className="text-sm text-foreground">{formatPhone(registration.participanteTelefone || athlete?.telefone)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Detalhes da Inscrição
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Número da Inscrição</p>
                  <p className="font-mono text-2xl font-bold text-primary flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    {registration.numeroInscricao}
                  </p>
                </div>
                <Separator />
                {registration.modalidade && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Modalidade</p>
                    <p className="font-semibold text-foreground">
                      {registration.modalidade.nome}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {registration.modalidade.distancia} {registration.modalidade.unidadeDistancia}
                    </p>
                  </div>
                )}
                {registration.tamanhoCamisa && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <Shirt className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Tamanho da Camisa</p>
                        <p className="font-semibold text-foreground">{registration.tamanhoCamisa}</p>
                      </div>
                    </div>
                  </>
                )}
                {registration.equipe && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Equipe</p>
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {registration.equipe}
                      </p>
                    </div>
                  </>
                )}
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Data da Inscrição</p>
                  <p className="text-sm text-foreground">{formattedInscricaoDate}</p>
                </div>
                <Separator />
                <div className="flex items-center justify-between pt-2">
                  <span className="font-semibold text-foreground">Valor</span>
                  <span className="text-xl font-bold text-primary">
                    {registration.valorPago === 0 ? (
                      <span className="text-green-600 dark:text-green-400">Gratuito</span>
                    ) : (
                      `R$ ${registration.valorPago.toFixed(2).replace('.', ',')}`
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
