const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('node:path');
const crypto = require('node:crypto');
const QRCode = require('qrcode');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static frontend files (disable auto index.html so / does not open dashboard)
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Reserved routes that should not be treated as slugs
const RESERVED_SLUGS = new Set([
  'api',
  'public',
  'static',
  'favicon.ico',
  'robots.txt',
  'assets',
  'health',
  'adminshotlink'
]);

function normalizeUrl(url) {
  if (!url) return '';
  url = url.trim();
  if (!/^https?:\/\//i.test(url)) {
    return 'https://' + url;
  }
  return url;
}

function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function generateRandomSlug(length = 6) {
  const characters = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += characters[randomBytes[i] % characters.length];
  }
  return result;
}

const ADJECTIVES = ['super', 'swift', 'happy', 'bright', 'smart', 'lucky', 'cool', 'magic', 'prime', 'hyper', 'sunny', 'cyber', 'quick', 'star', 'fire', 'epic'];
const NOUNS = ['link', 'fox', 'wave', 'tiger', 'lion', 'moon', 'hero', 'bear', 'hawk', 'spark', 'cloud', 'rocket', 'nexus', 'byte', 'flash', 'quest'];

function generateFriendlySlug() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${adj}-${noun}-${num}`;
}

function getAvailableSlug(type = 'alphanumeric', length = 6) {
  let tries = 0;
  let slug = '';
  do {
    if (type === 'friendly') {
      slug = generateFriendlySlug();
    } else {
      slug = generateRandomSlug(length);
    }
    tries++;
  } while ((db.getLinkBySlug(slug) || RESERVED_SLUGS.has(slug)) && tries < 20);

  return slug;
}

// ================= PAGE ROUTES =================

// Admin Dashboard - เข้าได้ผ่าน /adminShotLink เท่านั้น
app.get(['/adminShotLink', '/adminshotlink'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Root path (/) - หน้าแรกทั่วไปสำหรับผู้ใช้ทั่วไป ไม่แสดงหน้าจัดการ
app.get('/', (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ShotLink Service</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600&display=swap" rel="stylesheet">
      <style>body { font-family: 'Prompt', sans-serif; }</style>
    </head>
    <body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center">
        <div class="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
        </div>
        <h1 class="text-2xl font-bold text-white mb-2">ShotLink Service</h1>
        <p class="text-slate-400 text-sm mb-6 leading-relaxed">
          ยินดีต้อนรับสู่ระบบบริการย่อลิงก์ความเร็วสูง<br>
          กรุณาเข้าใช้งานผ่านรหัสลิงก์ย่อที่ได้รับเพื่อไปยังหน้าปลายทาง
        </p>
        <div class="text-xs text-slate-600 border-t border-slate-800/80 pt-4">
          ShotLink &copy; 2026
        </div>
      </div>
    </body>
    </html>
  `);
});

