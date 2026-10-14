// ShotLink Client Logic
let links = [];
let currentQrUrl = '';

// DOM Elements
const linksContainer = document.getElementById('linksContainer');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const createLinkForm = document.getElementById('createLinkForm');
const targetUrlInput = document.getElementById('targetUrlInput');
const customSlugInput = document.getElementById('customSlugInput');
const linkTitleInput = document.getElementById('linkTitleInput');
const searchInput = document.getElementById('searchInput');
const domainPrefix = document.getElementById('domainPrefix');
const linkCountBadge = document.getElementById('linkCountBadge');
const statTotalLinks = document.getElementById('statTotalLinks');
const statTotalClicks = document.getElementById('statTotalClicks');
const statActiveLinks = document.getElementById('statActiveLinks');
const toggleAdvancedBtn = document.getElementById('toggleAdvancedBtn');
const advancedFields = document.getElementById('advancedFields');
const advancedChevron = document.getElementById('advancedChevron');

// Modals
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editLinkId = document.getElementById('editLinkId');
const editShortUrlDisplay = document.getElementById('editShortUrlDisplay');
const editSlugInput = document.getElementById('editSlugInput');
const editDomainPrefix = document.getElementById('editDomainPrefix');
const editTargetUrlInput = document.getElementById('editTargetUrlInput');
const editTitleInput = document.getElementById('editTitleInput');

const qrModal = document.getElementById('qrModal');
const qrImage = document.getElementById('qrImage');
const qrLinkText = document.getElementById('qrLinkText');
const qrDownloadBtn = document.getElementById('qrDownloadBtn');

// ShopeePay Modal DOM
const shopeeModal = document.getElementById('shopeeModal');
const shopeeInput = document.getElementById('shopeeInput');
const shopeeOutput = document.getElementById('shopeeOutput');
const shopeeDecodedBox = document.getElementById('shopeeDecodedBox');
const shopeeDecodedText = document.getElementById('shopeeDecodedText');

// Set current domain prefixes
if (domainPrefix) {
  domainPrefix.textContent = window.location.host + '/';
}
if (editDomainPrefix) {
  editDomainPrefix.textContent = window.location.host + '/';
}

// Safe Lucide icon renderer
function renderIcons() {
  if (typeof lucide !== 'undefined' && lucide && typeof lucide.createIcons === 'function') {
    try {
      lucide.createIcons();
    } catch (e) {
      console.warn('Lucide icon render error:', e);
    }
  }
}

