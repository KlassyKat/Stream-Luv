<script lang="ts">
    import TopBar from './components/TopBar.svelte';
    import SettingHeader from './components/SettingHeader.svelte';
    import RadioButtonForm from './components/RadioButtonForm.svelte';
    import ToggleSetting from './components/ToggleSetting.svelte';
    import ShortcutPicker from './components/ShortcutPicker.svelte';
    import {
        Settings,
        ControlBtn
    } from './types/types';

    const {
        ipcRenderer,
        remote
    } = require('electron');

    let settings: Settings;


    ipcRenderer.send('get-settings');
    ipcRenderer.on('send-settings', (e, data) => {
        console.log(settings);
        settings = <Settings> data;
        console.log(settings);
    });

    function changeSettings({detail}) {
        console.log(detail);
        settings[detail.name] = detail.value;
        ipcRenderer.send('save-settings', settings);
    }


    //Window control
    let closeBtn: ControlBtn = {
        svg: `<svg viewBox="0 0 32 32" style="stroke-width:5">
                <line x1="2" y1="2" x2="30" y2="30" />
                <line x1="2" y1="30" x2="30" y2="2" />
            </svg>`,
        control: () => {
            remote.getCurrentWindow().close();
        }
    }
    let controls: ControlBtn[] = [
        closeBtn
    ]
</script>

<style>
    .settings {
        width: 100%;
        background-color: #363636;
    }

    .support-wrapper {
        display: grid;
        width: 100%;
        grid-template-columns: auto 1fr 36px 36px;
        align-items: center;
        background-color: #272727;
        box-shadow: 0 3px 5px #00000088;
    }

    .twitch-actions {
        display: flex;
        align-items: center;
    }

    #twitch-login {
        background-color: #4100A1;
        border: none;
        height: 35px;
        color: white;
        font-size: 0.95em;
        font-weight: 600;
        align-items: center;
        border-radius: 5px;
        display: flex;
        margin: 5px;
    }

    #twitch-login > strong {
        padding-left: 8px;
    }

    #twitch-login:hover,#twitch-login:focus {
        background-color: #2a0068;
        cursor: pointer;
    }

    #user-name-display {
        padding: 0 5px;
        color: white;
        font-weight: 500;

    }

    #logout-icon-wrapper {
        width: 20px;
        height: 20px;
        display: inline-block;
        cursor: pointer;
        fill: white;
    }

    #logout-icon-wrapper:hover, #logout-icon-wrapper:focus {
        fill: #9347FF;
        outline: none;
    }


    .window-btn {
        border: none;
        border-radius: 10px;
        width: 30px;
        height: 30px;
        background-color: #202020;
        color: white;
        outline: none;
        margin: 3px;
    }

    .window-btn:hover, .window-btn:focus {
        transition: all 0.2s ease-in-out;
        cursor: pointer;
        background: #0f0f0f;
    }
    .menu-items {
        display: flex;
        overflow-y: scroll;
        overflow-x: hidden;
        height: calc(100vh - 68px);
        color: white;
        flex-direction: column;
    }
</style>

