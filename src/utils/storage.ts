import { encryptionService } from './encryption'

export interface Password {
  id: string
  website: string
  login: string
  password: string
  note?: string
  createdAt: number
}

interface StorageData {
  masterPasswordHash: string
  passwords: Array<{
    id: string
    website: string
    login: string
    password: string
    note?: string
    createdAt: number
  }>
}

export class StorageService {
  private storageKey = 'pm_data'

  initializeStorage(masterPassword: string): void {
    const hashedPassword = encryptionService.hashPassword(masterPassword)
    const data: StorageData = {
      masterPasswordHash: hashedPassword,
      passwords: []
    }
    localStorage.setItem(this.storageKey, JSON.stringify(data))
  }

  getMasterPasswordHash(): string | null {
    const data = this.getStorageData()
    return data?.masterPasswordHash || null
  }

  private getStorageData(): StorageData | null {
    const data = localStorage.getItem(this.storageKey)
    return data ? JSON.parse(data) : null
  }

  addPassword(password: Password): void {
    const data = this.getStorageData()
    if (!data) throw new Error('Storage not initialized')

    const encrypted = {
      ...password,
      website: encryptionService.encrypt(password.website),
      login: encryptionService.encrypt(password.login),
      password: encryptionService.encrypt(password.password),
      note: password.note ? encryptionService.encrypt(password.note) : undefined
    }

    data.passwords.push(encrypted)
    localStorage.setItem(this.storageKey, JSON.stringify(data))
  }

  getPasswords(): Password[] {
    const data = this.getStorageData()
    if (!data) return []

    return data.passwords.map(p => ({
      id: p.id,
      website: encryptionService.decrypt(p.website),
      login: encryptionService.decrypt(p.login),
      password: encryptionService.decrypt(p.password),
      note: p.note ? encryptionService.decrypt(p.note) : undefined,
      createdAt: p.createdAt
    }))
  }

  updatePassword(id: string, updates: Partial<Password>): void {
    const data = this.getStorageData()
    if (!data) throw new Error('Storage not initialized')

    const index = data.passwords.findIndex(p => p.id === id)
    if (index === -1) throw new Error('Password not found')

    const encrypted = {
      ...data.passwords[index],
      ...(updates.website && { website: encryptionService.encrypt(updates.website) }),
      ...(updates.login && { login: encryptionService.encrypt(updates.login) }),
      ...(updates.password && { password: encryptionService.encrypt(updates.password) }),
      ...(updates.note !== undefined && { note: updates.note ? encryptionService.encrypt(updates.note) : undefined })
    }

    data.passwords[index] = encrypted
    localStorage.setItem(this.storageKey, JSON.stringify(data))
  }

  deletePassword(id: string): void {
    const data = this.getStorageData()
    if (!data) throw new Error('Storage not initialized')

    data.passwords = data.passwords.filter(p => p.id !== id)
    localStorage.setItem(this.storageKey, JSON.stringify(data))
  }

  reorderPasswords(passwords: Password[]): void {
    const data = this.getStorageData()
    if (!data) throw new Error('Storage not initialized')

    const encrypted = passwords.map(p => {
      const existing = data!.passwords.find(ep => ep.id === p.id)
      return existing || {
        id: p.id,
        website: encryptionService.encrypt(p.website),
        login: encryptionService.encrypt(p.login),
        password: encryptionService.encrypt(p.password),
        note: p.note ? encryptionService.encrypt(p.note) : undefined,
        createdAt: p.createdAt
      }
    })

    data.passwords = encrypted
    localStorage.setItem(this.storageKey, JSON.stringify(data))
  }

  clear(): void {
    localStorage.removeItem(this.storageKey)
  }

  updateMasterPassword(newPassword: string): void {
    const data = this.getStorageData()
    if (!data) throw new Error('Storage not initialized')

    try {
      // Decrypt all passwords with the current (old) master key first
      const decrypted = data.passwords.map(p => {
        const website = encryptionService.decrypt(p.website)
        const login = encryptionService.decrypt(p.login)
        const password = encryptionService.decrypt(p.password)
        const note = p.note ? encryptionService.decrypt(p.note) : undefined
        
        // Validate that decryption produced non-empty values
        if (!website || !login || !password) {
          throw new Error('Failed to decrypt passwords with current master password')
        }
        
        return { id: p.id, website, login, password, note, createdAt: p.createdAt }
      })

      // Switch to new master key
      encryptionService.setMasterKey(newPassword)

      // Re-encrypt all passwords with the new master key
      const reencrypted = decrypted.map(p => ({
        id: p.id,
        website: encryptionService.encrypt(p.website),
        login: encryptionService.encrypt(p.login),
        password: encryptionService.encrypt(p.password),
        note: p.note ? encryptionService.encrypt(p.note) : undefined,
        createdAt: p.createdAt
      }))

      const hashedPassword = encryptionService.hashPassword(newPassword)
      data.masterPasswordHash = hashedPassword
      data.passwords = reencrypted
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      throw new Error(`Password change failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

export const storageService = new StorageService()
