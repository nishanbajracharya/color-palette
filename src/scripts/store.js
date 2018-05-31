const storageObserver = new Observer();

const Storage = {
  get: key => new Promise(resolve =>
    chrome.storage.sync.get([key], result => resolve(result[key]))
  ),
  getValues: keys => new Promise(resolve =>
    chrome.storage.sync.get(keys, result => resolve(result))
  ),
  set: (key, value) => chrome.storage.sync.set({ [key]: value }),
  setValues: pair => chrome.storage.sync.set(pair),

  remove: key => chrome.storage.sync.remove(key),
  clear: key => chrome.storage.sync.clear(),

  onChange: changeCallback => storageObserver.subscribe(changeCallback)
};

chrome.storage.onChanged.addListener(changes => {
  storageObserver.broadcast({type: 'STORAGE_CHANGED', payload: changes});
});
