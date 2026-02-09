// ***********************************************************
// Cypress E2E Support File
// ***********************************************************

// Import commands.js
import './commands';

// Global before each hook
beforeEach(() => {
  // Clear any previous state
  cy.window().then((win) => {
    win.sessionStorage.clear();
    win.localStorage.clear();
  });
});

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on WebSocket errors or other uncaught exceptions
  if (err.message.includes('WebSocket') || err.message.includes('ResizeObserver')) {
    return false;
  }
  return true;
});
