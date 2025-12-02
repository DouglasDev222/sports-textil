import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

interface Athlete {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  cidade: string;
  estado: string;
  dataNascimento: string;
  sexo: string;
}

interface AthleteAuthContextType {
  athlete: Athlete | null;
  isLoading: boolean;
  login: (cpf: string, dataNascimento: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

interface RegisterData {
  cpf: string;
  dataNascimento: string;
  nome: string;
  sexo: string;
  email: string;
  telefone: string;
  estado: string;
  cidade: string;
  escolaridade?: string;
  profissao?: string;
}

const AthleteAuthContext = createContext<AthleteAuthContextType | undefined>(undefined);

export function AthleteAuthProvider({ children }: { children: ReactNode }) {
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const response = await fetch("/api/athletes/me", {
        credentials: "include"
      });
      const data = await response.json();
      if (data.success) {
        setAthlete(data.data);
      } else {
        setAthlete(null);
      }
    } catch {
      setAthlete(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (cpf: string, dataNascimento: string) => {
    try {
      const response = await apiRequest("POST", "/api/athletes/login", { cpf, dataNascimento });
      const data = await response.json();
      
      if (data.success) {
        setAthlete(data.data);
        return { success: true };
      }
      return { success: false, error: data.error || "Erro ao fazer login" };
    } catch (error: any) {
      return { success: false, error: error.message || "Erro ao fazer login" };
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      const response = await apiRequest("POST", "/api/athletes/register", registerData);
      const data = await response.json();
      
      if (data.success) {
        setAthlete(data.data);
        return { success: true };
      }
      return { success: false, error: data.error || "Erro ao cadastrar" };
    } catch (error: any) {
      return { success: false, error: error.message || "Erro ao cadastrar" };
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/athletes/logout", {});
    } finally {
      setAthlete(null);
    }
  };

  return (
    <AthleteAuthContext.Provider value={{ athlete, isLoading, login, register, logout, refreshSession }}>
      {children}
    </AthleteAuthContext.Provider>
  );
}

export function useAthleteAuth() {
  const context = useContext(AthleteAuthContext);
  if (context === undefined) {
    throw new Error("useAthleteAuth must be used within an AthleteAuthProvider");
  }
  return context;
}
