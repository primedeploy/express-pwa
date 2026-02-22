const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { exec } = require('child_process');

class PWAGenerator {
  constructor() {
    this.appsDir = path.join(app.getPath('home'), '.local', 'share', 'applications');
    this.iconsDir = path.join(app.getPath('home'), '.local', 'share', 'icons', 'express-pwa');
    this.hicolorDir = path.join(app.getPath('home'), '.local', 'share', 'icons', 'hicolor');
    this.profilesDir = path.join(app.getPath('home'), '.local', 'share', 'express-pwa', 'profiles');
    this.launchersDir = path.join(app.getPath('home'), '.local', 'share', 'express-pwa', 'launchers');
    
    if (!fs.existsSync(this.appsDir)) {
      fs.mkdirSync(this.appsDir, { recursive: true });
    }
    if (!fs.existsSync(this.iconsDir)) {
      fs.mkdirSync(this.iconsDir, { recursive: true });
    }
    if (!fs.existsSync(this.profilesDir)) {
      fs.mkdirSync(this.profilesDir, { recursive: true });
    }
    if (!fs.existsSync(this.launchersDir)) {
      fs.mkdirSync(this.launchersDir, { recursive: true });
    }
  }

  getBrowserCommand(browser, url, profilePath, wmClass) {
    const chromiumPwaFlags = [
      `--app="${url}"`,
      `--class="${wmClass}"`,
      `--user-data-dir="${profilePath}"`,
      '--no-first-run',
      '--disable-features=ChromeWhatsNewUI,TabSearch,SidePanel,BraveSidePanel',
      '--disable-extensions',
      '--disable-sync',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-client-side-phishing-detection'
    ].join(' ');

    const browsers = {
      firefox: `firefox --new-instance --profile "${profilePath}" --name "${wmClass}" --new-window "${url}"`,
      chrome: `google-chrome ${chromiumPwaFlags}`,
      chromium: `chromium ${chromiumPwaFlags}`,
      edge: `microsoft-edge ${chromiumPwaFlags}`,
      brave: `brave-browser ${chromiumPwaFlags}`,
      vivaldi: `vivaldi ${chromiumPwaFlags}`,
      opera: `opera ${chromiumPwaFlags}`,
      epiphany: `epiphany --profile="${profilePath}" "${url}"`
    };
    return browsers[browser] || browsers.firefox;
  }

  createProfileDirectory(appId, safeName, browser) {
    const profilePath = path.join(this.profilesDir, `${appId}-${safeName}`);
    if (!fs.existsSync(profilePath)) {
      fs.mkdirSync(profilePath, { recursive: true });
    }
    this.writeChromiumPreferences(profilePath, browser);
    return profilePath;
  }

  writeChromiumPreferences(profilePath, browser) {
    const chromiumBrowsers = ['chrome', 'chromium', 'edge', 'brave', 'vivaldi', 'opera'];
    if (!chromiumBrowsers.includes(browser)) return;

    const defaultProfilePath = path.join(profilePath, 'Default');
    if (!fs.existsSync(defaultProfilePath)) {
      fs.mkdirSync(defaultProfilePath, { recursive: true });
    }

    const prefsPath = path.join(defaultProfilePath, 'Preferences');
    
    let prefs = {};
    if (fs.existsSync(prefsPath)) {
      try {
        prefs = JSON.parse(fs.readFileSync(prefsPath, 'utf8'));
      } catch (e) {
        prefs = {};
      }
    }

    
    prefs.browser = prefs.browser || {};
    prefs.browser.show_home_button = false;
    prefs.browser.has_seen_welcome_page = true;
    prefs.browser.check_default_browser = false;
    prefs.bookmark_bar = prefs.bookmark_bar || {};
    prefs.bookmark_bar.show_on_all_tabs = false;

    
    if (browser === 'brave') {
      prefs.brave = prefs.brave || {};
      prefs.brave.sidebar = prefs.brave.sidebar || {};
      prefs.brave.sidebar.sidebar_show_option = 0; 
      prefs.brave.new_tab_page = prefs.brave.new_tab_page || {};
      prefs.brave.new_tab_page.show_background_image = false;
      prefs.brave.rewards = prefs.brave.rewards || {};
      prefs.brave.rewards.show_brave_rewards_button_in_location_bar = false;
      prefs.brave.wallet = prefs.brave.wallet || {};
      prefs.brave.wallet.show_wallet_icon_on_toolbar = false;
      prefs.brave.brave_vpn = prefs.brave.brave_vpn || {};
      prefs.brave.brave_vpn.show_button = false;
      prefs.brave.shields = prefs.brave.shields || {};
      prefs.brave.shields.stats_badge_visible = false;
      prefs.brave.today = prefs.brave.today || {};
      prefs.brave.today.should_show_toolbar_button = false;
      prefs.brave.enable_closing_last_tab = false;
      prefs.brave.tabs = prefs.brave.tabs || {};
      prefs.brave.tabs.vertical_tabs_enabled = false;
    }

    
    prefs.distribution = prefs.distribution || {};
    prefs.distribution.skip_first_run_ui = true;
    prefs.distribution.suppress_first_run_default_browser_prompt = true;

    try {
      fs.writeFileSync(prefsPath, JSON.stringify(prefs, null, 2));
      console.log(`[PWA Generator] Browser preferences written to ${prefsPath}`);
    } catch (error) {
      console.error('[PWA Generator] Error writing preferences:', error);
    }
  }

