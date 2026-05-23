<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { wsStore } from '$lib/stores/websocket.svelte';
	import { getUserId, getUsername, setUsername } from '$lib/stores/user';
	import { Zap } from '@lucide/svelte';

	let voteName = $state('');
	let allowSuggestions = $state(true);
	let creatorParticipates = $state(true);
	let username = $state(getUsername() || '');
	let voteIdToJoin = $state('');
	let lobbyTime = $state(120); // seconds, default 2 minutes
	let voteTime = $state(10); // seconds, default 10 seconds

	onMount(() => {
		wsStore.connect();
	});

	function formatTime(seconds: number): string {
		if (seconds < 60) {
			return `${seconds} sec`;
		}
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		if (remainingSeconds === 0) {
			return `${minutes} min`;
		}
		return `${minutes} min ${remainingSeconds} sec`;
	}

	function handleCreateVote() {
		if (!voteName.trim()) return;

		if (username.trim()) {
			setUsername(username.trim());
		}

		wsStore.createVote(voteName, allowSuggestions, creatorParticipates, lobbyTime, voteTime);

		// Wait for vote_created event
		const checkVote = setInterval(() => {
			if (wsStore.currentVote) {
				clearInterval(checkVote);
				goto(`/vote/${wsStore.currentVote.id}/lobby`);
			}
		}, 100);
	}

	function handleJoinVote() {
		if (!voteIdToJoin.trim()) return;

		if (username.trim()) {
			setUsername(username.trim());
		}

		goto(`/vote/${voteIdToJoin.trim()}/join`);
	}
</script>

<div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
	<div class="max-w-2xl w-full space-y-8">
		<!-- Header -->
		<div class="text-center">
			<h1 class="text-5xl font-bold text-primary mb-2 flex items-center justify-center gap-3">
				<Zap class="w-12 h-12" />
				FastVote
			</h1>
			<p class="text-lg opacity-70">Real-time voting made simple</p>
		</div>

		<!-- Connection Status -->
		{#if !wsStore.connected}
			<div class="alert alert-warning">
				<span>Connecting to server...</span>
			</div>
		{/if}

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
					/>
					<label class="label">
						<span class="label-text-alt">Your ID: {getUserId().substring(0, 8)}...</span>
					</label>
				</div>
			</div>
		</div>

		<!-- Create Vote -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body flex flex-col gap-3">
				<h2 class="card-title">Create a Vote</h2>
				<div class="form-control flex flex-col gap-2">
					<label class="label" for="voteName">
						<span class="label-text">Vote Name</span>
					</label>
					<input
						id="voteName"
						type="text"
						placeholder="What are we voting on?"
						class="input input-bordered"
						bind:value={voteName}
					/>
				</div>
				<div class="form-control">
					<label class="label cursor-pointer">
						<input type="checkbox" class="checkbox checkbox-primary" bind:checked={allowSuggestions} />
						<span class="label-text">Allow participants to suggest items</span>
					</label>
				</div>
				<div class="form-control">
					<label class="label cursor-pointer">
						<input type="checkbox" class="checkbox checkbox-primary" bind:checked={creatorParticipates} />
						<span class="label-text">I will participate in voting</span>
					</label>
				</div>
				
				<!-- Lobby Time Slider -->
				<div class="form-control flex flex-col gap-2">
					<label class="label" for="lobbyTime">
						<span class="label-text">Lobby Time</span>
						<span class="label-text-alt font-semibold">{formatTime(lobbyTime)}</span>
					</label>
					<input
						id="lobbyTime"
						type="range"
						min="10"
						max="300"
						step="10"
						class="range range-primary"
						bind:value={lobbyTime}
					/>
					<div class="flex justify-between text-xs opacity-50 px-2">
						<span>10 sec</span>
						<span>5 min</span>
					</div>
				</div>

				<!-- Vote Time Slider -->
				<div class="form-control flex flex-col gap-2">
					<label class="label" for="voteTime">
						<span class="label-text">Vote Time</span>
						<span class="label-text-alt font-semibold">{formatTime(voteTime)}</span>
					</label>
					<input
						id="voteTime"
						type="range"
						min="10"
						max="300"
						step="10"
						class="range range-primary"
						bind:value={voteTime}
					/>
					<div class="flex justify-between text-xs opacity-50 px-2">
						<span>10 sec</span>
						<span>5 min</span>
					</div>
				</div>

				<div class="card-actions justify-end mt-4">
					<button
						class="btn btn-primary btn-lg w-full"
						onclick={handleCreateVote}
						disabled={!voteName.trim() || !wsStore.connected}
					>
						Create Vote
					</button>
				</div>
			</div>
		</div>

		<div class="divider">
			<p>or</p>
		</div>

		<!-- Join Vote -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Join a Vote</h2>
				<div class="form-control flex flex-col gap-2">
					<label class="label" for="voteId">
						<span class="label-text">Vote ID</span>
					</label>
					<input
						id="voteId"
						type="text"
						placeholder="Enter vote ID..."
						class="input input-bordered"
						bind:value={voteIdToJoin}
					/>
				</div>
				<div class="card-actions justify-end mt-4">
					<button
						class="btn btn-secondary btn-lg w-full"
						onclick={handleJoinVote}
						disabled={!voteIdToJoin.trim() || !wsStore.connected}
					>
						Join Vote
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
