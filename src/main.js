const {
    app,
    BrowserWindow,
    ipcMain,
    Tray,
    Menu,
    shell,
    BrowserView,
    globalShortcut,
} = require('electron');
const windowStateKeeper = require('electron-window-state');
const Store = require('electron-store');
const store = new Store();

const contextMenu = require('electron-context-menu');

const unhandled = require('electron-unhandled');
const {openNewGitHubIssue, debugInfo} = require('electron-util');

if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

unhandled({
	reportButton: error => {
		openNewGitHubIssue({
			user: 'KlassyKat',
			repo: 'StreamLuv',
			body: `\`\`\`\n${error.stack}\n\`\`\`\n\n---\n\n${debugInfo()}`
		});
	}
});


app.allowRendererProcessReuse = true;

let mainWindow;
let addStreamWindow;
let settingWindow;
let supportWindow;
let infoWindow;
let mainWindowState;
let streamWindowState;
const iconPath = `${__dirname}/../buildResources/icon.ico`;
let tray = null;
let pauseShortcut;

app.on('ready', () => {
    //Main Window
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
        icon: '../buildResources/icon.ico'
    });

    //Debugging
    // mainWindow.webContents.toggleDevTools();

    // mainWindow.setResizable(false); //Workaround
    mainWindow.loadFile(`${__dirname}/main.html`);

    //Listen to window state
    mainWindowState.manage(mainWindow);

    //Tray
    // if(process.platform == "win32" || process.platform == "darwin") {
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
        })
    // }
    registerMuteShortcut(store.get('settings.muteshortcut') || ["Ctrl", "'"]);
});

//Mute Shortcut
ipcMain.on('new-mute-shortcut', (e, data) => {
    // try {
        registerMuteShortcut(data);
    // } catch(e) {
    //     return;
    // }
})
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
    //Mute all other windows
    for(let stream in collectionViews) {
        if(!collectionViews[stream].webContents.isAudioMuted() && stream != lastFocus[0]) {
            collectionWindows[stream].webContents.send('mute-shortcut');
        } else if (stream == lastFocus[0]) {
            collectionWindows[stream].webContents.send('mute-shortcut');
        }
    }
}


ipcMain.on('recieved-focus', (e, data) => {
    addToFocusList(data);
})

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

//Set theater and chat
async function autoFormat(payload) {
    let page = await pie.getPage(browser, collectionViews[payload]);
    if(store.get('settings.autotheater')) {
        autoTheaterFn();
    }
    autoExpandChat();
    //Auto Theater
    async function autoTheaterFn() {
        let player = await page.$(".video-player__container--theatre[data-test-selector='video-player__video-container']");
        if(!player) {
            let theaterBtn = await page.$(".video-player__overlay div[data-a-target=player-controls] [data-a-target=player-theatre-mode-button]");
            if(theaterBtn) {
                theaterBtn.click();
            }
        }
    }

    //Auto Expand Chat
    async function autoExpandChat() {
        let expandBtn = await page.$("[araia-label='Expand Chat'");
        if(expandBtn) {
            console.log('Click Chat btn');
            expandBtn.click();
        }
    }
}

async function checkStreamCrash(payload) {
    console.log('Player stopped: ' + payload);
    //Pupeteer
    //Check DOM for error message
}




// Opening on startup
// https://www.electronjs.org/docs/api/shell#shellwriteshortcutlinkshortcutpath-operation-options-windows

//Open add stream window
ipcMain.on('open-stream-window', () => {
    addStreamWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            spellcheck: false
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

    addStreamWindow.on('closed', () => {
        addStreamWindow = null;
    })
})

