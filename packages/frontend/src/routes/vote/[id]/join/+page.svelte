<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { wsStore } from '$lib/stores/websocket.svelte';
	import { getUserId, getUsername, setUsername } from '$lib/stores/user';
	import { Check } from '@lucide/svelte';

	const voteId = $page.params.id;
	const userId = getUserId();

	let username = $state(getUsername() || '');
	let itemSuggestion = $state('');
	let hasSuggested = $state(false);

	onMount(() => {
		if (!wsStore.connected) {
			wsStore.connect();
		}

		// Join the vote
		if (voteId) {
			wsStore.joinVote(voteId);
		}
	});

	function handleSetUsername() {
		if (username.trim()) {
			setUsername(username.trim());
		}
	}

	$effect(() => {
		// Check if user already suggested an item
		if (wsStore.currentVote) {
			const userItem = wsStore.currentVote.items.find((item) => item.suggestedBy === userId);
			if (userItem) {
				hasSuggested = true;
			}

			// Redirect based on vote status
			if (wsStore.currentVote.status === 'voting') {
				goto(`/vote/${voteId}/vote`);
			} else if (wsStore.currentVote.status === 'finished') {
				goto(`/vote/${voteId}/results`);
			}
		}
	});

	function handleSuggestItem() {
		if (!itemSuggestion.trim() || !voteId) return;

		wsStore.suggestItem(voteId, itemSuggestion.trim());
		itemSuggestion = '';
		hasSuggested = true;
	}

	function goToLobby() {
		if (voteId) {
			goto(`/vote/${voteId}/lobby`);
		}
	}
</script>

<div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
	<div class="max-w-2xl w-full space-y-6">
		{#if wsStore.currentVote}
			<!-- Header -->
			<div class="text-center">
				<h1 class="text-4xl font-bold mb-2">{wsStore.currentVote.name}</h1>
				<div class="badge badge-lg badge-info">Joining Vote</div>
			</div>

			<!-- Success Message -->
			<div class="alert alert-success">
				<Check class="w-5 h-5" />
				<span>Successfully joined the vote!</span>
			</div>

			<!-- Username Input -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Your Identity</h2>
					<div class="form-control flex flex-col gap-2">
						<label class="label" for="username">
							<span class="label-text">Username (optional)</span>
						</label>
						<input
							id="username"
							type="text"
							placeholder="Enter your name..."
							class="input input-bordered"
							bind:value={username}
							onblur={handleSetUsername}
						/>
						<label class="label">
							<span class="label-text-alt">Your ID: {getUserId().substring(0, 8)}...</span>
						</label>
					</div>
				</div>
			</div>

			<!-- Suggest Item (if enabled) -->
			{#if wsStore.currentVote.allowSuggestions && wsStore.currentVote.status === 'lobby'}
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title">Suggest an Item</h2>
						{#if !hasSuggested}
							<p class="text-sm opacity-70 mb-4">
								You can suggest one item for this vote. Make it count!
							</p>
							<div class="form-control">
								<input
									type="text"
									placeholder="Enter your suggestion..."
									class="input input-bordered"
									bind:value={itemSuggestion}
									onkeydown={(e) => e.key === 'Enter' && handleSuggestItem()}
								/>
							</div>
							<div class="card-actions justify-end mt-4">
								<button
									class="btn btn-primary w-full"
									onclick={handleSuggestItem}
									disabled={!itemSuggestion.trim()}
								>
									Submit Suggestion
								</button>
							</div>
						{:else}
							<div class="alert alert-info">
								<Check class="w-5 h-5" />
								<span>You've already submitted your suggestion!</span>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Go to Lobby -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Ready to Vote?</h2>
					<p class="text-sm opacity-70 mb-4">
						Head to the lobby to see other participants and wait for the vote to start.
					</p>
					<button class="btn btn-secondary btn-lg w-full" onclick={goToLobby}>
						Go to Lobby
					</button>
				</div>
			</div>

			<!-- Vote Info -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Vote Information</h2>
					<div class="space-y-2 text-sm">
						<p>
							<span class="font-semibold">Participants:</span>
							{wsStore.currentVote.participants.length}
						</p>
						<p>
							<span class="font-semibold">Items:</span>
							{wsStore.currentVote.items.length}
						</p>
						<p>
							<span class="font-semibold">Status:</span>
							<span class="badge badge-sm">{wsStore.currentVote.status}</span>
						</p>
					</div>
				</div>
			</div>
		{:else}
			<div class="text-center py-20">
				<span class="loading loading-spinner loading-lg"></span>
				<p class="mt-4">Joining vote...</p>
			</div>
		{/if}

		{#if wsStore.error}
			<div class="alert alert-error">
				<span>{wsStore.error}</span>
			</div>
		{/if}
	</div>
</div>
