<script lang="ts">
	import { locales, getLocale, setLocale } from '$lib/paraglide/runtime';
	import { Languages } from '@lucide/svelte';

	let currentLocale = $state(getLocale());
	let isOpen = $state(false);

	const localeNames: Record<string, string> = {
		en: 'English',
		'ko-kr': '한국어',
		es: 'Español',
		de: 'Deutsch'
	};

	const localeFlags: Record<string, string> = {
		en: '🇬🇧',
		'ko-kr': '🇰🇷',
		es: '🇪🇸',
		de: '🇩🇪'
	};

	function handleLocaleChange(locale: 'en' | 'ko-kr' | 'es' | 'de') {
		setLocale(locale, { reload: false });
		currentLocale = locale;
		isOpen = false;
		
		// Dispatch custom event to notify layout of locale change
		window.dispatchEvent(new CustomEvent('locale-change'));
	}

	function toggleDropdown() {
		isOpen = !isOpen;
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.language-switcher')) {
			isOpen = false;
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});
</script>

<div class="language-switcher relative">
	<button
		class="btn btn-ghost btn-sm gap-2"
		onclick={toggleDropdown}
		aria-label="Change language"
		aria-expanded={isOpen}
	>
		<Languages class="h-4 w-4" />
		<span class="hidden sm:inline">{localeFlags[currentLocale]} {localeNames[currentLocale]}</span>
		<span class="sm:hidden">{localeFlags[currentLocale]}</span>
	</button>

	{#if isOpen}
		<div
			class="absolute right-0 top-full mt-2 z-50 min-w-[160px] rounded-lg bg-base-100 shadow-lg border border-base-300"
		>
			<ul class="menu p-2">
				{#each locales as locale (locale)}
					<li>
						<button
							class="flex items-center gap-2 {locale === currentLocale ? 'active' : ''}"
							onclick={() => handleLocaleChange(locale)}
						>
							<span class="text-lg">{localeFlags[locale]}</span>
							<span>{localeNames[locale]}</span>
							{#if locale === currentLocale}
								<span class="ml-auto text-primary">✓</span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.language-switcher {
		display: inline-block;
	}
</style>
