import { describe, expect, it } from 'vitest';

import { requiresStableSafariWebGL } from '../../../src/rendering/createRenderer';

describe('renderer browser policy', () => {
  it('uses the stable WebGL canvas path for desktop Safari', () => {
    expect(requiresStableSafariWebGL(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
      + 'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.4 Safari/605.1.15',
    )).toBe(true);
  });

  it.each([
    'Mozilla/5.0 Chrome/149.0.0.0 Safari/537.36',
    'Mozilla/5.0 Edg/149.0.0.0 Chrome/149.0.0.0 Safari/537.36',
    'Mozilla/5.0 Firefox/152.0',
  ])('does not force the Safari path for %s', (userAgent) => {
    expect(requiresStableSafariWebGL(userAgent)).toBe(false);
  });
});
