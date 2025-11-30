describe("Flujo completo de registro, login y citas", () => {
  const email = `test${Date.now()}@correo.com`;
  const password = "password123";

  it("Registra usuario, inicia sesión y crea una cita", () => {
    cy.visit("/");

    // Cambiar a pestaña registro
    cy.get("#tab-register").click();

    // Registro
    cy.get("#register-name-input").type("Usuario de Prueba");
    cy.get("#register-email-input").type(email);
    cy.get("#register-password-input").type(password);
    cy.get("#register-submit-btn").click();

    cy.get("[data-testid='register-message']")
      .should("contain", "Usuario creado correctamente");

    // Ir a login
    cy.get("#switchToLogin").click();

    // Login
    cy.get("#login-email-input").type(email);
    cy.get("#login-password-input").type(password);
    cy.get("#login-submit-btn").click();

    // Dashboard visible
    cy.get("[data-testid='dashboard']").should("exist");
    cy.get("#currentUserName").should("contain", "Usuario de Prueba");

    // Ir a sección de citas
    cy.get("#nav-dashboard-appointments").click();

    // No hay citas
    cy.get("[data-testid='empty-appointments-message']").should("be.visible");

    // Crear cita
    cy.get("[data-testid='add-appointment-btn']").click();
    cy.get("[data-testid='appointment-modal']").should("be.visible");

    cy.get("#appointment-date-input").type("2025-01-01");
    cy.get("#appointment-time-input").type("10:30");
    cy.get("#appointment-service-input").type("Corte de cabello");
    cy.get("#appointment-client-input").type("Juan Pérez");
    cy.get("#appointment-status-select").select("confirmada");
    cy.get("[data-testid='appointment-save-btn']").click();

    // Debe aparecer en la tabla
    cy.get("[data-testid='appointments-tbody']")
      .find("[data-testid='appointment-row']")
      .should("have.length", 1)
      .first()
      .within(() => {
        cy.contains("Corte de cabello");
        cy.contains("Juan Pérez");
        cy.get("[data-testid='appointment-status']").should(
          "contain",
          "Confirmada"
        );
      });
  });
});
