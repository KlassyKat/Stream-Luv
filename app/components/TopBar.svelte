<script lang="ts">
    import { ControlBtn } from '../types/types';
    export let name: string;
    export let buttons: ControlBtn[];
</script>

<style>
    #top-bar {
        height: 32px;
        font-size: 19px;
        padding: 0 0 0 8px;
        display: grid;
        grid-template-columns: auto 1fr 32px;
        grid-auto-flow: column;
        grid-auto-columns: 32px;
        background-color: #0d0d0d;
        -webkit-app-region: drag;
        align-items: center;
    }

    #top-bar>span {
        -webkit-app-region: drag;
        color: white;
        font-weight: 500;
    }

    #top-bar> .btn {
        padding: 7px 7px 2px 7px;
        cursor: pointer;
        -webkit-app-region: no-drag;
        stroke: #707070;
        fill: #707070;
    }

    #top-bar> .btn:hover {
        background-color: #222;
    }
</style>

<nav id="top-bar">
    <span>{@html name}</span>
    <span class="placeholder"></span>
    {#each buttons as button}
        <span class="btn" on:click="{button.control}">
            {#if !button.toggle_trigger}
            {@html button.svg}
            {:else}
            {@html button.svg_toggle}
            {/if}
        </span>
    {/each}
</nav>