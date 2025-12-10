import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  FileSpreadsheet,
  Pencil,
  ArrowLeft,
  Shirt,
  Layers,
  Check,
  Clock,
  AlertTriangle
} from "lucide-react";
import { formatDateOnlyBrazil, formatDateTimeBrazil } from "@/lib/timezone";
import type { Event } from "@shared/schema";

interface ShirtGridItem {
  id: string;
  tamanho: string;
  quantidadeTotal: number;
  quantidadeDisponivel: number;
  consumo: number;
}

interface BatchPriceInfo {
  modalityId: string;
  modalityName: string;
  valor: string;
}

interface BatchInfo {
  id: string;
  nome: string;
  dataInicio: string;
  dataTermino: string | null;
  quantidadeMaxima: number | null;
  quantidadeUtilizada: number;
  ativo: boolean;
  isVigente: boolean;
  isExpirado: boolean;
  precos: BatchPriceInfo[];
}

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
  shirtGrid: ShirtGridItem[];
  batches: BatchInfo[];
  activeBatchId: string | null;
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

  const activeBatch = stats?.batches?.find(b => b.isVigente);

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

        {activeBatch && (
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Lote Vigente
              </CardTitle>
              <Badge variant="default">Ativo</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xl font-semibold">{activeBatch.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateOnlyBrazil(activeBatch.dataInicio)}
                      {activeBatch.dataTermino && ` - ${formatDateOnlyBrazil(activeBatch.dataTermino)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{activeBatch.quantidadeUtilizada}</p>
                    <p className="text-xs text-muted-foreground">
                      {activeBatch.quantidadeMaxima 
                        ? `de ${activeBatch.quantidadeMaxima} vagas` 
                        : "sem limite"}
                    </p>
                  </div>
                </div>
                {activeBatch.quantidadeMaxima && activeBatch.quantidadeMaxima > 0 && (
                  <Progress 
                    value={Math.min(100, Math.max(0, (activeBatch.quantidadeUtilizada / activeBatch.quantidadeMaxima) * 100))} 
                    className="h-2"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shirt className="h-5 w-5" />
                Grade de Camisas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.shirtGrid && stats.shirtGrid.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tamanho</TableHead>
                      <TableHead className="text-right">Consumo</TableHead>
                      <TableHead className="text-right">Disponivel</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.shirtGrid.map((size) => (
                      <TableRow key={size.id} data-testid={`shirt-size-${size.tamanho}`}>
                        <TableCell className="font-medium">{size.tamanho}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{size.consumo}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={size.quantidadeDisponivel > 0 ? "outline" : "destructive"}
                          >
                            {size.quantidadeDisponivel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {size.quantidadeTotal}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum tamanho de camisa configurado
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Lotes de Inscricao
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.batches && stats.batches.length > 0 ? (
                <div className="space-y-3">
                  {stats.batches.map((batch) => (
                    <div 
                      key={batch.id} 
                      className={`p-3 rounded-md border ${batch.isVigente ? 'border-primary bg-primary/5' : batch.isExpirado ? 'border-destructive/50 bg-destructive/5' : ''}`}
                      data-testid={`batch-info-${batch.id}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {batch.isExpirado ? (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          ) : batch.isVigente ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : batch.ativo ? (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          ) : null}
                          <span className="font-medium">
                            {batch.nome}
                            {batch.isExpirado && " (Expirado)"}
                          </span>
                          {batch.isExpirado && (
                            <Badge variant="destructive">Expirado</Badge>
                          )}
                          {batch.isVigente && (
                            <Badge variant="default">Vigente</Badge>
                          )}
                          {!batch.ativo && !batch.isExpirado && (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </div>
                        <span className="font-semibold">
                          {batch.quantidadeUtilizada}
                          {batch.quantidadeMaxima && `/${batch.quantidadeMaxima}`}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTimeBrazil(batch.dataInicio)}
                        {batch.dataTermino && ` - ${formatDateTimeBrazil(batch.dataTermino)}`}
                      </p>
                      {batch.precos && batch.precos.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Valores por modalidade:</p>
                          <div className="flex flex-wrap gap-2">
                            {batch.precos.map((preco) => (
                              <Badge 
                                key={preco.modalityId} 
                                variant="outline" 
                                className="text-xs"
                              >
                                {preco.modalityName}: R$ {parseFloat(preco.valor).toFixed(2).replace('.', ',')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum lote configurado
                </p>
              )}
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
