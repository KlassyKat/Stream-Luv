<script lang="ts">
    import TopBar from './components/TopBar.svelte';
    import { ControlBtn } from "./types/types";
    
    const { remote, ipcRenderer } = require('electron');

    //Set window name
    let name = remote.getCurrentWindow().title;
    ipcRenderer.on('change-title', (e, data) => {
        name = data;
    });

    //Window Controls
    let backBtn: ControlBtn = {
		svg: `<svg viewBox="0 0 32 32">
                <path d="M22,28l-12,-12l12,-12" style="fill:none;stroke-width:4.2px;" />
            </svg>`,
		control: () => {
			remote.getCurrentWindow().getBrowserView().webContents.goBack();
		}
	}

    let forwardBtn: ControlBtn = {
		svg: `<svg viewBox="0 0 32 32">
                <path d="M14,28l12,-12l-12,-12" style="fill:none;stroke-width:4.2px;" />
            </svg>`,
		control: () => {
			remote.getCurrentWindow().getBrowserView().webContents.goForward();
		}
	}

    let soundBtn: ControlBtn = {
		svg: `<svg viewBox="0 0 32 32"
                style="stroke-linejoin:round;">
                <path
                    d="M18.624,0.958c0,-0.379 -0.234,-0.724 -0.6,-0.877c-0.364,-0.153 -0.787,-0.085 -1.081,0.172c-2.964,2.607 -8.809,7.75 -8.809,7.75c0,0 -4.31,0.109 -6.655,0.169c-0.823,0.021 -1.479,0.664 -1.479,1.452l0,12.92c0,0.802 0.681,1.453 1.519,1.453l6.615,0c0,0 5.845,5.143 8.809,7.75c0.294,0.257 0.717,0.325 1.081,0.172c0.366,-0.153 0.6,-0.498 0.6,-0.877l0,-30.084Zm-9.232,10.011l-6.257,0.159l0,9.871l6.221,0l6.135,5.398l0,-20.794l-6.099,5.366Z" />
                <path
                    d="M20.987,2.425c6.229,0.955 11.013,6.486 11.013,13.157c0,6.671 -4.784,12.202 -11.013,13.157l0,-3.783c4.22,-0.911 7.393,-4.764 7.393,-9.374c0,-4.61 -3.173,-8.464 -7.393,-9.374l0,-3.783Z" />
                <path
                    d="M21.037,8.933c3.033,0.82 5.258,3.488 5.258,6.649c0,3.161 -2.225,5.829 -5.258,6.648l0,-3.669c1.032,-0.624 1.718,-1.726 1.718,-2.979c0,-1.254 -0.686,-2.355 -1.718,-2.98l0,-3.669Zm-9.178,6.252l0,0.794c-0.008,-0.131 -0.012,-0.264 -0.012,-0.397c0,-0.134 0.004,-0.266 0.012,-0.397Z" />
            </svg> `,
        svg_toggle: `<svg viewBox="0 0 32 32"
                        style="stroke-linejoin:round;">
                        <path
                            d="M18.624,0.958c0,-0.379 -0.234,-0.724 -0.6,-0.877c-0.364,-0.153 -0.787,-0.085 -1.081,0.172c-2.964,2.607 -8.809,7.75 -8.809,7.75c0,0 -4.31,0.109 -6.655,0.169c-0.823,0.021 -1.479,0.664 -1.479,1.452l0,12.92c0,0.802 0.681,1.453 1.519,1.453l6.615,0c0,0 5.845,5.143 8.809,7.75c0.294,0.257 0.717,0.325 1.081,0.172c0.366,-0.153 0.6,-0.498 0.6,-0.877l0,-30.084Zm-9.232,10.011l-6.257,0.159l0,9.871l6.221,0l6.135,5.398l0,-20.794l-6.099,5.366Z" />
                        <path d="M29.378,11.931l-8.138,8.138" style="fill:none;stroke-width:3.43px;" />
                        <path d="M21.24,11.931l8.138,8.138" style="fill:none;stroke-width:3.43px;" />
                    </svg> `,
        toggle_trigger: remote.getCurrentWindow().getBrowserView().webContents.isAudioMuted(),
		control: () => {
            toggleMute();
		}
	}

    ipcRenderer.on('toggle-mute', () => {
        toggleMute();
    });
    function toggleMute() {
        let mute = remote.getCurrentWindow().getBrowserView().webContents.isAudioMuted();
        soundBtn.toggle_trigger = !mute;
        remote.getCurrentWindow().getBrowserView().webContents.setAudioMuted(!mute);
        controls = [...controls];
    }

    let minBtn: ControlBtn = {
		svg: `<svg viewBox="0 0 32 32" style="stroke-width:5">
                <line x1="0" y1="17" x2="32" y2="17" />
            </svg>`,
		control: () => {
			remote.getCurrentWindow().minimize();
		}
	}

    let maxBtn: ControlBtn = {
		svg: `<svg viewBox="0 0 32 32">
                <rect x="0" y="4" width="29" height="7" />
                <rect x="0" y="4" width="4" height="24" />
                <rect x="0" y="24" width="29" height="4" />
                <rect x="28" y="4" width="4" height="24" />
            </svg>`,
		control: () => {
			remote.getCurrentWindow().maximize();
		}
	}

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
        backBtn,
        forwardBtn,
        soundBtn,
		minBtn,
        maxBtn,
		closeBtn
	];

    let autoclose= true;
</script>
<style>

</style>

<div class="stream-window">
    <TopBar name={name} buttons={controls}/>
</div>
