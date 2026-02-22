# Express PWA

<p align="center">
  <img src="src/images/icon.png" alt="Express PWA" width="128" height="128">
</p>

<p align="center">
  <strong>Fully open-source app for creating PWAs (Progressive Web Applications) for the GNOME / Xorg environment.</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/version-0.5.0-brightgreen.svg" alt="Version">
  <img src="https://img.shields.io/badge/platform-Linux-green.svg" alt="Platform">
  <img src="https://img.shields.io/badge/desktop-GNOME-orange.svg" alt="Desktop">
</p>

---

## ✨ Features

- **Create PWA shortcuts** from any website
- **Automatic theme detection** (Light/Dark mode from GNOME settings)
- **Browser selection** - Choose Firefox, Chrome, Chromium, Edge, Brave, and more
- **Isolated browser profiles** - Each PWA runs in its own isolated profile
- **Custom icons** - Drag & drop or click to upload
- **GNOME integration** - PWAs appear directly in your application menu
- **SQLite storage** - Local database for app persistence
- **Auto-sync** - Automatically detects and syncs existing PWAs

## 📸 Screenshots

| Light Mode | Dark Mode |
|------------|-----------|
| Create and manage your PWAs | Automatic dark theme detection |

## 🚀 Installation

### From .deb package (Ubuntu/Debian)

```bash
# Download the latest release
wget https://github.com/primedeploy/express-pwa/releases/latest/download/express-pwa_25.02.20_amd64.deb

# Install
sudo dpkg -i express-pwa_25.02.20_amd64.deb

# Fix dependencies if needed
sudo apt-get install -f
```

### From source

```bash
# Clone the repository
git clone https://github.com/primedeploy/express-pwa.git
cd express-pwa

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build .deb package
npm run build
```

## 🛠️ Development

### Requirements

- Node.js 18+
- npm or yarn
- Linux with GNOME desktop
- ImageMagick (optional, for icon generation)

### Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start the application |
| `npm run dev` | Run in development mode with logging |
| `npm run build` | Build .deb package |
| `npm run package:deb` | Build .deb package (alternative) |

### Dependencies

The .deb package requires:
- libgtk-3-0
- libnotify4
- libnss3
- libxss1
- libxtst6
- xdg-utils

## 📁 Project Structure

```
express-pwa/
├── src/
│   ├── main.js             # Electron main process
│   ├── preload.js          # IPC bridge
│   ├── database.js         # SQLite persistence
│   ├── pwa-generator.js    # .desktop file generator
│   ├── browser-detector.js # Installed browser detection
│   ├── images/
│   │   └── icon.png        # App icon
│   └── renderer/
│       ├── index.html      # UI structure
│       ├── js/
│       │   └── app.js      # Frontend logic
│       └── styles/
│           ├── main.css    # Base styles
│           ├── light.css   # Light theme
│           └── dark.css    # Dark theme
├── build/
│   ├── icons/              # Generated icons for packaging
│   ├── after-install.sh    # Post-installation script
│   └── express-pwa.desktop # Desktop entry template
├── scripts/
│   └── generate-icons.js   # Icon generation script
├── assets/
│   ├── icon.png
│   └── icon.svg
└── package.json
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Database powered by [sql.js](https://sql.js.org/)
- Designed for [GNOME Desktop](https://www.gnome.org/)

---

<p align="center">
  Made with ❤️ by <a href="https://primedeploy.com">Prime Deploy</a><br>
  <a href="https://primedeploy.com/apps/express-pwa">Official Website</a> • 
  <a href="https://github.com/primedeploy/express-pwa">GitHub Repository</a>
</p>
