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

const pie = require('puppeteer-in-electron');
const puppeteer = require('puppeteer-core');


let mainWindow;
let addStreamWindow;
let settingWindow;
let mainWindowState;
const iconPath = `${__dirname}/buildResources/icon2.ico`;
let tray = null;

app.allowRendererProcessReuse = true;

app.on('ready', function () {

    //Main Window
    mainWindowState = windowStateKeeper({
        maximize: false
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
        icon: './buildResources/icon2.ico'
    });
    mainWindow.setResizable(false); //Workaround
    mainWindow.loadFile(`${__dirname}/main.html`);

    //Listen to window state
    mainWindowState.manage(mainWindow);

    //Tray
    tray = new Tray(iconPath);
    //Menu Template
    let template = [{
            label: 'Open',
            click: () => mainWindow.show()
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
    //Create Menu
    const contextMenu = Menu.buildFromTemplate(template);
    tray.setContextMenu(contextMenu);
    tray.setToolTip('Stream Luv');
});



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
        height: 150,
        backgroundColor: "#1c1c1c",
        frame: false,
        alwaysOnTop: true,
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
    })
})

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
        alwaysOnTop: true,
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
    })
});

ipcMain.on('stream-added', function () {
    mainWindow.webContents.send('load-streams');
});

ipcMain.on('minimize-window', function () {
    mainWindow.minimize();
});

ipcMain.on('close-main-window', function () {
    mainWindow.hide()
    // mainWindow.close();
});

ipcMain.on('close-stream-window', function () {
    addStreamWindow.close();
});

ipcMain.on('close-setting-window', function () {
    settingWindow.close();
});


// Puppeteer Auto Channel Point Collection
let collectionWindows = {};
let collectionViews = {};
let collectionPages = {};
let browser;

startAutoCollection();
async function startAutoCollection() {
    await pie.initialize(app);
    browser = await pie.connect(app, puppeteer);
}

ipcMain.on('open-auto-collect', (e, args) => {
    let {
        type,
        id
    } = args;
    openWindow(id);
})

// let streamWindowState = windowStateKeeper({
//     maximize: true
// })
async function openWindow(stream) {
    let window = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        show: true,
        frame: false,
        width: 600,
        height: 300,
        backgroundColor: '#1d1d1d'
    });
    let view = new BrowserView();
    window.setBrowserView(view);
    let viewAnchor = {
        x: 0,
        y: 32
    };
    view.setBounds({
        ...viewAnchor,
        width: 600,
        height: 268
    });
    view.webContents.loadURL("https://www.twitch.tv/" + stream);

    window.on('will-resize', (e, newBounds) => {
        view.setBounds({
            ...viewAnchor,
            width: newBounds.width,
            height: newBounds.height - viewAnchor.y
        })
    });

    window.on('maximize', () => {
        let newBounds = window.getBounds();
        newBounds.width = newBounds.width - 2 * 8;
        newBounds.height = newBounds.height - 2 * 8;
        view.setBounds({
            ...viewAnchor,
            width: newBounds.width,
            height: newBounds.height - viewAnchor.y
        })
    })

    await window.loadFile(`${__dirname}/streamWrapper.html`);
    window.webContents.send('page-title', stream);
    collectionWindows[stream] = window;
    collectionViews[stream] = view;

    await pie.getPage(browser, collectionWindows[stream]);
}

ipcMain.on('toggle-stream-mute', (e, data) => {
    collectionViews[data.window].webContents.setAudioMuted(data.val);
})

ipcMain.on('close-stream-shell', (e, data) => {
    collectionWindows[data].close();
    collectionViews[data].destroy();
    delete collectionWindows[data];
    delete collectionViews[data];
})

ipcMain.on('twitch-login', async () => {
    let loginWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        },
        show: true,
        frame: false,
        width: 400,
        height: 470,
        alwaysOnTop: true,
        backgroundColor: '#1d1d1d',
        modal: true,
        parent: settingWindow,
        resizable: false
    });
    let loginView = new BrowserView();
    loginWindow.setBrowserView(loginView);

    loginView.setBounds({
        x: 0,
        y: 32,
        width: 400,
        height: 438
    });

    loginView.webContents.on('will-navigate', () => {
        loginWindow.close();
        loginView.destroy();
    })

    loginView.webContents.loadURL("https://www.twitch.tv/login");

    await loginWindow.loadFile(`${__dirname}/loginWrapper.html`);
    loginWindow.webContents.send('page-title', 'login');

    ipcMain.on('twitch-login-close', () => {
        loginWindow.close();
        loginView.destroy();
    })
})

ipcMain.on('twitch-logout', async () => {
    let logoutWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        show: true
    })

    logoutWindow.webContents.setAudioMuted(true);

    await logoutWindow.loadURL('https://www.twitch.tv/directory/following');
    collectionPages.logout = await pie.getPage(browser, logoutWindow);

    collectionPages.logout.waitForSelector("img[alt='User Avatar']")
    .then(() => {
        console.log('Clickity click bitch');
        collectionPages.logout.click("img[alt='User Avatar']", {button: 'middle'});
    })
    // await Promise.all([
    //     new Promise(resolve => collectionPages.logout.once('domcontentloaded', resolve)),
    //     console.log('click'),
    //     await collectionPages.logout.mouse.click(900, 300, {button: 'middle'}),
    // ]);
});

async function autoCollection() {
    let pageList = await browser.pages();
    for (stream in pageList) {
        stream = pageList[stream];
        let claimPoints = await stream.$('.claimable-bonus__icon');
        if (claimPoints) {
            console.log('Points claimed.')
            claimPoints.click();
        }
    }
}