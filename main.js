const {app, BrowserWindow} = require('electron')
let IPC = require("electron").ipcMain;

/* global reference of window obj. Otherwise the window will be closed if the
JavaScript object is garbage collected. */
let mainWindow
let modalWindow


app.on('ready', () =>
{
    /* Loading Modal Window
  ******************************************************************************/
  modalWindow = new BrowserWindow (
    {
      width: 600,
      height: 300,
      frame: false,
      resizable: false,
      modal: true,
      webPreferences:
      {
        nodeIntegration: true
      }
    }
  )

  modalWindow.loadFile('launch.html')
  modalWindow.on('closed', () => /* Garbage collection */
  {
    modalWindow = null
  })

  /* Main Window
  ******************************************************************************/
  mainWindow = new BrowserWindow
  (
    {
      width: 800,
      height: 600,
      show: false,
      webPreferences:
      {
        nodeIntegration: true
      }
    }
  )

  mainWindow.loadFile('index.html')

  /* open the DevTools. */
  if (process.argv[2] == "-debug")
  {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.once('ready-to-show', function()
  {

  })

  /* Emitted when the window is closed. */
  mainWindow.on('closed', () => /* Garbage collection */
  {
    mainWindow = null
  })

})



/* quit when all windows are closed. */
app.on('window-all-closed', function ()
  {
    /* on macOS it is common for applications and their menu bar
    to stay active until the user quits explicitly with Cmd + Q */
    if (process.platform !== 'darwin')
    {
      app.quit();
    }
  }
)


app.on('activate', function ()
  {
    /* on macOS it's common to re-create a window in the app when the
    dock icon is clicked and there are no other windows open. */
    if (mainWindow === null)
    {
      createWindow();
    }
  }
)


/* Start Main window if loading of MNc's has finished */
IPC.on("openTool", function(event, data)
{
  modalWindow.destroy();
  mainWindow.show();
  mainWindow.maximize();
})

/* Close tool on [closeTool] via IPC */
IPC.on("closeTool", function(event, data)
{
  app.quit();
});
