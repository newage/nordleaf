// Контакти з site/contact.yaml: клікабельним робимо лише справжнє значення, плейсхолдер у дужках лишається текстом
export const isPlaceholder = (v: string) => v.trim().startsWith('[');
export const mailHref = (v: string) => `mailto:${v.trim()}`;
export const telHref = (v: string) => `tel:${v.replace(/[^\d+]/g, '')}`;
