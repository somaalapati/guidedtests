const injectCrossOriginIframe = (path, parent = document.body, height = '700', width = '700') => {
  const localIP = '127.0.0.1';
  const localhost = 'localhost';
  const origin = window.location.origin;
  let iframeOrigin;

  if (origin.includes(localhost)) {
    iframeOrigin = origin.replace(localhost, localIP);
  } else if (origin.includes(localIP)) {
    iframeOrigin = origin.replace(localIP, localhost);
  } else {
    alert('Cross origin iframes are only supported on localhost');
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.src = (new URL(path, iframeOrigin)).toString();
  iframe.height = height;
  iframe.width = width;
  if (parent) {
    parent.appendChild(iframe)
  }
}
