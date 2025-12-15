import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  MapPin, 
  Award, 
  ChevronRight,
  User,
  Package,
  CheckCircle2,
  Clock,
  Shirt,
  Loader2,
  XCircle
} from "lucide-react";
import { useAthleteAuth } from "@/contexts/AthleteAuthContext";

interface Modalidade {
  id: string;
  nome: string;
  distancia: string;
  unidadeDistancia: string;
}

interface Inscricao {
  id: string;
  numeroInscricao: number;
  participanteNome: string;
  status: string;
  tamanhoCamisa: string | null;
  equipe: string | null;
  valorUnitario: number;
  taxaComodidade: number;
  modalidade: Modalidade | null;
}

interface Evento {
  id: string;
  nome: string;
  slug: string;
  dataEvento: string;
  cidade: string;
  estado: string;
  bannerUrl: string | null;
}

interface Pedido {
  id: string;
  numeroPedido: number;
  dataPedido: string;
  status: string;
  valorTotal: number;
  valorDesconto: number;
  metodoPagamento: string | null;
  evento: Evento | null;
  inscricoes: Inscricao[];
}

function formatDate(dateString: string) {
  if (!dateString) return '';
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);
  
  if (!year || !month || !day) return '';
  
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function getStatusConfig(status: string) {
  const configs: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: typeof CheckCircle2 }> = {
    pago: { variant: "default", label: "Pago", icon: CheckCircle2 },
    confirmado: { variant: "default", label: "Confirmado", icon: CheckCircle2 },
    confirmada: { variant: "default", label: "Confirmada", icon: CheckCircle2 },
    pendente: { variant: "secondary", label: "Pendente", icon: Clock },
    cancelado: { variant: "destructive", label: "Cancelado", icon: XCircle },
    cancelada: { variant: "destructive", label: "Cancelada", icon: XCircle },
    concluido: { variant: "outline", label: "Concluído", icon: CheckCircle2 },
    concluida: { variant: "outline", label: "Concluída", icon: CheckCircle2 },
    expirado: { variant: "destructive", label: "Expirado", icon: XCircle },
  };
  return configs[status] || { variant: "secondary" as const, label: status, icon: Clock };
}

function InscricaoItem({ inscricao, evento }: { inscricao: Inscricao; evento: Evento | null }) {
  const statusConfig = getStatusConfig(inscricao.status);
  
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted/30 rounded-md" data-testid={`inscricao-item-${inscricao.id}`}>
      {evento?.bannerUrl && (
        <div className="w-full md:w-24 h-20 md:h-16 rounded-md overflow-hidden flex-shrink-0">
          <img
            src={evento.bannerUrl}
            alt={evento.nome}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Inscrição #{inscricao.numeroInscricao}
            </p>
            <h4 className="font-semibold text-foreground text-sm">
              {evento?.nome || "Evento"}
            </h4>
          </div>
          <Badge variant={statusConfig.variant} className="text-xs">
            {statusConfig.label}
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate">{inscricao.participanteNome}</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="h-3 w-3" />
            <span>{inscricao.modalidade?.nome || "-"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{evento?.dataEvento ? formatDate(evento.dataEvento) : "-"}</span>
          </div>
          {inscricao.tamanhoCamisa && (
            <div className="flex items-center gap-1">
              <Shirt className="h-3 w-3" />
              <span>Camisa {inscricao.tamanhoCamisa}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center">
        <Link href={`/inscricao/${inscricao.id}`}>
          <Button variant="ghost" size="icon" data-testid={`button-view-inscricao-${inscricao.id}`}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function PedidoCard({ pedido }: { pedido: Pedido }) {
  const statusConfig = getStatusConfig(pedido.status);
  const StatusIcon = statusConfig.icon;
  const qtdInscricoes = pedido.inscricoes.length;
  const isPending = pedido.status === "pendente";
  
  return (
    <Card className="overflow-hidden" data-testid={`card-pedido-${pedido.id}`}>
      <CardHeader className="bg-muted/50 pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/pedido/${pedido.id}`}>
                  <h3 className="font-bold text-foreground hover:text-primary transition-colors cursor-pointer" data-testid={`text-pedido-numero-${pedido.id}`}>
                    Pedido #{pedido.numeroPedido}
                  </h3>
                </Link>
                <Badge variant={statusConfig.variant} className="text-xs">
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(pedido.dataPedido)} {qtdInscricoes} {qtdInscricoes === 1 ? 'inscrição' : 'inscrições'}
              </p>
            </div>
          </div>
          <div className="text-right flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Valor total</p>
              <p className="font-bold text-lg text-foreground">
                R$ {pedido.valorTotal.toFixed(2)}
              </p>
            </div>
            <Link href={`/pedido/${pedido.id}`}>
              <Button variant={isPending ? "default" : "outline"} size="sm" data-testid={`button-ver-pedido-${pedido.id}`}>
                {isPending ? "Pagar" : "Ver Pedido"}
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {pedido.inscricoes.map((inscricao, index) => (
          <div key={inscricao.id}>
            <InscricaoItem inscricao={inscricao} evento={pedido.evento} />
            {index < pedido.inscricoes.length - 1 && (
              <Separator className="my-3" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function MinhasInscricoesPage() {
  const [activeTab, setActiveTab] = useState("proximas");
  const [, setLocation] = useLocation();
  const { athlete, isLoading: isAuthLoading } = useAthleteAuth();

  const { data: ordersData, isLoading: isOrdersLoading } = useQuery<{ success: boolean; data: Pedido[] }>({
    queryKey: ['/api/registrations/my-orders'],
    enabled: !!athlete
  });

  useEffect(() => {
    if (!isAuthLoading && !athlete) {
      setLocation("/login");
    }
  }, [isAuthLoading, athlete, setLocation]);

  const isLoading = isAuthLoading || isOrdersLoading;
  const pedidos = ordersData?.data || [];
  
  const now = new Date();
  const pedidosProximos = pedidos.filter(p => {
    if (!p.evento?.dataEvento) return true;
    const eventDate = new Date(p.evento.dataEvento);
    return eventDate >= now;
  });
  
  const pedidosConcluidos = pedidos.filter(p => {
    if (!p.evento?.dataEvento) return false;
    const eventDate = new Date(p.evento.dataEvento);
    return eventDate < now;
  });

  const totalInscricoesProximas = pedidosProximos.reduce((acc, p) => acc + p.inscricoes.length, 0);
  const totalInscricoesConcluidas = pedidosConcluidos.reduce((acc, p) => acc + p.inscricoes.length, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!athlete) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Minhas Inscrições
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas inscrições em eventos esportivos
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="proximas" data-testid="tab-proximas">
              Próximas ({totalInscricoesProximas})
            </TabsTrigger>
            <TabsTrigger value="concluidas" data-testid="tab-concluidas">
              Concluídas ({totalInscricoesConcluidas})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proximas" className="space-y-6">
            {pedidosProximos.map((pedido) => (
              <PedidoCard key={pedido.id} pedido={pedido} />
            ))}
            {pedidosProximos.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Você não possui inscrições em eventos próximos
                </p>
                <Link href="/">
                  <Button className="mt-4" data-testid="button-ver-eventos">
                    Ver Eventos Disponíveis
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="concluidas" className="space-y-6">
            {pedidosConcluidos.map((pedido) => (
              <PedidoCard key={pedido.id} pedido={pedido} />
            ))}
            {pedidosConcluidos.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Você ainda não participou de nenhum evento
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
