const {
	app,
	BrowserWindow,
	Tray,
	ipcMain,
	BrowserView, 
	Menu,
	session,
	shell,
	globalShortcut
} = require('electron');
const path = require('path');
const Store = require('electron-store');
const store = new Store();

const fetch = require('node-fetch');
const fs = require('fs');


const windowStateKeeper = require('electron-window-state');
const contextMenu = require('electron-context-menu');
// const { globalShortcut } = require('electron/main');

// Live Reload
require('electron-reload')(__dirname, {
	electron: path.join(__dirname, '../node_modules', '.bin', 'electron'),
	awaitWriteFinish: true
})

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
	// eslint-disable-line global-require
	app.quit()
}

let mainWindow;
let addWindow;
// let settingWindow;
let supportWindow;
let infoWindow;
let mainWindowState;
let streamWindowState;
const iconPath = `${__dirname}/build_resources/icon.ico`;
let tray = null;
let pauseShortcut;

const createWindow = () => {
	// Create the browser window.
	mainWindowState = windowStateKeeper({
		maximize: false
	});

	streamWindowState = windowStateKeeper({
		maximize: true,
		defaultHeight: 600,
		defaultWidth: 1000
	});

	mainWindow = new BrowserWindow({
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true,
		},
		x: mainWindowState.x,
		y: mainWindowState.y,
		width: 450,
		height: 570,
		resizable: false,
		frame: false,
		backgroundColor: '#212121',
		icon: iconPath
	});

	// and load the index.html of the app.
	mainWindow.loadFile(path.join(__dirname, '../public/index.html'));

	mainWindowState.manage(mainWindow);

	//Load Streams
	mainWindow.webContents.on('did-finish-load', () => {
		sendStreams();
	});
	
	// Creates global shortcut on app start
	//registerMuteShortcut(store.get('settings.muteshortcut') || ["Ctrl", "'"]);
	registerMuteShortcuts();
	setLoginName();

	// mainWindow.webContents.openDevTools();
};


class AppTray {
	constructor() {
		this.tray = new Tray(iconPath);
		let template = [{
			label: 'Open',
			click: () => mainWindow.show()
		},
		{
			label: 'Pause',
			click: () => {
				store.set('settings.pause', !store.get('settings.pause'));
				this.checked = store.get('settings.pause');
				mainWindow.webContents.send('send-pause', store.get('settings.pause'));
			},
			type: 'checkbox',
			checked: store.get('settings.pause')
		},
		{
			type: 'separator'
		},
		{
			label: 'Quit StreamLuv',
			click: () => {
				mainWindow.destroy();
				app.quit();
			}
		}];

		this.trayMenu = Menu.buildFromTemplate(template);
		this.tray.setContextMenu(this.trayMenu);
		this.tray.setToolTip('StreamLuv');
	}

	pauseToggle(data) {
		this.trayMenu.items[1].checked = data;
		this.tray.setContextMenu(this.trayMenu);
	}
}

