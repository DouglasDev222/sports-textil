import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Award, 
  User, 
  Shirt, 
  FileText,
  Download,
  CheckCircle2,
  QrCode,
  Clock,
  Tag,
  Users,
  Hash,
  Package
} from "lucide-react";
import cityImage from '@assets/generated_images/City_marathon_aerial_view_94ce50b6.png';

const mockInscricao = {
  id: "1",
  numeroInscricao: 12345,
  codigoComprovacao: "MAR2025-A1B2C3",
  status: "confirmada",
  dataInscricao: "2025-03-15",
  valorPago: "150.00",
  valorOriginal: "150.00",
  cupomDesconto: null,
  pedido: {
    id: "p1",
    numeroPedido: 98765,
    totalInscricoes: 2,
  },
  participante: {
    nome: "João Silva",
    cpf: "123.456.789-00",
    email: "joao.silva@email.com",
    telefone: "(11) 98765-4321",
    dataNascimento: "15/03/1990"
  },
  evento: {
    nome: "Maratona de São Paulo 2025",
    slug: "maratona-sao-paulo-2025",
    data: "2025-05-15",
    horarioLargada: "06:15",
    local: "Parque Ibirapuera",
    cidade: "São Paulo",
    estado: "SP",
    imagemUrl: cityImage,
    retiradaKit: "14 e 15 de maio de 2025, das 10h às 20h no Shopping Ibirapuera"
  },
  modalidade: "21km",
  tamanhoCamisa: "M",
  equipe: "Assessoria RunFast",
};

export default function InscricaoDetailPage() {
  const [, params] = useRoute("/inscricao/:id");
  const [, setLocation] = useLocation();

  const formattedEventDate = new Date(mockInscricao.evento.data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const formattedInscricaoDate = new Date(mockInscricao.dataInscricao).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const handleVoltar = () => {
    setLocation("/minhas-inscricoes");
  };

  const handleDownloadComprovante = () => {
    console.log("Download comprovante:", mockInscricao.id);
  };

  const handleVerEvento = () => {
    setLocation(`/evento/${mockInscricao.evento.slug}`);
  };

  const statusConfig = {
    confirmada: {
      variant: "default" as const,
      label: "Confirmada",
      icon: CheckCircle2,
      description: "Sua inscrição está confirmada! Você receberá um e-mail com mais informações sobre a retirada do kit."
    },
    pendente: {
      variant: "secondary" as const,
      label: "Aguardando Pagamento",
      icon: Clock,
      description: "Estamos aguardando a confirmação do pagamento. Isso pode levar até 48 horas."
    }
  };

  const currentStatus = statusConfig[mockInscricao.status as keyof typeof statusConfig];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary/75 z-10"></div>
        <img
          src={mockInscricao.evento.imagemUrl}
          alt={mockInscricao.evento.nome}
          className="w-full h-[200px] md:h-[300px] object-cover"
        />
        <div className="absolute inset-0 z-20 flex items-end">
          <div className="w-full px-4 md:px-6 pb-6 md:pb-8">
            <div className="max-w-5xl mx-auto">
              <Button 
                variant="ghost" 
                onClick={handleVoltar}
                className="mb-4 text-white hover:bg-white/20"
                data-testid="button-voltar"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div className="flex items-center gap-3 mb-2 text-white/80 flex-wrap">
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  <span className="text-sm font-medium">Pedido #{mockInscricao.pedido.numeroPedido}</span>
                </div>
                <span className="text-white/50">|</span>
                <div className="flex items-center gap-1">
                  <Hash className="h-4 w-4" />
                  <span className="text-sm font-medium">Inscrição #{mockInscricao.numeroInscricao}</span>
                </div>
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
                {mockInscricao.evento.nome}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-sm">
                  {mockInscricao.modalidade}
                </Badge>
                <Badge variant={currentStatus.variant} className="text-sm">
                  {currentStatus.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <StatusIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Status da Inscrição</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {currentStatus.description}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Informações do Evento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Data</p>
                  <p className="font-semibold text-foreground">{formattedEventDate}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Horário da Largada</p>
                  <p className="font-semibold text-foreground">{mockInscricao.evento.horarioLargada}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Local</p>
                  <p className="font-semibold text-foreground">{mockInscricao.evento.local}</p>
                  <p className="text-sm text-muted-foreground">
                    {mockInscricao.evento.cidade}, {mockInscricao.evento.estado}
                  </p>
                </div>
                {mockInscricao.evento.retiradaKit && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Retirada do Kit</p>
                      <p className="text-sm text-foreground">{mockInscricao.evento.retiradaKit}</p>
                    </div>
                  </>
                )}
                <Separator />
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleVerEvento}
                  data-testid="button-ver-evento"
                >
                  Ver Página do Evento
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Participante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Nome</p>
                  <p className="font-semibold text-foreground">{mockInscricao.participante.nome}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">CPF</p>
                    <p className="text-sm text-foreground">{mockInscricao.participante.cpf}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Data de Nascimento</p>
                    <p className="text-sm text-foreground">{mockInscricao.participante.dataNascimento}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">E-mail</p>
                    <p className="text-sm text-foreground">{mockInscricao.participante.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Telefone</p>
                    <p className="text-sm text-foreground">{mockInscricao.participante.telefone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Detalhes da Inscrição
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Número da Inscrição</p>
                  <p className="font-mono text-2xl font-bold text-primary flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    {mockInscricao.numeroInscricao}
                  </p>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Modalidade</p>
                    <p className="font-semibold text-foreground">{mockInscricao.modalidade}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tamanho da Camisa</p>
                    <p className="font-semibold text-foreground">{mockInscricao.tamanhoCamisa}</p>
                  </div>
                </div>
                {mockInscricao.equipe && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Equipe</p>
                      <p className="font-semibold text-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {mockInscricao.equipe}
                      </p>
                    </div>
                  </>
                )}
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Data da Inscrição</p>
                  <p className="text-sm text-foreground">{formattedInscricaoDate}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Código de Confirmação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center p-6 bg-muted rounded-md">
                  <div className="text-center">
                    <QrCode className="h-24 w-24 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      QR Code para retirada do kit
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Código</p>
                  <p className="font-mono font-bold text-lg text-foreground">
                    {mockInscricao.codigoComprovacao}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleDownloadComprovante}
                  data-testid="button-download-comprovante"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Comprovante
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Valor da Inscrição</span>
                  <span className="font-medium text-foreground">
                    R$ {parseFloat(mockInscricao.valorOriginal).toFixed(2)}
                  </span>
                </div>
                {mockInscricao.cupomDesconto && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-primary flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Desconto
                    </span>
                    <span className="font-medium text-primary">
                      - R$ {(parseFloat(mockInscricao.valorOriginal) - parseFloat(mockInscricao.valorPago)).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className="font-semibold text-foreground">Total Pago</span>
                  <span className="text-xl font-bold text-primary">
                    R$ {parseFloat(mockInscricao.valorPago).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
