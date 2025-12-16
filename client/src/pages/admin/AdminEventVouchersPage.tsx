import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Ticket, 
  Tag, 
  Plus, 
  ArrowLeft, 
  Copy, 
  Trash2, 
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Percent,
  DollarSign
} from "lucide-react";
import { formatDateTimeBrazil, formatForInput } from "@/lib/timezone";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event } from "@shared/schema";

interface VoucherBatch {
  id: string;
  eventId: string;
  nome: string;
  quantidade: number;
  validFrom: string;
  validUntil: string;
  descricao?: string | null;
  createdAt: string;
}

interface Voucher {
  id: string;
  eventId: string;
  batchId?: string | null;
  code: string;
  status: "available" | "used" | "expired";
  validFrom: string;
  validUntil: string;
  createdAt: string;
  usage?: {
    usedAt: string;
    userId: string;
    registrationId?: string | null;
  } | null;
}

interface Coupon {
  id: string;
  eventId: string;
  code: string;
  discountType: "percentage" | "fixed" | "full";
  discountValue?: string | null;
  maxUses?: number | null;
  maxUsesPerUser: number;
  currentUses: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

interface VoucherReport {
  total: number;
  available: number;
  used: number;
  expired: number;
}

export default function AdminEventVouchersPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("vouchers");
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [voucherDialogOpen, setVoucherDialogOpen] = useState(false);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [deleteVoucherDialog, setDeleteVoucherDialog] = useState<{ open: boolean; id: string; code: string } | null>(null);
  const [deleteCouponDialog, setDeleteCouponDialog] = useState<{ open: boolean; id: string; code: string } | null>(null);

  const [batchForm, setBatchForm] = useState({
    nome: "",
    quantidade: 10,
    validFrom: "",
    validUntil: "",
    descricao: ""
  });

  const [voucherForm, setVoucherForm] = useState({
    code: "",
    validFrom: "",
    validUntil: ""
  });

  const [couponForm, setCouponForm] = useState({
    code: "",
    discountType: "percentage" as "percentage" | "fixed" | "full",
    discountValue: "",
    maxUses: "",
    maxUsesPerUser: "1",
    validFrom: "",
    validUntil: ""
  });

  const { data: eventData, isLoading: eventLoading } = useQuery<{ success: boolean; data: Event }>({
    queryKey: ["/api/admin/events", id],
  });

  const { data: batchesData, isLoading: batchesLoading } = useQuery<{ success: boolean; data: VoucherBatch[] }>({
    queryKey: ["/api/admin/events", id, "vouchers/batches"],
  });

  const { data: vouchersData, isLoading: vouchersLoading } = useQuery<{ success: boolean; data: Voucher[] }>({
    queryKey: ["/api/admin/events", id, "vouchers"],
  });

  const { data: reportData } = useQuery<{ success: boolean; data: VoucherReport }>({
    queryKey: ["/api/admin/events", id, "vouchers/report"],
  });

  const { data: couponsData, isLoading: couponsLoading } = useQuery<{ success: boolean; data: Coupon[] }>({
    queryKey: ["/api/admin/events", id, "coupons"],
  });

  const event = eventData?.data;
  const batches = batchesData?.data || [];
  const vouchers = vouchersData?.data || [];
  const report = reportData?.data;
  const coupons = couponsData?.data || [];

