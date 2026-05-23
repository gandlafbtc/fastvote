import { browser } from '$app/environment';

export function getUserId(): string {
	if (!browser) return '';
	
	let userId = localStorage.getItem('userId');
	if (!userId) {
		userId = crypto.randomUUID();
		localStorage.setItem('userId', userId);
	}
	return userId;
}

export function getUsername(): string | undefined {
	if (!browser) return undefined;
	return localStorage.getItem('username') || undefined;
}

export function setUsername(username: string) {
	if (!browser) return;
	localStorage.setItem('username', username);
}
