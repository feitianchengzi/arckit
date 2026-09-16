document.querySelector('#apply').addEventListener('click', () => {
  document.querySelector('iframe').contentWindow.postMessage({
    type: 'arcorbit-interaction-scenario', name: document.querySelector('#scenario').value
  }, '*');
});
