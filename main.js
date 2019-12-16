// Modules to control application life and create native browser window
const {app, Menu, Tray, BrowserWindow, globalShortcut} = require('electron')
const path = require('path')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let isShown = false;
let iconPath = 'img/logo.png';

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 870,
    height: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    },
    icon: iconPath,
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  // mainWindow.on('closed', function () {
  //   // Dereference the window object, usually you would store windows
  //   // in an array if your app supports multi windows, this is the time
  //   // when you should delete the corresponding element.
  //   mainWindow = null
  // })

  mainWindow.on('minimize',function(event){
      event.preventDefault();
      mainWindow.hide();
  });

  mainWindow.on('close', function (event) {
      if(!app.isQuiting){
          event.preventDefault();
          mainWindow.hide();
      }
      return false;
  });

  isShown = true;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
let tray = null
app.on('ready', () => {
  tray = new Tray(iconPath)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Settings',
      click() {
        console.log('settings clicked')
        let win = new BrowserWindow({
            width: 600, height: 800,  
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: true
            },
            frame: false,
        })
        win.loadURL(`file://${__dirname}/settings.html`) 
      }
    },
    { 
      label: 'Show App', click:  function() {
          mainWindow.show()
      }
    },
    {
      label: 'Quit', click:  function() {
        app.isQuiting = true
        app.quit()
      } 
    }  
    ])
  tray.setToolTip('CodeSurf, never lose a code piece again...')
  tray.setContextMenu(contextMenu)

  // Add global shortcut to show the app:
  const ret = globalShortcut.register('CommandOrControl+shift+j', () => {
    // Toggle window based on the visibility.
    if (isShown) {
      mainWindow.hide()
      isShown = false
    } else {
      mainWindow.show()
      isShown = true
    }
  })
})

