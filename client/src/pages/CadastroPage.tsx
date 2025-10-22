import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

const estadosBrasil = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const escolaridades = [
  "Ensino Fundamental",
  "Ensino Médio",
  "Ensino Superior",
  "Pós-graduação",
  "Mestrado",
  "Doutorado"
];

export default function CadastroPage() {
  const [cpf, setCpf] = useState("");
  const { toast } = useToast();

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2');
    }
    return cpf;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Cadastro submitted');
    toast({
      title: "Cadastro realizado!",
      description: "Sua conta foi criada com sucesso.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Cadastro de Atleta</CardTitle>
            <CardDescription>
              Preencha o formulário abaixo para criar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                  Dados Pessoais
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="cpf">
                    CPF <span className="text-accent">*</span>
                  </Label>
                  <Input
                    id="cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={handleCPFChange}
                    maxLength={14}
                    required
                    data-testid="input-cpf"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Seu nome completo"
                    required
                    data-testid="input-nome"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                    <Input
                      id="dataNascimento"
                      type="date"
                      required
                      data-testid="input-data-nascimento"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sexo">
                      Sexo <span className="text-accent">*</span>
                    </Label>
                    <Select required>
                      <SelectTrigger id="sexo" data-testid="select-sexo">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="masculino">Masculino</SelectItem>
                        <SelectItem value="feminino">Feminino</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                  Contato
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    required
                    data-testid="input-telefone"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                  Endereço
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select required>
                      <SelectTrigger id="estado" data-testid="select-estado">
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {estadosBrasil.map((estado) => (
                          <SelectItem key={estado} value={estado}>
                            {estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      type="text"
                      placeholder="Sua cidade"
                      required
                      data-testid="input-cidade"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                  Informações Adicionais
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="escolaridade">
                    Escolaridade <span className="text-accent">*</span>
                  </Label>
                  <Select required>
                    <SelectTrigger id="escolaridade" data-testid="select-escolaridade">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {escolaridades.map((esc) => (
                        <SelectItem key={esc} value={esc}>
                          {esc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profissao">
                    Profissão <span className="text-accent">*</span>
                  </Label>
                  <Input
                    id="profissao"
                    type="text"
                    placeholder="Sua profissão"
                    required
                    data-testid="input-profissao"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  type="submit"
                  variant="secondary"
                  className="flex-1"
                  data-testid="button-submit"
                >
                  Completar Cadastro
                </Button>
                <Link href="/login">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    data-testid="button-back-login"
                  >
                    Voltar ao Login
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
