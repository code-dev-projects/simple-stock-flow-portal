/**
 * No decorators, no Angular: this folder is plain TypeScript and must be able to run in a
 * Node test without TestBed.
 *
 * D-C2 of the API contract fixes the range as `from <= sold_at < to`. The upper bound a person
 * picks on screen is the last day they want to see, so it has to travel as the first instant of
 * the following day; sending that day itself drops every sale made during it.
 */

const CALENDAR_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface DayRange {
  readonly from: Date;
  readonly to: Date;
}

export function startOfDay(day: string): Date {
  const [year, month, dayOfMonth] = parseDay(day);
  return new Date(Date.UTC(year, month - 1, dayOfMonth));
}

export function endOfDayExclusive(day: string): Date {
  const [year, month, dayOfMonth] = parseDay(day);
  // Date.UTC normalizes the overflow, so the 31st of January lands on the 1st of February.
  return new Date(Date.UTC(year, month - 1, dayOfMonth + 1));
}

export function dayRange(fromDay: string, toDay: string): DayRange {
  return { from: startOfDay(fromDay), to: endOfDayExclusive(toDay) };
}

/**
 * The last instant that belongs to the range. What travels to the API is exclusive, so showing
 * it back as it arrived would name a day whose sales the report never counted.
 */
export function inclusiveEnd(to: Date): Date {
  return new Date(to.getTime() - 1);
}

/**
 * The current month up to and including today. Everything is read in UTC so that the same
 * instant is asked for whatever timezone the browser sits in.
 */
export function monthToDate(now: Date): DayRange {
  return {
    from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    to: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)),
  };
}

function parseDay(day: string): [number, number, number] {
  const parts = CALENDAR_DAY.exec(day);
  if (parts === null) {
    throw new Error('La fecha debe tener la forma AAAA-MM-DD.');
  }
  return [Number(parts[1]), Number(parts[2]), Number(parts[3])];
}
