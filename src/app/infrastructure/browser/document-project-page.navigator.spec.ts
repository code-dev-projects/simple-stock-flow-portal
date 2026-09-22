import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProjectPageNavigatorPort } from '../../application/ports/project-page-navigator.port';
import { infrastructureProviders } from '../providers';
import { DocumentProjectPageNavigator } from './document-project-page.navigator';

interface LocationCalls {
  replaced: string[];
  assigned: string[];
  hrefWrites: string[];
}

/**
 * Standing in for the real location is the whole reason DOCUMENT is injected: a spec that let
 * the adapter touch it would navigate the test runner away from its own page.
 */
function documentWith(calls: LocationCalls): Document {
  return {
    location: {
      replace: (url: string) => calls.replaced.push(url),
      assign: (url: string) => calls.assigned.push(url),
      set href(url: string) {
        calls.hrefWrites.push(url);
      },
    },
  } as unknown as Document;
}

describe('DocumentProjectPageNavigator', () => {
  let calls: LocationCalls;

  beforeEach(() => {
    calls = { replaced: [], assigned: [], hrefWrites: [] };
  });

  afterEach(() => TestBed.resetTestingModule());

  function navigator(): ProjectPageNavigatorPort {
    TestBed.configureTestingModule({
      providers: [...infrastructureProviders, { provide: DOCUMENT, useValue: documentWith(calls) }],
    });

    return TestBed.inject(ProjectPageNavigatorPort);
  }

  it('leaves the port unresolvable until the composition root binds it', () => {
    TestBed.configureTestingModule({ providers: [] });

    expect(() => TestBed.inject(ProjectPageNavigatorPort)).toThrow();
  });

  it('is the adapter the composition root binds the port to', () => {
    expect(navigator()).toBeInstanceOf(DocumentProjectPageNavigator);
  });

  it('sends the browser to the given address', () => {
    navigator().replaceCurrentPage('https://stand-in.example/project-page/');

    expect(calls.replaced).toEqual(['https://stand-in.example/project-page/']);
  });

  /**
   * The port promises a replaced entry, not a pushed one. Assigning or writing href would push,
   * and "back" would land on the redirect and throw the visitor out of the portal again.
   */
  it('replaces the current history entry instead of pushing one', () => {
    navigator().replaceCurrentPage('https://stand-in.example/project-page/');

    expect(calls.assigned).toEqual([]);
    expect(calls.hrefWrites).toEqual([]);
  });
});
