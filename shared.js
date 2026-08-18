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
      profileBackground: null,
      profileBackgroundName: '',
      profileBackgroundTheme: 'light',
      wallpaper: null,
      wallpaperName: '',
      globalFont: null,
      globalFontName: '',
      desktopIcon: null,
      desktopIconName: '',
      appIcon: null,
      appIconName: '',
      appIcons: {},
      appIconNames: {},
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

    let openSwipeRow = null;
    window.createSwipeDeleteRow = (content, options = {}) => {
      const revealWidth = 82;
      const row = document.createElement('div');
      const deleteButton = document.createElement('button');
      let startX = 0;
      let startY = 0;
      let startOffset = 0;
      let offset = 0;
      let tracking = false;
      let horizontal = false;
      let suppressClick = false;

      row.className = 'swipe-delete-row';
      deleteButton.type = 'button';
      deleteButton.className = 'swipe-delete-action';
      deleteButton.textContent = '删除';
      deleteButton.setAttribute('aria-label', options.deleteLabel || '删除此项');
      deleteButton.tabIndex = -1;
      row.append(deleteButton, content);

      const renderOffset = (nextOffset, animate = false) => {
        offset = Math.max(-revealWidth, Math.min(0, nextOffset));
        row.classList.toggle('swiping', !animate);
        content.style.transform = `translate3d(${offset}px, 0, 0)`;
      };
      const setOpen = open => {
        renderOffset(open ? -revealWidth : 0, true);
        row.classList.toggle('open', open);
        deleteButton.tabIndex = open ? 0 : -1;
        if (open) {
          if (openSwipeRow && openSwipeRow !== row) openSwipeRow.closeSwipe();
          openSwipeRow = row;
        } else if (openSwipeRow === row) {
          openSwipeRow = null;
        }
      };
      row.closeSwipe = () => setOpen(false);

      content.addEventListener('pointerdown', event => {
        if (!event.isPrimary || event.button > 0) return;
        if (openSwipeRow && openSwipeRow !== row) openSwipeRow.closeSwipe();
        tracking = true;
        horizontal = false;
        suppressClick = false;
        startX = event.clientX;
        startY = event.clientY;
        startOffset = row.classList.contains('open') ? -revealWidth : 0;
        content.setPointerCapture?.(event.pointerId);
      });
      content.addEventListener('pointermove', event => {
        if (!tracking) return;
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        if (!horizontal && Math.abs(deltaX) > 5 && Math.abs(deltaX) > Math.abs(deltaY)) horizontal = true;
        if (!horizontal) return;
        event.preventDefault();
        suppressClick = true;
        renderOffset(startOffset + deltaX);
      });
      const finishSwipe = event => {
        if (!tracking) return;
        tracking = false;
        content.releasePointerCapture?.(event.pointerId);
        if (horizontal) setOpen(offset < -revealWidth * .42);
      };
      content.addEventListener('pointerup', finishSwipe);
      content.addEventListener('pointercancel', event => {
        finishSwipe(event);
        setOpen(false);
      });
      content.addEventListener('click', event => {
        if (suppressClick) {
          suppressClick = false;
          event.preventDefault();
          event.stopImmediatePropagation();
          return;
        }
        if (row.classList.contains('open')) {
          event.preventDefault();
          event.stopImmediatePropagation();
          setOpen(false);
        }
      }, true);
      deleteButton.addEventListener('click', () => {
        if (openSwipeRow === row) openSwipeRow = null;
        options.onDelete?.();
      });
      row.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          setOpen(false);
          content.focus();
        }
      });
      return row;
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
