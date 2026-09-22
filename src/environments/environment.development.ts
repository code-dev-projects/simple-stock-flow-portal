/** In development, proxy.conf.json forwards /api to the backend on localhost:5000. */
export const environment = {
  production: false,
  apiUrl: '/api',
  /**
   * The public project page. Absolute on purpose: it is published by GitHub Pages from a
   * separate repository, so it is not behind the proxy that serves this bundle.
   */
  projectPageUrl: 'https://code-dev-projects.github.io/simple-stock-flow-page/',
};
