import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Eye, Search } from "lucide-react";
import type { Event } from "@shared/schema";

const statusColors: Record<string, string> = {
  rascunho: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  publicado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  finalizado: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export default function AdminEventsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const { data, isLoading } = useQuery<{ success: boolean; data: Event[] }>({
    queryKey: ["/api/admin/events"],
  });

  const events = data?.data || [];

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.cidade.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout 
      title="Eventos" 
      breadcrumbs={[{ label: "Eventos" }]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Eventos</h1>
            <p className="text-muted-foreground">
              Gerencie os eventos do sistema
            </p>
          </div>
          <Button data-testid="button-create-event">
            <Plus className="mr-2 h-4 w-4" />
            Novo Evento
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-events"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="publicado">Publicado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredEvents.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {events.length === 0 
                  ? "Nenhum evento cadastrado" 
                  : "Nenhum evento encontrado com os filtros aplicados"}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Vagas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id} data-testid={`row-event-${event.id}`}>
                      <TableCell className="font-medium">{event.nome}</TableCell>
                      <TableCell>{event.cidade}, {event.estado}</TableCell>
                      <TableCell>
                        {new Date(event.dataEvento).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>{event.limiteVagasTotal}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={statusColors[event.status]}
                        >
                          {event.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/eventos/${event.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-testid={`button-view-${event.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