<div class="settings">
    <TopBar name={"Settings"} buttons={controls} />
    <!-- Control Wrapper -->
    <div class="support-wrapper">
        <div class="twitch-actions">
            {#if !settings?.login}
            <!-- Login Button -->
            <button id="twitch-login">
                <svg height="70%" viewBox="0 0 207 240" version="1.1"
                    style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
                    <path
                        d="M52.181,193.856l-52.181,0l0,-152.14l44.229,-41.716l162.757,0l0,136.703l-57.153,57.153l-49.262,0l-48.39,45.953l0,-45.953Z"
                        style="fill:#9147ff;" />
                    <path
                        d="M86.006,146.171l-34.613,0l0,-131.049l138.465,0l0,95.895l-35.154,35.154l-34.655,0l-34.043,32.327l0,-32.327Z"
                        style="fill:#fff;" />
                    <rect x="103.493" y="51.65" width="17.132" height="50.751" style="fill:#9147ff;" />
                    <rect x="145.901" y="51.65" width="17.132" height="50.751" style="fill:#9147ff;" />
                </svg>
                <strong>Login</strong>
            </button>
            {:else}
            <!-- Logout Button -->
                <span id="user-name-display">{settings.login}</span>
                <span id="logout-icon-wrapper" title="Logout" tabindex="0">
                    <svg viewBox="0 0 32 32">
                        <path
                            d="M10.838,20.841l-0,6.956c-0,0.557 0.221,1.09 0.615,1.484c0.393,0.394 0.928,0.615 1.484,0.615l16.964,0c0.557,0 1.091,-0.221 1.484,-0.615c0.394,-0.394 0.615,-0.927 0.615,-1.484l0,-23.198c0,-0.557 -0.221,-1.091 -0.615,-1.484c-0.393,-0.394 -0.927,-0.615 -1.484,-0.615l-16.964,0c-0.556,0 -1.091,0.221 -1.484,0.615c-0.394,0.393 -0.615,0.927 -0.615,1.484l-0,7.064l3.712,0l-0,-4.234c-0,-0.188 0.075,-0.37 0.209,-0.505c0.133,-0.134 0.316,-0.208 0.505,-0.208l12.311,-0c0.189,-0 0.371,0.074 0.505,0.208c0.134,0.135 0.209,0.317 0.209,0.505l0,17.537c0,0.189 -0.075,0.371 -0.209,0.505c-0.134,0.134 -0.316,0.209 -0.505,0.209l-12.311,0c-0.189,0 -0.372,-0.075 -0.505,-0.209c-0.134,-0.134 -0.209,-0.316 -0.209,-0.505l-0,-4.125l-3.712,-0Z" />
                        <rect x="7.938" y="13.315" width="15.015" height="5.876" />
                        <path d="M8.222,23.604l0,-14.703l-8.222,7.351l8.222,7.352Z" />
                    </svg>
                </span>
            {/if}
        </div>
        <span class="filler"></span>
        <!-- Info Button -->
        <button id="app-info" class="window-btn" title="Info">
            <svg viewBox="0 0 32 32" >
                <path
                    d="M6.221,9.33c-0,-1.259 0.404,-2.534 1.212,-3.826c0.808,-1.292 1.988,-2.362 3.538,-3.21c1.55,-0.848 3.359,-1.272 5.426,-1.272c1.921,0 3.617,0.355 5.088,1.064c1.47,0.708 2.607,1.672 3.408,2.891c0.802,1.219 1.203,2.544 1.203,3.975c-0,1.126 -0.229,2.114 -0.686,2.962c-0.457,0.848 -1,1.58 -1.63,2.196c-0.629,0.616 -1.759,1.653 -3.388,3.11c-0.451,0.411 -0.812,0.772 -1.084,1.083c-0.271,0.312 -0.473,0.597 -0.606,0.855c-0.132,0.258 -0.235,0.517 -0.308,0.775c-0.073,0.258 -0.182,0.712 -0.328,1.361c-0.252,1.378 -1.04,2.067 -2.365,2.067c-0.689,0 -1.269,-0.225 -1.739,-0.675c-0.47,-0.451 -0.705,-1.12 -0.705,-2.008c-0,-1.113 0.172,-2.077 0.516,-2.891c0.345,-0.815 0.802,-1.531 1.372,-2.147c0.569,-0.616 1.338,-1.348 2.305,-2.196c0.848,-0.742 1.461,-1.302 1.838,-1.679c0.378,-0.378 0.696,-0.799 0.954,-1.263c0.259,-0.463 0.388,-0.967 0.388,-1.51c0,-1.06 -0.394,-1.954 -1.183,-2.683c-0.788,-0.729 -1.805,-1.093 -3.05,-1.093c-1.458,-0 -2.531,0.367 -3.22,1.103c-0.689,0.735 -1.272,1.818 -1.749,3.249c-0.45,1.498 -1.305,2.246 -2.564,2.246c-0.742,0 -1.368,-0.261 -1.878,-0.785c-0.51,-0.523 -0.765,-1.09 -0.765,-1.699Zm9.699,21.783c-0.809,-0 -1.514,-0.262 -2.117,-0.786c-0.603,-0.523 -0.904,-1.255 -0.904,-2.196c-0,-0.834 0.291,-1.537 0.874,-2.106c0.583,-0.57 1.299,-0.855 2.147,-0.855c0.834,-0 1.537,0.285 2.106,0.855c0.57,0.569 0.855,1.272 0.855,2.106c0,0.928 -0.298,1.657 -0.894,2.187c-0.597,0.53 -1.286,0.795 -2.067,0.795Z"
                    style="fill:white" />
            </svg>
        </button>
        <!-- Support Button -->
        <button id="support-me" class="window-btn" title="Support">
            <svg width="100%" height="100%" viewBox="0 0 32 32" style="fill: red">
                <path
                    d="M16.012,6.556l-2.345,-2.051c-3.126,-3.126 -8.195,-3.126 -11.322,0c-3.127,3.127 -3.127,8.196 -0,11.323l13.667,14.012l13.643,-14.012c3.127,-3.127 3.127,-8.196 0,-11.323c-3.127,-3.126 -8.196,-3.126 -11.322,0l-2.321,2.051Z" />
            </svg>
        </button>
    </div>
    <!-- Settings Wrapper -->
    {#if settings}
    <div class="menu-items">
        <!-- Auto Open Behavior -->
        <SettingHeader 
        title={'Auto Open Behavior'}
        descr={'What window type StreamLuv will open streams in, based on the settings.'}/>
        <RadioButtonForm
        setting={ {
            name: 'autoopentype',
            options: [
                {name: 'Default Browser Window', value: 'browser'},
                {name: 'StreamLuv Window', value: 'streamluv'},
            ],
            value: settings.autoopentype
        } }
        on:newsetting={changeSettings}/>
        <!-- Link Type -->
        <SettingHeader
        title={'Tile Link'}
        descr={'How the clickable link opens streams. Either in a StreamLuv Window or in your main browser.'}/>
        <RadioButtonForm 
        setting={ {
            name: 'linktype',
            options: [
                {name: 'Default Browser Window', value: 'browser'},
                {name: 'StreamLuv Window', value: 'streamluv'},
            ],
            value: settings.linktype
        } }
        on:newsetting={changeSettings}/>

        <!-- Auto Open App -->
        <SettingHeader
        title={'Live Stream Section'}
        descr={'Display a group of only live streams.'}/>
        <ToggleSetting 
        setting={ {name: 'livestreamsection', value: settings.livestreamsection} } 
        on:newsetting={changeSettings}/>

        <!-- Auto Open App -->
        <SettingHeader
        title={'Open on Startup'}
        descr={'When your computer starts so does StreamLuv.'}/>
        <ToggleSetting 
        setting={ {name: 'openonstartup', value: settings.openonstartup} } 
        on:newsetting={changeSettings}/>

        <!-- Start Streams Muted -->
        <SettingHeader
        title={'Start Streams Muted'}
        descr={'Streams start up muted. (StreamLuv Windows Only)'}/>
        <ToggleSetting 
        setting={ {name: 'startmuted', value: settings.startmuted} } 
        on:newsetting={changeSettings}/>
        <!-- Auto Close Streams -->
        <SettingHeader
        title={'Auto Close Streams'}
        descr={'Streams windows close after going offline. (StreamLuv Windows Only)'}/>
        <ToggleSetting 
        setting={ {name: 'autoclose', value: settings.autoclose} } 
        on:newsetting={changeSettings}/>
        <!-- Mute Toggle Shortcut -->
        <SettingHeader
        title={'Mute Shortcut'}
        descr={'Set a global hotkey to toggle the mute of the most recently active StreamLuv Window'}/>
        <ShortcutPicker
        setting={ {
            label: 'Mute Shortcut:',
            name: 'muteshortcut',
            value: settings.muteshortcut
        } }
        on:newsetting={changeSettings}/>
        <!-- Cycle Streams Shortcut -->
        <SettingHeader
        title={'Cycle Streams Shortcut'}
        descr={'Set a global hotkey for cycle the focus of open StreamLuv Windows'}/>
        <ShortcutPicker
        setting={ {
            label: 'Cycle Shortcut:',
            name: 'cycleshortcut',
            value: settings.cycleshortcut
        } }
        on:newsetting={changeSettings}/>
        <!-- Auto Theater -->
        <SettingHeader
        title={'BTTV'}
        descr={'Enable Better Twitch TV on StreamLuv Windows'}/>
        <ToggleSetting
        setting={ {name: 'bttv', value: settings.bttv} } 
        on:newsetting={changeSettings}/>
    </div>
    {/if}
</div>