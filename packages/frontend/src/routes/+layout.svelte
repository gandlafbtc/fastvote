<script lang="ts">
	import { getLocale, getTextDirection } from '$lib/paraglide/runtime';
	import { onMount } from 'svelte';
	import './layout.css';
	import UsernameInput from '$lib/components/UsernameInput.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import { getUsername, clearUsername } from '$lib/stores/user';
	import { LogOut, CodeXml, Zap } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages';

	let { children } = $props();
	let isLoading = $state(true);
	let hasUsername = $state(false);
	let localeKey = $state(0); // Force re-render when locale changes

	// Update HTML lang and dir attributes when locale changes
	function updateHtmlAttributes() {
		if (typeof document !== 'undefined') {
			const locale = getLocale();
			const dir = getTextDirection(locale);
			document.documentElement.lang = locale;
			document.documentElement.dir = dir;
			localeKey++; // Trigger re-render
		}
	}

	onMount(() => {
		// Initialize locale attributes on mount
		updateHtmlAttributes();

		// Show splash screen for 500ms
		setTimeout(() => {
			checkUsername();
			isLoading = false;
		}, 500);

		// Listen for username changes
		const handleUsernameSet = () => {
			checkUsername();
		};

		// Listen for locale changes (triggered by LanguageSwitcher)
		const handleLocaleChange = () => {
			updateHtmlAttributes();
		};

		window.addEventListener('username-set', handleUsernameSet);
		window.addEventListener('locale-change', handleLocaleChange);

		return () => {
			window.removeEventListener('username-set', handleUsernameSet);
			window.removeEventListener('locale-change', handleLocaleChange);
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


{#key localeKey}
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
		<div class="h-10 grid grid-cols-3 items-center justify-between">
			<a
				href="https://github.com/gandlafbtc/fastvote"
				target="_blank"
				rel="noopener noreferrer"
				class="btn btn-ghost btn-sm btn-square"
				aria-label="View source on GitHub"
			>
				<CodeXml class="h-5 w-5" />
			</a>
			<a class="btn btn-ghost text-primary" href="/"><Zap></Zap> FastVote</a>
			<div class="flex justify-end">

				<LanguageSwitcher />
			</div>
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
{/key}
