import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    // @ts-ignore - window may not exist in all environments
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.frameworkReady?.();
    }
  });
}

