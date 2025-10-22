import { useState } from "react";
import Header from "@/components/Header";
import InscricaoCard from "@/components/InscricaoCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import cityImage from '@assets/generated_images/City_marathon_aerial_view_94ce50b6.png';
import trailImage from '@assets/generated_images/Trail_running_mountain_event_08f65871.png';
import beachImage from '@assets/generated_images/Beach_running_race_event_8d36858c.png';

//todo: remove mock functionality
const mockInscricoes = [
  {
    id: "1",
    eventoNome: "Maratona de São Paulo 2025",
    eventoData: "2025-05-15",
    eventoLocal: "Parque Ibirapuera, São Paulo - SP",
    distancia: "21km",
    status: "confirmada",
    eventoImagem: cityImage,
  },
  {
    id: "2",
    eventoNome: "Corrida Trail Serra do Mar",
    eventoData: "2025-06-20",
    eventoLocal: "Parque Estadual da Serra do Mar, Cunha - SP",
    distancia: "15km",
    status: "confirmada",
    eventoImagem: trailImage,
  },
  {
    id: "3",
    eventoNome: "Corrida de Praia Florianópolis",
    eventoData: "2025-08-05",
    eventoLocal: "Praia da Joaquina, Florianópolis - SC",
    distancia: "10km",
    status: "confirmada",
    eventoImagem: beachImage,
  },
];

const mockConcluidas = [
  {
    id: "4",
    eventoNome: "Meia Maratona do Rio 2024",
    eventoData: "2024-11-10",
    eventoLocal: "Copacabana, Rio de Janeiro - RJ",
    distancia: "21km",
    status: "concluída",
    eventoImagem: cityImage,
  },
];

export default function MinhasInscricoesPage() {
  const [activeTab, setActiveTab] = useState("proximas");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Minhas Inscrições
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas inscrições em eventos esportivos
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="proximas" data-testid="tab-proximas">
              Próximas ({mockInscricoes.length})
            </TabsTrigger>
            <TabsTrigger value="concluidas" data-testid="tab-concluidas">
              Concluídas ({mockConcluidas.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proximas" className="space-y-4">
            {mockInscricoes.map((inscricao) => (
              <InscricaoCard key={inscricao.id} {...inscricao} />
            ))}
            {mockInscricoes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Você não possui inscrições em eventos próximos
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="concluidas" className="space-y-4">
            {mockConcluidas.map((inscricao) => (
              <InscricaoCard key={inscricao.id} {...inscricao} />
            ))}
            {mockConcluidas.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Você ainda não participou de nenhum evento
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
