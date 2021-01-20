'use strict';

const {
    app,
    BrowserWindow,
    ipcMain,
    Tray,
    Menu,
    shell,
    BrowserView,
    globalShortcut
} = require('electron');
const windowStateKeeper = require('electron-window-state');
const fs = require('fs');

const contextMenu = require('electron-context-menu');


let mainWindow;
let addStreamWindow;
let settingWindow;
let supportWindow;
let infoWindow;
let mainWindowState;
let streamWindowState;
const iconPath = `${__dirname}/buildResources/icon.ico`;
let tray = null;
let pauseShortcut;
let settings = {};

app.allowRendererProcessReuse = true;
app.disableHardwareAcceleration();
//This good?
app.commandLine.appendSwitch("disable-renderer-backgrounding");

app.on('ready', () => {
    //Main Window
    mainWindowState = windowStateKeeper({
        maximize: false
    });

    streamWindowState = windowStateKeeper({
        maximize: true
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
        resizeable: false,
        frame: false,
        backgroundColor: '#212121',
        icon: './buildResources/icon.ico'
    });
    mainWindow.setResizable(false); //Workaround
    mainWindow.loadFile(`${__dirname}/main.html`);

    //Listen to window state
    mainWindowState.manage(mainWindow);

    //Tray
    if(process.platform == "win32" || process.platform == "darwin") {
        tray = new Tray(iconPath);
        //Menu Template
        let template = [{
                label: 'Open',
                click: () => mainWindow.show()
            },
            {
                label: 'Pause',
                click: () => {
                    mainWindow.webContents.send('pause-auto');
                },
                type: 'checkbox',
                checked: false
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
            }
        ];
        
        const contextMenu = Menu.buildFromTemplate(template);
        tray.setContextMenu(contextMenu);
        tray.setToolTip('Stream Luv');
        ipcMain.on('change-tray', (e, data) => {
            contextMenu.items[1].checked = data;
            // tray.setContextMenu(contextMenu);
        });
    }
});

//Mute Shortcut
ipcMain.on('new-mute-shortcut', (e, data) => {
    try {
        registerMuteShortcut(data);
    } catch(e) {
        return;
    }
});
let oldMuteShortcut;
function registerMuteShortcut(shortcut) {
    if(!shortcut) {
        shortcut = ['Ctrl', '\''];
    }
    let ctrlIndex = shortcut.indexOf('Ctrl') ;
    if(ctrlIndex > -1) {
        shortcut[ctrlIndex] = 'CmdOrCtrl';
    }

    shortcut = shortcut.join('+');
    if(pauseShortcut) {
        globalShortcut.unregister(oldMuteShortcut);
    }
    oldMuteShortcut = shortcut;
    pauseShortcut = globalShortcut.register(shortcut, () => {
        checkMuteStates();
    });
}
let lastFocus = [];
function checkMuteStates() {
    for(let stream in collectionWindows) {
        collectionWindows[stream].webContents.send('get-mute-val');
    }
    // if(audibleStreams.length == 0 && Object.keys(collectionWindows).length > 1 && lastFocus) {
    //     collectionWindows[stream].webContents.send('toggle-stream-mute');
    // }
    if(collectionWindows[lastFocus[0]]) {
        collectionWindows[lastFocus[0]].webContents.send('mute-shortcut');
    }
}

ipcMain.on('send-mute-val', (e, data) => {
});

ipcMain.on('recieved-focus', (e, data) => {
    addToFocusList(data);
});

function addToFocusList(payload) {
    if(lastFocus.includes(payload)) {
        let startIndex = lastFocus.indexOf(payload);
        lastFocus.splice(startIndex, 1);
        lastFocus.unshift(payload);
    } else {
        lastFocus.unshift(payload);
    }
}

function removeFromFocusList(payload) {
    let startIndex = lastFocus.indexOf(payload);
    lastFocus.splice(startIndex, 1);
}

//Auto Theater
async function autoTheaterFn(payload) {
    let page = await pie.getPage(browser, collectionViews[payload]);
    let theaterBtn = await findTheaterBtn();
    if(theaterBtn) {
        theaterBtn.click();
    }
    function findTheaterBtn() {
        let btn = null;
        while(!btn) {
            btn = page.$(".video-player__overlay div[data-a-target=player-controls] [data-a-target=player-theatre-mode-button]");
        }
        return btn;
    }
}


