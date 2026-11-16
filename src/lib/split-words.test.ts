import { describe, expect, it } from 'vitest';
import { splitWords } from './split-words';

describe('splitWords', () => {
  it('ділить текст на слова з кумулятивною затримкою ~0,055 с (як у прототипі)', () => {
    expect(splitWords('Dobieramy zieleń')).toEqual([
      { text: 'Dobieramy', delay: 0 },
      { text: 'zieleń', delay: 0.06 },
    ]);
  });

  it('продовжує відлік затримки з наданого початку', () => {
    expect(splitWords('nie odwrotnie.', 2)).toEqual([
      { text: 'nie', delay: 0.11 },
      { text: 'odwrotnie.', delay: 0.17 },
    ]);
  });

  it('ігнорує зайві пробіли', () => {
    expect(splitWords('  a   b ')).toHaveLength(2);
  });
});
