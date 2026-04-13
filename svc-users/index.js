// svc-users/index.js
// Microservicio de usuarios — tecnología: UP2U (implementado con Fastify minimalista)
// Puerto: 3001
// Responsabilidad: login, register, gestión de usuarios
// NO valida tokens — eso lo hace el gateway
// Se comunica SOLO con Supabase directamente

const Fastify = require('fastify');
const { createClient } = require('@supabase/supabase-js');

const app = Fastify({ logger: false });

const supabase = createClient(
  'https://dgmgngfrespeheuzrpso.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbWduZ2ZyZXNwZWhldXpycHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDk2MzMsImV4cCI6MjA4OTg4NTYzM30.fUqQzetG3ZREKVTPQNmv2BzjwFoL3No5gf8qk-0rKuQ'
);

app.register(require('@fastify/cors'), { origin: '*' });

// ─────────────────────────────────────
// VALIDACIONES
// ─────────────────────────────────────
function validarEmail(email) {
  return email && email.includes('@');
}

function validarPassword(password) {
  const regex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{10,}$/;
  return regex.test(password);
}

function validarTelefono(telefono) {
  const limpio = telefono.replace(/\D/g, '');
  return limpio.length === 10;
}

function esMayorDeEdad(fecha) {
  const hoy        = new Date();
  const nacimiento = new Date(fecha);
  let edad         = hoy.getFullYear() - nacimiento.getFullYear();
  const mes        = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad >= 18;
}

// ─────────────────────────────────────
// POST /register
// ─────────────────────────────────────
app.post('/register', async (req, reply) => {
  const {
    nombre_completo, username, email, password,
    confirm_password, direccion, telefono, fecha_nacimiento
  } = req.body;

  const errores = {};

  if (!username?.trim())            errores.username        = 'El usuario es requerido';
  if (!validarEmail(email))         errores.email           = 'Email inválido';
  if (!nombre_completo?.trim())     errores.nombre_completo = 'El nombre completo es requerido';
  if (!direccion?.trim())           errores.direccion       = 'La dirección es requerida';

  if (!password) {
    errores.password = 'La contraseña es requerida';
  } else if (!validarPassword(password)) {
    errores.password = 'Mínimo 10 caracteres, una mayúscula, un número y un símbolo';
  }

  if (password !== confirm_password)
    errores.confirm_password = 'Las contraseñas no coinciden';

  if (!fecha_nacimiento) {
    errores.fecha_nacimiento = 'La fecha de nacimiento es requerida';
  } else if (!esMayorDeEdad(fecha_nacimiento)) {
    errores.fecha_nacimiento = 'Debes ser mayor de edad';
  }

  if (!telefono || !validarTelefono(telefono))
    errores.telefono = 'Teléfono inválido (10 dígitos)';

  if (Object.keys(errores).length > 0) {
    return reply.status(400).send({ statusCode: 400, intOpCode: 'SxUS400', data: { errores } });
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) {
    return reply.status(400).send({ statusCode: 400, intOpCode: 'SxUS400', data: { error: authError.message } });
  }

  const { data: nuevoUsuario, error: dbError } = await supabase
    .from('usuarios')
    .insert({
      id:                authData.user.id,
      nombre_completo,   username, email, direccion, telefono,
      fecha_nacimiento,
      permisos_globales: [],
      fecha_inicio:      new Date().toISOString().split('T')[0],
      creado_en:         new Date()
    })
    .select()
    .single();

  if (dbError) {
    return reply.status(400).send({ statusCode: 400, intOpCode: 'SxUS400', data: { error: dbError.message } });
  }

  return reply.status(201).send({
    statusCode: 201,
    intOpCode:  'SxUS201',
    data: { mensaje: '¡Registro exitoso!', usuario: nuevoUsuario }
  });
});