app.on('ready', () => {
	saveSettings(getSettings());
	createWindow();
	tray = new AppTray();
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

//Add Window
ipcMain.on("open-add-window", () => {
	addWindow = new BrowserWindow({
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			spellcheck: false,
			enableRemoteModule: true
		},
		modal: true,
		x: mainWindowState.x - 25,
		y: mainWindowState.y + 150,
		width: 500,
		height: 385,
		backgroundColor: "#1c1c1c",
		frame: false,
		parent: mainWindow,
		show: false,
		resizable: false
	});

	addWindow.loadFile(path.join(__dirname, '../public/addWindow.html'));
	// addWindow.loadFile(`${__dirname}/../public/addWindow.html`);
	addWindow.on('ready-to-show', () => {
		addWindow.show();
	});

	addWindow.on('closed', () => {
		addWindow = null;
	});

	// addWindow.webContents.openDevTools();
});

ipcMain.on('add-stream', (e, data) => {
	sendStreams(data);
});

ipcMain.on('remove-stream', (e, data) => {
	let streamers = store.get("streamers");
	delete streamers[data];
	store.set("streamers", streamers);
});

function sendStreams(stream = null) {
	let streamers = store.get("streamers") || {};
	if(stream) {
		streamers[stream.id] = stream;
	}
	store.set("streamers", streamers);
	mainWindow.webContents.send('streams', streamers);
}
ipcMain.on('sort-streams', (e, data) => {
	sortStreams(data);
})
function sortStreams(order) {
	let streamers = store.get("streamers");
	let newStreamers = {};
	for(let stream of order) {
		newStreamers[stream] = streamers[stream];
	}
	store.set("streamers", newStreamers);
}

ipcMain.on("open-login", (e, hidden) => {
	let loginWindow = new BrowserWindow({
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
			contextIsolation: false
		},
		width: 400,
		height: 477,
		x: mainWindowState.x - 25,
		y: mainWindowState.y + 150,
		backgroundColor: '#212121',
		frame: false,
		show: !hidden,
		resizable: false,
		modal: true,
		parent: mainWindow
	});

	let loginView = new BrowserView();
	loginWindow.setBrowserView(loginView);
	loginView.setBounds({
		x: 0,
		y: 32,
		width: 400,
		height: 445
	});
	loginView.webContents.loadURL('https://id.twitch.tv/oauth2/authorize?client_id=hmwwy19mo3zzxu17lmualmudycyora&redirect_uri=https://streamluv.me/authorized&response_type=code&scope=openid');
	loginWindow.loadFile(path.join(__dirname, '../public/login.html'));

	loginWindow.on('closed', () => {
		loginWindow = null;
		loginView = null;
	});

	loginView.webContents.on('did-navigate', (e, url) => {
		handleCallback(url);
	});

	function handleCallback(url) {
		console.log(url);
		let codeIndex = url.indexOf('code=');
		let andIndex = url.indexOf('&');
		if(codeIndex > -1) {
			let code = url.slice(codeIndex + 5, andIndex);
			let body = {code};
			fetch('https://streamluv.me/api/v1/login', {
				method: 'POST',
				body: JSON.stringify(body),
				headers: { 'Content-Type': 'application/json' }
			})
			.then(res => res.json())
			.then(json => {
				console.log(json)
				loginWindow.webContents.send("new-token", {accessToken: json.access_token, visible: hidden});
				setLoginName();
			})
		}
	};
	// loginWindow.webContents.openDevTools();
});

function setLoginName() {
	session.defaultSession.cookies.get({})
	.then(cookies => {
		for(let cookie of cookies) {
			if (cookie.name == "name") {
				let settings = getSettings();
				settings.login = cookie.value;
				saveSettings(settings);
			}
		}
	});
}


//Stream Window
let focusList = []; //Array of most recntly focused windows
class Stream {
	constructor(name) {
		this.name = name;
		this.history = [name];
		this.window = new BrowserWindow({
			webPreferences: {
				nodeIntegration: true,
				enableRemoteModule: true,
				spellcheck: true,
				contextIsolation: false
			},
			minWidth: 920,
			minHeight: 400,
			frame: false,
			backgroundColor: "#1d1d1d",
			title: name
		});
		this.view = new BrowserView();
	}

