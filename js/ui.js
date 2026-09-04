/**
 * ui.js — Iconlar va umumiy UI komponentlar.
 *
 * ICON TIZIMI: Lucide rasmiy SVG path'lari icons.js da self-hosted.
 * Iconlar CDN'siz, bir zumda, har qanday tarmoqda chiziladi.
 */

'use strict';

const UI = {

  /* ============ TWEMOJI (Telegram emoji, self-hosted SVG) ============ */
  /** Katta rangli emoji icon — Telegram o'zi ishlatadigan Twemoji to'plamidan.
   *  code: Twemoji codepoint ("2b50", "1f451", ...), size: px */
  emoji(code, size = 24) {
    return `<img class="emoji emoji-drop" src="/emoji/${code}.svg" width="${size}" height="${size}"
      alt="" loading="lazy" draggable="false">`;
  },

  /* ============ CUSTOM PREMIUM EMOJI (import qilingan) ============ */
  /** Telegram premium custom emoji — Emoji Studio'da import qilingan.
   *  Animatsiyali Lottie (emoji.js). cid: custom_emoji_id, size: px.
   *  mount() App.render/openSheet tomonidan avtomatik chaqiriladi. */
  cust(cid, size = 44) {
    return window.Emo ? Emo.html(cid, size) : '';
  },

  /* ============ ICON (Lucide — kichik UI belgilar) ============ */
  icon(name, size = 18) {
    const inner = window.ICONS && window.ICONS[name];
    if (!inner) {
      console.warn('icon topilmadi:', name);
      return `<span style="width:${size}px;height:${size}px;display:inline-block"></span>`;
    }
    return `<svg class="ic" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" `
      + `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" `
      + `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  },

  /* ============ FORMATLASH ============ */
  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  attr(s) { return this.esc(s); },
  num(n) {
    const v = Math.round(Number(n) || 0);
    return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  },
  sum(n) { return this.num(n) + " so'm"; },
  initials(name) {
    return String(name || 'U').trim().charAt(0).toUpperCase() || 'U';
  },
  date(s) { return String(s || '').slice(0, 16).replace('T', ' '); },

  status(st) {
    const map = {
      success: ['ok', 'circle-check', 'Bajarildi'],
      paid: ['ok', 'circle-check', "To'langan"],
      pending: ['warn', 'clock', 'Kutilmoqda'],
      failed: ['danger', 'circle-x', 'Xatolik'],
      cancelled: ['danger', 'circle-x', 'Bekor'],
      sending: ['warn', 'send', 'Yuborilmoqda'],
      done: ['ok', 'circle-check', 'Yuborildi'],
      blocked: ['danger', 'ban', 'Blok'],
    };
    const [cls, ic, label] = map[st] || ['mute', 'circle', st];
    return `<span class="badge ${cls}">${this.icon(ic, 11)}${this.esc(label)}</span>`;
  },

  /* ============ SKELET / BO'SH / XATO ============ */
  skeleton(n = 4, h = 64) {
    let out = '';
    for (let i = 0; i < n; i++) out += `<div class="sk" style="height:${h}px;margin-bottom:9px"></div>`;
    return out;
  },
  empty(icon, title, sub, actionHtml = '') {
    return `<div class="empty">
      <div class="empty-ic">${this.icon(icon, 26)}</div>
      <div class="empty-t">${this.esc(title)}</div>
      <div class="empty-s">${this.esc(sub)}</div>
      ${actionHtml}
    </div>`;
  },
  errorBox(msg, retry = false) {
    return `<div class="note err">${this.icon('circle-alert')}<div>${this.esc(msg)}</div></div>
      ${retry ? `<button class="btn soft" id="retry-btn">${this.icon('rotate-cw', 15)} Qayta urinish</button>` : ''}`;
  },

  /* ============ BO'LIM SARLAVHASI ============ */
  section(title, action = '') {
    return `<div class="sec"><span class="sec-t">${this.esc(title)}</span>${action}</div>`;
  },
  sectionLink(label, route, params) {
    const p = params ? encodeURIComponent(JSON.stringify(params)) : '';
    return `<button class="sec-a" data-nav="${this.attr(route)}" ${p ? `data-nav-p="${p}"` : ''}>${this.esc(label)}${this.icon('chevron-right', 13)}</button>`;
  },

  /* ============ NOTE / BANNER ============ */
  note(type, html) {
    const ic = { info: 'info', warn: 'triangle-alert', err: 'circle-alert', okn: 'circle-check' }[type] || 'info';
    return `<div class="note ${type}">${this.icon(ic)}<div>${html}</div></div>`;
  },
};

window.UI = UI;
