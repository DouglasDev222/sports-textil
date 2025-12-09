import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Search, 
  Download,
  ArrowLeft,
  Settings
} from "lucide-react";
import { formatDateOnlyBrazil } from "@/lib/timezone";
import type { Event, Modality } from "@shared/schema";

interface EnrichedRegistration {
  id: string;
  numeroInscricao: number;
  athleteId: string;
  modalityId: string;
  modalityName: string;
  athleteName: string;
  athleteEmail: string;
  athletePhone: string;
  nomeCompleto: string | null;
  cpf: string | null;
  dataNascimento: string | null;
  sexo: string | null;
  tamanhoCamisa: string | null;
  valorUnitario: string;
  taxaComodidade: string;
  status: string;
  equipe: string | null;
  dataInscricao: string;
}

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmada: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelada: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  no_show: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  no_show: "No Show",
};

export default function AdminEventInscritosPage() {
  const { id } = useParams<{ id: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [modalityFilter, setModalityFilter] = useState<string>("todos");

  const { data: eventData, isLoading: eventLoading } = useQuery<{ success: boolean; data: Event }>({
    queryKey: ["/api/admin/events", id],
  });

  const { data: modalitiesData } = useQuery<{ success: boolean; data: Modality[] }>({
    queryKey: ["/api/admin/events", id, "modalities"],
  });

  const { data: registrationsData, isLoading: registrationsLoading } = useQuery<{ success: boolean; data: EnrichedRegistration[] }>({
    queryKey: ["/api/admin/events", id, "registrations"],
  });

  const event = eventData?.data;
  const modalities = modalitiesData?.data || [];
  const registrations = registrationsData?.data || [];

  const isLoading = eventLoading || registrationsLoading;

  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch = 
      reg.athleteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.nomeCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.cpf?.includes(searchTerm) ||
      reg.numeroInscricao.toString().includes(searchTerm);
    const matchesStatus = statusFilter === "todos" || reg.status === statusFilter;
    const matchesModality = modalityFilter === "todos" || reg.modalityId === modalityFilter;
    return matchesSearch && matchesStatus && matchesModality;
  });

  const exportToExcel = () => {
    const headers = [
      "Numero",
      "Nome",
      "CPF",
      "Email",
      "Telefone",
      "Sexo",
      "Data Nascimento",
      "Modalidade",
      "Tamanho Camisa",
      "Equipe",
      "Valor",
      "Taxa",
      "Status",
      "Data Inscricao",
    ];

    const rows = filteredRegistrations.map((reg) => [
      reg.numeroInscricao,
      reg.nomeCompleto || reg.athleteName,
      reg.cpf || "",
      reg.athleteEmail,
      reg.athletePhone,
      reg.sexo || "",
      reg.dataNascimento ? formatDateOnlyBrazil(reg.dataNascimento) : "",
      reg.modalityName,
      reg.tamanhoCamisa || "",
      reg.equipe || "",
      reg.valorUnitario,
      reg.taxaComodidade,
      statusLabels[reg.status] || reg.status,
      formatDateOnlyBrazil(reg.dataInscricao),
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.map(cell => `"${cell}"`).join(";")),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inscritos_${event?.slug || id}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <AdminLayout
        title="Carregando..."
        breadcrumbs={[
          { label: "Eventos", href: "/admin/eventos" },
          { label: "Inscritos" },
        ]}
      >
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64" />
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
      title={`Inscritos: ${event.nome}`}
      breadcrumbs={[
        { label: "Eventos", href: "/admin/eventos" },
        { label: event.nome, href: `/admin/eventos/${id}` },
        { label: "Inscritos" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inscritos</h1>
            <p className="text-muted-foreground">
              {filteredRegistrations.length} inscricoes encontradas
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              onClick={exportToExcel}
              disabled={filteredRegistrations.length === 0}
              data-testid="button-export-excel"
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
            <Link href={`/admin/eventos/${id}/gerenciar`}>
              <Button variant="outline" data-testid="button-manage-event">
                <Settings className="mr-2 h-4 w-4" />
                Gerenciar Evento
              </Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CPF ou numero..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-inscritos"
                />
              </div>
              <Select value={modalityFilter} onValueChange={setModalityFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-modality-filter">
                  <SelectValue placeholder="Modalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas modalidades</SelectItem>
                  {modalities.map((mod) => (
                    <SelectItem key={mod.id} value={mod.id}>
                      {mod.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos status</SelectItem>
                  <SelectItem value="confirmada">Confirmada</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRegistrations.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {registrations.length === 0 
                  ? "Nenhuma inscricao cadastrada" 
                  : "Nenhuma inscricao encontrada com os filtros aplicados"}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numero</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Modalidade</TableHead>
                      <TableHead>Sexo</TableHead>
                      <TableHead>Camisa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRegistrations.map((reg) => (
                      <TableRow key={reg.id} data-testid={`row-inscrito-${reg.id}`}>
                        <TableCell className="font-medium">
                          #{reg.numeroInscricao}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{reg.nomeCompleto || reg.athleteName}</p>
                            <p className="text-xs text-muted-foreground">{reg.athleteEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>{reg.cpf || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{reg.modalityName}</Badge>
                        </TableCell>
                        <TableCell className="capitalize">
                          {reg.sexo || "-"}
                        </TableCell>
                        <TableCell>{reg.tamanhoCamisa || "-"}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={statusColors[reg.status]}
                          >
                            {statusLabels[reg.status] || reg.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDateOnlyBrazil(reg.dataInscricao)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
