import './style.css'
import { createLoginPage } from './ui/login'
import { PasswordManager } from './ui/passwordManager'
import { encryptionService } from './utils/index'

const app = document.querySelector('#app')!

export function logout() {
  encryptionService.clearMasterKey()
  window.location.reload()
}

function showLoginPage() {
  app.innerHTML = ''
  const loginPage = createLoginPage((masterPassword) => {
    encryptionService.setMasterKey(masterPassword)
    showPasswordManager()
  })
  app.appendChild(loginPage)
}

function showPasswordManager() {
  app.innerHTML = ''
  const manager = new PasswordManager()
  app.appendChild(manager.create())
}

showLoginPage()