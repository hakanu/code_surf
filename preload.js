// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const path = require('path')
const exec = require('child_process').exec;
const { BrowserWindow } = require('electron').remote;
const shell = require('electron').shell;

var currentDir = __dirname; 
console.log('currentDir: ' + currentDir);

// TODO(hakanu): Make this pulled from settings so that we can use ack, rg...
// var binaryPath = 'ag_x64.exe';
var binaryPath = 'ag';

// Check if it's the show_source.html
if (window.location.href.includes('/show_source.html')) {
  // If it's show source, then let's try to extract the file name.
  console.log('its show_source.html');
  var urlString = window.location.href;
  var url = new URL(urlString);
  var filePath = url.searchParams.get("f");
  console.log(filePath);

  // Load deps for reading local file.
  var fs = require('fs'); 

  self = this;

  fs.readFile(filePath, 'utf-8', (err, data) => {
      if(err){
          alert("An error ocurred reading the file :" + err.message);
          return;
      }

      // Change how to handle the file content
      // console.log("The file content is : " + data);
      document.getElementById('pre-show-source').textContent = data;
      document.getElementById('h-file-title').textContent = filePath;
      window.document.title = filePath;

      // Highlight the file by the language by using highlight.js.
      document.querySelectorAll('pre').forEach((block) => {
        hljs.highlightBlock(block);
      });

      // Allow ctrl + f.
      // Needed to implement my own seach.
      // Stole from: http://jsfiddle.net/UPs3V/291/
      function highlightTerms(term) {
        console.log('highlighting: ', term);
        var src_str = $("#pre-show-source").html();

        term = term.replace(/(\s+)/,"(<[^>]+>)*$1(<[^>]+>)*");
        var pattern = new RegExp("("+term+")", "gi");

        src_str = src_str.replace(pattern, "<mark>$1</mark>");
        src_str = src_str.replace(/(<mark>[^<>]*)((<[^>]+>)+)([^<>]*<\/mark>)/,"$1</mark>$2<mark>$4");

        $("#pre-show-source").html(src_str);
      }

      function searchAndHighlight() {
        var inPageQuery = document.getElementById('input-search-in-file').value;
        console.log('in page search: ', inPageQuery);

        // Clean up previous highlights before highlighting for the new term.
        $('#pre-show-source').html(originalHtml);

        highlightTerms(inPageQuery);
      }

      // Keep original html in between the different highlighting.
      var originalHtml = $("#pre-show-source").html();
      document.getElementById('form-search-in-file').addEventListener('submit', function(e) {
        e.preventDefault();
        
        searchAndHighlight(); 
        return false;
      });

      // Display the search menu
      // Alternatively add the key event listener [CTRL+F]
      window.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.keyCode === 70) {
          console.log('search triggered');
          $('#input-search-in-file').focus();
        }
      }, false);

  });

  // Alternative way to obtain parameters.
  //console.log(global.location.search);
} else if (window.location.href.includes('/settings.html')) {
  console.log('settings opened');

  

} else {
  console.log('index.html');


  // Add event handlers to index.html elements.
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.keyCode === 70) {
      console.log('search triggered');
      $('#input-search').focus();
    }
  }, false);
  
}

function execute(command, callback){
  exec(command, function(error, stdout, stderr){ callback(error, stdout, stderr); });
};

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
});