// Opening on startup
// https://www.electronjs.org/docs/api/shell#shellwriteshortcutlinkshortcutpath-operation-options-windows

//Open add stream window
ipcMain.on('open-stream-window', () => {
    addStreamWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        modal: true,
        x: mainWindowState.x - 25,
        y: mainWindowState.y + 150,
        width: 500,
        height: 175,
        backgroundColor: "#1c1c1c",
        frame: false,
        parent: mainWindow,
        show: false,
        resizable: false,
    });
    addStreamWindow.setResizable(false); //Workaround
    addStreamWindow.loadFile(`${__dirname}/addStreamWindow.html`);
    addStreamWindow.on('ready-to-show', () => {
        addStreamWindow.show();
    });

    addStreamWindow.on('focus', () => {
        loadStreamers();
    });

    addStreamWindow.on('closed', () => {
        addStreamWindow = null;
    });
});

//Open add stetting window
ipcMain.on('open-setting-window', () => {
    settingWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        modal: true,
        x: mainWindowState.x - 25,
        y: mainWindowState.y + 50,
        width: 500,
        height: 600,
        backgroundColor: "#1c1c1c",
        frame: false,
        parent: mainWindow,
        show: false
    });
    settingWindow.setResizable(false); //Workaround
    settingWindow.loadFile(`${__dirname}/settingWindow.html`);
    settingWindow.on('ready-to-show', () => {
        settingWindow.show();
    });

    settingWindow.on('focus', () => {
        loadSettings();
    });

    settingWindow.on('closed', () => {
        settingWindow = null;
    });
});

// ?????? It is completely unfathomable why this is here but it doesn't work without it
ipcMain.on('stream-added', () => {
    mainWindow.webContents.send('load-streams');
});

ipcMain.on('minimize-window', () => {
    mainWindow.minimize();
});

ipcMain.on('close-main-window', () => {
    mainWindow.hide();
    // mainWindow.close();
});

ipcMain.on('close-stream-window', () => {
    addStreamWindow.close();
});

ipcMain.on('close-setting-window', () => {
    settingWindow.close();
});


//SECTION
// Puppeteer Auto Channel Point Collection
let collectionWindows = {};
let collectionViews = {};
let collectionKeys = [];
// let collectionPages = {};
let collectionInterval = null;
let browser;
const pie = require('puppeteer-in-electron');
launchPuppeteer();
async function launchPuppeteer() {
    const puppeteer = require('puppeteer-core');
    //BTTV Base
    // let pathToExtension = `${app.getPath('home')}/AppData/Local/Google/Chrome/User Data/Default/Extensions/ajopnjidmegmdimjlfnijceegpefgped`
    // console.log(pathToExtension);
    // puppeteer.launch({
    //     headless: false,
    //     args: [
    //         `--disable-extensions-except=${pathToExtension}`,
    //         `--load-extension=${pathToExtension}`
    //     ]
    // })
    await pie.initialize(app);
    browser = await pie.connect(app, puppeteer);
}

ipcMain.on('open-auto-collect', async (e, args) => {
    // Type 1: for StreamLuv window
    // Type 2: Browser window with auto collect
    // Type 3: StreamLuv Window With auto collection
    let {
        type,
        id
    } = args;
    console.log(type);
    if(type == 1) {
        openWindow(id);
    } else if(type == 2) {
        console.log('We said f it');
    } else {
        if(collectionKeys.indexOf(id) < 0) {
            collectionKeys.push(id);
        }
        openWindow(id);
    }
    if(type == 3 || type == 2) {
        if(!collectionInterval) {
            collectionInterval = setInterval(autoCollect, 5000);
        }
    }
});

//Check auto collect in stream window
ipcMain.on('get-auto-collect-value', (e, data) => {
    if(collectionKeys.includes(data)) {
        collectionWindows[data].webContents.send('send-auto-collect-value', true);
    } else {
        collectionWindows[data].webContents.send('send-auto-collect-value', false);
    }
});

//Allows auto collection toggle from stream window
ipcMain.on('toggle-auto-collection', async (e, data) => {
    if(collectionKeys.indexOf(data) > -1) {
        let startIndex = collectionKeys.indexOf(data);
        collectionKeys.splice(startIndex, 1);
    } else {
        collectionKeys.push(data);
    }
    if(!collectionInterval && collectionKeys.length > 0) {
        collectionInterval = setInterval(autoCollect, 10000);
    }
});

