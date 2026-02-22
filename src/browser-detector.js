const { execSync } = require('child_process');
const fs = require('fs');

class BrowserDetector {
  constructor() {
    this.browsers = this.detectBrowsers();
  }

  detectBrowsers() {
    const browserConfigs = [
      {
        id: 'firefox',
        name: 'Firefox',
        commands: ['firefox', 'firefox-esr'],
        desktopFiles: ['firefox.desktop', 'firefox-esr.desktop'],
        launchCmd: (url) => `firefox --new-window "${url}"`
      },
      {
        id: 'chrome',
        name: 'Google Chrome',
        commands: ['google-chrome', 'google-chrome-stable'],
        desktopFiles: ['google-chrome.desktop', 'google-chrome-stable.desktop'],
        launchCmd: (url) => `google-chrome --app="${url}"`
      },
      {
        id: 'chromium',
        name: 'Chromium',
        commands: ['chromium', 'chromium-browser'],
        desktopFiles: ['chromium.desktop', 'chromium-browser.desktop'],
        launchCmd: (url) => `chromium --app="${url}"`
      },
      {
        id: 'edge',
        name: 'Microsoft Edge',
        commands: ['microsoft-edge', 'microsoft-edge-stable'],
        desktopFiles: ['microsoft-edge.desktop'],
        launchCmd: (url) => `microsoft-edge --app="${url}"`
      },
      {
        id: 'brave',
        name: 'Brave',
        commands: ['brave-browser', 'brave'],
        desktopFiles: ['brave-browser.desktop'],
        launchCmd: (url) => `brave-browser --app="${url}"`
      },
      {
        id: 'vivaldi',
        name: 'Vivaldi',
        commands: ['vivaldi', 'vivaldi-stable'],
        desktopFiles: ['vivaldi.desktop', 'vivaldi-stable.desktop'],
        launchCmd: (url) => `vivaldi --app="${url}"`
      },
      {
        id: 'opera',
        name: 'Opera',
        commands: ['opera'],
        desktopFiles: ['opera.desktop'],
        launchCmd: (url) => `opera --app="${url}"`
      },
      {
        id: 'epiphany',
        name: 'GNOME Web',
        commands: ['epiphany', 'org.gnome.Epiphany'],
        desktopFiles: ['org.gnome.Epiphany.desktop', 'epiphany.desktop'],
        launchCmd: (url) => `epiphany "${url}"`
      }
    ];

    const installedBrowsers = [];

    for (const browser of browserConfigs) {
      if (this.isBrowserInstalled(browser)) {
        installedBrowsers.push({
          id: browser.id,
          name: browser.name,
          command: this.getAvailableCommand(browser.commands)
        });
      }
    }

    return installedBrowsers;
  }

  isBrowserInstalled(browser) {
    for (const cmd of browser.commands) {
      try {
        execSync(`which ${cmd} 2>/dev/null`, { stdio: 'pipe' });
        return true;
      } catch (e) {}
    }

    const desktopDirs = [
      '/usr/share/applications',
      '/usr/local/share/applications',
      `${process.env.HOME}/.local/share/applications`
    ];

    for (const dir of desktopDirs) {
      for (const file of browser.desktopFiles) {
        const path = `${dir}/${file}`;
        if (fs.existsSync(path)) {
          return true;
        }
      }
    }

    return false;
  }

  getAvailableCommand(commands) {
    for (const cmd of commands) {
      try {
        execSync(`which ${cmd} 2>/dev/null`, { stdio: 'pipe' });
        return cmd;
      } catch (e) {}
    }
    return commands[0];
  }

  getBrowserList() {
    return this.browsers;
  }

  getLaunchCommand(browserId, url) {
    const browserConfigs = {
      firefox: `firefox --new-window "${url}"`,
      chrome: `google-chrome --app="${url}"`,
      chromium: `chromium --app="${url}"`,
      edge: `microsoft-edge --app="${url}"`,
      brave: `brave-browser --app="${url}"`,
      vivaldi: `vivaldi --app="${url}"`,
      opera: `opera --app="${url}"`,
      epiphany: `epiphany "${url}"`
    };

    return browserConfigs[browserId] || `xdg-open "${url}"`;
  }
}

module.exports = BrowserDetector;
