// Prefix site-relative paths with the deployment base path (e.g. /group-website/).
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export function url(path = ''): string {
  if (!path) return base + '/';
  if (/^(https?:|mailto:|#)/.test(path)) return path;
  return base + '/' + path.replace(/^\//, '');
}
