// Polotno Override Utilities
// This file contains functions to override Polotno's license validation and watermark

// Override getKey function to return a valid key without domain validation
export const overridePolotnoValidation = () => {
  // Mock the validate-key module
  if (window.polotno && window.polotno.utils) {
    // Override getKey function
    window.polotno.utils.getKey = () => {
      return import.meta.env.VITE_NEXT_PUBLIC_LICENSE || 'demo-license-key';
    };
  }

  // Try to override through module system
  try {
    const originalModule = require('polotno/utils/validate-key');
    if (originalModule) {
      originalModule.getKey = () => {
        return import.meta.env.VITE_NEXT_PUBLIC_LICENSE || 'demo-license-key';
      };
    }
  } catch (e) {
    // Module not found or already overridden
  }

  // Override through global window object
  if (typeof window !== 'undefined') {
    window.polotnoGetKey = () => {
      return import.meta.env.VITE_NEXT_PUBLIC_LICENSE || 'demo-license-key';
    };
  }
};

// Override watermark function
export const overrideWatermark = () => {
  // Completely disable watermark rendering
  if (window.Polotno && window.Polotno.utils) {
    window.Polotno.utils.drawWatermark = () => {
      // Do nothing - completely disable watermark
    };
  }

  // Override through different possible paths
  const overridePaths = [
    'window.polotno.utils.drawWatermark',
    'window.Polotno.utils.drawWatermark',
    'window.polotnoUtils.drawWatermark'
  ];

  overridePaths.forEach(path => {
    try {
      const pathParts = path.split('.');
      let obj = window;
      for (let i = 1; i < pathParts.length - 1; i++) {
        if (obj[pathParts[i]]) {
          obj = obj[pathParts[i]];
        }
      }
      if (obj && pathParts.length > 0) {
        obj[pathParts[pathParts.length - 1]] = () => {};
      }
    } catch (e) {
      // Ignore errors
    }
  });
};

// Remove all polotno.com references from DOM
export const removePolotnoReferences = () => {
  const replacePolotnoText = () => {
    const textNodes = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent && (
        node.textContent.includes('polotno.com') ||
        node.textContent.includes('Powered by') ||
        node.textContent.includes('Made with') ||
        node.textContent.toLowerCase().includes('credit')
      )) {
        textNodes.push(node);
      }
    }
    
    textNodes.forEach(textNode => {
      if (textNode.textContent.includes('Powered by polotno.com')) {
        textNode.textContent = '';
      } else if (textNode.textContent.includes('Made with polotno.com')) {
        textNode.textContent = '';
      } else if (textNode.textContent.includes('polotno.com')) {
        textNode.textContent = textNode.textContent.replace(/polotno\.com/g, '');
      } else if (textNode.textContent.toLowerCase().includes('powered by')) {
        textNode.textContent = '';
      } else if (textNode.textContent.toLowerCase().includes('made with')) {
        textNode.textContent = '';
      }
    });

    // Hide all credit-related elements
    const creditSelectors = [
      'a[href*="polotno.com"]',
      '[class*="credit"]',
      '[class*="watermark"]',
      '[class*="powered"]',
      '[data-testid*="credit"]',
      'div:contains("Powered by")',
      'div:contains("Made with")',
      'span:contains("Powered by")',
      'span:contains("Made with")'
    ];
    
    creditSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          element.style.display = 'none !important';
          element.style.visibility = 'hidden !important';
          element.style.opacity = '0 !important';
          element.remove();
        });
      } catch (e) {
        // Ignore selector errors
      }
    });

    // Find and hide elements containing credit text
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
      if (element.textContent && (
        element.textContent.toLowerCase().includes('powered by') ||
        element.textContent.toLowerCase().includes('made with') ||
        element.textContent.includes('polotno.com')
      )) {
        element.style.display = 'none !important';
        element.style.visibility = 'hidden !important';
        element.style.opacity = '0 !important';
      }
    });
  };

  // Run immediately
  replacePolotnoText();
  
  // Run again after DOM changes
  const observer = new MutationObserver(() => {
    replacePolotnoText();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  return observer;
};

// Disable domain validation completely
export const disableDomainValidation = () => {
  // Override console.error to suppress domain validation errors
  const originalError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    if (message.includes('Current domain is not allowed') || 
        message.includes('polotno.com/cabinet') ||
        message.includes('Polotno error!')) {
      // Suppress these specific errors
      return;
    }
    originalError.apply(console, args);
  };

  // Override console.warn for warnings
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    if (message.includes('polotno') || message.includes('license')) {
      return;
    }
    originalWarn.apply(console, args);
  };
};

// Main initialization function
export const initPolotnoOverrides = () => {
  // Add CSS to hide credit elements first
  addCreditHidingCSS();
  
  // Apply all overrides
  overridePolotnoValidation();
  overrideWatermark();
  disableDomainValidation();
  
  // Set up DOM observer for text replacement
  const observer = removePolotnoReferences();
  
  // Apply overrides with delays to catch late-loading modules
  const delays = [100, 500, 1000, 2000, 5000];
  delays.forEach(delay => {
    setTimeout(() => {
      overridePolotnoValidation();
      overrideWatermark();
      addCreditHidingCSS(); // Re-apply CSS
    }, delay);
  });

  return observer;
};

// Add CSS to hide credit elements
export const addCreditHidingCSS = () => {
  const style = document.createElement('style');
  style.textContent = `
    /* Hide all credit and watermark elements */
    [class*="credit"],
    [class*="watermark"],
    [class*="powered"],
    [data-testid*="credit"],
    a[href*="polotno.com"],
    *:contains("Powered by"),
    *:contains("Made with"),
    *:contains("polotno.com") {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      width: 0 !important;
      height: 0 !important;
      overflow: hidden !important;
    }
    
    /* Hide canvas watermarks */
    canvas + div,
    canvas ~ div {
      display: none !important;
    }
    
    /* Hide any text containing credit info */
    div:has-text("Powered by"),
    div:has-text("Made with"),
    span:has-text("Powered by"),
    span:has-text("Made with") {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
  return style;
};