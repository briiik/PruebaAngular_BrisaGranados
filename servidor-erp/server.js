const express = require('express');
const cors    = require('cors');
const { createClient } = require('@supabase/supabase-js');

const { register, login, addUser, changePassword } = require('./routes/users');
const { getGruposDeUsuario, getGrupoById, getMiembros, getPermisosDeUsuarioEnGrupo,
        crearGrupo, editarGrupo, eliminarGrupo, agregarMiembro, eliminarMiembro, actualizarPermisosMiembro,
        asignarPermiso, quitarPermiso, buscarUsuarioPorEmail } = require('./routes/grupos');
const { getTicketsPorGrupo, getTicketById, crearTicket, editarTicket,
        cambiarEstado, eliminarTicket, agregarComentario, getHistorial }        = require('./routes/tickets');
const { getEstados, getPrioridades, getPermisos }                              = require('./routes/catalogos');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  'https://dgmgngfrespeheuzrpso.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbWduZ2ZyZXNwZWhldXpycHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDk2MzMsImV4cCI6MjA4OTg4NTYzM30.fUqQzetG3ZREKVTPQNmv2BzjwFoL3No5gf8qk-0rKuQ'
);

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE DE AUTENTICACIÓN
// ─────────────────────────────────────────────────────────────────────────────
async function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ statusCode: 401, intOpCode: 'SxAU401', data: { error: 'Token requerido' } });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ statusCode: 401, intOpCode: 'SxAU401', data: { error: 'Token inválido o expirado' } });
  }

  req.userId = data.user.id;
  req.user   = data.user;
  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS PÚBLICAS
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/register', register);
app.post('/api/login',    login);

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS PROTEGIDAS
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api', authMiddleware);

// ── Usuarios ──────────────────────────────────────────────────────────────────
app.post('/api/users',           addUser);
app.post('/api/change-password', changePassword);
app.get   ('/api/usuarios/buscar',                 buscarUsuarioPorEmail);

// ── Grupos ────────────────────────────────────────────────────────────────────
app.get   ('/api/grupos',                          getGruposDeUsuario);
app.get   ('/api/grupos/:id',                      getGrupoById);
app.post  ('/api/grupos',                          crearGrupo);
app.patch ('/api/grupos/:id',                      editarGrupo);
app.delete('/api/grupos/:id',                      eliminarGrupo);
app.get   ('/api/grupos/:id/miembros',             getMiembros);
app.post  ('/api/grupos/:id/miembros',             agregarMiembro);
app.get   ('/api/grupos/:id/permisos/:usuarioId',  getPermisosDeUsuarioEnGrupo);
app.post  ('/api/grupos/:id/permisos',             asignarPermiso);
app.delete('/api/grupos/:id/permisos',             quitarPermiso);
app.put   ('/api/grupos/:id/miembros/:usuarioId/permisos', actualizarPermisosMiembro);
app.delete('/api/grupos/:id/miembros/:usuarioId',  eliminarMiembro);

// ── Tickets ───────────────────────────────────────────────────────────────────
app.get   ('/api/grupos/:grupoId/tickets',  getTicketsPorGrupo);
app.get   ('/api/tickets/:id',              getTicketById);
app.post  ('/api/tickets',                  crearTicket);
app.patch ('/api/tickets/:id',              editarTicket);
app.patch ('/api/tickets/:id/estado',       cambiarEstado);
app.delete('/api/tickets/:id',              eliminarTicket);
app.post  ('/api/tickets/:id/comentarios',  agregarComentario);
app.get   ('/api/tickets/:id/historial',    getHistorial);

// ── Catálogos ─────────────────────────────────────────────────────────────────
app.get('/api/estados',     getEstados);
app.get('/api/prioridades', getPrioridades);
app.get('/api/permisos',    getPermisos);

// ─────────────────────────────────────────────────────────────────────────────
app.listen(3000, () => console.log('API Gateway corriendo en http://localhost:3000'));