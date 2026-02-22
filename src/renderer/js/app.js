let apps = [];
let browsers = [];
let currentView = 'create';
let currentEditId = null;
let iconData = null;

const createForm = document.getElementById('create-form');
const editForm = document.getElementById('edit-form');
const appList = document.getElementById('app-list');
const searchInput = document.getElementById('search-input');
const btnCreateNew = document.getElementById('btn-create-new');

async function initTheme() {
  const theme = await window.electronAPI.getTheme();
  setTheme(theme);
}

function setTheme(theme) {
  const lightCSS = document.getElementById('theme-light');
  const darkCSS = document.getElementById('theme-dark');
  
  if (theme === 'dark') {
    lightCSS.disabled = true;
    darkCSS.disabled = false;
  } else {
    lightCSS.disabled = false;
    darkCSS.disabled = true;
  }
}

window.electronAPI.onThemeChanged((theme) => {
  setTheme(theme);
});

window.electronAPI.onPWAsSynced((count) => {
  console.log(`[Renderer] ${count} PWA(s) synced from system`);
  loadApps();
});


document.getElementById('minimize-btn').addEventListener('click', () => {
  window.electronAPI.minimize();
});

document.getElementById('close-btn').addEventListener('click', () => {
  window.electronAPI.close();
});

const settingsBtn = document.getElementById('settings-btn');
const settingsMenu = document.getElementById('settings-menu');

settingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  settingsMenu.classList.toggle('show');
});

document.addEventListener('click', (e) => {
  if (!settingsMenu.contains(e.target) && e.target !== settingsBtn) {
    settingsMenu.classList.remove('show');
  }
});

document.getElementById('menu-about').addEventListener('click', async () => {
  settingsMenu.classList.remove('show');
  const version = await window.electronAPI.getVersion();
  alert(`Express PWA v${version}\n\nUnder the MIT license. This software is open source and free.`);
});

document.getElementById('menu-repository').addEventListener('click', () => {
  settingsMenu.classList.remove('show');
  window.electronAPI.openExternal('https://github.com/primedeploy/express-pwa');
});

async function loadApps() {
  apps = await window.electronAPI.getApps();
  renderAppList();
}

function renderAppList(filter = '') {
  const filtered = apps.filter(app => 
    app.title.toLowerCase().includes(filter.toLowerCase())
  );
  
  appList.innerHTML = filtered.map(app => `
    <div class="app-item" data-id="${app.id}">
      <div class="app-item-icon">
        ${app.icon_path ? `<img src="${app.icon_path}" alt="${app.title}">` : `<span style="background: ${getColorForApp(app.title)}; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 4px; font-size: 14px; font-weight: 600; color: white;">${app.title.charAt(0).toUpperCase()}</span>`}
      </div>
      <span class="app-item-title">${app.title}</span>
      <span class="app-item-edit">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M12.1 1.9c.5-.5 1.3-.5 1.8 0l.2.2c.5.5.5 1.3 0 1.8l-8 8-2.5.5.5-2.5 8-8z"/>
        </svg>
      </span>
    </div>
  `).join('');
  
  document.querySelectorAll('.app-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = parseInt(item.dataset.id);
      showEditForm(id);
    });
  });
}

function getColorForApp(title) {
  const colors = ['#2196F3', '#FFEB3B', '#4CAF50', '#FF5722', '#9C27B0', '#00BCD4'];
  const index = title.charCodeAt(0) % colors.length;
  return colors[index];
}

searchInput.addEventListener('input', (e) => {
  renderAppList(e.target.value);
});

btnCreateNew.addEventListener('click', showCreateForm);

function showCreateForm() {
  currentView = 'create';
  currentEditId = null;
  iconData = null;
  createForm.style.display = 'block';
  editForm.style.display = 'none';
  document.getElementById('pwa-form').reset();
  document.getElementById('icon-preview-container').style.display = 'none';
  document.getElementById('upload-content').style.display = 'flex';
}

