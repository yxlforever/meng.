const DATABASE_NAME = 'mono-desk';
    const STORE_NAME = 'preferences';
    const STATE_ID = 'current';
    const defaultState = {
      profileName: '사랑해요',
      profileHandle: '@mono.space',
      profileBio: '好好生活，慢慢相遇。',
      activeDay: '1',
      toggles: {},
      avatar: null,
      wallpaper: null,
      wallpaperName: '',
      globalFont: null,
      globalFontName: '',
      fontPresets: [],
      emojiCategories: [],
      conversations: [],
      transmissions: []
    };
    const state = { ...defaultState };
    let database;

    const openDatabase = () => new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      request.onsuccess = () => {
        database = request.result;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });

    const readState = () => new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(STATE_ID);
      request.onsuccess = () => resolve(request.result?.value || {});
      request.onerror = () => reject(request.error);
    });

    const saveState = () => {
      if (!database) return;
      database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put({ id: STATE_ID, value: state });
    };

    const panels = [...document.querySelectorAll('.panel')];
    const closePanels = () => panels.forEach(panel => {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
    });
    const openPanel = panelId => {
      closePanels();
      const panel = document.getElementById(panelId);
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
    };

    document.querySelectorAll('[data-panel]').forEach(button => button.addEventListener('click', () => openPanel(button.dataset.panel)));
