import { sanitizeUrl, createSafeLinkProps } from './sanitize';

describe('sanitizeUrl', () => {
  it('keeps safe http, https and relative urls', () => {
    expect(sanitizeUrl('https://example.com/path')).toBe('https://example.com/path');
    expect(sanitizeUrl('/calendar?master=1')).toBe('/calendar?master=1');
    expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
  });

  it('rejects javascript and data urls', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
  });
});

describe('createSafeLinkProps', () => {
  it('adds noopener and noreferrer for external links', () => {
    expect(createSafeLinkProps('https://example.com')).toEqual(
      expect.objectContaining({
        href: 'https://example.com/',
        target: '_blank',
        rel: 'noopener noreferrer',
      })
    );
  });

  it('keeps internal links without target injection', () => {
    const props = createSafeLinkProps('/calendar?master=1');
    expect(props.href).toBe('/calendar?master=1');
    expect(props.target).toBeUndefined();
    expect(props.rel).toBeUndefined();
  });
});
