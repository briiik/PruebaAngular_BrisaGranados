// svc-groups/index.js
// Microservicio de grupos — tecnología: UP2U (Fastify minimalista)
// Puerto: 3002
// Responsabilidad: grupos, miembros, permisos por grupo
// NO valida tokens — eso lo hace el gateway

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

// ── GET /grupos ───────────────────────────────────────────────────────────────
app.get('/grupos', async (req, reply) => {
  const userId = req.headers['x-user-id'];

  const { data, error } = await supabase
    .from('grupo_miembros')
    .select(`
      grupo_id, fecha_unido,
      grupos ( id, nombre, descripcion, creado_en, creador_id,
        usuarios!grupos_creador_id_fkey ( nombre_completo, username ) )
    `)
    .eq('usuario_id', userId);

  if (error) return reply.status(400).send({ statusCode: 400, intOpCode: 'SxGR400', data: { error: error.message } });

  const grupos = data.map(m => ({ ...m.grupos, fecha_unido: m.fecha_unido }));
  return reply.status(200).send({ statusCode: 200, intOpCode: 'SxGR200', data: grupos });
});

// ── GET /grupos/:id ───────────────────────────────────────────────────────────
app.get('/grupos/:id', async (req, reply) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('grupos')
    .select('*, usuarios!grupos_creador_id_fkey ( nombre_completo, username )')
    .eq('id', id)
    .single();

  if (error) return reply.status(404).send({ statusCode: 404, intOpCode: 'SxGR404', data: { error: 'Grupo no encontrado' } });
  return reply.status(200).send({ statusCode: 200, intOpCode: 'SxGR200', data });
});

// ── POST /grupos ──────────────────────────────────────────────────────────────
app.post('/grupos', async (req, reply) => {
  const { nombre, descripcion } = req.body;
  const userId = req.headers['x-user-id'];

  if (!nombre?.trim()) {
    return reply.status(400).send({ statusCode: 400, intOpCode: 'SxGR400', data: { error: 'El nombre es requerido' } });
  }

  const { data: grupo, error } = await supabase
    .from('grupos')
    .insert({ nombre: nombre.trim(), descripcion, creador_id: userId, creado_en: new Date() })
    .select().single();

  if (error) return reply.status(400).send({ statusCode: 400, intOpCode: 'SxGR400', data: { error: error.message } });

  await supabase.from('grupo_miembros').insert({ grupo_id: grupo.id, usuario_id: userId, fecha_unido: new Date() });

  const { data: todosPermisos } = await supabase.from('permisos').select('id');
  if (todosPermisos?.length) {
    await supabase.from('grupo_usuario_permisos').insert(
      todosPermisos.map(p => ({ grupo_id: grupo.id, usuario_id: userId, permiso_id: p.id }))
    );
  }

  return reply.status(201).send({ statusCode: 201, intOpCode: 'SxGR201', data: grupo });
});

// ── PATCH /grupos/:id ─────────────────────────────────────────────────────────
app.patch('/grupos/:id', async (req, reply) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;

  if (!nombre?.trim()) {
    return reply.status(400).send({ statusCode: 400, intOpCode: 'SxGR400', data: { error: 'El nombre es requerido' } });
  }

  const { data, error } = await supabase
    .from('grupos').update({ nombre: nombre.trim(), descripcion }).eq('id', id).select().single();

  if (error) return reply.status(400).send({ statusCode: 400, intOpCode: 'SxGR400', data: { error: error.message } });
  return reply.status(200).send({ statusCode: 200, intOpCode: 'SxGR200', data });
});

// ── DELETE /grupos/:id ────────────────────────────────────────────────────────
app.delete('/grupos/:id', async (req, reply) => {
  const { id } = req.params;

  await supabase.from('grupo_usuario_permisos').delete().eq('grupo_id', id);
  await supabase.from('grupo_miembros').delete().eq('grupo_id', id);

  const { error } = await supabase.from('grupos').delete().eq('id', id);
  if (error) return reply.status(400).send({ statusCode: 400, intOpCode: 'SxGR400', data: { error: error.message } });

  return reply.status(200).send({ statusCode: 200, intOpCode: 'SxGR200', data: { mensaje: 'Grupo eliminado correctamente' } });
});

// ── GET /grupos/:id/miembros ──────────────────────────────────────────────────
app.get('/grupos/:id/miembros', async (req, reply) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('grupo_miembros')
    .select('fecha_unido, usuarios ( id, nombre_completo, username, email )')
    .eq('grupo_id', id);

  if (error) return reply.status(400).send({ statusCode: 400, intOpCode: 'SxGR400', data: { error: error.message } });
  return reply.status(200).send({ statusCode: 200, intOpCode: 'SxGR200', data });
});

