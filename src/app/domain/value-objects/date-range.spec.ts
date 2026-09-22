import {
  dayRange,
  endOfDayExclusive,
  inclusiveEnd,
  monthToDate,
  startOfDay,
} from './date-range';

describe('date-range', () => {
  it('starts the range at the first instant of the day chosen', () => {
    expect(startOfDay('2026-01-01').toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });

  /** D-C2: from <= sold_at < to, so "hasta el 31" travels as the first instant of the 1st. */
  it('ends the range at the first instant of the day after the one chosen', () => {
    expect(endOfDayExclusive('2026-01-31').toISOString()).toBe('2026-02-01T00:00:00.000Z');
  });

  it('rolls over the end of a leap February', () => {
    expect(endOfDayExclusive('2028-02-29').toISOString()).toBe('2028-03-01T00:00:00.000Z');
  });

  it('rolls over the end of a year', () => {
    expect(endOfDayExclusive('2026-12-31').toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('builds a whole month out of the two days a person picks', () => {
    const range = dayRange('2026-01-01', '2026-01-31');

    expect(range.from.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(range.to.toISOString()).toBe('2026-02-01T00:00:00.000Z');
  });

  it('covers a single day picked on both ends', () => {
    const range = dayRange('2026-01-31', '2026-01-31');

    expect(range.from.toISOString()).toBe('2026-01-31T00:00:00.000Z');
    expect(range.to.toISOString()).toBe('2026-02-01T00:00:00.000Z');
  });

  it('covers the current month up to and including today', () => {
    const range = monthToDate(new Date('2026-09-19T15:30:00Z'));

    expect(range.from.toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(range.to.toISOString()).toBe('2026-09-20T00:00:00.000Z');
  });

  it('reads the day in UTC, never in the timezone of the browser', () => {
    const range = monthToDate(new Date('2026-09-01T02:00:00Z'));

    expect(range.from.toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(range.to.toISOString()).toBe('2026-09-02T00:00:00.000Z');
  });

  /** What travels is exclusive; what a person reads back has to be the last day included. */
  it('turns the exclusive bound back into the last instant inside the range', () => {
    expect(inclusiveEnd(new Date('2026-02-01T00:00:00Z')).toISOString()).toBe(
      '2026-01-31T23:59:59.999Z',
    );
  });

  it('rejects anything that is not a calendar day', () => {
    expect(() => startOfDay('31/01/2026')).toThrowError();
    expect(() => endOfDayExclusive('')).toThrowError();
  });
});
