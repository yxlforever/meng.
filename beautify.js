const beautifyPage = document.getElementById('beautifyPage');
    const returnFromBeautify = () => {
      document.body.classList.remove('show-beautify');
      beautifyPage.classList.remove('active');
    };
    document.getElementById('beautifyApp').addEventListener('click', () => {
      document.body.classList.add('show-beautify');
      beautifyPage.classList.add('active');
    });
    const beautifyBack = document.getElementById('beautifyBack');
    beautifyBack.addEventListener('click', returnFromBeautify);
    beautifyBack.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        returnFromBeautify();
      }
    });
    const wallpaperInput = document.getElementById('wallpaperInput');
    const fontInput = document.getElementById('fontInput');
    const desktopIconInput = document.getElementById('desktopIconInput');
    const appIconInput = document.getElementById('appIconInput');
    const wallpaperStatus = document.getElementById('wallpaperStatus');
    const fontStatus = document.getElementById('fontStatus');
    const desktopIconStatus = document.getElementById('desktopIconStatus');
    const appIconStatus = document.getElementById('appIconStatus');
    const beautifyModal = document.getElementById('beautifyModal');
    const beautifyForm = document.getElementById('beautifyForm');
    const beautifyDialogTitle = document.getElementById('beautifyDialogTitle');
    const beautifyDialogCopy = document.getElementById('beautifyDialogCopy');
    const beautifyLocalTab = document.getElementById('beautifyLocalTab');
    const beautifyUrlTab = document.getElementById('beautifyUrlTab');
    const beautifyLocalPane = document.getElementById('beautifyLocalPane');
    const beautifyUrlPane = document.getElementById('beautifyUrlPane');
    const beautifyChooseFile = document.getElementById('beautifyChooseFile');
    const beautifyUrlInput = document.getElementById('beautifyUrlInput');
    const beautifyPreview = document.getElementById('beautifyPreview');
    const beautifyDialogError = document.getElementById('beautifyDialogError');
    const fontPresetPanel = document.getElementById('fontPresetPanel');
    const fontPresetSelect = document.getElementById('fontPresetSelect');
    const appIconPicker = document.getElementById('appIconPicker');
    const appIconChoices = [...document.querySelectorAll('[data-app-icon-target]')];
    let wallpaperUrl = '';
    let fontUrl = '';
    let desktopIconUrl = '';
    let desktopManifestUrl = '';
    const appIconUrls = {};
    let selectedAppIconId = '';
    let beautifyMode = 'wallpaper';
    let beautifySourceType = 'local';
    let beautifyDraft = null;
    let beautifyDraftName = '';
    let beautifyPreviewUrl = '';
    const sourceUrl = (source, previousUrl = '') => {
      if (previousUrl && previousUrl.startsWith('blob:')) URL.revokeObjectURL(previousUrl);
      return typeof source === 'string' ? source : source ? URL.createObjectURL(source) : '';
    };
    const applyWallpaper = (wallpaper, name = '') => {
      wallpaperUrl = sourceUrl(wallpaper, wallpaperUrl);
      document.body.style.backgroundImage = wallpaperUrl ? `url("${wallpaperUrl}")` : '';
      document.body.style.backgroundSize = wallpaperUrl ? 'cover' : '';
      document.body.style.backgroundPosition = wallpaperUrl ? 'center' : '';
      document.body.style.backgroundAttachment = wallpaperUrl ? 'fixed' : '';
      document.querySelector('.home-shell').style.background = wallpaperUrl ? 'transparent' : '';
      wallpaperStatus.textContent = name || '选择一张喜欢的图片';
    };
    const applyGlobalFont = (font, name = '') => {
      fontUrl = sourceUrl(font, fontUrl);
      document.getElementById('userGlobalFontFace')?.remove();
      if (fontUrl) {
        const fontFaceStyle = document.createElement('style');
        fontFaceStyle.id = 'userGlobalFontFace';
        fontFaceStyle.textContent = `@font-face { font-family: "UserGlobalFont"; src: url("${fontUrl}"); font-display: swap; }`;
        document.head.append(fontFaceStyle);
      }
      document.body.classList.toggle('has-custom-font', Boolean(fontUrl));
      fontStatus.textContent = name || '使用系统默认字体';
    };
    const applyDesktopIcon = (icon, name = '') => {
      desktopIconUrl = sourceUrl(icon, desktopIconUrl);
      const appleTouchIcon = document.getElementById('appleTouchIcon');
      if (desktopIconUrl) appleTouchIcon.href = desktopIconUrl;
      if (desktopManifestUrl) URL.revokeObjectURL(desktopManifestUrl);
      desktopManifestUrl = '';
      const manifestLink = document.getElementById('appManifestLink');
      if (desktopIconUrl) {
        const manifest = {
          name: '梦', short_name: '梦', description: '梦个人主页', start_url: './index.html', scope: './',
          display: 'fullscreen', display_override: ['fullscreen', 'standalone', 'minimal-ui'],
          background_color: '#f7f7f5', theme_color: '#f7f7f5',
          icons: [{ src: desktopIconUrl, sizes: '512x512', purpose: 'any maskable' }]
        };
        desktopManifestUrl = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }));
        manifestLink.href = desktopManifestUrl;
      }
      desktopIconStatus.textContent = name || '使用默认 PWA 图标';
    };
    const appNames = { chat: '聊天', archive: '档案', transmission: '传讯', theater: '小剧场', settings: '设置', beautify: '美化' };
    appIconChoices.forEach(choice => {
      const appId = choice.dataset.appIconTarget;
      const sourceIcon = document.querySelector(`[data-app-icon-id="${appId}"] .app-icon`);
      const preview = choice.querySelector('.app-icon-choice-preview');
      if (sourceIcon && preview) preview.innerHTML = sourceIcon.innerHTML;
    });
    const applyAppIcon = (appId, icon, name = '') => {
      if (!appId) return;
      appIconUrls[appId] = sourceUrl(icon, appIconUrls[appId]);
      const iconUrl = appIconUrls[appId];
      const iconElement = document.querySelector(`[data-app-icon-id="${appId}"] .app-icon`);
      if (iconElement) {
        iconElement.style.backgroundImage = iconUrl ? `url("${iconUrl}")` : '';
        iconElement.style.backgroundPosition = iconUrl ? 'center' : '';
        iconElement.style.backgroundSize = iconUrl ? 'cover' : '';
        iconElement.style.backgroundRepeat = iconUrl ? 'no-repeat' : '';
        iconElement.classList.toggle('has-custom-icon', Boolean(iconUrl));
      }
      const choicePreview = document.querySelector(`[data-app-icon-target="${appId}"] .app-icon-choice-preview`);
      if (choicePreview) choicePreview.style.backgroundImage = iconUrl ? `url("${iconUrl}")` : '';
      const changedCount = Object.values(state.appIcons || {}).filter(Boolean).length;
      appIconStatus.textContent = changedCount ? `已更换 ${changedCount} 个应用图标` : '使用默认应用图标';
      if (name && selectedAppIconId === appId) beautifyDialogCopy.textContent = `${appNames[appId]} · ${name}`;
    };
    const clearBeautifyPreviewUrl = () => {
      if (beautifyPreviewUrl.startsWith('blob:')) URL.revokeObjectURL(beautifyPreviewUrl);
      beautifyPreviewUrl = '';
      document.getElementById('beautifyPreviewFontFace')?.remove();
    };
    const renderBeautifyPreview = () => {
      clearBeautifyPreviewUrl();
      const source = beautifySourceType === 'url' ? beautifyUrlInput.value.trim() : beautifyDraft;
      if (!source) {
        beautifyPreview.removeAttribute('style');
        beautifyPreview.textContent = beautifyMode === 'font' ? '字体预览 Aa 字体预览' : '图片预览';
        return;
      }
      beautifyPreviewUrl = typeof source === 'string' ? source : URL.createObjectURL(source);
      if (beautifyMode !== 'font') {
        const isIconMode = beautifyMode === 'desktopIcon' || beautifyMode === 'appIcon';
        const backgroundSize = isIconMode ? 'contain' : '100% auto';
        const backgroundPosition = isIconMode ? 'center' : 'top center';
        beautifyPreview.style.cssText = `background-image:url("${beautifyPreviewUrl}");background-position:${backgroundPosition};background-size:${backgroundSize};background-repeat:no-repeat;`;
        beautifyPreview.textContent = '';
      } else {
        const previewStyle = document.createElement('style');
        previewStyle.id = 'beautifyPreviewFontFace';
        previewStyle.textContent = `@font-face { font-family: "BeautifyPreviewFont"; src: url("${beautifyPreviewUrl}"); }`;
        document.head.append(previewStyle);
        beautifyPreview.style.cssText = 'font-family:"BeautifyPreviewFont",sans-serif;';
        beautifyPreview.textContent = 'Aa 字体预览 你好，世界';
      }
    };
    const renderFontPresets = () => {
      const selectedId = fontPresetSelect.value;
      fontPresetSelect.replaceChildren(new Option('选择字体预设', ''));
      (state.fontPresets || []).forEach(preset => fontPresetSelect.add(new Option(preset.name, preset.id)));
      if ((state.fontPresets || []).some(preset => preset.id === selectedId)) fontPresetSelect.value = selectedId;
    };
    const loadFontPreset = preset => {
      if (!preset) return;
      beautifyDraft = preset.source;
      beautifyDraftName = preset.name;
      beautifySourceType = typeof preset.source === 'string' ? 'url' : 'local';
      beautifyUrlInput.value = typeof preset.source === 'string' ? preset.source : '';
      beautifyLocalTab.classList.toggle('active', beautifySourceType === 'local');
      beautifyUrlTab.classList.toggle('active', beautifySourceType === 'url');
      beautifyLocalPane.hidden = beautifySourceType !== 'local';
      beautifyUrlPane.hidden = beautifySourceType !== 'url';
      beautifyChooseFile.textContent = beautifySourceType === 'local' ? preset.name : '选择本地字体';
      renderBeautifyPreview();
    };
    const setBeautifySourceType = type => {
      beautifySourceType = type;
      beautifyLocalTab.classList.toggle('active', type === 'local');
      beautifyUrlTab.classList.toggle('active', type === 'url');
      beautifyLocalPane.hidden = type !== 'local';
      beautifyUrlPane.hidden = type !== 'url';
      beautifyDialogError.textContent = '';
      renderBeautifyPreview();
      if (type === 'url') beautifyUrlInput.focus();
    };
    const selectAppIconTarget = appId => {
      selectedAppIconId = appId;
      appIconChoices.forEach(choice => choice.classList.toggle('selected', choice.dataset.appIconTarget === appId));
      beautifyDialogTitle.textContent = `更换“${appNames[appId]}”图标`;
      beautifyDialogCopy.textContent = '为这个应用选择一张独立的图标图片。';
      beautifyDialogError.textContent = '';
      beautifyDraft = null;
      beautifyDraftName = '';
      beautifyUrlInput.value = '';
      beautifyChooseFile.textContent = '选择本地图标';
      renderBeautifyPreview();
    };
    appIconChoices.forEach(choice => choice.addEventListener('click', () => selectAppIconTarget(choice.dataset.appIconTarget)));
    const openBeautifyDialog = mode => {
      beautifyMode = mode;
      beautifyDraft = null;
      beautifyDraftName = '';
      beautifyUrlInput.value = '';
      beautifyDialogError.textContent = '';
      const isImageMode = mode !== 'font';
      beautifyDialogTitle.textContent = mode === 'wallpaper' ? '替换桌面壁纸' : mode === 'desktopIcon' ? '更换桌面图标' : mode === 'appIcon' ? '选择应用' : '替换全局字体';
      beautifyDialogCopy.textContent = mode === 'appIcon' ? '先选择一个应用，再为它单独更换图标。' : isImageMode ? '选择本地图片，或粘贴在线图片 URL。' : '选择本地字体，或粘贴字体文件 URL。';
      beautifyChooseFile.textContent = isImageMode ? '选择本地图片' : '选择本地字体';
      beautifyPreview.className = `beautify-preview ${mode}`;
      fontPresetPanel.hidden = mode !== 'font';
      appIconPicker.hidden = mode !== 'appIcon';
      if (mode === 'font') renderFontPresets();
      setBeautifySourceType('local');
      if (mode === 'appIcon') selectAppIconTarget(selectedAppIconId || 'chat');
      beautifyModal.classList.add('open');
      beautifyModal.setAttribute('aria-hidden', 'false');
    };
    const closeBeautifyDialog = () => {
      beautifyModal.classList.remove('open');
      beautifyModal.setAttribute('aria-hidden', 'true');
      clearBeautifyPreviewUrl();
      wallpaperInput.value = '';
      fontInput.value = '';
      desktopIconInput.value = '';
      appIconInput.value = '';
    };
    document.getElementById('wallpaperOption').addEventListener('click', () => openBeautifyDialog('wallpaper'));
    document.getElementById('fontOption').addEventListener('click', () => openBeautifyDialog('font'));
    document.getElementById('desktopIconOption').addEventListener('click', () => openBeautifyDialog('desktopIcon'));
    document.getElementById('appIconOption').addEventListener('click', () => openBeautifyDialog('appIcon'));
    beautifyLocalTab.addEventListener('click', () => setBeautifySourceType('local'));
    beautifyUrlTab.addEventListener('click', () => setBeautifySourceType('url'));
    beautifyChooseFile.addEventListener('click', () => {
      const input = beautifyMode === 'font' ? fontInput : beautifyMode === 'desktopIcon' ? desktopIconInput : beautifyMode === 'appIcon' ? appIconInput : wallpaperInput;
      input.click();
    });
    beautifyUrlInput.addEventListener('input', renderBeautifyPreview);
    fontPresetSelect.addEventListener('change', () => loadFontPreset((state.fontPresets || []).find(preset => preset.id === fontPresetSelect.value)));
    document.getElementById('saveFontPreset').addEventListener('click', () => {
      const source = beautifySourceType === 'url' ? beautifyUrlInput.value.trim() : beautifyDraft;
      if (!source) {
        beautifyDialogError.textContent = '请先选择字体文件或填写字体 URL。';
        return;
      }
      const suggestedName = beautifyDraftName || (typeof source === 'string' ? source.split('/').pop() : '') || '我的字体';
      const name = window.prompt('预设名称', suggestedName)?.trim();
      if (!name) return;
      state.fontPresets = state.fontPresets || [];
      const preset = { id: crypto.randomUUID(), name, source };
      state.fontPresets.push(preset);
      saveState();
      renderFontPresets();
      fontPresetSelect.value = preset.id;
      beautifyDialogError.textContent = '字体预设已保存。';
    });
    document.getElementById('deleteFontPreset').addEventListener('click', () => {
      const id = fontPresetSelect.value;
      if (!id) {
        beautifyDialogError.textContent = '请先选择要删除的预设。';
        return;
      }
      state.fontPresets = (state.fontPresets || []).filter(preset => preset.id !== id);
      saveState();
      renderFontPresets();
      beautifyDialogError.textContent = '字体预设已删除。';
    });
    wallpaperInput.addEventListener('change', event => {
      const [file] = event.target.files;
      if (!file) return;
      beautifyDraft = file;
      beautifyDraftName = file.name;
      beautifyChooseFile.textContent = file.name;
      renderBeautifyPreview();
    });
    fontInput.addEventListener('change', event => {
      const [file] = event.target.files;
      if (!file) return;
      beautifyDraft = file;
      beautifyDraftName = file.name;
      beautifyChooseFile.textContent = file.name;
      renderBeautifyPreview();
    });
    desktopIconInput.addEventListener('change', event => {
      const [file] = event.target.files;
      if (!file) return;
      beautifyDraft = file;
      beautifyDraftName = file.name;
      beautifyChooseFile.textContent = file.name;
      renderBeautifyPreview();
    });
    appIconInput.addEventListener('change', event => {
      const [file] = event.target.files;
      if (!file) return;
      beautifyDraft = file;
      beautifyDraftName = file.name;
      beautifyChooseFile.textContent = file.name;
      renderBeautifyPreview();
    });
    document.getElementById('beautifyCancel').addEventListener('click', closeBeautifyDialog);
    beautifyModal.addEventListener('click', event => {
      if (event.target === beautifyModal) closeBeautifyDialog();
    });
    beautifyForm.addEventListener('submit', event => {
      event.preventDefault();
      const source = beautifySourceType === 'url' ? beautifyUrlInput.value.trim() : beautifyDraft;
      if (!source) {
        beautifyDialogError.textContent = beautifySourceType === 'url' ? '请填写有效的 URL。' : '请先选择一个文件。';
        return;
      }
      if (typeof source === 'string') {
        try {
          const parsedUrl = new URL(source);
          if (!['http:', 'https:', 'data:'].includes(parsedUrl.protocol)) throw new Error();
        } catch {
          beautifyDialogError.textContent = '请输入以 http:// 或 https:// 开头的有效 URL。';
          return;
        }
      }
      const name = beautifySourceType === 'url' ? source : beautifyDraftName;
      if (beautifyMode === 'wallpaper') {
        state.wallpaper = source;
        state.wallpaperName = name;
        applyWallpaper(source, name);
      } else if (beautifyMode === 'desktopIcon') {
        state.desktopIcon = source;
        state.desktopIconName = name;
        applyDesktopIcon(source, name);
      } else if (beautifyMode === 'appIcon') {
        state.appIcons = state.appIcons || {};
        state.appIconNames = state.appIconNames || {};
        state.appIcons[selectedAppIconId] = source;
        state.appIconNames[selectedAppIconId] = name;
        applyAppIcon(selectedAppIconId, source, name);
      } else {
        state.globalFont = source;
        state.globalFontName = name;
        applyGlobalFont(source, name);
      }
      saveState();
      closeBeautifyDialog();
    });
