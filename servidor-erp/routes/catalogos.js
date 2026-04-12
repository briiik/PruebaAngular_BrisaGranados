const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dgmgngfrespeheuzrpso.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbWduZ2ZyZXNwZWhldXpycHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDk2MzMsImV4cCI6MjA4OTg4NTYzM30.fUqQzetG3ZREKVTPQNmv2BzjwFoL3No5gf8qk-0rKuQ'
);

// ── GET /api/estados ──────────────────────────────────────────────────────────
async function getEstados(req, res) {
  const { data, error } = await supabase.from('estados').select('*');
  if (error) return res.status(400).json({ statusCode: 400, intOpCode: 'SxCA400', data: { error: error.message } });
  return res.status(200).json({ statusCode: 200, intOpCode: 'SxCA200', data });
}

// ── GET /api/prioridades ──────────────────────────────────────────────────────
async function getPrioridades(req, res) {
  const { data, error } = await supabase.from('prioridades').select('*').order('orden');
  if (error) return res.status(400).json({ statusCode: 400, intOpCode: 'SxCA400', data: { error: error.message } });
  return res.status(200).json({ statusCode: 200, intOpCode: 'SxCA200', data });
}

// ── GET /api/permisos ─────────────────────────────────────────────────────────
async function getPermisos(req, res) {
  const { data, error } = await supabase.from('permisos').select('*');
  if (error) return res.status(400).json({ statusCode: 400, intOpCode: 'SxCA400', data: { error: error.message } });
  return res.status(200).json({ statusCode: 200, intOpCode: 'SxCA200', data });
}

module.exports = { getEstados, getPrioridades, getPermisos };