import { expect, test } from 'vitest';
import { PALETTE_IDS } from '../../core/settings';
import { contrastRatio, PALETTES } from './palettes';

test('every palette exists with readable white toolbar text', () => {
  for (const id of PALETTE_IDS) {
    expect(PALETTES[id], id).toBeDefined();
    expect(contrastRatio('#ffffff', PALETTES[id].primary), id).toBeGreaterThanOrEqual(4.5);
  }
});
test('contrastRatio reference values', () => {
  expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1);
  expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
});
