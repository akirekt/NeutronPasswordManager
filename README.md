# 🔐 Neutron Password Manager

A lightweight, **open-source desktop password manager** built with Electron that stores all sensitive data locally on your device with military-grade encryption. No cloud, no external servers — your passwords, your machine, your control.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Electron](https://img.shields.io/badge/electron-30.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue.svg)

## 🎯 Overview

Neutron Password Manager is a free, open-source password manager designed with privacy as the primary concern. All data is encrypted locally using **AES-256 encryption** via CryptoJS and never leaves your machine. Perfect for users who value privacy and want complete transparency into how their passwords are protected.

## 🛡️ Key Features

- ✅ **Local-Only Storage** — No cloud synchronization, no external servers, no internet required
- 🔒 **AES-256 Encryption** — Military-grade encryption for all stored passwords
- 🔑 **Master Password Protection** — Single secure master password protects all entries
- 💻 **Cross-Platform Desktop Application** — Built with Electron for Windows, macOS, and Linux
- 👁️ **Open Source** — Full transparency; anyone can audit the code
- ⚡ **Fast & Lightweight** — Minimal resource usage, instant access to your passwords
- 🎨 **Clean UI** — Simple, intuitive interface built with modern web technologies
- 🔄 **Offline First** — Works completely offline with zero external dependencies

## 📥 Installation & Getting Started

### Option 1: Download Pre-Built Release (Recommended)

Download the latest compiled release for your operating system:

👉 **[Download Latest Release](https://github.com/akirekt/NeutronPasswordManager/releases)**

Currently available for:
- **Windows** (.exe installer)
- **macOS** (coming soon)
- **Linux** (coming soon)

### Option 2: Build from Source

For developers who want to audit the code or build it themselves:

#### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

#### Build Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/akirekt/NeutronPasswordManager.git
   cd NeutronPasswordManager
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run dev
   ```

4. **Build the application:**
   ```bash
   npm run build
   ```
   
   The compiled application will be generated in the `dist-release/` directory.

5. **Preview the built app:**
   ```bash
   npm run preview
   ```

### Create Installation Packages

The JavaScript and Electron bundles must be compiled before packaging. The commands below use the checked-in `electron-builder.json` configuration and write packages to `dist-release/`.

#### Windows `.exe` installer

On Windows, run:

```bash
npm run build
npx electron-builder --config electron-builder.json --win nsis --x64
```

The result is an NSIS `.exe` installer for 64-bit Windows under `dist-release/`.

Windows packaging can also be cross-compiled from Linux when Wine and the required 32-bit compatibility libraries are installed. On Ubuntu/Debian, install Wine before running the commands:

```bash
sudo apt update
sudo apt install wine64
npx tsc
npx vite build
npx electron-builder --config electron-builder.json --win nsis --x64
```

#### Linux RPM package

Build from a Linux host:

```bash
npx tsc
npx vite build
npx electron-builder --config electron-builder.json --linux rpm --x64
```

If `rpmbuild` is unavailable on Ubuntu/Debian, install the RPM tooling first:

```bash
sudo apt install rpm
```

The generated `.rpm` package will be in `dist-release/`.

#### Linux DEB package

```bash
npx tsc
npx vite build
npx electron-builder --config electron-builder.json --linux deb --x64
```

The generated `.deb` package will be in `dist-release/`.

#### Linux AppImage

```bash
npx tsc
npx vite build
npx electron-builder --config electron-builder.json --linux AppImage --x64
```

The generated `.AppImage` file will be in `dist-release/`. After downloading or moving it to another Linux machine, make it executable before launching:

```bash
chmod +x dist-release/*.AppImage
```

#### Build all configured Linux packages

On Linux, `npm run build` compiles the app and builds the configured `AppImage`, `deb`, and `rpm` targets:

```bash
npm run build
```

> **Note:** Package formats should normally be built on their target operating system. Linux cross-packaging to Windows requires Wine; creating Linux installation packages from Windows is generally less reliable. Building for macOS requires a macOS host.

## 🔐 Security Architecture

### Encryption Method
- **Algorithm:** AES-256 (Advanced Encryption Standard)
- **Library:** CryptoJS
- **Key Derivation:** SHA-256 hashing of master password

### How It Works
1. User sets a master password on first launch
2. Master password is hashed using SHA-256 (never stored in plain text)
3. All stored passwords are encrypted with AES-256 using the master password as the key
4. Data is stored locally in your user directory, never transmitted over the internet
5. Clearing the master key from memory when needed

### Security Best Practices
- Choose a **strong, unique master password**
- Never share your master password with anyone
- Regularly back up your password database file
- Review the source code yourself — this is open source!

## 🧰 Technology Stack

| Technology | Purpose |
|-----------|---------|
| **Electron** v30.0+ | Desktop application framework |
| **Vite** v5+ | Fast build tool and dev server |
| **TypeScript** v5+ | Type-safe JavaScript development |
| **CryptoJS** v4+ | Cryptographic functions (AES-256, SHA-256) |
| **electron-builder** | Automated application building and packaging |

## 📁 Project Structure

```
NeutronPasswordManager/
├── src/
│   ├── main.ts              # Main application entry point
│   ├── style.css            # Application styling
│   ├── ui/                  # UI components (login, password manager)
│   ├── utils/               # Utility modules
│   │   ├── encryption.ts    # Encryption service (AES-256, SHA-256)
│   │   ├── storage.ts       # Local storage management
│   │   └── settings.ts      # User settings management
│   └── vite-env.d.ts        # Vite type definitions
├── electron/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # Preload script for security
│   └── electron-env.d.ts    # Electron type definitions
├── public/                  # Static assets
├── package.json             # Project dependencies and scripts
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── electron-builder.json    # Build configuration
```

## 🚀 Usage

### First Launch
1. Open Neutron Password Manager
2. Set your **master password** (this is critical — make it strong!)
3. Start adding your passwords and credentials

### Managing Passwords
- **Add Password:** Click "Add New" and fill in the details
- **View Password:** Click on any entry to view/edit
- **Delete Password:** Select an entry and confirm deletion
- **Logout:** Clears the master key from memory

## 🤝 Contributing

We welcome contributions! Whether it's bug fixes, new features, or documentation improvements:

1. **Fork** the repository
2. **Create a branch** for your feature (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to your branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request** with a clear description

### Development Workflow
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run type checking and build
npm run build

# Preview built app
npm run preview
```

## 🐛 Bug Reports & Issues

Found a bug or have a feature request? Please open an issue on GitHub:

👉 **[Report an Issue](https://github.com/akirekt/NeutronPasswordManager/issues)**

Include:
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Your operating system and application version

## 📄 License

This project is open source and available under the **MIT License**. See the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

**USE AT YOUR OWN RISK.** This software is provided as-is without any warranty. While we've implemented industry-standard encryption practices:

- Always maintain a backup of your password database
- Never forget your master password — there's no recovery mechanism
- For mission-critical password management, consider using established password managers with professional security audits
- This project is community-driven; professional support is not available

## 🔗 Resources

- **GitHub Repository:** https://github.com/akirekt/NeutronPasswordManager
- **Issue Tracker:** https://github.com/akirekt/NeutronPasswordManager/issues
- **CryptoJS Documentation:** https://cryptojs.gitbook.io/docs/
- **Electron Documentation:** https://www.electronjs.org/docs

## 👥 Community

Questions? Ideas? Want to contribute? Join the community:

- 🐛 **Report bugs** via GitHub Issues
- 💡 **Suggest features** via GitHub Discussions
- 🔄 **Contribute code** via Pull Requests

---

**Made with ❤️ for privacy-conscious developers**

*Neutron Password Manager — Keep your passwords local. Keep them safe. Keep them yours.*
