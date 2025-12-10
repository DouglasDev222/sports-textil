import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatTimestampAsDateBrazil } from "@/lib/timezone";
import type { EventFormData } from "../EventWizard";
import type { RegistrationBatch } from "@shared/schema";

interface EventBatchesStepProps {
  formData: EventFormData;
  updateFormData: (updates: Partial<EventFormData>) => void;
}

const emptyBatch: Partial<RegistrationBatch> = {
  nome: "",
  dataInicio: undefined,
  dataTermino: undefined,
  quantidadeMaxima: undefined,
  quantidadeUtilizada: 0,
  ativo: true,
  ordem: 0,
};

export function EventBatchesStep({ formData, updateFormData }: EventBatchesStepProps) {
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [editingBatchIndex, setEditingBatchIndex] = useState<number | null>(null);
  const [currentBatch, setCurrentBatch] = useState<Partial<RegistrationBatch>>(emptyBatch);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [conflictingBatch, setConflictingBatch] = useState<{ index: number; nome: string } | null>(null);

  const openNewBatchDialog = () => {
    const maxOrdem = formData.batches.length > 0 
      ? Math.max(...formData.batches.map(b => b.ordem ?? 0)) 
      : 0;
    setCurrentBatch({ ...emptyBatch, ordem: maxOrdem + 1 });
    setEditingBatchIndex(null);
    setBatchDialogOpen(true);
  };

  const openEditBatchDialog = (index: number) => {
    setCurrentBatch({ ...formData.batches[index] });
    setEditingBatchIndex(index);
    setBatchDialogOpen(true);
  };

  const checkAndSaveBatch = () => {
    const isActivating = currentBatch.ativo === true;
    const wasInactive = editingBatchIndex !== null 
      ? !formData.batches[editingBatchIndex].ativo 
      : true;
    
    if (isActivating && wasInactive) {
      const activeBatchIndex = formData.batches.findIndex(
        (b, idx) => b.ativo && idx !== editingBatchIndex
      );
      
      if (activeBatchIndex >= 0) {
        setConflictingBatch({
          index: activeBatchIndex,
          nome: formData.batches[activeBatchIndex].nome || `Lote ${activeBatchIndex + 1}`
        });
        setConfirmDialogOpen(true);
        return;
      }
    }
    
    handleSaveBatch(false);
  };

  const handleSaveBatch = (deactivateOthers: boolean = false) => {
    const newBatches = [...formData.batches];
    
    if (deactivateOthers && currentBatch.ativo) {
      newBatches.forEach((batch, idx) => {
        if (idx !== editingBatchIndex && batch.ativo) {
          newBatches[idx] = { ...batch, ativo: false };
        }
      });
    }
    
    if (editingBatchIndex !== null) {
      newBatches[editingBatchIndex] = currentBatch;
    } else {
      newBatches.push(currentBatch);
    }
    updateFormData({ batches: newBatches });
    setBatchDialogOpen(false);
    setConfirmDialogOpen(false);
    setConflictingBatch(null);
  };

  const handleDeleteBatch = (index: number) => {
    const newBatches = formData.batches.filter((_, i) => i !== index);
    const newPrices = formData.prices.filter(p => p.batchIndex !== index)
      .map(p => ({
        ...p,
        batchIndex: p.batchIndex > index ? p.batchIndex - 1 : p.batchIndex
      }));
    updateFormData({ batches: newBatches, prices: newPrices });
  };

  const updateCurrentBatch = (field: string, value: any) => {
    setCurrentBatch(prev => ({ ...prev, [field]: value }));
  };

  const getPrice = (modalityIndex: number, batchIndex: number): string => {
    const price = formData.prices.find(
      p => p.modalityIndex === modalityIndex && p.batchIndex === batchIndex
    );
    return price?.valor || "";
  };

  const setPrice = (modalityIndex: number, batchIndex: number, valor: string) => {
    const existingIndex = formData.prices.findIndex(
      p => p.modalityIndex === modalityIndex && p.batchIndex === batchIndex
    );
    
    const newPrices = [...formData.prices];
    if (existingIndex >= 0) {
      if (valor) {
        newPrices[existingIndex] = { modalityIndex, batchIndex, valor };
      } else {
        newPrices.splice(existingIndex, 1);
      }
    } else if (valor) {
      newPrices.push({ modalityIndex, batchIndex, valor });
    }
    
    updateFormData({ prices: newPrices });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle>Lotes de Inscrição</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configure os períodos de inscrição e seus limites
            </p>
          </div>
          <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openNewBatchDialog} data-testid="button-add-batch">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Lote
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingBatchIndex !== null ? "Editar Lote" : "Novo Lote"}
                </DialogTitle>
              </DialogHeader>

              {(formData.event.aberturaInscricoes || formData.event.encerramentoInscricoes) && (
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md text-sm">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-muted-foreground">
                    <span className="font-medium text-foreground">Período de inscrições do evento:</span>
                    <br />
                    {formData.event.aberturaInscricoes && (
                      <span>Inicio: {formatTimestampAsDateBrazil(formData.event.aberturaInscricoes)}</span>
                    )}
                    {formData.event.aberturaInscricoes && formData.event.encerramentoInscricoes && " | "}
                    {formData.event.encerramentoInscricoes && (
                      <span>Termino: {formatTimestampAsDateBrazil(formData.event.encerramentoInscricoes)}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="batch-nome">Nome do Lote *</Label>
                  <Input
                    id="batch-nome"
                    value={currentBatch.nome || ""}
                    onChange={(e) => updateCurrentBatch("nome", e.target.value)}
                    placeholder="Ex: 1o Lote, Lote Promocional"
                    data-testid="input-batch-name"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="batch-inicio">Data de Inicio *</Label>
                    <Input
                      id="batch-inicio"
                      type="datetime-local"
                      value={typeof currentBatch.dataInicio === 'string' 
                        ? currentBatch.dataInicio 
                        : currentBatch.dataInicio 
                          ? currentBatch.dataInicio.toISOString().slice(0, 16)
                          : ""}
                      onChange={(e) => updateCurrentBatch("dataInicio", e.target.value)}
                      data-testid="input-batch-start"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="batch-termino">Data de Termino</Label>
                    <Input
                      id="batch-termino"
                      type="datetime-local"
                      value={typeof currentBatch.dataTermino === 'string' 
                        ? currentBatch.dataTermino 
                        : currentBatch.dataTermino 
                          ? currentBatch.dataTermino.toISOString().slice(0, 16)
                          : ""}
                      onChange={(e) => updateCurrentBatch("dataTermino", e.target.value || undefined)}
                      data-testid="input-batch-end"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="batch-quantidade">Quantidade Maxima</Label>
                    <Input
                      id="batch-quantidade"
                      type="number"
                      min="1"
                      value={currentBatch.quantidadeMaxima || ""}
                      onChange={(e) => updateCurrentBatch("quantidadeMaxima", e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Deixe vazio para sem limite"
                      data-testid="input-batch-quantity"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="batch-ordem">Ordem de Ativacao</Label>
                    <Input
                      id="batch-ordem"
                      type="number"
                      min="1"
                      value={currentBatch.ordem ?? ""}
                      onChange={(e) => updateCurrentBatch("ordem", e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Ordem do lote"
                      data-testid="input-batch-order"
                    />
                    <p className="text-xs text-muted-foreground">
                      Define a ordem de ativacao dos lotes. Lotes com ordem menor sao ativados primeiro.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lote Ativo</Label>
                    <p className="text-sm text-muted-foreground">
                      Apenas um lote pode estar ativo por vez
                    </p>
                  </div>
                  <Switch
                    checked={currentBatch.ativo ?? true}
                    onCheckedChange={(checked) => updateCurrentBatch("ativo", checked)}
                    data-testid="switch-batch-active"
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button 
                  onClick={checkAndSaveBatch}
                  disabled={!currentBatch.nome || !currentBatch.dataInicio}
                  data-testid="button-save-batch"
                >
                  {editingBatchIndex !== null ? "Salvar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {formData.batches.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Nenhum lote cadastrado</p>
              <Button variant="outline" onClick={openNewBatchDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar primeiro lote
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {formData.batches.map((batch, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  data-testid={`card-batch-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs font-mono">
                      #{batch.ordem ?? index + 1}
                    </Badge>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{batch.nome}</span>
                        {batch.ativo && <Badge variant="secondary">Ativo</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {batch.dataInicio ? formatTimestampAsDateBrazil(batch.dataInicio) : ""} 
                        {batch.dataTermino ? ` - ${formatTimestampAsDateBrazil(batch.dataTermino)}` : ""}
                        {batch.quantidadeMaxima ? ` | Max: ${batch.quantidadeMaxima}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditBatchDialog(index)}
                      data-testid={`button-edit-batch-${index}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteBatch(index)}
                      data-testid={`button-delete-batch-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {formData.modalities.length > 0 && formData.batches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tabela de Precos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Defina o valor de cada modalidade por lote
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Modalidade</TableHead>
                    {formData.batches.map((batch, index) => (
                      <TableHead key={index} className="min-w-[120px]">
                        {batch.nome}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.modalities.map((modality, modalityIndex) => {
                    const isGratuita = modality.tipoAcesso === "gratuita";
                    return (
                      <TableRow key={modalityIndex}>
                        <TableCell className="font-medium">
                          {modality.nome}
                          <span className="text-muted-foreground text-sm block">
                            {modality.distancia} {modality.unidadeDistancia}
                          </span>
                        </TableCell>
                        {formData.batches.map((_, batchIndex) => (
                          <TableCell key={batchIndex}>
                            {isGratuita ? (
                              <Badge variant="secondary" className="text-xs">
                                Gratuita
                              </Badge>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">R$</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={getPrice(modalityIndex, batchIndex)}
                                  onChange={(e) => setPrice(modalityIndex, batchIndex, e.target.value)}
                                  className="w-24"
                                  placeholder="0.00"
                                  data-testid={`input-price-${modalityIndex}-${batchIndex}`}
                                />
                              </div>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={confirmDialogOpen} onOpenChange={(open) => {
        setConfirmDialogOpen(open);
        if (!open) {
          setConflictingBatch(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Ativacao de Lote</AlertDialogTitle>
            <AlertDialogDescription>
              Existe um lote ativo ({conflictingBatch?.nome}). 
              Ao ativar este lote, o lote atual sera automaticamente desativado.
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleSaveBatch(true)}
              data-testid="button-confirm-activate-batch"
            >
              Sim, ativar este lote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
