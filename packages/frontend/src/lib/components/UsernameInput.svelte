<script lang="ts">
	import { setUsername } from '$lib/stores/user';
	import { User } from '@lucide/svelte';

	let username = $state('');

	function handleSubmit() {
		if (username.trim()) {
			setUsername(username.trim());
			// Trigger a re-render by dispatching a custom event
			window.dispatchEvent(new Event('username-set'));
		}
	}
</script>

<div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
	<div class="max-w-md w-full">
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<div class="flex items-center justify-center mb-4">
					<User class="w-16 h-16 text-primary" />
				</div>
				<h2 class="card-title text-center justify-center text-2xl mb-2">Welcome to FastVote!</h2>
				<p class="text-center opacity-70 mb-6">Please enter your name to continue</p>
				
				<div class="form-control flex flex-col gap-2">
					<label class="label" for="username-input">
						<span class="label-text">Your Name</span>
					</label>
					<input
						id="username-input"
						type="text"
						placeholder="Enter your name..."
						class="input input-bordered input-lg w-full"
						bind:value={username}
						onkeydown={(e) => e.key === 'Enter' && handleSubmit()}
						autofocus
					/>
				</div>
				
				<div class="card-actions justify-end mt-6">
					<button
						class="btn btn-primary btn-lg w-full"
						onclick={handleSubmit}
						disabled={!username.trim()}
					>
						Continue
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