  generateDesktopFile(appData) {
    const { id, title, url, browser, icon_path } = appData;
    const safeName = title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const wmClass = `express-pwa-${id}`;
    const desktopFileName = `${wmClass}.desktop`;
    const desktopFilePath = path.join(this.appsDir, desktopFileName);
    
    let iconPath = '';
    let iconName = wmClass;
    if (icon_path && icon_path.startsWith('data:image')) {
      iconPath = this.saveIcon(id, safeName, icon_path);
      
      this.installIconToHicolor(wmClass, icon_path);
      iconName = wmClass;
    }
    
    const profilePath = this.createProfileDirectory(id, safeName, browser);
    const browserCommand = this.getBrowserCommand(browser, url, profilePath, wmClass);
    
    
    const launcherPath = this.createLauncherScript(wmClass, browserCommand, browser);
    
    const desktopContent = `[Desktop Entry]
Version=1.0
Type=Application
Name=${title}
Comment=PWA created with Express PWA
Exec=${launcherPath}
Icon=${iconPath ? iconName : 'application-x-executable'}
Terminal=false
Categories=Network;
StartupWMClass=${wmClass}
StartupNotify=true
X-PWA-URL=${url}
X-PWA-Browser=${browser}
`;

    fs.writeFileSync(desktopFilePath, desktopContent);
    
    fs.chmodSync(desktopFilePath, '755');
    
    this.updateDesktopDatabase();
    
    return {
      success: true,
      desktopFile: desktopFilePath,
      message: `PWA "${title}" installed successfully!`
    };
  }

  createLauncherScript(wmClass, browserCommand, browser) {
    const launcherPath = path.join(this.launchersDir, `${wmClass}.sh`);
    const chromiumBrowsers = ['chrome', 'chromium', 'edge', 'brave', 'vivaldi', 'opera'];
    const isChromium = chromiumBrowsers.includes(browser);

    
    const launcherContent = `#!/bin/bash
# Express PWA Launcher - ${wmClass}
# This script ensures the PWA window gets the correct WM_CLASS for dock icon matching

export BAMF_DESKTOP_FILE_HINT="${path.join(this.appsDir, wmClass + '.desktop')}"
export GIO_LAUNCHED_DESKTOP_FILE="${path.join(this.appsDir, wmClass + '.desktop')}"

${browserCommand} &
BROWSER_PID=$!

# Wait for the window to appear and fix WM_CLASS if needed
if command -v xdotool &> /dev/null && [ "$XDG_SESSION_TYPE" != "wayland" ]; then
  for i in $(seq 1 30); do
    sleep 0.2
    WID=$(xdotool search --pid $BROWSER_PID 2>/dev/null | head -1)
    if [ -n "$WID" ]; then
      xdotool set_window --classname "${wmClass}" --class "${wmClass}" $WID 2>/dev/null
      break
    fi
  done
fi

wait $BROWSER_PID 2>/dev/null
`;

    fs.writeFileSync(launcherPath, launcherContent);
    fs.chmodSync(launcherPath, '755');
    console.log(`[PWA Generator] Launcher script created: ${launcherPath}`);
    return launcherPath;
  }

