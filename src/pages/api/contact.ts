import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { handleContact, type ContactEnv } from '../../lib/contact-handler';

// Єдиний динамічний маршрут; решта сайту — prerender
export const prerender = false;

export const POST: APIRoute = ({ request }) => handleContact(request, env as unknown as ContactEnv);
