
const path = require('path')
window.addEventListener('load', () => {
  //inject jquery to page
  window.$ = window.jQuery = require(path.join(__dirname, '/jquery.min.js'));
});
