import { Password, storageService } from '../utils/storage'
import { settingsService, AppSettings } from '../utils/settings'
import { createPasswordModal, createNoteModal, showConfirmDialog } from './modals'
import { encryptionService } from '../utils/index'
import { logout } from '../main'

export class PasswordManager {
  private container: HTMLDivElement | null = null
  private passwords: Password[] = []
  private settings: AppSettings

  constructor() {
    this.settings = settingsService.getSettings()
  }

  create(): HTMLDivElement {
    this.container = document.createElement('div')
    this.container.className = `password-manager ${this.settings.darkMode ? 'dark' : 'light'}`

    this.passwords = storageService.getPasswords()

    this.container.innerHTML = `
      <div class="pm-container">
        <div id="updateNotification" class="update-notification hidden">
          <div class="update-notification-content">
            <span id="updateMessage">Welcome! New features have been added.</span>
            <button id="closeUpdateBtn" class="btn-close-notification">×</button>
          </div>
        </div>

        <header class="pm-header">
          <h1><svg class="header-logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L4 6V12C4 16.4 7.4 20.5 12 22C16.6 20.5 20 16.4 20 12V6L12 2Z" fill="#4CAF50" stroke="#4CAF50" stroke-width="0.5"/><path d="M9 12L11 14L15 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Neutron Password Manager</h1>
          <button id="settingsBtn" class="btn-icon" title="Settings">⚙️</button>
        </header>

        <div class="pm-toolbar">
          <input
            type="text"
            id="searchInput"
            class="input-field"
            placeholder="Search passwords..."
          />
          <button id="addBtn" class="btn-primary">+ Add Password</button>
        </div>

        <div class="pm-list" id="passwordList">
          ${this.renderPasswordList()}
        </div>

        <div id="settingsPanel" class="settings-panel hidden">
          <div class="settings-content">
            <h2>Settings</h2>
            
            <div class="settings-group">
              <label class="switch-label">
                <input type="checkbox" id="darkModeSwitch" ${this.settings.darkMode ? 'checked' : ''}>
                <span>Dark Mode</span>
              </label>
            </div>

            <div class="settings-group">
              <label class="switch-label">
                <input type="checkbox" id="hidePasswordsSwitch" ${this.settings.hideAllPasswords ? 'checked' : ''}>
                <span>Hide All Passwords</span>
              </label>
            </div>

            <button id="changePasswordBtn" class="btn-secondary" style="width: 100%; margin-bottom: 10px;">Change Master Password</button>
            <button id="logoutBtn" class="btn-danger" style="width: 100%;">Logout</button>
          </div>
        </div>
      </div>
    `

    this.attachEventListeners()
    this.attachPasswordListeners()
    this.attachPasswordItemListeners()
    this.checkForUpdates()

    return this.container
  }

