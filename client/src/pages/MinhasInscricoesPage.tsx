import { useState } from "react";
import { Link } from "wouter";
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
  Shirt
} from "lucide-react";
import cityImage from '@assets/generated_images/City_marathon_aerial_view_94ce50b6.png';
import trailImage from '@assets/generated_images/Trail_running_mountain_event_08f65871.png';
import beachImage from '@assets/generated_images/Beach_running_race_event_8d36858c.png';

interface Inscricao {
  id: string;
  numeroInscricao: number;
  participanteNome: string;
  eventoNome: string;
  eventoSlug: string;
  eventoData: string;
  eventoLocal: string;
  eventoImagem: string;
  modalidade: string;
  tamanhoCamisa: string;
  status: string;
}

interface Pedido {
  id: string;
  numeroPedido: number;
  dataPedido: string;
  status: string;
  valorTotal: string;
  inscricoes: Inscricao[];
}

const mockPedidos: Pedido[] = [
  {
    id: "p1",
    numeroPedido: 98765,
    dataPedido: "2025-03-15",
    status: "confirmado",
    valorTotal: "350.00",
    inscricoes: [
      {
        id: "1",
        numeroInscricao: 12345,
        participanteNome: "João Silva",
        eventoNome: "Maratona de São Paulo 2025",
        eventoSlug: "maratona-sao-paulo-2025",
        eventoData: "2025-05-15",
        eventoLocal: "Parque Ibirapuera, São Paulo - SP",
        eventoImagem: cityImage,
        modalidade: "21km",
        tamanhoCamisa: "M",
        status: "confirmada",
      },
      {
        id: "5",
        numeroInscricao: 12346,
        participanteNome: "Maria Silva",
        eventoNome: "Maratona de São Paulo 2025",
        eventoSlug: "maratona-sao-paulo-2025",
        eventoData: "2025-05-15",
        eventoLocal: "Parque Ibirapuera, São Paulo - SP",
        eventoImagem: cityImage,
        modalidade: "10km",
        tamanhoCamisa: "P",
        status: "confirmada",
      },
    ],
  },
  {
    id: "p2",
    numeroPedido: 98766,
    dataPedido: "2025-03-20",
    status: "confirmado",
    valorTotal: "180.00",
    inscricoes: [
      {
        id: "2",
        numeroInscricao: 12347,
        participanteNome: "João Silva",
        eventoNome: "Corrida Trail Serra do Mar",
        eventoSlug: "trail-serra-mar-2025",
        eventoData: "2025-06-20",
        eventoLocal: "Parque Estadual da Serra do Mar, Cunha - SP",
        eventoImagem: trailImage,
        modalidade: "15km",
        tamanhoCamisa: "M",
        status: "confirmada",
      },
    ],
  },
  {
    id: "p3",
    numeroPedido: 98767,
    dataPedido: "2025-04-01",
    status: "pendente",
    valorTotal: "120.00",
    inscricoes: [
      {
        id: "3",
        numeroInscricao: 12348,
        participanteNome: "João Silva",
        eventoNome: "Corrida de Praia Florianópolis",
        eventoSlug: "corrida-praia-floripa-2025",
        eventoData: "2025-08-05",
        eventoLocal: "Praia da Joaquina, Florianópolis - SC",
        eventoImagem: beachImage,
        modalidade: "10km",
        tamanhoCamisa: "M",
        status: "pendente",
      },
    ],
  },
];

const mockPedidosConcluidos: Pedido[] = [
  {
    id: "p4",
    numeroPedido: 85432,
    dataPedido: "2024-10-15",
    status: "concluido",
    valorTotal: "200.00",
    inscricoes: [
      {
        id: "4",
        numeroInscricao: 11234,
        participanteNome: "João Silva",
        eventoNome: "Meia Maratona do Rio 2024",
        eventoSlug: "meia-maratona-rio-2024",
        eventoData: "2024-11-10",
        eventoLocal: "Copacabana, Rio de Janeiro - RJ",
        eventoImagem: cityImage,
        modalidade: "21km",
        tamanhoCamisa: "M",
        status: "concluida",
      },
    ],
  },
];

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function getStatusConfig(status: string) {
  const configs: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: typeof CheckCircle2 }> = {
    confirmado: { variant: "default", label: "Confirmado", icon: CheckCircle2 },
    confirmada: { variant: "default", label: "Confirmada", icon: CheckCircle2 },
    pendente: { variant: "secondary", label: "Pendente", icon: Clock },
    concluido: { variant: "outline", label: "Concluído", icon: CheckCircle2 },
    concluida: { variant: "outline", label: "Concluída", icon: CheckCircle2 },
  };
  return configs[status] || { variant: "secondary" as const, label: status, icon: Clock };
}

function InscricaoItem({ inscricao }: { inscricao: Inscricao }) {
  const statusConfig = getStatusConfig(inscricao.status);
  
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 bg-muted/30 rounded-md" data-testid={`inscricao-item-${inscricao.id}`}>
      <div className="w-full md:w-24 h-20 md:h-16 rounded-md overflow-hidden flex-shrink-0">
        <img
          src={inscricao.eventoImagem}
          alt={inscricao.eventoNome}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Inscrição #{inscricao.numeroInscricao}
            </p>
            <h4 className="font-semibold text-foreground text-sm">
              {inscricao.eventoNome}
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
            <span>{inscricao.modalidade}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(inscricao.eventoData)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Shirt className="h-3 w-3" />
            <span>Camisa {inscricao.tamanhoCamisa}</span>
          </div>
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
                <h3 className="font-bold text-foreground" data-testid={`text-pedido-numero-${pedido.id}`}>
                  Pedido #{pedido.numeroPedido}
                </h3>
                <Badge variant={statusConfig.variant} className="text-xs">
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(pedido.dataPedido)} • {qtdInscricoes} {qtdInscricoes === 1 ? 'inscrição' : 'inscrições'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Valor total</p>
            <p className="font-bold text-lg text-foreground">
              R$ {parseFloat(pedido.valorTotal).toFixed(2)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        {pedido.inscricoes.map((inscricao, index) => (
          <div key={inscricao.id}>
            <InscricaoItem inscricao={inscricao} />
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

  const totalInscricoesProximas = mockPedidos.reduce((acc, p) => acc + p.inscricoes.length, 0);
  const totalInscricoesConcluidas = mockPedidosConcluidos.reduce((acc, p) => acc + p.inscricoes.length, 0);

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
            {mockPedidos.map((pedido) => (
              <PedidoCard key={pedido.id} pedido={pedido} />
            ))}
            {mockPedidos.length === 0 && (
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
            {mockPedidosConcluidos.map((pedido) => (
              <PedidoCard key={pedido.id} pedido={pedido} />
            ))}
            {mockPedidosConcluidos.length === 0 && (
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