//Stream Shell context menu


//SECTION Stream shell windows
// let startMuted = false;
let autoTheater = false;
async function openWindow(stream) {
    if (collectionWindows[stream]) {
        collectionWindows[stream].focus();
        return;
    }
    console.log(stream);
    let window = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            spellcheck: true
        },
        x: streamWindowState.x,
        y: streamWindowState.y,
        width: streamWindowState.width,
        height: streamWindowState.height,
        minWidth: 500,
        minHeight: 400,
        show: true,
        frame: false,
        backgroundColor: '#1d1d1d',
        title: stream
    });
    //Context Menu
    contextMenu({
        prepend: (defaultActions, params, window) => [
            {
                label: '?'
            }
        ]
    });
    let view = new BrowserView();
    window.setBrowserView(view);
    let viewAnchor = {
        x: 0,
        y: 32
    };
    view.setBounds({
        ...viewAnchor,
        width: streamWindowState.width,
        height: streamWindowState.height - 32
    });

    view.webContents.setAudioMuted(settings.startmuted);
    view.webContents.loadURL("https://www.twitch.tv/" + stream);

    view.webContents.on('new-window', (e, url) => {
        e.preventDefault();
        shell.openPath(url);
    });

    //www.twitch.tv/klassykat?refferal=raid
    //https://clips.twitch.tv/WonderfulSweetWoodcockJebaited/edit
    view.webContents.on('did-navigate-in-page', (e, url) => {
        // let nameStart = url.lastIndexOf('/');
        let nameStart = url.indexOf('/', 16);
        console.log(nameStart);
        let nameEnd = url.lastIndexOf('?');
        let streamName;
        if(nameEnd > -1) {
            streamName = url.slice(nameStart+1, nameEnd);
        } else {
            streamName = url.slice(nameStart+1);
        }
        console.log(url);

        if(url.includes('www.twitch.tv')) {
            streamName = decodeURIComponent(streamName);
            console.log(streamName);
            window.setTitle(streamName);
            window.webContents.send('new-page-title', streamName);
        }
    });

    view.webContents.on('context-menu', (e , params) => {
        window.webContents.send('right-click', {
            text: params.selectionText,
            link: params.srcURL
        });
    });

    //SECTION Set Auto Collect Page
    let windowMenuTemplate = [
        {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
                view.webContents.reload();
            }
        }
    ];
    let windowMenu = Menu.buildFromTemplate(windowMenuTemplate);
    window.setMenu(windowMenu);

    window.on('maximize', () => {
        let newBounds = window.getBounds();
        newBounds.width = newBounds.width - 16;
        newBounds.height = newBounds.height - 16;
        view.setBounds({
            ...viewAnchor,
            width: newBounds.width,
            height: newBounds.height - viewAnchor.y
        });
    });
    window.on('resize', () => {
        let newBounds = window.getBounds();
        view.setBounds({
            ...viewAnchor,
            width: newBounds.width,
            height: newBounds.height - viewAnchor.y
        });
    });

    window.on('hide', () => {
        console.log('Toodles UwU');
    });

    window.on('focus', (e) => {
        window.webContents.send('get-focus');
    });

    window.on('close', e => {
        window.webContents.send('proper-close');
    });

    await window.loadFile(`${__dirname}/streamWrapper.html`);
    window.webContents.send('page-title', stream);

    collectionWindows[stream] = window;
    collectionViews[stream] = view;
    streamWindowState.manage(window);

    addToFocusList(stream);

    if(autoTheater) {
        autoTheaterFn(stream);
    }

    streamPageSettings(window);
    
    //Debugging
    window.webContents.toggleDevTools();
}

//SECTION
//Stream Shell window control
ipcMain.on('history-back', (e, data) => {
    collectionViews[data].webContents.goBack();
});
ipcMain.on('history-forward', (e, data) => {
    collectionViews[data].webContents.goForward();
});
ipcMain.on('toggle-stream-mute', (e, data) => {
    collectionViews[data.window].webContents.setAudioMuted(data.val);
});
ipcMain.on('minimize-stream-shell', (e, data) => {
    collectionWindows[data].minimize();
});
ipcMain.on('maximize-stream-shell', (e, data) => {
    collectionWindows[data].isMaximized() ? collectionWindows[data].unmaximize() : collectionWindows[data].maximize();
});
ipcMain.on('close-stream-shell', async(e, data) => {
    await collectionWindows[data].close();
});
ipcMain.on('close-stream-alt', async(e, data) => {
    console.log('Close: ' + data);
    await collectionWindows[data].destroy();
    // await collectionViews[data].destroy();
    delete collectionWindows[data];
    delete collectionViews[data];
    if(collectionKeys.indexOf(data) > -1) {
        collectionKeys.splice(collectionKeys.indexOf(data), 1);
    }
    removeFromFocusList(data);
});

