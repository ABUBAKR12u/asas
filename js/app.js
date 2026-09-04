/**
 * app.js — Mini App yadrosi.
 *
 * - Telegram initData bilan auth (har so'rovda backend tekshiradi)
 * - Rol aniqlash: admin -> gate ekrani, user -> to'g'ridan-to'g'ri
 * - View router + tabbar + BackButton integratsiyasi
 * - Haptic feedback (tegilish seziladi — jonli his beradi)
 */

'use strict';

const App = {

  tg: window.Telegram?.WebApp || null,
  user: null,
  isAdmin: false,
  mode: 'user',
  initData: '',
  stack: [],           // navigatsiya steki
  current: null,
  params: {},

  /* ================================================================
   *  BOOT (kirish nuqtasi)
   * ================================================================ */
  async boot() {
    // Boot markazi — animatsiyali premium emoji (fallback: Lucide sparkles)
    const mark = document.getElementById('boot-mark');
    const bootCid = (window.SLOTS && window.SLOTS.premium) || '';
    mark.innerHTML = (bootCid && window.Emo) ? Emo.html(bootCid, 40) : UI.icon('sparkles', 30);
    if (window.Emo) Emo.mount(mark);

    if (this.tg) {
      this.tg.ready();
      this.tg.expand();
      this.initData = this.tg.initData || '';
    }

    // initData yo'q — Telegram ichida emas (brauzerda ochilgan)
    if (!this.initData) {
      document.getElementById('boot').innerHTML = `
        <div class="boot-body">
          <div class="boot-mark" style="background:var(--danger)">${UI.icon('triangle-alert', 30)}</div>
          <div class="boot-name">Telegram ichida oching</div>
          <div class="boot-sub" style="color:var(--hint);font-size:13px">Ilova faqat bot orqali, Mini App tugmasi bilan ishlaydi.</div>
        </div>`;
      return;
    }

    try {
      const me = await this.api('me');
      this.user = { ...me.user, balance: me.balance };
      this.isAdmin = !!me.is_admin;

      document.getElementById('boot').classList.add('done');

      // Bloklangan user
      if (me.is_blocked) {
        document.getElementById('shell').classList.remove('hidden');
        this.blockedScreen();
        return;
      }

      if (this.isAdmin) {
        this.showGate();
      } else {
        this.start('user');
      }
    } catch (e) {
      document.getElementById('boot').innerHTML = `
        <div class="boot-body">
          <div class="boot-mark" style="background:var(--danger)">${UI.icon('wifi-off', 30)}</div>
          <div class="boot-name">Ulanish xatosi</div>
          <div class="boot-sub" style="color:var(--hint);font-size:13px">${UI.esc(e.message)}</div>
        </div>`;
    }
  },

  /* ================================================================
   *  GATE (admin rol tanlash)
   * ================================================================ */
  showGate() {
    const g = document.getElementById('gate');
    const gateMark = document.getElementById('gate-mark');
    const cid = (window.SLOTS && window.SLOTS.premium) || '';
    gateMark.innerHTML = (cid && window.Emo) ? Emo.html(cid, 46) : UI.icon('sparkles', 34);
    document.getElementById('pick-ic-user').innerHTML = UI.icon('user-round', 22);
    document.getElementById('pick-ic-admin').innerHTML = UI.icon('shield-check', 22);
    document.getElementById('pick-go-user').innerHTML = UI.icon('chevron-right', 18);
    document.getElementById('pick-go-admin').innerHTML = UI.icon('chevron-right', 18);
    document.getElementById('gate-foot').textContent =
      `@${this.user.username || this.user.name} sifatida kirdingiz`;
    g.classList.remove('hidden');
    if (window.Emo) Emo.mount(g);

    document.getElementById('pick-user').onclick = () => { this.tap(); this.start('user'); };
    document.getElementById('pick-admin').onclick = () => { this.tap(); this.start('admin'); };
  },

  /* ================================================================
   *  START (rejim boshlanishi)
   * ================================================================ */
  start(mode) {
    this.mode = mode;
    this.stack = [];
    document.getElementById('gate').classList.add('hidden');
    document.getElementById('shell').classList.remove('hidden');

    // Tabbar'larni qurish
    this.buildTabbar();

    // Tab bosishlari
    document.getElementById('tabbar').addEventListener('click', (e) => {
      const btn = e.target.closest('.tab');
      if (!btn) return;
      this.tap();
      this.stack = [];
      this.render(btn.dataset.tab, {}, false);
    });

    // Telegram BackButton
    if (this.tg?.BackButton) {
      this.tg.BackButton.onClick(() => this.back());
    }

    this.render(this.homeRoute(), {}, false);
  },

  homeRoute() { return this.mode === 'admin' ? 'dash' : 'home'; },

  buildTabbar() {
    // "Sliding dock" + PREMIUM emoji: har tabda animatsiyali emoji.
    // Aktiv bo'lmagan tab — statik birinchi kadr ('tab' mode),
    // aktiv bo'lganda 1 marta aylanib to'xtaydi (jonli, lekin charchatmaydi).
    const user = [
      ['home', 'navHome', 'layout-grid', 'Asosiy'],
      ['orders', 'navOrders', 'package', 'Buyurtma'],
      ['balance', 'navBalance', 'wallet', 'Balans'],
      ['referral', 'navReferral', 'gift', 'Referal'],
      ['profile', 'navProfile', 'user-round', 'Profil'],
    ];
    const admin = [
      ['dash', 'navDash', 'layout-dashboard', 'Panel'],
      ['a-users', 'navUsers', 'users', 'Userlar'],
      ['a-topups', 'navTopups', 'credit-card', "To'lov"],
      ['a-orders', 'navOrders', 'package', 'Buyurtma'],
      ['a-more', 'navMore', 'menu', 'Yana'],
    ];
    const tabs = this.mode === 'admin' ? admin : user;
    document.getElementById('tabbar').innerHTML =
      `<span class="dock-ind"></span>` +
      tabs.map(([r, slot, ic, label]) => `
        <button class="tab" data-tab="${r}" aria-label="${label}" title="${label}">
          <span class="tab-emo">${App.slot(slot, ic, 24, 'tab') || UI.icon(ic, 21)}</span>
          <span class="tab-lbl">${label}</span>
        </button>`).join('');
    if (window.Emo) Emo.mount(document.getElementById('tabbar'));

    // Har bir tab o'lchami o'zgarganda (kengayish/siqilish) indikatorni
    // qayta joyla — shunda pill aktiv tab'ga "yopishib" sirpanadi.
    if (this._dockRO) this._dockRO.disconnect();
    if (window.ResizeObserver) {
      this._dockRO = new ResizeObserver(() => this.positionDock());
      document.querySelectorAll('#tabbar .tab').forEach(t => this._dockRO.observe(t));
    }
  },

  positionDock() {
    const bar = document.getElementById('tabbar');
    if (!bar) return;
    const ind = bar.querySelector('.dock-ind');
    const active = bar.querySelector('.tab.on');
    if (!ind) return;
    if (active) {
      const br = bar.getBoundingClientRect();
      const tr = active.getBoundingClientRect();
      ind.style.width = tr.width + 'px';
      ind.style.transform = `translateX(${tr.left - br.left - 6}px)`;
      ind.style.opacity = '1';
    } else {
      ind.style.opacity = '0';
    }
  },

  moveDock(route) {
    const bar = document.getElementById('tabbar');
    const tabs = [...bar.querySelectorAll('.tab')];
    const active = tabs.find(t => t.dataset.tab === route);
    tabs.forEach(t => t.classList.toggle('on', t === active));
    this.positionDock();
    // Emoji: aktiv tab'ni jonlantir, qolganlarini statik holatga qaytar
    if (window.Emo) {
      tabs.forEach(t => {
        const el = t.querySelector('.emo');
        if (el) Emo.setTabActive(el, t === active);
      });
    }
  },

  /* ================================================================
   *  NAVIGATSIYA
   * ================================================================ */
  go(route, params = {}) {
    if (this.current) this.stack.push([this.current, this.params]);
    this.render(route, params, true);
  },

  back() {
    if (this.stack.length) {
      const [r, p] = this.stack.pop();
      this.render(r, p, false);
    } else {
      // Stak bo'sh — bosh ekran
      this.stack = [];
      this.render(this.homeRoute(), {}, false);
    }
  },

  render(route, params = {}, animate = true) {
    this.current = route;
    this.params = params;

    // Router tanlash
    const table = this.mode === 'admin' ? window.AdminApp.routes : window.UserApp.routes;
    const handler = table[route] || table[this.homeRoute()];

    // Topbar holati
    const content = document.getElementById('content');
    content.innerHTML = '';
    content.classList.remove('view-enter');
    if (animate) { void content.offsetWidth; content.classList.add('view-enter'); }
    window.scrollTo({ top: 0 });

    // Tab holati + BackButton + dock indikator (klass toggle moveDock ichida)
    this.moveDock(route);
    if (this.tg?.BackButton) {
      if (this.stack.length) this.tg.BackButton.show();
      else this.tg.BackButton.hide();
    }

    // Route'ni bajarish
    Promise.resolve(handler(content, params || {})).then(() => {
      // View chizildi — premium emoji'larni jonlantir (lazy, ekranga kirganda)
      if (window.Emo) Emo.mount(content);
    }).catch(err => {
      console.error('route xatosi:', route, err);
      content.innerHTML = UI.errorBox(err.message || 'Xatolik yuz berdi', true);
      const rb = content.querySelector('#retry-btn');
      if (rb) rb.onclick = () => this.render(route, params, animate);
    });
  },

  /* ================================================================
   *  API (backend)
   * ================================================================
   * API_BASE: webapp/js/config.js da. Bo'sh — bir xil server;
   * Vercel rejimida — shared hosting URL'i (cross-origin). */
  apiBase() {
    return (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || '';
  },

  /* Proxy URL quruvchi.
   * API_BASE '.cgi' bilan tugasa — hosting WAF'i '/api' yo'lini bloklagani
   * uchun maqsad yo'lini base64 qilib ?t= ichida yuboramiz:
   *    https://DOMAIN/gateway.cgi?t=<b64('/api?action=me')>
   * Aks holda (ngrok/local/bir-butun) oddiy yo'l ishlatiladi. */
  apiUrl(path) {
    const base = this.apiBase();
    if (/\.cgi$/.test(base)) {
      // URL-safe base64 ('+'->'-', '/'->'_') — query ichida buzilmasin.
      const tok = btoa(unescape(encodeURIComponent(path)))
        .replace(/\+/g, '-').replace(/\//g, '_');
      return `${base}?t=${tok}`;
    }
    return `${base}${path}`;
  },

  async api(action, data = {}) {
    let resp;
    try {
      resp = await fetch(this.apiUrl(`/api?action=${encodeURIComponent(action)}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Init-Data': this.initData },
        body: JSON.stringify(data),
      });
    } catch (e) {
      throw new Error('Tarmoqqa ulanib bo\'lmadi — internetni tekshiring');
    }

    let json;
    try { json = await resp.json(); }
    catch (e) { throw new Error('Server javobi tushunarsiz'); }

    if (!json.ok) {
      const err = new Error(json.error || 'Xatolik');
      err.code = json.code;
      throw err;
    }
    return json.data;
  },

  /* Fayl yuklash (chek rasmlari) */
  async upload(action, formData) {
    formData.append('init_data', this.initData);
    const resp = await fetch(this.apiUrl(`/api?action=${encodeURIComponent(action)}`), {
      method: 'POST',
      headers: { 'X-Init-Data': this.initData },
      body: formData,
    });
    const json = await resp.json();
    if (!json.ok) throw new Error(json.error || 'Xatolik');
    return json.data;
  },

  /* ================================================================
   *  TELEGRAM integratsiyalari
   * ================================================================ */
  tap() { // yengil teginish — har tugma bosilganda
    try { this.tg?.HapticFeedback?.impactOccurred('light'); } catch (e) {}
  },
  notify(type = 'success') { // natija sezilishi
    try { this.tg?.HapticFeedback?.notificationOccurred(type); } catch (e) {}
  },
  setBalance(v) {
    if (typeof v === 'number' && this.user) this.user.balance = v;
    this.paintTopbar();
  },

  /* ================================================================
   *  UI SLOTLAR — har bo'lim uchun premium custom emoji ID.
   *  Konfiguratsiya webapp/js/slots.js da (window.SLOTS).
   * ================================================================ */
  uiSlots: window.SLOTS || {},

  /**
   * Slotdan icon chizish: premium custom emoji (ID berilgan bo'lsa) yoki
   * fallback Lucide icon. Emoji bo'lsa — Lottie ANIMATSIYALI (emoji.js);
   * fayl yo'q bo'lsa avtomatik statik rasmga, u ham bo'lmasa Lucide'ga tushadi.
   * @param slot  slot nomi (masalan 'stars', 'navHome')
   * @param icon  fallback Lucide icon nomi
   * @param size  icon o'lchami
   */
  slot(slot, icon, size = 20, mode = '') {
    const cid = this.uiSlots && this.uiSlots[slot];
    if (cid && window.Emo) {
      // Placeholder — App.render oxirida Emo.mount jonlantiradi.
      return Emo.html(cid, size, '', mode);
    }
    return UI.icon(icon, size);
  },

  /* ================================================================
   *  TOPBAR — chapda gradient logotip-matn, o'ngda avatar + chip
   * ================================================================ */
  paintTopbar(title, sub = '', sideHtml = '') {
    document.getElementById('topbar-title').textContent = title || '';
    const subEl = document.getElementById('topbar-sub');
    subEl.textContent = sub;
    subEl.classList.toggle('show', !!sub);

    if (sideHtml) {
      const s = document.getElementById('topbar-side');
      s.innerHTML = sideHtml;
      if (window.Emo) Emo.mount(s);
      return;
    }

    const side = document.getElementById('topbar-side');
    let html = '';
    if (this.user && this.user.balance !== undefined && this.mode === 'user') {
      html += `<span class="chip">${App.slot('topup', 'wallet', 18)}<span class="num">${UI.num(this.user.balance)}</span></span>`;
    }
    // Doiraviy avatar: Telegram photo_url yoki bosh harf gradient
    const photo = this.user?.photo_url;
    if (photo) {
      html += `<img class="avatar" src="${UI.attr(photo)}" alt="" onerror="this.outerHTML='<span class=&quot;avatar avatar-fb&quot;>${UI.esc(UI.initials(this.user?.name))}</span>'">`;
    } else if (this.user) {
      html += `<span class="avatar avatar-fb">${UI.esc(UI.initials(this.user.name))}</span>`;
    }
    side.innerHTML = html;
    if (window.Emo) Emo.mount(side);
  },

  blockedScreen() {
    document.getElementById('tabbar').classList.add('hidden');
    this.paintTopbar('Kirish cheklandi', '');
    document.getElementById('content').innerHTML = `
      ${UI.note('err', `<b>Kirish rad etildi.</b> Siz botdan foydalanishdan bloklangansiz. Admin bilan bog'laning.`)}
      <div class="result">
        <div class="result-ic err">${UI.icon('ban', 32)}</div>
        <div class="result-t">Bloklangansiz</div>
        <div class="result-s">Agar bu xato deb hisoblasangiz admin bilan bog'laning</div>
      </div>`;
  },
};

window.App = App;
