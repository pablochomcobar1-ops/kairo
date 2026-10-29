import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest runs without globals, so Testing Library can't clean up on its own.
afterEach(() => cleanup());

// jsdom has no IntersectionObserver; scroll reveals only need it to exist.
class NoopIntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
globalThis.IntersectionObserver ??=
  NoopIntersectionObserver as unknown as typeof IntersectionObserver;

// jsdom has no layout, so scrolling an element into view does nothing
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}
