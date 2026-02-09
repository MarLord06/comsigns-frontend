/**
 * Test 02: Cambio entre Modos de la Aplicación
 * 
 * OBJETIVO:
 * Verificar que el usuario puede navegar entre los 4 modos de la aplicación
 * (video, expert, sample, camera) y que cada modo muestra su contenido correcto.
 * 
 * SUPOSICIONES:
 * - Navegación por estado interno (sin router)
 * - Cada modo tiene un título y componente distintivo
 * - Solo un modo puede estar activo a la vez
 */

describe('02 - Cambio entre Modos', () => {
  beforeEach(() => {
    cy.visit('/');
    // Esperar que la app cargue completamente
    cy.contains('h1', 'COMSIGNS').should('be.visible');
  });

  it('debe cambiar al modo "Sistema Experto"', () => {
    // Click en el botón Sistema Experto
    cy.contains('.mode-btn', 'Sistema Experto').click();
    
    // Verificar que el botón está activo
    cy.contains('.mode-btn', 'Sistema Experto').should('have.class', 'active');
    
    // Verificar que Traducir Video ya no está activo
    cy.contains('.mode-btn', 'Traducir Video').should('not.have.class', 'active');
    
    // Verificar contenido del ExpertPanel
    cy.get('.expert-panel').should('be.visible');
    cy.contains('h2', '📹 Video Input').should('be.visible');
    cy.contains('Sube uno o varios samples de señas (.pkl) para evaluación').should('be.visible');
  });

  it('debe cambiar al modo "Inferir Sample"', () => {
    cy.contains('.mode-btn', 'Inferir Sample').click();
    
    cy.contains('.mode-btn', 'Inferir Sample').should('have.class', 'active');
    
    // Verificar contenido del SampleUploader
    cy.contains('h2', '📦 Inferir Sample').should('be.visible');
    cy.contains('Sube un archivo .pkl con features extraídos').should('be.visible');
    cy.get('.sample-uploader').should('be.visible');
  });

  it('debe cambiar al modo "Cámara en Vivo"', () => {
    cy.contains('.mode-btn', 'Cámara en Vivo').click();
    
    cy.contains('.mode-btn', 'Cámara en Vivo').should('have.class', 'active');
    
    // Verificar contenido del CameraCapture
    cy.contains('h2', '📹 Vista de Cámara').should('be.visible');
    cy.contains('Captura en tiempo real a 10 FPS').should('be.visible');
    cy.get('.camera-capture').should('be.visible');
  });

  it('debe volver al modo "Traducir Video"', () => {
    // Primero cambiar a otro modo
    cy.contains('.mode-btn', 'Sistema Experto').click();
    cy.get('.expert-panel').should('be.visible');
    
    // Volver a Traducir Video
    cy.contains('.mode-btn', 'Traducir Video').click();
    
    cy.contains('.mode-btn', 'Traducir Video').should('have.class', 'active');
    cy.get('.video-translator').should('be.visible');
    cy.contains('h2', '🔮 Traducir Videos').should('be.visible');
  });

  it('debe mantener solo un modo activo a la vez', () => {
    // Cambiar entre varios modos rápidamente
    cy.contains('.mode-btn', 'Sistema Experto').click();
    cy.contains('.mode-btn', 'Inferir Sample').click();
    cy.contains('.mode-btn', 'Cámara en Vivo').click();
    
    // Verificar que solo Cámara en Vivo está activo
    cy.get('.mode-btn.active').should('have.length', 1);
    cy.contains('.mode-btn.active', 'Cámara en Vivo').should('exist');
  });

  it('debe ocultar el contenido del modo anterior al cambiar', () => {
    // Verificar que VideoTranslator está visible
    cy.get('.video-translator').should('be.visible');
    
    // Cambiar a Sistema Experto
    cy.contains('.mode-btn', 'Sistema Experto').click();
    
    // VideoTranslator debe desaparecer
    cy.get('.video-translator').should('not.exist');
    
    // ExpertPanel debe aparecer
    cy.get('.expert-panel').should('be.visible');
  });
});