//Open add stetting window
ipcMain.on('open-setting-window', () => {
    settingWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            spellcheck: false
        },
        modal: true,
        x: mainWindowState.x - 25,
        y: mainWindowState.y + 50,
        width: 500,
        height: 600,
        resizable: false,
        backgroundColor: "#1c1c1c",
        frame: false,
        parent: mainWindow,
        show: false
    });
    settingWindow.loadFile(`${__dirname}/settingWindow.html`);
    settingWindow.on('ready-to-show', () => {
        settingWindow.show();
    });

    // settingWindow.on('focus', () => {
    //     loadSettings();
    // })

    settingWindow.on('closed', () => {
        settingWindow = null;
    })
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
})

//Check auto collect in stream window
ipcMain.on('get-auto-collect-value', (e, data) => {
    if(collectionKeys.includes(data)) {
        collectionWindows[data].webContents.send('send-auto-collect-value', true);
    } else {
        collectionWindows[data].webContents.send('send-auto-collect-value', false);
    }
})

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
})


//SECTION Stream shell windows
async function openWindow(stream) {
    if (collectionWindows[stream]) {
        collectionWindows[stream].focus();
        mainWindow.webContents.send('resume-open', stream);
        return;
    }
    console.log(stream);
    let window = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
            spellcheck: true
            //Not resolving background collect
            // backgroundThrottling: false
        },
        x: streamWindowState.x,
        y: streamWindowState.y,
        width: streamWindowState.width || 1200,
        height: streamWindowState.height || 750,
        minWidth: 920,
        minHeight: 400,
        show: true,
        frame: false,
        backgroundColor: '#1d1d1d',
        title: stream
    });

    
    
    let view = new BrowserView();
    window.setBrowserView(view);
    // Context Menu
    contextMenu({
        window: view,
        showInspectElement: false
    })
    let viewAnchor = {
        x: 0,
        y: 32
    };
    view.setBounds({
        x: viewAnchor.x,
        y: viewAnchor.y,
        width: streamWindowState.width,
        height: streamWindowState.height - 32
    });

    view.webContents.setAudioMuted(store.get('settings.startmuted'));
    view.webContents.loadURL("https://www.twitch.tv/" + stream);

    view.webContents.setBackgroundThrottling(false);

    view.webContents.on('new-window', async(e, url) => {
        e.preventDefault();
        shell.openExternal(url);
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

        if(url.includes('www.twitch.tv') && !url.includes('www.twitch.tv/videos')) {
            streamName = decodeURIComponent(streamName);
            try{
                window.setTitle(streamName);
                window.webContents.send('new-page-title', streamName);
            } catch(err) {
                return;
            }
        }
    })

    view.webContents.on('context-menu', (e , params) => {
        window.webContents.send('right-click', {
            text: params.selectionText,
            link: params.srcURL
        });
    })

    //Check stream crashed
    view.webContents.on('media-paused', () => {
        checkStreamCrash(stream);
    })

    //SECTION Set Auto Collect Page
    let windowMenuTemplate = [
        {
            label: 'Reload',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
                view.webContents.reload();
            }
        }
    ]
    let windowMenu = Menu.buildFromTemplate(windowMenuTemplate);
    window.setMenu(windowMenu);

    window.on('maximize', () => {
        let newBounds = window.getBounds();
        newBounds.width = newBounds.width - 16;
        newBounds.height = newBounds.height - 16;
        view.setBounds({
            x: viewAnchor.x,
            y: viewAnchor.y,
            width: newBounds.width,
            height: newBounds.height - viewAnchor.y
        })
    })
    window.on('resize', () => {
        let newBounds = window.getBounds();
        view.setBounds({
            x: viewAnchor.x,
            y: viewAnchor.y,
            width: newBounds.width,
            height: newBounds.height - viewAnchor.y
        })
    })

    window.on('hide', () => {
        console.log('Toodles UwU');
    })

    window.on('focus', (e) => {
        window.webContents.send('get-focus');
    })

    window.on('close', e => {
        e.preventDefault();
        window.webContents.send('proper-close');
    })

    await window.loadFile(`${__dirname}/streamWrapper.html`);
    window.webContents.send('page-title', stream);

    collectionWindows[stream] = window;
    collectionViews[stream] = view;
    streamWindowState.manage(window);

    addToFocusList(stream);

    view.webContents.on('did-start-loading', () => {
        mainWindow.webContents.send('resume-open', stream);
    })

    view.webContents.on('did-finish-load', () => {
        autoFormat(stream);
    })


        
    //Debugging
    // window.webContents.toggleDevTools();
}

