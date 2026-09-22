import { formatDate } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { appConfig } from './app.config';

describe('appConfig', () => {
  /**
   * No other spec may register the es-CO data: if one did, this would pass for its sake and
   * stop saying anything about what the application itself loads.
   */
  it('runs in Colombian Spanish, with the locale data that identifier needs', () => {
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });

    expect(TestBed.inject(LOCALE_ID)).toBe('es-CO');
    expect(formatDate(Date.UTC(2026, 8, 1), 'shortDate', 'es-CO', 'UTC')).toBe('1/09/26');
  });
});
