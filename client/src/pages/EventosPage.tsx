import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import EventCard from "@/components/EventCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, CalendarX, MapPin, Calendar } from "lucide-react";
import heroImage from '@assets/generated_images/Marathon_runners_landscape_hero_b439e181.png';
import type { Event } from "@shared/schema";

export default function EventosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("all");

  const { data, isLoading, error } = useQuery<{ success: boolean; data: Event[] }>({
    queryKey: ["/api/events"],
  });

  const events = data?.data || [];

  const cities = useMemo(() => {
    const uniqueCities = Array.from(new Set(events.map(e => e.cidade))).sort();
    return uniqueCities;
  }, [events]);

  const dateOptions = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const options = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(currentYear, currentMonth + i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      options.push({
        value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: monthName.charAt(0).toUpperCase() + monthName.slice(1)
      });
    }
    return options;
  }, []);

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchTerm === "" || 
      event.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.cidade.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = selectedCity === "all" || event.cidade === selectedCity;
    
    let matchesDate = true;
    if (selectedDate !== "all" && event.dataEvento) {
      const eventDate = new Date(event.dataEvento);
      const [year, month] = selectedDate.split('-');
      matchesDate = eventDate.getFullYear() === parseInt(year) && 
                    (eventDate.getMonth() + 1) === parseInt(month);
    }
    
    return matchesSearch && matchesCity && matchesDate;
  });

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
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
          <div className="text-center px-4 max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Encontre Sua Próxima Corrida
            </h1>
            <p className="text-lg md:text-xl text-white/90">
              Inscreva-se nos melhores eventos esportivos do Brasil
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-30 -mt-8 mb-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-xl p-2 flex flex-col md:flex-row items-stretch gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Digite para procurar..."
                className="pl-10 border-0 shadow-none focus-visible:ring-0 h-12"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-events"
              />
            </div>
            
            <div className="hidden md:block w-px bg-border"></div>
            
            <div className="flex-1">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="border-0 shadow-none focus:ring-0 h-12" data-testid="select-city">
                  <MapPin className="h-5 w-5 text-muted-foreground mr-2" />
                  <SelectValue placeholder="Local" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os locais</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="hidden md:block w-px bg-border"></div>
            
            <div className="flex-1">
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="border-0 shadow-none focus:ring-0 h-12" data-testid="select-date">
                  <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                  <SelectValue placeholder="Todas as datas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as datas</SelectItem>
                  {dateOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              size="lg" 
              className="h-12 px-8"
              data-testid="button-search"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-8 md:pb-12">

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
