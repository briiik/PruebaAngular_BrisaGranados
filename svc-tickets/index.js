// svc-tickets/index.js
// Microservicio de tickets — tecnología: Fastify
// Puerto: 3003
// Responsabilidad: CRUD de tickets, comentarios, historial
// NO valida tokens — eso lo hace el gateway
// Recibe userId en header x-user-id inyectado por el gateway

const Fastify = require('fastify');
const { createClient } = require('@supabase/supabase-js');

const app = Fastify({ logger: false });
app.register(require('@fastify/cors'), {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
});

const supabase = createClient(
  'https://dgmgngfrespeheuzrpso.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbWduZ2ZyZXNwZWhldXpycHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDk2MzMsImV4cCI6MjA4OTg4NTYzM30.fUqQzetG3ZREKVTPQNmv2BzjwFoL3No5gf8qk-0rKuQ'
);

// ── GET /grupos/:grupoId/tickets ──────────────────────────────────────────────
app.get('/grupos/:grupoId/tickets', async (req, reply) => {
  const { grupoId } = req.params;
  const userId      = req.headers['x-user-id'];

  const { data: permisos } = await supabase
    .from('grupo_usuario_permisos')
    .select('permisos(nombre)')
    .eq('grupo_id', grupoId)
    .eq('usuario_id', userId);

  const nombres      = (permisos ?? []).map(p => p.permisos?.nombre);
  const puedeVerTodo = nombres.includes('ticket:viewall');

  let query = supabase
    .from('tickets')
    .select(`
      *, estados ( id, nombre, color ), prioridades ( id, nombre, orden ),
      autor:    usuarios!tickets_autor_id_fkey    ( id, nombre_completo, username ),
      asignado: usuarios!tickets_asignado_id_fkey ( id, nombre_completo, username )
    `)
    .eq('grupo_id', grupoId)
    .order('creado_en', { ascending: false });

  if (!puedeVerTodo) {
    query = query.or(`autor_id.eq.${userId},asignado_id.eq.${userId}`);
  }

  const { data, error } = await query;
  if (error) return reply.status(400).send({ statusCode: 400, intOpCode: 'SxTK400', data: { error: error.message } });
  return reply.status(200).send({ statusCode: 200, intOpCode: 'SxTK200', data });
});