async function autoCollect() {
    console.log('Auto Collect: ' + collectionKeys);
    for(let i of collectionKeys) {
        let page = await pie.getPage(browser, collectionViews[i]);
        if(page) {
            console.log('Page: ' + i);
            let claimPoints = await page.$('.claimable-bonus__icon');
            if(claimPoints) {
                setTimeout(() => {
                    if (claimPoints) {
                        console.log("Points Claimed.");
                        claimPoints.click();
                    }
                }, 5000);
            }
        }
    }
    if(collectionKeys.length == 0) {
        clearInterval((collectionInterval));
        collectionInterval = null;
    }
}

let loginWindow, loginView;
ipcMain.on('twitch-login', async () => {
    loginWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        show: true,
        frame: false,
        width: 400,
        height: 477,
        alwaysOnTop: true,
        backgroundColor: '#1d1d1d',
        modal: true,
        parent: settingWindow,
        resizable: false
    });
    loginView = new BrowserView({
        backgroundColor: '#18181B'
    });
    loginWindow.setBrowserView(loginView);

    loginView.setBounds({
        x: 0,
        y: 32,
        width: 400,
        height: 445
    });

    loginView.webContents.on('will-navigate', async () => {
        try {
            await loginWindow.close();
            loginWindow = null;
            // await loginView.destroy();
            loginView = null;
            settingWindow.webContents.send('logged-in');
        } catch (error) {
            return;
        }
    });

    loginView.webContents.loadURL("https://www.twitch.tv/login");

    await loginWindow.loadFile(`${__dirname}/loginWrapper.html`);

    ipcMain.on('twitch-login-close', async () => {
        try {
            await loginWindow.close();
            loginWindow = null;
            // await loginView.destroy();
            loginView = null;
        } catch (error) {
            return;
        }
    });
});

//SECTION Twitch Logout
// let collectionPages = {};

ipcMain.on('twitch-logout', async (e, logout) => {
    let logoutWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        show: false
    });

    logoutWindow.webContents.setAudioMuted(true);

    await logoutWindow.loadURL('https://www.twitch.tv/directory/following');
    let logoutPage = await pie.getPage(browser, logoutWindow);

    switch (logout) {
        case "logout":
            console.log('Start Logout');
            await logoutPage.waitForSelector("img[alt='User Avatar']")
                .then(async () => {
                    logoutPage.click("img[alt='User Avatar']");

                    await logoutPage.waitForSelector("button[data-a-target='dropdown-logout']")
                        .then(async () => {
                            await logoutPage.click("button[data-a-target='dropdown-logout']");
                            // https://passport.twitch.tv/logout/new
                            await logoutPage.waitForResponse('https://id.twitch.tv/oauth2/revoke')
                                .then(() => {
                                    settingWindow.webContents.send('logout-success');
                                    console.log('logged out');
                                    closeLogout();
                                })
                                .catch((e) => {
                                    closeLogout();
                                    return;
                                });
                        });
                })
                .catch((e) => {
                    console.log(e);
                    closeLogout();
                    return;
                });
            break;
    case "get-user":
        // await logoutPage.waitForResponse('https://client-event-reporter.twitch.tv/v1/stats')
        await logoutPage.waitForSelector("img[alt='User Avatar']")
        .then(async () => {
            try {
                await logoutPage.click("img[alt='User Avatar']");
                let userName = await logoutPage.$eval("[data-a-target='user-display-name']", name => name.textContent);
                // mainWindow.webContents.send('user-name', userName);
                console.log(userName);
                settingWindow.webContents.send('user-name', userName);
                closeLogout();
        } catch (e) {
                // await mainWindow.webContents.send('user-name', false);
                closeLogout();
        }
        }).catch((e) => {
            console.log('timeout');
        });
        break;
    }


    async function closeLogout() {
        try {
            await logoutWindow.close();
            logoutWindow = null;
            // await logoutView.destroy();
            logoutView = null;
        } catch (error) {
            return;
        }
    }
});
//SECTION Setting Handlers
//Open on Startup
let AutoLaunch = require('auto-launch');
let appAutoLaunch = new AutoLaunch({
    name: 'StreamLuv',
    path: app.getAppPath()
});
ipcMain.on('set-startup-open', (e, data) => {
    if(data) {
        appAutoLaunch.enable();
    } else {
        appAutoLaunch.disable();
    }
});

