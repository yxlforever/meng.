(() => {
    const chatRoot = document.getElementById('chatPage');
    const threadRoot = document.getElementById('threadPage');
    const settingsRoot = document.getElementById('threadSettingsPage');
    if (!chatRoot || !threadRoot || !settingsRoot) return;

    document.getElementById('chatApp').addEventListener('click', () => {
      document.body.classList.add('show-chat');
      document.getElementById('chatPage').classList.add('active');
    });
    const returnHome = () => {
      document.body.classList.remove('show-chat');
      document.getElementById('chatPage').classList.remove('active');
    };
    const chatBack = document.getElementById('chatBack');
    chatBack.addEventListener('click', returnHome);
    const noteModal = document.getElementById('noteModal');
    const noteForm = document.getElementById('noteForm');
    const noteNameInput = document.getElementById('noteNameInput');
    const conversationList = document.getElementById('conversationList');
    const defaultAvatar = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.4"/><path d="M5.5 20c.7-3.6 3.1-5.4 6.5-5.4s5.8 1.8 6.5 5.4"/></svg>';
    const renderConversations = () => {
      conversationList.replaceChildren();
      state.conversations.forEach(conversation => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'conversation-item';
        item.setAttribute('aria-label', `打开与${conversation.name}的对话`);
        item.innerHTML = `<span class="conversation-avatar">${avatarMarkup(conversation.chatAvatar)}</span><span class="conversation-name"></span>`;
        item.querySelector('.conversation-name').textContent = conversation.name;
        item.addEventListener('click', () => openThread(conversation));
        const row = window.createSwipeDeleteRow(item, {
          deleteLabel: `删除与${conversation.name}的对话`,
          onDelete: () => {
            state.conversations = state.conversations.filter(entry => entry.id !== conversation.id);
            if (state.currentConversationId === conversation.id) state.currentConversationId = '';
            saveState();
            renderConversations();
          }
        });
        conversationList.append(row);
      });
    };
    const threadPage = document.getElementById('threadPage');
    const threadName = document.getElementById('threadName');
    const threadAvatar = document.getElementById('threadAvatar');
    const messageArea = document.getElementById('messageArea');
    const messageInput = document.getElementById('messageInput');
    const scrollMessagesToBottom = () => {
      requestAnimationFrame(() => {
        messageArea.scrollTop = messageArea.scrollHeight;
      });
    };
    const keepLatestMessageVisible = () => {
      scrollMessagesToBottom();
      window.setTimeout(scrollMessagesToBottom, 120);
      window.setTimeout(scrollMessagesToBottom, 320);
    };
    messageInput.addEventListener('focus', keepLatestMessageVisible);
    window.addEventListener('resize', () => {
      if (document.body.classList.contains('show-thread')) keepLatestMessageVisible();
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        if (document.body.classList.contains('show-thread')) keepLatestMessageVisible();
      });
    }
    const appendMessage = (conversation, message) => {
      const item = document.createElement('div');
      item.className = `message ${message.mine ? 'outgoing' : 'incoming'}`;
      const messageAvatar = message.mine ? conversation.userAvatar : conversation.chatAvatar;
      item.innerHTML = `<span class="message-avatar">${avatarMarkup(messageAvatar)}</span><span class="message-bubble"></span>`;
      const bubble = item.querySelector('.message-bubble');
      if (message.imageUrl) {
        item.classList.add('image-message');
        bubble.classList.add('image-bubble');
        const image = document.createElement('img');
        image.src = message.imageUrl;
        image.alt = message.imageName || '表情';
        image.loading = 'lazy';
        bubble.append(image);
      } else {
        bubble.textContent = message.text;
      }
      messageArea.append(item);
    };
    const renderMessages = conversation => {
      messageArea.replaceChildren();
      (conversation.messages || []).forEach(message => appendMessage(conversation, message));
      scrollMessagesToBottom();
    };
    const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const getImportedEmojis = () => (state.emojiCategories || []).flatMap(category => category.items || []).filter(item => item?.url);
    const scheduleAutoReplies = conversation => {
      const cards = (conversation.replyCards || []).filter(Boolean);
      if (!cards.length) return;
      const minCount = Math.min(99, Math.max(1, Number(conversation.replyCountMin) || Number(conversation.replyCount) || 1));
      const maxCount = Math.min(99, Math.max(minCount, Number(conversation.replyCountMax) || Number(conversation.replyCount) || 3));
      const count = randomBetween(minCount, maxCount);
      const minDelay = Math.max(1, Number(conversation.replyMin) || 3);
      const maxDelay = Math.max(minDelay, Number(conversation.replyMax) || 10);
      const emojiProbability = Math.min(100, Math.max(0, Number(conversation.emojiProbability) || 0));
      const delay = randomBetween(minDelay, maxDelay) * 1000;
      conversation.pendingReplies = (conversation.pendingReplies || 0) + count;
      window.setTimeout(() => {
        const importedEmojis = getImportedEmojis();
        const sendReply = index => {
          conversation.messages = conversation.messages || [];
          const shouldSendEmoji = importedEmojis.length > 0 && Math.random() * 100 < emojiProbability;
          if (shouldSendEmoji) {
            const emoji = importedEmojis[randomBetween(0, importedEmojis.length - 1)];
            conversation.messages.push({ imageUrl: emoji.url, imageName: emoji.name, mine: false });
          } else {
            const card = cards[randomBetween(0, cards.length - 1)];
            conversation.messages.push({ text: card, mine: false });
          }
          conversation.pendingReplies = Math.max(0, (conversation.pendingReplies || 0) - 1);
          if (state.currentConversationId === conversation.id) renderMessages(conversation);
          saveState();
          if (index + 1 < count) window.setTimeout(() => sendReply(index + 1), randomBetween(450, 1400));
        };
        sendReply(0);
      }, delay);
    };
    let wallpaperRenderId = 0;
    const setThreadWallpaperStyles = url => {
      threadPage.style.backgroundImage = url ? `url("${url}")` : '';
      threadPage.style.backgroundSize = url ? 'cover' : '';
      threadPage.style.backgroundPosition = url ? 'center' : '';
      threadPage.style.backgroundRepeat = url ? 'no-repeat' : '';
    };
    const readImageAsDataUrl = file => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(String(reader.result || '')));
      reader.addEventListener('error', () => reject(reader.error));
      reader.readAsDataURL(file);
    });
    const applyThreadWallpaper = async conversation => {
      const renderId = ++wallpaperRenderId;
      const wallpaper = conversation?.wallpaper;
      if (!wallpaper) {
        setThreadWallpaperStyles('');
        return;
      }
      if (typeof wallpaper === 'string') {
        setThreadWallpaperStyles(wallpaper);
        return;
      }
      try {
        const dataUrl = await readImageAsDataUrl(wallpaper);
        if (renderId !== wallpaperRenderId) return;
        conversation.wallpaper = dataUrl;
        setThreadWallpaperStyles(dataUrl);
        saveState();
      } catch (error) {
        console.warn('无法读取聊天壁纸。', error);
        if (renderId === wallpaperRenderId) setThreadWallpaperStyles('');
      }
    };
    const openThread = conversation => {
      state.currentConversationId = conversation.id;
      threadName.textContent = conversation.name;
      threadAvatar.innerHTML = avatarMarkup(conversation.chatAvatar);
      applyThreadWallpaper(conversation);
      renderMessages(conversation);
      document.body.classList.add('show-thread');
      threadPage.classList.add('active');
    };
    const closeThread = () => {
      document.body.classList.remove('show-thread');
      threadPage.classList.remove('active');
      const panel = document.getElementById('emojiPanel');
      const button = document.querySelector('#messageForm .message-emoji');
      panel?.classList.remove('open');
      panel?.setAttribute('aria-hidden', 'true');
      button?.setAttribute('aria-expanded', 'false');
    };
    document.getElementById('threadBack').addEventListener('click', closeThread);
    const threadSettingsPage = document.getElementById('threadSettingsPage');
    const threadSettingsNameInput = document.getElementById('threadSettingsNameInput');
    const threadChatAvatar = document.getElementById('threadChatAvatar');
    const threadUserAvatar = document.getElementById('threadUserAvatar');
    const threadAvatarInput = document.getElementById('threadAvatarInput');
    const replyCountMinInput = document.getElementById('replyCountMinInput');
    const replyCountMaxInput = document.getElementById('replyCountMaxInput');
    const replyMinInput = document.getElementById('replyMinInput');
    const replyMaxInput = document.getElementById('replyMaxInput');
    const emojiProbabilityInput = document.getElementById('emojiProbabilityInput');
    const threadWallpaperInput = document.getElementById('threadWallpaperInput');
    const threadWallpaperStatus = document.getElementById('threadWallpaperStatus');
    const removeThreadWallpaper = document.getElementById('removeThreadWallpaper');
    const updateThreadWallpaperControls = conversation => {
      const hasWallpaper = Boolean(conversation?.wallpaper);
      threadWallpaperStatus.textContent = hasWallpaper ? (conversation.wallpaperName || '已设置聊天壁纸') : '默认背景';
      removeThreadWallpaper.disabled = !hasWallpaper;
    };
    const cardLibraryModal = document.getElementById('cardLibraryModal');
    const cardLibraryDialog = document.getElementById('cardLibraryDialog');
    const cardLibraryList = document.getElementById('cardLibraryList');
    const cardLibraryEditor = document.getElementById('cardLibraryEditor');
    const cardLibraryFile = document.getElementById('cardLibraryFile');
    let selectedAvatarTarget = null;
    let cardLibraryDraft = [];
    const renderCardLibrary = cards => {
      cardLibraryList.replaceChildren();
      (cards.length ? cards : ['暂无字卡']).forEach(text => {
        const item = document.createElement('div');
        item.className = 'card-library-item';
        item.textContent = text;
        cardLibraryList.append(item);
      });
    };
    const openCardLibrary = () => {
      const conversation = state.conversations.find(item => item.id === state.currentConversationId);
      if (!conversation) return;
      cardLibraryDraft = [...(conversation.replyCards || [])];
      renderCardLibrary(cardLibraryDraft);
      cardLibraryDialog.classList.remove('editing');
      cardLibraryModal.classList.add('open');
      cardLibraryModal.setAttribute('aria-hidden', 'false');
    };
    const closeCardLibrary = () => {
      cardLibraryModal.classList.remove('open');
      cardLibraryModal.setAttribute('aria-hidden', 'true');
    };
    const avatarMarkup = source => source ? `<img src="${source}" alt="" />` : defaultAvatar;
    const openThreadSettings = () => {
      const conversation = state.conversations.find(item => item.id === state.currentConversationId);
      if (!conversation) return;
      threadSettingsNameInput.value = conversation.name;
      threadChatAvatar.innerHTML = avatarMarkup(conversation.chatAvatar);
      threadUserAvatar.innerHTML = avatarMarkup(conversation.userAvatar);
      replyCountMinInput.value = conversation.replyCountMin || conversation.replyCount || 1;
      replyCountMaxInput.value = conversation.replyCountMax || conversation.replyCount || 3;
      replyMinInput.value = conversation.replyMin || 3;
      replyMaxInput.value = conversation.replyMax || 10;
      emojiProbabilityInput.value = conversation.emojiProbability ?? 20;
      updateThreadWallpaperControls(conversation);
      document.body.classList.add('show-thread-settings');
      threadSettingsPage.classList.add('active');
    };
    const closeThreadSettings = () => {
      document.body.classList.remove('show-thread-settings');
      threadSettingsPage.classList.remove('active');
    };
    threadAvatar.addEventListener('click', openThreadSettings);
    document.getElementById('threadSettingsBack').addEventListener('click', closeThreadSettings);
    document.getElementById('threadSettingsSave').addEventListener('click', () => {
      const conversation = state.conversations.find(item => item.id === state.currentConversationId);
      const name = threadSettingsNameInput.value.trim();
      if (!conversation || !name) return;
      conversation.name = name;
      conversation.replyCountMin = Math.min(99, Math.max(1, Number(replyCountMinInput.value) || 1));
      conversation.replyCountMax = Math.min(99, Math.max(conversation.replyCountMin, Number(replyCountMaxInput.value) || 3));
      delete conversation.replyCount;
      conversation.replyMin = Math.max(1, Number(replyMinInput.value) || 3);
      conversation.replyMax = Math.max(conversation.replyMin, Number(replyMaxInput.value) || 10);
      conversation.emojiProbability = Math.min(100, Math.max(0, Number(emojiProbabilityInput.value) || 0));
      threadName.textContent = name;
      renderConversations();
      renderMessages(conversation);
      saveState();
      closeThreadSettings();
    });
    document.getElementById('openCardLibrary').addEventListener('click', openCardLibrary);
    document.getElementById('changeThreadWallpaper').addEventListener('click', () => threadWallpaperInput.click());
    threadWallpaperInput.addEventListener('change', async event => {
      const [file] = event.target.files;
      const conversation = state.conversations.find(item => item.id === state.currentConversationId);
      if (!file || !conversation) return;
      try {
        conversation.wallpaper = await readImageAsDataUrl(file);
        conversation.wallpaperName = file.name;
        await applyThreadWallpaper(conversation);
        updateThreadWallpaperControls(conversation);
        saveState();
      } catch (error) {
        console.warn('无法设置聊天壁纸。', error);
      } finally {
        threadWallpaperInput.value = '';
      }
    });
    removeThreadWallpaper.addEventListener('click', () => {
      const conversation = state.conversations.find(item => item.id === state.currentConversationId);
      if (!conversation?.wallpaper) return;
      delete conversation.wallpaper;
      delete conversation.wallpaperName;
      applyThreadWallpaper(conversation);
      updateThreadWallpaperControls(conversation);
      saveState();
    });
    cardLibraryModal.addEventListener('click', event => {
      if (event.target === cardLibraryModal) closeCardLibrary();
    });
    document.getElementById('cardLibraryEdit').addEventListener('click', () => {
      cardLibraryEditor.value = cardLibraryDraft.join('\n');
      cardLibraryDialog.classList.add('editing');
      cardLibraryEditor.focus();
    });
    document.getElementById('cardLibrarySave').addEventListener('click', () => {
      const conversation = state.conversations.find(item => item.id === state.currentConversationId);
      if (cardLibraryDialog.classList.contains('editing')) {
        cardLibraryDraft = cardLibraryEditor.value.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
        renderCardLibrary(cardLibraryDraft);
        cardLibraryDialog.classList.remove('editing');
      }
      if (conversation) {
        conversation.replyCards = [...cardLibraryDraft];
        saveState();
      }
      closeCardLibrary();
    });
    document.getElementById('cardLibraryImport').addEventListener('click', () => cardLibraryFile.click());
    cardLibraryFile.addEventListener('change', event => {
      const [file] = event.target.files;
      if (!file) return;
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        cardLibraryDraft = String(reader.result || '').split(/\r?\n/).map(item => item.trim()).filter(Boolean);
        renderCardLibrary(cardLibraryDraft);
        cardLibraryFile.value = '';
      });
      reader.readAsText(file);
    });
    document.getElementById('cardLibraryExport').addEventListener('click', () => {
      const blob = new Blob([cardLibraryDraft.join('\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '字卡库.txt';
      link.click();
      URL.revokeObjectURL(url);
    });
    threadSettingsNameInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('threadSettingsSave').click();
      }
    });
    [threadChatAvatar, threadUserAvatar].forEach(button => button.addEventListener('click', () => {
      selectedAvatarTarget = button === threadChatAvatar ? 'chatAvatar' : 'userAvatar';
      threadAvatarInput.click();
    }));
    threadAvatarInput.addEventListener('change', () => {
      const file = threadAvatarInput.files[0];
      const conversation = state.conversations.find(item => item.id === state.currentConversationId);
      if (!file || !conversation || !selectedAvatarTarget) return;
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        conversation[selectedAvatarTarget] = reader.result;
        threadChatAvatar.innerHTML = avatarMarkup(conversation.chatAvatar);
        threadUserAvatar.innerHTML = avatarMarkup(conversation.userAvatar);
        threadAvatar.innerHTML = avatarMarkup(conversation.chatAvatar);
        renderConversations();
        renderMessages(conversation);
        saveState();
        threadAvatarInput.value = '';
      });
      reader.readAsDataURL(file);
    });
    const emojiPanel = document.getElementById('emojiPanel');
    const emojiPanelTabs = document.getElementById('emojiPanelTabs');
    const emojiGrid = document.getElementById('emojiGrid');
    const messageForm = document.getElementById('messageForm');
    const emojiButton = messageForm.querySelector('.message-emoji');
    const emojiImportModal = document.getElementById('emojiImportModal');
    const emojiImportForm = document.getElementById('emojiImportForm');
    const emojiCategoryInput = document.getElementById('emojiCategoryInput');
    const emojiFileTab = document.getElementById('emojiFileTab');
    const emojiPasteTab = document.getElementById('emojiPasteTab');
    const emojiFilePane = document.getElementById('emojiFilePane');
    const emojiPastePane = document.getElementById('emojiPastePane');
    const emojiImportFile = document.getElementById('emojiImportFile');
    const emojiImportText = document.getElementById('emojiImportText');
    const emojiChooseFile = document.getElementById('emojiChooseFile');
    const emojiImportError = document.getElementById('emojiImportError');
    let activeEmojiCategoryId = '';
    let emojiImportMode = 'file';
    let emojiFileContent = '';
    const closeEmojiPanel = () => {
      emojiPanel.classList.remove('open');
      emojiPanel.setAttribute('aria-hidden', 'true');
      emojiButton.setAttribute('aria-expanded', 'false');
    };
    const parseEmojiList = content => String(content || '').split(/\r?\n/).map(line => {
      const value = line.trim();
      if (!value) return null;
      const urlMatch = value.match(/https?:\/\/\S+/i);
      if (!urlMatch) return null;
      const url = urlMatch[0].replace(/[，,;；]+$/, '');
      const name = value.slice(0, urlMatch.index).replace(/[\s:：]+$/, '').trim() || '表情';
      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) return null;
      } catch {
        return null;
      }
      return { name, url };
    }).filter(Boolean);
    const renderEmojiPanel = () => {
      const categories = state.emojiCategories || [];
      if (!categories.some(category => category.id === activeEmojiCategoryId)) activeEmojiCategoryId = categories[0]?.id || '';
      emojiPanelTabs.querySelectorAll('.emoji-tab').forEach(tab => tab.remove());
      const importButton = document.getElementById('emojiImportOpen');
      categories.forEach(category => {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = `emoji-tab${category.id === activeEmojiCategoryId ? ' active' : ''}`;
        tab.textContent = category.name;
        tab.title = category.name;
        tab.addEventListener('click', () => {
          activeEmojiCategoryId = category.id;
          renderEmojiPanel();
        });
        emojiPanelTabs.insertBefore(tab, importButton);
      });
      emojiGrid.replaceChildren();
      const activeCategory = categories.find(category => category.id === activeEmojiCategoryId);
      if (!activeCategory?.items?.length) {
        const empty = document.createElement('p');
        empty.className = 'emoji-empty';
        empty.textContent = categories.length ? '这个分类还没有表情' : '点击“导入”添加表情包';
        emojiGrid.append(empty);
        return;
      }
      activeCategory.items.forEach(emoji => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'emoji-item';
        button.title = emoji.name;
        const image = document.createElement('img');
        image.src = emoji.url;
        image.alt = emoji.name;
        image.loading = 'lazy';
        const label = document.createElement('span');
        label.textContent = emoji.name;
        button.append(image, label);
        button.addEventListener('click', () => {
          const conversation = state.conversations.find(item => item.id === state.currentConversationId);
          if (!conversation) return;
          conversation.messages = conversation.messages || [];
          conversation.messages.push({ imageUrl: emoji.url, imageName: emoji.name, mine: true });
          renderMessages(conversation);
          saveState();
          closeEmojiPanel();
          if (conversation.autoReply !== false) scheduleAutoReplies(conversation);
        });
        emojiGrid.append(button);
      });
    };
    const setEmojiImportMode = mode => {
      emojiImportMode = mode;
      emojiFileTab.classList.toggle('active', mode === 'file');
      emojiPasteTab.classList.toggle('active', mode === 'paste');
      emojiFilePane.hidden = mode !== 'file';
      emojiPastePane.hidden = mode !== 'paste';
      emojiImportError.textContent = '';
      if (mode === 'paste') emojiImportText.focus();
    };
    const openEmojiImport = () => {
      closeEmojiPanel();
      emojiCategoryInput.value = '';
      emojiImportText.value = '';
      emojiImportFile.value = '';
      emojiFileContent = '';
      emojiChooseFile.textContent = '选择 TXT 文件';
      emojiImportError.textContent = '';
      setEmojiImportMode('file');
      emojiImportModal.classList.add('open');
      emojiImportModal.setAttribute('aria-hidden', 'false');
      emojiCategoryInput.focus();
    };
    const closeEmojiImport = () => {
      emojiImportModal.classList.remove('open');
      emojiImportModal.setAttribute('aria-hidden', 'true');
    };
    emojiButton.setAttribute('aria-expanded', 'false');
    emojiButton.addEventListener('click', () => {
      const willOpen = !emojiPanel.classList.contains('open');
      if (willOpen) {
        renderEmojiPanel();
        emojiPanel.classList.add('open');
        emojiPanel.setAttribute('aria-hidden', 'false');
        emojiButton.setAttribute('aria-expanded', 'true');
      } else {
        closeEmojiPanel();
      }
    });
    document.getElementById('emojiImportOpen').addEventListener('click', openEmojiImport);
    emojiFileTab.addEventListener('click', () => setEmojiImportMode('file'));
    emojiPasteTab.addEventListener('click', () => setEmojiImportMode('paste'));
    emojiChooseFile.addEventListener('click', () => emojiImportFile.click());
    emojiImportFile.addEventListener('change', event => {
      const [file] = event.target.files;
      if (!file) return;
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        emojiFileContent = String(reader.result || '');
        emojiChooseFile.textContent = file.name;
        emojiImportError.textContent = '';
      });
      reader.readAsText(file);
    });
    document.getElementById('emojiImportCancel').addEventListener('click', closeEmojiImport);
    emojiImportModal.addEventListener('click', event => {
      if (event.target === emojiImportModal) closeEmojiImport();
    });
    emojiImportForm.addEventListener('submit', event => {
      event.preventDefault();
      const name = emojiCategoryInput.value.trim();
      const content = emojiImportMode === 'file' ? emojiFileContent : emojiImportText.value;
      const items = parseEmojiList(content);
      if (!name) {
        emojiImportError.textContent = '请输入分类名称。';
        return;
      }
      if (!content.trim()) {
        emojiImportError.textContent = emojiImportMode === 'file' ? '请先选择一个 TXT 文件。' : '请粘贴表情列表。';
        return;
      }
      if (!items.length) {
        emojiImportError.textContent = '没有识别到有效内容，请检查每行是否包含 http(s) 图片链接。';
        return;
      }
      state.emojiCategories = state.emojiCategories || [];
      const existing = state.emojiCategories.find(category => category.name === name);
      if (existing) {
        const knownUrls = new Set((existing.items || []).map(item => item.url));
        existing.items = [...(existing.items || []), ...items.filter(item => !knownUrls.has(item.url))];
        activeEmojiCategoryId = existing.id;
      } else {
        const category = { id: crypto.randomUUID(), name, items };
        state.emojiCategories.push(category);
        activeEmojiCategoryId = category.id;
      }
      saveState();
      renderEmojiPanel();
      closeEmojiImport();
      emojiPanel.classList.add('open');
      emojiPanel.setAttribute('aria-hidden', 'false');
      emojiButton.setAttribute('aria-expanded', 'true');
    });
    document.addEventListener('click', event => {
      if (emojiPanel.classList.contains('open') && !emojiPanel.contains(event.target) && !emojiButton.contains(event.target)) closeEmojiPanel();
    });
    messageForm.addEventListener('submit', event => {
      event.preventDefault();
      const text = messageInput.value.trim();
      const conversation = state.conversations.find(item => item.id === state.currentConversationId);
      if (!text || !conversation) return;
      conversation.messages = conversation.messages || [];
      const message = { text, mine: true };
      conversation.messages.push(message);
      messageInput.value = '';
      appendMessage(conversation, message);
      scrollMessagesToBottom();
      window.setTimeout(saveState, 0);
      closeEmojiPanel();
      if (conversation.autoReply !== false) scheduleAutoReplies(conversation);
    });
    const closeNoteModal = () => {
      noteModal.classList.remove('open');
      noteModal.setAttribute('aria-hidden', 'true');
      noteNameInput.value = '';
    };
    document.getElementById('chatAdd').addEventListener('click', () => {
      noteModal.classList.add('open');
      noteModal.setAttribute('aria-hidden', 'false');
      noteNameInput.focus();
    });
    document.getElementById('noteCancel').addEventListener('click', closeNoteModal);
    noteModal.addEventListener('click', event => {
      if (event.target === noteModal) closeNoteModal();
    });
    noteForm.addEventListener('submit', event => {
      event.preventDefault();
      const name = noteNameInput.value.trim();
      if (!name) return;
      state.conversations.push({ id: crypto.randomUUID(), name, messages: [] });
      renderConversations();
      saveState();
      closeNoteModal();
    });
    chatBack.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        returnHome();
      }
    });
    window.initializeChatApp = () => {
      state.emojiCategories = Array.isArray(state.emojiCategories) ? state.emojiCategories : [];
      state.conversations = Array.isArray(state.conversations) ? state.conversations : [];
      renderEmojiPanel();
      renderConversations();
    };
})();
