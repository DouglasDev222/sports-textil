import { fromZonedTime, toZonedTime, format, formatInTimeZone } from 'date-fns-tz';
import { parseISO, isValid } from 'date-fns';

export const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

export function localToBrazilUTC(localDateTimeString: string): Date {
  if (!localDateTimeString || typeof localDateTimeString !== 'string') {
    throw new Error('Data e obrigatoria e deve ser uma string');
  }
  
  const trimmed = localDateTimeString.trim();
  
  if (trimmed.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }
  
  const parsed = parseISO(trimmed);
  if (isValid(parsed)) {
    return fromZonedTime(parsed, BRAZIL_TIMEZONE);
  }
  
  const directDate = new Date(trimmed);
  if (isValid(directDate)) {
    return fromZonedTime(directDate, BRAZIL_TIMEZONE);
  }
  
  throw new Error(`Data invalida: ${localDateTimeString}`);
}

export function localToBrazilUTCOptional(localDateTimeString: string | null | undefined): Date | null {
  if (!localDateTimeString) return null;
  return localToBrazilUTC(localDateTimeString);
}

export function utcToBrazilLocal(utcDate: Date | string | null | undefined): string {
  if (!utcDate) return '';
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  if (!isValid(date)) return '';
  const zonedDate = toZonedTime(date, BRAZIL_TIMEZONE);
  return format(zonedDate, "yyyy-MM-dd'T'HH:mm", { timeZone: BRAZIL_TIMEZONE });
}

export function formatBrazilDateTime(utcDate: Date | string | null | undefined): string {
  if (!utcDate) return '';
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  if (!isValid(date)) return '';
  const zonedDate = toZonedTime(date, BRAZIL_TIMEZONE);
  return format(zonedDate, 'dd/MM/yyyy HH:mm', { timeZone: BRAZIL_TIMEZONE });
}

export function formatBrazilDate(dateValue: Date | string | null | undefined): string {
  if (!dateValue) return '';
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  if (!isValid(date)) return '';
  return format(date, 'dd/MM/yyyy');
}

export function nowInBrazil(): Date {
  return toZonedTime(new Date(), BRAZIL_TIMEZONE);
}

export function nowInUTC(): Date {
  return new Date();
}

export function isDateInPast(utcDate: Date | string | null | undefined): boolean {
  if (!utcDate) return false;
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return date < new Date();
}

export function isDateInFuture(utcDate: Date | string | null | undefined): boolean {
  if (!utcDate) return false;
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return date > new Date();
}

export function convertInputDatesToUTC<T extends Record<string, unknown>>(
  data: T,
  dateFields: (keyof T)[]
): T {
  const result = { ...data };
  
  for (const field of dateFields) {
    const value = data[field];
    if (value && typeof value === 'string') {
      const converted = localToBrazilUTC(value);
      (result as Record<string, unknown>)[field as string] = converted;
    }
  }
  
  return result;
}

export function convertOutputDatesToLocal<T extends Record<string, unknown>>(
  data: T,
  dateFields: (keyof T)[]
): T {
  const result = { ...data };
  
  for (const field of dateFields) {
    const value = data[field];
    if (value instanceof Date) {
      (result as Record<string, unknown>)[field as string] = utcToBrazilLocal(value);
    } else if (typeof value === 'string' && (value.includes('T') || value.includes('Z'))) {
      (result as Record<string, unknown>)[field as string] = utcToBrazilLocal(new Date(value));
    }
  }
  
  return result;
}

export const EVENT_DATE_FIELDS = ['aberturaInscricoes', 'encerramentoInscricoes'] as const;
export const BATCH_DATE_FIELDS = ['dataInicio', 'dataTermino'] as const;
export const ORDER_DATE_FIELDS = ['dataPagamento', 'dataExpiracao'] as const;