async function showEditForm(id) {
  const app = await window.electronAPI.getApp(id);
  if (!app) return;
  
  currentView = 'edit';
  currentEditId = id;
  
  createForm.style.display = 'none';
  editForm.style.display = 'block';
  
  document.getElementById('edit-app-name').textContent = app.title;
  document.getElementById('edit-app-id').value = app.id;
  document.getElementById('edit-app-title').value = app.title;
  document.getElementById('edit-app-url').value = app.url;
  document.getElementById('edit-app-browser').value = app.browser;
  
  const iconPreview = document.getElementById('edit-icon-preview');
  const editPreviewContainer = document.getElementById('edit-icon-preview-container');
  if (app.icon_path) {
    iconPreview.src = app.icon_path;
    editPreviewContainer.style.display = 'block';
  } else {
    editPreviewContainer.style.display = 'none';
  }
  
  document.querySelectorAll('.app-item').forEach(item => {
    item.classList.toggle('active', parseInt(item.dataset.id) === id);
  });
}

const iconUpload = document.getElementById('icon-upload');
const iconInput = document.getElementById('icon-input');
const iconPreview = document.getElementById('icon-preview');
const iconPreviewContainer = document.getElementById('icon-preview-container');
const btnRemoveIcon = document.getElementById('btn-remove-icon');
const uploadContent = document.getElementById('upload-content');

iconUpload.addEventListener('click', () => iconInput.click());
iconUpload.addEventListener('dragover', (e) => {
  e.preventDefault();
  iconUpload.style.borderColor = '#2196F3';
});
iconUpload.addEventListener('dragleave', () => {
  iconUpload.style.borderColor = '';
});
iconUpload.addEventListener('drop', (e) => {
  e.preventDefault();
  iconUpload.style.borderColor = '';
  if (e.dataTransfer.files.length) {
    handleIconFile(e.dataTransfer.files[0]);
  }
});

iconInput.addEventListener('change', (e) => {
  if (e.target.files.length) {
    handleIconFile(e.target.files[0]);
  }
});

btnRemoveIcon.addEventListener('click', (e) => {
  e.stopPropagation();
  iconData = null;
  iconPreview.src = '';
  iconPreviewContainer.style.display = 'none';
  uploadContent.style.display = 'flex';
  iconInput.value = '';
});

