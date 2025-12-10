import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { formatDateOnlyBrazil, formatDateTimeBrazil, formatForInput } from "@/lib/timezone";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  isLotado: boolean;
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

interface BatchEditForm {
  id: string;
  nome: string;
  dataInicio: string;
  dataTermino: string | null;
  quantidadeMaxima: number | null;
  ativo: boolean;
}

export default function AdminEventManagePage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchEditForm | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingActivation, setPendingActivation] = useState<{ batchId: string; activeBatchName: string } | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const { data: eventData, isLoading: eventLoading } = useQuery<{ success: boolean; data: Event }>({
    queryKey: ["/api/admin/events", id],
  });

  const { data: statsData, isLoading: statsLoading } = useQuery<{ success: boolean; data: EventStats }>({
    queryKey: ["/api/admin/events", id, "stats"],
  });

  const event = eventData?.data;
  const stats = statsData?.data;

  const isLoading = eventLoading || statsLoading;

  const updateBatchMutation = useMutation({
    mutationFn: async (data: { batchId: string; updates: Partial<BatchEditForm> }) => {
      const response = await apiRequest("PATCH", `/api/admin/events/${id}/batches/${data.batchId}`, data.updates);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || "Erro ao atualizar lote");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id, "stats"] });
      setEditDialogOpen(false);
      setEditingBatch(null);
      toast({ title: "Lote atualizado com sucesso" });
    },
    onError: (error: Error) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id, "stats"] });
      toast({ title: "Erro ao atualizar lote", description: error.message, variant: "destructive" });
    }
  });

  const openEditDialog = (batch: BatchInfo) => {
    setEditingBatch({
      id: batch.id,
      nome: batch.nome,
      dataInicio: formatForInput(batch.dataInicio),
      dataTermino: batch.dataTermino ? formatForInput(batch.dataTermino) : null,
      quantidadeMaxima: batch.quantidadeMaxima,
      ativo: batch.ativo
    });
    setEditDialogOpen(true);
  };

  const handleSaveBatch = async () => {
    if (!editingBatch) return;
    
    const willBeActive = editingBatch.ativo;
    
    if (willBeActive) {
      setIsActivating(true);
      try {
        const freshStats = await queryClient.fetchQuery<{ success: boolean; data: EventStats }>({
          queryKey: ["/api/admin/events", id, "stats"],
          staleTime: 0
        });
        
        const activeBatches = freshStats?.data.batches.filter(b => b.ativo && b.id !== editingBatch.id);
        if (activeBatches && activeBatches.length > 0) {
          setIsActivating(false);
          setPendingActivation({ 
            batchId: editingBatch.id, 
            activeBatchName: activeBatches[0].nome 
          });
          setConfirmDialogOpen(true);
          return;
        }
        
        const patchResponse = await apiRequest("PATCH", `/api/admin/events/${id}/batches/${editingBatch.id}`, {
          nome: editingBatch.nome,
          dataInicio: editingBatch.dataInicio,
          dataTermino: editingBatch.dataTermino,
          quantidadeMaxima: editingBatch.quantidadeMaxima
        });
        const patchResult = await patchResponse.json();
        if (!patchResult.success) {
          throw new Error(patchResult.error?.message || "Erro ao atualizar lote");
        }
        
        const activateResponse = await apiRequest("POST", `/api/admin/events/${id}/batches/${editingBatch.id}/activate`, {
          deactivateOthers: true
        });
        const activateResult = await activateResponse.json();
        if (!activateResult.success) {
          throw new Error(activateResult.error?.message || "Erro ao ativar lote");
        }
        
        queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id, "stats"] });
        setEditDialogOpen(false);
        setEditingBatch(null);
        toast({ title: "Lote atualizado e ativado com sucesso" });
      } catch (error) {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id] });
        queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id, "stats"] });
        toast({ title: "Erro ao processar lote", description: (error as Error).message, variant: "destructive" });
      } finally {
        setIsActivating(false);
      }
      return;
    }
    
    updateBatchMutation.mutate({
      batchId: editingBatch.id,
      updates: {
        nome: editingBatch.nome,
        dataInicio: editingBatch.dataInicio,
        dataTermino: editingBatch.dataTermino,
        quantidadeMaxima: editingBatch.quantidadeMaxima,
        ativo: editingBatch.ativo
      }
    });
  };

  const handleConfirmActivation = async () => {
    if (!pendingActivation || !editingBatch) return;
    
    setIsActivating(true);
    try {
      const patchResponse = await apiRequest("PATCH", `/api/admin/events/${id}/batches/${editingBatch.id}`, {
        nome: editingBatch.nome,
        dataInicio: editingBatch.dataInicio,
        dataTermino: editingBatch.dataTermino,
        quantidadeMaxima: editingBatch.quantidadeMaxima
      });
      const patchResult = await patchResponse.json();
      if (!patchResult.success) {
        throw new Error(patchResult.error?.message || "Erro ao atualizar lote");
      }
      
      const activateResponse = await apiRequest("POST", `/api/admin/events/${id}/batches/${editingBatch.id}/activate`, {
        deactivateOthers: true
      });
      const activateResult = await activateResponse.json();
      if (!activateResult.success) {
        throw new Error(activateResult.error?.message || "Erro ao ativar lote");
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id, "stats"] });
      setConfirmDialogOpen(false);
      setEditDialogOpen(false);
      setPendingActivation(null);
      setEditingBatch(null);
      toast({ title: "Lote atualizado e ativado com sucesso" });
    } catch (error) {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id, "stats"] });
      toast({ title: "Erro ao processar lote", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsActivating(false);
    }
  };

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
                  {stats.batches.map((batch) => {
                    const hasProblems = batch.isExpirado || batch.isLotado || !batch.ativo;
                    return (
                      <div 
                        key={batch.id} 
                        className={`p-3 rounded-md border ${batch.isVigente ? 'border-primary bg-primary/5' : hasProblems ? 'border-muted-foreground/30' : ''}`}
                        data-testid={`batch-info-${batch.id}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {batch.isVigente ? (
                              <Check className="h-4 w-4 text-primary" />
                            ) : hasProblems ? (
                              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium">{batch.nome}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {batch.quantidadeUtilizada}
                              {batch.quantidadeMaxima && `/${batch.quantidadeMaxima}`}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(batch)}
                              data-testid={`button-edit-batch-${batch.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          {batch.isVigente && (
                            <Badge variant="default" className="text-xs">Vigente</Badge>
                          )}
                          {batch.isExpirado && (
                            <Badge variant="destructive" className="text-xs">Expirado</Badge>
                          )}
                          {!batch.ativo && (
                            <Badge variant="secondary" className="text-xs">Inativo</Badge>
                          )}
                          {batch.isLotado && (
                            <Badge variant="outline" className="text-xs border-orange-500 text-orange-600 dark:text-orange-400">Lotado</Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDateTimeBrazil(batch.dataInicio)}
                          {batch.dataTermino && ` - ${formatDateTimeBrazil(batch.dataTermino)}`}
                        </p>
                        
                        {batch.precos && batch.precos.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/50">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Valores:</p>
                            <div className="flex flex-wrap gap-1">
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
                    );
                  })}
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Lote</DialogTitle>
            <DialogDescription>
              Altere os dados do lote de inscricao
            </DialogDescription>
          </DialogHeader>
          
          {editingBatch && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="batch-nome">Nome do Lote</Label>
                <Input
                  id="batch-nome"
                  value={editingBatch.nome}
                  onChange={(e) => setEditingBatch({ ...editingBatch, nome: e.target.value })}
                  data-testid="input-edit-batch-name"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="batch-inicio">Data de Inicio</Label>
                  <Input
                    id="batch-inicio"
                    type="datetime-local"
                    value={editingBatch.dataInicio}
                    onChange={(e) => setEditingBatch({ ...editingBatch, dataInicio: e.target.value })}
                    data-testid="input-edit-batch-start"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch-termino">Data de Termino</Label>
                  <Input
                    id="batch-termino"
                    type="datetime-local"
                    value={editingBatch.dataTermino || ""}
                    onChange={(e) => setEditingBatch({ ...editingBatch, dataTermino: e.target.value || null })}
                    data-testid="input-edit-batch-end"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch-quantidade">Quantidade Maxima (opcional)</Label>
                <Input
                  id="batch-quantidade"
                  type="number"
                  min={0}
                  value={editingBatch.quantidadeMaxima ?? ""}
                  onChange={(e) => setEditingBatch({ 
                    ...editingBatch, 
                    quantidadeMaxima: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  placeholder="Sem limite"
                  data-testid="input-edit-batch-quantity"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Lote Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Ative ou desative este lote para inscricoes
                  </p>
                </div>
                <Switch
                  checked={editingBatch.ativo}
                  onCheckedChange={(checked) => setEditingBatch({ ...editingBatch, ativo: checked })}
                  data-testid="switch-edit-batch-active"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveBatch} 
              disabled={updateBatchMutation.isPending || isActivating}
              data-testid="button-save-batch"
            >
              {updateBatchMutation.isPending || isActivating ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDialogOpen} onOpenChange={(open) => {
        setConfirmDialogOpen(open);
        if (!open) {
          setPendingActivation(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Ativacao de Lote</AlertDialogTitle>
            <AlertDialogDescription>
              Existe um lote ativo ({pendingActivation?.activeBatchName}). 
              Ao ativar este lote, o lote atual sera automaticamente desativado.
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActivating}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmActivation}
              disabled={isActivating}
              data-testid="button-confirm-activate"
            >
              {isActivating ? "Ativando..." : "Sim, ativar este lote"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
