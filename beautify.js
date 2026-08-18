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
    const wallpaperStatus = document.getElementById('wallpaperStatus');
    const fontStatus = document.getElementById('fontStatus');
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
    let wallpaperUrl = '';
    let fontUrl = '';
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
        beautifyPreview.textContent = beautifyMode === 'wallpaper' ? '图片预览' : '字体预览 Aa 字体预览';
        return;
      }
      beautifyPreviewUrl = typeof source === 'string' ? source : URL.createObjectURL(source);
      if (beautifyMode === 'wallpaper') {
        beautifyPreview.style.cssText = `background-image:url("${beautifyPreviewUrl}");background-position:top center;background-size:100% auto;background-repeat:no-repeat;`;
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
    const openBeautifyDialog = mode => {
      beautifyMode = mode;
      beautifyDraft = null;
      beautifyDraftName = '';
      beautifyUrlInput.value = '';
      beautifyDialogError.textContent = '';
      beautifyDialogTitle.textContent = mode === 'wallpaper' ? '替换桌面壁纸' : '替换全局字体';
      beautifyDialogCopy.textContent = mode === 'wallpaper' ? '选择本地图片，或粘贴在线图片 URL。' : '选择本地字体，或粘贴字体文件 URL。';
      beautifyChooseFile.textContent = mode === 'wallpaper' ? '选择本地图片' : '选择本地字体';
      beautifyPreview.className = `beautify-preview ${mode}`;
      fontPresetPanel.hidden = mode !== 'font';
      if (mode === 'font') renderFontPresets();
      setBeautifySourceType('local');
      beautifyModal.classList.add('open');
      beautifyModal.setAttribute('aria-hidden', 'false');
    };
    const closeBeautifyDialog = () => {
      beautifyModal.classList.remove('open');
      beautifyModal.setAttribute('aria-hidden', 'true');
      clearBeautifyPreviewUrl();
      wallpaperInput.value = '';
      fontInput.value = '';
    };
    document.getElementById('wallpaperOption').addEventListener('click', () => openBeautifyDialog('wallpaper'));
    document.getElementById('fontOption').addEventListener('click', () => openBeautifyDialog('font'));
    beautifyLocalTab.addEventListener('click', () => setBeautifySourceType('local'));
    beautifyUrlTab.addEventListener('click', () => setBeautifySourceType('url'));
    beautifyChooseFile.addEventListener('click', () => (beautifyMode === 'wallpaper' ? wallpaperInput : fontInput).click());
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
      } else {
        state.globalFont = source;
        state.globalFontName = name;
        applyGlobalFont(source, name);
      }
      saveState();
      closeBeautifyDialog();
    });
