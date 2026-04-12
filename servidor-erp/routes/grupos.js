const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dgmgngfrespeheuzrpso.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbWduZ2ZyZXNwZWhldXpycHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDk2MzMsImV4cCI6MjA4OTg4NTYzM30.fUqQzetG3ZREKVTPQNmv2BzjwFoL3No5gf8qk-0rKuQ'
);

// ── GET /api/grupos  →  grupos del usuario autenticado ────────────────────────
async function getGruposDeUsuario(req, res) {
  const userId = req.userId; // lo inyecta el middleware de auth

  // Busca los grupos donde el usuario es miembro
  const { data, error } = await supabase
    .from('grupo_miembros')
    .select(`
      grupo_id,
      fecha_unido,
      grupos (
        id,
        nombre,
        descripcion,
        creado_en,
        creador_id,
        usuarios!grupos_creador_id_fkey ( nombre_completo, username )
      )
    `)
    .eq('usuario_id', userId);

  if (error) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxGR400', data: { error: error.message } });
  }

  const grupos = data.map(m => ({
    ...m.grupos,
    fecha_unido: m.fecha_unido
  }));

  return res.status(200).json({ statusCode: 200, intOpCode: 'SxGR200', data: grupos });
}

// ── PATCH /api/grupos/:id  →  editar grupo ────────────────────────────────────
async function editarGrupo(req, res) {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;

  if (!nombre?.trim()) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxGR400', data: { error: 'El nombre es requerido' } });
  }

  const { data, error } = await supabase
    .from('grupos')
    .update({ nombre: nombre.trim(), descripcion })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxGR400', data: { error: error.message } });
  }

  return res.status(200).json({ statusCode: 200, intOpCode: 'SxGR200', data });
}

// ── GET /api/grupos/:id  →  detalle de un grupo ───────────────────────────────
async function getGrupoById(req, res) {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('grupos')
    .select(`
      *,
      usuarios!grupos_creador_id_fkey ( nombre_completo, username )
    `)
    .eq('id', id)
    .single();

  if (error) {
    return res.status(404).json({ statusCode: 404, intOpCode: 'SxGR404', data: { error: 'Grupo no encontrado' } });
  }

  return res.status(200).json({ statusCode: 200, intOpCode: 'SxGR200', data });
}

// ── GET /api/grupos/:id/miembros  →  miembros + permisos del grupo ────────────
async function getMiembros(req, res) {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('grupo_miembros')
    .select(`
      fecha_unido,
      usuarios ( id, nombre_completo, username, email )
    `)
    .eq('grupo_id', id);

  if (error) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxGR400', data: { error: error.message } });
  }

  return res.status(200).json({ statusCode: 200, intOpCode: 'SxGR200', data });
}

// ── GET /api/grupos/:id/permisos/:usuarioId  →  permisos del usuario en grupo ─
async function getPermisosDeUsuarioEnGrupo(req, res) {
  const { id, usuarioId } = req.params;

  const { data, error } = await supabase
    .from('grupo_usuario_permisos')
    .select(`
      permisos ( id, nombre, descripcion )
    `)
    .eq('grupo_id', id)
    .eq('usuario_id', usuarioId);

  if (error) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxGR400', data: { error: error.message } });
  }

  const permisos = data.map(p => p.permisos);
  return res.status(200).json({ statusCode: 200, intOpCode: 'SxGR200', data: permisos });
}

// ── POST /api/grupos  →  crear grupo ─────────────────────────────────────────
async function crearGrupo(req, res) {
  const { nombre, descripcion } = req.body;
  const userId = req.userId;

  if (!nombre?.trim()) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxGR400', data: { error: 'El nombre es requerido' } });
  }

  const { data: grupo, error } = await supabase
    .from('grupos')
    .insert({ nombre: nombre.trim(), descripcion, creador_id: userId, creado_en: new Date() })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxGR400', data: { error: error.message } });
  }

  // Agregar creador como miembro
  await supabase.from('grupo_miembros').insert({
    grupo_id: grupo.id,
    usuario_id: userId,
    fecha_unido: new Date()
  });

  // ← NUEVO: asignar todos los permisos al creador
  const { data: todosPermisos } = await supabase.from('permisos').select('id');
  if (todosPermisos?.length) {
    await supabase.from('grupo_usuario_permisos').insert(
      todosPermisos.map(p => ({
        grupo_id:   grupo.id,
        usuario_id: userId,
        permiso_id: p.id
      }))
    );
  }

  return res.status(201).json({ statusCode: 201, intOpCode: 'SxGR201', data: grupo });
}

// ── POST /api/grupos/:id/miembros  →  agregar miembro ────────────────────────
async function agregarMiembro(req, res) {
  const { id } = req.params;
  const { usuario_id, permisos_ids } = req.body;

  if (!usuario_id) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxGR400', data: { error: 'usuario_id es requerido' } });
  }

  // Verificar que no sea ya miembro
  const { data: yaExiste } = await supabase
    .from('grupo_miembros')
    .select('usuario_id')
    .eq('grupo_id', id)
    .eq('usuario_id', usuario_id)
    .single();

  if (yaExiste) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxGR400', data: { error: 'El usuario ya es miembro de este grupo' } });
  }

  // Agregar como miembro
  const { data, error } = await supabase
    .from('grupo_miembros')
    .insert({ grupo_id: id, usuario_id, fecha_unido: new Date() })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxGR400', data: { error: error.message } });
  }

  // Determinar qué permisos asignar
  let permisosAAsignar = [];

  if (permisos_ids && permisos_ids.length > 0) {
    // Si el frontend envió permisos específicos, usar esos
    permisosAAsignar = permisos_ids;
  } else {
    // Si no, asignar permisos por default: group:view y ticket:view
    const { data: permisosDefault } = await supabase
      .from('permisos')
      .select('id')
      .in('nombre', ['group:view', 'ticket:view']);
    permisosAAsignar = (permisosDefault ?? []).map(p => p.id);
  }

  if (permisosAAsignar.length > 0) {
    await supabase.from('grupo_usuario_permisos').insert(
      permisosAAsignar.map((permiso_id) => ({
        grupo_id:   id,
        usuario_id: usuario_id,
        permiso_id
      }))
    );
  }

  return res.status(201).json({ statusCode: 201, intOpCode: 'SxGR201', data });
}

