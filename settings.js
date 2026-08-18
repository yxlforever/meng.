const settingsPage = document.getElementById('settingsPage');
const apiSettingsStorageKey = 'dream-api-settings';
const apiPresetsStorageKey = 'dream-api-presets';
const apiUrlInput = document.getElementById('apiUrlInput');
const apiKeyInput = document.getElementById('apiKeyInput');
const apiModelSelect = document.getElementById('apiModelSelect');
const temperatureInput = document.getElementById('temperatureInput');
const temperatureValue = document.getElementById('temperatureValue');
const streamOutputInput = document.getElementById('streamOutputInput');
const apiPresetSelect = document.getElementById('apiPresetSelect');
const fetchModelsButton = document.getElementById('fetchModelsButton');
const deleteApiPresetButton = document.getElementById('deleteApiPresetButton');
const apiStatus = document.getElementById('apiStatus');
const apiFormMessage = document.getElementById('apiFormMessage');

const readJsonStorage = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

const normalizeApiUrl = value => value.trim().replace(/\/+$/, '');
const getApiSettings = () => readJsonStorage(apiSettingsStorageKey, {});
const getApiPresets = () => readJsonStorage(apiPresetsStorageKey, []);

const showApiMessage = (message, type = '') => {
  apiFormMessage.textContent = message;
  apiFormMessage.className = `settings-form-message${type ? ` ${type}` : ''}`;
};

const setApiStatus = (message, type = '') => {
  apiStatus.textContent = message;
  apiStatus.className = `api-status${type ? ` ${type}` : ''}`;
};

const populateModels = (models, selectedModel = '') => {
  apiModelSelect.replaceChildren();
  const sortedModels = [...new Set(models.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  if (!sortedModels.length) {
    apiModelSelect.append(new Option('没有可用模型', ''));
    apiModelSelect.disabled = true;
    return;
  }
  sortedModels.forEach(model => apiModelSelect.append(new Option(model, model)));
  apiModelSelect.disabled = false;
  apiModelSelect.value = sortedModels.includes(selectedModel) ? selectedModel : sortedModels[0];
};

const applyApiSettings = settings => {
  apiUrlInput.value = settings.apiUrl || '';
  apiKeyInput.value = settings.apiKey || '';
  temperatureInput.value = String(settings.temperature ?? 0.7);
  temperatureValue.value = temperatureInput.value;
  streamOutputInput.checked = settings.stream ?? true;
  populateModels(settings.models || (settings.model ? [settings.model] : []), settings.model);
  if (settings.apiUrl && settings.apiKey && settings.model) setApiStatus('已配置', 'connected');
};

const renderApiPresets = selectedId => {
  const presets = getApiPresets();
  apiPresetSelect.replaceChildren(new Option('选择已保存预设', ''));
  presets.forEach(preset => apiPresetSelect.append(new Option(preset.name, preset.id)));
  apiPresetSelect.value = selectedId || '';
  deleteApiPresetButton.disabled = !apiPresetSelect.value;
};

const returnFromSettings = () => {
  document.body.classList.remove('show-settings');
  settingsPage.classList.remove('active');
};

document.getElementById('settingsApp').addEventListener('click', () => {
  document.body.classList.add('show-settings');
  settingsPage.classList.add('active');
});

document.getElementById('settingsBack').addEventListener('click', returnFromSettings);
document.getElementById('settingsBack').addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') returnFromSettings();
});

document.getElementById('apiKeyToggle').addEventListener('click', event => {
  const revealing = apiKeyInput.type === 'password';
  apiKeyInput.type = revealing ? 'text' : 'password';
  event.currentTarget.textContent = revealing ? '隐藏' : '显示';
  event.currentTarget.setAttribute('aria-label', revealing ? '隐藏 API Key' : '显示 API Key');
});

temperatureInput.addEventListener('input', () => {
  temperatureValue.value = temperatureInput.value;
});

