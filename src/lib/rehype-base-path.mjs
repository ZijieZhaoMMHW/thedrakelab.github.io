// Prefix root-relative links and images in Markdown (e.g. /images/x.png)
// with the site's base path, so content files can always use "/..." paths.
export default function rehypeBasePath() {
  const base = (process.env.BASE_PATH || '/').replace(/\/$/, '');
  return (tree) => {
    if (!base) return;
    const visit = (node) => {
      if (node.type === 'element') {
        for (const attr of ['src', 'href']) {
          const v = node.properties?.[attr];
          if (typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') && !v.startsWith(base + '/')) {
            node.properties[attr] = base + v;
          }
        }
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}
