<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { wsStore } from '$lib/stores/websocket.svelte';
	import { Zap } from '@lucide/svelte';
	import * as m from '$lib/paraglide/messages';

	let voteName = $state('');
	let allowSuggestions = $state(true);
	let creatorParticipates = $state(true);
	let voteIdToJoin = $state('');
	let lobbyTime = $state(120); // seconds, default 2 minutes
	let voteTime = $state(10); // seconds, default 10 seconds

	onMount(() => {
		wsStore.connect();
	});

	function formatTime(seconds: number): string {
		if (seconds < 60) {
			return m["time.seconds"]({ seconds });
		}
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		if (remainingSeconds === 0) {
			return m["time.minutes"]({ minutes });
		}
		return m["time.minutesSeconds"]({ minutes, seconds: remainingSeconds });
	}

	function handleCreateVote() {
		if (!voteName.trim()) return;

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
		goto(`/vote/${voteIdToJoin.trim()}/join`);
	}
</script>

<div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
	<div class="max-w-2xl w-full space-y-8">
		<!-- Header -->
		<div class="text-center">
			<h1 class="text-5xl font-bold text-primary mb-2 flex items-center justify-center gap-1">
				<Zap class="w-12 h-12" />
				{m["app.title"]()}
			</h1>
			<p class="text-lg opacity-70">{m["app.tagline"]()}</p>
		</div>

		<!-- Connection Status -->
		{#if !wsStore.connected}
			<div class="alert alert-warning">
				<span>{m["common.connectingToServer"]()}</span>
			</div>
		{/if}

		<!-- Create Vote -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body flex flex-col gap-3">
				<h2 class="card-title">{m["home.createVote"]()}</h2>
				<div class="form-control flex flex-col gap-2">
					<input
						id="voteName"
						type="text"
						placeholder={m["home.votePlaceholder"]()}
						class="input input-bordered w-full input-xl"
						bind:value={voteName}
					/>
				</div>
				<div class="form-control pt-5">
					<label class="label cursor-pointer">
						<input type="checkbox" class="checkbox checkbox-primary" bind:checked={allowSuggestions} />
						<span class="label-text">{m["home.allowSuggestions"]()}</span>
					</label>
				</div>
				<div class="form-control">
					<label class="label cursor-pointer">
						<input type="checkbox" class="checkbox checkbox-primary" bind:checked={creatorParticipates} />
						<span class="label-text">{m["home.creatorParticipates"]()}</span>
					</label>
				</div>
				
				<!-- Lobby Time Slider -->
				<div class="form-control flex flex-col gap-2">
					<label class="label" for="lobbyTime">
						<span class="label-text">{m["home.lobbyTime"]()}</span>
						<span class="label-text-alt font-semibold">{formatTime(lobbyTime)}</span>
					</label>
					<input
						id="lobbyTime"
						type="range"
						min="10"
						max="300"
						step="10"
						class="range range-primary w-full"
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
						<span class="label-text">{m["home.voteTime"]()}</span>
						<span class="label-text-alt font-semibold">{formatTime(voteTime)}</span>
					</label>
					<input
						id="voteTime"
						type="range"
						min="10"
						max="300"
						step="10"
						class="range range-primary w-full"
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
						{m["home.createButton"]()}
					</button>
				</div>
			</div>
		</div>

		<div class="divider">
			<p>{m["common.or"]()}</p>
		</div>

		<!-- Join Vote -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">{m["home.joinVote"]()}</h2>
				<div class="form-control flex flex-col gap-2">
					<input
						id="voteId"
						type="text"
						placeholder={m["home.voteIdPlaceholder"]()}
						class="input input-bordered w-full"
						bind:value={voteIdToJoin}
					/>
				</div>
				<div class="card-actions justify-end mt-4">
					<button
						class="btn btn-secondary btn-lg w-full"
						onclick={handleJoinVote}
						disabled={!voteIdToJoin.trim() || !wsStore.connected}
					>
						{m["home.joinButton"]()}
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
