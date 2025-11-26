import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, ShieldCheck, AlertCircle } from "lucide-react";
import Header from "@/components/Header";

const mockCategorias = [
  { nome: "5km", valor: "R$ 80,00", valorNumerico: 80, taxaComodidade: 5 },
  { nome: "10km", valor: "R$ 100,00", valorNumerico: 100, taxaComodidade: 7.50 },
  { 
    nome: "5km - Servidores Públicos", 
    valor: "R$ 50,00",
    valorNumerico: 50,
    taxaComodidade: 3,
    requerComprovacao: true,
    tipoComprovacao: "codigo",
    mensagemComprovacao: "Esta modalidade é exclusiva para servidores públicos. Insira o código de confirmação fornecido pelo seu órgão."
  },
  { nome: "21km", valor: "R$ 150,00", valorNumerico: 150, taxaComodidade: 10 },
  { nome: "42km", valor: "R$ 200,00", valorNumerico: 200, taxaComodidade: 15 },
  { 
    nome: "PCD (Pessoa com Deficiência)", 
    valor: "R$ 40,00",
    valorNumerico: 40,
    taxaComodidade: 0,
    requerComprovacao: true,
    tipoComprovacao: "pre_aprovacao",
    mensagemComprovacao: "Sua inscrição passará por análise prévia. Você receberá a confirmação por email em até 48 horas."
  },
];

const tamanhosCamisa = ["PP", "P", "M", "G", "GG", "XGG"];

export default function InscricaoModalidadePage() {
  const [, params] = useRoute("/evento/:slug/inscricao/modalidade");
  const [, setLocation] = useLocation();
  const [modalidadeSelecionada, setModalidadeSelecionada] = useState("");
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState("");
  const [codigoComprovacao, setCodigoComprovacao] = useState("");

  const handleVoltar = () => {
    setLocation(`/evento/${params?.slug}/inscricao/participante`);
  };

  const handleContinuar = () => {
    if (modalidadeSelecionada && tamanhoSelecionado) {
      const categoriaAtual = mockCategorias.find(c => c.nome === modalidadeSelecionada);
      
      if (categoriaAtual?.requerComprovacao && categoriaAtual.tipoComprovacao === "codigo" && !codigoComprovacao) {
        return;
      }
      
      const taxaComodidade = categoriaAtual?.taxaComodidade ?? 0;
      const valorModalidade = categoriaAtual?.valorNumerico ?? 0;
      
      let url = `/evento/${params?.slug}/inscricao/resumo?modalidade=${encodeURIComponent(modalidadeSelecionada)}&tamanho=${tamanhoSelecionado}&valor=${valorModalidade}&taxaComodidade=${taxaComodidade}`;
      if (codigoComprovacao) {
        url += `&codigo=${encodeURIComponent(codigoComprovacao)}`;
      }
      
      setLocation(url);
    }
  };

  const categoriaAtual = mockCategorias.find(c => c.nome === modalidadeSelecionada);
  const modalidadeValor = categoriaAtual?.valor;
  const taxaComodidadeValor = categoriaAtual?.taxaComodidade ?? 0;
  const valorTotal = (categoriaAtual?.valorNumerico ?? 0) + taxaComodidadeValor;
  
  const podeAvancar = modalidadeSelecionada && tamanhoSelecionado && 
    (!categoriaAtual?.requerComprovacao || 
     categoriaAtual.tipoComprovacao === "pre_aprovacao" || 
     codigoComprovacao.trim() !== "");

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        <Button
          variant="ghost"
          onClick={handleVoltar}
          className="mb-6"
          data-testid="button-voltar"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Escolha a Modalidade
          </h1>
          <p className="text-muted-foreground">
            Selecione a distância e o tamanho da sua camisa
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Modalidade</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={modalidadeSelecionada} onValueChange={setModalidadeSelecionada}>
                <div className="space-y-2">
                  {mockCategorias.map((categoria, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-4 border rounded-md transition-all ${
                        modalidadeSelecionada === categoria.nome 
                          ? 'border-primary bg-primary/5' 
                          : 'hover-elevate'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <RadioGroupItem 
                          value={categoria.nome} 
                          id={`modalidade-${idx}`}
                          data-testid={`radio-modalidade-${idx}`}
                        />
                        <Label htmlFor={`modalidade-${idx}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between gap-4">
                            <span className="font-medium text-foreground">{categoria.nome}</span>
                            <Badge variant="secondary" className="font-semibold">
                              {categoria.valor}
                            </Badge>
                          </div>
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {categoriaAtual?.requerComprovacao && (
            <Alert className="border-primary/50 bg-primary/5">
              <div className="flex gap-2">
                {categoriaAtual.tipoComprovacao === "codigo" ? (
                  <ShieldCheck className="h-5 w-5 text-primary" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-primary" />
                )}
                <div className="flex-1">
                  <AlertDescription className="text-sm">
                    {categoriaAtual.mensagemComprovacao}
                  </AlertDescription>
                  
                  {categoriaAtual.tipoComprovacao === "codigo" && (
                    <div className="mt-3">
                      <Label htmlFor="codigo-comprovacao" className="text-sm font-medium mb-2 block">
                        Código de Confirmação
                      </Label>
                      <Input
                        id="codigo-comprovacao"
                        placeholder="Ex: SERV2025-ABC123"
                        value={codigoComprovacao}
                        onChange={(e) => setCodigoComprovacao(e.target.value)}
                        className="max-w-xs"
                        data-testid="input-codigo-comprovacao"
                      />
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tamanho da Camisa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {tamanhosCamisa.map((tamanho, idx) => (
                  <Button
                    key={idx}
                    variant={tamanhoSelecionado === tamanho ? "default" : "outline"}
                    onClick={() => setTamanhoSelecionado(tamanho)}
                    className="font-semibold"
                    data-testid={`button-tamanho-${tamanho}`}
                  >
                    {tamanho}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              {modalidadeSelecionada ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {modalidadeValor} + Taxa R$ {taxaComodidadeValor.toFixed(2)}
                  </p>
                  <p className="text-lg md:text-xl font-bold text-foreground">
                    Total: R$ {valorTotal.toFixed(2)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg md:text-xl font-bold text-foreground">
                    Selecione uma modalidade
                  </p>
                </>
              )}
            </div>
            <Button
              size="lg"
              onClick={handleContinuar}
              disabled={!podeAvancar}
              className="font-semibold"
              data-testid="button-continuar"
            >
              Continuar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
