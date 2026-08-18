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

    document.querySelectorAll('.day').forEach(day => {
      day.classList.toggle('active', day.dataset.day === state.activeDay);
      day.addEventListener('click', () => {
        document.querySelectorAll('.day').forEach(item => item.classList.remove('active'));
        day.classList.add('active');
        state.activeDay = day.dataset.day;
        saveState();
      });
    });

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
