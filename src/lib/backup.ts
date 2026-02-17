import type { Note } from './db'

type PlainBackup = {
  version: 1
  exportedAt: string
  notes: Note[]
}

type EncryptedBackup = {
  version: 1
  encrypted: true
  exportedAt: string
  payload: string
  iv: string
  salt: string
}

const ITERATIONS = 240_000

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

function toBase64(buffer: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < buffer.length; i += 1) binary += String.fromCharCode(buffer[i])
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: toArrayBuffer(salt),
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt'],
  )
}

export function exportPlainBackup(notes: Note[]): string {
  const payload: PlainBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    notes,
  }
  return JSON.stringify(payload, null, 2)
}

export async function exportEncryptedBackup(notes: Note[], password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)

  const plain = new TextEncoder().encode(exportPlainBackup(notes))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(plain),
  )

  const payload: EncryptedBackup = {
    version: 1,
    encrypted: true,
    exportedAt: new Date().toISOString(),
    payload: toBase64(new Uint8Array(encrypted)),
    iv: toBase64(iv),
    salt: toBase64(salt),
  }

  return JSON.stringify(payload, null, 2)
}

function isPlainBackup(data: unknown): data is PlainBackup {
  return Boolean(
    data &&
      typeof data === 'object' &&
      (data as PlainBackup).version === 1 &&
      Array.isArray((data as PlainBackup).notes),
  )
}

function isEncryptedBackup(data: unknown): data is EncryptedBackup {
  return Boolean(
    data &&
      typeof data === 'object' &&
      (data as EncryptedBackup).version === 1 &&
      (data as EncryptedBackup).encrypted === true &&
      typeof (data as EncryptedBackup).payload === 'string' &&
      typeof (data as EncryptedBackup).iv === 'string' &&
      typeof (data as EncryptedBackup).salt === 'string',
  )
}

export async function importBackup(text: string, password?: string): Promise<Note[]> {
  const parsed = JSON.parse(text) as unknown

  if (isPlainBackup(parsed)) {
    return parsed.notes
  }

  if (isEncryptedBackup(parsed)) {
    if (!password) {
      throw new Error('PASSWORD_REQUIRED')
    }

    const key = await deriveKey(password, fromBase64(parsed.salt))
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(fromBase64(parsed.iv)) },
      key,
      toArrayBuffer(fromBase64(parsed.payload)),
    )
    const decoded = new TextDecoder().decode(decrypted)
    const plainParsed = JSON.parse(decoded) as unknown

    if (!isPlainBackup(plainParsed)) {
      throw new Error('INVALID_BACKUP_FORMAT')
    }

    return plainParsed.notes
  }

  throw new Error('INVALID_BACKUP_FORMAT')
}
