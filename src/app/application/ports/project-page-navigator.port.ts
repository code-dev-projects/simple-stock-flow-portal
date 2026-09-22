/**
 * Stated as a port because the test runner lives in the very page this navigates away from:
 * a spec has to be able to stand in for it.
 */
export abstract class ProjectPageNavigatorPort {
  /**
   * Replaces the current history entry instead of pushing one: a pushed entry would leave the
   * redirect in the history, and "back" from the project page would land on it and throw the
   * visitor out again. It spends whichever entry the browser is showing, so only a caller the
   * router has already committed may use it — a guard that cancels its own navigation would
   * spend the entry of the page the visitor came from.
   */
  abstract replaceCurrentPage(url: string): void;
}
