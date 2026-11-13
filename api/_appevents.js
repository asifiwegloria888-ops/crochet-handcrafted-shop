// Événements de l'application : installation, ouverture dans l'app, partage WhatsApp, visite venue d'un partage.
// Anonyme : on ne garde que l'identifiant aléatoire du téléphone (jamais de nom, d'email ni d'IP).

const KINDS = ["install", "app_open", "share", "share_visit"];
let ready = false;

async function ensure(sql) {
  if (ready) return;
  await sql`CREATE TABLE IF NOT EXISTS app_events (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    vid TEXT NOT NULL,
    kind TEXT NOT NULL,
    item TEXT NOT NULL DEFAULT '',
    via TEXT NOT NULL DEFAULT '',
    device TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT ''
  )`;
  ready = true;
}

async function record(sql, e) {
  await ensure(sql);
  if (e.kind === "app_open" || e.kind === "install") {   // une seule fois par jour et par téléphone
    const dup = await sql`SELECT 1 FROM app_events WHERE vid = ${e.vid} AND kind = ${e.kind} AND created_at > now() - interval '20 hours' LIMIT 1`;
    if (dup.length) return;
  }
  const n = (await sql`SELECT COUNT(*)::int AS n FROM app_events WHERE vid = ${e.vid} AND created_at > now() - interval '1 hour'`)[0].n;
  if (n >= 30) return;                                   // protège contre le spam
  await sql`INSERT INTO app_events (vid, kind, item, via, device, country) VALUES (${e.vid}, ${e.kind}, ${e.item}, ${e.via}, ${e.device}, ${e.country})`;
}

async function stats(sql) {
  await ensure(sql);
  const rows = await sql`
    SELECT kind,
           COUNT(DISTINCT vid)::int AS people,
           COUNT(*)::int AS events,
           COUNT(DISTINCT vid) FILTER (WHERE created_at > now() - interval '7 days')::int AS people_7d
    FROM app_events GROUP BY kind`;
  const counts = {};
  KINDS.forEach((k) => { counts[k] = { people: 0, events: 0, people_7d: 0 }; });
  rows.forEach((r) => { if (counts[r.kind]) counts[r.kind] = { people: r.people, events: r.events, people_7d: r.people_7d }; });

  const sharers = await sql`
    SELECT s.vid, COUNT(*)::int AS shares, MAX(s.created_at) AS last_at,
           (SELECT COUNT(DISTINCT v.vid)::int FROM app_events v WHERE v.kind = 'share_visit' AND v.via = LEFT(s.vid, 8)) AS brought
    FROM app_events s WHERE s.kind = 'share'
    GROUP BY s.vid ORDER BY shares DESC, last_at DESC LIMIT 20`;
  const items = await sql`
    SELECT item, COUNT(*)::int AS shares FROM app_events
    WHERE kind = 'share' AND item <> '' GROUP BY item ORDER BY shares DESC LIMIT 10`;
  const recent = await sql`
    SELECT created_at, vid, kind, item, via, device, country FROM app_events ORDER BY created_at DESC LIMIT 60`;

  const code = (v) => String(v || "").slice(0, 6);
  return {
    counts,
    sharers: sharers.map((r) => ({ code: code(r.vid), shares: r.shares, brought: r.brought, last_at: r.last_at })),
    items,
    recent: recent.map((r) => ({ at: r.created_at, kind: r.kind, item: r.item, code: code(r.vid), via: code(r.via), device: r.device, country: r.country })),
  };
}

module.exports = { KINDS, record, stats };