  const createBatchMutation = useMutation({
    mutationFn: async (data: typeof batchForm) => {
      const response = await apiRequest("POST", `/api/admin/events/${id}/vouchers/batches`, data);
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || "Erro ao criar lote");
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id, "vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id, "vouchers/batches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id, "vouchers/report"] });
      setBatchDialogOpen(false);
      setBatchForm({ nome: "", quantidade: 10, validFrom: "", validUntil: "", descricao: "" });
      toast({ title: `Lote criado com ${result.data?.vouchersCreated || 0} vouchers` });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar lote", description: error.message, variant: "destructive" });
    }
  });

  const createVoucherMutation = useMutation({
    mutationFn: async (data: typeof voucherForm) => {
      const response = await apiRequest("POST", `/api/admin/events/${id}/vouchers`, data);
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || "Erro ao criar voucher");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id, "vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id, "vouchers/report"] });
      setVoucherDialogOpen(false);
      setVoucherForm({ code: "", validFrom: "", validUntil: "" });
      toast({ title: "Voucher criado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar voucher", description: error.message, variant: "destructive" });
    }
  });

  const deleteVoucherMutation = useMutation({
    mutationFn: async (voucherId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/events/${id}/vouchers/${voucherId}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || "Erro ao excluir voucher");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id, "vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id, "vouchers/report"] });
      setDeleteVoucherDialog(null);
      toast({ title: "Voucher excluido com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir voucher", description: error.message, variant: "destructive" });
    }
  });

  const createCouponMutation = useMutation({
    mutationFn: async (data: typeof couponForm) => {
      const payload = {
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountType === "full" ? null : parseFloat(data.discountValue) || 0,
        maxUses: data.maxUses ? parseInt(data.maxUses) : null,
        maxUsesPerUser: parseInt(data.maxUsesPerUser) || 1,
        validFrom: data.validFrom,
        validUntil: data.validUntil
      };
      const response = await apiRequest("POST", `/api/admin/events/${id}/coupons`, payload);
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || "Erro ao criar cupom");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id, "coupons"] });
      setCouponDialogOpen(false);
      setCouponForm({ code: "", discountType: "percentage", discountValue: "", maxUses: "", maxUsesPerUser: "1", validFrom: "", validUntil: "" });
      toast({ title: "Cupom criado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar cupom", description: error.message, variant: "destructive" });
    }
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (couponId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/events/${id}/coupons/${couponId}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error?.message || "Erro ao excluir cupom");
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events", id, "coupons"] });
      setDeleteCouponDialog(null);
      toast({ title: "Cupom excluido com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir cupom", description: error.message, variant: "destructive" });
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Codigo copiado!" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />Disponivel</Badge>;
      case "used":
        return <Badge variant="default"><Clock className="h-3 w-3 mr-1" />Utilizado</Badge>;
      case "expired":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDiscountLabel = (type: string, value?: string | null) => {
    switch (type) {
      case "percentage":
        return `${value || 0}%`;
      case "fixed":
        return `R$ ${parseFloat(value || "0").toFixed(2)}`;
      case "full":
        return "100%";
      default:
        return "-";
    }
  };

  if (eventLoading) {
    return (
      <AdminLayout
        title="Carregando..."
        breadcrumbs={[
          { label: "Eventos", href: "/admin/eventos" },
          { label: "Vouchers e Cupons" },
        ]}
      >
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
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
      title={`Vouchers e Cupons: ${event.nome}`}
      breadcrumbs={[
        { label: "Eventos", href: "/admin/eventos" },
        { label: event.nome, href: `/admin/eventos/${id}/gerenciar` },
        { label: "Vouchers e Cupons" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Vouchers e Cupons</h1>
            <p className="text-muted-foreground">{event.nome}</p>
          </div>
          <Link href={`/admin/eventos/${id}/gerenciar`}>
            <Button variant="outline" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>

        {report && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total">{report.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disponiveis</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600" data-testid="text-available">{report.available}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilizados</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600" data-testid="text-used">{report.used}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expirados</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive" data-testid="text-expired">{report.expired}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="vouchers" data-testid="tab-vouchers">
              <Ticket className="h-4 w-4 mr-2" />
              Vouchers
            </TabsTrigger>
            <TabsTrigger value="coupons" data-testid="tab-coupons">
              <Tag className="h-4 w-4 mr-2" />
              Cupons
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vouchers" className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => setBatchDialogOpen(true)} data-testid="button-create-batch">
                <Plus className="h-4 w-4 mr-2" />
                Criar Lote
              </Button>
              <Button variant="outline" onClick={() => setVoucherDialogOpen(true)} data-testid="button-create-voucher">
                <Plus className="h-4 w-4 mr-2" />
                Voucher Avulso
              </Button>
            </div>

            {batches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lotes de Vouchers</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Validade</TableHead>
                        <TableHead>Criado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches.map((batch) => (
                        <TableRow key={batch.id} data-testid={`row-batch-${batch.id}`}>
                          <TableCell className="font-medium">{batch.nome}</TableCell>
                          <TableCell>{batch.quantidade}</TableCell>
                          <TableCell className="text-sm">
                            {formatDateTimeBrazil(batch.validFrom)} - {formatDateTimeBrazil(batch.validUntil)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDateTimeBrazil(batch.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vouchers ({vouchers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {vouchersLoading ? (
                  <Skeleton className="h-48" />
                ) : vouchers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum voucher criado ainda.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Codigo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Validade</TableHead>
                          <TableHead>Acoes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vouchers.slice(0, 100).map((voucher) => (
                          <TableRow key={voucher.id} data-testid={`row-voucher-${voucher.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <code className="font-mono bg-muted px-2 py-1 rounded text-sm">{voucher.code}</code>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => copyToClipboard(voucher.code)}
                                  data-testid={`button-copy-${voucher.id}`}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(voucher.status)}</TableCell>
                            <TableCell className="text-sm">
                              {formatDateTimeBrazil(voucher.validUntil)}
                            </TableCell>
                            <TableCell>
                              {voucher.status === "available" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setDeleteVoucherDialog({ open: true, id: voucher.id, code: voucher.code })}
                                  data-testid={`button-delete-${voucher.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {vouchers.length > 100 && (
                      <p className="text-sm text-muted-foreground mt-4 text-center">
                        Exibindo 100 de {vouchers.length} vouchers
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coupons" className="space-y-4">
            <Button onClick={() => setCouponDialogOpen(true)} data-testid="button-create-coupon">
              <Plus className="h-4 w-4 mr-2" />
              Criar Cupom
            </Button>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cupons de Desconto ({coupons.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {couponsLoading ? (
                  <Skeleton className="h-48" />
                ) : coupons.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum cupom criado ainda.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Codigo</TableHead>
                        <TableHead>Desconto</TableHead>
                        <TableHead>Usos</TableHead>
                        <TableHead>Validade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Acoes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coupons.map((coupon) => (
                        <TableRow key={coupon.id} data-testid={`row-coupon-${coupon.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="font-mono bg-muted px-2 py-1 rounded text-sm">{coupon.code}</code>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => copyToClipboard(coupon.code)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {coupon.discountType === "percentage" ? (
                                <Percent className="h-3 w-3" />
                              ) : (
                                <DollarSign className="h-3 w-3" />
                              )}
                              {getDiscountLabel(coupon.discountType, coupon.discountValue)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {coupon.currentUses}/{coupon.maxUses || "Ilimitado"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDateTimeBrazil(coupon.validUntil)}
                          </TableCell>
                          <TableCell>
                            {coupon.isActive ? (
                              <Badge variant="secondary">Ativo</Badge>
                            ) : (
                              <Badge variant="destructive">Inativo</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteCouponDialog({ open: true, id: coupon.id, code: coupon.code })}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Lote de Vouchers</DialogTitle>
            <DialogDescription>
              Gere multiplos vouchers de uma vez. Cada voucher tera um codigo unico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="batch-nome">Nome do Lote</Label>
              <Input
                id="batch-nome"
                value={batchForm.nome}
                onChange={(e) => setBatchForm({ ...batchForm, nome: e.target.value })}
                placeholder="Ex: Lote Patrocinadores 2024"
                data-testid="input-batch-nome"
              />
            </div>
            <div>
              <Label htmlFor="batch-quantidade">Quantidade de Vouchers</Label>
              <Input
                id="batch-quantidade"
                type="number"
                min={1}
                max={50000}
                value={batchForm.quantidade}
                onChange={(e) => setBatchForm({ ...batchForm, quantidade: parseInt(e.target.value) || 1 })}
                data-testid="input-batch-quantidade"
              />
              <p className="text-xs text-muted-foreground mt-1">Maximo: 50.000</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="batch-valid-from">Valido a partir de</Label>
                <Input
                  id="batch-valid-from"
                  type="datetime-local"
                  value={batchForm.validFrom}
                  onChange={(e) => setBatchForm({ ...batchForm, validFrom: e.target.value })}
                  data-testid="input-batch-valid-from"
                />
              </div>
              <div>
                <Label htmlFor="batch-valid-until">Valido ate</Label>
                <Input
                  id="batch-valid-until"
                  type="datetime-local"
                  value={batchForm.validUntil}
                  onChange={(e) => setBatchForm({ ...batchForm, validUntil: e.target.value })}
                  data-testid="input-batch-valid-until"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="batch-descricao">Descricao (opcional)</Label>
              <Textarea
                id="batch-descricao"
                value={batchForm.descricao}
                onChange={(e) => setBatchForm({ ...batchForm, descricao: e.target.value })}
                placeholder="Descricao do lote..."
                data-testid="input-batch-descricao"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>Cancelar</Button>
            <Button 
              onClick={() => createBatchMutation.mutate(batchForm)}
              disabled={createBatchMutation.isPending || !batchForm.nome || !batchForm.validFrom || !batchForm.validUntil}
              data-testid="button-submit-batch"
            >
              {createBatchMutation.isPending ? "Criando..." : "Criar Lote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={voucherDialogOpen} onOpenChange={setVoucherDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Voucher Avulso</DialogTitle>
            <DialogDescription>
              Crie um voucher individual com codigo personalizado ou gerado automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="voucher-code">Codigo (opcional)</Label>
              <Input
                id="voucher-code"
                value={voucherForm.code}
                onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })}
                placeholder="Deixe em branco para gerar automaticamente"
                data-testid="input-voucher-code"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="voucher-valid-from">Valido a partir de</Label>
                <Input
                  id="voucher-valid-from"
                  type="datetime-local"
                  value={voucherForm.validFrom}
                  onChange={(e) => setVoucherForm({ ...voucherForm, validFrom: e.target.value })}
                  data-testid="input-voucher-valid-from"
                />
              </div>
              <div>
                <Label htmlFor="voucher-valid-until">Valido ate</Label>
                <Input
                  id="voucher-valid-until"
                  type="datetime-local"
                  value={voucherForm.validUntil}
                  onChange={(e) => setVoucherForm({ ...voucherForm, validUntil: e.target.value })}
                  data-testid="input-voucher-valid-until"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoucherDialogOpen(false)}>Cancelar</Button>
            <Button 
              onClick={() => createVoucherMutation.mutate(voucherForm)}
              disabled={createVoucherMutation.isPending || !voucherForm.validFrom || !voucherForm.validUntil}
              data-testid="button-submit-voucher"
            >
              {createVoucherMutation.isPending ? "Criando..." : "Criar Voucher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Cupom de Desconto</DialogTitle>
            <DialogDescription>
              Crie um cupom que pode ser aplicado na tela de pagamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="coupon-code">Codigo do Cupom</Label>
              <Input
                id="coupon-code"
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                placeholder="Ex: DESCONTO50"
                data-testid="input-coupon-code"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coupon-type">Tipo de Desconto</Label>
                <Select 
                  value={couponForm.discountType} 
                  onValueChange={(v: "percentage" | "fixed" | "full") => setCouponForm({ ...couponForm, discountType: v })}
                >
                  <SelectTrigger data-testid="select-coupon-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    <SelectItem value="full">Gratuidade Total</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {couponForm.discountType !== "full" && (
                <div>
                  <Label htmlFor="coupon-value">Valor do Desconto</Label>
                  <Input
                    id="coupon-value"
                    type="number"
                    min={0}
                    max={couponForm.discountType === "percentage" ? 100 : undefined}
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                    placeholder={couponForm.discountType === "percentage" ? "Ex: 50" : "Ex: 25.00"}
                    data-testid="input-coupon-value"
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coupon-max-uses">Limite de Usos (total)</Label>
                <Input
                  id="coupon-max-uses"
                  type="number"
                  min={1}
                  value={couponForm.maxUses}
                  onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })}
                  placeholder="Sem limite"
                  data-testid="input-coupon-max-uses"
                />
              </div>
              <div>
                <Label htmlFor="coupon-max-per-user">Limite por Usuario</Label>
                <Input
                  id="coupon-max-per-user"
                  type="number"
                  min={1}
                  value={couponForm.maxUsesPerUser}
                  onChange={(e) => setCouponForm({ ...couponForm, maxUsesPerUser: e.target.value })}
                  data-testid="input-coupon-max-per-user"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coupon-valid-from">Valido a partir de</Label>
                <Input
                  id="coupon-valid-from"
                  type="datetime-local"
                  value={couponForm.validFrom}
                  onChange={(e) => setCouponForm({ ...couponForm, validFrom: e.target.value })}
                  data-testid="input-coupon-valid-from"
                />
              </div>
              <div>
                <Label htmlFor="coupon-valid-until">Valido ate</Label>
                <Input
                  id="coupon-valid-until"
                  type="datetime-local"
                  value={couponForm.validUntil}
                  onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })}
                  data-testid="input-coupon-valid-until"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCouponDialogOpen(false)}>Cancelar</Button>
            <Button 
              onClick={() => createCouponMutation.mutate(couponForm)}
              disabled={createCouponMutation.isPending || !couponForm.code || !couponForm.validFrom || !couponForm.validUntil}
              data-testid="button-submit-coupon"
            >
              {createCouponMutation.isPending ? "Criando..." : "Criar Cupom"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteVoucherDialog?.open || false} onOpenChange={(open) => !open && setDeleteVoucherDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Voucher</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o voucher "{deleteVoucherDialog?.code}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteVoucherDialog && deleteVoucherMutation.mutate(deleteVoucherDialog.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteCouponDialog?.open || false} onOpenChange={(open) => !open && setDeleteCouponDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Cupom</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cupom "{deleteCouponDialog?.code}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteCouponDialog && deleteCouponMutation.mutate(deleteCouponDialog.id)}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