//SECTION
//Stream Shell window control
ipcMain.on('history-back', (e, data) => {
    collectionViews[data].webContents.goBack();
})
ipcMain.on('history-forward', (e, data) => {
    collectionViews[data].webContents.goForward();
})
ipcMain.on('toggle-stream-mute', (e, data) => {
    collectionViews[data.window].webContents.setAudioMuted(data.val);
})
ipcMain.on('minimize-stream-shell', (e, data) => {
    collectionWindows[data].minimize();
})
ipcMain.on('maximize-stream-shell', (e, data) => {
    collectionWindows[data].isMaximized() ? collectionWindows[data].unmaximize() : collectionWindows[data].maximize();
})

ipcMain.on('close-stream-alt', async(e, data) => {
    console.log('Close: ' + data);
    //I guess this works
    await collectionWindows[data].setBrowserView(null);
    await collectionViews[data].webContents.destroy();
    await collectionWindows[data].destroy();
    delete collectionWindows[data];
    delete collectionViews[data];
    if(collectionKeys.indexOf(data) > -1) {
        collectionKeys.splice(collectionKeys.indexOf(data), 1);
    }
    removeFromFocusList(data);
    mainWindow.webContents.send('resume-open', data);
    console.log('What' + Object.keys(collectionViews));
});

ipcMain.on('set-frames', (e, data) => {
    // collectionViews[data].webContents.frameRate = 1;
    // console.log(collectionViews[data].webContents.getFrameRate());
    console.log('Limit');
})

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
                        claimPoints.click()
                            .catch(err => {
                                console.log(err)
                            });
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

let loginWindow, loginView
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
    })

    loginView.webContents.loadURL("https://www.twitch.tv/login");

    await loginWindow.loadFile(`${__dirname}/loginWrapper.html`);

    //Called from Login Page
    ipcMain.on('twitch-login-close', async () => {
        if(loginWindow) {
            await loginWindow.close();
            loginWindow = null;
            // await loginView.destroy();
            loginView = null;
        }
    })
})

//SECTION Twitch Logout
ipcMain.on('twitch-logout', async (e, logout) => {
    let logoutWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        show: false
    })

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
                                })
                        })
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
        })
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
})
ipcMain.on('set-startup-open', (e, data) => {
    if(data) {
        appAutoLaunch.enable();
    } else {
        appAutoLaunch.disable();
    }
})


ipcMain.on('open-support-window', () => {
    supportWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: 400,
        height: 500,
        backgroundColor: '#212121',
        frame: false,
        resizable: false,
        modal: true,
        parent: settingWindow
    });
    supportWindow.loadFile(`${__dirname}/support.html`);

    supportWindow.on('closed', () => {
        supportWindow = null;
    })
})

ipcMain.on('open-info-window', () => {
    infoWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: 1200,
        height: 750,
        backgroundColor: '#212121',
        frame: false,
        modal: true,
        parent: settingWindow
    });
    infoWindow.loadFile(`${__dirname}/info.html`);

    infoWindow.on('closed', () => {
        infoWindow = null;
    })
})

ipcMain.on('close-support-window', () => {
    supportWindow.close();
})

ipcMain.on('close-info-window', () => {
    infoWindow.close();
})

//File System
ipcMain.on('add-stream', () => {
    mainWindow.webContents.send('new-stream');
})

app.on('before-quit', () => {
    let streamers = store.get('streamers')
    for(let stream in streamers) {
        console.log(stream);
        streamers[stream].streamopen = false;
    }
    store.set('streamers', streamers);
})