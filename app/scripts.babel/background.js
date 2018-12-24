'use strict';
let skipedKeys = ['git.saybot', 'newrelic.com']
function skipKeys(url) {
  let result = false
  for (var i = 0; i < skipedKeys.length; i++) {
    console.log('now skipedKeys', skipedKeys[i])
    if (url.includes(skipedKeys[i])) {
      result = true;
    }
  }
  console.log('skip url result', url, result)
  return result;
}
chrome.browserAction.setBadgeText({ text: '' });

chrome.browserAction.setBadgeText({text: ''});

let sourceFileList = {}
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {

    chrome.tabs.query({'active': true, 'windowId': chrome.windows.WINDOW_ID_CURRENT},
      function(tabs){
        let theUrl = details.url.split('?')[0]
        if (!skipKeys(theUrl) && details.type === 'script' && /\.js$/.test(theUrl) && !(/^chrome-extension:\/\//.test(theUrl))) {
          tryGetMap(theUrl, (url, content) => {
            if (isValidSourceMap(content)) {
              sourceFileList[url] = {content, page: tabs[0]}
              setBadgeText(Object.keys(sourceFileList).length)
            }
          })
        }
      }
    );
  },
  {
    urls: ['<all_urls>']
  }
);

const setBadgeText = (num) => {
  let text = num > 0 ? '' + num : ''
  chrome.browserAction.setBadgeText({text: text});
}

const tryGetMap = (url, callback) => {
  console.log('babel tryGetMap url', url)
  setTimeout(() => {
    fetch(url + '.map').then(resp => {
      if (resp.status === 200) {
        resp.text().then(text => {
          callback(resp.url, text);
        })
      }
    }).catch(err => {
      console.log(err)
    })
  }, 300);
}

const isValidSourceMap = (rawSourceMap) => {
  try {
    const SourceMapConsumer = sourceMap.SourceMapConsumer
    const consumer = new SourceMapConsumer(rawSourceMap);

    return consumer.hasContentsOfAllSources()
  } catch(e) {
    console.log(e)
  }

  return false;
}

chrome.extension.onConnect.addListener(function(port) {
  port.postMessage(Object.keys(sourceFileList).map(key => (
    {
      url: key,
      content: sourceFileList[key].content,
      page: sourceFileList[key].page
    }
  )))
})
