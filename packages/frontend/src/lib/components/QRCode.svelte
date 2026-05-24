<script lang="ts">
	import { onMount } from 'svelte';
	import {encodeQR} from 'qr';

	interface Props {
		url: string;
	}

	let { url }: Props = $props();


    const qr = $derived(encodeQR(url, 'svg'));

	onMount(() => {

	});
</script>

<div class="flex justify-center">
    <div class="h-80 w-80 bg-white  rounded-xl">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html qr}
    </div>
</div>
