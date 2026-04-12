const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dgmgngfrespeheuzrpso.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbWduZ2ZyZXNwZWhldXpycHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDk2MzMsImV4cCI6MjA4OTg4NTYzM30.fUqQzetG3ZREKVTPQNmv2BzjwFoL3No5gf8qk-0rKuQ'
);

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
  const hoy = new Date();
  const nacimiento = new Date(fecha);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
  return edad >= 18;
}

// ─────────────────────────────────────
// REGISTER  →  POST /api/register
// ─────────────────────────────────────
async function register(req, res) {
  const {
    nombre_completo,
    username,
    email,
    password,
    confirm_password,
    direccion,
    telefono,
    fecha_nacimiento
  } = req.body;

  // --- Validaciones ---
  const errores = {};

  if (!username || !username.trim())
    errores.username = 'El usuario es requerido';

  if (!validarEmail(email))
    errores.email = 'Email inválido';

  if (!nombre_completo || !nombre_completo.trim())
    errores.nombre_completo = 'El nombre completo es requerido';

  if (!direccion || !direccion.trim())
    errores.direccion = 'La dirección es requerida';

  if (!password) {
    errores.password = 'La contraseña es requerida';
  } else if (!validarPassword(password)) {
    errores.password = 'Mínimo 10 caracteres, una mayúscula, un número y un símbolo (!@#$%^&*)';
  }

  if (password !== confirm_password)
    errores.confirm_password = 'Las contraseñas no coinciden';

  if (!fecha_nacimiento) {
    errores.fecha_nacimiento = 'La fecha de nacimiento es requerida';
  } else if (!esMayorDeEdad(fecha_nacimiento)) {
    errores.fecha_nacimiento = 'Debes ser mayor de edad para registrarte';
  }

  if (!telefono || !validarTelefono(telefono))
    errores.telefono = 'Ingresa un número de teléfono válido (10 dígitos)';

  if (Object.keys(errores).length > 0) {
    return res.status(400).json({
      statusCode: 400,
      intOpCode: 'SxUS400',
      data: { errores }
    });
  }

  // --- Crear usuario en Supabase Auth ---
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  });

  if (authError) {
    return res.status(400).json({
      statusCode: 400,
      intOpCode: 'SxUS400',
      data: { error: authError.message }
    });
  }

  // --- Insertar en tabla usuarios ---
  const { data: nuevoUsuario, error: dbError } = await supabase
    .from('usuarios')
    .insert({
      id:                authData.user.id,
      nombre_completo,
      username,
      email,
      direccion,
      telefono,
      permisos_globales: [],
      fecha_inicio:      new Date().toISOString().split('T')[0],
      creado_en:         new Date()
    })
    .select()
    .single();

  if (dbError) {
    return res.status(400).json({
      statusCode: 400,
      intOpCode: 'SxUS400',
      data: { error: dbError.message }
    });
  }

  return res.status(201).json({
    statusCode: 201,
    intOpCode: 'SxUS201',
    data: {
      mensaje: '¡Registro exitoso!',
      usuario: nuevoUsuario
    }
  });
}

// ─────────────────────────────────────
// LOGIN  →  POST /api/login
// ─────────────────────────────────────
async function login(req, res) {
  const { email, password } = req.body;

  const errores = {};

  if (!email || !email.trim())
    errores.email = 'El email es requerido';

  if (!password || !password.trim())
    errores.password = 'La contraseña es requerida';

  if (Object.keys(errores).length > 0) {
    return res.status(400).json({
      statusCode: 400,
      intOpCode: 'SxUS400',
      data: { errores }
    });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(400).json({
      statusCode: 400,
      intOpCode: 'SxUS400',
      data: { error: 'Usuario o contraseña incorrectos' }
    });
  }

  const { data: usuarioData, error: usuarioError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (usuarioError) {
    return res.status(400).json({
      statusCode: 400,
      intOpCode: 'SxUS400',
      data: { error: usuarioError.message }
    });
  }

  // Actualizar last_login
  await supabase
    .from('usuarios')
    .update({ last_login: new Date() })
    .eq('id', data.user.id);

  return res.status(200).json({
    statusCode: 200,
    intOpCode: 'SxUS200',
    data: {
      mensaje: 'Login exitoso',
      token:   data.session.access_token,
      usuario: usuarioData
    }
  });
}

// ─────────────────────────────────────
// AGREGAR USUARIO  →  POST /api/users
// ─────────────────────────────────────
async function addUser(req, res) {
  // Misma lógica que register pero con mensaje diferente
  req.body._fromAdmin = true;
  return register(req, res);
}

// ─────────────────────────────────────
// CAMBIAR CONTRASEÑA  →  POST /api/change-password
// ─────────────────────────────────────
async function changePassword(req, res) {
  const { password, confirm_password, token } = req.body;

  const errores = {};

  if (!password) {
    errores.password = 'La contraseña es requerida';
  } else if (!validarPassword(password)) {
    errores.password = 'Mínimo 10 caracteres, una mayúscula, un número y un símbolo (!@#$%^&*)';
  }

  if (password !== confirm_password)
    errores.confirm_password = 'Las contraseñas no coinciden';

  if (Object.keys(errores).length > 0) {
    return res.status(400).json({
      statusCode: 400,
      intOpCode: 'SxUS400',
      data: { errores }
    });
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token:  token,
    refresh_token: token
  });

  if (sessionError) {
    return res.status(400).json({
      statusCode: 400,
      intOpCode: 'SxUS400',
      data: { error: 'Token inválido o expirado' }
    });
  }

  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) {
    return res.status(400).json({
      statusCode: 400,
      intOpCode: 'SxUS400',
      data: { error: error.message }
    });
  }

  return res.status(200).json({
    statusCode: 200,
    intOpCode: 'SxUS200',
    data: {
      mensaje:  'Contraseña actualizada correctamente',
      usuario:  data.user.email,
      updated:  data.user.updated_at
    }
  });
}

module.exports = { register, login, addUser, changePassword };