	init() {
		let window = this.window;
		let view = this.view;
		//Set view
		this.setView();
		view.setBounds({
			x: 0,
			y: 0,
			width: window.getSize()[0],
			height: window.getSize()[1] -32
		});
		view.webContents.setAudioMuted(store.get("settings.startmuted"));
		view.webContents.loadURL(`https://www.twitch.tv/${this.name}`);
		
		//Remap ctrl r to reload twitch instead of window
		let windowMenuTemplate = [
			{
				label: 'Reload',
				accelerator: 'CmdOrCtrl+R',
				click: () => {
					view.webContents.reload();
				}
			},
			{
				label: 'Inspect',
				accelerator: 'CmdOrCtrl+Shift+I',
				click: () => {
					view.webContents.inspectElement(0, 0);
				}
			}
		];

		let windowMenu = Menu.buildFromTemplate(windowMenuTemplate);
		window.setMenu(windowMenu);
		window.loadFile(`${__dirname}/../public/streamWindow.html`);

		//Create context Menu
		contextMenu({
			window: view,
			showInspectElement: true
		})

		//Handle Window Resizing
		window.on('maximize', () => {
			let newBounds = window.getBounds();
			newBounds.width = newBounds.width - 16;
			newBounds.height = newBounds.height - 16;
			view.setBounds({
				x: 0,
				y: 32,
				width: newBounds.width,
				height: newBounds.height - 32
			});
		});

		window.on('resize', () => {
			let newBounds = window.getBounds();
			newBounds.width = newBounds.width;
			newBounds.height = newBounds.height;
			view.setBounds({
			  x: 0,
			  y: 32,
			  width: newBounds.width,
			  height: newBounds.height - 32
			});
		});

		//Create Event Handlers
		//Navigaton Outside of twitch opens in external browser
		view.webContents.on('did-navigate-in-page', (e, url) => {
			console.log('Navigate in page');
			let nameStart = url.indexOf('/', 16);
			let nameEnd = url.lastIndexOf('?');
			let streamName;
			if(nameEnd > -1) {
				streamName = url.slice(nameStart + 1, nameEnd);
			} else {
				streamName = url.slice(nameStart + 1);
			}

			console.log(streamName);
	
			if(url.includes('www.twitch.tv') && !url.includes('www.twitch.tv/videos')) {//could navigate to another channels videos
				streamName = decodeURIComponent(streamName);
				console.log(streamName);
				try {
					let oldName = window.getTitle();
					if(streamName == oldName) {
						return;
					}
					streamWindows[streamName] = streamWindows[oldName];
					delete streamWindows[oldName];
					streamWindows[streamName].name = streamName;
					streamWindows[streamName].history.push(streamName);
					let focusIndex = focusList.indexOf(oldName);
					focusList.splice(focusIndex, 1, streamName);
					window.setTitle(streamName);
					console.log(focusList);

					window.webContents.send('change-title', streamName);

					console.log(streamWindows);
					console.log(focusIndex);
				} catch(err) {
					return;
				}
			}
		});

		view.webContents.on('new-window', (e, url) => {
			e.preventDefault();
			shell.openExternal(url);
		});

		//Refresh Stream Crashes
		view.webContents.on('media-paused', () => {
			console.log('Make crash check and refresh function here');
		});

		//Add to focus list
		window.on('focus', () => {
			this.addToFocusList(window.title);
		});

		//Properly Close Stream
		window.on('close', (e) => {
			e.preventDefault();
			this.removeFromFocusList(window.title);
			this.closeStream();
		});

		this.addToFocusList(window.title);

		// Enable BTTV Extension
		if(store.get('settings.bttv')) {
			view.webContents.on('dom-ready', (e) => {
				let bttvScript = fs.readFileSync(`${__dirname}/../public/bttv/betterttv.js`, 'utf8');
				bttvScript = bttvScript.toString();
				let bttvStyle = fs.readFileSync(`${__dirname}/../public/bttv/betterttv.css`, 'utf8');
				bttvStyle = bttvStyle.toString();
				view.webContents.insertCSS(bttvStyle);
				view.webContents.executeJavaScript(bttvScript);
			})
		}
	}

	//Set View function to allow flexability of addView later
	setView() {
		this.window.setBrowserView(this.view);
	}

	// Put on top of focus list
	addToFocusList(name) {
		if(focusList.includes(name)) {
			let startIndex = focusList.indexOf(name);
			focusList.splice(startIndex, 1);
			focusList.unshift(name);
		} else {
			focusList.unshift(name);
		}
	}

	removeFromFocusList(name) {
		let startIndex = focusList.indexOf(name);
		focusList.splice(startIndex, 1);
	}

	muteWindow() {
		this.view.webContents.setAudioMuted(!this.view.webContents.isAudioMuted());
	}

	//Properly Close the stream window and clear it from memory
	closeStream() {
		console.log("Closing " + this.name);
		focusList = focusList.filter(item => {
			if(item != this.name) {
				return item;
			}
		});
		this.view.webContents?.destroy();
		this.window.destroy();
		delete streamWindows[this.name];
	}

