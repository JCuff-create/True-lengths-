import { Stylist, WeekdayKey, WeeklyAvailability } from '../types';

export const WEEKDAYS: { key: WeekdayKey; label: string; shortLabel: string }[] = [
  { key: 'monday', label: 'Monday', shortLabel: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', shortLabel: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', shortLabel: 'Wed' },
  { key: 'thursday', label: 'Thursday', shortLabel: 'Thu' },
  { key: 'friday', label: 'Friday', shortLabel: 'Fri' },
  { key: 'saturday', label: 'Saturday', shortLabel: 'Sat' },
  { key: 'sunday', label: 'Sunday', shortLabel: 'Sun' },
];

export const DEFAULT_WEEKLY_AVAILABILITY: WeeklyAvailability = {
  sunday: { enabled: false, start: '09:00', end: '17:00' },
  monday: { enabled: true, start: '09:00', end: '17:00' },
  tuesday: { enabled: true, start: '09:00', end: '17:00' },
  wednesday: { enabled: true, start: '09:00', end: '17:00' },
  thursday: { enabled: true, start: '09:00', end: '17:00' },
  friday: { enabled: true, start: '09:00', end: '17:00' },
  saturday: { enabled: true, start: '09:00', end: '17:00' },
};

export function normalizeWeeklyAvailability(
  availability?: Partial<WeeklyAvailability>
): WeeklyAvailability {
  return WEEKDAYS.reduce((result, { key }) => {
    result[key] = {
      ...DEFAULT_WEEKLY_AVAILABILITY[key],
      ...(availability?.[key] || {}),
    };
    return result;
  }, {} as WeeklyAvailability);
}

export function weekdayKeyForDate(dateString: string): WeekdayKey {
  const date = new Date(`${dateString}T12:00:00`);
  return (
    ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as WeekdayKey[]
  )[date.getDay()];
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function formatWorkingTime(time: string): string {
  const totalMinutes = timeToMinutes(time);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function buildBookableTimes(
  stylist: Stylist | null,
  dateString: string,
  durationMinutes: number,
  intervalMinutes = 30
): string[] {
  if (!stylist || !dateString) return [];
  const hours = normalizeWeeklyAvailability(stylist.weeklyAvailability)[weekdayKeyForDate(dateString)];
  if (!hours.enabled) return [];

  const start = timeToMinutes(hours.start);
  const end = timeToMinutes(hours.end);
  if (start >= end) return [];

  const slots: string[] = [];
  for (let minute = start; minute + durationMinutes <= end; minute += intervalMinutes) {
    const hour = Math.floor(minute / 60);
    const mins = minute % 60;
    slots.push(formatWorkingTime(`${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`));
  }
  return slots;
}

export function isStylistWorkingOnDate(stylist: Stylist | null, dateString: string): boolean {
  if (!stylist || !dateString) return false;
  return normalizeWeeklyAvailability(stylist.weeklyAvailability)[weekdayKeyForDate(dateString)].enabled;
}
