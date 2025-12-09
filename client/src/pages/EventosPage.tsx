import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import EventCard from "@/components/EventCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, CalendarX } from "lucide-react";
import heroImage from '@assets/generated_images/Marathon_runners_landscape_hero_b439e181.png';
import type { Event } from "@shared/schema";

export default function EventosPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, error } = useQuery<{ success: boolean; data: Event[] }>({
    queryKey: ["/api/events"],
  });

  const events = data?.data || [];

  const filteredEvents = events.filter(event =>
    event.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70 z-10"></div>
        <img
          src={heroImage}
          alt="Corrida"
          className="w-full h-[300px] md:h-[400px] object-cover"
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="text-center px-4 max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Encontre Sua Próxima Corrida
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-6">
              Inscreva-se nos melhores eventos esportivos do Brasil
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar eventos por nome ou cidade..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-events"
            />
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Eventos Disponíveis
          </h2>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "Carregando..." : `${filteredEvents.length} ${filteredEvents.length === 1 ? 'evento encontrado' : 'eventos encontrados'}`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                slug={event.slug}
                nome={event.nome}
                descricao={event.descricao}
                data={event.dataEvento}
                local={event.endereco}
                cidade={event.cidade}
                estado={event.estado}
                imagemUrl={event.bannerUrl || heroImage}
                distancias=""
                valor=""
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CalendarX className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            {searchTerm ? (
              <p className="text-muted-foreground text-lg">
                Nenhum evento encontrado com o termo "{searchTerm}"
              </p>
            ) : (
              <>
                <p className="text-muted-foreground text-lg mb-2">
                  Nenhum evento disponível no momento
                </p>
                <p className="text-sm text-muted-foreground">
                  Novos eventos serão publicados em breve. Volte mais tarde!
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