  installIconToHicolor(wmClass, base64Data) {
    try {
      const matches = base64Data.match(/^data:image\/([\w+]+);base64,(.+)$/);
      if (!matches) return;

      const imageData = matches[2];
      const imageBuffer = Buffer.from(imageData, 'base64');

      
      const sizes = ['48x48', '64x64', '128x128', '256x256'];
      
      for (const size of sizes) {
        const sizeDir = path.join(this.hicolorDir, size, 'apps');
        if (!fs.existsSync(sizeDir)) {
          fs.mkdirSync(sizeDir, { recursive: true });
        }
        const iconPath = path.join(sizeDir, `${wmClass}.png`);
        
        fs.writeFileSync(iconPath, imageBuffer);
      }

      
      let extension = matches[1];
      if (extension === 'svg+xml') {
        const scalableDir = path.join(this.hicolorDir, 'scalable', 'apps');
        if (!fs.existsSync(scalableDir)) {
          fs.mkdirSync(scalableDir, { recursive: true });
        }
        fs.writeFileSync(path.join(scalableDir, `${wmClass}.svg`), imageBuffer);
      }

      console.log(`[PWA Generator] Icon installed to hicolor theme as ${wmClass}`);
    } catch (error) {
      console.error('[PWA Generator] Error installing icon to hicolor:', error);
    }
  }

  saveIcon(appId, safeName, base64Data) {
    try {
      const matches = base64Data.match(/^data:image\/([\w+]+);base64,(.+)$/);
      if (!matches) return '';
      
      let extension = matches[1];
      if (extension === 'jpeg') {
        extension = 'jpg';
      } else if (extension === 'svg+xml') {
        extension = 'svg';
      }
      
      const imageData = matches[2];
      const iconFileName = `express-pwa-${appId}.${extension}`;
      const iconPath = path.join(this.iconsDir, iconFileName);
      
      fs.writeFileSync(iconPath, Buffer.from(imageData, 'base64'));
      
      return iconPath;
    } catch (error) {
      console.error('Error saving icon:', error);
      return '';
    }
  }

  updateDesktopDatabase() {
    const { execSync } = require('child_process');
    const homePath = app.getPath('home');
    
    try {
      execSync(`update-desktop-database "${homePath}/.local/share/applications" 2>/dev/null`, { stdio: 'ignore' });
    } catch (e) {
      console.log('[PWA Generator] update-desktop-database not available');
    }
    
    
    try {
      execSync(`gtk-update-icon-cache -f -t "${homePath}/.local/share/icons/hicolor" 2>/dev/null`, { stdio: 'ignore' });
    } catch (e) {
      console.log('[PWA Generator] gtk-update-icon-cache not available for hicolor');
    }
    
    try {
      execSync(`gtk-update-icon-cache -f -t "${homePath}/.local/share/icons" 2>/dev/null`, { stdio: 'ignore' });
    } catch (e) {
      console.log('[PWA Generator] gtk-update-icon-cache not available');
    }
    
    try {
      execSync(`dbus-send --type=method_call --dest=org.gnome.Shell /org/gnome/Shell org.gnome.Shell.Eval string:'Main.overview._overview._controls._appDisplay._redisplay()' 2>/dev/null`, { stdio: 'ignore' });
    } catch (e) {}
    
    try {
      execSync(`touch "${homePath}/.local/share/applications" 2>/dev/null`, { stdio: 'ignore' });
    } catch (e) {}
    
    console.log('[PWA Generator] Desktop database updated');
  }

