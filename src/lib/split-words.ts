export interface SplitWord {
  text: string;
  delay: number;
}

const STEP = 0.055;

// Ділить текст на слова; затримка слова = індекс × 0,055 с, округлена до сотих (збігається з прототипом).
// `offset` — скільки слів уже передувало цьому фрагменту, щоб відлік тривав крізь `heading` і `headingEm`.
export function splitWords(text: string, offset = 0): SplitWord[] {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((word, i) => ({ text: word, delay: Math.round((offset + i) * STEP * 100) / 100 }));
}
