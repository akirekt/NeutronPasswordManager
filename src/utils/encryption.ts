import CryptoJS from 'crypto-js'

export class EncryptionService {
  private masterKey: string = ''
  private masterKeyHash: string = ''

  setMasterKey(key: string) {
    this.masterKey = key
    this.masterKeyHash = CryptoJS.SHA256(key).toString()
  }

  clearMasterKey() {
    this.masterKey = ''
    this.masterKeyHash = ''
  }

  encrypt(data: string): string {
    if (!this.masterKey) throw new Error('Master key not set')
    return CryptoJS.AES.encrypt(data, this.masterKey).toString()
  }

  decrypt(encryptedData: string): string {
    if (!this.masterKey) throw new Error('Master key not set')
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.masterKey).toString(CryptoJS.enc.Utf8)
      return decrypted
    } catch (e) {
      throw new Error('Decryption failed - wrong master password')
    }
  }

  verifyMasterPassword(hashedPassword: string): boolean {
    return this.masterKeyHash === hashedPassword
  }

  hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString()
  }
}

export const encryptionService = new EncryptionService()
