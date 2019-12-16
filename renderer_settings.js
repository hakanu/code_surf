// Show current settings from localstorage.
document.getElementById('input-default-search-dir').value = (
  window.localStorage.getItem(_KEY_SETTINGS_DEFAULT_SEARCH_DIR));

document.getElementById('form-settings').addEventListener(
    'submit', function(e) {
  e.preventDefault();
  console.log('settings form is submitted');
  var newDefaultSearchDir = document.getElementById(
     'input-default-search-dir').value
  // Store the new settings in the localstorage.
  window.localStorage.setItem(_KEY_SETTINGS_DEFAULT_SEARCH_DIR,
                              newDefaultSearchDir); 
  return false;
});