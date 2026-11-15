// Текст, яким кнопка «Zapytaj…» заповнює поле повідомлення (з кінцевим пробілом)
export function buildAskMessage(name: string): string {
  return `Dzień dobry, interesuje mnie: ${name}. `;
}
