import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus } from "lucide-react";
import Header from "@/components/Header";

export default function LoginPage() {
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
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
    console.log('Login attempt:', { cpf, dataNascimento });
    toast({
      title: "Login realizado!",
      description: "Você será redirecionado em instantes.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Coluna da esquerda - Informações */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Acesse sua Conta
              </h1>
              <p className="text-lg text-muted-foreground">
                Entre para gerenciar suas inscrições, acompanhar eventos e manter seus dados atualizados.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <LogIn className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Acesso Rápido</h3>
                  <p className="text-sm text-muted-foreground">
                    Use seu CPF e data de nascimento para entrar de forma segura
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Primeira Vez?</h3>
                  <p className="text-sm text-muted-foreground">
                    Crie sua conta em minutos e comece a se inscrever em eventos
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna da direita - Formulário de Login */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Entrar</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="cpf" className="text-sm font-medium">
                      CPF
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
                    <Label htmlFor="dataNascimento" className="text-sm font-medium">
                      Data de Nascimento
                    </Label>
                    <Input
                      id="dataNascimento"
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      required
                      data-testid="input-data-nascimento"
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full font-semibold"
                    data-testid="button-login"
                  >
                    Entrar
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Não tem conta?
                      </span>
                    </div>
                  </div>

                  <Link href="/cadastro" data-testid="link-cadastro">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="w-full font-semibold"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Criar Conta
                    </Button>
                  </Link>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