  scanExistingPWAs() {
    console.log('[PWA Generator] Scanning for existing PWAs...');
    const existingPWAs = [];
    
    try {
      if (!fs.existsSync(this.appsDir)) {
        return existingPWAs;
      }
      
      const files = fs.readdirSync(this.appsDir);
      const pwaFiles = files.filter(f => f.startsWith('express-pwa-') && f.endsWith('.desktop'));
      
      console.log(`[PWA Generator] Found ${pwaFiles.length} Express PWA desktop file(s)`);
      
      pwaFiles.forEach(file => {
        const filePath = path.join(this.appsDir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          const match = file.match(/^express-pwa-(\d+)(?:-(.+))?\.desktop$/);
          if (!match) return;
          
          const id = parseInt(match[1]);
          
          const nameMatch = content.match(/^Name=(.+)$/m);
          const execMatch = content.match(/^Exec=(.+)$/m);
          const iconMatch = content.match(/^Icon=(.+)$/m);
          
          if (!nameMatch || !execMatch) return;
          
          const title = nameMatch[1];
          const execLine = execMatch[1];
          const iconPath = iconMatch ? iconMatch[1] : '';
          
          let url = '';
          let browser = 'firefox';
          
          
          const pwaUrlMatch = content.match(/^X-PWA-URL=(.+)$/m);
          const pwaBrowserMatch = content.match(/^X-PWA-Browser=(.+)$/m);
          
          if (pwaUrlMatch && pwaBrowserMatch) {
            url = pwaUrlMatch[1];
            browser = pwaBrowserMatch[1];
          } else {
            
            if (execLine.includes('firefox')) {
              browser = 'firefox';
              const urlMatch = execLine.match(/--new-window "([^"]+)"/);
              url = urlMatch ? urlMatch[1] : '';
            } else if (execLine.includes('google-chrome')) {
              browser = 'chrome';
              const urlMatch = execLine.match(/--app="([^"]+)"/);
              url = urlMatch ? urlMatch[1] : '';
            } else if (execLine.includes('chromium')) {
              browser = 'chromium';
              const urlMatch = execLine.match(/--app="([^"]+)"/);
              url = urlMatch ? urlMatch[1] : '';
            } else if (execLine.includes('microsoft-edge')) {
              browser = 'edge';
              const urlMatch = execLine.match(/--app="([^"]+)"/);
              url = urlMatch ? urlMatch[1] : '';
            } else if (execLine.includes('brave-browser')) {
              browser = 'brave';
              const urlMatch = execLine.match(/--app="([^"]+)"/);
              url = urlMatch ? urlMatch[1] : '';
            } else if (execLine.includes('vivaldi')) {
              browser = 'vivaldi';
              const urlMatch = execLine.match(/--app="([^"]+)"/);
              url = urlMatch ? urlMatch[1] : '';
            } else if (execLine.includes('opera')) {
              browser = 'opera';
              const urlMatch = execLine.match(/--app="([^"]+)"/);
              url = urlMatch ? urlMatch[1] : '';
            } else if (execLine.includes('epiphany')) {
              browser = 'epiphany';
              const urlMatch = execLine.match(/"([^"]+)"$/);
              url = urlMatch ? urlMatch[1] : '';
            }
          }
          
          if (url) {
            let iconData = '';
            
            const possibleIconPath = path.join(this.iconsDir, `express-pwa-${id}.png`);
            const hicolorIconPath = path.join(this.hicolorDir, '128x128', 'apps', `express-pwa-${id}.png`);
            
            const iconSources = [iconPath, possibleIconPath, hicolorIconPath].filter(p => 
              p && p !== 'application-x-executable' && p !== `express-pwa-${id}` && fs.existsSync(p)
            );
            
            if (iconSources.length > 0) {
              try {
                const iconBuffer = fs.readFileSync(iconSources[0]);
                const ext = path.extname(iconSources[0]).slice(1) || 'png';
                const mimeType = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
                iconData = `data:${mimeType};base64,${iconBuffer.toString('base64')}`;
              } catch (err) {
                console.error(`[PWA Generator] Error reading icon:`, err);
              }
            }
            
            existingPWAs.push({
              id,
              title,
              url,
              browser,
              icon_path: iconData,
              desktopFile: filePath
            });
            
            console.log(`[PWA Generator] Found PWA: ${title} (ID: ${id})`);
          }
        } catch (err) {
          console.error(`[PWA Generator] Error parsing ${file}:`, err);
        }
      });
      
      console.log(`[PWA Generator] Successfully parsed ${existingPWAs.length} PWA(s)`);
    } catch (error) {
      console.error('[PWA Generator] Error scanning for PWAs:', error);
    }
    
    return existingPWAs;
  }

  removeDesktopFile(appId, title) {
    console.log(`[PWA Generator] Removing desktop file for app ${appId}: ${title}`);
    
    try {
      const wmClass = `express-pwa-${appId}`;
      
      
      const desktopFilePath = path.join(this.appsDir, `${wmClass}.desktop`);
      if (fs.existsSync(desktopFilePath)) {
        console.log(`[PWA Generator] Removing: ${desktopFilePath}`);
        try {
          fs.unlinkSync(desktopFilePath);
          console.log(`[PWA Generator] Successfully removed: ${desktopFilePath}`);
        } catch (err) {
          console.error(`[PWA Generator] Failed to remove ${desktopFilePath}:`, err);
        }
      }
      
      
      if (fs.existsSync(this.iconsDir)) {
        const iconFiles = fs.readdirSync(this.iconsDir);
        const matchingIcons = iconFiles.filter(f => f.startsWith(`express-pwa-${appId}.`));
        
        console.log(`[PWA Generator] Found ${matchingIcons.length} icon file(s) to remove`);
        
        matchingIcons.forEach(file => {
          const iconPath = path.join(this.iconsDir, file);
          console.log(`[PWA Generator] Removing icon: ${iconPath}`);
          try {
            fs.unlinkSync(iconPath);
            console.log(`[PWA Generator] Successfully removed icon: ${iconPath}`);
          } catch (err) {
            console.error(`[PWA Generator] Failed to remove icon ${iconPath}:`, err);
          }
        });
      }
      
      
      this.removeHicolorIcons(wmClass);
      
      
      const launcherPath = path.join(this.launchersDir, `${wmClass}.sh`);
      if (fs.existsSync(launcherPath)) {
        console.log(`[PWA Generator] Removing launcher: ${launcherPath}`);
        try {
          fs.unlinkSync(launcherPath);
          console.log(`[PWA Generator] Successfully removed launcher: ${launcherPath}`);
        } catch (err) {
          console.error(`[PWA Generator] Failed to remove launcher ${launcherPath}:`, err);
        }
      }
      
      
      if (fs.existsSync(this.profilesDir)) {
        const profileDirs = fs.readdirSync(this.profilesDir);
        const matchingProfiles = profileDirs.filter(d => d.startsWith(`${appId}-`));
        
        console.log(`[PWA Generator] Found ${matchingProfiles.length} profile directory(ies) to remove`);
        
        matchingProfiles.forEach(dir => {
          const profilePath = path.join(this.profilesDir, dir);
          console.log(`[PWA Generator] Removing profile directory: ${profilePath}`);
          try {
            fs.rmSync(profilePath, { recursive: true, force: true });
            console.log(`[PWA Generator] Successfully removed profile: ${profilePath}`);
          } catch (err) {
            console.error(`[PWA Generator] Failed to remove profile ${profilePath}:`, err);
          }
        });
      }
      
      this.updateDesktopDatabase();
      
      console.log(`[PWA Generator] Successfully removed PWA: ${title}`);
      return { success: true };
    } catch (error) {
      console.error(`[PWA Generator] Error removing desktop file:`, error);
      return { success: false, error: error.message };
    }
  }

  removeHicolorIcons(wmClass) {
    const sizes = ['48x48', '64x64', '128x128', '256x256', 'scalable'];
    for (const size of sizes) {
      const ext = size === 'scalable' ? 'svg' : 'png';
      const iconPath = path.join(this.hicolorDir, size, 'apps', `${wmClass}.${ext}`);
      if (fs.existsSync(iconPath)) {
        try {
          fs.unlinkSync(iconPath);
          console.log(`[PWA Generator] Removed hicolor icon: ${iconPath}`);
        } catch (err) {
          console.error(`[PWA Generator] Failed to remove hicolor icon ${iconPath}:`, err);
        }
      }
    }
  }

  prepareUpdate(appId, oldTitle, newTitle) {
    console.log(`[PWA Generator] Preparing update for app ${appId}: ${oldTitle} -> ${newTitle}`);
    
    try {
      const oldSafeName = oldTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const newSafeName = newTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const wmClass = `express-pwa-${appId}`;
      
      
      if (oldSafeName !== newSafeName) {
        const oldProfilePath = path.join(this.profilesDir, `${appId}-${oldSafeName}`);
        const newProfilePath = path.join(this.profilesDir, `${appId}-${newSafeName}`);
        
        if (fs.existsSync(oldProfilePath)) {
          console.log(`[PWA Generator] Renaming profile directory from ${oldProfilePath} to ${newProfilePath}`);
          try {
            fs.renameSync(oldProfilePath, newProfilePath);
          } catch (err) {
            console.error(`[PWA Generator] Failed to rename profile directory:`, err);
          }
        }
      }
      
      
      if (fs.existsSync(this.iconsDir)) {
        const iconFiles = fs.readdirSync(this.iconsDir);
        const matchingIcons = iconFiles.filter(f => f.startsWith(`express-pwa-${appId}.`));
        
        matchingIcons.forEach(file => {
          const iconPath = path.join(this.iconsDir, file);
          try {
            fs.unlinkSync(iconPath);
          } catch (err) {}
        });
      }
      
      this.removeHicolorIcons(wmClass);
      
      return { success: true };
    } catch (error) {
      console.error(`[PWA Generator] Error preparing update:`, error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = PWAGenerator;
