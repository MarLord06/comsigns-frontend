// ***********************************************************
// Custom Cypress Commands for Comsigns
// ***********************************************************

/**
 * Command to switch between application modes
 * @param {string} mode - 'video' | 'expert' | 'sample' | 'camera'
 */
Cypress.Commands.add('switchMode', (mode) => {
  const modeMap = {
    video: 'Traducir Video',
    expert: 'Sistema Experto',
    sample: 'Inferir Sample',
    camera: 'Cámara en Vivo',
  };

  const buttonText = modeMap[mode];
  if (!buttonText) {
    throw new Error(`Invalid mode: ${mode}. Valid modes: video, expert, sample, camera`);
  }

  cy.contains('.mode-btn', buttonText).click();
  cy.contains('.mode-btn.active', buttonText).should('exist');
});

/**
 * Command to wait for inference to complete
 * Uses increased timeout for ML inference
 */
Cypress.Commands.add('waitForInference', (timeout = 60000) => {
  // Wait for loading to appear and then disappear
  cy.get('.spinner, .loading-indicator', { timeout: 5000 }).should('exist');
  cy.get('.spinner, .loading-indicator', { timeout }).should('not.exist');
});

/**
 * Command to verify no loading state is present
 */
Cypress.Commands.add('assertNotLoading', () => {
  cy.get('.spinner').should('not.exist');
  cy.get('.loading-indicator').should('not.exist');
  cy.contains('Procesando').should('not.exist');
});

/**
 * Command to verify error toast is shown
 */
Cypress.Commands.add('assertErrorToast', (expectedMessage = null) => {
  cy.get('.error-toast, .error-message').should('be.visible');
  if (expectedMessage) {
    cy.get('.error-toast, .error-message').should('contain.text', expectedMessage);
  }
});

/**
 * Command to close error toast
 */
Cypress.Commands.add('closeErrorToast', () => {
  cy.get('.error-toast .close-btn, .error-toast button').click();
  cy.get('.error-toast').should('not.exist');
});

/**
 * Command to upload a file via input
 * @param {string} selector - Input selector
 * @param {string} fixturePath - Path to fixture file
 */
Cypress.Commands.add('uploadFile', (selector, fixturePath) => {
  cy.get(selector).selectFile(fixturePath, { force: true });
});

/**
 * Command to verify the app header is loaded
 */
Cypress.Commands.add('assertAppLoaded', () => {
  cy.contains('h1', 'COMSIGNS').should('be.visible');
  cy.contains('Traducción de Lengua de Señas en Tiempo Real').should('be.visible');
  cy.get('.mode-toggle').should('be.visible');
  cy.get('.mode-btn').should('have.length', 4);
});
