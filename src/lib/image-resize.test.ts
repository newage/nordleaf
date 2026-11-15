import { describe, expect, it } from 'vitest';
import { computeTargetSize } from './image-resize';

describe('computeTargetSize', () => {
  it('зменшує 4000×3000 до 1600×1200', () => {
    expect(computeTargetSize(4000, 3000)).toEqual({ width: 1600, height: 1200, resized: true });
  });
  it('зменшує портретне фото за довшою стороною', () => {
    expect(computeTargetSize(3000, 4000)).toEqual({ width: 1200, height: 1600, resized: true });
  });
  it('не чіпає малі зображення', () => {
    expect(computeTargetSize(1600, 900)).toEqual({ width: 1600, height: 900, resized: false });
  });
  it('не дає нульової сторони при екстремальних пропорціях', () => {
    expect(computeTargetSize(100000, 10).height).toBeGreaterThanOrEqual(1);
  });
});