// ================= API ROUTES =================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get a random available slug
app.get('/api/random-slug', (req, res) => {
  try {
    const type = req.query.type || 'alphanumeric'; // 'alphanumeric' or 'friendly'
    const length = Math.min(Math.max(parseInt(req.query.length, 10) || 6, 4), 16);
    const slug = getAvailableSlug(type, length);
    res.json({ success: true, slug, type });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all short links
app.get('/api/links', (req, res) => {
  try {
    const search = req.query.q || '';
    const links = db.getAllLinks(search);
    res.json({ success: true, data: links });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create a new short link
app.post('/api/links', (req, res) => {
  try {
    let { targetUrl, slug, title } = req.body;

    if (!targetUrl) {
      return res.status(400).json({ success: false, message: 'กรุณากรอก URL ปลายทาง' });
    }

    targetUrl = normalizeUrl(targetUrl);
    if (!isValidUrl(targetUrl)) {
      return res.status(400).json({ success: false, message: 'URL ปลายทางไม่ถูกต้อง' });
    }

    // Process slug
    if (slug) {
      slug = slug.trim().toLowerCase();
      // Allow letters, numbers, dash, underscore
      if (!/^[a-zA-Z0-9-_]+$/.test(slug)) {
        return res.status(400).json({
          success: false,
          message: 'Slug อนุญาตเฉพาะตัวอักษร, ตัวเลข, ขีดกลาง (-) และขีดล่าง (_) เท่านั้น'
        });
      }

      if (RESERVED_SLUGS.has(slug)) {
        return res.status(400).json({ success: false, message: 'ชื่อ Slug นี้เป็นคำสงวนของระบบ' });
      }

      const existing = db.getLinkBySlug(slug);
      if (existing) {
        return res.status(409).json({ success: false, message: `Slug "${slug}" ถูกใช้งานไปแล้ว` });
      }
    } else {
      // Auto generate slug
      let tries = 0;
      do {
        slug = generateRandomSlug(6);
        tries++;
      } while (db.getLinkBySlug(slug) && tries < 10);

      if (tries >= 10) {
        slug = generateRandomSlug(8);
      }
    }

    const newLink = db.createLink({
      slug,
      targetUrl,
      title: title ? title.trim() : ''
    });

    res.status(201).json({ success: true, data: newLink });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update short link destination URL, title, or slug (Change link instantly!)
app.put('/api/links/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    let { targetUrl, title, slug } = req.body;

    const existing = db.getLinkById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'ไม่พบลิงก์นี้ในระบบ' });
    }

    if (targetUrl !== undefined) {
      targetUrl = normalizeUrl(targetUrl);
      if (!isValidUrl(targetUrl)) {
        return res.status(400).json({ success: false, message: 'URL ปลายทางใหม่ไม่ถูกต้อง' });
      }
    }

    if (slug !== undefined) {
      slug = slug.trim().toLowerCase();
      if (!/^[a-zA-Z0-9-_]+$/.test(slug)) {
        return res.status(400).json({
          success: false,
          message: 'Slug อนุญาตเฉพาะตัวอักษร, ตัวเลข, ขีดกลาง (-) และขีดล่าง (_) เท่านั้น'
        });
      }
      if (RESERVED_SLUGS.has(slug)) {
        return res.status(400).json({ success: false, message: 'ชื่อ Slug นี้เป็นคำสงวนของระบบ' });
      }
      const existingSlug = db.getLinkBySlug(slug);
      if (existingSlug && existingSlug.id !== id) {
        return res.status(409).json({ success: false, message: `Slug "${slug}" ถูกใช้งานไปแล้ว` });
      }
    }

    const updated = db.updateLink(id, {
      targetUrl,
      title: title !== undefined ? title.trim() : existing.title,
      slug
    });

    res.json({
      success: true,
      message: 'อัปเดตข้อมูลลิงก์เรียบร้อยแล้ว มีผลทันที!',
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Toggle status (Active / Paused)
app.patch('/api/links/:id/toggle', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = db.getLinkById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'ไม่พบลิงก์นี้ในระบบ' });
    }

    const updated = db.toggleLinkStatus(id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete short link
app.delete('/api/links/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const success = db.deleteLink(id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'ไม่พบลิงก์นี้ในระบบ' });
    }
    res.json({ success: true, message: 'ลบลิงก์เรียบร้อยแล้ว' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Generate QR Code for a link
app.get('/api/links/:slug/qr', async (req, res) => {
  try {
    const slug = req.params.slug;
    const link = db.getLinkBySlug(slug);
    if (!link) {
      return res.status(404).send('Not Found');
    }

    const fullUrl = `${req.protocol}://${req.get('host')}/${link.slug}`;
    const qrDataUrl = await QRCode.toDataURL(fullUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });

    res.json({ success: true, qrDataUrl, fullUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= REDIRECT ROUTE =================
// Intercept all short link clicks: /:slug
app.get('/:slug', (req, res, next) => {
  const slug = req.params.slug;

  if (RESERVED_SLUGS.has(slug)) {
    return next();
  }

  const link = db.getLinkBySlug(slug);

  if (!link) {
    // Return friendly 404 HTML
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>404 - ไม่พบลิงก์ย่อ</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>body { font-family: 'Prompt', sans-serif; }</style>
      </head>
      <body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-800/80 backdrop-blur border border-slate-700 p-8 rounded-2xl shadow-2xl text-center">
          <div class="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <h1 class="text-3xl font-bold mb-2">ไม่พบลิงก์ย่อนี้ (404)</h1>
          <p class="text-slate-400 mb-6">รหัสลิงก์ <code class="bg-slate-950 px-2 py-1 rounded text-rose-300 font-mono">/${slug}</code> ไม่มีอยู่ในระบบ หรืออาจถูกลบไปแล้ว</p>
          <a href="/" class="inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/30">
            กลับสู่หน้าหลัก
          </a>
        </div>
      </body>
      </html>
    `);
  }

  // Check if link is paused
  if (link.is_active === 0) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ลิงก์นี้ถูกปิดใช้งานชั่วคราว</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>body { font-family: 'Prompt', sans-serif; }</style>
      </head>
      <body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full bg-slate-800/80 backdrop-blur border border-slate-700 p-8 rounded-2xl shadow-2xl text-center">
          <div class="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h1 class="text-2xl font-bold mb-2">ลิงก์ถูกปิดใช้งานชั่วคราว</h1>
          <p class="text-slate-400 mb-6">ผู้ดูแลระบบได้ระงับการเข้าถึงลิงก์นี้ชั่วคราว</p>
          <a href="/" class="inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium bg-slate-700 hover:bg-slate-600 text-white transition-all">
            กลับสู่หน้าหลัก
          </a>
        </div>
      </body>
      </html>
    `);
  }

  // Record click count asynchronously
  try {
    db.recordClick(slug);
  } catch (e) {
    console.error('Failed to record click:', e);
  }

  // Important: Use Cache-Control: no-cache, no-store, must-revalidate
  // so browser doesn't cache 302, allowing instant target URL updates!
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  return res.redirect(302, link.target_url);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Short Link Service is running at http://localhost:${PORT}`);
});
