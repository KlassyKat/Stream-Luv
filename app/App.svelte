<script lang="ts">
	import TopBar from './components/TopBar.svelte';
	import StreamTile from './components/StreamTile.svelte';
	import Message from './components/Message.svelte';
	import { ControlBtn, Stream, OpenType } from "./types/types";
	const { remote, ipcRenderer, shell } = require('electron');
	const { Menu, MenuItem } = remote;
	import Sortable from 'sortablejs';

	const axios = require('axios');

	//AUTH TODO
	////Make refresh token endpoint on server https://dev.twitch.tv/docs/authentication/#refreshing-access-tokens
	////On app start call function
	////Make timeout the calls function based on expiration value from callbackk return for current and new endpoint
	////Call fuction on 401 errors not refresh function get new token
	//make logout in setting

	//TODO
	//Priority order
	//Auto collect
	//auto theater
	//auto predictions?
	////auto close
	//make auto close toggle setting
	//set all is live to false on close
	//make context menu in streamwindow
	// Cancelable auto close message

	ipcRenderer.on('set-user', () => {
		let login = document.cookie;
		console.log(login);
	});

	let streamers: Stream[] = [];
	// Rearrange Tile Functionality
	function createTileSort(el) {
		new Sortable(el, {
			animation: 150,
			ghostClass: 'ghost-class',
			onEnd: () => {
				let newOrder: string[] = [];
				for(let tile of el.children) {
					newOrder.push(tile.id);
				}
				ipcRenderer.send('sort-streams', newOrder);
			}
		})
	};

		//Authentication
	let loggedIn = null;
	let apiErrors;
	remote.session.defaultSession.cookies.get({}).then(cookies => {
		for(let cookie of cookies) {
			if (cookie.name == "name") {
				loggedIn = cookie;
				return;
			} else {
				loggedIn = null;
			}
		}
	});
	let isAuthenticated = localStorage.getItem("access_token");
	function login(hidden = false) {
		ipcRenderer.send("open-login", hidden);
	}
	ipcRenderer.on("authenticated", () => {
		isAuthenticated = localStorage.getItem("access_token");
		console.log(isAuthenticated);
		checkLive();
	});

	// Repeated Function to check stream live states
	let liveCheckTimeout; //Keep multiple timeouts from being created
	function checkLive () {
		let calls = [];
		clearInterval(liveCheckTimeout);
		for(let id of streamers.map(stream => stream.id)) {
			let call = axios.get(`https://api.twitch.tv/helix/streams?user_login=${id}`, {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
					'Client-ID': 'hmwwy19mo3zzxu17lmualmudycyora'
				}
			});
			calls.push(call);
		};
		Promise.all(calls).then(streams => {
				let liveStreams = [];
				for(let stream of streams) {
					stream = stream.data.data[0];
					if(stream) {
						liveStreams.push(stream.user_login);
					}
				}
				for(let streamer of streamers) {
					if(liveStreams.includes(streamer.id)) {
						streamer.live = true;
						if(streamer.autoopen && !streamer.streamopen) {
							openStream({
								id: streamer.id,
								type: "auto"
							})
						}
					} else {
						if(streamer.streamopen == true) {
							console.log('set stream off');
							setTimeout(setStreamOpenFalse, 300000, streamer.id);
							startAutoClose(streamer.id);
						}
						streamer.live = false;
					}
				}
				//Make svelte update
				apiErrors = false;
				streamers = [...streamers];
			}).catch((err) => {
				if(err.response.status == 401) {
					apiErrors = true;
					login(true);
				}
			});
		liveCheckTimeout = setTimeout(checkLive, 90000);
		console.log("Set timeout");
	}

	function nameClick(data) {
		openStream({
			id: data.detail.id,
			type: "manual"
		});
	}
	function openStream(data) {
		let {id, type}: {id: string, type: OpenType} = data;
		
		ipcRenderer.send('open-stream', {
			name: id,
			method: type
		});
	}
	function toggleAutoOpen(data) {
		let {id, value} = data.detail;
		for(let streamer of streamers) {
			if(streamer.id == id) {
				streamer.autoopen = value;
				if(value && streamer.live && !streamer.streamopen) {
					console.log('try open');
					openStream({id: streamer.id, type: "auto"});
				}
			}
		}
		addMessage(`${value ? 'Now' : 'No longer'} auto opening ${id}`);
		saveStreamers();
	}

	function toggleAutoCollect(data) {
		let {id, value} = data.detail;
		for(let stream of streamers) {
			if(stream.id == id) {
				stream.autocollect = value;
			}
		}
		streamers = [...streamers];
		saveStreamers();
		addMessage(`Collecting ${id}`);
	}

	function setStreamOpenFalse(name) {
		for(let streamer of streamers) {
			if(streamer.id == name) {
				streamer.streamopen = false;
			}
		}
		saveStreamers();
	}

	function startAutoClose(name) {
		ipcRenderer.send('auto-close-stream', name);
	}

	function saveStreamers() {
		ipcRenderer.send('save-streamers', streamers);
	}

	let paused: boolean;
	ipcRenderer.send('get-pause');
	ipcRenderer.on('send-pause', (e, data) => {
		console.log(data);
		paused = data;
		pauseBtn.toggle_trigger = paused;
		controls = [...controls];
	});
	console.log(paused);
	let pauseBtn: ControlBtn = {
		svg: 
			`<svg viewBox="0 0 32 32" id="pause-auto">
				<rect x="4" y="2" width="6" height="28" />
				<rect x="22" y="2" width="6" height="28" />
			</svg>`,
		svg_toggle: 
			`<svg viewBox="0 0 32 32" id="play-auto">
                <path d="M28,16l-24,14l0,-28l24,14Z" />
            </svg>`,
		toggle_trigger: paused,
		control: () => {
			ipcRenderer.send('toggle-pause');
		}
	}

	let settingBtn: ControlBtn = {
		svg: `<svg viewBox="0 0 32 32">
                <path
                    d="M32,16v-4l-4.781-1.992c-0.133-0.375-0.273-0.738-0.445-1.094l1.93-4.805L25.875,3.25   l-4.762,1.961c-0.363-0.176-0.734-0.324-1.117-0.461L17.969,0h-4l-1.977,4.734c-0.398,0.141-0.781,0.289-1.16,0.469l-4.754-1.91   L3.25,6.121l1.938,4.711C5,11.219,4.848,11.613,4.703,12.02L0,14.031v4l4.707,1.961c0.145,0.406,0.301,0.801,0.488,1.188   l-1.902,4.742l2.828,2.828l4.723-1.945c0.379,0.18,0.766,0.324,1.164,0.461L14.031,32h4l1.98-4.758   c0.379-0.141,0.754-0.289,1.113-0.461l4.797,1.922l2.828-2.828l-1.969-4.773c0.168-0.359,0.305-0.723,0.438-1.094L32,17.969z    M15.969,22c-3.312,0-6-2.688-6-6s2.688-6,6-6s6,2.688,6,6S19.281,22,15.969,22z" />
            </svg>`,
		control: () => {
			ipcRenderer.send("open-settings");
		}
	}

	let minBtn: ControlBtn = {
		svg: `<svg viewBox="0 0 32 32" style="stroke-width:5">
                <line x1="0" y1="17" x2="32" y2="17" />
            </svg>`,
		control: () => {
			remote.getCurrentWindow().minimize();
		}
	}

	let closeBtn: ControlBtn = {
		svg: `<svg viewBox="0 0 32 32" style="stroke-width:5">
                <line x1="2" y1="2" x2="30" y2="30" />
                <line x1="2" y1="30" x2="30" y2="2" />
            </svg>`,
		control: () => {
			remote.getCurrentWindow().hide();
		}
	}

	let controls: ControlBtn[] = [
		pauseBtn,
		settingBtn,
		minBtn,
		closeBtn
	];

	

	ipcRenderer.on("streams", (e, data) => {
		streamers = [];
		for(let stream in data) {
			let newStream = <Stream> data[stream];
			streamers = [...streamers, newStream];
		}
		console.log(streamers);
		checkLive();
	});

	function removeStream(name: string) {
		for(let stream in streamers) {
			if(streamers[stream].id == name) {
				streamers.splice(parseInt(stream), 1);
				streamers = [...streamers];
				//Save streamers
				ipcRenderer.send("remove-stream", name);
				return;
			}
		}
	}
	

	function openAddWindow() {
		ipcRenderer.send("open-add-window");
	}

	let elementClick: string;
	let menu = new Menu();
	menu.append(new MenuItem({
		label: "Open In Browser",
		click() {
			openStream({
				id: elementClick,
				type: 'browser'
			});
		}
	}));

	menu.append(new MenuItem({
		label: "Open In StreamLuv",
		click() {
			openStream({
				id: elementClick,
				type: 'streamluv'
			})
		}
	}));

	menu.append(new MenuItem({
		label: "Copy Link",
		click() {
			navigator.clipboard.writeText('https://www.twitch.tv/' + elementClick);
		}
	}));

	menu.append(new MenuItem({
		type: "separator"
	}));

	menu.append(new MenuItem({
		label: "Auto Point Collection",
		click() {
			console.log("toggle point collectiong");
		}
	}));

    menu.append(new MenuItem({
        type: 'separator'
    }))

	menu.append(new MenuItem({
		label: "Remove",
		click() {
			removeStream(elementClick);
		}
	}));


	function tileMenu(name) {
		elementClick = name.detail;
		menu.popup({
			window: remote.getCurrentWindow()
		})
	}

	//Messages
	let messages = [];
	function addMessage(message) {
		messages.push(message);
		messages = messages;
		setTimeout(removeMessage, 5000, message);

		function removeMessage(val) {
			messages = messages.filter(item => {
				if(item != val) {
					return item;
				}
			});
		}
	}


