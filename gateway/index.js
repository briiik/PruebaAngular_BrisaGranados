// gateway/index.js
// API Gateway — tecnología: Fastify
// Puerto: 3000 (mismo que tenía mi servidor anterior — el frontend no cambia)
// Responsabilidad:
//   1. Recibir TODOS los requests del frontend
//   2. Validar el token JWT
//   3. Verificar permisos por endpoint
//   4. Enrutar al microservicio correcto inyectando x-user-id en el header

const Fastify  = require('fastify');
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

// ─────────────────────────────────────────────────────────────────────────────
// URLS DE LOS MICROSERVICIOS
// ─────────────────────────────────────────────────────────────────────────────
const SERVICES = {
  users:   'http://localhost:3001',
  groups:  'http://localhost:3002',
  tickets: 'http://localhost:3003',
};

// ─────────────────────────────────────────────────────────────────────────────
// MAPA DE RUTAS → MICROSERVICIO
// Cada entrada: [método, patrón de ruta, servicio destino, ruta en el servicio]
// ─────────────────────────────────────────────────────────────────────────────
const ROUTE_MAP = [
  // ── Usuarios (público) ──
  ['POST', '/api/register',       'users',  '/register'],
  ['POST', '/api/login',          'users',  '/login'],
  // ── Usuarios (protegido) ──
  ['POST', '/api/users',          'users',  '/register'],
  ['POST', '/api/change-password','users',  '/change-password'],
  ['GET',  '/api/usuarios/buscar','users',  '/buscar'],
  ['PATCH', '/api/usuarios/:id', 'users', '/usuarios/:id'],
  // ── Grupos ──
  ['GET',    '/api/grupos',                         'groups', '/grupos'],
  ['POST',   '/api/grupos',                         'groups', '/grupos'],
  ['GET',    '/api/grupos/:id',                     'groups', '/grupos/:id'],
  ['PATCH',  '/api/grupos/:id',                     'groups', '/grupos/:id'],
  ['DELETE', '/api/grupos/:id',                     'groups', '/grupos/:id'],
  ['GET',    '/api/grupos/:id/miembros',             'groups', '/grupos/:id/miembros'],
  ['POST',   '/api/grupos/:id/miembros',             'groups', '/grupos/:id/miembros'],
  ['DELETE', '/api/grupos/:id/miembros/:usuarioId',  'groups', '/grupos/:id/miembros/:usuarioId'],
  ['GET',    '/api/grupos/:id/permisos/:usuarioId',  'groups', '/grupos/:id/permisos/:usuarioId'],
  ['PUT',    '/api/grupos/:id/miembros/:usuarioId/permisos', 'groups', '/grupos/:id/miembros/:usuarioId/permisos'],
  // ── Tickets ──
  ['GET',    '/api/grupos/:grupoId/tickets',  'tickets', '/grupos/:grupoId/tickets'],
  ['POST',   '/api/tickets',                  'tickets', '/tickets'],
  ['GET',    '/api/tickets/:id',              'tickets', '/tickets/:id'],
  ['PATCH',  '/api/tickets/:id',              'tickets', '/tickets/:id'],
  ['PATCH',  '/api/tickets/:id/estado',       'tickets', '/tickets/:id/estado'],
  ['DELETE', '/api/tickets/:id',              'tickets', '/tickets/:id'],
  ['POST',   '/api/tickets/:id/comentarios',  'tickets', '/tickets/:id/comentarios'],
  ['GET',    '/api/tickets/:id/historial',    'tickets', '/tickets/:id/historial'],
  // ── Catálogos ──
  ['GET', '/api/estados',     'groups', '/catalogos/estados'],
  ['GET', '/api/prioridades', 'groups', '/catalogos/prioridades'],
  ['GET', '/api/permisos',    'groups', '/catalogos/permisos'],
];

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS PÚBLICAS (no requieren token)
// ─────────────────────────────────────────────────────────────────────────────
const PUBLIC_ROUTES = [
  'POST /api/register',
  'POST /api/login',
];

