<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import UsernameInput from '$lib/components/UsernameInput.svelte';
	import { getUsername, clearUsername } from '$lib/stores/user';
	import { LogOut } from '@lucide/svelte';

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
	<div class="min-h-screen bg-base-200 flex items-center justify-center">
		<div class="text-center">
			<span class="loading loading-spinner loading-lg text-primary"></span>
			<p class="mt-4 text-lg opacity-70">Loading FastVote...</p>
		</div>
	</div>
{:else if !hasUsername}
	<!-- Username Input -->
	<UsernameInput />
{:else}
	<!-- Main Content -->
	<div class="min-h-screen flex flex-col">
		<div class="flex-1">
			{@render children()}
		</div>
		
		<!-- Footer -->
		<footer class="bg-base-300 py-4 px-4">
			<div class="max-w-7xl mx-auto flex items-center justify-between">
				<div class="text-sm opacity-70">
					Logged in as: <span class="font-semibold">{getUsername()}</span>
				</div>
				<button
					class="btn btn-ghost btn-sm gap-2"
					onclick={handleChangeUsername}
				>
					<LogOut class="w-4 h-4" />
					Change Username
				</button>
			</div>
		</footer>
	</div>
{/if}
