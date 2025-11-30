import express from "express";
import cors from "cors";

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// "Base de datos" en memoria
let users = [];
let appointments = [];

// Helper: generar ID simple
const newId = () => Date.now().toString();

// Registro
app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email y password son obligatorios" });
  }
  if (users.find((u) => u.email === email.toLowerCase())) {
    return res.status(409).json({ error: "Ya existe un usuario con ese email" });
  }

  const user = {
    id: newId(),
    name,
    email: email.toLowerCase(),
    password, // para demo, en real usar hash
  };
  users.push(user);

  return res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
  });
});

// Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email y password son obligatorios" });
  }
  const user = users.find(
    (u) => u.email === email.toLowerCase() && u.password === password
  );
  if (!user) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  // Para algo simple: devolvemos userId
  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
  });
});

// Obtener citas por usuario
app.get("/api/users/:userId/appointments", (req, res) => {
  const { userId } = req.params;
  const userExists = users.some((u) => u.id === userId);
  if (!userExists) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  const userAppointments = appointments.filter((a) => a.userId === userId);
  return res.json(userAppointments);
});

// Crear cita
app.post("/api/users/:userId/appointments", (req, res) => {
  const { userId } = req.params;
  const { date, time, service, client, status } = req.body;

  if (!date || !time || !service || !client) {
    return res
      .status(400)
      .json({ error: "date, time, service y client son obligatorios" });
  }

  const userExists = users.some((u) => u.id === userId);
  if (!userExists) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  const appointment = {
    id: newId(),
    userId,
    date,
    time,
    service,
    client,
    status: status || "pendiente",
  };
  appointments.push(appointment);
  return res.status(201).json(appointment);
});

// Actualizar cita
app.put("/api/users/:userId/appointments/:id", (req, res) => {
  const { userId, id } = req.params;
  const { date, time, service, client, status } = req.body;

  const idx = appointments.findIndex(
    (a) => a.id === id && a.userId === userId
  );
  if (idx === -1) {
    return res.status(404).json({ error: "Cita no encontrada" });
  }

  const appointment = appointments[idx];
  appointments[idx] = {
    ...appointment,
    date: date ?? appointment.date,
    time: time ?? appointment.time,
    service: service ?? appointment.service,
    client: client ?? appointment.client,
    status: status ?? appointment.status,
  };

  return res.json(appointments[idx]);
});

// Eliminar cita
app.delete("/api/users/:userId/appointments/:id", (req, res) => {
  const { userId, id } = req.params;
  const idx = appointments.findIndex(
    (a) => a.id === id && a.userId === userId
  );
  if (idx === -1) {
    return res.status(404).json({ error: "Cita no encontrada" });
  }
  appointments.splice(idx, 1);
  return res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
