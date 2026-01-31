// Load saved settings
chrome.storage.sync.get({
  minKarma: 10,
  hideIntros: true
}, items => {
  document.getElementById('minKarma').value = items.minKarma;
  document.getElementById('hideIntros').checked = items.hideIntros;
});

// Save settings
document.getElementById('save').addEventListener('click', () => {
  const minKarma = parseInt(document.getElementById('minKarma').value) || 10;
  const hideIntros = document.getElementById('hideIntros').checked;
  
  chrome.storage.sync.set({
    minKarma,
    hideIntros
  }, () => {
    const status = document.getElementById('status');
    status.textContent = '✓ Saved!';
    status.className = 'saved';
    setTimeout(() => status.textContent = '', 2000);
  });
});
