<script lang="ts">
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		onComplete?: () => void;
	}

	let { onComplete }: Props = $props();

	let currentNumber = $state<number | string>(3);
	let isVisible = $state(true);
	let fadeClass = $state('fade-in');

	onMount(() => {
		const sequence = [3, 2, 1, m["vote.countdown.go"]()];
		let index = 0;

		const interval = setInterval(() => {
			// Fade out current number
			fadeClass = 'fade-out';

			setTimeout(() => {
				index++;
				if (index < sequence.length) {
					// Update to next number and fade in
					currentNumber = sequence[index];
					fadeClass = 'fade-in';
				} else {
					// Countdown complete
					isVisible = false;
					clearInterval(interval);
					if (onComplete) {
						onComplete();
					}
				}
			}, 300); // Wait for fade out to complete
		}, 1000); // Change every second

		return () => clearInterval(interval);
	});
</script>

{#if isVisible}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
		style="background-color: rgba(0, 0, 0, 0.3);"
	>
		<div class="countdown-number {fadeClass}">
			{currentNumber}
		</div>
	</div>
{/if}

<style>
	.countdown-number {
		font-size: 20rem;
		font-weight: 900;
		color: rgba(255, 255, 255, 0.9);
		text-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
		transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
	}

	.fade-in {
		opacity: 1;
		transform: scale(1);
		animation: fadeInScale 0.3s ease-out;
	}

	.fade-out {
		opacity: 0;
		transform: scale(0.8);
	}

	@keyframes fadeInScale {
		from {
			opacity: 0;
			transform: scale(1.2);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@media (max-width: 768px) {
		.countdown-number {
			font-size: 12rem;
		}
	}

	@media (max-width: 480px) {
		.countdown-number {
			font-size: 8rem;
		}
	}
</style>