// Random Slug client helper
async function generateRandomSlugClient(type = 'alphanumeric', length = 6) {
  try {
    const res = await fetch(`/api/random-slug?type=${type}&length=${length}`);
    const data = await res.json();
    if (data.success && data.slug) {
      if (customSlugInput) {
        customSlugInput.value = data.slug;
        customSlugInput.focus();
      }
      showToast(`สุ่มรหัส: /${data.slug}`, 'info');
    }
  } catch (err) {
    const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    let s = '';
    for (let i = 0; i < length; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    if (customSlugInput) customSlugInput.value = s;
  }
}

async function generateRandomEditSlug(type = 'alphanumeric', length = 6) {
  try {
    const res = await fetch(`/api/random-slug?type=${type}&length=${length}`);
    const data = await res.json();
    if (data.success && data.slug) {
      if (editSlugInput) editSlugInput.value = data.slug;
      showToast(`สุ่มรหัสใหม่: /${data.slug}`, 'info');
    }
  } catch (err) {
    const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    let s = '';
    for (let i = 0; i < length; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    if (editSlugInput) editSlugInput.value = s;
  }
}

// Toast notification helper
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  
  const colors = {
    success: 'bg-emerald-600 text-white border-emerald-500',
    error: 'bg-rose-600 text-white border-rose-500',
    info: 'bg-indigo-600 text-white border-indigo-500'
  };

  const icons = {
    success: '<i data-lucide="check-circle-2" class="w-4 h-4"></i>',
    error: '<i data-lucide="alert-circle" class="w-4 h-4"></i>',
    info: '<i data-lucide="info" class="w-4 h-4"></i>'
  };

  toast.className = `pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border transition-all duration-300 fade-in ${colors[type] || colors.info}`;
  toast.innerHTML = `
    ${icons[type] || icons.info}
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  renderIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Escape HTML helper
function escapeHtml(text) {
  if (!text) return '';
  return text
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Fetch all links from API
async function fetchLinks(search = '') {
  try {
    const url = search ? `/api/links?q=${encodeURIComponent(search)}` : '/api/links';
    const res = await fetch(url);
    const result = await res.json();
    
    if (result.success) {
      links = result.data;
      renderLinks();
      updateStats();
    } else {
      showToast(result.message || 'โหลดข้อมูลไม่สำเร็จ', 'error');
    }
  } catch (err) {
    console.error('Fetch error:', err);
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
  } finally {
    if (loadingState) {
      loadingState.classList.add('hidden');
    }
  }
}

// Update stats numbers
function updateStats() {
  const total = links.length;
  const clicks = links.reduce((sum, item) => sum + (item.clicks || 0), 0);
  const active = links.filter(item => item.is_active === 1).length;

  if (statTotalLinks) statTotalLinks.textContent = total.toLocaleString();
  if (statTotalClicks) statTotalClicks.textContent = clicks.toLocaleString();
  if (statActiveLinks) statActiveLinks.textContent = active.toLocaleString();
  if (linkCountBadge) linkCountBadge.textContent = `${total} ลิงก์`;
}

// Render the links list
function renderLinks() {
  if (!linksContainer) return;
  linksContainer.innerHTML = '';

  if (links.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  links.forEach(link => {
    const fullShortUrl = `${window.location.origin}/${link.slug}`;
    const isActive = link.is_active === 1;

    const card = document.createElement('div');
    card.className = `group bg-slate-900/70 hover:bg-slate-900 border ${isActive ? 'border-slate-800 hover:border-slate-700' : 'border-rose-900/40 opacity-75'} rounded-2xl p-3.5 sm:p-5 transition-all shadow-sm`;

    card.innerHTML = `
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        
        <!-- Left: Link Details -->
        <div class="space-y-2 flex-1 min-w-0">
          <div class="flex items-center flex-wrap gap-2">
            <!-- Short Link -->
            <a href="${fullShortUrl}" target="_blank" rel="noopener noreferrer" class="text-base sm:text-lg font-bold text-indigo-400 hover:text-indigo-300 font-mono tracking-tight flex items-center gap-1.5 transition-colors break-all">
              <span>${window.location.host}/${link.slug}</span>
              <i data-lucide="external-link" class="w-3.5 h-3.5 opacity-60 shrink-0"></i>
            </a>

            <!-- Copy Short Link Button -->
            <button 
              onclick="copyToClipboard('${fullShortUrl}', 'คัดลอกลิงก์ย่อเรียบร้อย!')"
              title="คัดลอกลิงก์ย่อ"
              class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
            >
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            </button>

            <!-- Status Pill -->
            <span class="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}">
              <span class="w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}"></span>
              ${isActive ? 'ทำงานอยู่' : 'ปิดใช้งาน'}
            </span>

            <!-- Title Note (if any) -->
            ${link.title ? `
              <span class="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-medium border border-slate-700/60 truncate max-w-xs shrink-0">
                🏷️ ${escapeHtml(link.title)}
              </span>
            ` : ''}
          </div>

          <!-- Target URL (Destination) -->
          <div class="flex items-start sm:items-center gap-1.5 sm:gap-2 text-xs md:text-sm text-slate-400">
            <span class="text-slate-500 font-medium whitespace-nowrap shrink-0 flex items-center gap-1 pt-0.5 sm:pt-0">
              <i data-lucide="corner-down-right" class="w-3.5 h-3.5 text-indigo-400"></i>
              ปลายทาง:
            </span>
            <a 
              href="${escapeHtml(link.target_url)}" 
              target="_blank" 
              rel="noopener noreferrer" 
              title="${escapeHtml(link.target_url)}"
              class="text-slate-300 hover:text-white underline underline-offset-2 decoration-slate-700 hover:decoration-indigo-400 break-all sm:truncate max-w-xl font-mono"
            >
              ${escapeHtml(link.target_url)}
            </a>
          </div>

          <!-- Meta (Clicks & Dates) -->
          <div class="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
            <span class="flex items-center gap-1 text-slate-400">
              <i data-lucide="mouse-pointer-click" class="w-3.5 h-3.5 text-emerald-400"></i>
              คลิก: <strong class="text-white">${(link.clicks || 0).toLocaleString()}</strong> ครั้ง
            </span>
            <span>สร้างเมื่อ: ${formatDate(link.created_at)}</span>
            ${link.updated_at !== link.created_at ? `<span class="text-amber-400/80">แก้ไขล่าสุด: ${formatDate(link.updated_at)}</span>` : ''}
          </div>
        </div>

        <!-- Right: Actions (Mobile Responsive) -->
        <div class="flex items-center flex-wrap sm:flex-nowrap gap-2 pt-2.5 lg:pt-0 border-t lg:border-t-0 border-slate-800/80 w-full lg:w-auto">
          <!-- INSTANT EDIT TARGET BUTTON -->
          <button 
            onclick="openEditModal(${link.id})"
            class="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
          >
            <i data-lucide="edit-3" class="w-4 h-4"></i>
            <span>เปลี่ยนปลายทางทันที</span>
          </button>

          <!-- Action icon buttons group -->
          <div class="flex items-center gap-1.5 shrink-0">
            <!-- QR Code Button -->
            <button 
              onclick="openQrModal('${link.slug}')"
              title="ดู QR Code"
              class="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <i data-lucide="qr-code" class="w-4 h-4"></i>
            </button>

            <!-- Toggle Active/Inactive -->
            <button 
              onclick="toggleLink(${link.id})"
              title="${isActive ? 'คลิกเพื่อปิดการทำงานชั่วคราว' : 'คลิกเพื่อเปิดการทำงาน'}"
              class="p-2.5 rounded-xl ${isActive ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'} transition-colors"
            >
              <i data-lucide="${isActive ? 'pause' : 'play'}" class="w-4 h-4"></i>
            </button>

            <!-- Delete Button -->
            <button 
              onclick="deleteLink(${link.id}, '${link.slug}')"
              title="ลบลิงก์นี้"
              class="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition-colors"
            >
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

      </div>
    `;

    linksContainer.appendChild(card);
  });

  renderIcons();
}

// Date formatter
function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (_) {
    return dateStr;
  }
}

// Copy to clipboard
async function copyToClipboard(text, successMsg = 'คัดลอกเรียบร้อย!') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMsg, 'success');
  } catch (err) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast(successMsg, 'success');
  }
}

// Form Submit: Create Link
if (createLinkForm) {
  createLinkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetUrl = targetUrlInput ? targetUrlInput.value.trim() : '';
    const slug = customSlugInput ? customSlugInput.value.trim() : '';
    const title = linkTitleInput ? linkTitleInput.value.trim() : '';

    if (!targetUrl) {
      showToast('กรุณากรอก URL ปลายทาง', 'error');
      return;
    }

    const submitBtn = document.getElementById('submitBtn');
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
        <span>กำลังย่อ...</span>
      `;
    }

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl, slug, title })
      });

      const result = await res.json();
      if (result.success) {
        showToast(`สร้างลิงก์ /${result.data.slug} สำเร็จ!`, 'success');
        if (targetUrlInput) targetUrlInput.value = '';
        if (customSlugInput) customSlugInput.value = '';
        if (linkTitleInput) linkTitleInput.value = '';
        await fetchLinks();
        // Auto copy short link
        const shortUrl = `${window.location.origin}/${result.data.slug}`;
        copyToClipboard(shortUrl, `สร้างสำเร็จ! คัดลอกลิงก์ ${shortUrl} แล้ว`);
      } else {
        showToast(result.message || 'ไม่สามารถสร้างลิงก์ได้', 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการสร้างลิงก์', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
      renderIcons();
    }
  });
}

