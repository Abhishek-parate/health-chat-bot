/**
 * UUID Helper for React Native
 * 
 * This provides a React Native compatible UUID generator
 * that doesn't rely on crypto.getRandomValues()
 */

// Simple UUID generator that works in React Native environments
export function generateUUID(): string {
    // Use a timestamp + random combination
    const timestamp = new Date().getTime().toString(16);
    
    // Generate random sections
    const getRandomSection = (length: number) => {
      let result = '';
      const characters = 'abcdef0123456789';
      for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    };
    
    // Format in UUID v4 structure
    return [
      timestamp.substring(0, 8),
      getRandomSection(4),
      // Add the UUID version (4xxx where x is random)
      '4' + getRandomSection(3),
      // Add the variant (8, 9, a, or b followed by 3 random chars)
      (Math.floor(Math.random() * 4) + 8).toString(16) + getRandomSection(3),
      getRandomSection(12)
    ].join('-');
  }
  
  // Use this instead of importing v4 from uuid
  export const v4 = generateUUID;