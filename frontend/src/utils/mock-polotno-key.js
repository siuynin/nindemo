// Mock Polotno getKey function to bypass license validation
// This file provides a replacement for polotno/utils/validate-key

// Mock getKey function that always returns a valid key
export const getKey = () => {
  return import.meta.env.VITE_NEXT_PUBLIC_LICENSE || 'demo-license-key-12345-67890-ABCDE-FGHIJ-KLMNO';
};

// Mock validation function that always returns true
export const validateKey = (key) => {
  return true;
};

// Mock domain validation that always passes
export const validateDomain = (domain) => {
  return true;
};

// Export default as getKey for compatibility
export default getKey;

// Initialize mock overrides
export const initMockKey = () => {
  // Override global getKey if it exists
  if (typeof window !== 'undefined') {
    window.polotnoGetKey = getKey;
    
    // Try to override the module if it's already loaded
    try {
      if (window.polotno && window.polotno.utils) {
        window.polotno.utils.getKey = getKey;
        window.polotno.utils.validateKey = validateKey;
        window.polotno.utils.validateDomain = validateDomain;
      }
    } catch (e) {
      console.log('Polotno utils not yet available, will retry...');
    }
  }
};