<script lang="ts">
    import { fade } from 'svelte/transition';
    export let messages: string[];

    function close(val) {
        messages.splice(val, 1);
        messages = messages; //Force svelte to update
    }
</script>
<style>
    #message-container {
        flex-direction: column;
        position: absolute;
        width: 100%;
        justify-content: center;
        align-content: center;
        z-index: 999;
        pointer-events: none;
    }

    #message-wrapper {
        border-radius: 5px;
        display: flex;
        background-color: #ff8000;
        max-width: 75vw;
        width: fit-content;
        margin-bottom: 5px;
        margin: auto;
    }

    p {
        margin: 0;
        padding: 5px;
        text-align: center;
    }

    span {
        display: flex;
        border-radius: 0px 5px 5px 0px;
        pointer-events: all;
    }
    span:hover {
        transition: 0.2s ease-in-out;
        background-color: #994d00;
        cursor: pointer;
    }

    svg {
        transform: rotate(45deg);
    }
</style>
{#each messages as message, i}
<div out:fade id="message-container" style="top: {32 * i + 40}px">
    <div id="message-wrapper">
        <p>{ message }</p>
        <span on:click="{() => close(i)}">
            <svg width="24px" viewBox="0 0 10 10">
                <rect stroke-width="0" x="4.5" y="2" width="1" height="6" />
                <rect stroke-width="0" y="4.5" x="2" height="1" width="6" />
            </svg>
        </span>
    </div>
</div>
{/each}
