const {
    app,
    BrowserWindow,
    ipcMain,
    Tray,
    Menu,
    shell
} = require('electron');
const windowStateKeeper = require('electron-window-state');

let mainWindow;
let addStreamWindow;
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

    addStreamWindow.loadFile(`${__dirname}/addStreamWindow.html`);
    addStreamWindow.on('ready-to-show', function () {
        addStreamWindow.show();
    });

    addStreamWindow.on('closed', function () {
        addStreamWindow = null;
    })
})

ipcMain.on('stream-added', function () {
    mainWindow.webContents.send('load-streams');
})

ipcMain.on('minimize-window', function () {
    mainWindow.minimize();
});

ipcMain.on('close-main-window', function () {
    mainWindow.hide()
    // mainWindow.close();
})

ipcMain.on('close-stream-window', function () {
    addStreamWindow.close();
})