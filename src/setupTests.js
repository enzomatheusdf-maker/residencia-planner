// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// framer-motion usa IntersectionObserver para whileInView — jsdom não tem.
if (typeof global.IntersectionObserver === 'undefined') {
  global.IntersectionObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// ResizeObserver também pode ser necessário para hooks de scroll.
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
