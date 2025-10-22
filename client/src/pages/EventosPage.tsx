import { useState } from "react";
import Header from "@/components/Header";
import EventCard from "@/components/EventCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import heroImage from '@assets/generated_images/Marathon_runners_landscape_hero_b439e181.png';
import cityImage from '@assets/generated_images/City_marathon_aerial_view_94ce50b6.png';
import trailImage from '@assets/generated_images/Trail_running_mountain_event_08f65871.png';
import beachImage from '@assets/generated_images/Beach_running_race_event_8d36858c.png';

//todo: remove mock functionality
const mockEvents = [
  {
    id: "1",
    slug: "maratona-sao-paulo-2025",
    nome: "Maratona de São Paulo 2025",
    descricao: "A maior maratona do Brasil",
    data: "2025-05-15",
    local: "Parque Ibirapuera",
    cidade: "São Paulo",
    estado: "SP",
    distancias: "5km, 10km, 21km, 42km",
    imagemUrl: heroImage,
    valor: "R$ 120,00",
  },
  {
    id: "2",
    slug: "corrida-trail-serra-mar",
    nome: "Corrida Trail Serra do Mar",
    descricao: "Trail running na natureza",
    data: "2025-06-20",
    local: "Parque Estadual da Serra do Mar",
    cidade: "Cunha",
    estado: "SP",
    distancias: "15km, 30km",
    imagemUrl: trailImage,
    valor: "R$ 150,00",
  },
  {
    id: "3",
    slug: "meia-maratona-rio",
    nome: "Meia Maratona do Rio",
    descricao: "Corrida pela orla carioca",
    data: "2025-07-10",
    local: "Copacabana",
    cidade: "Rio de Janeiro",
    estado: "RJ",
    distancias: "10km, 21km",
    imagemUrl: cityImage,
    valor: "R$ 100,00",
  },
  {
    id: "4",
    slug: "corrida-praia-florianopolis",
    nome: "Corrida de Praia Florianópolis",
    descricao: "Corrida na areia da praia",
    data: "2025-08-05",
    local: "Praia da Joaquina",
    cidade: "Florianópolis",
    estado: "SC",
    distancias: "5km, 10km",
    imagemUrl: beachImage,
    valor: "R$ 80,00",
  },
  {
    id: "5",
    slug: "maratona-brasilia",
    nome: "Maratona de Brasília",
    descricao: "Corrida pela capital federal",
    data: "2025-09-15",
    local: "Esplanada dos Ministérios",
    cidade: "Brasília",
    estado: "DF",
    distancias: "5km, 10km, 21km, 42km",
    imagemUrl: heroImage,
    valor: "R$ 110,00",
  },
  {
    id: "6",
    slug: "corrida-noturna-bh",
    nome: "Corrida Noturna BH",
    descricao: "Corrida noturna em Belo Horizonte",
    data: "2025-10-20",
    local: "Lagoa da Pampulha",
    cidade: "Belo Horizonte",
    estado: "MG",
    distancias: "5km, 10km",
    imagemUrl: cityImage,
    valor: "R$ 90,00",
  },
];

export default function EventosPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEvents = mockEvents.filter(event =>
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
            {filteredEvents.length} {filteredEvents.length === 1 ? 'evento encontrado' : 'eventos encontrados'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} {...event} />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Nenhum evento encontrado com o termo "{searchTerm}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
