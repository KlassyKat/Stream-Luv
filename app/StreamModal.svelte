<script lang="ts">
    import TopBar from './components/TopBar.svelte'
    import Countdown from './components/Countdown.svelte'
    const { ipcRenderer, remote } = require('electron');

    let name = remote.getCurrentWindow().title;

    function close() {
        remote.getCurrentWindow().getParentWindow().close();
    }

    function cancelClose() {
        ipcRenderer.send('cancel-auto-close', name);
        remote.getCurrentWindow().close();
    }
</script>

<style>
    #modal > div {
        display: flex;
        width: 100%;
        justify-content: center;
    }

    #text-wrapper {
        display: flex;
        align-items: center;
        color: white;
        height: 40vh;
    }

    span {
        padding-right: 3px;
    }

    button{
        background-color: #ff8000;
        border: none;
        border-radius: 5px;
        transition: all 0.2s ease-in-out;
        font-size: 1em;
        cursor: pointer;
        margin: 5px;
    }

    button:hover {
        background-color: #994d00;
    }

</style>

<div id="modal">
    <TopBar name={''} buttons={[]}/>
    <div id="text-wrapper">
        <span>{name} will be auto closed in</span>
        <Countdown on:zero={cancelClose}/>
    </div>
    <div id="btn-wrapper">
        <button on:click={close}>Close Stream Now</button>
        <button on:click={cancelClose}>Cancel Auto Close</button>
    </div>
</div>