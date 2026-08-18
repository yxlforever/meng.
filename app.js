const applySavedState = savedState => {
      Object.assign(state, savedState);
      document.querySelectorAll('[contenteditable="true"]').forEach(field => {
        field.textContent = state[field.id];
      });
      document.querySelectorAll('.day').forEach(day => {
        day.classList.toggle('active', day.dataset.day === state.activeDay);
      });
      document.querySelectorAll('.toggle').forEach(toggle => {
        const toggleKey = toggle.dataset.storageKey;
        toggle.classList.toggle('on', state.toggles[toggleKey] ?? toggle.classList.contains('on'));
      });
      if (state.avatar) {
        avatarImage.src = URL.createObjectURL(state.avatar);
        avatarImage.classList.add('has-image');
      }
      if (state.wallpaper) applyWallpaper(state.wallpaper, state.wallpaperName);
      if (state.globalFont) applyGlobalFont(state.globalFont, state.globalFontName);
      window.initializeChatApp?.();
      window.renderTransmissions?.();
    };

    openDatabase().then(readState).then(applySavedState).catch(error => {
      console.warn('无法初始化浏览器数据库，将不会保存数据。', error);
    });
