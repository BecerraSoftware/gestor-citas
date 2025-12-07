describe("Flujos de registro, login y gestión de citas", () => {
  const passwordValida = "password123"; // >= 8 caracteres
  const passwordCorta = "1234567";      // < 8 caracteres

  const createUniqueEmail = () =>
    `test${Date.now()}${Math.floor(Math.random() * 10000)}@correo.com`;

  const irARegistro = () => {
    cy.visit("/");
    cy.get("#tab-register").click();
  };

  const irALogin = () => {
    cy.visit("/");
    cy.get("#switchToLogin").click();
  };

  const registrarUsuarioUI = (name, email, password) => {
    cy.get("#register-name-input").clear().type(name);
    cy.get("#register-email-input").clear().type(email);
    cy.get("#register-password-input").clear().type(password);
    cy.get("#register-submit-btn").click();
  };

  const loginUsuarioUI = (email, password) => {
    cy.get("#login-email-input").clear().type(email);
    cy.get("#login-password-input").clear().type(password);
    cy.get("#login-submit-btn").click();
  };

  const irASeccionCitas = () => {
    cy.get("[data-testid='dashboard']").should("exist");
    cy.get("#nav-dashboard-appointments").click();
  };

  const crearCita = ({
    date,
    time,
    service,
    client,
    status,
  }) => {
    cy.get("[data-testid='add-appointment-btn']").click();
    cy.get("[data-testid='appointment-modal']").should("be.visible");

    if (date) cy.get("#appointment-date-input").clear().type(date);
    if (time) cy.get("#appointment-time-input").clear().type(time);
    if (service) cy.get("#appointment-service-input").clear().type(service);
    if (client) cy.get("#appointment-client-input").clear().type(client);
    if (status) cy.get("#appointment-status-select").select(status);

    cy.get("[data-testid='appointment-save-btn']").click();
  };

  // ---------------------------------------------------------------------------
  // REGISTRO
  // ---------------------------------------------------------------------------

 it("Campos vacíos en formulario de registro", () => {
  // Contexto: Si el usuario está en el formulario de registro y deja campos vacíos
  irARegistro();

  // Evento: intenta registrarse sin llenar ningún campo
  cy.get("#register-submit-btn").click();

  // Resultado esperado:
  // 1) El primer campo requerido es inválido
  cy.get("#register-name-input")
    .then(($input) => {
      const el = $input[0];
      // El campo NO es válido
      expect(el.checkValidity()).to.be.false;
      // El navegador tiene un mensaje de validación (la burbuja "Completa este campo")
      expect(el.validationMessage).to.not.be.empty;
      // Si quieres ser muy específico (aunque depende del idioma del navegador):
      // expect(el.validationMessage).to.contain("Completa este campo");
    });

  // 2) No se muestra el dashboard (no se registró ni logueó)
  cy.get("[data-testid='dashboard']").should("not.exist");
});
it("Contraseña menor a 8 caracteres", () => {
  // Contexto: Si el usuario escribe una contraseña menor a 8 caracteres
  const email = createUniqueEmail();
  irARegistro();

  // Evento: nombre y correo bien, pero contraseña corta
  cy.get("#register-name-input").type("Usuario Prueba");
  cy.get("#register-email-input").type(email);
  cy.get("#register-password-input").type("1234567"); // 7 caracteres
  cy.get("#register-submit-btn").click();

  // Resultado esperado: se muestra el mensaje de tu estado registerMessage
  cy.get("[data-testid='register-message']")
    .should("be.visible")
    .and("contain", "La contraseña debe tener al menos 8 caracteres.");

  // No se entra al dashboard
  cy.get("[data-testid='dashboard']").should("not.exist");
});
it("Correo ya registrado", () => {
  const email = createUniqueEmail();
  irARegistro();

  // Primer registro correcto
  registrarUsuarioUI("Usuario Prueba", email, "password123");
  cy.get("[data-testid='register-message']")
    .should("contain", "Usuario creado correctamente");

  // Intento de registro con el mismo correo
  registrarUsuarioUI("Otro Usuario", email, "password123");

  cy.get("[data-testid='register-message']")
    .should("be.visible")
    .and("contain", "Ya existe un usuario con ese correo.");
});


  it("Registro correcto con datos válidos", () => {
    // Contexto: Si el usuario captura correctamente nombre, correo y contraseña válida
    const email = createUniqueEmail();
    irARegistro();

    // Evento: llena todos los campos con datos válidos
    registrarUsuarioUI("Usuario Válido", email, passwordValida);

    // Resultado esperado: se muestra mensaje de éxito
    cy.get("[data-testid='register-message']")
      .should("contain", "Usuario creado correctamente");
  });

  // ---------------------------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------------------------
it("Login con datos incorrectos", () => {
  // Contexto: Si el usuario ingresa datos incorrectos
  const email = createUniqueEmail();

  // 1) Primero registramos un usuario válido
  irARegistro();
  registrarUsuarioUI("Usuario Login", email, "password123");
  cy.get("[data-testid='register-message']")
    .should("contain", "Usuario creado correctamente");

  // 2) Cambiamos a la pestaña de login
  cy.get("#switchToLogin").click();

  // 3) Evento: correo correcto, contraseña incorrecta
  loginUsuarioUI(email, "clave-incorrecta");

  // 4) Resultado esperado:
  //    - Se muestra mensaje "Correo o contraseña incorrectos."
  cy.get("[data-testid='login-message']")
    .should("be.visible")
    .and("contain", "Correo o contraseña incorrectos.");

  //    - No se muestra el dashboard
  cy.get("[data-testid='dashboard']").should("not.exist");
});

  it("Login con credenciales válidas", () => {
    // Contexto: Si el usuario escribe credenciales válidas
    const email = createUniqueEmail();

    // Registramos primero
    irARegistro();
    registrarUsuarioUI("Usuario Login OK", email, passwordValida);
    cy.get("[data-testid='register-message']")
      .should("contain", "Usuario creado correctamente");

    // Evento: inicia sesión con correo y contraseña correctos
    cy.get("#switchToLogin").click();
    loginUsuarioUI(email, passwordValida);

    // Resultado esperado: se muestra el dashboard
    cy.get("[data-testid='dashboard']").should("exist");
    cy.get("#currentUserName").should("contain", "Usuario Login OK");
  });

  // ---------------------------------------------------------------------------
  // CREACIÓN DE CITA
  // ---------------------------------------------------------------------------

  it("Abrir formulario de nueva cita", () => {
    // Contexto: Si el usuario abre el formulario de nueva cita
    const email = createUniqueEmail();

    // Registrarse y loguearse
    irARegistro();
    registrarUsuarioUI("Usuario Citas", email, passwordValida);
    cy.get("[data-testid='register-message']")
      .should("contain", "Usuario creado correctamente");
    cy.get("#switchToLogin").click();
    loginUsuarioUI(email, passwordValida);

    // Evento: navega a citas y da clic en “Nueva cita”
    irASeccionCitas();
    cy.get("[data-testid='add-appointment-btn']").click();

    // Resultado esperado: se muestra el modal/formulario de nueva cita
    cy.get("[data-testid='appointment-modal']").should("be.visible");
  });

  it("Creación de cita con campos correctos", () => {
    // Contexto: Si el usuario llena todos los campos correctamente
    const email = createUniqueEmail();

    // Registrarse y loguearse
    irARegistro();
    registrarUsuarioUI("Usuario Citas OK", email, passwordValida);
    cy.get("[data-testid='register-message']")
      .should("contain", "Usuario creado correctamente");
    cy.get("#switchToLogin").click();
    loginUsuarioUI(email, passwordValida);

    irASeccionCitas();

    // Evento: llena todos los campos y guarda la cita
    crearCita({
      date: "2025-01-01",
      time: "10:30",
      service: "Corte de cabello",
      client: "Juan Pérez",
      status: "confirmada",
    });

    // Resultado esperado: la cita aparece en el listado
    cy.get("[data-testid='appointments-tbody']")
      .find("[data-testid='appointment-row']")
      .should("have.length", 1)
      .first()
      .within(() => {
        cy.contains("Corte de cabello");
        cy.contains("Juan Pérez");
        cy.get("[data-testid='appointment-status']")
          .should("contain", "Confirmada");
      });
  });

  // ---------------------------------------------------------------------------
  // EDICIÓN DE CITA
  // ---------------------------------------------------------------------------

  it("Seleccionar cita existente para edición", () => {
    // Contexto: Si el usuario selecciona una cita existente
    const email = createUniqueEmail();

    irARegistro();
    registrarUsuarioUI("Usuario Edita", email, passwordValida);
    cy.get("[data-testid='register-message']")
      .should("contain", "Usuario creado correctamente");
    cy.get("#switchToLogin").click();
    loginUsuarioUI(email, passwordValida);

    irASeccionCitas();

    // Creamos una cita para poder seleccionarla
    crearCita({
      date: "2025-02-01",
      time: "11:00",
      service: "Servicio editable",
      client: "Cliente Edit",
      status: "pendiente",
    });

    cy.get("[data-testid='appointments-tbody']")
      .find("[data-testid='appointment-row']")
      .first()
      .as("row");

    // Evento: da clic en editar
    cy.get("@row").find("[data-testid='edit-appointment-btn']").click();

    // Resultado esperado: se abre el formulario/modal con los datos de la cita
    cy.get("[data-testid='appointment-modal']").should("be.visible");
    cy.get("#appointment-service-input").should("have.value", "Servicio editable"); // si cargas el valor
  });

  it("Edición correcta de una cita existente", () => {
    // Contexto: Si el usuario hace modificaciones válidas
    const email = createUniqueEmail();

    irARegistro();
    registrarUsuarioUI("Usuario Edita OK", email, passwordValida);
    cy.get("[data-testid='register-message']")
      .should("contain", "Usuario creado correctamente");
    cy.get("#switchToLogin").click();
    loginUsuarioUI(email, passwordValida);

    irASeccionCitas();

    // Creamos una cita para luego editarla
    crearCita({
      date: "2025-02-01",
      time: "11:00",
      service: "Servicio original",
      client: "Cliente Edit OK",
      status: "pendiente",
    });

    cy.get("[data-testid='appointments-tbody']")
      .find("[data-testid='appointment-row']")
      .first()
      .as("row");

    cy.get("@row").find("[data-testid='edit-appointment-btn']").click();
    cy.get("[data-testid='appointment-modal']").should("be.visible");

    // Evento: modifica campos con datos válidos
    cy.get("#appointment-service-input").clear().type("Servicio editado");
    cy.get("#appointment-status-select").select("confirmada");
    cy.get("[data-testid='appointment-save-btn']").click();

    // Resultado esperado: la fila refleja los cambios
    cy.get("@row").within(() => {
      cy.contains("Servicio editado");
      cy.get("[data-testid='appointment-status']")
        .should("contain", "Confirmada");
    });
  });

  // ---------------------------------------------------------------------------
  // ELIMINACIÓN DE CITA
  // ---------------------------------------------------------------------------

  it("Intento de eliminar una cita cancelando la confirmación", () => {
  // Contexto: Si el usuario intenta eliminar una cita
  const email = createUniqueEmail();

  // Registro y login
  irARegistro();
  registrarUsuarioUI("Usuario Elimina", email, "password123");
  cy.get("[data-testid='register-message']")
    .should("contain", "Usuario creado correctamente");
  cy.get("#switchToLogin").click();
  loginUsuarioUI(email, "password123");

  irASeccionCitas();

  // Creamos una cita (puede ser confirmada si quieres ligarlo a la rúbrica)
  crearCita({
    date: "2025-03-01",
    time: "09:00",
    service: "Cita para intentar eliminar",
    client: "Cliente Cancel",
    status: "confirmada", // aquí la dejamos como confirmada
  });

  // Verificamos que exista 1 fila
  cy.get("[data-testid='appointments-tbody']")
    .find("[data-testid='appointment-row']")
    .should("have.length", 1)
    .first()
    .as("row");

  // Stub de window.confirm para SIMULAR que el usuario da "Cancelar"
  cy.window().then((win) => {
    cy.stub(win, "confirm").returns(false);
  });

  // Evento: clic en eliminar
  cy.get("@row").find("[data-testid='delete-appointment-btn']").click();

  // Resultado esperado: la cita sigue existiendo (no se eliminó)
  cy.get("[data-testid='appointments-tbody']")
    .find("[data-testid='appointment-row']")
    .should("have.length", 1);
});

it("Eliminación de una cita confirmada aceptando la confirmación", () => {
  // Contexto: Si el usuario confirma
  const email = createUniqueEmail();

  // Registro y login
  irARegistro();
  registrarUsuarioUI("Usuario Elimina OK", email, "password123");
  cy.get("[data-testid='register-message']")
    .should("contain", "Usuario creado correctamente");
  cy.get("#switchToLogin").click();
  loginUsuarioUI(email, "password123");

  irASeccionCitas();

  // Creamos una cita CONFIRMADA
  crearCita({
    date: "2025-03-02",
    time: "10:00",
    service: "Cita confirmada a eliminar",
    client: "Cliente Confirm",
    status: "confirmada",
  });

  cy.get("[data-testid='appointments-tbody']")
    .find("[data-testid='appointment-row']")
    .should("have.length", 1)
    .first()
    .as("row");

  // Stub de window.confirm para SIMULAR que el usuario da "Aceptar"
  cy.window().then((win) => {
    cy.stub(win, "confirm").returns(true);
  });

  // Evento: clic en eliminar y aceptar confirm
  cy.get("@row").find("[data-testid='delete-appointment-btn']").click();

  // Resultado esperado: la cita desaparece del listado
  cy.get("[data-testid='appointments-tbody']")
    .find("[data-testid='appointment-row']")
    .should("have.length", 0);

  // Y se muestra el mensaje de “no hay citas”
  cy.get("[data-testid='empty-appointments-message']").should("be.visible");
});
});