// ── GET /tickets/:id ──────────────────────────────────────────────────────────
app.get('/tickets/:id', async (req, reply) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *, estados ( id, nombre, color ), prioridades ( id, nombre, orden ),
      autor:    usuarios!tickets_autor_id_fkey    ( id, nombre_completo, username ),
      asignado: usuarios!tickets_asignado_id_fkey ( id, nombre_completo, username ),
      comentarios ( id, contenido, creado_en,
        autor: usuarios!comentarios_autor_id_fkey ( id, nombre_completo, username ) ),
      historial_tickets ( id, accion, detalles, creado_en,
        usuarios ( id, nombre_completo, username ) )
    `)
    .eq('id', id).single();

  if (error) return reply.status(404).send({ statusCode: 404, intOpCode: 'SxTK404', data: { error: 'Ticket no encontrado' } });
  return reply.status(200).send({ statusCode: 200, intOpCode: 'SxTK200', data });
});

// ── POST /tickets ─────────────────────────────────────────────────────────────
app.post('/tickets', async (req, reply) => {
  const { grupo_id, titulo, descripcion, estado_id, prioridad_id, asignado_id, fecha_final } = req.body;
  const userId = req.headers['x-user-id'];

  if (!titulo?.trim()) return reply.status(400).send({ statusCode: 400, intOpCode: 'SxTK400', data: { error: 'El título es requerido' } });
  if (!grupo_id)       return reply.status(400).send({ statusCode: 400, intOpCode: 'SxTK400', data: { error: 'grupo_id es requerido' } });

  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({ grupo_id, titulo: titulo.trim(), descripcion, estado_id, prioridad_id, asignado_id, autor_id: userId, fecha_final, creado_en: new Date() })
    .select().single();

  if (error) return reply.status(400).send({ statusCode: 400, intOpCode: 'SxTK400', data: { error: error.message } });

  await supabase.from('historial_tickets').insert({
    ticket_id: ticket.id, usuario_id: userId, accion: 'Ticket creado',
    detalles: { titulo: ticket.titulo }, creado_en: new Date()
  });

  return reply.status(201).send({ statusCode: 201, intOpCode: 'SxTK201', data: ticket });
});

// ── PATCH /tickets/:id ────────────────────────────────────────────────────────
app.patch('/tickets/:id', async (req, reply) => {
  const { id }   = req.params;
  const userId   = req.headers['x-user-id'];
  const campos   = req.body;

  const { data: actual } = await supabase.from('tickets').select('*').eq('id', id).single();
  const { data: ticket, error } = await supabase.from('tickets').update(campos).eq('id', id).select().single();

  if (error) return reply.status(400).send({ statusCode: 400, intOpCode: 'SxTK400', data: { error: error.message } });

  const cambios = {};
  for (const key of Object.keys(campos)) {
    if (actual[key] !== campos[key]) cambios[key] = { antes: actual[key], despues: campos[key] };
  }

  if (Object.keys(cambios).length > 0) {
    await supabase.from('historial_tickets').insert({
      ticket_id: id, usuario_id: userId, accion: 'Ticket editado', detalles: cambios, creado_en: new Date()
    });
  }

  return reply.status(200).send({ statusCode: 200, intOpCode: 'SxTK200', data: ticket });
});

// ── PATCH /tickets/:id/estado ─────────────────────────────────────────────────
app.patch('/tickets/:id/estado', async (req, reply) => {
  const { id }       = req.params;
  const { estado_id } = req.body;
  const userId        = req.headers['x-user-id'];

  const { data: actual } = await supabase.from('tickets').select('estado_id').eq('id', id).single();
  const { data: ticket, error } = await supabase.from('tickets').update({ estado_id }).eq('id', id).select().single();

  if (error) return reply.status(400).send({ statusCode: 400, intOpCode: 'SxTK400', data: { error: error.message } });

  await supabase.from('historial_tickets').insert({
    ticket_id: id, usuario_id: userId, accion: 'Estado cambiado',
    detalles: { estado_anterior: actual.estado_id, estado_nuevo: estado_id }, creado_en: new Date()
  });

  return reply.status(200).send({ statusCode: 200, intOpCode: 'SxTK200', data: ticket });
});

// ── DELETE /tickets/:id ───────────────────────────────────────────────────────
app.delete('/tickets/:id', async (req, reply) => {
  const { id }   = req.params;
  const userId   = req.headers['x-user-id'];

  // Obtener el ticket para saber su grupo_id
  const { data: ticket } = await supabase
    .from('tickets').select('grupo_id, autor_id').eq('id', id).single();

  if (!ticket) {
    return reply.status(404).send({ statusCode: 404, intOpCode: 'SxTK404', data: { error: 'Ticket no encontrado' } });
  }

  // Verificar permiso ticket:delete O ser el autor
  const esAutor = ticket.autor_id === userId;

  if (!esAutor) {
    const { data: permisos } = await supabase
      .from('grupo_usuario_permisos')
      .select('permisos(nombre)')
      .eq('grupo_id', ticket.grupo_id)
      .eq('usuario_id', userId);

    const nombres = (permisos ?? []).map(p => p.permisos?.nombre);

    // Verificar también permisos globales
    const { data: usuario } = await supabase
      .from('usuarios').select('permisos_globales').eq('id', userId).single();

    const { data: globales } = usuario?.permisos_globales?.length
      ? await supabase.from('permisos').select('nombre').in('id', usuario.permisos_globales)
      : { data: [] };

    const nombresGlobales = (globales ?? []).map(p => p.nombre);

    const puedeEliminar = nombresGlobales.includes('superadmin') ||
                          nombresGlobales.includes('ticket:delete') ||
                          nombres.includes('ticket:delete');

    if (!puedeEliminar) {
      return reply.status(403).send({ statusCode: 403, intOpCode: 'SxTK403', data: { error: 'No tienes permiso para eliminar este ticket' } });
    }
  }

  const { error } = await supabase.from('tickets').delete().eq('id', id);
  if (error) return reply.status(400).send({ statusCode: 400, intOpCode: 'SxTK400', data: { error: error.message } });
  return reply.status(200).send({ statusCode: 200, intOpCode: 'SxTK200', data: { mensaje: 'Ticket eliminado' } });
});

// ── POST /tickets/:id/comentarios ─────────────────────────────────────────────
app.post('/tickets/:id/comentarios', async (req, reply) => {
  const { id }       = req.params;
  const { contenido } = req.body;
  const userId        = req.headers['x-user-id'];

  if (!contenido?.trim()) {
    return reply.status(400).send({ statusCode: 400, intOpCode: 'SxTK400', data: { error: 'El comentario no puede estar vacío' } });
  }

  const { data, error } = await supabase
    .from('comentarios')
    .insert({ ticket_id: id, autor_id: userId, contenido: contenido.trim(), creado_en: new Date() })
    .select().single();

  if (error) return reply.status(400).send({ statusCode: 400, intOpCode: 'SxTK400', data: { error: error.message } });

  await supabase.from('historial_tickets').insert({
    ticket_id: id, usuario_id: userId, accion: 'Comentario agregado',
    detalles: { preview: contenido.trim().substring(0, 80) }, creado_en: new Date()
  });

  return reply.status(201).send({ statusCode: 201, intOpCode: 'SxTK201', data });
});

// ── GET /tickets/:id/historial ────────────────────────────────────────────────
app.get('/tickets/:id/historial', async (req, reply) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('historial_tickets')
    .select('*, usuarios ( id, nombre_completo, username )')
    .eq('ticket_id', id)
    .order('creado_en', { ascending: false });

  if (error) return reply.status(400).send({ statusCode: 400, intOpCode: 'SxTK400', data: { error: error.message } });
  return reply.status(200).send({ statusCode: 200, intOpCode: 'SxTK200', data });
});

app.listen({ port: 3003, host: '0.0.0.0' }, (err) => {
  if (err) { console.error(err); process.exit(1); }
  console.log('svc-tickets corriendo en http://localhost:3003');
});