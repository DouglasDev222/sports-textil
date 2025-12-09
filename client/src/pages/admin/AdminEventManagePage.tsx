import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  FileSpreadsheet,
  Pencil,
  ArrowLeft
} from "lucide-react";
import type { Event } from "@shared/schema";

interface EventStats {
  totalInscritos: number;
  totalPendentes: number;
  masculino: number;
  feminino: number;
  byModality: Array<{
    modalityId: string;
    modalityName: string;
    total: number;
    masculino: number;
    feminino: number;
  }>;
  faturamento: {
    total: number;
    descontos: number;
    taxaComodidade: number;
    liquido: number;
  };
  vagas: {
    total: number;
    ocupadas: number;
    disponiveis: number;
  };
}

export default function AdminEventManagePage() {
  const { id } = useParams<{ id: string }>();

  const { data: eventData, isLoading: eventLoading } = useQuery<{ success: boolean; data: Event }>({
    queryKey: ["/api/admin/events", id],
  });

  const { data: statsData, isLoading: statsLoading } = useQuery<{ success: boolean; data: EventStats }>({
    queryKey: ["/api/admin/events", id, "stats"],
  });

  const event = eventData?.data;
  const stats = statsData?.data;

  const isLoading = eventLoading || statsLoading;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <AdminLayout
        title="Carregando..."
        breadcrumbs={[
          { label: "Eventos", href: "/admin/eventos" },
          { label: "Gerenciar" },
        ]}
      >
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!event) {
    return (
      <AdminLayout
        title="Evento nao encontrado"
        breadcrumbs={[
          { label: "Eventos", href: "/admin/eventos" },
          { label: "Nao encontrado" },
        ]}
      >
        <div className="text-center py-12">
          <p className="text-muted-foreground">O evento solicitado nao foi encontrado.</p>
          <Link href="/admin/eventos">
            <Button className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Eventos
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={`Gerenciar: ${event.nome}`}
      breadcrumbs={[
        { label: "Eventos", href: "/admin/eventos" },
        { label: event.nome, href: `/admin/eventos/${id}` },
        { label: "Gerenciar" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{event.nome}</h1>
            <p className="text-muted-foreground">
              {event.cidade}, {event.estado}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href={`/admin/eventos/${id}/inscritos`}>
              <Button variant="outline" data-testid="button-view-inscritos">
                <Users className="mr-2 h-4 w-4" />
                Ver Inscritos
              </Button>
            </Link>
            <Link href={`/admin/eventos/${id}`}>
              <Button variant="outline" data-testid="button-edit-event">
                <Pencil className="mr-2 h-4 w-4" />
                Editar Evento
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inscritos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-inscritos">
                {stats?.totalInscritos || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalPendentes || 0} pendentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vagas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-vagas">
                {stats?.vagas.ocupadas || 0}/{stats?.vagas.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.vagas.disponiveis || 0} disponiveis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-faturamento">
                {formatCurrency(stats?.faturamento.total || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats?.faturamento.liquido || 0)} liquido
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Genero</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold" data-testid="text-masculino">
                  {stats?.masculino || 0}
                </span>
                <span className="text-sm text-muted-foreground">M</span>
                <span className="text-2xl font-bold" data-testid="text-feminino">
                  {stats?.feminino || 0}
                </span>
                <span className="text-sm text-muted-foreground">F</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Inscritos por Modalidade</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.byModality && stats.byModality.length > 0 ? (
                <div className="space-y-4">
                  {stats.byModality.map((mod) => (
                    <div 
                      key={mod.modalityId} 
                      className="flex items-center justify-between"
                      data-testid={`modality-stats-${mod.modalityId}`}
                    >
                      <div>
                        <p className="font-medium">{mod.modalityName}</p>
                        <p className="text-sm text-muted-foreground">
                          {mod.masculino}M / {mod.feminino}F
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-lg">
                        {mod.total}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma inscricao confirmada
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Faturamento Bruto</span>
                  <span className="font-medium" data-testid="text-faturamento-bruto">
                    {formatCurrency(stats?.faturamento.total || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Descontos</span>
                  <span className="font-medium text-red-600" data-testid="text-descontos">
                    -{formatCurrency(stats?.faturamento.descontos || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Taxa de Comodidade</span>
                  <span className="font-medium" data-testid="text-taxa">
                    {formatCurrency(stats?.faturamento.taxaComodidade || 0)}
                  </span>
                </div>
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="font-semibold">Total Liquido</span>
                  <span className="font-bold text-lg" data-testid="text-liquido">
                    {formatCurrency(stats?.faturamento.liquido || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Relatorios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <Link href={`/admin/eventos/${id}/inscritos`}>
                <Button variant="outline" data-testid="button-report-inscritos">
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Relatorio de Inscritos
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
