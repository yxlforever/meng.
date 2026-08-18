const applySavedState = savedState => {
      Object.assign(state, savedState);
      document.querySelectorAll('[contenteditable="true"]').forEach(field => {
        field.textContent = state[field.id];
      });
      window.updateSystemDay?.();
      document.querySelectorAll('.toggle').forEach(toggle => {
        const toggleKey = toggle.dataset.storageKey;
        toggle.classList.toggle('on', state.toggles[toggleKey] ?? toggle.classList.contains('on'));
      });
      if (state.avatar) {
        avatarImage.src = URL.createObjectURL(state.avatar);
        avatarImage.classList.add('has-image');
      }
      if (state.profileBackground) window.applyProfileBackground?.(state.profileBackground, state.profileBackgroundTheme);
      if (state.wallpaper) applyWallpaper(state.wallpaper, state.wallpaperName);
      if (state.globalFont) applyGlobalFont(state.globalFont, state.globalFontName);
      if (state.desktopIcon) applyDesktopIcon(state.desktopIcon, state.desktopIconName);
      state.appIcons = state.appIcons || {};
      state.appIconNames = state.appIconNames || {};
      if (state.appIcon && !Object.keys(state.appIcons).length) {
        document.querySelectorAll('[data-app-icon-id]').forEach(app => {
          state.appIcons[app.dataset.appIconId] = state.appIcon;
          state.appIconNames[app.dataset.appIconId] = state.appIconName;
        });
      }
      Object.entries(state.appIcons).forEach(([appId, icon]) => applyAppIcon(appId, icon, state.appIconNames[appId]));
      window.initializeChatApp?.();
      window.renderTransmissions?.();
    };

    openDatabase().then(readState).then(applySavedState).catch(error => {
      console.warn('无法初始化浏览器数据库，将不会保存数据。', error);
    });
