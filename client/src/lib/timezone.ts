import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { parseISO, isValid, format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

export function formatDateTimeBrazil(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (!isValid(date)) return '';
  
  return formatInTimeZone(date, BRAZIL_TIMEZONE, 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

export function formatDateBrazil(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (!isValid(date)) return '';
  
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
}

export function formatDateOnlyBrazil(dateString: string | null | undefined): string {
  if (!dateString) return '';
  
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);
  
  if (!year || !month || !day) return '';
  
  const date = new Date(year, month - 1, day);
  if (!isValid(date)) return '';
  
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
}

export function formatDateOnlyLong(dateString: string | null | undefined): string {
  if (!dateString) return '';
  
  const dateOnly = dateString.split('T')[0];
  const [year, month, day] = dateOnly.split('-').map(Number);
  
  if (!year || !month || !day) return '';
  
  const date = new Date(year, month - 1, day);
  if (!isValid(date)) return '';
  
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatTimeBrazil(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (!isValid(date)) return '';
  
  return formatInTimeZone(date, BRAZIL_TIMEZONE, 'HH:mm', { locale: ptBR });
}

export function formatForInput(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (!isValid(date)) return '';
  
  return formatInTimeZone(date, BRAZIL_TIMEZONE, "yyyy-MM-dd'T'HH:mm");
}

export function isEventOpen(
  aberturaInscricoes: string | Date | null | undefined,
  encerramentoInscricoes: string | Date | null | undefined
): boolean {
  if (!aberturaInscricoes || !encerramentoInscricoes) return false;
  
  const now = new Date();
  const abertura = typeof aberturaInscricoes === 'string' ? new Date(aberturaInscricoes) : aberturaInscricoes;
  const encerramento = typeof encerramentoInscricoes === 'string' ? new Date(encerramentoInscricoes) : encerramentoInscricoes;
  
  return now >= abertura && now <= encerramento;
}

export function getEventStatus(
  aberturaInscricoes: string | Date | null | undefined,
  encerramentoInscricoes: string | Date | null | undefined
): 'upcoming' | 'open' | 'closed' {
  if (!aberturaInscricoes || !encerramentoInscricoes) return 'closed';
  
  const now = new Date();
  const abertura = typeof aberturaInscricoes === 'string' ? new Date(aberturaInscricoes) : aberturaInscricoes;
  const encerramento = typeof encerramentoInscricoes === 'string' ? new Date(encerramentoInscricoes) : encerramentoInscricoes;
  
  if (now < abertura) return 'upcoming';
  if (now > encerramento) return 'closed';
  return 'open';
}

export function getStatusLabel(status: 'upcoming' | 'open' | 'closed'): string {
  switch (status) {
    case 'upcoming': return 'Em breve';
    case 'open': return 'Inscricoes abertas';
    case 'closed': return 'Inscricoes encerradas';
  }
}

export function formatRelativeDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (!isValid(date)) return '';
  
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diff < 0) {
    return 'Encerrado';
  }
  
  if (days > 0) {
    return `${days} dia${days > 1 ? 's' : ''}`;
  }
  
  if (hours > 0) {
    return `${hours} hora${hours > 1 ? 's' : ''}`;
  }
  
  return 'Menos de 1 hora';
}