function handleIconFile(file) {
  if (!file.type.startsWith('image/') && file.type !== 'image/svg+xml') return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    iconData = e.target.result;
    iconPreview.src = iconData;
    iconPreviewContainer.style.display = 'block';
    uploadContent.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

const editIconDisplay = document.getElementById('edit-icon-display');
const editIconInput = document.getElementById('edit-icon-input');
const editIconPreviewContainer = document.getElementById('edit-icon-preview-container');
const btnRemoveEditIcon = document.getElementById('btn-remove-edit-icon');

editIconDisplay.addEventListener('click', (e) => {
  if (e.target !== btnRemoveEditIcon && !btnRemoveEditIcon.contains(e.target)) {
    editIconInput.click();
  }
});

btnRemoveEditIcon.addEventListener('click', (e) => {
  e.stopPropagation();
  iconData = null;
  document.getElementById('edit-icon-preview').src = '';
  editIconPreviewContainer.style.display = 'none';
  editIconInput.value = '';
});

editIconInput.addEventListener('change', (e) => {
  if (e.target.files.length) {
    const file = e.target.files[0];
    if (!file.type.startsWith('image/') && file.type !== 'image/svg+xml') return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      iconData = ev.target.result;
      document.getElementById('edit-icon-preview').src = iconData;
      editIconPreviewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById('pwa-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const title = document.getElementById('app-title').value.trim();
  let url = document.getElementById('app-url').value.trim();
  const browser = document.getElementById('app-browser').value;
  
  if (!title) {
    alert('Please enter the PWA title.');
    document.getElementById('app-title').focus();
    return;
  }
  
  if (!url) {
    alert('Please enter the PWA URL.');
    document.getElementById('app-url').focus();
    return;
  }
  
  if (!browser) {
    alert('Please select a browser.');
    document.getElementById('app-browser').focus();
    return;
  }
  
  if (!iconData) {
    alert('Please add an icon for the PWA.');
    return;
  }
  
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  if (!url.endsWith('/')) {
    url += '/';
  }
  
  const data = {
    title: title,
    url: url,
    browser: browser,
    icon_path: iconData
  };
  
  try {
    const result = await window.electronAPI.createApp(data);
    await loadApps();
    showCreateForm();
    
    if (result.pwaResult && result.pwaResult.success) {
      alert(`✅ PWA "${data.title}" created successfully!\n\nThe app has been added to the GNOME menu.\nYou can find it in Activities > Show Applications.`);
    } else {
      alert('PWA saved to database, but there was a problem creating the shortcut.');
    }
  } catch (error) {
    alert('Error creating PWA: ' + error.message);
  }
});

document.getElementById('edit-pwa-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = parseInt(document.getElementById('edit-app-id').value);
  const existingApp = await window.electronAPI.getApp(id);
  
  const title = document.getElementById('edit-app-title').value.trim();
  let url = document.getElementById('edit-app-url').value.trim();
  const browser = document.getElementById('edit-app-browser').value;
  const currentIcon = iconData || existingApp.icon_path;
  
  if (!title) {
    alert('Please enter the PWA title.');
    document.getElementById('edit-app-title').focus();
    return;
  }
  
  if (!url) {
    alert('Please enter the PWA URL.');
    document.getElementById('edit-app-url').focus();
    return;
  }
  
  if (!browser) {
    alert('Please select a browser.');
    document.getElementById('edit-app-browser').focus();
    return;
  }
  
  if (!currentIcon) {
    alert('Please add an icon for the PWA.');
    return;
  }
  
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  if (!url.endsWith('/')) {
    url += '/';
  }
  
  const data = {
    title: title,
    url: url,
    browser: browser,
    icon_path: currentIcon
  };
  
  try {
    const result = await window.electronAPI.updateApp(id, data);
    await loadApps();
    showEditForm(id);
    
    if (result.pwaResult && result.pwaResult.success) {
      alert(`✅ PWA "${data.title}" updated successfully!\n\nThe GNOME menu shortcut has been updated.`);
    } else {
      alert('PWA updated in database.');
    }
  } catch (error) {
    alert('Error updating PWA: ' + error.message);
  }
});

document.getElementById('btn-delete').addEventListener('click', async () => {
  if (!confirm('Are you sure you want to delete this app?')) return;
  
  const id = parseInt(document.getElementById('edit-app-id').value);
  
  try {
    await window.electronAPI.deleteApp(id);
    await loadApps();
    showCreateForm();
    alert('✅ PWA removed successfully!\n\nThe shortcut has been removed from the GNOME menu.');
  } catch (error) {
    alert('Error removing PWA: ' + error.message);
  }
});

async function loadBrowsers() {
  browsers = await window.electronAPI.getBrowsers();
  populateBrowserSelects();
}

function populateBrowserSelects() {
  const createSelect = document.getElementById('app-browser');
  const editSelect = document.getElementById('edit-app-browser');
  
  const optionsHtml = browsers.map(browser => 
    `<option value="${browser.id}">${browser.name}</option>`
  ).join('');
  
  const fallbackHtml = `
    <option value="firefox">Firefox</option>
    <option value="chrome">Google Chrome</option>
    <option value="chromium">Chromium</option>
  `;
  
  const html = browsers.length > 0 ? optionsHtml : fallbackHtml;
  
  createSelect.innerHTML = html;
  editSelect.innerHTML = html;
}

async function init() {
  await initTheme();
  await loadBrowsers();
  await loadApps();
}

init();
