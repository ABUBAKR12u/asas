/**
 * slots.js — UI slot -> Telegram premium custom emoji ID konfiguratsiyasi.
 *
 * QANDAY ISHLAYDI:
 *   Har bir bo'lim (stars, premium, ...) uchun custom emoji ID shu yerda.
 *   ID import qilingan bo'lsa, UI'da aynan o'sha Telegram PREMIUM emoji
 *   haqiqiy Lottie animatsiya bilan qimirlaydi (emoji.js rendereri);
 *   bo'lmasa (null yoki fayl yo'q) avtomatik Lucide icon'ga tushadi.
 *
 * QAYERDAN KELGAN:
 *   Import qilingan premium paketlar (Emoji Studio yoki _import_packs.py):
 *   tgiosicons (iOS uslubidagi UI ikonkalari — nav/menyu uchun ideal),
 *   FinanceEmoji (moliya), TONEmoji (kripto/hamyon), ApplicationEmoji.
 *
 * QOIDA: 19px+ joylarda emoji, undan kichik (badge, tugma ichi) — Lucide.
 */
'use strict';

window.SLOTS = {
  /* ---- Asosiy xizmatlar (katta, boy animatsiyalar) ---- */
  stars:    '5897588682705081557',  // ⭐️ katta yulduz
  premium:  '5897920748101571572',  // 🌟 nurli yulduz
  topup:    '5287231198098117669',  // 💰 pul xaltasi (FinanceEmoji)
  referral: '5850323366476519158',  // 🎁 sovg'a
  prices:   '6014655953457123498',  // 💱 valyuta almashinuvi
  orders:   '5778672437122045013',  // 📦 quti (tgiosicons)
  profile:  '6050773179557745617',  // 🫡 salyut
  history:  '5444856076954520455',  // 🧾 chek (FinanceEmoji)
  success:  '6041731551845159060',  // 🎉 konfetti (tgiosicons)
  admin:    '5805553606635559688',  // 👑 toj (tgiosicons)

  /* ---- To'lov usullari ---- */
  click:    '5197434882321567830',  // 💵 naqd karta (FinanceEmoji)
  manual:   '6030537007350944596',  // 🛡 qalqon — admin kafolati (tgiosicons)
  card:     '5445353829304387411',  // 💳 bank kartasi (FinanceEmoji)
  bank:     '5238132025323444613',  // 🏦 bank binosi (TONEmoji)

  /* ---- Buyurtma holatlari (o'rta o'lchamli joylar uchun) ---- */
  stOk:     '5774022692642492953',  // ✅
  stWait:   '5850317551090800862',  // ⏰
  stFail:   '6030757850274336631',  // ❌
  stSend:   '6039573425268201570',  // 📤 jo'natilmoqda (tgiosicons)
  stInfo:   '6028435952299413210',  // ℹ ma'lumot (tgiosicons)

  /* ---- Tranzaksiya turlari (FinanceEmoji) ---- */
  txIn:     '5443127283898405358',  // 📥 kirim (balans to'ldirish)
  txOut:    '5445355530111437729',  // 📤 chiqim (xarid)
  txRefund: '5769248574499983619',  // 🔄 qaytarish (tgiosicons)
  txBonus:  '5778613750688911681',  // 🪙 bonus tangasi (tgiosicons)

  /* ---- Admin panel bo'limlari ---- */
  aStats:   '5936143551854285132',  // 📊 diagramma (tgiosicons)
  aUsers:   '6032609071373226027',  // 👥 ikki kishi (tgiosicons)
  aPricing: '5888620056551625531',  // 🏷 narx tegi (tgiosicons)
  aProviders: '6028171274939797252',// 🔗 ulanish (tgiosicons)
  aApi:     '5938539885907415367',  // 📈 o'sish grafigi (tgiosicons)
  aBroadcast: '6039450962865688331',// 📣 megafon (tgiosicons)
  aChannels: '6030399199030284183', // 📍 belgi/kanal (tgiosicons)
  aReferrals: '5188344996356448758',// 🏆 kubok (TONEmoji)
  aServices: '5962952497197748583', // 🔧 kalit (tgiosicons)
  aSettings: '5904258298764334001', // ⚙️ tishli (tgiosicons)
  aSearch:  '6032850693348399258',  // 🔎 qidiruv (tgiosicons)
  aKey:     '5307843983102204243',  // 🔑 kalit (TONEmoji)
  aBonus:   '5778613750688911681',  // 🪙 tanga (tgiosicons)
  aUsd:     '5312441427764989435',  // 💱 (FinanceEmoji)
  aBlock:   '6037249452824072506',  // 🔒 qulf (tgiosicons)
  aRocket:  '5195033767969839232',  // 🚀 raketa (FinanceEmoji)

  /* ---- Pastki navbar (user) — tgiosicons, iOS uslubiga mos ---- */
  navHome:     '6042137469204303531',  // 🏠
  navOrders:   '5778672437122045013',  // 📦
  navBalance:  '5769126056262898415',  // 👛 hamyon
  navReferral: '5773677501825945508',  // 🎁
  navProfile:  '6032994772321309200',  // 👤

  /* ---- Pastki navbar (admin) ---- */
  navDash:   '5936143551854285132',    // 📊
  navUsers:  '6032609071373226027',    // 👥
  navTopups: '5445353829304387411',    // 💳
  navMore:   '5904258298764334001',    // ⚙️
};