// ── POST /grupos/:id/miembros ─────────────────────────────────────────────────
app.post('/grupos/:id/miembros', async (req, reply) => {
  const { id } = req.params;
  const { usuario_id, permisos_ids } = req.body;

  if (!usuario_id) {
    return reply.status(400).send({ statusCode: 400, intOpCode: 'SxGR400', data: { error: 'usuario_id es requerido' } });
  }

  const { data: yaExiste } = await supabase
    .from('grupo_miembros').select('usuario_id').eq('grupo_id', id).eq('usuario_id', usuario_id).single();

  if (yaExiste) {
    return reply.status(400).send({ statusCode: 400, intOpCode: 'SxGR400', data: { error: 'El usuario ya es miembro' } });
  }

  const { data, error } = await supabase
    .from('grupo_miembros').insert({ grupo_id: id, usuario_id, fecha_unido: new Date() }).select().single();

  if (error) return reply.status(400).send({ statusCode: 400, intOpCode: 'SxGR400', data: { error: error.message } });

  let permisosAAsignar = [];
  if (Array.isArray(permisos_ids)) {
    permisosAAsignar = permisos_ids;
  } else {
    const { data: def } = await supabase.from('permisos').select('id').in('nombre', ['group:view', 'ticket:view']);
    permisosAAsignar = (def ?? []).map(p => p.id);
  }

  if (permisosAAsignar.length > 0) {
    await supabase.from('grupo_usuario_permisos').insert(
      permisosAAsignar.map(permiso_id => ({ grupo_id: id, usuario_id, permiso_id }))
    );
  }

  return reply.status(201).send({ statusCode: 201, intOpCode: 'SxGR201', data });
});

// ── DELETE /grupos/:id/miembros/:usuarioId ────────────────────────────────────
app.delete('/grupos/:id/miembros/:usuarioId', async (req, reply) => {
  const { id, usuarioId } = req.params;

  await supabase.from('grupo_usuario_permisos').delete().eq('grupo_id', id).eq('usuario_id', usuarioId);
  const { error } = await supabase.from('grupo_miembros').delete().eq('grupo_id', id).eq('usuario_id', usuarioId);

  if (error) return reply.status(400).send({ statusCode: 400, intOpCode: 'SxGR400', data: { error: error.message } });
  return reply.status(200).send({ statusCode: 200, intOpCode: 'SxGR200', data: { mensaje: 'Miembro eliminado' } });
});

// ── GET /grupos/:id/permisos/:usuarioId ───────────────────────────────────────
app.get('/grupos/:id/permisos/:usuarioId', async (req, reply) => {
  const { id, usuarioId } = req.params;

  const { data, error } = await supabase
    .from('grupo_usuario_permisos')
    .select('permisos ( id, nombre, descripcion )')
    .eq('grupo_id', id).eq('usuario_id', usuarioId);

  if (error) return reply.status(400).send({ statusCode: 400, intOpCode: 'SxGR400', data: { error: error.message } });

  const permisos = data.map(p => p.permisos);
  return reply.status(200).send({ statusCode: 200, intOpCode: 'SxGR200', data: permisos });
});

// ── PUT /grupos/:id/miembros/:usuarioId/permisos ──────────────────────────────
app.put('/grupos/:id/miembros/:usuarioId/permisos', async (req, reply) => {
  const { id, usuarioId } = req.params;
  const { permisos_ids }  = req.body;

  if (!Array.isArray(permisos_ids)) {
    return reply.status(400).send({ statusCode: 400, intOpCode: 'SxGR400', data: { error: 'permisos_ids debe ser un array' } });
  }

  await supabase.from('grupo_usuario_permisos').delete().eq('grupo_id', id).eq('usuario_id', usuarioId);

  if (permisos_ids.length > 0) {
    const { error } = await supabase.from('grupo_usuario_permisos').insert(
      permisos_ids.map(permiso_id => ({ grupo_id: id, usuario_id: usuarioId, permiso_id }))
    );
    if (error) return reply.status(400).send({ statusCode: 400, intOpCode: 'SxGR400', data: { error: error.message } });
  }

  return reply.status(200).send({ statusCode: 200, intOpCode: 'SxGR200', data: { mensaje: 'Permisos actualizados correctamente' } });
});

// ── GET /catalogos/estados ────────────────────────────────────────────────────
app.get('/catalogos/estados', async (req, reply) => {
  const { data, error } = await supabase.from('estados').select('*');
  if (error) return reply.status(400).send({ statusCode: 400, intOpCode: 'SxCA400', data: { error: error.message } });
  return reply.status(200).send({ statusCode: 200, intOpCode: 'SxCA200', data });
});

// ── GET /catalogos/prioridades ────────────────────────────────────────────────
app.get('/catalogos/prioridades', async (req, reply) => {
  const { data, error } = await supabase.from('prioridades').select('*').order('orden');
  if (error) return reply.status(400).send({ statusCode: 400, intOpCode: 'SxCA400', data: { error: error.message } });
  return reply.status(200).send({ statusCode: 200, intOpCode: 'SxCA200', data });
});

// ── GET /catalogos/permisos ───────────────────────────────────────────────────
app.get('/catalogos/permisos', async (req, reply) => {
  const { data, error } = await supabase.from('permisos').select('*');
  if (error) return reply.status(400).send({ statusCode: 400, intOpCode: 'SxCA400', data: { error: error.message } });
  return reply.status(200).send({ statusCode: 200, intOpCode: 'SxCA200', data });
});

app.listen({ port: 3002, host: '0.0.0.0' }, (err) => {
  if (err) { console.error(err); process.exit(1); }
  console.log('svc-groups corriendo en http://localhost:3002');
});