</script>

<style>
	/* Login */
	#twitch-login {
		display: flex;
		height: calc(80vh - 32px);
		align-items: center;
		justify-content: center;
	}

	#login-btn {
		background-color: #4100A1;
		border: none;
		height: 45px;
		color: white;
		font-size: 0.95em;
		font-weight: 600;
		display: flex;
		align-items: center;
		border-radius: 5px;
		transition: 0.2s all ease-in-out;
	}

	#login-btn > strong {
		padding-left: 5px;
		font-size: 1.2em;
	}

	#login-btn:hover,#login-btn:focus {
		background-color: #2a0068;
		cursor: pointer;
	}
	#stream-tile-wrapper {
		height: 450px;
		overflow-y: scroll;
		color: white;
		padding: 10px;
		background-color: #1a1a1a;
		margin-right: 5px;
	}


	.tile-list {
		display: grid;
		padding-left: 5px;
	}

	/* Add Stream Button */
	.add-btn-container {
		padding-top: 20px;
		padding-bottom: 20px;
		text-align: center;
	}

	button.add-stream {
		background-color: #ff8000;
		border: none;
		width: 75px;
		height: 40px;
		font-size: 2em;
		padding: 0px 0px 0px 0px;
		border-radius: 90px;
		outline: none;
		transition: 0.15s ease-in-out;
	}


	button.add-stream:hover {
		background-color: #994d00;
		transform: scale(1.03) translate(0, -1px);
		cursor: pointer;
	}

	.spinner-wrapper {
		width: 20vw;
		height: 20vw;
		border-top: 2vw solid #7e7e7e;
		border-right: 2vw solid transparent;
		animation: spinner 0.8s cubic-bezier(.36,.57,.67,.91) infinite;
		border-radius: 50%;
		margin: auto;
	}
	.spinner {
		width: 2vw;
		height: 2vw;
		border-radius: 50%;
		margin-left: 15.4vw;
		margin-top: 0.7vw;
		background-color: #7e7e7e;
	}
	@keyframes spinner {
		to {
			transform: rotate(360deg);
		}
	}
