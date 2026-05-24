import type { Handle } from '@sveltejs/kit';

// No server-side paraglide middleware - translations are handled client-side only
export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};
