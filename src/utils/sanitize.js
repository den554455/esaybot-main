const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];
const SAFE_RELATIVE_PATTERN = /^(\/|\.\/|\.\.\/)/i;

export const sanitizeUrl = (value) => {
  if (typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  if (SAFE_RELATIVE_PATTERN.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed, window.location.origin);
    if (!SAFE_PROTOCOLS.includes(url.protocol)) {
      return '';
    }
    return url.href;
  } catch {
    if (/^(mailto:|tel:)/i.test(trimmed)) {
      return trimmed;
    }
    return '';
  }
};

export const createSafeLinkProps = (href, options = {}) => {
  const safeHref = sanitizeUrl(href);
  if (!safeHref) {
    return { href: '#' };
  }

  const isExternal = /^https?:/i.test(safeHref);
  if (!isExternal) {
    return { href: safeHref };
  }

  return {
    href: safeHref,
    target: options.target || '_blank',
    rel: options.rel || 'noopener noreferrer',
  };
};

export const sanitizeImageSrc = (src) => sanitizeUrl(src);
