(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
}((function () { 'use strict';

    const {
        app,
        BrowserWindow,
        ipcMain,
        Tray,
        Menu,
        shell,
        BrowserView
    } = require('electron');
    const windowStateKeeper = require('electron-window-state');



    let mainWindow;
    let addStreamWindow;
    let settingWindow;
    let mainWindowState;
    let streamWindowState;
    const iconPath = `${__dirname}/buildResources/icon.ico`;
    let tray = null;

    // app.allowRendererProcessReuse = true;
    app.disableHardwareAcceleration();

    app.on('ready', function () {

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
                webSecurity: false
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

    // Opening on startup
    // https://www.electronjs.org/docs/api/shell#shellwriteshortcutlinkshortcutpath-operation-options-windows

    //Open add stream window
    ipcMain.on('open-stream-window', function () {
        addStreamWindow = new BrowserWindow({
            webPreferences: {
                nodeIntegration: true
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
        addStreamWindow.on('ready-to-show', function () {
            addStreamWindow.show();
        });

        addStreamWindow.on('closed', function () {
            addStreamWindow = null;
        });
    });

    //Open add stetting window
    ipcMain.on('open-setting-window', function () {
        settingWindow = new BrowserWindow({
            webPreferences: {
                nodeIntegration: true
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
        settingWindow.on('ready-to-show', function () {
            settingWindow.show();
        });

        settingWindow.on('closed', function () {
            settingWindow = null;
        });
    });


    ipcMain.on('stream-added', function () {
        mainWindow.webContents.send('load-streams');
    });

    ipcMain.on('minimize-window', function () {
        mainWindow.minimize();
    });

    ipcMain.on('close-main-window', function () {
        mainWindow.hide();
        // mainWindow.close();
    });

    ipcMain.on('close-stream-window', function () {
        addStreamWindow.close();
    });

    ipcMain.on('close-setting-window', function () {
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
    startAutoCollection();
    async function startAutoCollection() {
        const puppeteer = require('puppeteer-core');
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
            browserCollection(id);
        } else {
            if(collectionKeys.indexOf(id) < 0) {
                collectionKeys.push(id);
            }
            openWindow(id);
        }
        if(type == 3 || type == 2) {
            if(!collectionInterval) {
                collectionInterval = setInterval(autoCollect, 10000);
            }
        }
    });

    //SECTION Stream shell windows
    let startMuted = false;
    async function openWindow(stream) {
        if (collectionWindows[stream]) {
            collectionWindows[stream].focus();
            return;
        }
        console.log(stream);
        let window = new BrowserWindow({
            webPreferences: {
                nodeIntegration: true,
                webSecurity: false,
                backgroundThrottling: false
            },
            x: streamWindowState.x,
            y: streamWindowState.y,
            width: streamWindowState.width,
            height: streamWindowState.height,
            show: true,
            frame: false,
            backgroundColor: '#1d1d1d',
            title: stream
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

        view.webContents.setAudioMuted(startMuted ? startMuted : false);
        view.webContents.loadURL("https://www.twitch.tv/" + stream);

        view.webContents.on('new-window', (e, url) => {
            shell.openExternal(url);
        });

        //www.twitch.tv/klassykat?refferal=raid
        view.webContents.on('did-navigate-in-page', (e, url) => {
            let nameStart = url.lastIndexOf('/');
            let nameEnd = url.lastIndexOf('?');
            let streamName;
            if(nameEnd > -1) {
                streamName = url.slice(nameStart+1, nameEnd);
            } else {
                streamName = url.slice(nameStart+1);
            }
            console.log(url);
            if(url.indexOf('www.twitch.tv') > 0) {
                console.log(streamName);
                window.setTitle(streamName);
                window.webContents.send('new-page-title', streamName);
            }
        });

        //SECTION Set Auto Collect Page
        let windowMenuTemplate = [
            {
                label: 'Reload',
                accelerator: 'Ctrl+R',
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

        window.on('close', e => {
            window.webContents.send('proper-close');
        });

        await window.loadFile(`${__dirname}/streamWrapper.html`);
        window.webContents.send('page-title', stream);
        // window.webContents.on('will-navigate', (e, url) => {
        //     console.log(url);
        // })

        collectionWindows[stream] = window;
        collectionViews[stream] = view;
        streamWindowState.manage(window);

        //Debugging
        window.webContents.toggleDevTools();
    }

    //SECTION
    //Stream Shell window controll
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
        // await collectionWindows[data].close();
        await collectionViews[data].destroy();
        delete collectionWindows[data];
        delete collectionViews[data];
        if(collectionKeys.indexOf(data) > -1) {
            collectionKeys.splice(collectionKeys.indexOf(data), 1);
        }
    });


    //SECTION Browser Collection
    //Remove once offline
    function browserCollection(stream) {
        let browserCollectView = new BrowserView();
        // browserCollectView.webContents.setAudioMuted(true);
        browserCollectView.webContents.loadURL("https://www.twitch.tv/" + stream);
        collectionViews[stream] = browserCollectView;
        if(collectionKeys.indexOf(stream) < 0) {
            collectionKeys.push(stream);
        }
    }


    async function autoCollect() {
        console.log('Auto Collect:' + collectionKeys);
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
                nodeIntegration: true
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
                await loginView.destroy();
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
                await loginView.destroy();
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
                await logoutView.destroy();
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
    ipcMain.on('set-start-muted', (e, data) => {
        if(data) {
            startMuted = true;
        } else {
            startMuted = false;
        }
    });

    //SECTION Load Settings
    ipcMain.on('load-settings', (e, data) => {
        if(data) {
            startMuted = data.startmuted;
        }
    });

})));
