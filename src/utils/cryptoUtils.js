import CryptoJS from 'crypto-js';

// Fallback Crypto API for HTTP contexts (local network testing)
// Since window.crypto.subtle requires HTTPS, we use crypto-js for testing on local network IPs.

const getSharedSecret = (myId, peerId) => {
  // Create a consistent string regardless of who is sender/receiver
  const salt = process.env.EXPO_PUBLIC_E2EE_SALT || ':unicom_e2ee_salt';
  return [myId, peerId].sort().join(':') + salt;
};

export const encryptMessage = async (text, myId, peerId) => {
  if (!text) return text;
  try {
    const secret = getSharedSecret(myId, peerId);
    // Encrypt using AES
    const ciphertext = CryptoJS.AES.encrypt(text, secret).toString();
    // Prefix to identify it's crypto-js payload
    return 'CJS:' + ciphertext;
  } catch (err) {
    console.error('Encryption failed', err);
    return text; // fallback
  }
};

export const decryptMessage = async (encryptedPayload, myId, peerId) => {
  if (!encryptedPayload) return encryptedPayload;
  
  // Backwards compatibility with WebCrypto payloads if they exist
  if (!encryptedPayload.startsWith('CJS:')) {
    try {
      // If it's a plain text string that was never encrypted, JSON.parse will fail and fall through.
      const { iv, data } = JSON.parse(atob(encryptedPayload));
      // Can't decrypt old WebCrypto payloads in HTTP context without crypto.subtle, so we just return it.
      // If we are in HTTPS, we could fall back to WebCrypto here, but for local network this is fine.
      return encryptedPayload; 
    } catch(err) {
       // Just plain text
       return encryptedPayload;
    }
  }

  try {
    const secret = getSharedSecret(myId, peerId);
    const ciphertext = encryptedPayload.replace('CJS:', '');
    const bytes = CryptoJS.AES.decrypt(ciphertext, secret);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) return encryptedPayload;
    return decrypted;
  } catch (err) {
    console.error('Decryption failed', err);
    return encryptedPayload;
  }
};