// ─────────────────────────────────────
// POST /login
// ─────────────────────────────────────
app.post('/login', async (req, reply) => {
  const { email, password } = req.body;

  const errores = {};
  if (!email?.trim())    errores.email    = 'El email es requerido';
  if (!password?.trim()) errores.password = 'La contraseña es requerida';

  if (Object.keys(errores).length > 0) {
    return reply.status(400).send({ statusCode: 400, intOpCode: 'SxUS400', data: { errores } });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return reply.status(400).send({ statusCode: 400, intOpCode: 'SxUS400', data: { error: 'Usuario o contraseña incorrectos' } });
  }

  const { data: usuarioData, error: usuarioError } = await supabase
    .from('usuarios').select('*').eq('id', data.user.id).single();

  if (usuarioError) {
    return reply.status(400).send({ statusCode: 400, intOpCode: 'SxUS400', data: { error: usuarioError.message } });
  }

  await supabase.from('usuarios').update({ last_login: new Date() }).eq('id', data.user.id);

  return reply.status(200).send({
    statusCode: 200,
    intOpCode:  'SxUS200',
    data: { mensaje: 'Login exitoso', token: data.session.access_token, usuario: usuarioData }
  });
});

// ─────────────────────────────────────
// GET /buscar?email=
// ─────────────────────────────────────
app.get('/buscar', async (req, reply) => {
  const { email } = req.query;
  if (!email?.trim()) {
    return reply.status(400).send({ statusCode: 400, intOpCode: 'SxUS400', data: { error: 'Email requerido' } });
  }

  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre_completo, username, email')
    .ilike('email', email.trim())
    .single();

  if (error || !data) {
    return reply.status(404).send({ statusCode: 404, intOpCode: 'SxUS404', data: { error: 'Usuario no encontrado' } });
  }

  return reply.status(200).send({ statusCode: 200, intOpCode: 'SxUS200', data });
});

// ─────────────────────────────────────
// PATCH /usuarios/:id  — actualizar perfil
// ─────────────────────────────────────
app.patch('/usuarios/:id', async (req, reply) => {
  const { id } = req.params;
  const { nombre_completo, username, direccion, telefono, fecha_nacimiento } = req.body;

  const errores = {};
  if (!nombre_completo?.trim()) errores.nombre_completo = 'El nombre completo es requerido';
  if (!username?.trim())        errores.username        = 'El usuario es requerido';
  if (!telefono || !validarTelefono(telefono)) errores.telefono = 'Teléfono inválido (10 dígitos)';

  if (Object.keys(errores).length > 0) {
    return reply.status(400).send({ statusCode: 400, intOpCode: 'SxUS400', data: { errores } });
  }

  const { data, error } = await supabase
    .from('usuarios')
    .update({ nombre_completo, username, direccion, telefono, fecha_nacimiento })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return reply.status(400).send({ statusCode: 400, intOpCode: 'SxUS400', data: { error: error.message } });
  }

  return reply.status(200).send({
    statusCode: 200,
    intOpCode:  'SxUS200',
    data: { mensaje: 'Perfil actualizado', usuario: data }
  });
});

// ─────────────────────────────────────
// POST /change-password
// ─────────────────────────────────────
app.post('/change-password', async (req, reply) => {
  const { password, confirm_password, token } = req.body;
  const errores = {};

  if (!password) {
    errores.password = 'La contraseña es requerida';
  } else if (!validarPassword(password)) {
    errores.password = 'Mínimo 10 caracteres, una mayúscula, un número y un símbolo';
  }

  if (password !== confirm_password)
    errores.confirm_password = 'Las contraseñas no coinciden';

  if (Object.keys(errores).length > 0) {
    return reply.status(400).send({ statusCode: 400, intOpCode: 'SxUS400', data: { errores } });
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: token, refresh_token: token
  });

  if (sessionError) {
    return reply.status(400).send({ statusCode: 400, intOpCode: 'SxUS400', data: { error: 'Token inválido o expirado' } });
  }

  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) {
    return reply.status(400).send({ statusCode: 400, intOpCode: 'SxUS400', data: { error: error.message } });
  }

  return reply.status(200).send({
    statusCode: 200, intOpCode: 'SxUS200',
    data: { mensaje: 'Contraseña actualizada', usuario: data.user.email, updated: data.user.updated_at }
  });
});

// ─────────────────────────────────────
// Arrancar servidor
// ─────────────────────────────────────
app.listen({ port: 3001, host: '0.0.0.0' }, (err) => {
  if (err) { console.error(err); process.exit(1); }
  console.log('svc-users corriendo en http://localhost:3001');
});