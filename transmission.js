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
  const waitButton = document.getElementById('transmissionWaitButton');
  const tarotModal = document.getElementById('transmissionTarotModal');
  const tarotGuidance = document.getElementById('tarotGuidance');
  const tarotDeck = document.getElementById('tarotDeck');
  const tarotCardFan = document.getElementById('tarotCardFan');
  const tarotSelection = document.getElementById('tarotSelection');
  const tarotShuffle = document.getElementById('tarotShuffle');
  const tarotCut = document.getElementById('tarotCut');
  const tarotConfirm = document.getElementById('tarotConfirm');
  const readingModal = document.getElementById('transmissionReadingModal');
  const readingContent = document.getElementById('transmissionReadingContent');
  const readingClose = document.getElementById('transmissionReadingClose');
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
  let tarotStep = 'idle';
  let tarotDraw = [];
  let tarotCards = [];
  let waitingForReply = false;
  const majorArcana = [
    ['愚者', '✧'], ['魔术师', '∞'], ['女祭司', '☾'], ['皇后', '♀'], ['皇帝', '♔'], ['教皇', '♜'],
    ['恋人', '♡'], ['战车', '♢'], ['力量', '♌'], ['隐者', '☄'], ['命运之轮', '⊙'], ['正义', '⚖'],
    ['倒吊人', '▽'], ['死神', '♱'], ['节制', '⚗'], ['恶魔', '♑'], ['高塔', 'ϟ'], ['星星', '☆'],
    ['月亮', '☽'], ['太阳', '☼'], ['审判', '♬'], ['世界', '◉']
  ].map(([name, symbol]) => ({ name, symbol }));
  const minorRanks = ['王牌', '二', '三', '四', '五', '六', '七', '八', '九', '十', '侍从', '骑士', '王后', '国王'];
  const minorSuits = [
    ['权杖', '♧'], ['圣杯', '♢'], ['宝剑', '♤'], ['星币', '⊛']
  ];
  const minorArcana = minorSuits.flatMap(([suit, symbol]) => minorRanks.map(rank => ({
    name: `${suit}${rank}`,
    symbol
  })));
  const tarotDeckData = [...majorArcana, ...minorArcana];

  const shuffledTarot = () => {
    const cards = [...tarotDeckData];
    for (let index = cards.length - 1; index > 0; index -= 1) {
      const swapWith = Math.floor(Math.random() * (index + 1));
      [cards[index], cards[swapWith]] = [cards[swapWith], cards[index]];
    }
    return cards;
  };
  const renderTarotDeck = () => {
    tarotDeck.replaceChildren();
    Array.from({ length: 14 }, (_, index) => {
      const card = document.createElement('span');
      const side = index % 2 ? 1 : -1;
      const restX = ((index % 5) - 2) * .7;
      const restY = -index * .42;
      const restR = ((index % 4) - 1.5) * .32;
      card.className = 'tarot-deck-card';
      card.style.setProperty('--rest-x', `${restX}px`);
      card.style.setProperty('--rest-y', `${restY}px`);
      card.style.setProperty('--rest-r', `${restR}deg`);
      card.style.setProperty('--split-x', `${side * (55 + index % 3 * 3)}px`);
      card.style.setProperty('--split-r', `${side * (9 + index % 4)}deg`);
      card.style.setProperty('--meet-x', `${side * (5 + index % 3)}px`);
      card.style.setProperty('--meet-r', `${side * 1.4}deg`);
      card.style.setProperty('--riffle-y', `${(index % 7 - 3) * 2.8}px`);
      card.style.setProperty('--bridge-x', `${side * (index % 4)}px`);
      card.style.setProperty('--bridge-y', `${-11 + Math.abs(index - 7) * 1.2}px`);
      card.style.setProperty('--bridge-r', `${side * .7}deg`);
      card.style.setProperty('--shuffle-delay', `${(index % 7) * 22}ms`);
      tarotDeck.append(card);
    });
  };
  const prepareThreePileCut = () => {
    const cards = [...tarotDeck.children];
    const pilePositions = [-82, 0, 82];
    const collectOrder = [1, 2, 0].sort(() => Math.random() - .5);
    cards.forEach((card, index) => {
      const pile = index % 3;
      const collectStep = collectOrder.indexOf(pile);
      card.style.setProperty('--pile-x', `${pilePositions[pile]}px`);
      card.style.setProperty('--pile-y', `${-index % 3 * 2}px`);
      card.style.setProperty('--pile-r', `${(pile - 1) * 2.5}deg`);
      card.style.setProperty('--stack-y', `${-index * .36}px`);
      card.style.setProperty('--cut-delay', `${collectStep * 115 + index % 3 * 12}ms`);
    });
  };
  const closeTarot = () => {
    tarotModal.classList.remove('open');
    tarotModal.setAttribute('aria-hidden', 'true');
  };
  const resetTarot = () => {
    tarotStep = 'idle';
    tarotDraw = [];
    tarotCards = shuffledTarot();
    tarotGuidance.textContent = '先让心安静下来，然后洗牌。';
    tarotDeck.className = 'tarot-deck';
    renderTarotDeck();
    tarotDeck.hidden = false;
    tarotCardFan.classList.remove('open');
    tarotCardFan.replaceChildren();
    tarotSelection.replaceChildren();
    tarotShuffle.disabled = false;
    tarotShuffle.textContent = '洗牌';
    tarotCut.disabled = true;
    tarotConfirm.disabled = true;
  };
  const openTarot = () => {
    if (!activeConversation() || waitingForReply) return;
    resetTarot();
    tarotModal.classList.add('open');
    tarotModal.setAttribute('aria-hidden', 'false');
  };
  const renderTarotSelection = () => {
    tarotSelection.replaceChildren();
    tarotDraw.forEach((card, index) => {
      const item = document.createElement('div');
      item.className = 'tarot-picked';
      item.innerHTML = `<span class="tarot-picked-card${card.reversed ? ' reversed' : ''}" data-symbol="${card.symbol}"></span><span class="tarot-picked-name"></span><span class="tarot-picked-position"></span>`;
      item.querySelector('.tarot-picked-name').textContent = card.name;
      item.querySelector('.tarot-picked-position').textContent = `第 ${index + 1} 张 · ${card.reversed ? '逆位' : '正位'}`;
      item.title = '点击移除这张牌';
      item.addEventListener('click', () => {
        tarotDraw.splice(index, 1);
        renderTarotSelection();
      });
      tarotSelection.append(item);
    });
    tarotConfirm.disabled = tarotDraw.length === 0;
    tarotGuidance.textContent = tarotDraw.length
      ? `已抽 ${tarotDraw.length} 张。可以继续抽，或直接确定；点击已抽的牌可以移除。`
      : '凭直觉抽牌，张数不限。牌列可以左右滑动。';
  };
  const showTarotFan = () => {
    tarotDeck.hidden = true;
    tarotCardFan.replaceChildren();
    tarotCards.forEach((card, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tarot-choice';
      button.setAttribute('aria-label', `选择第 ${index + 1} 张牌`);
      button.addEventListener('click', () => {
        button.classList.add('selected');
        button.disabled = true;
        tarotDraw.push({ ...card, reversed: Math.random() < .35 });
        renderTarotSelection();
      });
      tarotCardFan.append(button);
    });
    tarotCardFan.classList.add('open');
  };

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

  const openReading = text => {
    readingContent.textContent = text;
    readingModal.classList.add('open');
    readingModal.setAttribute('aria-hidden', 'false');
  };

  const closeReading = () => {
    readingModal.classList.remove('open');
    readingModal.setAttribute('aria-hidden', 'true');
  };

  const renderMessages = conversation => {
    messageArea.replaceChildren();
    (conversation.messages || []).forEach(message => {
      const item = document.createElement('div');
      if (message.tarot || message.reading) {
        item.className = `message message-notice${message.reading ? ' reading-notice' : ''}`;
        const notice = document.createElement('button');
        notice.type = 'button';
        notice.className = 'message-notice-content';
        notice.textContent = message.reading ? '解牌说明' : '我的抽牌';
        notice.addEventListener('click', () => openReading(message.text));
        item.append(notice);
        messageArea.append(item);
        return;
      }
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
        if (message.waiting) bubble.classList.add('waiting-bubble');
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
    closeReading();
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
  const splitReplyIntoSegments = text => {
    const paragraphs = text.split(/\n\s*\n+/).map(part => part.trim()).filter(Boolean);
    const segments = [];
    paragraphs.forEach(paragraph => {
      const sentences = paragraph.match(/[^。！？!?；;\n]+[。！？!?；;]?/g) || [paragraph];
      let current = '';
      sentences.forEach(sentence => {
        if (current && current.length + sentence.length > 110) {
          segments.push(current.trim());
          current = '';
        }
        current += sentence;
      });
      if (current.trim()) segments.push(current.trim());
    });
    return segments.length ? segments : [text.trim()];
  };

  const parseTarotReply = rawText => {
    const cleaned = rawText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    try {
      const parsed = JSON.parse(cleaned);
      const transmission = String(parsed.transmission || parsed.message || '').trim();
      const reading = String(parsed.reading || parsed.interpretation || '').trim();
      if (transmission && reading) return { transmission, reading };
    } catch {
      const transmissionMatch = cleaned.match(/<transmission>([\s\S]*?)<\/transmission>/i);
      const readingMatch = cleaned.match(/<reading>([\s\S]*?)<\/reading>/i);
      if (transmissionMatch?.[1]?.trim() && readingMatch?.[1]?.trim()) {
        return { transmission: transmissionMatch[1].trim(), reading: readingMatch[1].trim() };
      }
    }
    return {
      transmission: '这一次，牌更想先把它的含义安静地留给你。',
      reading: cleaned
    };
  };

  const requestTarotReply = async (conversation, tarotMessage) => {
    const apiSettings = window.getDreamApiSettings?.();
    const waitingMessage = { text: '正在倾听牌的回音…', mine: false, waiting: true };
    let responseText = '';
    conversation.messages.push(waitingMessage);
    waitingForReply = true;
    waitButton.disabled = true;
    waitButton.classList.add('waiting');
    waitButton.setAttribute('aria-label', '正在等待回复');
    renderMessages(conversation);
    try {
      if (!apiSettings?.apiUrl || !apiSettings?.apiKey || !apiSettings?.model) throw new Error('请先在设置中完成 API 连接');
      const history = conversation.messages.filter(message => !message.waiting && message.text).slice(-30).map(message => ({
        role: message.mine ? 'user' : 'assistant',
        content: message.text
      }));
      const systemPrompt = conversation.systemPrompt?.trim();
      const tarotInstruction = `用户正在进行一次自由抽牌的塔罗传讯。你是连接用户与梦角的传讯者，请严格区分“梦角传达的话”和“塔罗牌解读”：
1. transmission 只写梦角借牌传达给用户的话，用梦角的口吻或转述方式，例如“他说……”“他觉得……”“他想让你知道……”。不要在这里逐张解释牌义。
2. reading 只写所抽全部牌及正逆位的专业解读，可以说明牌面之间的联系与给用户的启发；不要伪装成梦角说话。
3. 不要擅自套用过去、现在、未来等牌阵位置。塔罗仅用于自我探索，不作绝对预言。
只返回以下 JSON，不要添加 Markdown 或其他文字：{"transmission":"梦角传达的话","reading":"完整的解牌说明"}`;
      const response = await fetch(`${apiSettings.apiUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiSettings.apiKey}`,
          'Content-Type': 'application/json',
          Accept: apiSettings.stream ? 'text/event-stream' : 'application/json'
        },
        body: JSON.stringify({
          model: apiSettings.model,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            ...history,
            { role: 'user', content: tarotInstruction }
          ],
          temperature: Number(apiSettings.temperature ?? .7),
          stream: Boolean(apiSettings.stream)
        })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error?.message || payload?.message || `API 请求失败 (${response.status})`);
      }
      if (apiSettings.stream) {
        if (!response.body) throw new Error('浏览器未收到流式响应');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || '';
          lines.forEach(line => {
            const data = line.startsWith('data:') ? line.slice(5).trim() : '';
            if (!data || data === '[DONE]') return;
            try { responseText += JSON.parse(data).choices?.[0]?.delta?.content || ''; } catch { return; }
          });
          if (done) break;
        }
      } else {
        const payload = await response.json();
        responseText = payload.choices?.[0]?.message?.content || '';
      }
      if (!responseText.trim()) throw new Error('API 没有返回回复内容');
      waitingMessage.waiting = false;
    } catch (error) {
      waitingMessage.text = `暂时没有收到回音：${error.message}`;
      waitingMessage.waiting = false;
    } finally {
      if (responseText.trim()) {
        const { transmission, reading } = parseTarotReply(responseText);
        const waitingIndex = conversation.messages.indexOf(waitingMessage);
        const replyMessages = splitReplyIntoSegments(transmission).map(text => ({ text, mine: false }));
        conversation.messages.splice(waitingIndex, 1, ...replyMessages, { text: reading, mine: false, reading: true });
      }
      waitingForReply = false;
      waitButton.disabled = false;
      waitButton.classList.remove('waiting');
      waitButton.setAttribute('aria-label', '等待回复');
      renderMessages(conversation);
      saveState();
    }
    return tarotMessage;
  };

  messageForm.addEventListener('submit', event => {
    event.preventDefault();
    openTarot();
  });
  document.getElementById('tarotClose').addEventListener('click', closeTarot);
  tarotModal.addEventListener('click', event => { if (event.target === tarotModal) closeTarot(); });
  readingClose.addEventListener('click', closeReading);
  readingModal.addEventListener('click', event => { if (event.target === readingModal) closeReading(); });
  tarotShuffle.addEventListener('click', () => {
    if (tarotStep !== 'idle') return;
    tarotStep = 'shuffled';
    tarotCards = shuffledTarot();
    tarotDeck.classList.add('shuffling');
    tarotShuffle.disabled = true;
    tarotGuidance.textContent = '牌被分开、交错、收拢……再来一轮。';
    window.setTimeout(() => {
      tarotDeck.classList.remove('shuffling');
      tarotDeck.classList.add('settled');
      tarotCut.disabled = false;
      tarotGuidance.textContent = '洗牌完成。现在把牌分成三叠，再重新合起。';
    }, 3400);
  });
  tarotCut.addEventListener('click', () => {
    if (tarotStep !== 'shuffled') return;
    tarotStep = 'cut';
    const firstCut = Math.floor(tarotCards.length / 3);
    const secondCut = Math.floor(tarotCards.length * 2 / 3);
    const piles = [tarotCards.slice(0, firstCut), tarotCards.slice(firstCut, secondCut), tarotCards.slice(secondCut)];
    const pileOrder = [0, 1, 2].sort(() => Math.random() - .5);
    tarotCards = pileOrder.flatMap(index => piles[index]);
    prepareThreePileCut();
    tarotDeck.classList.remove('settled');
    tarotDeck.classList.add('cutting');
    tarotCut.disabled = true;
    tarotGuidance.textContent = '三叠牌已经分开，正在依照直觉重新合起。';
    window.setTimeout(() => {
      tarotGuidance.textContent = '切牌完成。凭直觉自由抽牌，张数不限，牌列可左右滑动。';
      showTarotFan();
    }, 2250);
  });
  tarotConfirm.addEventListener('click', () => {
    const conversation = activeConversation();
    if (!conversation || tarotDraw.length === 0) return;
    const question = messageInput.value.trim();
    const cardsText = tarotDraw.map((card, index) => `第 ${index + 1} 张：${card.name}（${card.reversed ? '逆位' : '正位'}）`).join('\n');
    const tarotMessage = `${question ? `问题：${question}\n` : ''}抽到的牌：\n${cardsText}`;
    conversation.messages = conversation.messages || [];
    conversation.messages.push({ text: tarotMessage, mine: true, tarot: true, tarotCards: tarotDraw });
    messageInput.value = '';
    closeTarot();
    renderMessages(conversation);
    saveState();
    requestTarotReply(conversation, tarotMessage);
  });

  window.renderTransmissions = renderList;
})();
