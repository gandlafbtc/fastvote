<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { wsStore } from '$lib/stores/websocket.svelte';
	import { getUserId, getUsername, setUsername } from '$lib/stores/user';
	import { Check } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages';

	const voteId = $page.params.id;
	const userId = getUserId();

	const MAX_SUGGESTION_LENGTH = 35;
	let username = $state(getUsername() || '');
	let itemSuggestion = $state('');
	let hasSuggested = $state(false);
	let userSuggestions = $derived(
		wsStore.currentVote?.items.filter((item) => item.suggestedBy === userId) || []
	);
	let otherSuggestions = $derived(
		wsStore.currentVote?.items.filter((item) => item.suggestedBy !== userId) || []
	);

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
				<div class="badge badge-lg badge-info">{m["join.joiningVote"]()}</div>
			</div>


			<!-- Suggest Item (if enabled) -->
			{#if wsStore.currentVote.allowSuggestions && wsStore.currentVote.status === 'lobby'}
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title">{m["join.suggestItem"]()}</h2>
									<!-- Other Users' Suggestions -->
			{#if otherSuggestions.length > 0}
						<p class="text-sm opacity-70 mb-2">
							{m["join.otherSuggestions"]()}
						</p>
						<div class="flex flex-wrap gap-2">
							{#each otherSuggestions as suggestion (suggestion.id)}
								<div class="badge badge-secondary badge-lg">
									{suggestion.name}
								</div>
							{/each}
				</div>
			{/if}
						{#if !hasSuggested}
							<p class="text-sm opacity-70 mb-4">
								{m["join.suggestDescription"]()}
							</p>
							<div class="form-control">
								<input
									type="text"
									placeholder={m["join.suggestionPlaceholder"]()}
									class="input input-lg input-bordered w-full"
									bind:value={itemSuggestion}
									maxlength={MAX_SUGGESTION_LENGTH}
									onkeydown={(e) => e.key === 'Enter' && handleSuggestItem()}
								/>
								<div class="label">
									<span class="label-text-alt"></span>
									<span class="label-text-alt">
										{itemSuggestion.length}/{MAX_SUGGESTION_LENGTH}
									</span>
								</div>
							</div>
							<div class="card-actions justify-end mt-4">
								<button
									class="btn btn-primary w-full"
									onclick={handleSuggestItem}
									disabled={!itemSuggestion.trim()}
								>
									{m["join.submitSuggestion"]()}
								</button>
							</div>

						{/if}

						<!-- Display user's suggestions as badges -->
						{#if userSuggestions.length > 0}
							<div class="mt-4">
								<h3 class="text-sm font-semibold mb-2 opacity-70">{m["join.yourSuggestions"]()}</h3>
								<div class="flex flex-wrap gap-2">
									{#each userSuggestions as suggestion (suggestion.id)}
										<div class="badge badge-primary badge-lg gap-2">
											<Check class="w-4 h-4" />
											{suggestion.name}
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Go to Lobby -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">{m["join.readyToVote"]()}</h2>
					<p class="text-sm opacity-70 mb-4">
						{m["join.readyDescription"]()}
					</p>
					<button class="btn btn-secondary btn-lg w-full" onclick={goToLobby}>
						{m["join.goToLobby"]()}
					</button>
				</div>
			</div>

			<!-- Vote Info -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">{m["join.voteInformation"]()}</h2>
					<div class="space-y-2 text-sm">
						<p>
							<span class="font-semibold">{m["common.participants"]()}:</span>
							{wsStore.currentVote.participants.length}
						</p>
						<p>
							<span class="font-semibold">{m["common.items"]()}:</span>
							{wsStore.currentVote.items.length}
						</p>
						<p>
							<span class="font-semibold">{m["common.status"]()}:</span>
							<span class="badge badge-sm">{wsStore.currentVote.status}</span>
						</p>
					</div>
				</div>
			</div>


		{:else}
			<div class="text-center py-20">
				<span class="loading loading-spinner loading-lg"></span>
				<p class="mt-4">{m["join.joiningVoteLoading"]()}</p>
			</div>
		{/if}

		{#if wsStore.error}
			<div class="alert alert-error">
				<span>{wsStore.error}</span>
			</div>
		{/if}
	</div>
</div>
