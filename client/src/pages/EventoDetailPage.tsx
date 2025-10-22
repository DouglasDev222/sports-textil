import { useRoute } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, Award, Info } from "lucide-react";
import heroImage from '@assets/generated_images/Marathon_runners_landscape_hero_b439e181.png';

//todo: remove mock functionality
const mockEvent = {
  id: "1",
  nome: "Maratona de São Paulo 2025",
  descricao: "A maior maratona do Brasil acontece em São Paulo! Participe desta experiência única correndo pelas principais avenidas da cidade. O evento conta com percursos para todos os níveis de corredores.",
  data: "2025-05-15",
  horario: "06:00",
  local: "Parque Ibirapuera",
  cidade: "São Paulo",
  estado: "SP",
  distancias: ["5km", "10km", "21km", "42km"],
  imagemUrl: heroImage,
  valor: "R$ 120,00",
  vagasDisponiveis: "500",
  informacoes: [
    "Kit do atleta: Camiseta oficial, número de peito e chip de cronometragem",
    "Hidratação durante o percurso",
    "Medalha de participação",
    "Certificado digital",
    "Seguro de acidentes pessoais"
  ]
};

export default function EventoDetailPage() {
  const [, params] = useRoute("/evento/:id");

  const formattedDate = new Date(mockEvent.data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const handleInscricao = () => {
    console.log('Inscrição iniciada para evento:', mockEvent.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary/75 z-10"></div>
        <img
          src={mockEvent.imagemUrl}
          alt={mockEvent.nome}
          className="w-full h-[300px] md:h-[500px] object-cover"
        />
        <div className="absolute inset-0 z-20 flex items-end">
          <div className="w-full px-4 md:px-6 pb-8 md:pb-12">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                {mockEvent.nome}
              </h1>
              <div className="flex flex-wrap gap-2">
                {mockEvent.distancias.map((dist, idx) => (
                  <Badge key={idx} variant="secondary" className="text-sm">
                    {dist}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data e Hora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-foreground">{formattedDate}</p>
              <p className="text-sm text-muted-foreground">{mockEvent.horario}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Local
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-foreground">{mockEvent.local}</p>
              <p className="text-sm text-muted-foreground">{mockEvent.cidade}, {mockEvent.estado}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Vagas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-foreground">{mockEvent.vagasDisponiveis}</p>
              <p className="text-sm text-muted-foreground">vagas disponíveis</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Sobre o Evento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {mockEvent.descricao}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              O que está incluído
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {mockEvent.informacoes.map((info, idx) => (
                <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-accent mt-1">•</span>
                  <span>{info}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Valores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Inscrição a partir de</p>
                <p className="text-3xl font-bold text-foreground">{mockEvent.valor}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="lg"
              className="w-full font-semibold"
              onClick={handleInscricao}
              data-testid="button-inscricao"
            >
              Inscrever-se Agora
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
