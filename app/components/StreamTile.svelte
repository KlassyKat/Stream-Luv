<script lang="ts">
    import { Stream } from '../types/types';
    import { createEventDispatcher } from 'svelte';
    export let stream: Stream;
    export let switchOn: boolean = true;

    const dispatch = createEventDispatcher();

    function openMenu() {
        dispatch('menu', stream.id);
    }

    function openStream() {
        dispatch('open', {
            id: stream.id
        });
    }

    function toggleAutoOpen(e) {
        dispatch('toggle-auto-open', {
            id: stream.id,
            value: e.target.checked
        });
    }

    function toggleAutoCollect() {
        dispatch('toggle-auto-collect', {
            id: stream.id,
            value: !stream.autocollect
        })
    }
</script>

<style>
    .stream-tile {
        display: grid;
        grid-template-columns: 50px 86px 1fr 68px;
        list-style: none;
        background-color: #4d4d4d;
        color: white;
        border-radius: 5px;
        margin-bottom: 5px;
    }

    .switch_off {
        grid-template-columns: 80px 1fr 68px;
    }


 
    /* Toggle Switch */
    .stream-toggle {
        padding: 5px 0;
    }
    .switch {
        top: 10px;
        left: 5px;
        position: relative;
        display: inline-block;
        width: 26px;
        height: 40px;
    }
    .switch>input {
        opacity: 0;
        width: 0;
        height: 0;
    }
    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        background-color: #181818;
        transition: 0.4s;
        border-radius: 3px;
    }
    .slider:hover {
        background-color: #fff;
    }
    .slider:before {
        position: absolute;
        content: "";
        height: 15px;
        width: 22px;
        left: 2px;
        bottom: 2px;
        background-color: rgb(92, 92, 92);
        transition: 0.4s;
        border-radius: 3px;
    }
    input:checked+.slider {
        background-color: #ff8000;
    }
    input:checked:hover+.slider:hover {
        background-color: #c56300;
    }
    input:checked+.slider:before {
        transform: translateY(-21px);
        outline: none;
    }
    /* Image Wrapper */
    .img-wrapper {
        position: relative;
        padding-left: 6px;
    }

    .thumbnail {
        width: 60px;
        height: 60px;
        border-radius: 30px;
        margin: 5px 0;
    }

    /* Tile Name */
    .stream-name {
        display: flex;
        align-items: center;
    }

    .stream-name-text {
        overflow-x: hidden;
        width: auto;
        text-overflow: ellipsis;
        font-weight: 500;
        float: left;
        cursor: pointer;
    }

    .stream-name-text:hover {
        color: #ff8000;
        text-shadow: 0px 0px 2px #c56300;
    }
    /* Live Indicator */
    .live-container {
        width: 100%;
        display: grid;
        grid-template-rows: 1fr 1fr;
        justify-content: center;
        align-items: center;
    }
    .live {
        font-family: 'RobotoCondensed';
        font-size: 0.9em;
        margin: 0;
        padding: 0;
        cursor: default;
        color: #222;
        padding: 5px 9px;
    }
    .live-indicator {
        display: block;
        float: right;
        width: 13px;
        height: 13px;
        border-radius: 100%;
        margin-top: 20px;
        background-image: radial-gradient(#444444, rgb(7, 7, 7));
        justify-self: center;
    }
    .live_on>h4 {
        font-size: 1.05em;
        color: rgba(255, 0, 0, 0.7);
        text-shadow: 0px 0px 4px rgba(255, 0, 0, 1);
    }
    .live_on > .live-indicator {
        border: none;
        background: rgba(255, 255, 255, 0.7);
        animation: pulse 2.5s alternate infinite;
    }

    @keyframes pulse {
        0% {
            background: rgba(255, 255, 255, 0.3);
            box-shadow: inset 0px 0px 10px 2px rgba(255, 0, 0, 0.5),
                0px 0px 5px 2px rgba(255, 0, 0, 0.3);
        }

        100% {
            background: rgba(255, 255, 255, 1);
            box-shadow: inset 0px 0px 10px 2px rgba(255, 0, 0, 0.5),
                0px 0px 15px 2px rgb(255, 0, 0);
        }
    }
</style>

<li class="stream-tile {switchOn ? '' : 'switch_off'}" on:contextmenu="{openMenu}" id="{stream.id}">
    {#if switchOn}
    <div class="stream-toggle">
        <label class="switch">
            <input type="checkbox" on:click="{toggleAutoOpen}" checked="{stream.autoopen}">
            <span class="slider"></span>
        </label>
    </div>
    {/if}
    <div class="img-wrapper">
        <img src="{stream.img}" alt="stream icon" class="thumbnail">
    </div>
    <div class="stream-name">
        <span class="stream-name-text" on:click="{openStream}">
            {stream.name}
        </span>
    </div>
    <div class="live-container" class:live_on="{stream.live}">
        <div class="live-indicator"></div>
        <h4 class="live">{stream.live ? "LIVE" : "OFFLINE"}</h4>
    </div>
</li>