import { Context } from 'hono';

declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
    userEmail: string;
    metric: { headers: string[]; timers: Map<string, any> };
  }
} 