	startAutoClose() {
		this.autoclose = setTimeout(() => {
			this.closeStream();
		}, 305000, this);
	}

	openAutoClose() {
		this.autoCloseModal = new BrowserWindow({
			webPreferences: {
				contextIsolation: false,
				enableRemoteModule: true,
				nodeIntegration: true
			},
			title: this.name,
			width: 400,
			height: 200,
			backgroundColor: '#1c1c1c',
			resizable: false,
			frame: false,
			modal: true,
			parent: this.window
		});

		this.autoCloseModal.loadFile(`${__dirname}/../public/streamModal.html`);
		this.startAutoClose();
		// this.autoCloseModal.webContents.openDevTools();
	}

	cancelAutoClose() {
		clearTimeout(this.autoclose);
		this.autoclose = null;
	}

	//Open Dev Tools
	devTools() {
		this.window.webContents.toggleDevTools();
	}
}

let streamWindows = {};
ipcMain.on('open-stream', (e, {name, method}) => {
	for(let stream in streamWindows) {
		if(name == stream && method != 'browser') {
			streamWindows[name].window.focus();
			store.set(`streamers.${name}.streamopen`, true); //redundancy
			return;
		}
	}
	//Pause stream Opening
	if(store.get('settings.pause')) {
		return;
	}
	store.set(`streamers.${name}.streamopen`, true);
	if(method == "browser") {
		shell.openExternal("https://www.twitch.tv/" + name);
		return;
	}
	sendStreams();
	if(method == "auto") {
		if(store.get("settings.autoopentype") == "browser") {
			shell.openExternal("https://www.twitch.tv/" + name);
			return;
		}
	} else if(method == "manual") {
		if(store.get("settings.linktype") == "browser") {
			shell.openExternal("https://www.twitch.tv/" + name);
			return;
		}
	}
	streamWindows[name] = new Stream(name);
	streamWindows[name].addToFocusList(name);
	streamWindows[name].init();
	// streamWindows[name].devTools();
	sendStreams();

});


ipcMain.on('close-stream', (e, id) => { //errors and loops error
	try {
		streamWindows[id].closeStream();
	} catch (err) {
		console.log('cannont close', id);
	}
});

ipcMain.on('auto-close-stream', (e, name) => {
	console.log('autoclose:' + name);
	for(stream in streamWindows) {
		console.log(stream);
		stream = streamWindows[stream];
		console.log(stream);
		if(stream?.history.includes(name)) {
			stream.openAutoClose();
			return;
		}
	}
});

ipcMain.on('cancel-auto-close', (e, name) => {
	console.log(name);
	for(let stream in streamWindows) {
		stream = streamWindows[stream];
		if(stream?.name == name) {
			console.log(stream);
			stream.cancelAutoClose();
		}
	}
})

ipcMain.on('save-streamers', (e, streamers) => {
	let newStreamers = {};
	for(let streamer of streamers) {
		newStreamers[streamer.id] = streamer;
	}
	store.set("streamers", newStreamers);
})


//Settings page
function getSettings() {
	let settings = store.get("settings") || {
		login: "",
		startmuted: false,
		linktype: "streamluv",
		autoopentype: "streamluv",
		pause: false,
		muteshortcut: [],
		bttv: true,
		autoclose: false,
		cycleshortcut: []
	};
	return settings;
}

function saveSettings(settings) {
	let oldSettings = getSettings();
	store.set("settings", settings);
	if(oldSettings.muteshortcut != settings.muteshortcut) {
		registerMuteShortcuts();
	}
}

let shortcutList = {};
class GlobalShortcut {
	constructor(name, shortcut, action) {
		this.name = name;
		this.shortcut = shortcut.join('+');
		this.action = action;
	}

	register() {
		globalShortcut.register(this.shortcut, this.action);
	}
}