//Start Muted
// ipcMain.on('set-start-muted', (e, data) => {
//     if(data) {
//         startMuted = true;
//     } else {
//         startMuted = false;
//     }
// })

//Auto Theater
ipcMain.on('set-auto-theater', (e, data) => {
    if(data) {
        autoTheater = true;
    } else {
        autoTheater = false;
    }
});


//SECTION Load Settings
// ipcMain.on('load-settings', (e, data) => {
//     if(data) {
//         startMuted = data.startmuted;
//         let muteShortcut = data.muteshortcut;
//         registerMuteShortcut(muteShortcut);
//         autoTheater = data.autotheater || false;
//     }
// })

ipcMain.on('open-support-window', () => {
    supportWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: 600,
        height: 300,
        backgroundColor: '#212121',
        frame: false
    });
    supportWindow.loadFile(`${__dirname}/support.html`);

    supportWindow.on('closed', () => {
        supportWindow = null;
    });
});

ipcMain.on('open-info-window', () => {
    infoWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: 600,
        height: 300,
        backgroundColor: '#212121',
        frame: false
    });
    infoWindow.loadFile(`${__dirname}/info.html`);

    infoWindow.on('closed', () => {
        infoWindow = null;
    });
});

ipcMain.on('close-support-window', () => {
    supportWindow.close();
});

ipcMain.on('close-info-window', () => {
    infoWindow.close();
});

//File System
const filePath = `${app.getPath('userData')}/streamers.json`;
ipcMain.on('get-streamers', () => {
    loadStreamers();
});
ipcMain.on('save-streamers', (e, file) => {
    saveStreamers(file);
}); 

function saveStreamers(file) {
    file = JSON.stringify(file);
    fs.writeFile(filePath, file, (err) => {
        if(err) {
            console.log(err);
        }
        console.log('Streamers Saved.');
    });
}

function loadStreamers() {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if(err) {
            console.log(err);
        }
        if(!data) {
            data = {};
        }
        BrowserWindow.getFocusedWindow().webContents.send('send-streamers', data);
    });
}

let settingsFilePath = `${app.getPath('userData')}/settings.json`;
ipcMain.on('get-settings', () => {
    loadSettings();
});
ipcMain.on('save-settings', (e, file) => {
    saveSettings(file);
}); 

function saveSettings(file) {
    file = JSON.stringify(file);
    fs.writeFile(settingsFilePath, file, (err) => {
        if(err) {
            console.log(err);
        }
        console.log('Settings Saved.');
        loadSettings();
    });
}

function loadSettings() {
    fs.readFile(settingsFilePath, 'utf8', (err, data) => {
        if(err || !data || data == 'undefined') {
            let data = {
                startmuted: false,
                linkType: 'browser',
                // globalautoopen: false,???
                autoopentype: 'browser',
                pause: false,
                muteshortcut: ['Ctrl','\''],
                autotheater: false
            };
            saveSettings(data);
        }
        settings = JSON.parse(data);
        let windows = BrowserWindow.getAllWindows();
        for(let window of windows) {
            if(window) {
                window.webContents.send('send-settings', data);
            }
        }
    });
}

ipcMain.on('add-stream', () => {
    mainWindow.webContents.send('new-stream');
});

function streamPageSettings(streamWindow) {
    fs.readFile(settingsFilePath, 'utf8', (err, data) => {
        if(err) {
            console.log(err);
            throw err;
        }
        streamWindow.webContents.send('send-view-settings', data);
    });
}

ipcMain.on('load-main-settings', () => {
    loadMainSettings();
});
function loadMainSettings() {
    fs.readFile(settingsFilePath, 'utf8', (err, data) => {
        if(err) {
            console.log(err);
            throw err;
        }
        data = JSON.parse(data);
        if(data.muteshortcut != settings.muteshortcut) {
            registerMuteShortcut(data.muteshortcut);
        }
        settings = data;
    });
}
