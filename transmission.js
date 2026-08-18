(() => {
  const page = document.getElementById('transmissionPage');
  const threadPage = document.getElementById('transmissionThreadPage');
  const list = document.getElementById('transmissionList');
  const modal = document.getElementById('transmissionModal');
  const form = document.getElementById('transmissionForm');
  const nameInput = document.getElementById('transmissionNameInput');
  const threadName = document.getElementById('transmissionName');
  const threadAvatar = document.getElementById('transmissionAvatar');
  const messageArea = document.getElementById('transmissionMessageArea');
  const messageForm = document.getElementById('transmissionMessageForm');
  const messageInput = document.getElementById('transmissionMessageInput');
  const settingsPage = document.getElementById('transmissionSettingsPage');
  const settingsChatNameInput = document.getElementById('transmissionSettingsChatNameInput');
  const settingsUserNameInput = document.getElementById('transmissionSettingsUserNameInput');
  const promptModal = document.getElementById('transmissionPromptModal');
  const promptForm = document.getElementById('transmissionPromptForm');
  const promptInput = document.getElementById('transmissionPromptInput');
  const promptStatus = document.getElementById('transmissionPromptStatus');
  const settingsChatAvatar = document.getElementById('transmissionChatAvatar');
  const settingsUserAvatar = document.getElementById('transmissionUserAvatar');
  const avatarInput = document.getElementById('transmissionAvatarInput');
  const defaultAvatar = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.4"/><path d="M5.5 20c.7-3.6 3.1-5.4 6.5-5.4s5.8 1.8 6.5 5.4"/></svg>';
  const avatarMarkup = source => source ? `<img src="${source}" alt="" />` : defaultAvatar;
  const scrollMessagesToBottom = () => requestAnimationFrame(() => { messageArea.scrollTop = messageArea.scrollHeight; });
  const keepLatestMessageVisible = () => {
    scrollMessagesToBottom();
    window.setTimeout(scrollMessagesToBottom, 120);
    window.setTimeout(scrollMessagesToBottom, 320);
  };
  let activeId = '';
  let selectedAvatarTarget = '';

  const conversations = () => {
    state.transmissions = Array.isArray(state.transmissions) ? state.transmissions : [];
    return state.transmissions;
  };

  const activeConversation = () => conversations().find(item => item.id === activeId);

  const renderList = () => {
    list.replaceChildren();
    conversations().forEach(conversation => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'conversation-item';
      const chatName = conversation.chatName || conversation.name;
      item.setAttribute('aria-label', `打开与${chatName}的传讯`);
      item.innerHTML = `<span class="conversation-avatar">${avatarMarkup(conversation.chatAvatar)}</span><span class="conversation-name"></span>`;
      item.querySelector('.conversation-name').textContent = chatName;
      item.addEventListener('click', () => openThread(conversation));
      list.append(item);
    });
  };

  const renderMessages = conversation => {
    messageArea.replaceChildren();
    (conversation.messages || []).forEach(message => {
      const item = document.createElement('div');
      item.className = `message ${message.mine ? 'outgoing' : 'incoming'}`;
      const messageAvatar = message.mine ? conversation.userAvatar : conversation.chatAvatar;
      item.innerHTML = `<span class="message-avatar">${avatarMarkup(messageAvatar)}</span><span class="message-bubble"></span>`;
      const bubble = item.querySelector('.message-bubble');
      if (message.imageUrl) {
        bubble.classList.add('image-bubble');
        const image = document.createElement('img');
        image.src = message.imageUrl;
        image.alt = message.imageName || '图片';
        image.loading = 'lazy';
        bubble.append(image);
      } else {
        bubble.textContent = message.text;
      }
      messageArea.append(item);
    });
    scrollMessagesToBottom();
  };

  const openThread = conversation => {
    activeId = conversation.id;
    threadName.textContent = conversation.chatName || conversation.name;
    threadAvatar.innerHTML = avatarMarkup(conversation.chatAvatar);
    renderMessages(conversation);
    document.body.classList.add('show-transmission-thread');
    threadPage.classList.add('active');
  };

  const closeSettings = () => {
    document.body.classList.remove('show-transmission-settings');
    settingsPage.classList.remove('active');
  };

  const openSettings = () => {
    const conversation = activeConversation();
    if (!conversation) return;
    settingsChatNameInput.value = conversation.chatName || conversation.name || '';
    settingsUserNameInput.value = conversation.userName || conversation.name || '';
    promptInput.value = conversation.systemPrompt || '';
    promptStatus.textContent = conversation.systemPrompt ? '已设置' : '未设置';
    settingsChatAvatar.innerHTML = avatarMarkup(conversation.chatAvatar);
    settingsUserAvatar.innerHTML = avatarMarkup(conversation.userAvatar);
    document.body.classList.add('show-transmission-settings');
    settingsPage.classList.add('active');
  };

  const closePromptModal = () => {
    promptModal.classList.remove('open');
    promptModal.setAttribute('aria-hidden', 'true');
  };

  const closeThread = () => {
    closePromptModal();
    closeSettings();
    document.body.classList.remove('show-transmission-thread');
    threadPage.classList.remove('active');
  };

  const closePage = () => {
    closeThread();
    document.body.classList.remove('show-transmission');
    page.classList.remove('active');
  };

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    nameInput.value = '';
  };

  document.getElementById('messageApp').addEventListener('click', () => {
    renderList();
    document.body.classList.add('show-transmission');
    page.classList.add('active');
  });
  document.getElementById('transmissionBack').addEventListener('click', closePage);
  document.getElementById('transmissionBack').addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') closePage();
  });
  document.getElementById('transmissionThreadBack').addEventListener('click', closeThread);
  threadAvatar.addEventListener('click', openSettings);
  document.getElementById('transmissionSettingsBack').addEventListener('click', closeSettings);
  document.getElementById('transmissionSettingsSave').addEventListener('click', () => {
    const conversation = activeConversation();
    const chatName = settingsChatNameInput.value.trim();
    const userName = settingsUserNameInput.value.trim();
    if (!conversation || !chatName || !userName) return;
    conversation.chatName = chatName;
    conversation.userName = userName;
    conversation.name = chatName;
    threadName.textContent = chatName;
    renderList();
    renderMessages(conversation);
    saveState();
    closeSettings();
  });
  [settingsChatNameInput, settingsUserNameInput].forEach(input => input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      document.getElementById('transmissionSettingsSave').click();
    }
  }));
  document.getElementById('openTransmissionPrompt').addEventListener('click', () => {
    const conversation = activeConversation();
    if (!conversation) return;
    promptInput.value = conversation.systemPrompt || '';
    promptModal.classList.add('open');
    promptModal.setAttribute('aria-hidden', 'false');
    promptInput.focus();
  });
  document.getElementById('transmissionPromptCancel').addEventListener('click', closePromptModal);
  promptModal.addEventListener('click', event => {
    if (event.target === promptModal) closePromptModal();
  });
  promptForm.addEventListener('submit', event => {
    event.preventDefault();
    const conversation = activeConversation();
    if (!conversation) return;
    conversation.systemPrompt = promptInput.value.trim();
    promptStatus.textContent = conversation.systemPrompt ? '已设置' : '未设置';
    saveState();
    closePromptModal();
  });
  [settingsChatAvatar, settingsUserAvatar].forEach(button => button.addEventListener('click', () => {
    selectedAvatarTarget = button === settingsChatAvatar ? 'chatAvatar' : 'userAvatar';
    avatarInput.click();
  }));
  avatarInput.addEventListener('change', () => {
    const file = avatarInput.files[0];
    const conversation = activeConversation();
    if (!file || !conversation || !selectedAvatarTarget) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      conversation[selectedAvatarTarget] = reader.result;
      settingsChatAvatar.innerHTML = avatarMarkup(conversation.chatAvatar);
      settingsUserAvatar.innerHTML = avatarMarkup(conversation.userAvatar);
      threadAvatar.innerHTML = avatarMarkup(conversation.chatAvatar);
      renderList();
      renderMessages(conversation);
      saveState();
      avatarInput.value = '';
    });
    reader.readAsDataURL(file);
  });
  messageInput.addEventListener('focus', keepLatestMessageVisible);
  window.addEventListener('resize', () => {
    if (document.body.classList.contains('show-transmission-thread')) keepLatestMessageVisible();
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      if (document.body.classList.contains('show-transmission-thread')) keepLatestMessageVisible();
    });
  }
  document.getElementById('transmissionAdd').addEventListener('click', () => {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    nameInput.focus();
  });
  document.getElementById('transmissionCancel').addEventListener('click', closeModal);
  modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    conversations().push({ id: crypto.randomUUID(), name, chatName: name, userName: 'User', systemPrompt: '', messages: [] });
    renderList();
    saveState();
    closeModal();
  });
  messageForm.addEventListener('submit', event => {
    event.preventDefault();
    const text = messageInput.value.trim();
    const conversation = activeConversation();
    if (!text || !conversation) return;
    conversation.messages = conversation.messages || [];
    conversation.messages.push({ text, mine: true });
    messageInput.value = '';
    renderMessages(conversation);
    saveState();
  });

  window.renderTransmissions = renderList;
})();
