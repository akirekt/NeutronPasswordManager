export interface AppSettings {
  darkMode: boolean
  addPasswordInWindow: boolean
  editPasswordInWindow: boolean
  hideAllPasswords: boolean
}

export class SettingsService {
  private settingsKey = 'pm_settings'

  private defaultSettings: AppSettings = {
    darkMode: false,
    addPasswordInWindow: false,
    editPasswordInWindow: false,
    hideAllPasswords: false
  }

  getSettings(): AppSettings {
    const settings = localStorage.getItem(this.settingsKey)
    if (!settings) {
      localStorage.setItem(this.settingsKey, JSON.stringify(this.defaultSettings))
      return this.defaultSettings
    }
    return { ...this.defaultSettings, ...JSON.parse(settings) }
  }

  saveSettings(settings: Partial<AppSettings>): void {
    const current = this.getSettings()
    const updated = { ...current, ...settings }
    localStorage.setItem(this.settingsKey, JSON.stringify(updated))
  }

  toggleDarkMode(): boolean {
    const settings = this.getSettings()
    const newValue = !settings.darkMode
    this.saveSettings({ darkMode: newValue })
    return newValue
  }

  setAddPasswordInWindow(value: boolean): void {
    this.saveSettings({ addPasswordInWindow: value })
  }

  setEditPasswordInWindow(value: boolean): void {
    this.saveSettings({ editPasswordInWindow: value })
  }

  toggleHideAllPasswords(): boolean {
    const settings = this.getSettings()
    const newValue = !settings.hideAllPasswords
    this.saveSettings({ hideAllPasswords: newValue })
    return newValue
  }
}

export const settingsService = new SettingsService()