// ── GET /api/usuarios/buscar?email=  →  buscar usuario por email ──────────────
async function buscarUsuarioPorEmail(req, res) {
  const { email } = req.query;

  if (!email?.trim()) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxUS400', data: { error: 'Email requerido' } });
  }

  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre_completo, username, email')
    .ilike('email', email.trim())
    .single();

  if (error || !data) {
    return res.status(404).json({ statusCode: 404, intOpCode: 'SxUS404', data: { error: 'Usuario no encontrado' } });
  }

  return res.status(200).json({ statusCode: 200, intOpCode: 'SxUS200', data });
}

// ── PUT /api/grupos/:id/miembros/:usuarioId/permisos  →  actualizar permisos ─
async function actualizarPermisosMiembro(req, res) {
  const { id, usuarioId } = req.params;
  const { permisos_ids } = req.body;  // array de UUIDs de permisos

  if (!Array.isArray(permisos_ids)) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxGR400', data: { error: 'permisos_ids debe ser un array' } });
  }

  // Eliminar todos los permisos actuales del miembro en este grupo
  await supabase
    .from('grupo_usuario_permisos')
    .delete()
    .eq('grupo_id', id)
    .eq('usuario_id', usuarioId);

  // Insertar los nuevos permisos (si hay alguno)
  if (permisos_ids.length > 0) {
    const { error } = await supabase
      .from('grupo_usuario_permisos')
      .insert(
        permisos_ids.map(permiso_id => ({
          grupo_id:   id,
          usuario_id: usuarioId,
          permiso_id
        }))
      );

    if (error) {
      return res.status(400).json({ statusCode: 400, intOpCode: 'SxGR400', data: { error: error.message } });
    }
  }

  return res.status(200).json({ statusCode: 200, intOpCode: 'SxGR200', data: { mensaje: 'Permisos actualizados correctamente' } });
}

// ── DELETE /api/grupos/:id/miembros/:usuarioId  →  eliminar miembro ───────────
async function eliminarMiembro(req, res) {
  const { id, usuarioId } = req.params;

  // Eliminar permisos del miembro en el grupo
  await supabase
    .from('grupo_usuario_permisos')
    .delete()
    .eq('grupo_id', id)
    .eq('usuario_id', usuarioId);

  // Eliminar al miembro del grupo
  const { error } = await supabase
    .from('grupo_miembros')
    .delete()
    .eq('grupo_id', id)
    .eq('usuario_id', usuarioId);

  if (error) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxGR400', data: { error: error.message } });
  }

  return res.status(200).json({ statusCode: 200, intOpCode: 'SxGR200', data: { mensaje: 'Miembro eliminado del grupo' } });
}

// ── DELETE /api/grupos/:id  →  eliminar grupo ─────────────────────────────────
async function eliminarGrupo(req, res) {
  const { id } = req.params;

  // Eliminar primero los registros relacionados para no violar foreign keys
  await supabase.from('grupo_usuario_permisos').delete().eq('grupo_id', id);
  await supabase.from('grupo_miembros').delete().eq('grupo_id', id);

  const { error } = await supabase
    .from('grupos')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxGR400', data: { error: error.message } });
  }

  return res.status(200).json({ statusCode: 200, intOpCode: 'SxGR200', data: { mensaje: 'Grupo eliminado correctamente' } });
}

// ── POST /api/grupos/:id/permisos  →  asignar permiso a usuario en grupo ──────
async function asignarPermiso(req, res) {
  const { id } = req.params;
  const { usuario_id, permiso_id } = req.body;

  if (!usuario_id || !permiso_id) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxGR400', data: { error: 'usuario_id y permiso_id son requeridos' } });
  }

  const { data, error } = await supabase
    .from('grupo_usuario_permisos')
    .insert({ grupo_id: id, usuario_id, permiso_id })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxGR400', data: { error: error.message } });
  }

  return res.status(201).json({ statusCode: 201, intOpCode: 'SxGR201', data });
}

// ── DELETE /api/grupos/:id/permisos  →  quitar permiso a usuario en grupo ─────
async function quitarPermiso(req, res) {
  const { id } = req.params;
  const { usuario_id, permiso_id } = req.body;

  const { error } = await supabase
    .from('grupo_usuario_permisos')
    .delete()
    .eq('grupo_id', id)
    .eq('usuario_id', usuario_id)
    .eq('permiso_id', permiso_id);

  if (error) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxGR400', data: { error: error.message } });
  }

  return res.status(200).json({ statusCode: 200, intOpCode: 'SxGR200', data: { mensaje: 'Permiso eliminado' } });
}

module.exports = {
  getGruposDeUsuario,
  getGrupoById,
  getMiembros,
  getPermisosDeUsuarioEnGrupo,
  crearGrupo,
  editarGrupo,
  eliminarGrupo,
  agregarMiembro,
  eliminarMiembro,
  actualizarPermisosMiembro,
  asignarPermiso,
  quitarPermiso,
  buscarUsuarioPorEmail,
};