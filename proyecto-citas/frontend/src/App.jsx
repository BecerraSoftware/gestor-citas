import React, { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [activeAuthTab, setActiveAuthTab] = useState("login");
  const [loginMessage, setLoginMessage] = useState({ type: "", text: "" });
  const [registerMessage, setRegisterMessage] = useState({ type: "", text: "" });
  const [activeDashboardSection, setActiveDashboardSection] = useState("dashboard-home");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);

  const [appointmentForm, setAppointmentForm] = useState({
    id: "",
    date: "",
    time: "",
    service: "",
    client: "",
    status: "pendiente",
  });

  const isLoggedIn = !!currentUser;

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const handleAuthTabChange = (tab) => {
    setActiveAuthTab(tab);
    setLoginMessage({ type: "", text: "" });
    setRegisterMessage({ type: "", text: "" });
  };
// 📥 Cargar citas cuando cambia el usuario logueado
useEffect(() => {
  if (!currentUser) {
    // Cuando no hay usuario, no cargamos nada aquí
    return;
  }

  let cancelado = false;

  (async () => {
    try {
      const res = await fetch(
        `${API_BASE}/api/users/${currentUser.id}/appointments`
      );
      if (!res.ok) {
        console.error("Error al obtener citas");
        return;
      }
      const data = await res.json();
      if (!cancelado) {
        setAppointments(data);
      }
    } catch (err) {
      console.error("Error de red al obtener citas", err);
    }
  })();

  // cleanup por si React re-ejecuta el efecto
  return () => {
    cancelado = true;
  };
}, [currentUser]);


  // 🧾 Registro
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterMessage({ type: "", text: "" });

    const form = e.target;
    const name = form.registerName.value.trim();
    const email = form.registerEmail.value.trim().toLowerCase();
    const password = form.registerPassword.value;

    if (!name || !email || !password) {
      return setRegisterMessage({ type: "error", text: "Completa todos los campos." });
    }

    if (password.length < 8) {
      return setRegisterMessage({
        type: "error",
        text: "La contraseña debe tener al menos 8 caracteres.",
      });
    }

    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.status === 409) {
        return setRegisterMessage({
          type: "error",
          text: "Ya existe un usuario con ese correo.",
        });
      }

      if (!res.ok) {
        return setRegisterMessage({
          type: "error",
          text: "Error al registrar usuario.",
        });
      }

      await res.json();
      setRegisterMessage({
        type: "success",
        text: "Usuario creado correctamente. Ahora inicia sesión.",
      });
      form.reset();
    } catch (err) {
      console.error(err);
      setRegisterMessage({
        type: "error",
        text: "Error de red al registrar usuario.",
      });
    }
  };

  // 🔑 Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginMessage({ type: "", text: "" });

    const form = e.target;
    const email = form.loginEmail.value.trim().toLowerCase();
    const password = form.loginPassword.value;

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 401) {
        return setLoginMessage({
          type: "error",
          text: "Correo o contraseña incorrectos.",
        });
      }

      if (!res.ok) {
        return setLoginMessage({
          type: "error",
          text: "Error al iniciar sesión.",
        });
      }

      const data = await res.json();
      setCurrentUser(data);
      setActiveDashboardSection("dashboard-home");
      form.reset();
    } catch (err) {
      console.error(err);
      setLoginMessage({
        type: "error",
        text: "Error de red al iniciar sesión.",
      });
    }
  };

  // 🚪 Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setAppointments([]);
    setActiveDashboardSection("dashboard-home");
  };

  // Citas del usuario actual
  const userAppointments = isLoggedIn ? appointments : [];

  const stats = {
    total: userAppointments.length,
    confirmadas: userAppointments.filter((a) => a.status === "confirmada").length,
    pendientes: userAppointments.filter((a) => a.status === "pendiente").length,
    canceladas: userAppointments.filter((a) => a.status === "cancelada").length,
  };

  // Modal
  const openModal = (appointment = null) => {
    if (appointment) {
      setEditingAppointment(appointment);
      setAppointmentForm({
        id: appointment.id,
        date: appointment.date,
        time: appointment.time,
        service: appointment.service,
        client: appointment.client,
        status: appointment.status,
      });
    } else {
      setEditingAppointment(null);
      setAppointmentForm({
        id: "",
        date: "",
        time: "",
        service: "",
        client: "",
        status: "pendiente",
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleAppointmentChange = (e) => {
    const { name, value } = e.target;
    setAppointmentForm((prev) => ({ ...prev, [name]: value }));
  };

  // 💾 Guardar cita (crear / editar) vía API
  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert("Debes iniciar sesión.");
      return;
    }

    const { id, date, time, service, client, status } = appointmentForm;

    if (!date || !time || !service.trim() || !client.trim()) {
      alert("Completa todos los campos.");
      return;
    }

    try {
      if (id) {
        // editar
        const res = await fetch(
          `${API_BASE}/api/users/${currentUser.id}/appointments/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date,
              time,
              service: service.trim(),
              client: client.trim(),
              status,
            }),
          }
        );

        if (!res.ok) {
          alert("Error al actualizar la cita.");
          return;
        }

        const updated = await res.json();
        setAppointments((prev) =>
          prev.map((a) => (a.id === updated.id ? updated : a))
        );
      } else {
        // nueva
        const res = await fetch(
          `${API_BASE}/api/users/${currentUser.id}/appointments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date,
              time,
              service: service.trim(),
              client: client.trim(),
              status,
            }),
          }
        );

        if (!res.ok) {
          alert("Error al crear la cita.");
          return;
        }

        const created = await res.json();
        setAppointments((prev) => [...prev, created]);
      }

      closeModal();
    } catch (err) {
      console.error(err);
      alert("Error de red al guardar la cita.");
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta cita?")) return;
    if (!currentUser) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/users/${currentUser.id}/appointments/${id}`,
        { method: "DELETE" }
      );

      if (!res.ok && res.status !== 204) {
        alert("Error al eliminar la cita.");
        return;
      }

      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
      alert("Error de red al eliminar la cita.");
    }
  };

  const authMessageClass = (msg) =>
    `auth-message ${msg.type === "success" ? "success" : ""} ${
      msg.type === "error" ? "error" : ""
    }`;

  return (
    <>
      {/* Navbar */}
      <header className="navbar">
        <div className="navbar-left">
          <div className="logo-circle">C</div>
          <span className="logo-text">CitaPro</span>
        </div>
        <nav className="navbar-right">
          <a href="#features">Características</a>
          <a href="#auth-section">Iniciar sesión</a>
          <button
            className="btn btn-outline"
            id="btnScrollRegister"
            onClick={() => {
              scrollToSection("auth-section");
              handleAuthTabChange("register");
            }}
          >
            Crear cuenta
          </button>
        </nav>
      </header>

      {/* Pantalla pública: Hero + Features + Auth */}
      {!isLoggedIn && (
        <>
          {/* Hero */}
          <section className="hero">
            <div className="hero-content">
              <h1>
                Gestiona tus citas como un <span className="gradient-text">pro</span>
              </h1>
              <p className="hero-subtitle">
                Crea, administra y controla tus citas en un panel moderno, rápido y
                pensado para ingenieros de software exigentes y muy pros.
              </p>
              <div className="hero-actions">
                <button
                  className="btn btn-primary"
                  id="btnGoLogin"
                  onClick={() => {
                    scrollToSection("auth-section");
                    handleAuthTabChange("login");
                  }}
                >
                  Iniciar sesión
                </button>
                <button
                  className="btn btn-ghost"
                  id="btnGoRegister"
                  onClick={() => {
                    scrollToSection("auth-section");
                    handleAuthTabChange("register");
                  }}
                >
                  Crear cuenta
                </button>
              </div>
              <div className="hero-badges">
                <span className="badge">Listo para Cypress prof</span>
                <span className="badge">Ingenieros estrella</span>
                <span className="badge">Hecho para el ordinario</span>
              </div>
            </div>
            <div className="hero-preview">
              <div className="glass-card">
                <div className="preview-header">
                  <span className="status-dot"></span>
                  <span>Resumen de citas</span>
                </div>
                <div className="preview-body">
                  <div className="preview-row">
                    <div>
                      <p className="preview-label">Citas de hoy</p>
                      <p className="preview-value">3</p>
                    </div>
                    <div>
                      <p className="preview-label">Pendientes</p>
                      <p className="preview-value">5</p>
                    </div>
                  </div>
                  <div className="preview-list">
                    <div className="preview-item">
                      <div>
                        <p className="preview-item-title">Corte de cabello</p>
                        <p className="preview-item-sub">10:30 · Mela Perez Prado</p>
                      </div>
                      <span className="pill pill-green">Confirmada</span>
                    </div>
                    <div className="preview-item">
                      <div>
                        <p className="preview-item-title">Consulta general</p>
                        <p className="preview-item-sub">12:00 · Ana stacio</p>
                      </div>
                      <span className="pill pill-yellow">Pendiente</span>
                    </div>
                    <div className="preview-item">
                      <div>
                        <p className="preview-item-title">Mantenimiento PC</p>
                        <p className="preview-item-sub">16:00 · Carlos Ruiz</p>
                      </div>
                      <span className="pill pill-blue">Programada</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="floating-card">
                <p className="floating-title">+ Nueva cita</p>
                <p className="floating-sub">Crea citas en menos de 10 segundos.</p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="features" id="features">
            <h2>Diseñada para flujos reales de trabajo</h2>
            <p className="features-subtitle">
              Todo lo que necesitas para demostrar un proyecto pro.
            </p>
            <div className="features-grid">
              <div className="feature-card">
                <h3>Dashboard moderno</h3>
                <p>Visualiza citas, estados y horarios en un panel limpio y responsivo.</p>
              </div>
              <div className="feature-card">
                <h3>Flujo completo</h3>
                <p>Registro, login, CRUD de citas y estado de cada una para las pruebas.</p>
              </div>
              <div className="feature-card">
                <h3>Listo para testing</h3>
                <p>IDs y marcas pensadas para Cypress, pruebas unitarias y SonarCloud.</p>
              </div>
            </div>
          </section>

          {/* Auth */}
          <section className="auth-section" id="auth-section">
            <div className="auth-card">
              <div className="auth-tabs">
                <button
                  className={`auth-tab ${
                    activeAuthTab === "login" ? "active" : ""
                  }`}
                  id="tab-login"
                  onClick={() => handleAuthTabChange("login")}
                >
                  Iniciar sesión
                </button>
                <button
                  className={`auth-tab ${
                    activeAuthTab === "register" ? "active" : ""
                  }`}
                  id="tab-register"
                  onClick={() => handleAuthTabChange("register")}
                >
                  Crear cuenta
                </button>
              </div>

              {/* Login */}
              <form
                id="login-form"
                data-testid="login-form"
                className={`auth-form ${
                  activeAuthTab === "login" ? "visible" : ""
                }`}
                onSubmit={handleLoginSubmit}
              >
                <h3>Bienvenido de vuelta</h3>
                <label htmlFor="loginEmail">Correo</label>
                <input
                  type="email"
                  id="login-email-input"
                  name="loginEmail"
                  placeholder="tucorreo@ejemplo.com"
                  required
                />
                <label htmlFor="loginPassword">Contraseña</label>
                <input
                  type="password"
                  id="login-password-input"
                  name="loginPassword"
                  placeholder="Tu contraseña"
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  id="login-submit-btn"
                  data-testid="login-submit-btn"
                >
                  Entrar
                </button>
                <p className="auth-help">
                  ¿No tienes cuenta?
                  <button
                    type="button"
                    className="link-button"
                    id="switchToRegister"
                    onClick={() => handleAuthTabChange("register")}
                  >
                    Crear cuenta
                  </button>
                </p>
                <p
                  id="loginMessage"
                  data-testid="login-message"
                  className={authMessageClass(loginMessage)}
                >
                  {loginMessage.text}
                </p>
              </form>

              {/* Register */}
              <form
                id="register-form"
                data-testid="register-form"
                className={`auth-form ${
                  activeAuthTab === "register" ? "visible" : ""
                }`}
                onSubmit={handleRegisterSubmit}
              >
                <h3>Crea tu cuenta</h3>
                <label htmlFor="registerName">Nombre completo</label>
                <input
                  type="text"
                  id="register-name-input"
                  name="registerName"
                  placeholder="Tu nombre"
                  required
                />
                <label htmlFor="registerEmail">Correo</label>
                <input
                  type="email"
                  id="register-email-input"
                  name="registerEmail"
                  placeholder="tucorreo@ejemplo.com"
                  required
                />
                <label htmlFor="registerPassword">Contraseña</label>
                <input
                  type="password"
                  id="register-password-input"
                  name="registerPassword"
                  placeholder="Mínimo 8 caracteres"
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  id="register-submit-btn"
                  data-testid="register-submit-btn"
                >
                  Registrarme
                </button>
                <p className="auth-help">
                  ¿Ya tienes cuenta?
                  <button
                    type="button"
                    className="link-button"
                    id="switchToLogin"
                    onClick={() => handleAuthTabChange("login")}
                  >
                    Iniciar sesión
                  </button>
                </p>
                <p
                  id="registerMessage"
                  data-testid="register-message"
                  className={authMessageClass(registerMessage)}
                >
                  {registerMessage.text}
                </p>
              </form>
            </div>
          </section>
        </>
      )}

      {/* Dashboard */}
      {isLoggedIn && (
        <main className="dashboard" id="dashboard" data-testid="dashboard">
          <aside className="sidebar">
            <div className="sidebar-header">
              <div className="logo-circle small">C</div>
              <span className="logo-text">CitaPro</span>
            </div>
            <p className="sidebar-user">
              <span>Usuario:</span>{" "}
              <strong id="currentUserName">{currentUser?.name}</strong>
            </p>
            <nav className="sidebar-nav">
              <button
                className={`sidebar-link ${
                  activeDashboardSection === "dashboard-home" ? "active" : ""
                }`}
                data-section="dashboard-home"
                id="nav-dashboard-home"
                onClick={() => setActiveDashboardSection("dashboard-home")}
              >
                Panel
              </button>
              <button
                className={`sidebar-link ${
                  activeDashboardSection === "dashboard-appointments" ? "active" : ""
                }`}
                data-section="dashboard-appointments"
                id="nav-dashboard-appointments"
                onClick={() => setActiveDashboardSection("dashboard-appointments")}
              >
                Citas
              </button>
            </nav>
            <button
              className="btn btn-outline btn-logout"
              id="btnLogout"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </aside>

          <section className="dashboard-content">
            {/* Home summary */}
            <section
              id="dashboard-home"
              className={`dashboard-section ${
                activeDashboardSection === "dashboard-home" ? "visible" : ""
              }`}
            >
              <h2>Resumen general</h2>
              <p className="section-subtitle">
                Aquí verás un resumen de tus citas registradas.
              </p>
              <div className="cards-grid">
                <div className="stat-card">
                  <p className="stat-label">Citas totales</p>
                  <p className="stat-value" id="statTotal">
                    {stats.total}
                  </p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Confirmadas</p>
                  <p className="stat-value" id="statConfirmed">
                    {stats.confirmadas}
                  </p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Pendientes</p>
                  <p className="stat-value" id="statPending">
                    {stats.pendientes}
                  </p>
                </div>
                <div className="stat-card">
                  <p className="stat-label">Canceladas</p>
                  <p className="stat-value" id="statCancelled">
                    {stats.canceladas}
                  </p>
                </div>
              </div>
            </section>

            {/* Appointments */}
            <section
              id="dashboard-appointments"
              className={`dashboard-section ${
                activeDashboardSection === "dashboard-appointments" ? "visible" : ""
              }`}
            >
              <div className="section-header">
                <div>
                  <h2>Mis citas</h2>
                  <p className="section-subtitle">
                    Administra tus citas fácilmente.
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  id="add-appointment-btn"
                  data-testid="add-appointment-btn"
                  onClick={() => openModal()}
                >
                  + Nueva cita
                </button>
              </div>

              <div className="table-wrapper">
                <table
                  className="appointments-table"
                  id="appointments-table"
                  data-testid="appointments-table"
                >
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Servicio</th>
                      <th>Cliente</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody
                    id="appointments-tbody"
                    data-testid="appointments-tbody"
                  >
                    {userAppointments.map((a) => {
                      const statusClass =
                        a.status === "confirmada"
                          ? "badge-confirmada"
                          : a.status === "cancelada"
                          ? "badge-cancelada"
                          : "badge-pendiente";

                      return (
                        <tr key={a.id} data-testid="appointment-row">
                          <td>{a.date}</td>
                          <td>{a.time}</td>
                          <td>{a.service}</td>
                          <td>{a.client}</td>
                          <td>
                            <span
                              className={`badge-status ${statusClass}`}
                              data-testid="appointment-status"
                            >
                              {capitalize(a.status)}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn-icon"
                                data-testid="edit-appointment-btn"
                                onClick={() => openModal(a)}
                              >
                                Editar
                              </button>
                              <button
                                className="btn-icon"
                                data-testid="delete-appointment-btn"
                                onClick={() => handleDeleteAppointment(a.id)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {userAppointments.length === 0 && (
                  <p
                    className="empty-message"
                    id="emptyAppointmentsMessage"
                    data-testid="empty-appointments-message"
                  >
                    Aún no tienes citas registradas. Crea la primera con el botón
                    “Nueva cita”.
                  </p>
                )}
              </div>
            </section>
          </section>
        </main>
      )}

      {/* Modal de cita */}
      {modalOpen && (
        <div
          className="modal-overlay"
          id="modalOverlay"
          data-testid="appointment-modal-overlay"
          onClick={(e) => {
            if (e.target.id === "modalOverlay") {
              closeModal();
            }
          }}
        >
          <div
            className="modal"
            id="appointment-modal"
            data-testid="appointment-modal"
          >
            <div className="modal-header">
              <h3 id="modalTitle">
                {editingAppointment ? "Editar cita" : "Nueva cita"}
              </h3>
              <button
                className="modal-close"
                id="btnCloseModal"
                onClick={closeModal}
              >
                &times;
              </button>
            </div>
            <form
              id="appointment-form"
              data-testid="appointment-form"
              className="modal-form"
              onSubmit={handleAppointmentSubmit}
            >
              <input type="hidden" name="id" value={appointmentForm.id} />

              <label htmlFor="appointmentDate">Fecha</label>
              <input
                type="date"
                id="appointment-date-input"
                name="date"
                value={appointmentForm.date}
                onChange={handleAppointmentChange}
                required
              />

              <label htmlFor="appointmentTime">Hora</label>
              <input
                type="time"
                id="appointment-time-input"
                name="time"
                value={appointmentForm.time}
                onChange={handleAppointmentChange}
                required
              />

              <label htmlFor="appointmentService">Servicio</label>
              <input
                type="text"
                id="appointment-service-input"
                name="service"
                placeholder="Ej. Corte de cabello"
                value={appointmentForm.service}
                onChange={handleAppointmentChange}
                required
              />

              <label htmlFor="appointmentClient">Cliente</label>
              <input
                type="text"
                id="appointment-client-input"
                name="client"
                placeholder="Nombre del cliente"
                value={appointmentForm.client}
                onChange={handleAppointmentChange}
                required
              />

              <label htmlFor="appointmentStatus">Estado</label>
              <select
                id="appointment-status-select"
                name="status"
                value={appointmentForm.status}
                onChange={handleAppointmentChange}
              >
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="cancelada">Cancelada</option>
              </select>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                id="btnSaveAppointment"
                data-testid="appointment-save-btn"
              >
                Guardar cita
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
