import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
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
import { useToast } from "@/hooks/use-toast";
import { FileText, Users, Edit, Loader2 } from "lucide-react";
import { useAthleteAuth } from "@/contexts/AthleteAuthContext";

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

interface FormData {
  cpf: string;
  nome: string;
  dataNascimento: string;
  sexo: string;
  email: string;
  telefone: string;
  estado: string;
  cidade: string;
  escolaridade: string;
  profissao: string;
}

export default function MinhaContaPage() {
  const [, setLocation] = useLocation();
  const { athlete, isLoading, updateAthlete } = useAthleteAuth();
  const [formData, setFormData] = useState<FormData>({
    cpf: "",
    nome: "",
    dataNascimento: "",
    sexo: "",
    email: "",
    telefone: "",
    estado: "",
    cidade: "",
    escolaridade: "",
    profissao: ""
  });
  const [originalData, setOriginalData] = useState<FormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (athlete) {
      const athleteData: FormData = {
        cpf: athlete.cpf || "",
        nome: athlete.nome || "",
        dataNascimento: athlete.dataNascimento?.split("T")[0] || "",
        sexo: athlete.sexo || "",
        email: athlete.email || "",
        telefone: athlete.telefone || "",
        estado: athlete.estado || "",
        cidade: athlete.cidade || "",
        escolaridade: athlete.escolaridade || "",
        profissao: athlete.profissao || ""
      };
      setFormData(athleteData);
      setOriginalData(athleteData);
    }
  }, [athlete]);

  useEffect(() => {
    if (!isLoading && !athlete) {
      setLocation("/login");
    }
  }, [isLoading, athlete, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const result = await updateAthlete({
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        estado: formData.estado,
        cidade: formData.cidade,
        escolaridade: formData.escolaridade || undefined,
        profissao: formData.profissao || undefined,
        dataNascimento: formData.dataNascimento,
        sexo: formData.sexo
      });
      
      if (result.success) {
        toast({
          title: "Dados atualizados!",
          description: "Suas informações foram salvas com sucesso.",
        });
        setIsEditing(false);
        setOriginalData(formData);
      } else {
        toast({
          title: "Erro ao atualizar",
          description: result.error || "Não foi possível salvar suas informações.",
          variant: "destructive"
        });
      }
    } catch {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar suas informações.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    if (originalData) {
      setFormData(originalData);
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!athlete) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Minha Conta
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas informações e participantes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Button
            variant="outline"
            className="justify-start gap-2 h-auto py-4"
            onClick={() => setLocation("/minhas-inscricoes")}
            data-testid="button-nav-inscricoes"
          >
            <FileText className="w-5 h-5" />
            <div className="text-left">
              <div className="font-semibold">Minhas Inscrições</div>
              <div className="text-xs text-muted-foreground">
                Veja todos os eventos que você se inscreveu
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="justify-start gap-2 h-auto py-4"
            onClick={() => setLocation("/participantes")}
            data-testid="button-nav-participantes"
          >
            <Users className="w-5 h-5" />
            <div className="text-left">
              <div className="font-semibold">Participantes</div>
              <div className="text-xs text-muted-foreground">
                Gerencie os participantes da sua conta
              </div>
            </div>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Dados Pessoais</CardTitle>
                <CardDescription>
                  {isEditing 
                    ? "Atualize suas informações pessoais" 
                    : "Suas informações pessoais"}
                </CardDescription>
              </div>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  data-testid="button-edit"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">Nome Completo</Label>
                    <p className="text-foreground font-medium" data-testid="text-nome">
                      {formData.nome}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">CPF</Label>
                    <p className="text-foreground font-medium" data-testid="text-cpf">
                      {formData.cpf}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">E-mail</Label>
                    <p className="text-foreground font-medium" data-testid="text-email">
                      {formData.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Telefone</Label>
                    <p className="text-foreground font-medium" data-testid="text-telefone">
                      {formData.telefone}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">Cidade/Estado</Label>
                    <p className="text-foreground font-medium" data-testid="text-localizacao">
                      {formData.cidade} - {formData.estado}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Profissão</Label>
                    <p className="text-foreground font-medium" data-testid="text-profissao">
                      {formData.profissao || "-"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                    Informações Básicas
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      type="text"
                      value={formData.cpf}
                      disabled
                      className="bg-muted"
                      data-testid="input-cpf"
                    />
                    <p className="text-xs text-muted-foreground">
                      O CPF não pode ser alterado
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      type="text"
                      value={formData.nome}
                      onChange={(e) => handleChange("nome", e.target.value)}
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
                        value={formData.dataNascimento}
                        onChange={(e) => handleChange("dataNascimento", e.target.value)}
                        required
                        data-testid="input-data-nascimento"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sexo">Sexo</Label>
                      <Select
                        value={formData.sexo}
                        onValueChange={(value) => handleChange("sexo", value)}
                      >
                        <SelectTrigger id="sexo" data-testid="select-sexo">
                          <SelectValue />
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
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      required
                      data-testid="input-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      type="tel"
                      value={formData.telefone}
                      onChange={(e) => handleChange("telefone", e.target.value)}
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
                      <Select
                        value={formData.estado}
                        onValueChange={(value) => handleChange("estado", value)}
                      >
                        <SelectTrigger id="estado" data-testid="select-estado">
                          <SelectValue />
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
                        value={formData.cidade}
                        onChange={(e) => handleChange("cidade", e.target.value)}
                        required
                        data-testid="input-cidade"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                    Informações Profissionais
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="escolaridade">Escolaridade</Label>
                    <Select
                      value={formData.escolaridade}
                      onValueChange={(value) => handleChange("escolaridade", value)}
                    >
                      <SelectTrigger id="escolaridade" data-testid="select-escolaridade">
                        <SelectValue placeholder="Selecione..." />
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
                    <Label htmlFor="profissao">Profissão</Label>
                    <Input
                      id="profissao"
                      type="text"
                      value={formData.profissao}
                      onChange={(e) => handleChange("profissao", e.target.value)}
                      data-testid="input-profissao"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSaving}
                    data-testid="button-save"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Alterações"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
