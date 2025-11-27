import { fromZonedTime, toZonedTime, format } from 'date-fns-tz';

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

export function localToBrazilUTC(localDateTimeString: string): Date {
  if (!localDateTimeString) return new Date();
  return fromZonedTime(localDateTimeString, BRAZIL_TIMEZONE);
}

export function utcToBrazilLocal(utcDate: Date | string | null | undefined): string {
  if (!utcDate) return '';
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const zonedDate = toZonedTime(date, BRAZIL_TIMEZONE);
  return format(zonedDate, "yyyy-MM-dd'T'HH:mm", { timeZone: BRAZIL_TIMEZONE });
}

export function formatBrazilDateTime(utcDate: Date | string | null | undefined): string {
  if (!utcDate) return '';
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const zonedDate = toZonedTime(date, BRAZIL_TIMEZONE);
  return format(zonedDate, 'dd/MM/yyyy HH:mm', { timeZone: BRAZIL_TIMEZONE });
}

export function formatBrazilDate(dateValue: Date | string | null | undefined): string {
  if (!dateValue) return '';
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  return format(date, 'dd/MM/yyyy');
}

export { BRAZIL_TIMEZONE };
