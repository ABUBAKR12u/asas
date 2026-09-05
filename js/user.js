/**
 * user.js — Foydalanuvchi ekranlari.
 *
 * Botdagi HAR BIR funksiya to'liq ishlaydi:
 * stars/premium xaridi (recipient + o'zimga + tasdiq + natija),
 * balans, Click to'lov, admin orqali to'lov + chek yuklash,
 * tarixlar, referal, narxlar, profil.
 */

'use strict';

window.UserApp = {

  /* Buyurtma konteksti (ekranlar orasida) */
  orderCtx: null,

  /* Buyurtma turi uchun icon: animatsiyali premium emoji (slot) yoki Lucide. */
  orderIcon(type, size = 18) {
    return type === 'stars'
      ? App.slot('stars', 'star', size)
      : App.slot('premium', 'crown', size);
  },

  routes: {
    home: (v) => UserApp.home(v),
    orders: (v) => UserApp.orders(v),
    balance: (v) => UserApp.balance(v),
    referral: (v) => UserApp.referral(v),
    profile: (v) => UserApp.profile(v),

    stars: (v) => UserApp.shop(v, 'stars'),
    premium: (v) => UserApp.shop(v, 'premium'),

    order: (v, p) => UserApp.orderForm(v, p),
    topup: (v, p) => UserApp.topup(v, p),
    prices: (v) => UserApp.prices(v),
    history: (v) => UserApp.txHistory(v),
  },

  /* ================================================================
   *  ASOSIY EKRAN — yangicha menyu tuzilishi (icon-squircle uslub):
   *  1) Hero balans
   *  2) Keng "quick action" tugmalar (to'liq kenglik, icon chapda)
   *  3) Xizmatlar — guruhlangan ro'yxat (squircle iconlar)
   *  ================================================================ */
  async home(view) {
    App.paintTopbar('Stars & Premium');

    let d;
    try {
      d = await App.api('user_summary');
      App.setBalance(d.balance);
    } catch (e) {
      view.innerHTML = UI.errorBox(e.message, true);
      return;
    }

    const bal = d.balance;

    let h = `
    <div class="hero">
      <div class="hero-l">${UI.icon('wallet', 12)}BALANS</div>
      <div class="hero-v"><span class="num" id="bal-num" data-target="${bal}">0</span><small>so'm</small></div>
      <div class="hero-m">
        <span class="badge ${bal > 0 ? 'ok' : 'mute'}">${bal > 0 ? 'Faol' : 'Bo\'sh'}</span>
        <span class="badge mute">${UI.icon('package', 12)} ${UI.num(d.orders_count)} buyurtma</span>
        ${d.ref_count ? `<span class="badge acc">${UI.icon('users', 12)} ${UI.num(d.ref_count)} referal</span>` : ''}
      </div>
      <button class="hero-act" data-nav="topup" data-nav-p='{"method":"click"}'>
        ${UI.icon('plus', 16)}<span>To'ldirish</span>
      </button>
    </div>

    ${UI.section('Xizmatlar')}
    <div class="svc-grid">`;

    // Xizmatlar — KATTA animatsiyali premium emoji kartochkalar (2 ustun)
    if (d.stars_enabled) {
      h += `
      <button class="svc svc-stars" data-nav="stars">
        <span class="svc-badge">⭐ Stars</span>
        <span class="svc-emo">${App.slot('stars', 'star', 52)}</span>
        <span class="svc-t">Stars olish</span>
        <span class="svc-s">Bot, kanal, o'yinlar</span>
        <span class="svc-pill">Mavjud</span>
      </button>`;
    } else {
      h += `
      <button class="svc off" disabled>
        <span class="svc-emo">${UI.icon('star', 52)}</span>
        <span class="svc-t">Stars</span>
        <span class="svc-s">Vaqtincha o'chirilgan</span>
      </button>`;
    }
    if (d.premium_enabled) {
      h += `
      <button class="svc svc-premium" data-nav="premium">
        <span class="svc-badge prem">👑 Premium</span>
        <span class="svc-emo">${App.slot('premium', 'crown', 52)}</span>
        <span class="svc-t">Premium olish</span>
        <span class="svc-s">Obuna · 4GB fayllar</span>
        <span class="svc-pill">Mavjud</span>
      </button>`;
    } else {
      h += `
      <button class="svc off" disabled>
        <span class="svc-emo">${UI.icon('crown', 52)}</span>
        <span class="svc-t">Premium</span>
        <span class="svc-s">Vaqtincha o'chirilgan</span>
      </button>`;
    }
    h += `</div>`;

    // Keng "quick action" tugmalar — ikki katta banner (premium emoji bilan)
    h += `
    <div class="qa-grid">
      <button class="qa" data-nav="orders">
        <span class="qa-ic">${App.slot('orders', 'package', 26)}</span>
        <span class="qa-bd">
          <span class="qa-t">Buyurtmalarim</span>
          <span class="qa-s">${UI.num(d.orders_count)} ta xarid · tarix</span>
        </span>
        ${UI.icon('chevron-right', 17)}
      </button>
      <button class="qa" data-nav="referral">
        <span class="qa-ic ok">${App.slot('referral', 'gift', 26)}</span>
        <span class="qa-bd">
          <span class="qa-t">Referal dasturi</span>
          <span class="qa-s">${UI.num(d.ref_count ?? 0)} do'st · bonus oling</span>
        </span>
        ${UI.icon('chevron-right', 17)}
      </button>
    </div>

    ${UI.section('Ko\'proq')}
    <div class="card group">
      <button class="grow" data-nav="prices">
        <span class="sq">${App.slot('prices', 'tag', 20)}</span>
        <span class="bd"><span class="grow-t">Narxlar</span><span class="grow-d">Joriy tariflar ro'yxati</span></span>
        <span class="grow-end">${UI.icon('chevron-right', 16)}</span>
      </button>
      <button class="grow" data-nav="history">
        <span class="sq">${App.slot('history', 'receipt', 20)}</span>
        <span class="bd"><span class="grow-t">Tranzaksiyalar</span><span class="grow-d">Kirim-chiqim tarixi</span></span>
        <span class="grow-end">${UI.icon('chevron-right', 16)}</span>
      </button>
    </div>`;

    // So'nggi buyurtma
    if (d.orders.length) {
      const o = d.orders[0];
      const t = o.type === 'stars' ? `${UI.num(o.amount)} Stars` : `Premium ${o.amount === 12 ? '1 yil' : o.amount + ' oy'}`;
      h += `
      ${UI.section('So\'nggi buyurtma', UI.sectionLink('Barchasi', 'orders'))}
      <div class="rowcard">
        <span class="rowic ${o.type === 'stars' ? 'gold' : 'purple'}">${UserApp.orderIcon(o.type, 20)}</span>
        <div class="rowbd">
          <div class="rowt">${UI.esc(t)}</div>
          <div class="rowsub">@${UI.esc(o.recipient)} · ${UI.esc(o.date)}</div>
        </div>
        <div class="rowend"><span class="rowval">${UI.num(o.price)}</span>${UI.status(o.status)}</div>
      </div>`;
    }

    view.innerHTML = h;
    bindNav(view);
    startCountUps(view);
  },

  /* ================================================================
   *  DO'KON (stars / premium)
   * ================================================================ */
  async shop(view, type) {
    const isStars = type === 'stars';
    App.paintTopbar(isStars ? 'Stars xaridi' : 'Premium xaridi');

    let d;
    try {
      d = await App.api(isStars ? 'stars_shop' : 'premium_shop');
      App.setBalance(d.balance);
    } catch (e) {
      view.innerHTML = UI.errorBox(e.message, true);
      return;
    }

    let h = '';
    if (isStars) {
      h += `
      <div class="shop-hero shop-hero-stars">
        <span class="shop-emo">${App.slot('stars', 'star', 60)}</span>
        <div class="shop-hero-t">Telegram Stars</div>
        <div class="shop-hero-s">Bot, kanal va o'yinlar uchun raqamli valyuta</div>
      </div>`;
      h += UI.note('info', `1 dona: <b>${UI.sum(d.unit_price)}</b>, ruxsat: <b>${UI.num(d.min)}–${UI.num(d.max)}</b> dona`);
      h += `<div class="picks">`;
      // Eng tejamkor paket (arzon dona narxi) — "TOP" badge oladi
      let bestIdx = -1, bestUnit = Infinity;
      d.packs.forEach((p, i) => { const u = p.price / p.amount; if (u < bestUnit) { bestUnit = u; bestIdx = i; } });
      d.packs.forEach((p, i) => {
        const afford = p.price <= d.balance;
        h += `<button class="pickcard pk-stars ${afford ? '' : 'pk-dim'}" data-ord="${type}:${p.amount}">
          ${i === bestIdx ? `<span class="pk-tag gold">TEJAMKOR</span>` : `<span class="pk-tag ghost"></span>`}
          <div class="pk-emo">${App.slot('stars', 'star', 26)}</div>
          <div class="pk-top">${UI.num(p.amount)}</div>
          <div class="pk-cap">ta Stars</div>
          <div class="pk-price">${UI.sum(p.price)}</div>
          ${afford ? '' : `<div class="pk-note">balans kam</div>`}
        </button>`;
      });
      h += `</div>
      <button class="btn gray" id="custom-amt" style="margin-top:10px">${UI.icon('pencil', 15)} Boshqa miqdor</button>`;
    } else {
      h += `
      <div class="shop-hero shop-hero-premium">
        <span class="shop-emo">${App.slot('premium', 'crown', 60)}</span>
        <div class="shop-hero-t">Telegram Premium</div>
        <div class="shop-hero-s">4GB fayllar · tezkor yuklash · premium emoji</div>
      </div>`;
      h += `<div class="picks">`;
      d.durations.forEach(p => {
        const label = p.months === 12 ? '1 yil' : `${p.months} oy`;
        const afford = p.price <= d.balance;
        if (p.admin_only) {
          // 1 oylik — bosiladi, lekin admin bajaradigan buyurtma bo'ladi
          h += `<button class="pickcard pk-prem ${afford ? '' : 'pk-dim'}" data-ord="${type}:${p.months}">
            <span class="pk-tag warn-tag">ADMIN ORQALI</span>
            <div class="pk-emo">${App.slot('premium', 'crown', 26)}</div>
            <div class="pk-top">${UI.esc(label)}</div>
            <div class="pk-cap">Premium</div>
            <div class="pk-price">${UI.sum(p.price)}</div>
            ${afford ? '' : `<div class="pk-note">balans kam</div>`}
          </button>`;
        } else {
          h += `<button class="pickcard pk-prem ${afford ? '' : 'pk-dim'}" data-ord="${type}:${p.months}">
            ${p.months === 12 ? `<span class="pk-tag">SARFLASH</span>` : `<span class="pk-tag ghost"></span>`}
            <div class="pk-emo">${App.slot('premium', 'crown', 26)}</div>
            <div class="pk-top">${UI.esc(label)}</div>
            <div class="pk-cap">Premium</div>
            <div class="pk-price">${UI.sum(p.price)}</div>
            ${afford ? '' : `<div class="pk-note">balans kam</div>`}
          </button>`;
        }
      });
      h += `</div>`;
    }

    h += `<div class="btn-row" style="margin-top:10px">
      <button class="btn soft" data-nav="topup">${UI.icon('plus', 15)} Balans to'ldirish</button>
      <button class="btn gray" data-nav="prices">${UI.icon('tag', 15)} Narxlar</button>
    </div>`;

    view.innerHTML = h;
    bindNav(view);

    // Paket tanlash
    view.querySelectorAll('[data-ord]').forEach(btn => {
      btn.onclick = () => {
        App.tap();
        const [t, v] = btn.dataset.ord.split(':');
        App.go('order', { type: t, value: parseInt(v, 10) });
      };
    });

    // Maxsus miqdor (stars)
    const custom = view.querySelector('#custom-amt');
    if (custom) custom.onclick = async () => {
      const v = await sheetPrompt({
        title: 'Maxsus miqdor',
        sub: `${UI.num(d.min)} dan ${UI.num(d.max)} gacha`,
        icon: 'star',
        input: { type: 'number', placeholder: 'masalan: 75' },
      });
      if (v === null || v === '') return;
      const n = parseInt(String(v).replace(/\D/g, ''), 10);
      if (!n || n < d.min || n > d.max) {
        App.notify('error');
        toast(`${UI.num(d.min)} dan ${UI.num(d.max)} gacha kiriting`, 'err');
        return;
      }
      App.go('order', { type: 'stars', value: n });
    };
  },

  /* ================================================================
   *  BUYURTMA FORMASI (qabul qiluvchi)
   * ================================================================ */
  async orderForm(view, p) {
    const type = p.type === 'premium' ? 'premium' : 'stars';
    const value = parseInt(p.value, 10) || 0;
    const isStars = type === 'stars';

    // Narx oldindan (serverdan emas — faqat ko'rsatish; narx serverda qayta hisoblanadi)
    const price = p._price;

    App.paintTopbar('Buyurtma', isStars ? `${UI.num(value)} ta Stars` : `Premium ${value === 12 ? '1 yil' : value + ' oy'}`);

    const me = App.user.username ? `@${App.user.username}` : '';
    view.innerHTML = `
    ${UI.note('info', `Narx server tomonidan hisoblanadi — xavfsiz kafolatlangan.`)}
    <div class="card card-pad">
      <div class="sum">
        <div class="srow"><span class="srow-k">Xizmat</span><span class="srow-v">${isStars ? `${UI.num(value)} ta Stars` : `Premium ${value === 12 ? '1 yil' : value + ' oy'}`}</span></div>
        ${price !== undefined ? `<div class="srow"><span class="srow-k">Narx (taxminiy)</span><span class="srow-v">${UI.sum(price)}</span></div>` : ''}
      </div>

      <div class="field" style="margin-top:14px">
        <label class="field-l">Qabul qiluvchi username</label>
        <div class="inp-wrap">
          ${me ? `<span class="inp-pre" style="font-size:14px">@</span>` : `<span class="inp-pre" style="font-size:14px">@</span>`}
          <input class="inp pre" id="ord-rc" type="text" inputmode="text" autocapitalize="none"
                 placeholder="username" value="${UI.attr(me.replace('@', ''))}" autocomplete="off">
        </div>
        <div class="hint">${UI.icon('info', 14)}Kimga yuborilsin? @ belgisisiz yoki bilan</div>
      </div>

      ${me ? `<button class="btn soft" id="ord-me" style="margin-top:10px">${UI.icon('user-round', 16)} O'zimga yuborish</button>` : ''}
    </div>

    <button class="btn" id="ord-next" style="margin-top:12px">${UI.icon('arrow-right', 16)} Davom etish</button>`;

    const input = view.querySelector('#ord-rc');
    input.focus();

    const proceed = () => {
      const rc = input.value.trim().replace(/^@+/, '');
      if (!rc || /\s/.test(rc)) {
        App.notify('error');
        toast('To\'g\'ri username kiriting', 'err');
        return;
      }
      App.tap();
      UserApp.confirmOrder(type, value, rc);
    };
    view.querySelector('#ord-next').onclick = proceed;
    input.onkeydown = (e) => { if (e.key === 'Enter') proceed(); };
    const meBtn = view.querySelector('#ord-me');
    if (meBtn) meBtn.onclick = () => {
      App.tap();
      UserApp.confirmOrder(type, value, App.user.username);
    };
  },

  /* ================================================================
   *  TASDIQLASH + YUBORISH
   * ================================================================ */
  async confirmOrder(type, value, recipient) {
    showVeil('Tekshirilmoqda');
    let d;
    try {
      d = await App.api('order_preview', { order_type: type, value, recipient });
    } catch (e) {
      hideVeil();
      App.notify('error');
      toast(e.message, 'err');
      return;
    }
    hideVeil();

    const A = App;
    const isStars = d.order_type === 'stars';

    openSheet(`
      <div class="grab"></div>
      <h3>${UI.icon('clipboard-check')}Buyurtmani tasdiqlang</h3>
      <p class="sheet-sub">Ma'lumotlarni tekshirib, tasdiqlang</p>
      ${d.admin_order ? UI.note('info', `<b>1 oylik Premium — faqat admin orqali.</b> Pul balansingizdan yechilmaydi. Quyidagi tugma orqali adminga yozing va qabul qiluvchi <b>@${UI.esc(d.recipient)}</b> ni hamda summani ayting.`) : ''}
      <div class="sum">
        <div class="srow"><span class="srow-k">Xizmat</span>
          <span class="srow-v">${isStars ? `${UI.num(d.value)} ta Stars` : `Premium ${d.value === 12 ? '1 yil' : d.value + ' oy'}`}</span></div>
        <div class="srow"><span class="srow-k">Qabul qiluvchi</span><span class="srow-v">@${UI.esc(d.recipient)}</span></div>
        <div class="srow"><span class="srow-k">Narx</span><span class="srow-v">${UI.sum(d.price)}</span></div>
        <div class="srow"><span class="srow-k">Balans</span><span class="srow-v">${UI.sum(d.balance)}</span></div>
        ${d.enough
          ? `<div class="srow"><span class="srow-k">Qoldiq</span><span class="srow-v ok">${UI.sum(d.balance - d.price)}</span></div>`
          : `<div class="srow miss"><span class="srow-k">Yetishmaydi</span><span class="srow-v">${UI.sum(d.missing)}</span></div>`}
        <div class="srow total"><span class="srow-k">To'lov</span><span class="srow-v">${UI.sum(d.price)}</span></div>
      </div>
      ${d.admin_order
        ? `<button class="btn" id="ord-admin" style="margin-top:14px">${UI.icon('send', 16)} Admin bilan bog'lanish</button>
           <button class="btn gray" id="ord-close" style="margin-top:8px">Yopish</button>`
        : d.enough
        ? `<button class="btn" id="ord-go" style="margin-top:14px">${UI.icon('circle-check', 17)} Tasdiqlash</button>`
        : `${UI.note('warn', `<b>Balans yetarli emas.</b> Avval to'ldiring, keyin buyurtmani davom ettiring.`)}
           <div class="btn-row" style="margin-top:12px">
             <button class="btn soft" id="tp-click">${UI.icon('credit-card', 15)} Click</button>
             <button class="btn gray" id="tp-manual">${UI.icon('shield-check', 15)} Admin</button>
           </div>`}
    `);

    if (d.admin_order) {
      document.getElementById('ord-admin').onclick = () => App.openExternal(d.admin_link);
      document.getElementById('ord-close').onclick = () => { closeSheet(); App.back(); };
      return;
    }

    if (d.enough) {
      document.getElementById('ord-go').onclick = async () => {
        closeSheet();
        showVeil('Buyurtma yuborilmoqda');

        let res;
        try {
          res = await App.api('order_create', { order_type: d.order_type, value: d.value, recipient: d.recipient });
        } catch (e) {
          hideVeil();
          App.notify('error');
          toast(e.message, 'err');
          return;
        }

        // Fragment paket moslash — qayta tasdiqlash
        if (res.requires_reconfirm) {
          hideVeil();
          openSheet(`
            <div class="grab"></div>
            <h3>${UI.icon('rotate-cw', 14)}Fragment paketi</h3>
            <p class="sheet-sub">Fragment faqat standart paketlarda yetkazadi</p>
            <div class="sum">
              <div class="srow"><span class="srow-k">So'ralgan</span><span class="srow-v">${UI.num(res.requested_value)}</span></div>
              <div class="srow"><span class="srow-k">Yetkaziladi</span><span class="srow-v">${UI.num(res.value)}</span></div>
              <div class="srow"><span class="srow-k">Narx</span><span class="srow-v">${UI.sum(res.price)}</span></div>
            </div>
            <div class="btn-row" style="margin-top:14px">
              <button class="btn gray" id="rc-no">Bekor</button>
              <button class="btn" id="rc-yes">${UI.icon('circle-check', 16)} Tasdiq</button>
            </div>`);
          document.getElementById('rc-no').onclick = () => closeSheet();
          document.getElementById('rc-yes').onclick = () => {
            closeSheet();
            UserApp.confirmOrder(d.order_type, res.value, d.recipient);
          };
          return;
        }

        hideVeil();

        if (res.result === 'success') {
          App.notify('success');
          App.setBalance(res.new_balance);
          App.render('orders', {}, false);
          celebrate();
          toast('Buyurtma muvaffaqiyatli bajarildi', 'ok');
        } else if (res.result === 'unknown') {
          App.notify('warning');
          App.render('orders', {}, false);
          toast('Buyurtma tekshirilmoqda — holat keyinroq aniqlanadi', 'warn');
        } else {
          App.notify('error');
          App.render('orders', {}, false);
          toast('Buyurtma bajarilmadi — pul qaytarildi', 'err');
        }
      };
    } else {
      document.getElementById('tp-click').onclick = () => { closeSheet(); App.go('topup', { method: 'click' }); };
      document.getElementById('tp-manual').onclick = () => { closeSheet(); App.go('topup', { method: 'manual' }); };
    }
  },

  /* ================================================================
   *  BUYURTMALAR
   * ================================================================ */
  async orders(view) {
    App.paintTopbar('Buyurtmalarim');

    let d;
    try {
      d = await App.api('user_summary');
      App.setBalance(d.balance);
    } catch (e) {
      view.innerHTML = UI.errorBox(e.message, true);
      return;
    }

    if (!d.orders.length) {
      view.innerHTML = UI.empty('package', 'Buyurtmalar yo\'q',
        'Hali birorta ham xarid qilmagansiz. Birinchi buyurtmangizni boshlang.') +
        `<div style="margin-top:12px"><button class="btn" data-nav="home">${UI.icon('sparkles', 16)} Xarid qilish</button></div>`;
      bindNav(view);
      return;
    }

    let h = `<div class="rows">`;
    d.orders.forEach(o => {
      const t = o.type === 'stars' ? `${UI.num(o.amount)} ta Stars` : `Premium ${o.amount === 12 ? '1 yil' : o.amount + ' oy'}`;
      h += `
      <div class="rowcard">
        <span class="rowic ${o.type === 'stars' ? 'gold' : 'purple'}">${UserApp.orderIcon(o.type, 20)}</span>
        <div class="rowbd">
          <div class="rowt">${UI.esc(t)} <span class="dim">→ @${UI.esc(o.recipient)}</span></div>
          <div class="rowsub">${UI.esc(o.date)}</div>
        </div>
        <div class="rowend"><span class="rowval">${UI.num(o.price)}</span>${UI.status(o.status)}</div>
      </div>`;
    });
    h += `</div>`;
    view.innerHTML = h;
  },

  /* ================================================================
   *  BALANS
   * ================================================================ */
  async balance(view) {
    App.paintTopbar('Balans');

    let d, prices;
    try {
      [d, prices] = await Promise.all([App.api('user_summary'), App.api('prices')]);
      App.setBalance(d.balance);
    } catch (e) {
      view.innerHTML = UI.errorBox(e.message, true);
      return;
    }

    const bal = d.balance;
    const state = bal === 0 ? ['mute', 'Bo\'sh'] : bal < 10000 ? ['warn', 'Kam'] : ['ok', 'Yetarli'];

    let h = `
    <div class="hero hero-balance">
      <div class="hero-emo">${App.slot('topup', 'wallet', 48)}</div>
      <div class="hero-l">${UI.icon('wallet', 13)}JORIY BALANS</div>
      <div class="hero-v">${UI.num(bal)}<small>so'm</small></div>
      <div class="hero-m">
        <span class="badge ${state[0]}">${UI.icon('wallet', 11)}${state[1]}</span>
      </div>
    </div>

    ${UI.section('To\'ldirish usullari')}
    <div class="card group">
      <button class="grow" data-nav="topup" data-nav-p='{"method":"click"}'>
        <span class="grow ic">${App.slot('click', 'zap', 20)}</span>
        <span class="bd"><span class="grow-t">Click to'lovi</span><span class="grow-d">Avtomatik, bir necha soniyada</span></span>
        <span class="grow-end">${UI.icon('chevron-right', 16)}</span>
      </button>
      <button class="grow" data-nav="topup" data-nav-p='{"method":"manual"}'>
        <span class="grow ic">${App.slot('manual', 'shield-check', 20)}</span>
        <span class="bd"><span class="grow-t">Admin orqali</span><span class="grow-d">Kartaga o'tkazib, chek yuborish</span></span>
        <span class="grow-end">${UI.icon('chevron-right', 16)}</span>
      </button>
    </div>

    ${UI.section('Narxlar')}
    <div class="card group">
      <div class="grow" style="pointer-events:none">
        <span class="grow ic gold">${App.slot('stars', 'star', 20)}</span>
        <span class="bd"><span class="grow-t">1 dona Stars</span><span class="grow-d">${UI.num(prices.stars.min)}–${UI.num(prices.stars.max)} ta oralig'ida</span></span>
        <span class="grow-val">${UI.sum(prices.stars.unit_price)}</span>
      </div>
      ${[3, 6, 12].map(m => {
        const p = prices.premium.find(x => x.months === m);
        return p ? `
      <div class="grow" style="pointer-events:none">
        <span class="grow ic purple">${App.slot('premium', 'crown', 20)}</span>
        <span class="bd"><span class="grow-t">Premium ${m === 12 ? '1 yil' : m + ' oy'}</span></span>
        <span class="grow-val">${UI.sum(p.price)}</span>
      </div>` : '';
      }).join('')}
    </div>

    ${UI.section('Tarixlar')}
    <div class="card group">
      <button class="grow" data-nav="history">
        <span class="grow ic">${App.slot('history', 'receipt', 20)}</span>
        <span class="bd"><span class="grow-t">Tranzaksiyalar</span></span>
        <span class="grow-end">${UI.icon('chevron-right', 16)}</span>
      </button>
    </div>`;

    view.innerHTML = h;
    bindNav(view);
  },

  /* ================================================================
   *  TO'LDIRISH (click / manual + chek)
   * ================================================================ */
  async topup(view, p) {
    const method = p.method === 'manual' ? 'manual' : 'click';
    App.paintTopbar(method === 'click' ? "Click to'lovi" : "Admin orqali to'lov");

    // Minimal summani olish
    let min = 1000;
    try {
      const r = await App.api('topup_config');
      min = r.min || 1000;
    } catch (e) {}

    const quick = [min, min * 2, min * 5, 100000, 200000, 500000]
      .filter((v, i, a) => v > 0 && a.indexOf(v) === i);

    view.innerHTML = `
    <div class="card card-pad">
      <div class="field">
        <label class="field-l">Summa</label>
        <div class="inp-wrap">
          <input class="inp" id="tp-amt" type="number" inputmode="numeric" placeholder="${min}" autocomplete="off">
        </div>
        <div class="hint">${UI.icon('info', 14)}Minimal: <b>${UI.sum(min)}</b></div>
      </div>

      <div class="picks c3" style="margin-top:12px">
        ${quick.map(v => `
          <button class="pickcard" data-quick="${v}">
            <div class="pk-top" style="font-size:14px">${UI.num(v)}</div>
            <div class="pk-cap">so'm</div>
          </button>`).join('')}
      </div>

      <button class="btn" id="tp-go" style="margin-top:14px">
        ${UI.icon(method === 'click' ? 'credit-card' : 'send', 16)}
        ${method === 'click' ? "To'lov sahifasiga o'tish" : "So'rov yaratish"}
      </button>
    </div>`;

    const input = view.querySelector('#tp-amt');
    input.focus();
    view.querySelectorAll('[data-quick]').forEach(b => {
      b.onclick = () => { App.tap(); input.value = b.dataset.quick; };
    });

    view.querySelector('#tp-go').onclick = async () => {
      const amount = parseInt(String(input.value).replace(/\D/g, ''), 10);
      if (!amount || amount <= 0) { toast('Summani kiriting', 'err'); App.notify('error'); return; }
      if (amount < min) { toast(`Minimal summa: ${UI.sum(min)}`, 'err'); App.notify('error'); return; }

      App.tap();
      UserApp.showTopupDialog(method, amount, min);
    };
  },

  async showTopupDialog(method, amount, min) {
    showVeil('So\'rov yaratilmoqda');
    let d;
    try {
      d = await App.api(method === 'click' ? 'topup_click' : 'topup_manual', { amount });
    } catch (e) {
      hideVeil();
      App.notify('error');
      toast(e.message, 'err');
      return;
    }
    hideVeil();

    if (method === 'click') {
      App.notify('success');
      openSheet(`
        <div class="grab"></div>
        <h3>${UI.icon('credit-card', 16)}Click to'lovi</h3>
        <p class="sheet-sub">To'lovni Click'da bajaring — tasdiqlangach balans <b>avtomatik</b> to'ldiriladi</p>
        <div class="sum">
          <div class="srow"><span class="srow-k">Summa</span><span class="srow-v">${UI.sum(d.amount)}</span></div>
          <div class="srow"><span class="srow-k">So'rov</span><span class="srow-v">#${d.topup_id}</span></div>
        </div>
        ${UI.note('info', `${UI.icon('zap', 14)} Quyidagi tugma orqali to'lovni bajaring. Click tasdiqlagach pul o'z-o'zidan qo'shiladi va <b>bot orqali</b> sizga xabar keladi — hech qanday qo'shimcha tugma kerak emas.`)}
        <button class="btn" style="margin-top:14px" id="tp-open">
          ${UI.icon('external-link', 16)} Click'da to'lash
        </button>
        <button class="btn gray" id="tp-close" style="margin-top:8px">Yopish</button>
      `);
      // Click sahifasi iframe'da bloklanadi — Telegram openLink orqali ochamiz.
      document.getElementById('tp-open').onclick = () => App.openExternal(d.pay_url);
      document.getElementById('tp-close').onclick = () => { closeSheet(); App.render('balance', {}, false); };
    } else {
      App.notify('success');
      UserApp.manualPaymentSheet(d, min);
    }
  },

  manualPaymentSheet(d, min) {
    openSheet(`
      <div class="grab"></div>
      <h3>${UI.icon('shield-check', 16)}Admin orqali to'lov</h3>
      <p class="sheet-sub">Kartaga o'tkazing, so'ng chekni yuboring</p>

      <div class="paycard">
        <div class="pc-bank">${UI.icon('landmark', 14)} ${UI.esc(d.card.bank)}</div>
        <div class="pc-num" id="pc-num">${UI.esc(d.card.number)}</div>
        <div class="pc-holder">${UI.esc(d.card.holder)}</div>
      </div>

      <div class="sum" style="margin-top:12px">
        <div class="srow"><span class="srow-k">Summa</span><span class="srow-v">${UI.sum(d.amount)}</span></div>
        <div class="srow"><span class="srow-k">So'rov</span><span class="srow-v">#${d.topup_id}</span></div>
      </div>

      <button class="btn soft" id="pc-copy" style="margin-top:12px">${UI.icon('copy', 15)} Karta raqamini nusxalash</button>
      <button class="btn" id="pc-done" style="margin-top:8px">${UI.icon('circle-check', 16)} To'lov qildim — chek yuborish</button>
      <button class="btn gray" id="pc-cancel" style="margin-top:8px">${UI.icon('circle-x', 15)} Bekor qilish</button>
    `, { locked: true });

    document.getElementById('pc-copy').onclick = async () => {
      App.tap();
      const num = document.getElementById('pc-num').textContent.replace(/\s+/g, '');
      try { await navigator.clipboard.writeText(num); toast('Nusxalandi', 'ok'); }
      catch (e) { toast('Nusxalab bo\'lmadi', 'err'); }
    };

    document.getElementById('pc-done').onclick = () => UserApp.receiptSheet(d, min);
    document.getElementById('pc-cancel').onclick = async () => {
      const ok = await sheetConfirm('Bekor qilish', "To'lov so'rovi bekor qilinsinmi?", true);
      if (!ok) return;
      showVeil('Bekor qilinmoqda');
      try {
        await App.api('topup_cancel', { topup_id: d.topup_id });
        hideVeil();
        App.notify('warning');
        toast('So\'rov bekor qilindi', 'info');
        closeSheet();
        App.render('balance', {}, false);
      } catch (e) {
        hideVeil();
        toast(e.message, 'err');
      }
    };
  },

  receiptSheet(d, min) {
    openSheet(`
      <div class="grab"></div>
      <h3>${UI.icon('image', 16)}To'lov chekini yuboring</h3>
      <p class="sheet-sub">Chekda summa aniq ko'rinishi kerak</p>

      <div class="card card-pad" style="border-style:dashed;cursor:pointer" id="rc-zone">
        <div style="display:grid;justify-items:center;gap:6px;padding:16px 0">
          <span class="rowic" style="background:var(--bg-2)">${UI.icon('upload', 20)}</span>
          <div class="grow-t" id="rc-fname">Rasm tanlash</div>
          <div class="grow-d">JPG yoki PNG, 8MB gacha</div>
        </div>
        <input type="file" id="rc-file" accept="image/*" hidden>
      </div>

      <button class="btn" id="rc-send" style="margin-top:12px" disabled>${UI.icon('send', 16)} Yuborish</button>
      <button class="btn gray" id="rc-back" style="margin-top:8px">${UI.icon('arrow-left', 15)} Orqaga</button>
    `, { locked: true });

    const zone = document.getElementById('rc-zone');
    const fileInp = document.getElementById('rc-file');
    const sendBtn = document.getElementById('rc-send');
    const fname = document.getElementById('rc-fname');
    let picked = null;

    // Orqaga — chek yuklamasdan to'lov kartochkasiga qaytish (so'rov saqlanadi).
    document.getElementById('rc-back').onclick = () => { App.tap(); UserApp.manualPaymentSheet(d, min); };

    zone.onclick = () => fileInp.click();
    fileInp.onchange = () => {
      picked = fileInp.files[0];
      if (picked) {
        fname.textContent = picked.name;
        sendBtn.disabled = false;
      }
    };

    sendBtn.onclick = async () => {
      if (!picked) return;
      App.tap();
      sendBtn.disabled = true;
      sendBtn.innerHTML = `${UI.icon('hourglass', 16)} Yuborilmoqda`;

      const fd = new FormData();
      fd.append('topup_id', d.topup_id);
      fd.append('receipt', picked);

      try {
        await App.upload('topup_receipt', fd);
        App.notify('success');
        closeSheet();
        toast('Chek qabul qilindi — admin ko\'rib chiqadi', 'ok');
        App.render('balance', {}, false);
      } catch (e) {
        App.notify('error');
        toast(e.message, 'err');
        sendBtn.disabled = false;
        sendBtn.innerHTML = `${UI.icon('send', 16)} Yuborish`;
      }
    };
  },

  /* ================================================================
   *  REFERAL
   * ================================================================ */
  async referral(view) {
    App.paintTopbar('Referal dasturi');

    let d;
    try {
      d = await App.api('referral_info');
    } catch (e) {
      view.innerHTML = UI.errorBox(e.message, true);
      return;
    }

    let h = `
    <div class="shop-hero shop-hero-ref">
      <span class="shop-emo">${App.slot('referral', 'gift', 60)}</span>
      <div class="shop-hero-t">Referal dasturi</div>
      <div class="shop-hero-s">Do'st taklif qiling — <b>${UI.num(d.bonus_percent)}%</b> bonus oling</div>
    </div>

    ${UI.note('info', `Do'stlaringizni havola orqali taklif qiling — ular har balans to'ldirganda <b>${UI.num(d.bonus_percent)}%</b> bonus olasiz. Referal majburiy kanallarga obuna bo'lishi shart.`)}

    <div class="card card-pad">
      <div class="field-l" style="margin-bottom:8px">Sizning havolangiz</div>
      <div class="linkbox">
        <code id="ref-link">${UI.esc(d.ref_link || 'Bot username sozlanmagan') || 'Bot username sozlanmagan'}</code>
        <button class="iconbtn" id="ref-copy">${UI.icon('copy', 16)}</button>
        <button class="iconbtn" id="ref-share">${UI.icon('link', 16)}</button>
      </div>
    </div>

    <div class="tiles t3" style="margin-top:12px">
      <div class="tile"><div class="tile-l">${UI.icon('users', 13)}Jami</div><div class="tile-v">${UI.num(d.total)}</div></div>
      <div class="tile ok"><div class="tile-l">${UI.icon('circle-check', 13)}Aktiv</div><div class="tile-v">${UI.num(d.active)}</div></div>
      <div class="tile danger"><div class="tile-l">${UI.icon('triangle-alert', 13)}Nofaol</div><div class="tile-v">${UI.num(d.inactive)}</div></div>
    </div>

    <div class="card card-pad" style="margin-top:12px">
      <div class="srow">
        <span class="srow-k">${UI.icon('hand-coins', 14)} &nbsp;Umumiy daromad</span>
        <span class="srow-v" style="color:var(--ok)">${UI.sum(d.earnings)}</span>
      </div>
      ${d.rank ? `<div class="srow"><span class="srow-k">Konkurs o'rni</span><span class="srow-v">${UI.num(d.rank)}-o'rin</span></div>` : ''}
    </div>`;

    if (d.top.length) {
      h += `
      ${UI.section('TOP taklif qiluvchilar')}
      <div class="card group">`;
      d.top.forEach(t => {
        h += `
        <div class="lead">
          <span class="lead-n ${t.place <= 3 ? 'p' + t.place : ''}">${t.place}</span>
          <div class="lead-bd">
            <div class="lead-t">${UI.esc(t.name)}</div>
            <div class="lead-s">${UI.num(t.count)} ta referal</div>
          </div>
          <span class="lead-v">${UI.num(t.earnings)}</span>
        </div>`;
      });
      h += `</div>`;
    }

    view.innerHTML = h;

    const link = d.ref_link || '';
    view.querySelector('#ref-copy').onclick = async () => {
      App.tap();
      if (!link) return;
      try { await navigator.clipboard.writeText(link); toast('Havola nusxalandi', 'ok'); }
      catch (e) { toast('Nusxalab bo\'lmadi', 'err'); }
    };
    view.querySelector('#ref-share').onclick = () => {
      App.tap();
      if (!link) return;
      const url = 'https://t.me/share/url?url=' + encodeURIComponent(link) +
        '&text=' + encodeURIComponent('Telegram Stars va Premium — eng arzon narxda!');
      if (App.tg?.openTelegramLink) App.tg.openTelegramLink(url);
    };
  },

  /* ================================================================
   *  NARXLAR
   * ================================================================ */
  async prices(view) {
    App.paintTopbar('Narxlar');
    view.innerHTML = UI.skeleton(2, 90);

    let d;
    try { d = await App.api('prices'); }
    catch (e) { view.innerHTML = UI.errorBox(e.message, true); return; }

    let h = `
    ${UI.section('Telegram Stars')}
    <div class="card card-pad">
      <div class="srow"><span class="srow-k">1 dona narxi</span><span class="srow-v">${UI.sum(d.stars.unit_price)}</span></div>
      <div class="srow"><span class="srow-k">Minimal miqdor</span><span class="srow-v">${UI.num(d.stars.min)} ta</span></div>
      <div class="srow"><span class="srow-k">Maksimal miqdor</span><span class="srow-v">${UI.num(d.stars.max)} ta</span></div>
    </div>

    ${UI.section('Telegram Premium')}
    <div class="card card-pad">`;

    d.premium.forEach(p => {
      h += `<div class="srow"><span class="srow-k">${p.months === 12 ? '1 yil' : p.months + ' oy'}</span><span class="srow-v">${UI.sum(p.price)}</span></div>`;
    });

    h += `</div>
    <div class="btn-row" style="margin-top:14px">
      <button class="btn soft" data-nav="stars">${UI.icon('star', 16)} Stars olish</button>
      <button class="btn gray" data-nav="premium">${UI.icon('crown', 16)} Premium olish</button>
    </div>`;

    view.innerHTML = h;
    bindNav(view);
  },

  /* ================================================================
   *  TRANZAKSIYALAR TARIXI
   * ================================================================ */
  async txHistory(view) {
    App.paintTopbar('Tranzaksiyalar');

    let d;
    try { d = await App.api('tx_history'); }
    catch (e) { view.innerHTML = UI.errorBox(e.message, true); return; }

    if (!d.transactions.length) {
      view.innerHTML = UI.empty('receipt', 'Tarix bo\'sh', 'Balans harakatlari hali yo\'q');
      return;
    }

    const iconMap = {
      topup_click: ['click', 'arrow-down-left', 'ok'],
      topup_admin: ['manual', 'arrow-down-left', 'ok'],
      purchase: ['txOut', 'arrow-up-right', 'danger'],
      refund: ['txRefund', 'rotate-cw', 'warn'],
      referral_bonus: ['txBonus', 'hand-coins', 'ok'],
      referral_bonus_subscription: ['txBonus', 'hand-coins', 'ok'],
    };

    let h = `<div class="rows">`;
    d.transactions.forEach(t => {
      const [slot, ic, cls] = iconMap[t.type] || ['txIn', 'circle', 'mute'];
      const plus = t.amount >= 0;
      h += `
      <div class="rowcard">
        <span class="rowic ${plus ? 'ok' : 'danger'}">${App.slot(slot, ic, 20)}</span>
        <div class="rowbd">
          <div class="rowt">${UI.esc(t.description || t.type)}</div>
          <div class="rowsub">${UI.esc(t.date)}</div>
        </div>
        <div class="rowend"><span class="rowval ${plus ? 'ok' : 'danger'}">${plus ? '+' : ''}${UI.num(t.amount)}</span></div>
      </div>`;
    });
    h += `</div>`;
    view.innerHTML = h;
  },

  /* ================================================================
   *  PROFIL — kengaytirilgan: hero, statistika, bo'limlar, ma'lumot
   * ================================================================ */
  async profile(view) {
    App.paintTopbar('Profil');
    const u = App.user;

    view.innerHTML = UI.skeleton(3, 90);
    let d = null;
    try { d = await App.api('profile_info'); App.setBalance(d.balance); }
    catch (e) { /* stats siz ham ko'rsatamiz */ }

    const photo = u.photo_url;
    const ava = photo
      ? `<img class="prof-ava" src="${UI.attr(photo)}" alt="" onerror="this.outerHTML='<span class=&quot;prof-ava prof-ava-fb&quot;>${UI.esc(UI.initials(u.name))}</span>'">`
      : `<span class="prof-ava prof-ava-fb">${UI.esc(UI.initials(u.name))}</span>`;

    let h = `
    <div class="prof-hero">
      <span class="prof-emo">${App.slot('profile', 'user-round', 44)}</span>
      <div class="prof-id">
        ${ava}
        <div class="prof-txt">
          <div class="prof-name">${UI.esc(u.name || 'Foydalanuvchi')}</div>
          <div class="prof-sub">${u.username ? '@' + UI.esc(u.username) : 'ID: ' + u.id}</div>
        </div>
      </div>
      <div class="prof-bal">
        <span class="prof-bal-l">${App.slot('topup', 'wallet', 16)} Balans</span>
        <span class="prof-bal-v"><span class="num" data-target="${d ? d.balance : u.balance}">0</span> so'm</span>
      </div>
    </div>`;

    if (d) {
      h += `
    ${UI.section('Mening statistika')}
    <div class="tiles">
      <div class="tile"><div class="tile-l">${UI.icon('package', 13)}Buyurtmalar</div><div class="tile-v">${UI.num(d.orders_count)}</div></div>
      <div class="tile gold"><div class="tile-l">${UI.icon('shopping-bag', 13)}Jami xarid</div><div class="tile-v">${UI.num(d.total_spent)}</div><div class="tile-s">so'm</div></div>
      <div class="tile ok"><div class="tile-l">${UI.icon('arrow-down-left', 13)}Kirimlar</div><div class="tile-v">${UI.num(d.total_topup)}</div><div class="tile-s">so'm to'ldirilgan</div></div>
      <div class="tile purple"><div class="tile-l">${UI.icon('users', 13)}Referallar</div><div class="tile-v">${UI.num(d.ref_count)}</div></div>
    </div>`;
    }

    h += `
    ${UI.section('Bo\'limlar')}
    <div class="card group">
      <button class="grow" data-nav="orders">
        <span class="grow ic">${App.slot('orders', 'package', 19)}</span>
        <span class="bd"><span class="grow-t">Buyurtmalarim</span><span class="grow-d">Xaridlar tarixi va holati</span></span>
        <span class="grow-end">${UI.icon('chevron-right', 16)}</span>
      </button>
      <button class="grow" data-nav="history">
        <span class="grow ic">${App.slot('history', 'receipt', 19)}</span>
        <span class="bd"><span class="grow-t">Tranzaksiyalar</span><span class="grow-d">Kirim-chiqim tarixi</span></span>
        <span class="grow-end">${UI.icon('chevron-right', 16)}</span>
      </button>
      <button class="grow" data-nav="balance">
        <span class="grow ic">${App.slot('topup', 'wallet', 19)}</span>
        <span class="bd"><span class="grow-t">Balans</span><span class="grow-d">To'ldirish va narxlar</span></span>
        <span class="grow-end">${UI.icon('chevron-right', 16)}</span>
      </button>
      <button class="grow" data-nav="referral">
        <span class="grow ic">${App.slot('referral', 'gift', 19)}</span>
        <span class="bd"><span class="grow-t">Referal dasturi</span><span class="grow-d">Do'st taklif qilib ishlang</span></span>
        <span class="grow-end">${UI.icon('chevron-right', 16)}</span>
      </button>
      <button class="grow" data-nav="prices">
        <span class="grow ic">${App.slot('prices', 'tag', 19)}</span>
        <span class="bd"><span class="grow-t">Narxlar</span><span class="grow-d">Joriy tariflar</span></span>
        <span class="grow-end">${UI.icon('chevron-right', 16)}</span>
      </button>
    </div>

    ${UI.section('Xizmatlar')}
    <div class="card group">
      <button class="grow" data-nav="stars">
        <span class="grow ic gold">${App.slot('stars', 'star', 19)}</span>
        <span class="bd"><span class="grow-t">Stars olish</span></span>
        <span class="grow-end">${UI.icon('chevron-right', 16)}</span>
      </button>
      <button class="grow" data-nav="premium">
        <span class="grow ic purple">${App.slot('premium', 'crown', 19)}</span>
        <span class="bd"><span class="grow-t">Premium olish</span></span>
        <span class="grow-end">${UI.icon('chevron-right', 16)}</span>
      </button>
    </div>`;

    if (d && d.joined) {
      h += `
    ${UI.section('Hisob')}
    <div class="card group">
      <div class="grow" style="pointer-events:none">
        <span class="grow ic">${UI.icon('calendar', 16)}</span>
        <span class="bd"><span class="grow-t">Ro'yxatdan o'tgan</span></span>
        <span class="grow-val">${UI.esc(d.joined)}</span>
      </div>
      <div class="grow" style="pointer-events:none">
        <span class="grow ic">${UI.icon('at-sign', 16)}</span>
        <span class="bd"><span class="grow-t">ID</span></span>
        <span class="grow-val">${u.id}</span>
      </div>
    </div>`;
    }

    if (App.isAdmin) {
      h += `
      ${UI.section('Admin')}
      <button class="card prof-admin" id="to-admin">
        <span class="rowic purple">${App.slot('admin', 'shield-check', 20)}</span>
        <span class="bd"><span class="grow-t">Admin panel</span><span class="grow-d">Statistika, boshqaruv, sozlamalar</span></span>
        ${UI.icon('chevron-right', 16)}
      </button>`;
    }

    h += `<p class="prof-foot">Stars &amp; Premium Mini App · v2.0</p>`;

    view.innerHTML = h;
    bindNav(view);
    startCountUps(view);

    const ta = view.querySelector('#to-admin');
    if (ta) ta.onclick = () => { App.tap(); App.start('admin'); };
  },
};

/* ================================================================
 *  YORDAMCHILAR (global) — sheet, veil, toast, nav binding
 * ================================================================ */

/** data-nav / data-nav-p atributli tugmalarni routerga ulaydi. */
function bindNav(root) {
  root.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      App.tap();
      let p = {};
      try { p = el.dataset.navP ? JSON.parse(decodeURIComponent(el.dataset.navP)) : {}; }
      catch (e) {}
      App.go(el.dataset.nav, p);
    });
  });
}

/** COUNT-UP: raqamlar bir zumda emas, oshib boradi (hayot hissi). */
function startCountUps(root, dur = 800) {
  root.querySelectorAll('.num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target, 10) || 0;
    const from = parseInt(el.dataset.cur || '0', 10);
    const t0 = performance.now();
    el.dataset.cur = String(target);
    function frame(now) {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(from + (target - from) * eased);
      el.textContent = String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}

/** Pastdan chiqadigan modal (sheet). */
function openSheet(html, opts) {
  const root = document.getElementById('sheet-root');
  const sheet = document.getElementById('sheet');
  sheet.innerHTML = html;
  root.classList.remove('hidden');
  // locked: tashqi (backdrop) bosilganda yopilmasin — masalan chek yuklash
  // jarayonida tasodifan yopib, ishni buzib qo'ymaslik uchun. Yopish faqat
  // sheet ichidagi aniq tugmalar orqali bo'ladi.
  const locked = !!(opts && opts.locked);
  document.getElementById('sheet-backdrop').onclick = locked ? null : closeSheet;
  if (window.Emo) Emo.mount(sheet);
}

function closeSheet() {
  document.getElementById('sheet-root').classList.add('hidden');
  document.getElementById('sheet').innerHTML = '';
}

/** Tasdiqlash sheet'i (Promise<boolean>). */
function sheetConfirm(title, text, danger = false) {
  return new Promise(resolve => {
    openSheet(`
      <div class="grab"></div>
      <h3>${UI.icon(danger ? 'triangle-alert' : 'help-circle')} ${UI.esc(title)}</h3>
      <p class="sheet-sub">${UI.esc(text)}</p>
      <div class="btn-row" style="margin-top:16px">
        <button class="btn gray" id="sc-no">Bekor</button>
        <button class="btn ${danger ? 'red' : ''}" id="sc-yes">Davom etish</button>
      </div>`);
    document.getElementById('sc-no').onclick = () => { closeSheet(); resolve(false); };
    document.getElementById('sc-yes').onclick = () => { closeSheet(); resolve(true); };
  });
}

/** Kiritish sheet'i (Promise<string|null>). */
function sheetPrompt({ title, sub = '', icon = 'pencil', input = {} }) {
  return new Promise(resolve => {
    openSheet(`
      <div class="grab"></div>
      <h3>${UI.icon(icon)} ${UI.esc(title)}</h3>
      ${sub ? `<p class="sheet-sub">${UI.esc(sub)}</p>` : ''}
      <div class="field" style="margin-top:12px">
        <input class="inp" id="sp-in" type="${input.type || 'text'}"
               placeholder="${UI.attr(input.placeholder || '')}" autocomplete="off">
      </div>
      <div class="btn-row" style="margin-top:12px">
        <button class="btn gray" id="sp-no">Bekor</button>
        <button class="btn" id="sp-yes">Tasdiqlash</button>
      </div>`);
    const inp = document.getElementById('sp-in');
    inp.focus();
    const done = (v) => { closeSheet(); resolve(v); };
    document.getElementById('sp-no').onclick = () => done(null);
    document.getElementById('sp-yes').onclick = () => done(inp.value.trim());
    inp.onkeydown = (e) => { if (e.key === 'Enter') done(inp.value.trim()); };
  });
}

/** Bloklovchi yuklanish qatlami. */
function showVeil(text = 'Bajarilmoqda') {
  document.getElementById('veil-text').textContent = text;
  document.getElementById('veil').classList.remove('hidden');
}
function hideVeil() {
  document.getElementById('veil').classList.add('hidden');
}

/** Muvaffaqiyat portlashi — markazda 🎉 konfetti (bir marta). */
function celebrate() {
  const cid = (window.SLOTS && window.SLOTS.success) || '';
  if (!cid || !window.Emo) return;
  const el = document.createElement('div');
  el.className = 'celebrate';
  el.innerHTML = Emo.html(cid, 120, '', 'once');
  document.body.appendChild(el);
  Emo.mount(el);
  setTimeout(() => el.remove(), 2600);
}

/** Toast xabar — animatsiyali premium emoji bilan. */
function toast(msg, type = 'info') {
  const slotMap = { ok: 'stOk', err: 'stFail', warn: 'stWait', info: 'stInfo' };
  const iconMap = { ok: 'circle-check', err: 'circle-alert', warn: 'triangle-alert', info: 'info' };
  const ic = (window.Emo && window.SLOTS && window.SLOTS[slotMap[type]])
    ? App.slot(slotMap[type], iconMap[type], 20)
    : UI.icon(iconMap[type] || 'info', 16);
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${ic}<span>${UI.esc(msg)}</span>`;
  const root = document.getElementById('toast-root');
  root.appendChild(el);
  if (window.Emo) Emo.mount(el);
  setTimeout(() => el.classList.add('hide'), 2500);
  setTimeout(() => el.remove(), 2900);
}

window.bindNav = bindNav;
window.openSheet = openSheet;
window.closeSheet = closeSheet;
window.sheetConfirm = sheetConfirm;
window.sheetPrompt = sheetPrompt;
window.showVeil = showVeil;
window.hideVeil = hideVeil;
window.showTopupDialog = (m, a, mn) => UserApp.showTopupDialog(m, a, mn);
window.toast = toast;
window.celebrate = celebrate;
window.startCountUps = startCountUps;
