// lib/utils.ts
/**
 * Generate a simple UUID alternative that doesn't rely on crypto.getRandomValues()
 * Note: This is not as random or secure as the standard UUID v4, but works for our purposes
 */
export function generateSimpleId(length: number = 10): string {
    const timestamp = new Date().getTime().toString();
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    // Use the current timestamp as part of the ID for uniqueness
    result += timestamp.substring(timestamp.length - 6);
    
    // Add random characters
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  }