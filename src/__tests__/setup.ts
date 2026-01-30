import "@testing-library/jest-dom";

// Polyfill for pointer capture APIs that jsdom doesn't implement
// This is needed for Radix UI components that use pointer events
if (typeof Element !== "undefined" && !Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false);
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
}

// Polyfill for scrollIntoView that jsdom doesn't implement
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
}