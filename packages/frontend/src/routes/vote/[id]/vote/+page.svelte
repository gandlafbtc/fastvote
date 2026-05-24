<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { wsStore } from '$lib/stores/websocket.svelte';
	import { getUserId } from '$lib/stores/user';
	import Timer from '$lib/components/Timer.svelte';
	import CountdownOverlay from '$lib/components/CountdownOverlay.svelte';
	import { Hand } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages';

	const voteId = $page.params.id;
	const userId = getUserId();

	let votingEnabled = $state(false);
	let showCountdown = $state(false);
	let hasShownCountdown = $state(false);

	onMount(() => {
		if (!wsStore.connected) {
			wsStore.connect();
		}

		// Join the vote if not already in it
		if (!wsStore.currentVote || wsStore.currentVote.id !== voteId) {
			if (voteId) {
				wsStore.joinVote(voteId);
			}
		}
	});

	$effect(() => {
		// Show countdown when first arriving at voting page
		if (wsStore.currentVote?.status === 'voting' && !hasShownCountdown) {
			showCountdown = true;
			hasShownCountdown = true;
			votingEnabled = false;
		}
	});

	function handleCountdownComplete() {
		showCountdown = false;
		votingEnabled = true;
	}

	$effect(() => {
		// Redirect to results when voting finishes
		if (wsStore.currentVote?.status === 'finished') {
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			goto(`/vote/${voteId}/results`);
		}
	});

	function handleVote(itemId: string) {
		if (voteId && votingEnabled) {
			wsStore.castVote(voteId, itemId);
		}
	}

	// Check if current user is the creator and not participating
	const isCreator = $derived(wsStore.currentVote?.creatorId === userId);
	const showResultsView = $derived(isCreator && !wsStore.currentVote?.creatorParticipates);

	// For voters and participating creators: keep items in original order
	// For non-participating creator: sort by vote count for live ranking
	const displayItems = $derived(
		wsStore.currentVote
			? showResultsView
				? [...wsStore.currentVote.items].sort(
						(a, b) =>
							(wsStore.currentVote?.votes[b.id] || 0) - (wsStore.currentVote?.votes[a.id] || 0)
					)
				: wsStore.currentVote.items
			: []
	);
</script>

<div class="min-h-screen bg-base-200 p-4">
	<div class="max-w-4xl mx-auto space-y-6">
		{#if wsStore.currentVote && wsStore.currentVote.status === 'voting'}
			<!-- Header -->
			<div class="text-center">
				<h1 class="text-4xl font-bold mb-2">{wsStore.currentVote.name}</h1>
				<div class="badge badge-lg badge-success">{m["vote.votingActive"]()}</div>
			</div>

			<!-- Timer -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body text-center">
					<h2 class="card-title justify-center text-success">{m["vote.timeRemaining"]()}</h2>
					{#if wsStore.currentVote.votingEndsAt}
						<Timer endTime={wsStore.currentVote.votingEndsAt} />
					{/if}
				</div>
			</div>

			<!-- Instructions -->
			<div class="alert alert-info">
				<Hand class="w-5 h-5" />
				<span>{m["vote.instructions"]()}</span>
			</div>

			<!-- Vote Items -->
			{#if showResultsView}
				<!-- Results-style view for non-participating creator -->
				<div class="space-y-4">
					{#each displayItems as item, index (item.id)}
						{@const voteCount = wsStore.currentVote?.votes[item.id] || 0}
						{@const maxVotes = Math.max(...Object.values(wsStore.currentVote?.votes || {}), 1)}
						{@const percentage = (voteCount / maxVotes) * 100}
						<div class="card bg-base-100 shadow-xl">
							<div class="card-body">
								<div class="flex items-center gap-4">
									<!-- Rank -->
									<div class="text-5xl font-bold opacity-30 min-w-[60px]">
										#{index + 1}
									</div>
									<!-- Item Info -->
									<div class="flex-1">
										<h3 class="text-2xl font-bold mb-2">{item.name}</h3>
										<div class="flex items-center gap-4">
											<span class="text-3xl font-bold text-primary">{voteCount}</span>
											<span class="text-sm opacity-70">{m["common.votes"]()}</span>
										</div>
										<!-- Progress bar -->
										<div class="w-full bg-base-300 rounded-full h-3 mt-3">
											<div
												class="bg-primary h-3 rounded-full transition-all duration-500"
												style="width: {percentage}%"
											></div>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<!-- Voting buttons for participants -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each displayItems as item (item.id)}
						<button
							class="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95"
							class:opacity-50={!votingEnabled}
							class:cursor-not-allowed={!votingEnabled}
							disabled={!votingEnabled}
							onclick={() => handleVote(item.id)}
						>
							<div class="card-body">
								<h3 class="card-title text-2xl">{item.name}</h3>
								<div class="flex items-center justify-between mt-4">
									<span class="text-4xl font-bold text-primary">
										{wsStore.currentVote?.votes[item.id] || 0}
									</span>
									<span class="text-sm opacity-70">{m["common.votes"]()}</span>
								</div>
								<!-- Progress bar -->
								<div class="w-full bg-base-300 rounded-full h-2 mt-2">
									{#if wsStore.currentVote}
										{@const maxVotes = Math.max(
											...Object.values(wsStore.currentVote.votes),
											1
										)}
										{@const percentage = ((wsStore.currentVote.votes[item.id] || 0) / maxVotes) * 100}
										<div
											class="bg-primary h-2 rounded-full transition-all duration-300"
											style="width: {percentage}%"
										></div>
									{/if}
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		{:else if wsStore.currentVote?.status === 'lobby'}
			<div class="text-center py-20">
				<h2 class="text-2xl font-bold mb-4">{m["vote.waitingToStart"]()}</h2>
				<span class="loading loading-spinner loading-lg"></span>
			</div>
		{:else}
			<div class="text-center py-20">
				<span class="loading loading-spinner loading-lg"></span>
				<p class="mt-4">{m["vote.loadingVote"]()}</p>
			</div>
		{/if}

		{#if wsStore.error}
			<div class="alert alert-error">
				<span>{wsStore.error}</span>
			</div>
		{/if}
	</div>
</div>

{#if showCountdown}
	<CountdownOverlay onComplete={handleCountdownComplete} />
{/if}
