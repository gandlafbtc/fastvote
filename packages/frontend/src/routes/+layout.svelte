<script lang="ts">
	import type { Pathname } from '$app/types';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import { onMount } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import UsernameInput from '$lib/components/UsernameInput.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import { getUsername, clearUsername } from '$lib/stores/user';
	import { LogOut } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages';

	let { children } = $props();
	let isLoading = $state(true);
	let hasUsername = $state(false);

	onMount(() => {
		// Show splash screen for 500ms
		setTimeout(() => {
			checkUsername();
			isLoading = false;
		}, 500);

		// Listen for username changes
		const handleUsernameSet = () => {
			checkUsername();
		};

		window.addEventListener('username-set', handleUsernameSet);

		return () => {
			window.removeEventListener('username-set', handleUsernameSet);
		};
	});

	function checkUsername() {
		hasUsername = !!getUsername();
	}

	function handleChangeUsername() {
		clearUsername();
		checkUsername();
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{#if isLoading}
	<!-- Splash Screen -->

	<div class="flex min-h-screen items-center justify-center bg-base-200">
		<div class="text-center">
			<span class="loading loading-lg loading-spinner text-primary"></span>

			<p class="mt-4 text-lg opacity-70">{m["layout.loadingApp"]()}</p>
		</div>
	</div>
{:else if !hasUsername}
	<!-- Username Input --><UsernameInput />
{:else}
	<!-- Main Content -->

	<div class="flex min-h-screen flex-col">
		<!-- Language Switcher - Top Left -->
		<div class="absolute top-4 right-4 z-50">
			<LanguageSwitcher />
		</div>

		<div class="flex-1">{@render children()}</div>
		<!-- Footer -->

		<footer class="bg-base-300 px-4 py-4">
			<div class="mx-auto flex max-w-7xl items-center justify-between">
				<div class="text-sm opacity-70">
					{m["layout.loggedInAs"]()}
					<span class="font-semibold">{getUsername()}</span>
				</div>

				<button class="btn gap-2 btn-ghost btn-sm" onclick={handleChangeUsername}
					><LogOut class="h-4 w-4" />{m["layout.changeUsername"]()}</button
				>
			</div>
		</footer>
	</div>
{/if}

<div style="display:none">
	{#each locales as locale (locale)}
		<a href={resolve(localizeHref(page.url.pathname, { locale }) as Pathname)}>{locale}</a>
	{/each}
</div>
