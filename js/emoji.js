/**
 * emoji.js — Telegram PREMIUM custom emoji (Lottie) rendereri.
 *
 * Nima uchun: Telegram premium emoji'lar — .tgs (gzip Lottie JSON).
 * Server ularni .json qilib saqlaydi. Bu modul ularni haqiqiy
 * harakat bilan chizadi (lottie-web, self-hosted).
 *
 * Xususiyatlar:
 *  - Lazy: faqat ekranga kirganda ishga tushadi (IntersectionObserver),
 *    chiqib ketsa pauza — batareya tejaladi.
 *  - Cache: bitta emoji bir necha joyda bo'lsa, JSON bir marta yuklanadi.
 *  - Fallback: .json bo'lmasa statik .webp rasmga tushadi — hech qachon
 *    bo'sh joy qolmaydi.
 *
 * Ishlatish:
 *   Emo.html(cid, size)        -> placeholder markup
 *   Emo.mount(root)            -> root ichidagi placeholderlarni jonlantirish
 *   App.slot('stars', ...)     -> slot orqali (slots.js konfiguratsiyasi)
 */

'use strict';

const Emo = {

  _cache: Object.create(null),   // cid -> animationData | null (null = mavjud emas)
  _inst: new WeakMap(),          // container el -> lottie instance
  _io: null,                     // IntersectionObserver
  _seq: 0,

  /* Placeholder markup — keyin Emo.mount jonlantiradi.
     mode: '' (loop) | 'once' (bir marta) | 'tab' (statik kadr, play() bilan jonlanadi) */
  html(cid, size = 24, cls = '', mode = '') {
    if (!cid) return '';
    return `<span class="emo ${cls}" data-cid="${cid}" data-mode="${mode}" `
      + `style="width:${size}px;height:${size}px"></span>`;
  },

  /* Placeholder markup — slot nomi orqali (App.slot bilan bir xil slotlar). */
  slotHtml(slot, size = 24, cls = '') {
    const cid = (window.SLOTS && window.SLOTS[slot]) || '';
    return this.html(cid, size, cls);
  },

  /* root ichidagi barcha jonlanmagan .emo larni kuzatuvga olish. */
  mount(root) {
    if (!root) return;
    const nodes = root.querySelectorAll('.emo:not([data-mounted])');
    if (!nodes.length) return;
    if (!this._io) this._initIO();
    nodes.forEach(el => { el.dataset.mounted = '1'; this._io.observe(el); });
  },

  /* Har bir view render'dan keyin chaqiriladigan tozalash: ko'rinmaydigan
     eski instanslarni bo'shatish (xotira). */
  gc() {
    // WeakMap o'zi tozalaydi; qo'shimcha ish yo'q.
  },

  _initIO() {
    this._io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        const el = en.target;
        if (en.isIntersecting) this._activate(el);
        else this._pause(el);
      });
    }, { rootMargin: '120px 0px', threshold: 0.01 });
  },

  /* Ekranga kirdi — yukla va ijro et. */
  async _activate(el) {
    const cid = el.dataset.cid;
    if (!cid) return;
    if (el.dataset.state === 'ready') { this._play(el); return; }
    if (el.dataset.state === 'loading') return;
    el.dataset.state = 'loading';

    let data = this._cache[cid];
    if (data === undefined) {
      data = await this._fetch(cid);
      this._cache[cid] = data;
    }

    // Element hali DOM'dami? (view almashgan bo'lishi mumkin)
    if (!el.isConnected) { el.dataset.state = ''; return; }

    if (!data) { this._fallback(el, cid); return; }

    el.innerHTML = '';
    el.dataset.state = 'ready';
    const mode = el.dataset.mode || '';
    try {
      const anim = lottie.loadAnimation({
        container: el,
        renderer: 'svg',
        loop: mode === '',          // faqat oddiy mode doim aylanadi
        autoplay: mode !== 'tab',   // tab: to'xtiq; once: 1 marta; '': doim
        animationData: data,
      });
      this._inst.set(el, anim);
      if (mode === 'once') {
        anim.addEventListener('complete', () => { try { anim.destroy(); } catch (e) {} });
      } else if (mode === 'tab') {
        // Oxirgi kadr — to'liq chizilgan icon (1-kadr ko'pincha bo'sh/fade-in).
        if (el.closest('.tab.on')) { try { anim.goToAndPlay(0, true); } catch (e) {} }
        else { try { anim.goToAndStop(anim.totalFrames - 1, true); } catch (e) {} }
      } else {
        this._play(el);
      }
    } catch (e) {
      this._fallback(el, cid);
    }
  },

  /* Tab rejimidagi emoji: aktiv -> 1 marta aylanib tinchlanadi;
     noaktiv -> oxirgi kadrda statik (to'liq ko'rinadigan icon). */
  setTabActive(el, active) {
    const a = this._inst.get(el);
    if (!a) return;
    try {
      if (active) a.goToAndPlay(0, true);
      else a.goToAndStop(a.totalFrames - 1, true);
    } catch (e) {}
  },

  _play(el) {
    const a = this._inst.get(el);
    if (a) { try { a.goToAndPlay(0, true); } catch (e) { try { a.play(); } catch (_) {} } }
  },
  _pause(el) {
    const a = this._inst.get(el);
    if (!a) return;
    // Tab mode: ekrandan chiqsa birinchi kadrga qaytadi (statik ko'rinish).
    if (el.dataset.mode === 'tab') { try { a.goToAndStop(0, true); } catch (e) {} return; }
    try { a.pause(); } catch (e) {}
  },

  /* Emoji fayllari — statik asset, frontend BILAN BIRGA deploy qilinadi
     (Vercel'ga webapp/emoji/ papkasi bilan). Shuning uchun NISBIY yo'l:
     Vercel rejimida Vercel'dan, lokal/ngrok rejimida serverdan olinadi. */
  _fallback(el, cid) {
    el.dataset.state = 'fallback';
    el.innerHTML = `<img src="/emoji/custom/${cid}.webp" alt="" draggable="false" `
      + `style="width:100%;height:100%;object-fit:contain;display:block">`;
  },

  /* /emoji/custom/{cid}.json yuklash. Mavjud bo'lmasa null. */
  async _fetch(cid) {
    try {
      const r = await fetch(`/emoji/custom/${cid}.json`);
      if (!r.ok) return null;
      return await r.json();
    } catch (e) {
      return null;
    }
  },

  /* Bir marta ijro etib to'xtatadigan "portlash" effekti (muvaffaqiyat ekrani). */
  async burst(el, cid) {
    if (!el || !cid) return;
    let data = this._cache[cid];
    if (data === undefined) { data = await this._fetch(cid); this._cache[cid] = data; }
    if (!data) { this._fallback(el, cid); return; }
    el.innerHTML = '';
    try {
      const anim = lottie.loadAnimation({
        container: el, renderer: 'svg', loop: false, autoplay: true, animationData: data,
      });
      anim.addEventListener('complete', () => { try { anim.destroy(); } catch (e) {} });
    } catch (e) { this._fallback(el, cid); }
  },
};

window.Emo = Emo;
