document.getElementById('apply').onclick = () => document.querySelector('iframe').contentWindow.postMessage({type:'chat-scenario',name:document.getElementById('scenario').value}, '*');
