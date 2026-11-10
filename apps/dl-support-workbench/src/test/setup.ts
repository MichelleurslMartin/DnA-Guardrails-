import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

vi.mock('@fluentui/react-icons/lib/providers', () => ({
  IconDirectionContextProvider: ({ children }: { children: React.ReactNode }) => children,
  useIconContext: () => ({ iconDirection: 'ltr' }),
}));

class ResizeObserverMock implements ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

function mediaQueryList(query: string): MediaQueryList {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  };
}

beforeEach(() => {
  window.matchMedia = vi.fn((query: string) => mediaQueryList(query));
});

afterEach(() => {
  cleanup();
});