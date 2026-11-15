import { describe, expect, it } from 'vitest';
import { buildAskMessage } from './ask-message';

describe('buildAskMessage', () => {
  it('формує привітання з назвою товару і кінцевим пробілом', () => {
    expect(buildAskMessage('Sukulenty')).toBe('Dzień dobry, interesuje mnie: Sukulenty. ');
  });
});
