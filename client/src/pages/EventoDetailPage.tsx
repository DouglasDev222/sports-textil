import { useRoute } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Clock, Award, Info, FileText, Download, Package } from "lucide-react";
import heroImage from '@assets/generated_images/Marathon_runners_landscape_hero_b439e181.png';

//todo: remove mock functionality
const mockEvent = {
  id: "1",
  slug: "maratona-sao-paulo-2025",
  nome: "Maratona de São Paulo 2025",
  descricao: "A maior maratona do Brasil acontece em São Paulo! Participe desta experiência única correndo pelas principais avenidas da cidade. O evento conta com percursos para todos os níveis de corredores.",
  data: "2025-05-15",
  horario: "06:00",
  local: "Parque Ibirapuera",
  cidade: "São Paulo",
  estado: "SP",
  distancias: ["5km", "10km", "21km", "42km"],
  horariosLargada: [
    { distancia: "5km", horario: "07:00", descricao: "Largada da corrida de 5km" },
    { distancia: "10km", horario: "06:45", descricao: "Largada da corrida de 10km" },
    { distancia: "21km", horario: "06:15", descricao: "Largada da meia maratona" },
    { distancia: "42km", horario: "06:00", descricao: "Largada da maratona completa" },
  ],
  imagemUrl: heroImage,
  valor: "R$ 120,00",
  retiradaKit: null,
  informacoes: [
    "Kit do atleta: Camiseta oficial, número de peito e chip de cronometragem",
    "Hidratação durante o percurso",
    "Medalha de participação",
    "Certificado digital",
    "Seguro de acidentes pessoais"
  ],
  percursos: [
    {
      distancia: "5km",
      descricao: "Percurso plano ideal para iniciantes, passando pelos principais pontos do Parque Ibirapuera.",
      elevacao: "Mínima",
      tipo: "Asfalto"
    },
    {
      distancia: "10km",
      descricao: "Circuito urbano com passagem pela Av. Paulista e retorno ao parque.",
      elevacao: "Moderada",
      tipo: "Asfalto"
    },
    {
      distancia: "21km",
      descricao: "Meia maratona com tour pelos bairros históricos de São Paulo.",
      elevacao: "Moderada a alta",
      tipo: "Asfalto"
    },
    {
      distancia: "42km",
      descricao: "Maratona completa percorrendo os principais pontos turísticos da cidade.",
      elevacao: "Variada",
      tipo: "Asfalto"
    },
  ],
  regulamentoUrl: "/documentos/regulamento-maratona-sp-2025.pdf",
  documentos: [
    { nome: "Regulamento Oficial", url: "/documentos/regulamento-maratona-sp-2025.pdf", tipo: "PDF" },
    { nome: "Mapa do Percurso 42km", url: "/documentos/mapa-percurso-42km.pdf", tipo: "PDF" },
    { nome: "Mapa do Percurso 21km", url: "/documentos/mapa-percurso-21km.pdf", tipo: "PDF" },
    { nome: "Termo de Responsabilidade", url: "/documentos/termo-responsabilidade.pdf", tipo: "PDF" },
  ]
};

export default function EventoDetailPage() {
  const [, params] = useRoute("/evento/:slug");

  const formattedDate = new Date(mockEvent.data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const handleInscricao = () => {
    console.log('Inscrição iniciada para evento:', mockEvent.slug);
  };

  const handleDownload = (url: string, nome: string) => {
    console.log('Download documento:', nome, url);
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
            <div className="max-w-5xl mx-auto">
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

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data e Hora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-foreground">{formattedDate}</p>
              <p className="text-sm text-muted-foreground">Primeira largada: {mockEvent.horario}</p>
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
        </div>

        <Tabs defaultValue="sobre" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sobre" data-testid="tab-sobre">Sobre</TabsTrigger>
            <TabsTrigger value="percursos" data-testid="tab-percursos">Percursos</TabsTrigger>
            <TabsTrigger value="retirada" data-testid="tab-retirada">Retirada Kit</TabsTrigger>
            <TabsTrigger value="documentos" data-testid="tab-documentos">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="sobre" className="space-y-6">
            <Card>
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horários de Largada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockEvent.horariosLargada.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between p-4 border rounded-md hover-elevate">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <Badge variant="secondary">{item.distancia}</Badge>
                          <span className="font-semibold text-foreground text-lg">{item.horario}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.descricao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
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
          </TabsContent>

          <TabsContent value="percursos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Percursos Disponíveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockEvent.percursos.map((percurso, idx) => (
                    <div key={idx} className="p-4 border rounded-md space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-base">{percurso.distancia}</Badge>
                      </div>
                      <p className="text-muted-foreground">{percurso.descricao}</p>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Elevação</p>
                          <p className="text-sm font-medium text-foreground">{percurso.elevacao}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Tipo de Piso</p>
                          <p className="text-sm font-medium text-foreground">{percurso.tipo}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retirada" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Retirada de Kit
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mockEvent.retiradaKit ? (
                  <div className="text-muted-foreground">
                    {mockEvent.retiradaKit}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-medium mb-2">
                      Informações em breve
                    </p>
                    <p className="text-sm text-muted-foreground">
                      As informações sobre retirada de kit serão divulgadas em breve.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos do Evento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockEvent.documentos.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 border rounded-md hover-elevate transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{doc.nome}</p>
                          <p className="text-xs text-muted-foreground">{doc.tipo}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc.url, doc.nome)}
                        data-testid={`button-download-${idx}`}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  ))}
                </div>

                {mockEvent.regulamentoUrl && (
                  <div className="mt-6 pt-6 border-t">
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => handleDownload(mockEvent.regulamentoUrl!, "Regulamento Oficial")}
                      data-testid="button-regulamento"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Regulamento Completo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6">
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
