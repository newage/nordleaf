// Мінімальні типи для bindings/секретів Workers (повний набір не потрібен: їх читає лише contact.ts)
declare module 'cloudflare:workers' {
  export const env: Record<string, unknown>;
}
