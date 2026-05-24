<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { wsStore } from '$lib/stores/websocket.svelte';
	import { PartyPopper, Trophy, Medal } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages';

	const voteId = $page.params.id;

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

	// Sort items by vote count (descending)
	const sortedResults = $derived(
		wsStore.currentVote
			? [...wsStore.currentVote.items]
					.map((item) => ({
						...item,
						count: wsStore.currentVote?.votes[item.id] || 0,
					}))
					.sort((a, b) => b.count - a.count)
			: []
	);

	const totalVotes = $derived(
		wsStore.currentVote ? Object.values(wsStore.currentVote.votes).reduce((a, b) => a + b, 0) : 0
	);

	const maxVotes = $derived(sortedResults.length > 0 ? sortedResults[0].count : 1);

	function goHome() {
		goto('/');
	}
</script>

<div class="min-h-screen bg-base-200 p-4">
	<div class="max-w-4xl mx-auto space-y-6">
		{#if wsStore.currentVote}
			<!-- Header -->
			<div class="text-center">
				<h1 class="text-4xl font-bold mb-2">{wsStore.currentVote.name}</h1>
				<div class="badge badge-lg badge-accent">{m["results.title"]()}</div>
			</div>

			<!-- Summary -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body text-center">
					<h2 class="text-2xl font-bold flex items-center justify-center gap-2">
						<PartyPopper class="w-7 h-7" />
						{m["results.votingComplete"]()}
					</h2>
					<div class="stats stats-vertical lg:stats-horizontal shadow mt-4">
						<div class="stat">
							<div class="stat-title">{m["results.totalVotes"]()}</div>
							<div class="stat-value text-primary">{totalVotes}</div>
						</div>
						<div class="stat">
							<div class="stat-title">{m["common.participants"]()}</div>
							<div class="stat-value text-secondary">
								{wsStore.currentVote.participants.length}
							</div>
						</div>
						<div class="stat">
							<div class="stat-title">{m["common.items"]()}</div>
							<div class="stat-value text-accent">{wsStore.currentVote.items.length}</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Results -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title text-2xl mb-4">{m["results.finalRankings"]()}</h2>
					<div class="space-y-4">
						{#each sortedResults as result, index (result.id)}
							{@const percentage = maxVotes > 0 ? (result.count / maxVotes) * 100 : 0}
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3">
										<span class="text-3xl font-bold text-primary">#{index + 1}</span>
										<div>
											<h3 class="text-xl font-semibold">{result.name}</h3>
											<p class="text-sm opacity-70">
												{result.count} {result.count === 1 ? m["common.vote"]() : m["common.votes"]()}
											</p>
										</div>
									</div>
									{#if index === 0 && result.count > 0}
										<Trophy class="w-10 h-10 text-yellow-500" />
									{:else if index === 1 && result.count > 0}
										<Medal class="w-9 h-9 text-gray-400" />
									{:else if index === 2 && result.count > 0}
										<Medal class="w-8 h-8 text-amber-600" />
									{/if}
								</div>
								<!-- Animated progress bar -->
								<div class="w-full bg-base-300 rounded-full h-8 overflow-hidden">
									<div
										class="h-8 rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-3 text-white font-bold"
										class:bg-primary={index === 0}
										class:bg-secondary={index === 1}
										class:bg-accent={index === 2}
										class:bg-neutral={index > 2}
										style="width: {percentage}%"
									>
										{#if percentage > 15}
											{percentage.toFixed(1)}%
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<button class="btn btn-primary btn-lg w-full" onclick={goHome}>
						{m["results.createAnother"]()}
					</button>
				</div>
			</div>
		{:else}
			<div class="text-center py-20">
				<span class="loading loading-spinner loading-lg"></span>
				<p class="mt-4">{m["results.loadingResults"]()}</p>
			</div>
		{/if}

		{#if wsStore.error}
			<div class="alert alert-error">
				<span>{wsStore.error}</span>
			</div>
		{/if}
	</div>
</div>