function registerMuteShortcuts() {
	let shortcuts = [
		{
			name: 'muteshortcut',
			shortcut: store.get('settings.muteshortcut'),
			action: () => {
				let muteState = streamWindows[focusList[0]].view.webContents.isAudioMuted();
				if(muteState) {
					for(let stream in streamWindows) {
						stream = streamWindows[stream];
						if(!stream.view.webContents.isAudioMuted()) {
							stream.window.webContents.send('toggle-mute');
						}
					}
				}
				streamWindows[focusList[0]].window.webContents.send('toggle-mute');
			}
		},
		{
			name: 'cycleshortcut',
			shortcut: store.get('settings.cycleshortcut'),
			action: () => {
				let focusItem = focusList[focusList.length-1];
				streamWindows[focusItem].window.focus();
			}
		}
	]
	globalShortcut.unregisterAll();
	for(let item of shortcuts) {
		let {name, shortcut, action} = item;
		if(!shortcut.length > 0) {
			return;
		}
		shortcutList[name] = new GlobalShortcut(name, shortcut, action);
		shortcutList[name].register();
	}

	// let muteShortcut = store.get("settings.muteshortcut");
	// if(!muteShortcut.length > 0) {
	// 	return;
	// }

	// let ctrlIndex = muteShortcut.indexOf('Ctrl');
	// if(ctrlIndex > -1) {
	// 	muteShortcut[ctrlIndex] = 'CmdOrCtrl';
	// }
	
	// muteShortcut = muteShortcut.join('+');
	// globalShortcut.register(muteShortcut, () => {
	// 	let muteState = streamWindows[focusList[0]].view.webContents.isAudioMuted();
	// 	if(muteState) {
	// 		for(let index of focusList) {
	// 			if(!streamWindows[index].view.webContents.isAudioMuted()) {
	// 				streamWindows[index].window.webContents.send('toggle-mute');
	// 			}
	// 		}
	// 	}
	// 	streamWindows[focusList[0]].window.webContents.send('toggle-mute');
	// });
};



ipcMain.on('toggle-pause', () => {
	store.set('settings.pause', !store.get('settings.pause'));
	tray.pauseToggle(store.get('settings.pause'));
	mainWindow.webContents.send('send-pause', store.get('settings.pause'));
});

ipcMain.on('get-pause', () => {
	mainWindow.webContents.send('send-pause', store.get('settings.pause'));
})



let settingWindow
ipcMain.on("open-settings", () => {
	settingWindow = new BrowserWindow({
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true,
			contextIsolation: false,
			spellcheck: false
		},
		modal: true,
		width: 500,
		height: 600,
		resizable: false,
		backgroundColor: '#1c1c1c',
		frame: false,
		parent: mainWindow,
		show: false
	});

	settingWindow.loadFile(`${__dirname}/../public/settings.html`);
	settingWindow.on('ready-to-show', () => {
		settingWindow.show();
	});

	settingWindow.on('closed', () => {
		settingWindow = null;
	});

	//Page events
	ipcMain.on('get-settings', () => {
		let settings = getSettings();
		settingWindow.webContents.send('send-settings', settings);
	});

	ipcMain.on('save-settings', (e, settings) => {
        saveSettings(settings);
    });
	

	// settingWindow.webContents.openDevTools();
});


//Selectors

//Crash reload btn
//#root > div > div.tw-flex.tw-flex-column.tw-flex-nowrap.tw-full-height > div > main > div.channel-root__scroll-area--theatre-mode.scrollable-area.scrollable-area--suppress-scroll-x > div.simplebar-scroll-content > div > div > div.persistent-player.persistent-player--theatre.tw-elevation-0 > div > div.video-player > div > div > div > div.content-overlay-gate.player-overlay-background.player-overlay-background--darkness-0.tw-absolute.tw-align-items-center.tw-bottom-0.tw-c-text-overlay.tw-flex.tw-flex-column.tw-justify-content-center.tw-left-0.tw-right-0.tw-top-0 > div > div.content-overlay-gate__allow-pointers.tw-mg-t-3 > button > div > div.tw-align-items-center.tw-flex.tw-flex-grow-0.tw-justify-content-start

