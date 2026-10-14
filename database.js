const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const dbPath = path.join(__dirname, 'links.db');
const db = new DatabaseSync(dbPath);

// Initialize table
db.exec(`
  CREATE TABLE IF NOT EXISTS links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL COLLATE NOCASE,
    target_url TEXT NOT NULL,
    title TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    clicks INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    last_clicked_at TEXT DEFAULT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_slug ON links(slug);
`);

const statements = {
  getBySlug: db.prepare('SELECT * FROM links WHERE slug = ?'),
  getById: db.prepare('SELECT * FROM links WHERE id = ?'),
  getAll: db.prepare('SELECT * FROM links ORDER BY id DESC'),
  search: db.prepare(`
    SELECT * FROM links 
    WHERE slug LIKE ? OR target_url LIKE ? OR title LIKE ?
    ORDER BY id DESC
  `),
  insert: db.prepare(`
    INSERT INTO links (slug, target_url, title, is_active, created_at, updated_at)
    VALUES (?, ?, ?, 1, datetime('now', 'localtime'), datetime('now', 'localtime'))
  `),
  updateTarget: db.prepare(`
    UPDATE links 
    SET target_url = ?, title = ?, slug = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `),
  toggleStatus: db.prepare(`
    UPDATE links 
    SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END,
        updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `),
  incrementClicks: db.prepare(`
    UPDATE links 
    SET clicks = clicks + 1, 
        last_clicked_at = datetime('now', 'localtime')
    WHERE slug = ?
  `),
  delete: db.prepare('DELETE FROM links WHERE id = ?')
};

function getLinkBySlug(slug) {
  return statements.getBySlug.get(slug);
}

function getLinkById(id) {
  return statements.getById.get(id);
}

function getAllLinks(search = '') {
  if (!search) {
    return statements.getAll.all();
  }
  const term = `%${search}%`;
  return statements.search.all(term, term, term);
}

function createLink({ slug, targetUrl, title = '' }) {
  const result = statements.insert.run(slug, targetUrl, title);
  return getLinkById(result.lastInsertRowid);
}

function updateLink(id, { targetUrl, title, slug }) {
  const existing = getLinkById(id);
  if (!existing) return null;
  const newTitle = title !== undefined ? title : existing.title;
  const newTarget = targetUrl !== undefined ? targetUrl : existing.target_url;
  const newSlug = slug !== undefined ? slug : existing.slug;
  statements.updateTarget.run(newTarget, newTitle, newSlug, id);
  return getLinkById(id);
}

function toggleLinkStatus(id) {
  statements.toggleStatus.run(id);
  return getLinkById(id);
}

function deleteLink(id) {
  const existing = getLinkById(id);
  if (!existing) return false;
  statements.delete.run(id);
  return true;
}

function recordClick(slug) {
  statements.incrementClicks.run(slug);
}

module.exports = {
  getLinkBySlug,
  getLinkById,
  getAllLinks,
  createLink,
  updateLink,
  toggleLinkStatus,
  deleteLink,
  recordClick
};
