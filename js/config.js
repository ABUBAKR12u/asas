/**
 * config.js — Frontend konfiguratsiyasi (barcha skriptlardan OLDIN yuklanadi).
 *
 * API_BASE — backend (webapp_server.py) manzili.
 *   ''  — bir xil server (ngrok/local: webapp va API bitta joyda) — hozirgi holat
 *   'https://bot.example.uz' — Vercel rejimi: frontend Vercel'da,
 *       API/emoji/receipts shared hosting'da. Oxirida / bo'lmasin.
 *
 * Vercel'ga joylashda: shu fayldagi API_BASE'ni hosting domeniga
 * o'zgartiring va qayta deploy qiling.
 */
'use strict';

window.APP_CONFIG = {
  API_BASE: 'https://6a7ad234b70e2.myxvest2.ru',
};
