import { describe, expect, it } from 'vitest';

import { EXPERIENCE_TIMING } from '../../../src/config/experience';

describe('project foundation', () => {
  it('uses the approved 2.5 second charge duration', () => {
    expect(EXPERIENCE_TIMING.chargeMs).toBe(2500);
  });
});
