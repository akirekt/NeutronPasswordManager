import { encryptionService, storageService } from '../utils/index'

export function createLoginPage(onLoginSuccess: (masterPassword: string) => void): HTMLDivElement {
  const container = document.createElement('div')
  container.className = 'login-page dark'

  const existingHash = storageService.getMasterPasswordHash()

  container.innerHTML = `
    <div class="Neutron-logo-text">
      <span class="Neutron-logo-text-line1">Neutron</span>
      <span class="Neutron-logo-text-line2">Password</span>
      <span class="Neutron-logo-text-line3">Manager</span>
    </div> 
    <div class="login-container">
      <p class="login-subtitle">${existingHash ? 'Welcome Back' : 'Create Master Password'}</p>
      
      <div class="login-form">
        <input
          type="password"
          id="masterPassword"
          class="input-field"
          placeholder="${existingHash ? 'Enter Master Password' : 'Create Master Password (min 6 chars)'}"
          autocomplete="off"
        />
        ${!existingHash ? `
          <input
            type="password"
            id="confirmPassword"
            class="input-field"
            placeholder="Confirm Master Password"
            autocomplete="off"
          />
        ` : ''}
        <div id="loginError" class="login-error" style="display:none;"></div>
        <button id="loginBtn" class="btn-primary" type="button">
          ${existingHash ? 'Login' : 'Create Account'}
        </button>
      </div>
    </div>
  `

  const passwordInput = container.querySelector('#masterPassword') as HTMLInputElement
  const confirmInput = container.querySelector('#confirmPassword') as HTMLInputElement
  const loginBtn = container.querySelector('#loginBtn') as HTMLButtonElement
  const errorDiv = container.querySelector('#loginError') as HTMLDivElement

  const showError = (message: string) => {
    errorDiv.textContent = message
    errorDiv.style.display = 'block'
  }

  const clearError = () => {
    errorDiv.textContent = ''
    errorDiv.style.display = 'none'
  }

  passwordInput.addEventListener('input', clearError)
  confirmInput?.addEventListener('input', clearError)

  const handleLogin = () => {
    const password = passwordInput.value.trim()

    if (!password) {
      showError('Please enter a password')
      passwordInput.focus()
      return
    }

    if (existingHash) {
      encryptionService.setMasterKey(password)
      if (!encryptionService.verifyMasterPassword(existingHash)) {
        showError('Incorrect master password')
        passwordInput.value = ''
        passwordInput.focus()
        return
      }
      clearError()
      onLoginSuccess(password)
    } else {
      const confirmVal = confirmInput?.value.trim()
      if (password.length < 6) {
        showError('Master password must be at least 6 characters')
        passwordInput.focus()
        return
      }
      if (password !== confirmVal) {
        showError('Passwords do not match')
        passwordInput.value = ''
        confirmInput.value = ''
        passwordInput.focus()
        return
      }
      clearError()
      encryptionService.setMasterKey(password)
      storageService.initializeStorage(password)
      onLoginSuccess(password)
    }
  }

  loginBtn.addEventListener('click', handleLogin)
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleLogin()
    }
  })
  confirmInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleLogin()
    }
  })

  return container
}
