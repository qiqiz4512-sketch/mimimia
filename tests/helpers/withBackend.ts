export function withBackend(pathAndQuery: string, projectName: string): string {
  const url = new URL(pathAndQuery, 'http://mimimia.test');
  if (projectName === 'chromium-webgl2') url.searchParams.set('backend', 'webgl2');
  return `${url.pathname}${url.search}${url.hash}`;
}