// Optional toggle advanced options
if (toggleAdvancedBtn && advancedFields) {
  toggleAdvancedBtn.addEventListener('click', () => {
    const isHidden = advancedFields.classList.toggle('hidden');
    if (advancedChevron) {
      advancedChevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
    }
  });
}

// Search Filter
let searchTimeout = null;
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      fetchLinks(e.target.value.trim());
    }, 300);
  });
}

// ================= EDIT MODAL =================
function openEditModal(linkId) {
  const link = links.find(l => l.id === linkId);
  if (!link || !editModal) return;

  if (editLinkId) editLinkId.value = link.id;
  if (editSlugInput) editSlugInput.value = link.slug;
  if (editDomainPrefix) editDomainPrefix.textContent = window.location.host + '/';
  if (editTargetUrlInput) editTargetUrlInput.value = link.target_url;
  if (editTitleInput) editTitleInput.value = link.title || '';

  editModal.classList.remove('hidden');
  if (editTargetUrlInput) {
    editTargetUrlInput.focus();
    editTargetUrlInput.select();
  }
  renderIcons();
}

function closeEditModal() {
  if (editModal) editModal.classList.add('hidden');
}

if (editForm) {
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = editLinkId ? editLinkId.value : '';
    const targetUrl = editTargetUrlInput ? editTargetUrlInput.value.trim() : '';
    const title = editTitleInput ? editTitleInput.value.trim() : '';
    const slug = editSlugInput ? editSlugInput.value.trim() : undefined;

    if (!targetUrl) {
      showToast('กรุณากรอก URL ปลายทางใหม่', 'error');
      return;
    }

    const saveBtn = document.getElementById('saveEditBtn');
    const origHtml = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = `
        <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
        <span>กำลังบันทึก...</span>
      `;
    }

    try {
      const res = await fetch(`/api/links/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl, title, slug })
      });

      const result = await res.json();
      if (result.success) {
        showToast('อัปเดตข้อมูลเรียบร้อยแล้ว! มีผลทันที', 'success');
        closeEditModal();
        const query = searchInput ? searchInput.value.trim() : '';
        await fetchLinks(query);
      } else {
        showToast(result.message || 'ไม่สามารถแก้ไขได้', 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = origHtml;
      }
      renderIcons();
    }
  });
}

// Close modal on click outside or escape key
if (editModal) {
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
  });
}
if (qrModal) {
  qrModal.addEventListener('click', (e) => {
    if (e.target === qrModal) closeQrModal();
  });
}
if (shopeeModal) {
  shopeeModal.addEventListener('click', (e) => {
    if (e.target === shopeeModal) closeShopeeModal();
  });
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeEditModal();
    closeQrModal();
    closeShopeeModal();
  }
});

// ================= QR CODE MODAL =================
async function openQrModal(slug) {
  try {
    const res = await fetch(`/api/links/${slug}/qr`);
    const data = await res.json();
    if (data.success && qrModal) {
      if (qrImage) qrImage.src = data.qrDataUrl;
      if (qrLinkText) qrLinkText.textContent = data.fullUrl;
      if (qrDownloadBtn) {
        qrDownloadBtn.href = data.qrDataUrl;
        qrDownloadBtn.download = `qr-${slug}.png`;
      }
      currentQrUrl = data.fullUrl;
      qrModal.classList.remove('hidden');
      renderIcons();
    } else {
      showToast('ไม่สามารถสร้าง QR Code ได้', 'error');
    }
  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการสร้าง QR Code', 'error');
  }
}

function closeQrModal() {
  if (qrModal) qrModal.classList.add('hidden');
}

function copyQrLink() {
  if (currentQrUrl) {
    copyToClipboard(currentQrUrl, 'คัดลอกลิงก์สำเร็จ!');
  }
}

// ================= SHOPEEPAY CONVERTER =================
const SHOPEE_SAMPLE = 'shopeepayth://main?apprl=rn%2FTRANSFER_PAGE%3Fnavigate_url%3Dhttps%253A%252F%252Fapp.shopeepay.co.th%252Funiversal-link%252Fwallet%252Fangbao%253Fangbao_sn%253DZo4a9X8PXlDVip5W9yT1w5IUtvQXpW1Q%2526deep_and_deferred%253D1%2526fma%253D1';

function openShopeeModal() {
  if (!shopeeModal) return;
  shopeeModal.classList.remove('hidden');
  if (shopeeInput && !shopeeInput.value.trim() && targetUrlInput && targetUrlInput.value.trim()) {
    shopeeInput.value = targetUrlInput.value.trim();
    processShopeeConversion();
  }
  if (shopeeInput) {
    shopeeInput.focus();
    shopeeInput.select();
  }
  renderIcons();
}

function closeShopeeModal() {
  if (shopeeModal) shopeeModal.classList.add('hidden');
}

let shopeeMode = 'extract'; // 'extract' (default) or 'wrap'

function setShopeeMode(mode) {
  shopeeMode = mode;
  const extractBtn = document.getElementById('modeExtractBtn');
  const wrapBtn = document.getElementById('modeWrapBtn');
  if (extractBtn && wrapBtn) {
    if (mode === 'extract') {
      extractBtn.className = 'px-2 py-0.5 rounded font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      wrapBtn.className = 'px-2 py-0.5 rounded font-medium text-slate-400 hover:text-white';
    } else {
      wrapBtn.className = 'px-2 py-0.5 rounded font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30';
      extractBtn.className = 'px-2 py-0.5 rounded font-medium text-slate-400 hover:text-white';
    }
  }
  processShopeeConversion();
}

function extractShopeePayUrl(raw) {
  if (!raw) return '';
  let str = raw.trim();

  // 1. Check navigate_url parameter
  const match = str.match(/navigate_url(?:%3D|=)(https[^&]+)/i) || 
                str.match(/navigate_url(?:%3D|=)(.+?)(?:&|$)/i);
  if (match && match[1]) {
    let extracted = match[1];
    for (let i = 0; i < 4; i++) {
      if (extracted.includes('%')) {
        try { extracted = decodeURIComponent(extracted); } catch (_) { break; }
      }
    }
    return extracted;
  }

  // 2. Check embedded encoded https%3A%2F%2F
  const embeddedHttp = str.match(/(https?%3A%2F%2F.+?)(?:&|$)/i) || str.match(/(https?%3A%2F%2F.+)/i);
  if (embeddedHttp && embeddedHttp[1]) {
    let extracted = embeddedHttp[1];
    for (let i = 0; i < 4; i++) {
      if (extracted.includes('%')) {
        try { extracted = decodeURIComponent(extracted); } catch (_) { break; }
      }
    }
    return extracted;
  }

  // 3. Check plain https://
  const plainHttp = str.match(/(https?:\/\/[^&]+)/i);
  if (plainHttp && plainHttp[1]) {
    return plainHttp[1];
  }

  // Fallback if no inner URL found: wrap it
  return wrapShopeePayUrl(str);
}

function wrapShopeePayUrl(raw) {
  if (!raw) return '';
  raw = raw.trim();
  if (/^https:\/\/shopeepay\.co\.th\/shopeepay(th)?:\/\//i.test(raw)) {
    return raw;
  }
  if (/^shopeepay(th)?:\/\//i.test(raw)) {
    return 'https://shopeepay.co.th/' + raw;
  }
  if (/^main\?apprl=/i.test(raw)) {
    return 'https://shopeepay.co.th/shopeepayth://' + raw;
  }
  return 'https://shopeepay.co.th/' + raw;
}

function convertShopeePayUrl(raw) {
  if (shopeeMode === 'wrap') {
    return wrapShopeePayUrl(raw);
  }
  return extractShopeePayUrl(raw);
}

function processShopeeConversion() {
  if (!shopeeInput || !shopeeOutput) return;
  const raw = shopeeInput.value.trim();
  if (!raw) {
    shopeeOutput.value = '';
    return;
  }

  const converted = convertShopeePayUrl(raw);
  shopeeOutput.value = converted;
}

function pasteShopeePaySample() {
  if (!shopeeInput) return;
  shopeeInput.value = SHOPEE_SAMPLE;
  processShopeeConversion();
  showToast('ใส่ตัวอย่างลิงก์ ShopeePay เรียบร้อย', 'info');
}

function copyShopeeOutput() {
  if (!shopeeOutput || !shopeeOutput.value.trim()) {
    showToast('ยังไม่มีผลลัพธ์ให้คัดลอก', 'error');
    return;
  }
  copyToClipboard(shopeeOutput.value.trim(), 'คัดลอกผลลัพธ์เรียบร้อย!');
}

function applyShopeeToTarget() {
  if (!shopeeOutput || !shopeeOutput.value.trim()) {
    showToast('กรุณากรอกหรือวางลิงก์ ShopeePay ก่อน', 'error');
    return;
  }
  const result = shopeeOutput.value.trim();
  if (targetUrlInput) {
    targetUrlInput.value = result;
    targetUrlInput.focus();
  }
  closeShopeeModal();
  showToast('ใส่ลิงก์ที่ถอดรหัสแล้วในช่องย่อเรียบร้อย!', 'success');
}

if (shopeeInput) {
  shopeeInput.addEventListener('input', processShopeeConversion);
}

// Auto-convert if user pastes shopeepayth:// directly into targetUrlInput!
if (targetUrlInput) {
  targetUrlInput.addEventListener('paste', () => {
    setTimeout(() => {
      const val = targetUrlInput.value.trim();
      if (/^shopeepay(th)?:\/\//i.test(val)) {
        targetUrlInput.value = extractShopeePayUrl(val);
        showToast('ตรวจพบ ShopeePay: ถอดรหัสเป็น URL แท้จริงให้อัตโนมัติ!', 'success');
      }
    }, 50);
  });
}

// Toggle active status
async function toggleLink(id) {
  try {
    const res = await fetch(`/api/links/${id}/toggle`, { method: 'PATCH' });
    const result = await res.json();
    if (result.success) {
      const state = result.data.is_active === 1 ? 'เปิดใช้งานแล้ว' : 'ปิดใช้งานชั่วคราวแล้ว';
      showToast(state, 'info');
      const query = searchInput ? searchInput.value.trim() : '';
      await fetchLinks(query);
    } else {
      showToast(result.message || 'เกิดข้อผิดพลาด', 'error');
    }
  } catch (err) {
    showToast('ไม่สามารถเปลี่ยนสถานะได้', 'error');
  }
}

// Delete link
async function deleteLink(id, slug) {
  if (!confirm(`ยืนยันการลบลิงก์ /${slug} ?\nลิงก์นี้จะไม่สามารถใช้งานได้อีกต่อไป`)) {
    return;
  }

  try {
    const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.success) {
      showToast('ลบลิงก์เรียบร้อยแล้ว', 'success');
      const query = searchInput ? searchInput.value.trim() : '';
      await fetchLinks(query);
    } else {
      showToast(result.message || 'ลบไม่สำเร็จ', 'error');
    }
  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการลบลิงก์', 'error');
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  renderIcons();
  fetchLinks();
});

// Fallback immediate execution
renderIcons();
fetchLinks();
