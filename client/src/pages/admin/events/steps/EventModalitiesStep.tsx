import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import type { EventFormData } from "../EventWizard";
import type { Modality } from "@shared/schema";

interface EventModalitiesStepProps {
  formData: EventFormData;
  updateFormData: (updates: Partial<EventFormData>) => void;
}

const TIPOS_ACESSO = [
  { value: "paga", label: "Paga" },
  { value: "gratuita", label: "Gratuita" },
  { value: "voucher", label: "Voucher" },
  { value: "pcd", label: "PCD" },
  { value: "aprovacao_manual", label: "Aprovacao Manual" },
];

const emptyModality: Partial<Modality> = {
  nome: "",
  distancia: "0",
  unidadeDistancia: "km",
  horarioLargada: "",
  descricao: "",
  tipoAcesso: "paga",
  taxaComodidade: "0",
  ordem: 0,
};

export function EventModalitiesStep({ formData, updateFormData }: EventModalitiesStepProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentModality, setCurrentModality] = useState<Partial<Modality>>(emptyModality);

  const openNewDialog = () => {
    setCurrentModality({ ...emptyModality, ordem: formData.modalities.length });
    setEditingIndex(null);
    setDialogOpen(true);
  };

  const openEditDialog = (index: number) => {
    setCurrentModality({ ...formData.modalities[index] });
    setEditingIndex(index);
    setDialogOpen(true);
  };

  const handleSave = () => {
    const newModalities = [...formData.modalities];
    if (editingIndex !== null) {
      newModalities[editingIndex] = currentModality;
    } else {
      newModalities.push(currentModality);
    }
    updateFormData({ modalities: newModalities });
    setDialogOpen(false);
  };

  const handleDelete = (index: number) => {
    const newModalities = formData.modalities.filter((_, i) => i !== index);
    updateFormData({ modalities: newModalities });
  };

  const updateCurrentModality = (field: string, value: any) => {
    setCurrentModality(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Adicione as modalidades (categorias) do evento. Ex: 5km, 10km, 21km
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} data-testid="button-add-modality">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Modalidade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingIndex !== null ? "Editar Modalidade" : "Nova Modalidade"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mod-nome">Nome *</Label>
                  <Input
                    id="mod-nome"
                    value={currentModality.nome || ""}
                    onChange={(e) => updateCurrentModality("nome", e.target.value)}
                    placeholder="Ex: Corrida 10km"
                    data-testid="input-modality-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mod-horario">Horario de Largada *</Label>
                  <Input
                    id="mod-horario"
                    type="time"
                    value={currentModality.horarioLargada || ""}
                    onChange={(e) => updateCurrentModality("horarioLargada", e.target.value)}
                    data-testid="input-modality-time"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="mod-distancia">Distancia *</Label>
                  <Input
                    id="mod-distancia"
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentModality.distancia || ""}
                    onChange={(e) => updateCurrentModality("distancia", e.target.value)}
                    placeholder="10"
                    data-testid="input-modality-distance"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mod-unidade">Unidade</Label>
                  <Select
                    value={currentModality.unidadeDistancia || "km"}
                    onValueChange={(value) => updateCurrentModality("unidadeDistancia", value)}
                  >
                    <SelectTrigger data-testid="select-modality-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="km">km</SelectItem>
                      <SelectItem value="m">m</SelectItem>
                      <SelectItem value="mi">mi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mod-vagas">Limite de Vagas</Label>
                  <Input
                    id="mod-vagas"
                    type="number"
                    min="0"
                    value={currentModality.limiteVagas || ""}
                    onChange={(e) => updateCurrentModality("limiteVagas", e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Opcional"
                    data-testid="input-modality-capacity"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mod-acesso">Tipo de Acesso *</Label>
                  <Select
                    value={currentModality.tipoAcesso || "paga"}
                    onValueChange={(value) => updateCurrentModality("tipoAcesso", value)}
                  >
                    <SelectTrigger data-testid="select-modality-access">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_ACESSO.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mod-taxa">Taxa de Comodidade (R$)</Label>
                  <Input
                    id="mod-taxa"
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentModality.taxaComodidade || "0"}
                    onChange={(e) => updateCurrentModality("taxaComodidade", e.target.value)}
                    placeholder="0.00"
                    data-testid="input-modality-fee"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mod-descricao">Descricao</Label>
                <Textarea
                  id="mod-descricao"
                  value={currentModality.descricao || ""}
                  onChange={(e) => updateCurrentModality("descricao", e.target.value)}
                  placeholder="Informacoes adicionais sobre a modalidade..."
                  rows={3}
                  data-testid="input-modality-description"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mod-imagem">URL da Imagem</Label>
                  <Input
                    id="mod-imagem"
                    type="url"
                    value={currentModality.imagemUrl || ""}
                    onChange={(e) => updateCurrentModality("imagemUrl", e.target.value)}
                    placeholder="https://..."
                    data-testid="input-modality-image"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mod-mapa">URL do Mapa do Percurso</Label>
                  <Input
                    id="mod-mapa"
                    type="url"
                    value={currentModality.mapaPercursoUrl || ""}
                    onChange={(e) => updateCurrentModality("mapaPercursoUrl", e.target.value)}
                    placeholder="https://..."
                    data-testid="input-modality-map"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button 
                onClick={handleSave}
                disabled={!currentModality.nome || !currentModality.horarioLargada}
                data-testid="button-save-modality"
              >
                {editingIndex !== null ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {formData.modalities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Nenhuma modalidade cadastrada</p>
            <Button variant="outline" onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar primeira modalidade
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {formData.modalities.map((modality, index) => (
            <Card key={index} data-testid={`card-modality-${index}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base">{modality.nome}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {modality.distancia} {modality.unidadeDistancia} - Largada: {modality.horarioLargada}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(index)}
                      data-testid={`button-edit-modality-${index}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(index)}
                      data-testid={`button-delete-modality-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
