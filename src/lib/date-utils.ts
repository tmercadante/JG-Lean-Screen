import { startOfWeek, format, subWeeks, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear, isValid, parseISO } from 'date-fns';

/**
 * Get the Sunday-based week start for a given date in user's timezone
 */
export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 0 }); // 0 = Sunday
}

/**
 * Get the current week start (Sunday) in user's timezone
 */
export function getCurrentWeekStart(): Date {
  return getWeekStart(new Date());
}

/**
 * Get allowed weeks for submission (current week and 2 previous weeks)
 */
export function getAllowedWeeks(): Date[] {
  const currentWeek = getCurrentWeekStart();
  return [
    currentWeek,
    subWeeks(currentWeek, 1),
    subWeeks(currentWeek, 2)
  ];
}

/**
 * Format date as YYYY-MM-DD for database storage
 */
export function formatDateForDB(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse date from YYYY-MM-DD format
 */
export function parseDateFromDB(dateString: string): Date {
  const date = parseISO(dateString);
  if (!isValid(date)) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return date;
}

/**
 * Check if a week is within the allowed submission window
 */
export function isWeekAllowed(weekStart: Date): boolean {
  const allowedWeeks = getAllowedWeeks();
  const weekStartTime = weekStart.getTime();
  return allowedWeeks.some(allowedWeek => allowedWeek.getTime() === weekStartTime);
}

/**
 * Get period range based on scope
 */
export function getPeriodRange(scope: 'week' | 'month' | 'year', reference: string): { start: Date; end: Date } {
  let referenceDate: Date;
  
  if (scope === 'week') {
    referenceDate = parseDateFromDB(reference);
    return {
      start: getWeekStart(referenceDate),
      end: endOfWeek(referenceDate, { weekStartsOn: 0 })
    };
  } else if (scope === 'month') {
    const [year, month] = reference.split('-').map(Number);
    referenceDate = new Date(year, month - 1, 1);
    return {
      start: startOfMonth(referenceDate),
      end: endOfMonth(referenceDate)
    };
  } else {
    const year = parseInt(reference);
    referenceDate = new Date(year, 0, 1);
    return {
      start: startOfYear(referenceDate),
      end: endOfYear(referenceDate)
    };
  }
}

/**
 * Format date for display
 */
export function formatWeekForDisplay(weekStart: Date): string {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
  return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
}

/**
 * Get current period reference string
 */
export function getCurrentPeriodReference(scope: 'week' | 'month' | 'year'): string {
  const now = new Date();
  
  if (scope === 'week') {
    return formatDateForDB(getWeekStart(now));
  } else if (scope === 'month') {
    return format(now, 'yyyy-MM');
  } else {
    return format(now, 'yyyy');
  }
}