// ─────────────────────────────────────────────────────────────────────────────
// MAPA DE PERMISOS POR ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
const ENDPOINT_PERMISOS = {
  'POST /api/grupos':                              'group:create',
  'PATCH /api/grupos/:id':                         'group:edit',
  'DELETE /api/grupos/:id':                        'group:delete',
  'POST /api/grupos/:id/miembros':                 'group:add',
  'DELETE /api/grupos/:id/miembros/:id':           'group:add',      // ← :id no :usuarioId
  'PUT /api/grupos/:id/miembros/:id/permisos':     'group:manage',   // ← ya estaba bien
  'POST /api/tickets':                             'ticket:create',
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Normaliza una URL con UUIDs reales a una con :id para matchear el mapa
function normalizarRuta(method, path) {
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  return `${method} ${path.replace(uuidRegex, ':id')}`;
}

// Reemplaza los :param de la ruta destino con los valores reales de req.params
function resolverRutaDestino(plantilla, params) {
  let ruta = plantilla;
  for (const [key, value] of Object.entries(params)) {
    ruta = ruta.replace(`:${key}`, value);
  }
  return ruta;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDAR TOKEN
// ─────────────────────────────────────────────────────────────────────────────
async function validarToken(token) {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICAR PERMISO
// ─────────────────────────────────────────────────────────────────────────────
async function verificarPermiso(userId, permisoRequerido, grupoId) {
  // 1. Verificar permisos globales
  const { data: usuario } = await supabase
    .from('usuarios').select('permisos_globales').eq('id', userId).single();

  if (usuario?.permisos_globales?.length) {
    const { data: globales } = await supabase
      .from('permisos').select('nombre').in('id', usuario.permisos_globales);

    const nombres = (globales ?? []).map(p => p.nombre);
    if (nombres.includes('superadmin') || nombres.includes(permisoRequerido)) return true;
  }

  // 2. Verificar permiso de grupo
  if (grupoId) {
    const { data: permisoGrupo } = await supabase
      .from('grupo_usuario_permisos')
      .select('permisos(nombre)')
      .eq('grupo_id', grupoId)
      .eq('usuario_id', userId);

    const nombresGrupo = (permisoGrupo ?? []).map(p => p.permisos?.nombre);
    if (nombresGrupo.includes(permisoRequerido)) return true;
  }

  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROXY — reenvía el request al microservicio correcto
// ─────────────────────────────────────────────────────────────────────────────
async function proxy(serviceUrl, rutaDestino, req, reply) {
  const url = `${serviceUrl}${rutaDestino}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;
  
  const esDelete = req.method === 'DELETE';  // ← agregar esto

  const headers = {
    'x-user-id':     req.userId ?? '',
    'Authorization': req.headers['authorization'] ?? '',
    ...(!esDelete && { 'Content-Type': 'application/json' }),  // ← solo si no es DELETE
  };

  try {
    const response = await fetch(url, {
      method:  req.method,
      headers,
      body: ['GET', 'DELETE'].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    const data = await response.json();
    return reply.status(response.status).send(data);
  } catch (err) {
    return reply.status(502).send({
      statusCode: 502,
      intOpCode:  'SxGW502',
      data: { error: `Servicio no disponible: ${err.message}` }
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRAR TODAS LAS RUTAS DINÁMICAMENTE
// ─────────────────────────────────────────────────────────────────────────────
for (const [method, rutaGateway, servicio, rutaServicio] of ROUTE_MAP) {

  app.route({
    method,
    url: rutaGateway,

    handler: async (req, reply) => {
      const esPublica = PUBLIC_ROUTES.includes(`${method} ${rutaGateway}`);

      // ── 1. Rutas públicas → proxy directo sin validar token ───────────────
      if (esPublica) {
        const rutaDestino = resolverRutaDestino(rutaServicio, req.params);
        return proxy(SERVICES[servicio], rutaDestino, req, reply);
      }

      // ── 2. Validar token ──────────────────────────────────────────────────
      const token = req.headers['authorization']?.split(' ')[1];
      if (!token) {
        return reply.status(401).send({ statusCode: 401, intOpCode: 'SxAU401', data: { error: 'Token requerido' } });
      }

      const user = await validarToken(token);
      if (!user) {
        return reply.status(401).send({ statusCode: 401, intOpCode: 'SxAU401', data: { error: 'Token inválido o expirado' } });
      }

      req.userId = user.id;

      // ── 3. Verificar permiso si el endpoint lo requiere ───────────────────
      const routeKey        = normalizarRuta(method, rutaGateway);
      const permisoRequerido = ENDPOINT_PERMISOS[routeKey];

      if (permisoRequerido) {
        const grupoId = req.params.id ?? req.params.grupoId ?? req.body?.grupo_id;
        const tiene   = await verificarPermiso(user.id, permisoRequerido, grupoId);

        if (!tiene) {
          return reply.status(403).send({
            statusCode: 403,
            intOpCode:  'SxGW403',
            data: { error: `Permiso requerido: ${permisoRequerido}` }
          });
        }
      }

      // ── 4. Proxy al microservicio ─────────────────────────────────────────
      const rutaDestino = resolverRutaDestino(rutaServicio, req.params);
      return proxy(SERVICES[servicio], rutaDestino, req, reply);
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
app.listen({ port: 3000, host: '0.0.0.0' }, (err) => {
  if (err) { console.error(err); process.exit(1); }
  console.log('API Gateway corriendo en http://localhost:3000');
  console.log('  → svc-users   en http://localhost:3001');
  console.log('  → svc-groups  en http://localhost:3002');
  console.log('  → svc-tickets en http://localhost:3003');
});