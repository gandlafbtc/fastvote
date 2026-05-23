<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { wsStore } from '$lib/stores/websocket.svelte';
	import { getUserId } from '$lib/stores/user';
	import Timer from '$lib/components/Timer.svelte';
	import QRCode from '$lib/components/QRCode.svelte';

	const voteId = $page.params.id;
	const userId = getUserId();

	let joinUrl = $state('');
	let newItemName = $state('');

	onMount(() => {
		if (!wsStore.connected) {
			wsStore.connect();
		}

		// Set the join URL
		if (typeof window !== 'undefined') {
			joinUrl = `${window.location.origin}/vote/${voteId}/join`;
		}

		// Join the vote if not already in it
		if (!wsStore.currentVote || wsStore.currentVote.id !== voteId) {
			wsStore.joinVote(voteId);
		}
	});

	$effect(() => {
		// Redirect to voting page when voting starts
		if (wsStore.currentVote?.status === 'voting') {
			goto(`/vote/${voteId}/vote`);
		}
	});

	function handleStartVote() {
		if (wsStore.currentVote && wsStore.currentVote.creatorId === userId) {
			wsStore.startVote(voteId);
		}
	}

	function handleAddItem() {
		if (newItemName.trim() && wsStore.currentVote && wsStore.currentVote.creatorId === userId) {
			wsStore.addItem(voteId, newItemName.trim());
			newItemName = '';
		}
	}

	const isCreator = $derived(wsStore.currentVote?.creatorId === userId);
	const canStart = $derived(
		isCreator && wsStore.currentVote && wsStore.currentVote.items.length > 0
	);
</script>

<div class="min-h-screen bg-base-200 p-4">
	<div class="max-w-4xl mx-auto space-y-6">
		{#if wsStore.currentVote}
			<!-- Header -->
			<div class="text-center">
				<h1 class="text-4xl font-bold mb-2">{wsStore.currentVote.name}</h1>
				<div class="badge badge-lg badge-warning">Lobby</div>
			</div>

			<!-- Timer -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body text-center">
					<h2 class="card-title justify-center">Time Until Auto-Start</h2>
					<Timer endTime={wsStore.currentVote.lobbyEndsAt} />
				</div>
			</div>

			<!-- QR Code -->
			{#if isCreator}
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title justify-center">Share This Vote</h2>
						<QRCode url={joinUrl} />
						<div class="text-center mt-4">
							<p class="text-sm opacity-70 mb-2">Or share this link:</p>
							<div class="flex gap-2">
								<input
									type="text"
									readonly
									value={joinUrl}
									class="input input-bordered flex-1 text-sm"
								/>
								<button
									class="btn btn-square"
									onclick={() => navigator.clipboard.writeText(joinUrl)}
								>
									📋
								</button>
							</div>
							<p class="text-xs opacity-50 mt-2">Vote ID: {voteId}</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Participants -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">
						Participants
						<div class="badge badge-primary">{wsStore.currentVote.participants.length}</div>
					</h2>
					<div class="flex flex-wrap gap-2">
						{#each wsStore.currentVote.participants as participant (participant.userId)}
							<div class="badge badge-lg">
								{participant.userId === userId
									? 'You'
									: participant.username || participant.userId.substring(0, 8)}
								{#if participant.userId === wsStore.currentVote.creatorId}
									👑
								{/if}
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Add Items (Creator Only) -->
			{#if isCreator}
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title">Add Items</h2>
						<form
							onsubmit={(e) => {
								e.preventDefault();
								handleAddItem();
							}}
							class="flex gap-2"
						>
							<input
								type="text"
								bind:value={newItemName}
								placeholder="Enter item name..."
								class="input input-bordered flex-1"
								maxlength="100"
							/>
							<button type="submit" class="btn btn-primary" disabled={!newItemName.trim()}>
								Add Item
							</button>
						</form>
						<p class="text-xs opacity-70 mt-2">
							As the creator, you can add unlimited items to the vote.
						</p>
					</div>
				</div>
			{/if}

			<!-- Items -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">
						Vote Items
						<div class="badge badge-secondary">{wsStore.currentVote.items.length}</div>
					</h2>
					{#if wsStore.currentVote.items.length === 0}
						<p class="text-center opacity-70 py-8">
							{#if wsStore.currentVote.allowSuggestions}
								Waiting for participants to suggest items...
							{:else}
								No items yet
							{/if}
						</p>
					{:else}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							{#each wsStore.currentVote.items as item (item.id)}
								<div class="card bg-base-200">
									<div class="card-body p-4">
										<h3 class="font-semibold">{item.name}</h3>
										<p class="text-xs opacity-70">
											Suggested by: {item.suggestedBy === userId
												? 'You'
												: item.suggestedBy.substring(0, 8)}
										</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Start Button (Creator Only) -->
			{#if isCreator}
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<button
							class="btn btn-success btn-lg w-full"
							onclick={handleStartVote}
							disabled={!canStart}
						>
							{canStart ? 'Start Voting Now' : 'Waiting for items...'}
						</button>
						{#if !canStart && wsStore.currentVote.items.length === 0}
							<p class="text-center text-sm opacity-70 mt-2">
								Need at least one item to start voting
							</p>
						{/if}
					</div>
				</div>
			{/if}
		{:else}
			<div class="text-center py-20">
				<span class="loading loading-spinner loading-lg"></span>
				<p class="mt-4">Loading vote...</p>
			</div>
		{/if}

		{#if wsStore.error}
			<div class="alert alert-error">
				<span>{wsStore.error}</span>
			</div>
		{/if}
	</div>
</div>
