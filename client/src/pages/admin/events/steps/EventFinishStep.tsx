import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Trash2, Shirt, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { EventFormData } from "../EventWizard";
import type { ShirtSize, Attachment } from "@shared/schema";

interface EventFinishStepProps {
  formData: EventFormData;
  updateFormData: (updates: Partial<EventFormData>) => void;
}

const TAMANHOS_CAMISA = ["PP", "P", "M", "G", "GG", "XG", "XXG", "INFANTIL"];

const emptyShirt: Partial<ShirtSize> = {
  tamanho: "",
  quantidadeTotal: 0,
  quantidadeDisponivel: 0,
};

const emptyAttachment: Partial<Attachment> = {
  nome: "",
  url: "",
  obrigatorioAceitar: false,
  ordem: 0,
};

export function EventFinishStep({ formData, updateFormData }: EventFinishStepProps) {
  const [shirtDialogOpen, setShirtDialogOpen] = useState(false);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [currentShirt, setCurrentShirt] = useState<Partial<ShirtSize>>(emptyShirt);
  const [currentAttachment, setCurrentAttachment] = useState<Partial<Attachment>>(emptyAttachment);

  const handleAddShirt = () => {
    if (currentShirt.tamanho && currentShirt.quantidadeTotal) {
      const newShirts = [...formData.shirts, {
        ...currentShirt,
        quantidadeDisponivel: currentShirt.quantidadeTotal
      }];
      updateFormData({ shirts: newShirts });
      setCurrentShirt(emptyShirt);
      setShirtDialogOpen(false);
    }
  };

  const handleDeleteShirt = (index: number) => {
    const newShirts = formData.shirts.filter((_, i) => i !== index);
    updateFormData({ shirts: newShirts });
  };

  const handleAddAttachment = () => {
    if (currentAttachment.nome && currentAttachment.url) {
      const newAttachments = [...formData.attachments, {
        ...currentAttachment,
        ordem: formData.attachments.length
      }];
      updateFormData({ attachments: newAttachments });
      setCurrentAttachment(emptyAttachment);
      setAttachmentDialogOpen(false);
    }
  };

  const handleDeleteAttachment = (index: number) => {
    const newAttachments = formData.attachments.filter((_, i) => i !== index);
    updateFormData({ attachments: newAttachments });
  };

  const usedSizes = formData.shirts.map(s => s.tamanho);
  const availableSizes = TAMANHOS_CAMISA.filter(t => !usedSizes.includes(t));

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Este e o ultimo passo. Configure a grade de camisas e documentos do evento.
          Voce podera editar estas informacoes depois.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div className="flex items-center gap-2">
            <Shirt className="h-5 w-5" />
            <div>
              <CardTitle>Grade de Camisas</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure os tamanhos e quantidades disponiveis
              </p>
            </div>
          </div>
          <Dialog open={shirtDialogOpen} onOpenChange={setShirtDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={availableSizes.length === 0} data-testid="button-add-shirt">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Tamanho
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Tamanho de Camisa</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="shirt-size">Tamanho</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => (
                      <Button
                        key={size}
                        type="button"
                        variant={currentShirt.tamanho === size ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentShirt(prev => ({ ...prev, tamanho: size }))}
                        data-testid={`button-size-${size}`}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shirt-quantity">Quantidade Total</Label>
                  <Input
                    id="shirt-quantity"
                    type="number"
                    min="1"
                    value={currentShirt.quantidadeTotal || ""}
                    onChange={(e) => setCurrentShirt(prev => ({
                      ...prev,
                      quantidadeTotal: parseInt(e.target.value) || 0
                    }))}
                    placeholder="Ex: 500"
                    data-testid="input-shirt-quantity"
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button 
                  onClick={handleAddShirt}
                  disabled={!currentShirt.tamanho || !currentShirt.quantidadeTotal}
                  data-testid="button-save-shirt"
                >
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {formData.shirts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Nenhum tamanho cadastrado</p>
              <Button variant="outline" onClick={() => setShirtDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar tamanho
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {formData.shirts.map((shirt, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  data-testid={`card-shirt-${index}`}
                >
                  <div>
                    <span className="font-bold text-lg">{shirt.tamanho}</span>
                    <p className="text-sm text-muted-foreground">
                      {shirt.quantidadeTotal} unidades
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteShirt(index)}
                    data-testid={`button-delete-shirt-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <div>
              <CardTitle>Documentos e Anexos</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Regulamento, termos de uso e outros documentos
              </p>
            </div>
          </div>
          <Dialog open={attachmentDialogOpen} onOpenChange={setAttachmentDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-attachment">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Documento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Documento</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="attachment-name">Nome do Documento *</Label>
                  <Input
                    id="attachment-name"
                    value={currentAttachment.nome || ""}
                    onChange={(e) => setCurrentAttachment(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Regulamento do Evento"
                    data-testid="input-attachment-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attachment-url">URL do Documento *</Label>
                  <Input
                    id="attachment-url"
                    type="url"
                    value={currentAttachment.url || ""}
                    onChange={(e) => setCurrentAttachment(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://exemplo.com/regulamento.pdf"
                    data-testid="input-attachment-url"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Aceite Obrigatorio</Label>
                    <p className="text-sm text-muted-foreground">
                      Participante deve aceitar para se inscrever
                    </p>
                  </div>
                  <Switch
                    checked={currentAttachment.obrigatorioAceitar ?? false}
                    onCheckedChange={(checked) => setCurrentAttachment(prev => ({
                      ...prev,
                      obrigatorioAceitar: checked
                    }))}
                    data-testid="switch-attachment-required"
                  />
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button 
                  onClick={handleAddAttachment}
                  disabled={!currentAttachment.nome || !currentAttachment.url}
                  data-testid="button-save-attachment"
                >
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {formData.attachments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Nenhum documento cadastrado</p>
              <Button variant="outline" onClick={() => setAttachmentDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar documento
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {formData.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  data-testid={`card-attachment-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <span className="font-medium">{attachment.nome}</span>
                      {attachment.obrigatorioAceitar && (
                        <span className="ml-2 text-xs text-destructive">(Aceite obrigatorio)</span>
                      )}
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {attachment.url}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAttachment(index)}
                    data-testid={`button-delete-attachment-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo do Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">{formData.modalities.length}</p>
              <p className="text-sm text-muted-foreground">Modalidades</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">{formData.batches.length}</p>
              <p className="text-sm text-muted-foreground">Lotes</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">{formData.shirts.length}</p>
              <p className="text-sm text-muted-foreground">Tamanhos de Camisa</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-3xl font-bold">{formData.attachments.length}</p>
              <p className="text-sm text-muted-foreground">Documentos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
