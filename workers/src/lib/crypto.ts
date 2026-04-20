// Web Crypto API replacements for CryptoJS (which doesn't work in Workers)

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes.buffer;
}

export async function encryptToken(token: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key.slice(0, 32).padEnd(32, '0')),
    'AES-GCM',
    false,
    ['encrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, keyData, encoder.encode(token));
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

export async function decryptToken(encryptedToken: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const combined = Uint8Array.from(atob(encryptedToken), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const keyData = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key.slice(0, 32).padEnd(32, '0')),
    'AES-GCM',
    false,
    ['decrypt']
  );
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, keyData, data);
  return new TextDecoder().decode(decrypted);
}

// Replaces crypto.createHmac for Razorpay webhook verification
export async function verifyHmacSha256(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  );
  return crypto.subtle.verify('HMAC', key, hexToBuffer(signature), encoder.encode(payload));
}
