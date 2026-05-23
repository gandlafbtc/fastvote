<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		endTime: number;
		onComplete?: () => void;
	}

	let { endTime, onComplete }: Props = $props();

	let timeLeft = $state(0);
	let interval: ReturnType<typeof setInterval> | null = null;

	function updateTimer() {
		const now = Date.now();
		const remaining = Math.max(0, endTime - now);
		timeLeft = Math.floor(remaining / 1000);

		if (remaining <= 0 && onComplete) {
			onComplete();
			if (interval) clearInterval(interval);
		}
	}

	onMount(() => {
		updateTimer();
		interval = setInterval(updateTimer, 1000);
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});

	const minutes = $derived(Math.floor(timeLeft / 60));
	const seconds = $derived(timeLeft % 60);
	const formattedTime = $derived(`${minutes}:${seconds.toString().padStart(2, '0')}`);
</script>

<div class="text-center">
	<div class="text-4xl font-bold font-mono">
		{formattedTime}
	</div>
</div>