  private attachEventListeners(): void {
    const addBtn = this.container!.querySelector('#addBtn') as HTMLButtonElement
    const settingsBtn = this.container!.querySelector('#settingsBtn') as HTMLButtonElement
    const searchInput = this.container!.querySelector('#searchInput') as HTMLInputElement
    const settingsPanel = this.container!.querySelector('#settingsPanel') as HTMLDivElement
    const logoutBtn = this.container!.querySelector('#logoutBtn') as HTMLButtonElement

    addBtn.addEventListener('click', () => this.handleAddPassword())

    settingsBtn.addEventListener('click', () => {
      settingsPanel.classList.toggle('hidden')
    })

    searchInput.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase()
      this.filterPasswords(query)
    })

    const darkModeSwitch = this.container!.querySelector('#darkModeSwitch') as HTMLInputElement

    darkModeSwitch.addEventListener('change', () => {
      this.settings.darkMode = darkModeSwitch.checked
      settingsService.toggleDarkMode()
      this.container!.classList.toggle('dark')
      this.container!.classList.toggle('light')
    })

    const hidePasswordsSwitch = this.container!.querySelector('#hidePasswordsSwitch') as HTMLInputElement
    hidePasswordsSwitch.addEventListener('change', () => {
      this.settings.hideAllPasswords = hidePasswordsSwitch.checked
      settingsService.saveSettings({ hideAllPasswords: hidePasswordsSwitch.checked })
      this.updatePasswordVisibility()
    })

    const changePasswordBtn = this.container!.querySelector('#changePasswordBtn') as HTMLButtonElement
    changePasswordBtn.addEventListener('click', () => this.handleChangePassword())

    logoutBtn.addEventListener('click', async () => {
      const confirmed = await showConfirmDialog('Are you sure you want to logout?')
      if (confirmed) {
        logout()
      }
    })

    document.addEventListener('click', (e) => {
      if (!settingsBtn.contains(e.target as Node) && !settingsPanel.contains(e.target as Node)) {
        settingsPanel.classList.add('hidden')
      }
    })
  }

  private attachPasswordListeners(): void {
    const list = this.container!.querySelector('#passwordList') as HTMLDivElement
    let draggedItem: HTMLElement | null = null
    let draggedOverItem: HTMLElement | null = null

    const clearDragState = () => {
      if (draggedItem) {
        draggedItem.style.opacity = '1'
        draggedItem = null
      }
      if (draggedOverItem) {
        draggedOverItem.style.borderTop = '1px solid var(--border-light)'
        draggedOverItem.style.borderBottom = '1px solid var(--border-light)'
        draggedOverItem = null
      }
    }

    list.addEventListener('dragstart', (e) => {
      const dragHandle = (e.target as HTMLElement).closest('.drag-handle') as HTMLElement
      if (dragHandle) {
        const item = dragHandle.closest('.password-item') as HTMLElement
        if (item) {
          draggedItem = item
          item.style.opacity = '0.5'
          ;(e as DragEvent).dataTransfer!.effectAllowed = 'move'
        }
      }
    })

    list.addEventListener('dragover', (e) => {
      e.preventDefault()
      ;(e as DragEvent).dataTransfer!.dropEffect = 'move'

      if (draggedItem) {
        const item = (e.target as HTMLElement).closest('.password-item') as HTMLElement
        if (item && item !== draggedItem) {
          if (draggedOverItem && draggedOverItem !== item) {
            draggedOverItem.style.borderTop = '1px solid var(--border-light)'
            draggedOverItem.style.borderBottom = '1px solid var(--border-light)'
          }
          draggedOverItem = item
          item.style.borderTop = '3px solid #4CAF50'
          item.style.borderBottom = '3px solid #4CAF50'
        }
      }
    })

    list.addEventListener('dragleave', (e) => {
      const item = (e.target as HTMLElement).closest('.password-item') as HTMLElement
      if (item && item === draggedOverItem) {
        item.style.borderTop = '1px solid var(--border-light)'
        item.style.borderBottom = '1px solid var(--border-light)'
      }
    })

    list.addEventListener('drop', (e) => {
      e.preventDefault()
      if (draggedItem && draggedOverItem && draggedItem !== draggedOverItem) {
        this.reorderPasswords(draggedItem, draggedOverItem)
      }
      clearDragState()
    })

    list.addEventListener('dragend', () => {
      clearDragState()
    })
  }

  private renderPasswordList(): string {
    if (this.passwords.length === 0) {
      return '<div class="empty-state">No passwords yet. Click "Add Password" to get started!</div>'
    }

    const passwordType = this.settings.hideAllPasswords ? 'password' : 'text'

    return this.passwords
      .map((pwd, index) => `
        <div class="password-item" data-id="${pwd.id}" data-index="${index}">
          <div class="password-item-top">
            <div class="drag-handle" draggable="true" title="Drag to reorder">⋮⋮</div>
            
            <div class="password-item-header">
              <h3>${pwd.website}</h3>
            </div>

            <div class="password-item-actions">
              ${pwd.note ? `<button class="btn-note-inline" data-id="${pwd.id}" title="Show note">Note</button>` : ''}
              <button class="btn-edit-inline" data-id="${pwd.id}" title="Edit">Edit</button>
            </div>
          </div>
          
          <div class="password-item-row">
            <div class="input-compact">
              <input type="text" class="password-input-display" value="${pwd.login}" readonly title="Login: ${pwd.login}" />
              <button class="btn-copy-inline" data-login="${pwd.login}" title="Copy login">Copy</button>
            </div>

            <div class="input-compact">
              <input type="${passwordType}" class="password-input-display" value="${pwd.password}" data-id="${pwd.id}" readonly />
              <button class="btn-show-pwd-inline" data-id="${pwd.id}" data-password="${pwd.password}" title="Show/Hide">${this.settings.hideAllPasswords ? 'Show' : 'Hide'}</button>
              <button class="btn-copy-inline" data-password="${pwd.password}" title="Copy password">Copy</button>
            </div>
          </div>
        </div>
      `)
      .join('')
  }

  private filterPasswords(query: string): void {
    const items = this.container!.querySelectorAll('.password-item')
    items.forEach((item) => {
      const text = item.textContent!.toLowerCase()
      ;(item as HTMLElement).style.display = text.includes(query) ? 'flex' : 'none'
    })
  }

  private reorderPasswords(draggedItem: HTMLElement, draggedOverItem: HTMLElement): void {
    const draggedIndex = parseInt(draggedItem.getAttribute('data-index')!)
    const overIndex = parseInt(draggedOverItem.getAttribute('data-index')!)

    if (draggedIndex !== overIndex) {
      const [removed] = this.passwords.splice(draggedIndex, 1)
      this.passwords.splice(overIndex, 0, removed)

      storageService.reorderPasswords(this.passwords)
      this.refresh()
    }
  }

  private handleAddPassword(): void {
    const modal = createPasswordModal(null, {
      onSave: (password) => {
        storageService.addPassword(password)
        this.passwords = storageService.getPasswords()
        this.refresh()
        modal.remove()
      },
      onCancel: () => modal.remove()
    }, this.settings.hideAllPasswords)

    this.container!.appendChild(modal)
  }

  private handleEditPassword(id: string): void {
    const password = this.passwords.find((p) => p.id === id)
    if (!password) return

    const modal = createPasswordModal(password, {
      onSave: (updated) => {
        storageService.updatePassword(id, updated)
        this.passwords = storageService.getPasswords()
        this.refresh()
        modal.remove()
      },
      onCancel: () => modal.remove(),
      onDelete: async () => {
        const confirmed = await showConfirmDialog('Are you sure you want to delete this password?')
        if (confirmed) {
          storageService.deletePassword(id)
          this.passwords = storageService.getPasswords()
          this.refresh()
          modal.remove()
        }
      }
    }, this.settings.hideAllPasswords)

    this.container!.appendChild(modal)
  }

  private handleShowNote(id: string): void {
    const password = this.passwords.find((p) => p.id === id)
    if (!password || !password.note) return

    const modal = createNoteModal(password.note, () => {})
    this.container!.appendChild(modal)
  }

  private handleChangePassword(): void {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    overlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Change Master Password</h2>
          <button class="btn-close" aria-label="Close">&times;</button>
        </div>
        <div class="password-form">
          <div class="form-group">
            <label for="currentPassword">Current Master Password</label>
            <div class="password-input-group">
              <input type="password" id="currentPassword" class="input-field" placeholder="Enter current password" />
              <button type="button" class="btn-toggle" id="toggleCurrentPwd" title="Show/Hide">Show</button>
            </div>
          </div>
          <div class="form-group">
            <label for="newPassword">New Master Password</label>
            <div class="password-input-group">
              <input type="password" id="newPassword" class="input-field" placeholder="Enter new password (min 6 chars)" />
              <button type="button" class="btn-toggle" id="toggleNewPwd" title="Show/Hide">Show</button>
            </div>
          </div>
          <div class="form-group">
            <label for="confirmNewPassword">Confirm New Password</label>
            <div class="password-input-group">
              <input type="password" id="confirmNewPassword" class="input-field" placeholder="Confirm new password" />
              <button type="button" class="btn-toggle" id="toggleConfirmNewPwd" title="Show/Hide">Show</button>
            </div>
          </div>
          <div id="changePasswordError" class="login-error" style="display:none;"></div>
          <div class="modal-actions">
            <button class="btn-secondary" id="cancelChangeBtn">Cancel</button>
            <button class="btn-primary" id="submitChangeBtn">Change Password</button>
          </div>
        </div>
      </div>
    `

    const currentPasswordInput = overlay.querySelector('#currentPassword') as HTMLInputElement
    const newPasswordInput = overlay.querySelector('#newPassword') as HTMLInputElement
    const confirmNewPasswordInput = overlay.querySelector('#confirmNewPassword') as HTMLInputElement
    const toggleCurrentBtn = overlay.querySelector('#toggleCurrentPwd') as HTMLButtonElement
    const toggleNewBtn = overlay.querySelector('#toggleNewPwd') as HTMLButtonElement
    const toggleConfirmNewBtn = overlay.querySelector('#toggleConfirmNewPwd') as HTMLButtonElement
    const closeBtn = overlay.querySelector('.btn-close') as HTMLButtonElement
    const cancelBtn = overlay.querySelector('#cancelChangeBtn') as HTMLButtonElement
    const submitBtn = overlay.querySelector('#submitChangeBtn') as HTMLButtonElement
    const errorDiv = overlay.querySelector('#changePasswordError') as HTMLDivElement
    const modalContent = overlay.querySelector('.modal-content') as HTMLElement

    const showError = (message: string) => {
      errorDiv.textContent = message
      errorDiv.style.display = 'block'
    }

    const clearError = () => {
      errorDiv.textContent = ''
      errorDiv.style.display = 'none'
    }

    currentPasswordInput.addEventListener('input', clearError)
    newPasswordInput.addEventListener('input', clearError)
    confirmNewPasswordInput.addEventListener('input', clearError)

    toggleCurrentBtn.addEventListener('click', (e) => {
      e.preventDefault()
      if (currentPasswordInput.type === 'password') {
        currentPasswordInput.type = 'text'
        toggleCurrentBtn.textContent = 'Hide'
      } else {
        currentPasswordInput.type = 'password'
        toggleCurrentBtn.textContent = 'Show'
      }
    })

    toggleNewBtn.addEventListener('click', (e) => {
      e.preventDefault()
      if (newPasswordInput.type === 'password') {
        newPasswordInput.type = 'text'
        toggleNewBtn.textContent = 'Hide'
      } else {
        newPasswordInput.type = 'password'
        toggleNewBtn.textContent = 'Show'
      }
    })

    toggleConfirmNewBtn.addEventListener('click', (e) => {
      e.preventDefault()
      if (confirmNewPasswordInput.type === 'password') {
        confirmNewPasswordInput.type = 'text'
        toggleConfirmNewBtn.textContent = 'Hide'
      } else {
        confirmNewPasswordInput.type = 'password'
        toggleConfirmNewBtn.textContent = 'Show'
      }
    })

    const handleClose = () => {
      overlay.remove()
    }

    const handleSubmit = () => {
      const currentPassword = currentPasswordInput.value.trim()
      const newPassword = newPasswordInput.value.trim()
      const confirmNewPassword = confirmNewPasswordInput.value.trim()

      if (!currentPassword || !newPassword || !confirmNewPassword) {
        showError('Please fill in all fields')
        return
      }

      if (newPassword.length < 6) {
        showError('New password must be at least 6 characters')
        return
      }

      if (newPassword !== confirmNewPassword) {
        showError('New passwords do not match')
        return
      }

      encryptionService.setMasterKey(currentPassword)
      const currentHash = storageService.getMasterPasswordHash()
      if (!encryptionService.verifyMasterPassword(currentHash!)) {
        showError('Current password is incorrect')
        return
      }

      try {
        storageService.updateMasterPassword(newPassword)
        clearError()
        
        const notification = document.createElement('div')
        notification.className = 'notification'
        notification.textContent = 'Master password changed successfully!'
        document.body.appendChild(notification)
        
        setTimeout(() => {
          notification.remove()
          overlay.remove()
        }, 3000)
      } catch (error) {
        showError(error instanceof Error ? error.message : 'Failed to change password')
      }
    }

    closeBtn.addEventListener('click', handleClose)
    cancelBtn.addEventListener('click', handleClose)
    submitBtn.addEventListener('click', handleSubmit)

    modalContent.addEventListener('click', (e) => {
      e.stopPropagation()
    })

    this.container!.appendChild(overlay)
  }

  private copyToClipboard(text: string, label: string): void {
    navigator.clipboard.writeText(text).then(() => {
      const notification = document.createElement('div')
      notification.className = 'notification'
      notification.textContent = `${label} copied!`
      document.body.appendChild(notification)
      setTimeout(() => notification.remove(), 2000)
    })
  }

  private refresh(): void {
    const list = this.container!.querySelector('#passwordList') as HTMLDivElement
    list.innerHTML = this.renderPasswordList()
    this.attachPasswordItemListeners()
  }

  private updatePasswordVisibility(): void {
    const passwordInputs = this.container!.querySelectorAll('.password-input-display[data-id]') as NodeListOf<HTMLInputElement>
    const showButtons = this.container!.querySelectorAll('.btn-show-pwd-inline') as NodeListOf<HTMLElement>

    passwordInputs.forEach((input) => {
      input.type = this.settings.hideAllPasswords ? 'password' : 'text'
    })

    showButtons.forEach((btn) => {
      btn.textContent = this.settings.hideAllPasswords ? 'Show' : 'Hide'
    })
  }

  private attachPasswordItemListeners(): void {
    this.container!.querySelectorAll('.btn-show-pwd-inline').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const id = (e.target as HTMLElement).getAttribute('data-id')!
        const input = this.container!.querySelector(`.password-input-display[data-id="${id}"]`) as HTMLInputElement
        
        if (input.type === 'password') {
          input.type = 'text'
          ;(e.target as HTMLElement).textContent = 'Hide'
        } else {
          input.type = 'password'
          ;(e.target as HTMLElement).textContent = 'Show'
        }
      })
    })

    this.container!.querySelectorAll('.btn-copy-inline').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const target = e.target as HTMLElement
        const password = target.getAttribute('data-password')
        const login = target.getAttribute('data-login')
        
        if (password) {
          this.copyToClipboard(password, 'Password')
        } else if (login) {
          this.copyToClipboard(login, 'Login')
        }
      })
    })

    this.container!.querySelectorAll('.btn-edit-inline').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const id = (e.target as HTMLElement).getAttribute('data-id')!
        this.handleEditPassword(id)
      })
    })

    this.container!.querySelectorAll('.btn-note-inline').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const id = (e.target as HTMLElement).getAttribute('data-id')!
        this.handleShowNote(id)
      })
    })
  }

  private checkForUpdates(): void {
    if (typeof window !== 'undefined' && (window as any).electron?.ipcRenderer) {
      ;(window as any).electron.ipcRenderer.invoke('get-update-info').then((updateInfo: any) => {
        if (updateInfo.isUpdate) {
          const notification = this.container!.querySelector('#updateNotification') as HTMLDivElement
          const message = this.container!.querySelector('#updateMessage') as HTMLElement
          const closeBtn = this.container!.querySelector('#closeUpdateBtn') as HTMLButtonElement

          message.textContent = `✨ Updated from v${updateInfo.previousVersion}! All your passwords are safe. Enjoy the new features!`
          notification.classList.remove('hidden')

          closeBtn.addEventListener('click', () => {
            notification.classList.add('hidden')
          })
        }
      }).catch((_error: any) => {
        console.log('Update check skipped (non-Electron environment)')
      })
    }
  }
}
