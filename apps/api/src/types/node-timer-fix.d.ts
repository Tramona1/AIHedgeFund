// Fix for NodeJS.Timer compatibility issues
import * as NodeJS from 'node:timers';

declare module 'node:timers' {
  interface Timer {
    [Symbol.dispose](): void;
  }
}

export {}; 