const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dgmgngfrespeheuzrpso.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbWduZ2ZyZXNwZWhldXpycHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDk2MzMsImV4cCI6MjA4OTg4NTYzM30.fUqQzetG3ZREKVTPQNmv2BzjwFoL3No5gf8qk-0rKuQ'
);

// ── GET /api/grupos/:grupoId/tickets ─────────────────────────────────────────
async function getTicketsPorGrupo(req, res) {
  const { grupoId } = req.params;
  const userId = req.userId;

  // Verificar si el usuario tiene ticket:viewall en este grupo
  const { data: permisos } = await supabase
    .from('grupo_usuario_permisos')
    .select('permisos(nombre)')
    .eq('grupo_id', grupoId)
    .eq('usuario_id', userId);

  const nombresPermisos = (permisos ?? []).map((p) => p.permisos?.nombre);
  const puedeVerTodo = nombresPermisos.includes('ticket:viewall');

  let query = supabase
    .from('tickets')
    .select(`
      *,
      estados   ( id, nombre, color ),
      prioridades ( id, nombre, orden ),
      autor:    usuarios!tickets_autor_id_fkey    ( id, nombre_completo, username ),
      asignado: usuarios!tickets_asignado_id_fkey ( id, nombre_completo, username )
    `)
    .eq('grupo_id', grupoId)
    .order('creado_en', { ascending: false });

  // Si no tiene ticket:viewall, solo ve sus tickets propios
  if (!puedeVerTodo) {
    query = query.or(`autor_id.eq.${userId},asignado_id.eq.${userId}`);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxTK400', data: { error: error.message } });
  }

  return res.status(200).json({ statusCode: 200, intOpCode: 'SxTK200', data });
}

// ── GET /api/tickets/:id ──────────────────────────────────────────────────────
async function getTicketById(req, res) {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      estados   ( id, nombre, color ),
      prioridades ( id, nombre, orden ),
      autor:    usuarios!tickets_autor_id_fkey    ( id, nombre_completo, username ),
      asignado: usuarios!tickets_asignado_id_fkey ( id, nombre_completo, username ),
      comentarios (
        id, contenido, creado_en,
        autor: usuarios!comentarios_autor_id_fkey ( id, nombre_completo, username )
      ),
      historial_tickets (
        id, accion, detalles, creado_en,
        usuarios ( id, nombre_completo, username )
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    return res.status(404).json({ statusCode: 404, intOpCode: 'SxTK404', data: { error: 'Ticket no encontrado' } });
  }

  return res.status(200).json({ statusCode: 200, intOpCode: 'SxTK200', data });
}

// ── POST /api/tickets ─────────────────────────────────────────────────────────
async function crearTicket(req, res) {
  const { grupo_id, titulo, descripcion, estado_id, prioridad_id, asignado_id, fecha_final } = req.body;
  const userId = req.userId;

  if (!titulo?.trim()) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxTK400', data: { error: 'El título es requerido' } });
  }
  if (!grupo_id) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxTK400', data: { error: 'grupo_id es requerido' } });
  }

  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      grupo_id,
      titulo:      titulo.trim(),
      descripcion,
      estado_id,
      prioridad_id,
      asignado_id,
      autor_id:    userId,
      fecha_final,
      creado_en:   new Date()
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxTK400', data: { error: error.message } });
  }

  // Registrar en historial
  await supabase.from('historial_tickets').insert({
    ticket_id:  ticket.id,
    usuario_id: userId,
    accion:     'Ticket creado',
    detalles:   { titulo: ticket.titulo },
    creado_en:  new Date()
  });

  return res.status(201).json({ statusCode: 201, intOpCode: 'SxTK201', data: ticket });
}

// ── PATCH /api/tickets/:id ────────────────────────────────────────────────────
async function editarTicket(req, res) {
  const { id } = req.params;
  const userId = req.userId;
  const campos = req.body;

  // Obtener ticket actual para comparar cambios en historial
  const { data: actual } = await supabase
    .from('tickets').select('*').eq('id', id).single();

  const { data: ticket, error } = await supabase
    .from('tickets')
    .update(campos)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxTK400', data: { error: error.message } });
  }

  // Registrar cambios en historial
  const cambios = {};
  for (const key of Object.keys(campos)) {
    if (actual[key] !== campos[key]) {
      cambios[key] = { antes: actual[key], despues: campos[key] };
    }
  }

  if (Object.keys(cambios).length > 0) {
    await supabase.from('historial_tickets').insert({
      ticket_id:  id,
      usuario_id: userId,
      accion:     'Ticket editado',
      detalles:   cambios,
      creado_en:  new Date()
    });
  }

  return res.status(200).json({ statusCode: 200, intOpCode: 'SxTK200', data: ticket });
}

// ── PATCH /api/tickets/:id/estado ─────────────────────────────────────────────
async function cambiarEstado(req, res) {
  const { id } = req.params;
  const { estado_id } = req.body;
  const userId = req.userId;

  const { data: actual } = await supabase
    .from('tickets').select('estado_id').eq('id', id).single();

  const { data: ticket, error } = await supabase
    .from('tickets')
    .update({ estado_id })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxTK400', data: { error: error.message } });
  }

  await supabase.from('historial_tickets').insert({
    ticket_id:  id,
    usuario_id: userId,
    accion:     'Estado cambiado',
    detalles:   { estado_anterior: actual.estado_id, estado_nuevo: estado_id },
    creado_en:  new Date()
  });

  return res.status(200).json({ statusCode: 200, intOpCode: 'SxTK200', data: ticket });
}

// ── DELETE /api/tickets/:id ───────────────────────────────────────────────────
async function eliminarTicket(req, res) {
  const { id } = req.params;

  const { error } = await supabase.from('tickets').delete().eq('id', id);

  if (error) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxTK400', data: { error: error.message } });
  }

  return res.status(200).json({ statusCode: 200, intOpCode: 'SxTK200', data: { mensaje: 'Ticket eliminado' } });
}

// ── POST /api/tickets/:id/comentarios ─────────────────────────────────────────
async function agregarComentario(req, res) {
  const { id } = req.params;
  const { contenido } = req.body;
  const userId = req.userId;

  if (!contenido?.trim()) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxTK400', data: { error: 'El comentario no puede estar vacío' } });
  }

  const { data, error } = await supabase
    .from('comentarios')
    .insert({ ticket_id: id, autor_id: userId, contenido: contenido.trim(), creado_en: new Date() })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxTK400', data: { error: error.message } });
  }

  await supabase.from('historial_tickets').insert({
    ticket_id:  id,
    usuario_id: userId,
    accion:     'Comentario agregado',
    detalles:   { preview: contenido.trim().substring(0, 80) },
    creado_en:  new Date()
  });

  return res.status(201).json({ statusCode: 201, intOpCode: 'SxTK201', data });
}

// ── GET /api/tickets/:id/historial ────────────────────────────────────────────
async function getHistorial(req, res) {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('historial_tickets')
    .select(`*, usuarios ( id, nombre_completo, username )`)
    .eq('ticket_id', id)
    .order('creado_en', { ascending: false });

  if (error) {
    return res.status(400).json({ statusCode: 400, intOpCode: 'SxTK400', data: { error: error.message } });
  }

  return res.status(200).json({ statusCode: 200, intOpCode: 'SxTK200', data });
}

module.exports = {
  getTicketsPorGrupo,
  getTicketById,
  crearTicket,
  editarTicket,
  cambiarEstado,
  eliminarTicket,
  agregarComentario,
  getHistorial
};