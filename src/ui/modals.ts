import { Password } from '../utils/storage'

export interface ModalCallbacks {
  onSave: (data: Password) => void
  onCancel: () => void
  onDelete?: () => void
}

export function createPasswordModal(
  password: Password | null,
  callbacks: ModalCallbacks,
  hideAllPasswords: boolean = false
): HTMLDivElement {
  const container = document.createElement('div')
  container.className = 'modal-overlay'

  const isEdit = !!password
  const passwordFieldType = hideAllPasswords ? 'password' : 'text'
  const toggleButtonText = hideAllPasswords ? 'Show' : 'Hide'

  container.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${isEdit ? 'Edit Password' : 'Add New Password'}</h2>
        <button class="btn-close" aria-label="Close">&times;</button>
      </div>
      
      <form id="passwordForm" class="password-form">
        <div class="form-group">
          <label for="website">Website/Service *</label>
          <input
            type="text"
            id="website"
            class="input-field"
            placeholder="e.g., Gmail, Facebook"
            value="${password?.website || ''}"
            required
          />
        </div>

        <div class="form-group">
          <label for="login">Login/Email *</label>
          <input
            type="text"
            id="login"
            class="input-field"
            placeholder="your@email.com or username"
            value="${password?.login || ''}"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password *</label>
          <div class="password-input-group">
            <input
              type="${passwordFieldType}"
              id="password"
              class="input-field"
              placeholder="Enter password"
              value="${password?.password || ''}"
              required
            />
            <button type="button" id="togglePassword" class="btn-toggle" title="Show/Hide">${toggleButtonText}</button>
          </div>
        </div>

        <div class="form-group">
          <label for="note">Note (Optional)</label>
          <textarea
            id="note"
            class="input-field"
            placeholder="Add a note..."
            rows="3"
          >${password?.note || ''}</textarea>
        </div>

        <div class="modal-actions">
          <button type="button" id="cancelBtn" class="btn-secondary">Cancel</button>
          ${isEdit ? `<button type="button" id="deleteBtn" class="btn-danger">Delete</button>` : ''}
          <button type="submit" class="btn-primary">
            ${isEdit ? 'Update' : 'Add'} Password
          </button>
        </div>
      </form>
    </div>
  `

  const form = container.querySelector('#passwordForm') as HTMLFormElement
  const closeBtn = container.querySelector('.btn-close') as HTMLButtonElement
  const cancelBtn = container.querySelector('#cancelBtn') as HTMLButtonElement
  const deleteBtn = container.querySelector('#deleteBtn') as HTMLButtonElement | null
  const togglePasswordBtn = container.querySelector('#togglePassword') as HTMLButtonElement
  const passwordInput = container.querySelector('#password') as HTMLInputElement
  const modalContent = container.querySelector('.modal-content') as HTMLElement

  const handleClose = () => callbacks.onCancel()

  closeBtn.addEventListener('click', handleClose)
  cancelBtn.addEventListener('click', handleClose)

  if (deleteBtn) {
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      if (callbacks.onDelete) {
        callbacks.onDelete()
        container.remove()
      }
    })
  }

  togglePasswordBtn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text'
      togglePasswordBtn.textContent = 'Hide'
    } else {
      passwordInput.type = 'password'
      togglePasswordBtn.textContent = 'Show'
    }
  })

  modalContent.addEventListener('click', (e) => {
    e.stopPropagation()
  })

  form.addEventListener('submit', (e) => {
    e.preventDefault()

    const website = (form.querySelector('#website') as HTMLInputElement).value.trim()
    const login = (form.querySelector('#login') as HTMLInputElement).value.trim()
    const passwordValue = (form.querySelector('#password') as HTMLInputElement).value.trim()
    const note = (form.querySelector('#note') as HTMLTextAreaElement).value.trim()

    if (!website || !login || !passwordValue) {
      alert('Please fill in all required fields')
      return
    }

    const newPassword: Password = {
      id: password?.id || Date.now().toString(),
      website,
      login,
      password: passwordValue,
      note: note || undefined,
      createdAt: password?.createdAt || Date.now()
    }

    callbacks.onSave(newPassword)
  })

  return container
}

export function createNoteModal(note: string, onClose: () => void): HTMLDivElement {
  const container = document.createElement('div')
  container.className = 'modal-overlay'

  container.innerHTML = `
    <div class="modal-content modal-note">
      <div class="modal-header">
        <h2>Note</h2>
        <button class="btn-close" aria-label="Close">&times;</button>
      </div>
      <div class="note-content">
        ${note.split('\n').map(line => `<p>${line || '<br/>'}</p>`).join('')}
      </div>
      <div class="modal-actions">
        <button id="closeBtn" class="btn-primary">Close</button>
      </div>
    </div>
  `

  const closeBtn = container.querySelector('.btn-close') as HTMLButtonElement
  const btn = container.querySelector('#closeBtn') as HTMLButtonElement
  const modalContent = container.querySelector('.modal-content') as HTMLElement

  const handleClose = () => {
    container.remove()
    onClose()
  }

  closeBtn.addEventListener('click', handleClose)
  btn.addEventListener('click', handleClose)

  modalContent.addEventListener('click', (e) => {
    e.stopPropagation()
  })

  return container
}

export function showConfirmDialog(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    
    const modal = document.createElement('div')
    modal.className = 'modal-content'
    modal.style.maxWidth = '300px'
    
    modal.innerHTML = `
      <div class="modal-header">
        <h2>Confirm</h2>
      </div>
      <div style="padding: 20px; text-align: center; font-size: 14px;">
        ${message}
      </div>
      <div class="modal-actions">
        <button id="cancelBtn" class="btn-secondary">Cancel</button>
        <button id="confirmBtn" class="btn-primary">Yes</button>
      </div>
    `
    
    overlay.appendChild(modal)
    document.body.appendChild(overlay)
    
    const cancelBtn = modal.querySelector('#cancelBtn') as HTMLButtonElement
    const confirmBtn = modal.querySelector('#confirmBtn') as HTMLButtonElement
    
    const cleanup = () => overlay.remove()
    
    cancelBtn.addEventListener('click', () => {
      cleanup()
      resolve(false)
    })
    
    confirmBtn.addEventListener('click', () => {
      cleanup()
      resolve(true)
    })

    modal.addEventListener('click', (e) => {
      e.stopPropagation()
    })

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup()
        resolve(false)
      }
    })
  })
}