window.addEventListener("message", (event) => {
  console.log('received message: ', event);
  if (event.source != window) return;
  if (event.data.type && (event.data.type == "SEARCH")) {
    var query = event.data.query;
    var searchFolder = event.data.folder;

    if (searchFolder == null) {
      console.log('Search folder is not given so using current folder',
                  currentDir);
      var searchDirFromSettings = window.localStorage.getItem(
         _KEY_SETTINGS_DEFAULT_SEARCH_DIR);
      console.log('Saved settings for default search dir: ',
                  searchDirFromSettings);
      if (!searchDirFromSettings) {
        console.log('No saved settings for default search dir, using default: ',
                    currentDir)
        searchFolder = currentDir; 
      } else {
        searchFolder = searchDirFromSettings; 
      }
    }

    console.log('query: ', query)
    document.getElementById('span-searching').style.visibility = 'visible';

    // After 2 matches, skip to the next file, will be more performant on
    // large files.
    // --stats is added to show the timings. 
    // --ackmate to make the result parsing easier.
    // --path-to-ignore for ignore patterns.
    var command = (binaryPath + ' ' + query + ' ' + searchFolder +
      ' --ackmate --stats -m 2 --path-to-ignore "ag_ignore.txt"');
    console.log('Running command: ', command)
    execute(command, function(error, stdout, stderr) {
        element = document.getElementById('output');
        // console.log('finished, output', error, stdout, stderr);
        var lines = stdout.match(/[^\r\n]+/g);
        console.log('lines: ', lines.length);

        document.getElementById('span-searching').style.visibility = 'hidden';

        var filePath = searchFolder;
        var statsStarted = false;
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];

          // If stats started then no need to continue other appendings.
          // Stats are at the end.
          if (statsStarted) {
            document.getElementById('span-stats').textContent += line + ' | ';
            continue;
          }

          // File name.
          if (line.startsWith(':')) {
            line = line.replace(':', '');
            element.innerHTML += '<hr/>';
            // TODO(hakanu): Should I prepend this to the file path? googlechrome:///
            // Open the file in chrome to make it ctrl+f-able.

            // element.innerHTML += '<h4><b><a href="file://\\' + line + '" target="_blank">' + line + '</a></b></h4>';
            // Let's use our custom file shower with highlights instead of the raw file:// explorer.
            element.innerHTML += '<h6><b><a href="#" class="a-line">' + line + '</a></b><span><a href="#" class="a-edit" data-file="'+line+'">&#9999;</a></span></h6>';
            // ag automatically prepends the search folder, no need to do it myself.
            filePath = line;//searchFolder + '\\' + line; 
          } else if (line.includes(' matches') && !line.includes(';')) {
            // line has matches inside and no ; then it's stats.
            statsStarted = true;
            document.getElementById('span-stats').textContent += line + ' | ';

          } else {
            // File contents.
            element.innerHTML += '<br/>';
            element.innerHTML += (
              '<a href="#" class="a-line" data-file="' + filePath + '" id="a-line-'
              + i + '">' + '' + '</a>');
            document.getElementById('a-line-' + i).textContent = line.replace(/\s\s+/g, ' ');

            // Don't add click listeners here, because they don't register for some reason.
            // Probably not rendered yet.
          }
        }
        var errorElement = document.getElementById('error-output');
        errorElement.innerHTML += '<sub>Error log: ' + error + stderr + '</sub>';
        console.log('finished');

        // Add click listeners to show a separate window with nicely formatted
        // source code file.
        var codeLineElements = document.getElementsByClassName('a-line');
        for (var i = 0; i < codeLineElements.length; i++) {
          var elem = codeLineElements[i];
          elem.addEventListener("click", (event) => {
            console.log('Clicked on code line...');
            let win = new BrowserWindow({
                width: 600, height: 800,  
                webPreferences: {
                    preload: path.join(__dirname, 'preload.js'),
                    nodeIntegration: true
                },
                frame: false,
            });
            // TODO(hakanu): Is there a better way to pass file name?
            win.loadURL(`file://${__dirname}/show_source.html?f=` + 
                        elem.dataset.file);
          });
        }

        // Edit button click handler.
        var editElems = document.getElementsByClassName('a-edit');
        for (var i = 0; i < editElems.length; i++) {
          var elem = editElems[i];
          elem.addEventListener('click', function(e){
            console.log('Clicked on edit', elem.dataset.file);
            shell.openItem(elem.dataset.file);
          });
        };

      });
  }
}, false);


