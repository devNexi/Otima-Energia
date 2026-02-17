const TIMEZONE = process.env.TIMEZONE || 'America/Sao_Paulo';

function parseHourMinute(value: string | undefined, defaultHour: number): { hour: number; minute: number } {
  if (!value) return { hour: defaultHour, minute: 0 };
  const parts = value.split(':');
  return { hour: parseInt(parts[0], 10) || defaultHour, minute: parseInt(parts[1], 10) || 0 };
}

const BH_START = parseHourMinute(process.env.BUSINESS_HOURS_START, 9);
const BH_END = parseHourMinute(process.env.BUSINESS_HOURS_END, 18);
const BUSINESS_HOURS_START_MINUTES = BH_START.hour * 60 + BH_START.minute;
const BUSINESS_HOURS_END_MINUTES = BH_END.hour * 60 + BH_END.minute;
const DEFAULT_CALLBACK_DELAY_MINUTES = parseInt(process.env.DEFAULT_CALLBACK_DELAY_MINUTES || '30', 10);

function toSaoPaulo(date: Date): { year: number; month: number; day: number; hour: number; minute: number; dayOfWeek: number } {
  const str = date.toLocaleString('en-US', { timeZone: TIMEZONE });
  const parsed = new Date(str);
  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth(),
    day: parsed.getDate(),
    hour: parsed.getHours(),
    minute: parsed.getMinutes(),
    dayOfWeek: parsed.getDay(),
  };
}

function buildDateInTimezone(year: number, month: number, day: number, hour: number, minute: number): Date {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });

  const testDate = new Date(dateStr + 'Z');
  const parts = formatter.formatToParts(testDate);
  const getPart = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
  const currentHourInTZ = getPart('hour');
  const offsetMs = (currentHourInTZ - hour) * 3600000;
  return new Date(testDate.getTime() - offsetMs);
}

export function computeNextCallbackDateTime(intakeTime: Date = new Date()): Date {
  const sp = toSaoPaulo(intakeTime);
  const { dayOfWeek } = sp;
  let { year, month, day, hour, minute } = sp;

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const currentMinutes = hour * 60 + minute;
  const cutoffMinutes = BUSINESS_HOURS_END_MINUTES - DEFAULT_CALLBACK_DELAY_MINUTES;

  if (isWeekend) {
    const daysToMonday = dayOfWeek === 0 ? 1 : 2;
    const nextMonday = new Date(intakeTime.getTime() + daysToMonday * 86400000);
    const spMon = toSaoPaulo(nextMonday);
    return buildDateInTimezone(spMon.year, spMon.month, spMon.day, BH_START.hour, BH_START.minute);
  }

  if (currentMinutes < BUSINESS_HOURS_START_MINUTES) {
    return buildDateInTimezone(year, month, day, BH_START.hour, BH_START.minute);
  }

  if (currentMinutes >= BUSINESS_HOURS_START_MINUTES && currentMinutes <= cutoffMinutes) {
    const callbackMinutes = currentMinutes + DEFAULT_CALLBACK_DELAY_MINUTES;
    const callbackHour = Math.floor(callbackMinutes / 60);
    const callbackMin = callbackMinutes % 60;
    return buildDateInTimezone(year, month, day, callbackHour, callbackMin);
  }

  const tomorrow = new Date(intakeTime.getTime() + 86400000);
  const spTomorrow = toSaoPaulo(tomorrow);
  if (spTomorrow.dayOfWeek === 0) {
    const nextMon = new Date(intakeTime.getTime() + 2 * 86400000);
    const spMon = toSaoPaulo(nextMon);
    return buildDateInTimezone(spMon.year, spMon.month, spMon.day, BH_START.hour, BH_START.minute);
  }
  if (spTomorrow.dayOfWeek === 6) {
    const nextMon = new Date(intakeTime.getTime() + 3 * 86400000);
    const spMon = toSaoPaulo(nextMon);
    return buildDateInTimezone(spMon.year, spMon.month, spMon.day, BH_START.hour, BH_START.minute);
  }
  return buildDateInTimezone(spTomorrow.year, spTomorrow.month, spTomorrow.day, BH_START.hour, BH_START.minute);
}

export function formatDateForZoho(date: Date): string {
  return date.toLocaleString('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatDateSaoPaulo(date: Date): string {
  return date.toLocaleString('pt-BR', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
