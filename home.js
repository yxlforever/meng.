document.querySelectorAll('.close').forEach(button => button.addEventListener('click', closePanels));
    document.querySelectorAll('.toggle').forEach((toggle, index) => {
      const toggleKey = toggle.closest('.panel').id + '-' + index;
      toggle.dataset.storageKey = toggleKey;
      toggle.classList.toggle('on', state.toggles[toggleKey] ?? toggle.classList.contains('on'));
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('on');
        state.toggles[toggleKey] = toggle.classList.contains('on');
        saveState();
      });
    });

    document.querySelectorAll('[contenteditable="true"]').forEach(field => {
      field.textContent = state[field.id];
      field.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          field.blur();
        }
      });
      field.addEventListener('blur', () => {
        const fallback = field.id === 'profileName'
          ? defaultState.profileName
          : field.id === 'profileHandle'
            ? defaultState.profileHandle
            : defaultState.profileBio;
        field.textContent = field.textContent.trim() || fallback;
        state[field.id] = field.textContent;
        saveState();
      });
    });

    window.updateSystemDay = () => {
      const systemDay = String(new Date().getDay());
      document.querySelectorAll('.day').forEach(day => {
        const isToday = day.dataset.day === systemDay;
        day.classList.toggle('active', isToday);
        if (isToday) day.setAttribute('aria-current', 'date');
        else day.removeAttribute('aria-current');
      });
      state.activeDay = systemDay;
    };
    window.updateSystemDay();
    window.setInterval(window.updateSystemDay, 60 * 1000);

    const avatarInput = document.getElementById('avatarInput');
    const avatarButton = document.getElementById('avatarButton');
    const avatarImage = document.getElementById('avatarImage');
    const setAvatar = avatar => {
      avatarImage.src = URL.createObjectURL(avatar);
      avatarImage.classList.add('has-image');
      state.avatar = avatar;
      saveState();
    };
    avatarButton.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', event => {
      const [file] = event.target.files;
      if (!file) return;
      setAvatar(file);
    });

    const profileCard = document.getElementById('profileCard');
    const profileBackgroundButton = document.getElementById('profileBackgroundButton');
    const profileBackgroundModal = document.getElementById('profileBackgroundModal');
    const profileBackgroundInput = document.getElementById('profileBackgroundInput');
    const profileBackgroundRemove = document.getElementById('profileBackgroundRemove');
    const readProfileImage = file => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(String(reader.result || '')));
      reader.addEventListener('error', () => reject(reader.error));
      reader.readAsDataURL(file);
    });
    const detectBackgroundTheme = source => new Promise(resolve => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          resolve('light');
          return;
        }
        context.drawImage(image, 0, 0, size, size);
        const pixels = context.getImageData(0, 0, size, size).data;
        let luminance = 0;
        let samples = 0;
        for (let index = 0; index < pixels.length; index += 16) {
          luminance += .2126 * pixels[index] + .7152 * pixels[index + 1] + .0722 * pixels[index + 2];
          samples += 1;
        }
        resolve(luminance / samples < 142 ? 'dark' : 'light');
      };
      image.onerror = () => resolve('light');
      image.src = source;
    });
    window.applyProfileBackground = (source, theme = 'light') => {
      profileCard.style.backgroundImage = source ? `url("${source}")` : '';
      profileCard.classList.toggle('has-background', Boolean(source));
      profileCard.classList.toggle('background-dark', Boolean(source) && theme === 'dark');
      profileBackgroundRemove.disabled = !source;
    };
    const closeProfileBackgroundModal = () => {
      profileBackgroundModal.classList.remove('open');
      profileBackgroundModal.setAttribute('aria-hidden', 'true');
    };
    const openProfileBackgroundModal = () => {
      profileBackgroundModal.classList.add('open');
      profileBackgroundModal.setAttribute('aria-hidden', 'false');
    };
    profileBackgroundButton.addEventListener('click', openProfileBackgroundModal);
    profileCard.addEventListener('click', event => {
      if (event.target.closest('button, [contenteditable="true"]')) return;
      openProfileBackgroundModal();
    });
    document.getElementById('profileBackgroundChoose').addEventListener('click', () => profileBackgroundInput.click());
    document.getElementById('profileBackgroundCancel').addEventListener('click', closeProfileBackgroundModal);
    profileBackgroundModal.addEventListener('click', event => {
      if (event.target === profileBackgroundModal) closeProfileBackgroundModal();
    });
    profileBackgroundInput.addEventListener('change', async event => {
      const [file] = event.target.files;
      if (!file) return;
      try {
        const source = await readProfileImage(file);
        const theme = await detectBackgroundTheme(source);
        state.profileBackground = source;
        state.profileBackgroundName = file.name;
        state.profileBackgroundTheme = theme;
        window.applyProfileBackground(source, theme);
        saveState();
        closeProfileBackgroundModal();
      } catch (error) {
        console.warn('无法读取资料卡背景图。', error);
      } finally {
        profileBackgroundInput.value = '';
      }
    });
    profileBackgroundRemove.addEventListener('click', () => {
      state.profileBackground = null;
      state.profileBackgroundName = '';
      state.profileBackgroundTheme = 'light';
      window.applyProfileBackground('', 'light');
      saveState();
    });