</style>

<main>
	<TopBar name={"Stream<span style='color:pink;font-weight:400'>Luv</span>"} buttons={controls}/>
	<!-- {#if cookie && apiError} -->
	{#if loggedIn && apiErrors}
	<div id="twitch-login">
		<div class="spinner-wrapper">
			<div class="spinner">
			</div>
		</div>
	</div>
	{:else if !loggedIn}
	<div id="twitch-login">
		<button on:click="{() => login(false)}" id="login-btn">
			<!-- Twitch Logo -->
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
			<!-- Twitch Logo -->
			<strong>Login</strong>
		</button>
	</div>
	{:else}
	<Message messages={messages}/>
	<div id="stream-tile-wrapper">
		<ul class="tile-list">
			{#each streamers as stream}
			{#if stream.live}
			<StreamTile stream={stream} on:menu="{tileMenu}" on:open="{nameClick}" on:toggle-auto-open="{toggleAutoOpen}"
			on:toggle-auto-collect="{toggleAutoCollect}" switchOn={false}/>
			{/if}
			{/each}
		</ul>
		<br>
		<ul class="tile-list" use:createTileSort>
			{#each streamers as stream}
			<StreamTile stream={stream} on:menu="{tileMenu}" on:open="{nameClick}" on:toggle-auto-open="{toggleAutoOpen}"
			on:toggle-auto-collect="{toggleAutoCollect}"/>
			{/each}
		</ul>
		<div class="add-btn-container">
            <button class="add-stream" on:click="{openAddWindow}">+</button>
        </div>
	</div>
	{/if}
</main>