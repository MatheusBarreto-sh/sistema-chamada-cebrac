const { app, BrowserWindow } = require('electron');

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Painel de Gestão Cebrac",
    autoHideMenuBar: true, 
    icon: __dirname + '/icon.png',
    webPreferences: {
      nodeIntegration: true
    }
  });

  win.loadFile('professora.html');
  win.maximize(); 
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});