fetchModelsButton.addEventListener('click', async () => {
  const apiUrl = normalizeApiUrl(apiUrlInput.value);
  const apiKey = apiKeyInput.value.trim();
  if (!apiUrl || !apiKey) {
    showApiMessage('请先填写 API URL 和 API Key。', 'error');
    return;
  }

  fetchModelsButton.disabled = true;
  fetchModelsButton.textContent = '连接中…';
  setApiStatus('连接中');
  showApiMessage('正在从 API 获取模型列表…');
  try {
    const response = await fetch(`${apiUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error?.message || payload?.message || `请求失败 (${response.status})`);
    const models = Array.isArray(payload.data)
      ? payload.data.map(item => typeof item === 'string' ? item : item?.id)
      : Array.isArray(payload.models) ? payload.models.map(item => typeof item === 'string' ? item : item?.id || item?.name) : [];
    if (!models.filter(Boolean).length) throw new Error('接口返回成功，但没有找到模型数据');
    populateModels(models, getApiSettings().model);
    setApiStatus('连接成功', 'connected');
    showApiMessage(`已获取 ${models.filter(Boolean).length} 个模型。`, 'success');
  } catch (error) {
    setApiStatus('连接失败', 'error');
    showApiMessage(`${error.message}。请检查地址、Key、接口兼容性或浏览器 CORS 设置。`, 'error');
  } finally {
    fetchModelsButton.disabled = false;
    fetchModelsButton.textContent = '拉取模型';
  }
});

document.getElementById('apiSettingsForm').addEventListener('submit', event => {
  event.preventDefault();
  const apiUrl = normalizeApiUrl(apiUrlInput.value);
  const apiKey = apiKeyInput.value.trim();
  const model = apiModelSelect.value;
  if (!apiUrl || !apiKey || !model) {
    showApiMessage('请完成连接并选择一个模型。', 'error');
    return;
  }

  const existingId = apiPresetSelect.value;
  const settings = {
    apiUrl,
    apiKey,
    model,
    models: [...apiModelSelect.options].map(option => option.value).filter(Boolean),
    temperature: Number(temperatureInput.value),
    stream: streamOutputInput.checked
  };
  const presets = getApiPresets();
  const existing = presets.find(preset => preset.id === existingId);
  const defaultName = `${new URL(apiUrl).hostname} · ${model}`;
  const name = existing?.name || window.prompt('给这个预设起个名字', defaultName);
  if (!name?.trim()) return;
  const preset = { ...settings, id: existingId || crypto.randomUUID(), name: name.trim() };
  const nextPresets = existingId ? presets.map(item => item.id === existingId ? preset : item) : [...presets, preset];
  localStorage.setItem(apiSettingsStorageKey, JSON.stringify(settings));
  localStorage.setItem(apiPresetsStorageKey, JSON.stringify(nextPresets));
  renderApiPresets(preset.id);
  setApiStatus('已保存', 'connected');
  showApiMessage('预设已保存，并设为当前 API 配置。', 'success');
});

apiPresetSelect.addEventListener('change', () => {
  const preset = getApiPresets().find(item => item.id === apiPresetSelect.value);
  deleteApiPresetButton.disabled = !preset;
  if (!preset) return;
  applyApiSettings(preset);
  const { id, name, ...settings } = preset;
  localStorage.setItem(apiSettingsStorageKey, JSON.stringify(settings));
  showApiMessage(`已切换到“${name}”。`, 'success');
});

deleteApiPresetButton.addEventListener('click', () => {
  const id = apiPresetSelect.value;
  if (!id) return;
  const nextPresets = getApiPresets().filter(preset => preset.id !== id);
  localStorage.setItem(apiPresetsStorageKey, JSON.stringify(nextPresets));
  renderApiPresets();
  showApiMessage('预设已删除。', 'success');
});

applyApiSettings(getApiSettings());
renderApiPresets();

window.getDreamApiSettings = getApiSettings;
