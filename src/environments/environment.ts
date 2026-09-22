/**
 * The URL is relative on purpose: nginx serves the bundle and proxies /api to the service,
 * so the front end never knows the backend host.
 */
export const environment = {
  production: true,
  apiUrl: '/api',
  /**
   * The public project page. Absolute on purpose: it is published by GitHub Pages from a
   * separate repository, so it is not behind the proxy that serves this bundle.
   */
  projectPageUrl: 'https://code-dev-projects.github.io/simple-stock-flow-page/',
};
