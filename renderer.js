// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const { BrowserWindow } = require('electron').remote;
const childProcess = require('child_process');

const path = require('path')
window.addEventListener('load', () => {
  //inject jquery to page
  window.$ = window.jQuery = require(path.join(__dirname, '/lib/jquery.min.js'));
});

function searchWithAg() {
  const text = document.getElementById('input-search').value
  console.log('Running command ag_x64.exe ' + text);
  window.postMessage({ type: "SEARCH", query:  text, folder: null}, "*")
}

// document.getElementById('btn-submit').addEventListener("click", function(args) {
document.getElementById('form-search').addEventListener("submit", function(e) {
  e.preventDefault();
  console.log('form search is caught, passing message to preload.js to call shell');
  // Clean up previous search.
  document.getElementById('output').innerHTML = ''
  const text = document.getElementById('input-search').value
  console.log('text: ', text)
  searchWithAg(text)
  return false
});

//  Listen to settings page.
document.getElementById('btn-settings').addEventListener('click', function(e){
  console.log('Clicked on settings');

  let win = new BrowserWindow({
      width: 600, height: 800,  
      webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          nodeIntegration: true
      },
      frame: false,
  });
  win.loadURL(`file://${__dirname}/settings.html`); 

  return false;
});

//  Listen to settings page.
document.getElementById('btn-about').addEventListener('click', function(e){
  console.log('Clicked on about');

  let win = new BrowserWindow({
      width: 400, height: 400,  
      webPreferences: {
          nodeIntegration: true
      },
      frame: false,
  });
  win.loadURL(`file://${__dirname}/about.html`); 

  return false;
});

// Check if ag/rg/ack is installed.
// If not indicate that they are not installed,
// If yes, then show radio buttons to choose one of them.
function checkIfBinariesInstalled() {
  if (window.localStorage.getItem(_KEY_AG_INSTALLED)) {
    console.log('ag is installed, no need to check');
    return;
  }

  // Check if ag is installed.
  var binaryAlias = 'ag';
  childProcess.exec(binaryAlias, function (err, stdout) {
    console.log(binaryAlias + ' testing', String(err));
    if (String(err).includes(
         'is not recognized as an internal or external command')) {
      console.log(binaryAlias + ' is not installed'); 
      document.getElementById('span-status').textContent = (
          'You have none of the ag/rg/ack programs installed, '
          + 'you should install them first');
      window.localStorage.setItem(_KEY_AG_INSTALLED, false);
    } else {
      window.localStorage.setItem(_KEY_AG_INSTALLED, true);
    }
    // TODO(hakanu): Maybe show an option to use ag or rg?
    // else {
    //   document.getElementById('form-search').innerHTML += (
    //     '<p><input type="radio" name="binary" value="ag"> ag</p>');
    // }
  });

  // TODO(hakanu): Support rg and ack here. Maybe. Need too much argument
  // adjusting though. Hard to do drop-in replacement.
}

// This is stateful, if the binary is installed it persists into localstorage.
checkIfBinariesInstalled();

var searchDirFromSettings = window.localStorage.getItem(
    _KEY_SETTINGS_DEFAULT_SEARCH_DIR);
document.getElementById('sub-default-search-dir').textContent = (
    searchDirFromSettings ? searchDirFromSettings  : _DEFAULT_SEARCH_DIR);

// Collect stats if enabled.
if (window.localStorage.getItem(
    _KEY_SETTINGS_ANALYTICS_ENABLED)) {
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'UA-154680842-1');
}