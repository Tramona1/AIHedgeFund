// Fix for NodeJS.Timer compatibility issues

declare global {
  namespace NodeJS {
    interface Timer {
      [Symbol.dispose](): void;
    }
    
    interface Timeout extends Timer {
      // Ensure compatibility between Timeout and Timer
    }
  }
}

export {}; 