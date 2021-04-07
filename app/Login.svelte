<script lang="ts">
    import TopBar from './components/TopBar.svelte'
    import { ControlBtn } from './types/types'
    const { ipcRenderer, remote } = require('electron');

    ipcRenderer.on("new-token", (e, {accessToken, visible}) => {
        localStorage.setItem("access_token", accessToken);
        // localStorage.setItem("refresh_token", refreshToken);
        remote.getCurrentWindow().getParentWindow().webContents.send("authenticated");
        if(visible) {
            remote.getCurrentWindow().close();
        }
    });

    let windowControls: ControlBtn[] = [
        {
            svg: `<svg viewBox="0 0 32 32" style="stroke-width:5">
                    <line x1="2" y1="2" x2="30" y2="30" />
                    <line x1="2" y1="30" x2="30" y2="2" />
                </svg>`,
            control: () => {
                console.log('close');
                remote.getCurrentWindow().close();
            }
	    }
    ];

</script>

<style>

</style>

<div class="login">
    <TopBar name={"login"} buttons={windowControls}/>
</div>