<script lang="ts">
	import { setUsername } from '$lib/stores/user';
	import { User } from '@lucide/svelte';
	import LanguageSwitcher from './LanguageSwitcher.svelte';
	import * as m from '$lib/paraglide/messages';

	const MAX_USERNAME_LENGTH = 35;
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
	<!-- Language Switcher - Top Right -->
	<div class="absolute top-4 right-4">
		<LanguageSwitcher />
	</div>

	<div class="max-w-md w-full">
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<div class="flex items-center justify-center mb-4">
					<User class="w-16 h-16 text-primary" />
				</div>
				<h2 class="card-title text-center justify-center text-2xl mb-2">{m["username.welcome"]()}</h2>
				<p class="text-center opacity-70 mb-6">{m["username.enterName"]()}</p>
				
				<div class="form-control flex flex-col gap-2">
					<label class="label" for="username-input">
						<span class="label-text">{m["username.yourName"]()}</span>
					</label>
					<input
						id="username-input"
						type="text"
						placeholder={m["username.placeholder"]()}
						class="input input-bordered input-lg w-full"
						bind:value={username}
						maxlength={MAX_USERNAME_LENGTH}
						onkeydown={(e) => e.key === 'Enter' && handleSubmit()}
						autofocus
					/>
					<div class="label">
						<span class="label-text-alt"></span>
						<span class="label-text-alt">
							{username.length}/{MAX_USERNAME_LENGTH}
						</span>
					</div>
				</div>
				
				<div class="card-actions justify-end mt-6">
					<button
						class="btn btn-primary btn-lg w-full"
						onclick={handleSubmit}
						disabled={!username.trim()}
					>
						{m["username.continue"]()}
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
