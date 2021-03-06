// const electron = require('electron')
const {app, Menu, Tray, BrowserWindow, ipcMain} = require('electron')

const path = require('path')
const url = require('url')
const teeny = require('teeny-conf');

let config = new teeny('config.json');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

let tray = null
// app.on('ready', () => {
  
// })

const createTray = () => {
  tray = new Tray('./tray.png')
  tray.on('right-click', toggleWindow)
  tray.on('double-click', toggleWindow)
  tray.on('click', function (event) {
    toggleWindow()

    // Show devtools when command clicked
    if (window.isVisible() && process.defaultApp && event.metaKey) {
      window.openDevTools({mode: 'detach'})
    }
  })
}

app.on('ready', () => {
  createTray()
  createWindow()
})

const createWindow = () => {
  window = new BrowserWindow({
    width: 800,
    height: 650,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    webPreferences: {
      // Prevents renderer process code from not running when window is
      // hidden
      backgroundThrottling: false
    }
  })
  window.loadURL(`file://${path.join(__dirname, 'index.html')}`)

  window.webContents.openDevTools()

  // Hide the window when it loses focus
  window.on('blur', () => {
    if (!window.webContents.isDevToolsOpened()) {
      window.hide()
    }
  })
}

ipcMain.on('check-auth', (event) => {
  config.loadOrCreateSync('tweetr');
  if(config.get('auth') === undefined) {
    event.sender.send('check-auth', {
      error: 0,
      auth: false
    });
  }
  
})

ipcMain.on('show-window', () => {
  showWindow()
})

ipcMain.on('show-login-window', (event) => {
  createLoginWindow(result => {
    if(result.error === 0 && result.auth === true) {
      toggleWindow()
      event.sender.send('show-login-window', result);
    }
  })
})

function handleCallback (url, cb) {
  var oauth_token = url.split('oauth_token=')[1];
  var oauth_token_clear = oauth_token.split('&')[0];
  var oauth_verifier = url.split('oauth_verifier=')[1];
  return cb({oauth_token:oauth_token_clear, oauth_verifier:oauth_verifier});
}

function createLoginWindow (cb) {
  authWindow = new BrowserWindow({width: 800, height: 600})
  authWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'blank.html'),
    protocol: 'file:',
    slashes: true
  }))
  var twitterAPI = require('node-twitter-api');
  var twitter = new twitterAPI({
      consumerKey: 'pqsBDT0nZKd4TjsmLtvJndmTJ',
      consumerSecret: '57V6LLrMu5rMSG2QfLYwBMn5etuvzBLBLVFjGzxkKzJxzr8ST1',
      callback: 'http://localhost/tweetshell'
  });
  twitter.getRequestToken(function(error, requestToken, requestTokenSecret, results){
    if (error) {
      console.log("Error getting OAuth request token : " + error);
    } else {
      authWindow.loadURL('https://twitter.com/oauth/authenticate?oauth_token='+requestToken);
    }
  });
  authWindow.on('close', function () {
    authWindow.destroy();
  });
  authWindow.webContents.on('will-navigate', function (event, url) {
    handleCallback(url, function(response){
      config.loadOrCreateSync('tweetr');
      config.set('auth', true);
      config.set('oauth_token', response.oauth_token);
      config.set('oauth_verifier', response.oauth_verifier);
      authWindow.hide();
      return cb({error: 0, auth: true});
    });
  });
  authWindow.webContents.on('did-get-redirect-request', function (event, oldUrl, newUrl) {
    console.log(response)
    handleCallback(newUrl, function(response){
      console.log(response)
    });
  });
  // Open the DevTools.
  // authWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  authWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    authWindow = null
  })


  authWindow.on('will-quit', function(event){
    event.preventDefault()
  })
}

const toggleWindow = () => {
  if (window.isVisible()) {
    window.hide()
  } else {
    showWindow()
  }
}


const getWindowPosition = () => {
  const windowBounds = window.getBounds()
  const trayBounds = tray.getBounds()

  // Center window horizontally below the tray icon
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))

  // Position window 4 pixels vertically below the tray icon
  const y = Math.round(trayBounds.y + trayBounds.height + 4)

  return {x: x, y: y}
}

const showWindow = () => {
  const position = getWindowPosition()
  console.log(position)
  window.setPosition(position.x, position.y, false)
  window.show()
  window.focus()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})


app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
