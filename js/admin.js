/**
 * admin.js — Admin panel (botdagi barcha admin funksiyalari).
 *
 * Dashboard (grafik) · Foydalanuvchilar (qidiruv) · Foydalanuvchi
 * kartochkasi (blok, balans) · To'lovlar (chek tasdiqlash) ·
 * Buyurtmalar · Narx/limit sozlamalari · Karta · Providerlar ·
 * Xizmatlar · Broadcast · Kanallar · Referallar · API hisobi.
 */

'use strict';

window.AdminApp = {

  routes: {
    'dash': (v) => AdminApp.dash(v),
    'a-users': (v, p) => AdminApp.users(v, p),
    'a-topups': (v, p) => AdminApp.topups(v, p),
    'a-orders': (v, p) => AdminApp.orders(v, p),
    'a-more': (v) => AdminApp.more(v),
    'a-user': (v, p) => AdminApp.userCard(v, p),
    'a-pricing': (v) => AdminApp.pricing(v),
    'a-card': (v) => AdminApp.cardSettings(v),
    'a-providers': (v) => AdminApp.providers(v),
    'a-broadcast': (v) => AdminApp.broadcast(v),
    'a-channels': (v) => AdminApp.channels(v),
    'a-referrals': (v) => AdminApp.referrals(v),
    'a-api': (v, p) => AdminApp.apiInfo(v, p),
    'a-services': (v) => AdminApp.services(v),
    'a-admin-orders': (v, p) => AdminApp.adminOrders(v, p),
  },

  /* ================================================================
   *  DASHBOARD
   * ================================================================ */
  async dash(view) {
    App.paintTopbar('Admin panel', '', `<span class="chip chip-btn" id="dash-refresh">${UI.icon('rotate-cw', 13)}Yangilash</span>`);

    view.innerHTML = UI.skeleton(5, 80);
    let d;
    try { d = await App.api('admin_stats'); }
    catch (e) { view.innerHTML = UI.errorBox(e.message, true); return; }

    document.getElementById('dash-refresh')?.addEventListener('click', () => {
      App.tap(); App.render('dash', {}, false);
    });

    const o = d.orders;
    let h = `
    <div class="tiles">
      <div class="tile"><div class="tile-l">${UI.icon('users', 12)}Foydalanuvchi</div>
        <div class="tile-v">${UI.num(d.users_count)}</div><div class="tile-s">bugun +${UI.num(d.new_today)}</div></div>
      <div class="tile ok"><div class="tile-l">${UI.icon('wallet', 12)}Tushum</div>
        <div class="tile-v">${UI.num(d.revenue)}</div><div class="tile-s">so'm · muvaffaqiyatli</div></div>
      <div class="tile gold"><div class="tile-l">${UI.icon('star', 12)}Stars</div>
        <div class="tile-v">${UI.num(o.stars_success)}</div><div class="tile-s">kutish ${UI.num(o.stars_pending)} · xato ${UI.num(o.stars_failed)}</div></div>
      <div class="tile purple"><div class="tile-l">${UI.icon('crown', 12)}Premium</div>
        <div class="tile-v">${UI.num(o.premium_success)}</div><div class="tile-s">kutish ${UI.num(o.premium_pending)} · xato ${UI.num(o.premium_failed)}</div></div>
    </div>

    ${d.pending_topups > 0 ? UI.note('warn', `<b>${UI.num(d.pending_topups)}</b> ta to'lov tasdiqlashni kutmoqda. <b data-nav="a-topups" style="text-decoration:underline;cursor:pointer">Ko'rish</b>`) : ''}
    ${d.pending_admin_orders > 0 ? UI.note('warn', `👑 <b>${UI.num(d.pending_admin_orders)}</b> ta Premium buyurtma bajarilishini kutmoqda. <b data-nav="a-admin-orders" style="text-decoration:underline;cursor:pointer">Ko'rish</b>`) : ''}
    `;

    if (d.chart.length) {
      const max = Math.max(...d.chart.map(c => c.sum), 1);
      h += `
      ${UI.section('So\'nggi 7 kun tushumi')}
      <div class="card card-pad"><div class="chart">`;
      d.chart.forEach((c, i) => {
        const pct = Math.max(4, Math.round(c.sum / max * 100));
        const label = String(c.date).slice(8, 10);
        h += `<div class="chart-col">
          <div class="chart-bar" style="height:${pct}%;animation-delay:${i * 60}ms"></div>
          <div class="chart-cap">${UI.esc(label)}</div>
        </div>`;
      });
      h += `</div></div>`;
    }

    h += `
    ${UI.section('Tezkor amallar')}
    <div class="tiles">
      <button class="btn soft" data-nav="a-broadcast">${UI.icon('megaphone', 15)} Broadcast</button>
      <button class="btn gray" data-nav="a-pricing">${UI.icon('tag', 15)} Narxlar</button>
      <button class="btn gray" data-nav="a-topups">${UI.icon('credit-card', 15)} To'lovlar</button>
      <button class="btn gray" data-nav="a-api">${UI.icon('trending-up', 15)} API holat</button>
    </div>

    ${UI.section('Umumiy')}
    <div class="card group">
      <div class="grow" style="pointer-events:none">
        <span class="grow ic">${UI.icon('wallet', 16)}</span>
        <span class="bd"><span class="grow-t">Foydalanuvchilar balansi</span></span>
        <span class="grow-val">${UI.sum(d.total_balance)}</span>
      </div>
      <div class="grow" style="pointer-events:none">
        <span class="grow ic warn">${UI.icon('hourglass', 16)}</span>
        <span class="bd"><span class="grow-t">Kutayotgan to'lovlar</span></span>
        <span class="grow-val">${UI.num(d.pending_topups)}</span>
      </div>
      <div class="grow" style="pointer-events:none">
        <span class="grow ic">${UI.icon('triangle-alert', 16)}</span>
        <span class="bd"><span class="grow-t">Nol balansli userlar</span></span>
        <span class="grow-val">${UI.num(d.zero_balance_users)}</span>
      </div>
    </div>`;

    view.innerHTML = h;
    bindNav(view);
  },

  /* ================================================================
   *  FOYDALANUVCHILAR
   * ================================================================ */
  async users(view, p) {
    const q = p.q || '';
    const page = Math.max(1, parseInt(p.page, 10) || 1);
    App.paintTopbar('Foydalanuvchilar', `${q ? `"${q}" izlanmoqda · ` : ''}qidiruv`, '');

    view.innerHTML = `
    <div class="card card-pad">
      <div class="inp-wrap">
        <span class="inp-pre">${UI.icon('search', 15)}</span>
        <input class="inp pre" id="uq" type="text" placeholder="ID, username yoki ism..." value="${UI.attr(q)}" autocomplete="off">
      </div>
      <button class="btn soft sm" id="uq-go" style="margin-top:10px">${UI.icon('search', 14)} Qidirish</button>
    </div>
    <div id="u-list">${UI.skeleton(5, 68)}</div>`;

    const input = view.querySelector('#uq');
    const load = () => App.go('a-users', { q: input.value.trim(), page: 1 });
    view.querySelector('#uq-go').onclick = () => { App.tap(); load(); };
    input.onkeydown = (e) => { if (e.key === 'Enter') load(); };

    let d;
    try {
      d = await App.api('admin_users', { q, page });
    } catch (e) {
      view.querySelector('#u-list').innerHTML = UI.errorBox(e.message);
      return;
    }

    const list = view.querySelector('#u-list');
    if (!d.users.length) {
      list.innerHTML = UI.empty('users', 'Topilmadi', 'Bu so\'rov bo\'yicha foydalanuvchi yo\'q');
      return;
    }

    let h = `<div class="rows">`;
    d.users.forEach(u => {
      h += `
      <button class="rowcard click" data-nav="a-user" data-nav-p='{"user_id":${u.id}}'>
        <span class="rowic ${u.blocked ? 'danger' : ''}">${UI.icon(u.blocked ? 'ban' : 'user-round', 18)}</span>
        <div class="rowbd">
          <div class="rowt">${UI.esc(u.name || 'ID ' + u.id)}${u.username ? ` <span class="dim">@${UI.esc(u.username)}</span>` : ''}</div>
          <div class="rowsub">ID ${u.id} · ${UI.num(u.orders_count)} buyurtma · ${UI.num(u.refs_count)} referal</div>
        </div>
        <div class="rowend">
          <span class="rowval">${UI.num(u.balance)}</span>
          ${u.blocked ? UI.status('blocked') : ''}
        </div>
      </button>`;
    });
    h += `</div>`;

    if (d.pages > 1) {
      h += `<div class="pager">
        <button id="pg-prev" ${page <= 1 ? 'disabled' : ''}>${UI.icon('chevron-left', 15)}Oldin</button>
        <span class="pager-info">${d.page} / ${d.pages}</span>
        <button id="pg-next" ${page >= d.pages ? 'disabled' : ''}>Keyin${UI.icon('chevron-right', 15)}</button>
      </div>`;
    }

    list.innerHTML = h;
    bindNav(list);
    list.querySelector('#pg-prev')?.addEventListener('click', () => App.go('a-users', { q, page: page - 1 }));
    list.querySelector('#pg-next')?.addEventListener('click', () => App.go('a-users', { q, page: page + 1 }));
  },

  /* ================================================================
   *  FOYDALANUVCHI KARTOCHKASI
   * ================================================================ */
  async userCard(view, p) {
    App.paintTopbar('Foydalanuvchi', '', `<button class="iconbtn" id="uc-back">${UI.icon('arrow-left', 18)}</button>`);
    document.getElementById('uc-back').onclick = () => App.back();

    view.innerHTML = UI.skeleton(3, 90);
    let d;
    try { d = await App.api('admin_user', { user_id: p.user_id }); }
    catch (e) { view.innerHTML = UI.errorBox(e.message); return; }

    const u = d.user;
    let h = `
    <div class="card card-pad" style="display:flex;align-items:center;gap:13px">
      <div class="userpic" style="background:var(--accent);color:var(--accent-text)">${UI.esc(UI.initials(u.name))}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:800;font-size:15.5px">${UI.esc(u.name || 'ID ' + u.id)}</div>
        <div style="color:var(--hint);font-size:12px">${u.username ? '@' + UI.esc(u.username) : '—'}</div>
      </div>
      ${u.blocked ? UI.status('blocked') : UI.status('success')}
    </div>

    <div class="tiles" style="margin-top:10px">
      <div class="tile"><div class="tile-l">${UI.icon('wallet', 12)}Balans</div><div class="tile-v">${UI.num(u.balance)}</div></div>
      <div class="tile purple"><div class="tile-l">${UI.icon('package', 12)}Buyurtma</div><div class="tile-v">${UI.num(u.orders_count)}</div></div>
      <div class="tile ok"><div class="tile-l">${UI.icon('users', 12)}Referal</div><div class="tile-v">${UI.num(u.refs_count)}</div></div>
      <div class="tile"><div class="tile-l">${UI.icon('calendar', 12)}Ro'yxatdan</div><div class="tile-v" style="font-size:13px">${UI.esc((u.joined || '').slice(0, 10))}</div></div>
    </div>

    ${u.ref_id ? `<div class="card group" style="margin-top:10px"><div class="grow" style="pointer-events:none">
      <span class="grow ic">${UI.icon('link', 16)}</span>
      <span class="bd"><span class="grow-t">Taklif qilgan</span></span>
      <button class="grow-val" data-nav="a-user" data-nav-p='{"user_id":${u.ref_id}}' style="color:var(--link)">ID ${u.ref_id}</button>
    </div></div>` : ''}

    ${UI.section('Boshqaruv')}
    <div class="btn-row">
      <button class="btn soft" id="uc-bal">${UI.icon('wallet', 15)} Balans o'zgartirish</button>
      <button class="btn ${u.blocked ? 'gray' : 'red-soft'}" id="uc-block">${UI.icon(u.blocked ? 'unlock' : 'ban', 15)} ${u.blocked ? 'Chiqarish' : 'Bloklash'}</button>
    </div>`;

    if (d.orders.length) {
      h += UI.section('So\'nggi buyurtmalar') + '<div class="rows">';
      d.orders.forEach(o => {
        h += `
        <div class="rowcard">
          <span class="rowic ${o.type === 'stars' ? 'gold' : 'purple'}">${UI.icon(o.type === 'stars' ? 'star' : 'crown', 18)}</span>
          <div class="rowbd">
            <div class="rowt">${UI.num(o.amount)} ${o.type === 'stars' ? 'Stars' : 'oy Premium'} <span class="dim">→ @${UI.esc(o.recipient)}</span></div>
            <div class="rowsub">${UI.sum(o.price)} · ${UI.esc(o.date)}</div>
          </div>
          <div class="rowend">${UI.status(o.status)}</div>
        </div>`;
      });
      h += '</div>';
    }

    if (d.transactions.length) {
      h += UI.section('Tranzaksiyalar') + '<div class="rows">';
      d.transactions.forEach(t => {
        const plus = t.amount >= 0;
        h += `
        <div class="rowcard">
          <span class="rowic ${plus ? 'ok' : 'danger'}">${UI.icon(plus ? 'arrow-down-left' : 'arrow-up-right', 18)}</span>
          <div class="rowbd">
            <div class="rowt" style="white-space:normal">${UI.esc(t.description || t.type)}</div>
            <div class="rowsub">${UI.esc(t.date)}</div>
          </div>
          <div class="rowend"><span class="rowval ${plus ? 'ok' : 'danger'}">${plus ? '+' : ''}${UI.num(t.amount)}</span></div>
        </div>`;
      });
      h += '</div>';
    }

    view.innerHTML = h;
    bindNav(view);

    view.querySelector('#uc-bal').onclick = async () => {
      App.tap();
      const v = await sheetPrompt({
        title: "Balansni o'zgartirish",
        sub: "Kamaytirish uchun oldiga minus: 50000 yoki -20000",
        icon: 'coins',
        input: { type: 'text', placeholder: '50000' },
      });
      if (!v) return;
      showVeil('Saqlanmoqda');
      try {
        const r = await App.api('admin_user_balance', { user_id: u.id, amount: v });
        hideVeil();
        App.notify('success');
        toast('Balans: ' + UI.sum(r.new_balance), 'ok');
        App.render('a-user', { user_id: u.id }, false);
      } catch (e) {
        hideVeil();
        App.notify('error');
        toast(e.message, 'err');
      }
    };

    view.querySelector('#uc-block').onclick = async () => {
      const ok = await sheetConfirm(
        u.blocked ? 'Blokdan chiqarish' : 'Bloklash',
        u.blocked ? "Foydalanuvchi yana foydalana oladi" : "Foydalanuvchi bot va Mini App'dan bloklanadi",
        !u.blocked
      );
      if (!ok) return;
      showVeil();
      try {
        await App.api('admin_user_block', { user_id: u.id, blocked: !u.blocked });
        hideVeil();
        App.notify('success');
        toast(u.blocked ? 'Blokdan chiqarildi' : 'Bloklandi', 'ok');
        App.render('a-user', { user_id: u.id }, false);
      } catch (e) { hideVeil(); toast(e.message, 'err'); }
    };
  },

  /* ================================================================
   *  TO'LOVLAR (topups)
   * ================================================================ */
  async topups(view, p) {
    const status = p.status || 'pending';
    App.paintTopbar("To'ldirish so'rovlari");

    const tabs = [
      ['pending', 'Kutilmoqda'],
      ['paid', 'To\'langan'],
      ['cancelled', 'Bekor'],
      ['all', 'Hammasi'],
    ];

    view.innerHTML = `
    <div class="seg" id="t-seg">
      ${tabs.map(([v, l]) => `<button data-st="${v}" class="${status === v ? 'on' : ''}">${l}</button>`).join('')}
    </div>
    <div id="t-list">${UI.skeleton(4, 76)}</div>`;

    view.querySelectorAll('#t-seg button').forEach(b => {
      b.onclick = () => { App.tap(); App.go('a-topups', { status: b.dataset.st }); };
    });

    let d;
    try { d = await App.api('admin_topups', { status }); }
    catch (e) {
      view.querySelector('#t-list').innerHTML = UI.errorBox(e.message);
      return;
    }

    const list = view.querySelector('#t-list');
    if (!d.topups.length) {
      list.innerHTML = UI.empty('credit-card', 'Bo\'sh', 'Bu holatda so\'rov yo\'q');
      return;
    }

    let h = '<div class="rows">';
    d.topups.forEach(t => {
      h += `
      <div class="rowcard" style="flex-wrap:wrap">
        <span class="rowic ${t.method === 'click' ? '' : 'warn'}">${UI.icon(t.method === 'click' ? 'zap' : 'user-cog', 18)}</span>
        <div class="rowbd">
          <div class="rowt">${UI.sum(t.amount)} <span class="dim">· ${t.method === 'click' ? 'Click' : 'Admin'}</span></div>
          <div class="rowsub">${UI.esc(t.name || '')}${t.username ? ' @' + UI.esc(t.username) : ''} · ID ${t.user_id}</div>
          <div class="rowsub">#${t.id} · ${UI.esc(t.date)}</div>
        </div>
        <div class="rowend">${UI.status(t.status)}</div>
        ${t.receipt ? `<img class="receipt-th" src="${UI.attr(t.receipt)}" loading="lazy"
             onclick="window.open('${UI.attr(t.receipt)}','_blank')" alt="chek">` : ''}
        ${t.status === 'pending' ? `
        <div class="btn-row" style="width:100%;margin-top:10px">
          <button class="btn sm" style="flex:1" data-cf="${t.id}">${UI.icon('circle-check', 14)} Tasdiqlash</button>
          <button class="btn sm red-soft" style="flex:1" data-rj="${t.id}">${UI.icon('circle-x', 14)} Rad etish</button>
        </div>` : ''}
      </div>`;
    });
    h += '</div>';
    list.innerHTML = h;

    list.querySelectorAll('[data-cf]').forEach(b => {
      b.onclick = async () => {
        const ok = await sheetConfirm('Tasdiqlash', "Balans to'ldiriladi. Bu amal qaytarilmaydi.");
        if (!ok) return;
        showVeil();
        try {
          await App.api('admin_topup_confirm', { topup_id: parseInt(b.dataset.cf, 10) });
          hideVeil();
          App.notify('success');
          toast('Tasdiqlandi', 'ok');
          App.render('a-topups', { status }, false);
        } catch (e) { hideVeil(); App.notify('error'); toast(e.message, 'err'); }
      };
    });
    list.querySelectorAll('[data-rj]').forEach(b => {
      b.onclick = async () => {
        const ok = await sheetConfirm('Rad etish', "So'rov bekor qilinadi, foydalanuvchiga xabar ketadi.", true);
        if (!ok) return;
        showVeil();
        try {
          await App.api('admin_topup_reject', { topup_id: parseInt(b.dataset.rj, 10) });
          hideVeil();
          App.notify('warning');
          toast('Rad etildi', 'info');
          App.render('a-topups', { status }, false);
        } catch (e) { hideVeil(); toast(e.message, 'err'); }
      };
    });
  },

  /* ================================================================
   *  BUYURTMALAR (admin)
   * ================================================================ */
  async orders(view, p) {
    const st = p.status || 'all';
    const page = Math.max(1, parseInt(p.page, 10) || 1);
    App.paintTopbar('Buyurtmalar');

    const tabs = [
      ['all', 'Hammasi'], ['success', 'OK'], ['pending', 'Kutish'], ['failed', 'Xato'],
    ];
    view.innerHTML = `
    <div class="seg" id="o-seg">
      ${tabs.map(([v, l]) => `<button data-st="${v}" class="${st === v ? 'on' : ''}">${l}</button>`).join('')}
    </div>
    <div id="o-list">${UI.skeleton(4, 76)}</div>`;

    view.querySelectorAll('#o-seg button').forEach(b => {
      b.onclick = () => { App.tap(); App.go('a-orders', { status: b.dataset.st }); };
    });

    let d;
    try { d = await App.api('admin_orders', { status: st, page }); }
    catch (e) {
      view.querySelector('#o-list').innerHTML = UI.errorBox(e.message);
      return;
    }

    const list = view.querySelector('#o-list');
    if (!d.orders.length) {
      list.innerHTML = UI.empty('package', 'Buyurtma yo\'q', 'Bu filtr bo\'yicha buyurtma topilmadi');
      return;
    }

    let h = `<div style="color:var(--hint);font-size:12px;font-weight:600;padding:0 2px 10px">Jami: ${UI.num(d.total)}</div><div class="rows">`;
    d.orders.forEach(o => {
      const t = o.type === 'stars' ? `${UI.num(o.amount)} Stars` : `Premium ${o.amount === 12 ? '1y' : o.amount + 'oy'}`;
      h += `
      <div class="rowcard click" data-nav="a-user" data-nav-p='{"user_id":${o.user_id}}'>
        <span class="rowic ${o.type === 'stars' ? 'gold' : 'purple'}">${UI.icon(o.type === 'stars' ? 'star' : 'crown', 18)}</span>
        <div class="rowbd">
          <div class="rowt">${UI.esc(t)} <span class="dim">→ @${UI.esc(o.recipient)}</span></div>
          <div class="rowsub">ID ${o.user_id} · ${UI.esc(o.date)}</div>
        </div>
        <div class="rowend"><span class="rowval">${UI.num(o.price)}</span>${UI.status(o.status)}</div>
      </div>`;
    });
    h += '</div>';

    if (d.pages > 1) {
      h += `<div class="pager">
        <button id="op-prev" ${page <= 1 ? 'disabled' : ''}>${UI.icon('chevron-left', 15)}Oldin</button>
        <span class="pager-info">${d.page} / ${d.pages}</span>
        <button id="op-next" ${page >= d.pages ? 'disabled' : ''}>Keyin${UI.icon('chevron-right', 15)}</button>
      </div>`;
    }

    list.innerHTML = h;
    bindNav(list);
    list.querySelector('#op-prev')?.addEventListener('click', () => App.go('a-orders', { status: st, page: page - 1 }));
    list.querySelector('#op-next')?.addEventListener('click', () => App.go('a-orders', { status: st, page: page + 1 }));
  },

  /* ================================================================
   *  ADMIN BUYURTMALARI (WebApp — 1 oylik Premium, qo'lda bajariladi)
   * ================================================================ */
  async adminOrders(view, p) {
    const st = p.status || 'pending';
    App.paintTopbar('Premium buyurtmalar', 'admin bajaradi');

    const tabs = [['pending', 'Kutilmoqda'], ['all', 'Hammasi']];
    view.innerHTML = `
    <div class="seg" id="ao-seg">
      ${tabs.map(([v, l]) => `<button data-st="${v}" class="${st === v ? 'on' : ''}">${l}</button>`).join('')}
    </div>
    <div id="ao-list">${UI.skeleton(3, 90)}</div>`;

    view.querySelectorAll('#ao-seg button').forEach(b => {
      b.onclick = () => { App.tap(); App.go('a-admin-orders', { status: b.dataset.st }); };
    });

    let d;
    try { d = await App.api('admin_admin_orders', { status: st }); }
    catch (e) { view.querySelector('#ao-list').innerHTML = UI.errorBox(e.message); return; }

    const list = view.querySelector('#ao-list');
    if (!d.orders.length) {
      list.innerHTML = UI.empty('crown', 'Bo\'sh', 'Bajarilishi kutilayotgan buyurtma yo\'q');
      return;
    }

    let h = '<div class="rows">';
    d.orders.forEach(o => {
      h += `
      <div class="rowcard" style="flex-wrap:wrap">
        <span class="rowic purple">${UI.icon('crown', 18)}</span>
        <div class="rowbd">
          <div class="rowt">Premium ${o.months} oy <span class="dim">→ @${UI.esc(o.recipient)}</span></div>
          <div class="rowsub">${UI.esc(o.name || '')}${o.username ? ' @' + UI.esc(o.username) : ''} · ID ${o.user_id}</div>
          <div class="rowsub">#${o.id} · ${UI.esc(o.date)}</div>
        </div>
        <div class="rowend"><span class="rowval">${UI.num(o.price)}</span>${UI.status(o.status)}</div>
        ${o.status === 'pending' ? `
        <div class="btn-row" style="width:100%;margin-top:10px">
          <button class="btn sm" style="flex:1" data-ao-ok="${o.id}">${UI.icon('circle-check', 14)} Tasdiqlash</button>
          <button class="btn sm red-soft" style="flex:1" data-ao-no="${o.id}">${UI.icon('circle-x', 14)} Rad etish</button>
        </div>` : ''}
      </div>`;
    });
    h += '</div>';
    list.innerHTML = h;

    list.querySelectorAll('[data-ao-ok]').forEach(b => {
      b.onclick = async () => {
        const ok = await sheetConfirm('Tasdiqlash',
          'Avval Telegram orqali Premiumni qabul qiluvchiga BERING, so\'ng tasdiqlang.', false);
        if (!ok) return;
        showVeil();
        try {
          await App.api('admin_admin_order_action', { order_id: parseInt(b.dataset.aoOk, 10), action: 'confirm' });
          hideVeil(); App.notify('success'); toast('Tasdiqlandi', 'ok');
          App.render('a-admin-orders', { status: st }, false);
        } catch (e) { hideVeil(); App.notify('error'); toast(e.message, 'err'); }
      };
    });
    list.querySelectorAll('[data-ao-no]').forEach(b => {
      b.onclick = async () => {
        const ok = await sheetConfirm('Rad etish', 'Pul foydalanuvchi balansiga qaytariladi.', true);
        if (!ok) return;
        showVeil();
        try {
          await App.api('admin_admin_order_action', { order_id: parseInt(b.dataset.aoNo, 10), action: 'reject' });
          hideVeil(); App.notify('warning'); toast('Rad etildi — pul qaytarildi', 'info');
          App.render('a-admin-orders', { status: st }, false);
        } catch (e) { hideVeil(); toast(e.message, 'err'); }
      };
    });
  },

  /* ================================================================
   *  "YANA" MENYUSI
   * ================================================================ */
  more(view) {
    App.paintTopbar('Boshqaruv');

    const groups = [
      ['Savdo', [
        ['a-pricing', 'aPricing', 'tag', 'sky', 'Narx va limitlar', 'Stars, Premium, kurs, bonus'],
        ['a-card', 'card', 'credit-card', '', "To'lov kartasi", 'Bank, raqam, egasi'],
        ['a-services', 'aServices', 'toggle-right', 'ok', 'Xizmatlar', 'Yoqish / o\'chirish'],
      ]],
      ['Integratsiyalar', [
        ['a-providers', 'aProviders', 'git-branch', 'purple', 'Providerlar', 'API kalitlar, marshrut'],
        ['a-api', 'aApi', 'activity', 'warn', 'API hisobi', 'Balans, foyda hisobi'],
      ]],
      ['Auditoriya', [
        ['a-broadcast', 'aBroadcast', 'megaphone', 'sky', 'Xabar yuborish', 'Users va kanallarga'],
        ['a-channels', 'aChannels', 'rss', '', 'Majburiy obuna', 'Kanallar boshqaruvi'],
        ['a-referrals', 'aReferrals', 'trophy', 'gold', 'Referallar', 'TOP referalchilar'],
      ]],
      ['Buyurtmalar', [
        ['a-admin-orders', 'premium', 'crown', 'purple', 'Premium (qo\'lda)', 'WebApp\'dan kelgan 1 oylik'],
      ]],
    ];

    let h = '';
    groups.forEach(([title, items]) => {
      h += UI.section(title) + '<div class="card group">';
      items.forEach(([r, slot, ic, tone, t, s]) => {
        h += `
        <button class="grow" data-nav="${r}">
          <span class="sq ${tone ? 'sq-' + tone : ''}">${App.slot(slot, ic, 20)}</span>
          <span class="bd"><span class="grow-t">${t}</span><span class="grow-d">${s}</span></span>
          <span class="grow-end">${UI.icon('chevron-right', 16)}</span>
        </button>`;
      });
      h += '</div>';
    });

    h += `
    <button class="btn gray" id="m-exit" style="margin-top:16px">${UI.icon('user-round', 16)} Foydalanuvchi rejimiga qaytish</button>`;

    view.innerHTML = h;
    bindNav(view);
    view.querySelector('#m-exit').onclick = () => { App.tap(); App.start('user'); };
  },

  /* ================================================================
   *  NARX/LIMIT SOZLAMALARI
   * ================================================================ */
  async pricing(view) {
    App.paintTopbar('Narx va limitlar');
    view.innerHTML = UI.skeleton(6, 56);

    let d;
    try { d = await App.api('admin_settings_get'); }
    catch (e) { view.innerHTML = UI.errorBox(e.message, true); return; }
    const s = d.settings;

    const rows = [
      ['stars_min', 'chevron-left', 'Stars — minimal', s.stars_min || 'API chegarasi', '0 = cheklovsiz'],
      ['stars_max', 'chevron-right', 'Stars — maksimal', s.stars_max || 'API chegarasi', '0 = cheklovsiz'],
      ['stars_sell_price', 'star', 'Stars — sotuv narxi', UI.sum(s.stars_sell_price || 0), '1 dona uchun'],
      ['stars_base_price', 'shield-alert', 'Stars — zaxira narxi', UI.sum(s.stars_base_price || 0), 'API javob bermasa'],
      ['premium_1_month', 'crown', 'Premium 1 oy', UI.sum(s.premium_1_month || 0), 'faqat admin orqali'],
      ['premium_3_months', 'crown', 'Premium 3 oy', UI.sum(s.premium_3_months || 0), ''],
      ['premium_6_months', 'crown', 'Premium 6 oy', UI.sum(s.premium_6_months || 0), ''],
      ['premium_12_months', 'crown', 'Premium 1 yil', UI.sum(s.premium_12_months || 0), ''],
      ['premium_base_price', 'shield-alert', 'Premium zaxira narxi', UI.sum(s.premium_base_price || 0), 'oy uchun'],
      ['usd_to_uzs_rate', 'dollar-sign', 'USD kursi', s.usd_to_uzs_rate || '13000', 'Fragment narxlari uchun'],
      ['ref_bonus_percent', 'hand-coins', 'Referal bonusi', (s.ref_bonus_percent || 0) + '%', 'har to\'lovdan'],
      ['topup_min_amount', 'plus-circle', 'To\'ldirish minimumi', UI.sum(s.topup_min_amount || 1000), ''],
    ];

    let h = '';
    ['Stars', 'Premium', 'Boshqa'].forEach(group => {
      const items = rows.filter(([k]) =>
        group === 'Stars' ? k.startsWith('stars') :
        group === 'Premium' ? k.startsWith('premium') : !k.startsWith('stars') && !k.startsWith('premium'));
      if (!items.length) return;
      h += UI.section(group) + '<div class="card group">';
      items.forEach(([key, icon, title, value, hint]) => {
        h += `
        <button class="grow" data-set="${key}">
          <span class="grow ic">${UI.icon(icon)}</span>
          <span class="bd"><span class="grow-t">${title}</span>${hint ? `<span class="grow-d">${hint}</span>` : ''}</span>
          <span class="grow-end"><span class="grow-val">${UI.esc(value)}</span>${UI.icon('pencil', 14)}</span>
        </button>`;
      });
      h += '</div>';
    });

    view.innerHTML = h;

    view.querySelectorAll('[data-set]').forEach(b => {
      b.onclick = async () => {
        App.tap();
        const key = b.dataset.set;
        const title = b.querySelector('.grow-t').textContent;
        const cur = b.querySelector('.grow-val').textContent;
        const v = await sheetPrompt({
          title,
          sub: 'Joriy: ' + cur,
          icon: 'pencil',
          input: { type: 'text', placeholder: 'yangi qiymat' },
        });
        if (v === null || v === '') return;
        showVeil('Saqlanmoqda');
        try {
          await App.api('admin_settings_set', { updates: { [key]: v } });
          hideVeil();
          App.notify('success');
          toast('Saqlandi', 'ok');
          App.render('a-pricing', {}, false);
        } catch (e) { hideVeil(); App.notify('error'); toast(e.message, 'err'); }
      };
    });
  },

  /* ================================================================
   *  KARTA SOZLAMALARI
   * ================================================================ */
  async cardSettings(view) {
    App.paintTopbar("To'lov kartasi");
    view.innerHTML = UI.skeleton(2, 120);

    let d;
    try { d = await App.api('admin_settings_get'); }
    catch (e) { view.innerHTML = UI.errorBox(e.message, true); return; }
    const s = d.settings;

    view.innerHTML = `
    <div class="paycard">
      <div class="pc-bank">${UI.icon('landmark', 14)} ${UI.esc(s.payment_card_bank || 'Belgilanmagan')}</div>
      <div class="pc-num">${UI.esc(s.payment_card_number || '•••• •••• •••• ••••')}</div>
      <div class="pc-holder">${UI.esc(s.payment_card_holder || 'BELGILANMAGAN')}</div>
    </div>

    ${UI.note('info', `Bu karta "Admin orqali to'ldirish" bo'limida foydalanuvchilarga ko'rsatiladi.`)}

    <div class="card group">
      ${[
        ['payment_card_bank', 'landmark', 'Bank nomi', s.payment_card_bank || 'Belgilanmagan'],
        ['payment_card_number', 'credit-card', 'Karta raqami', s.payment_card_number || 'Belgilanmagan'],
        ['payment_card_holder', 'user-round', 'Karta egasi', s.payment_card_holder || 'Belgilanmagan'],
      ].map(([key, ic, t, v]) => `
      <button class="grow" data-set="${key}">
        <span class="grow ic">${UI.icon(ic)}</span>
        <span class="bd"><span class="grow-t">${t}</span></span>
        <span class="grow-end"><span class="grow-val">${UI.esc(v)}</span>${UI.icon('pencil', 14)}</span>
      </button>`).join('')}
    </div>`;

    view.querySelectorAll('[data-set]').forEach(b => {
      b.onclick = async () => {
        App.tap();
        const key = b.dataset.set;
        const title = b.querySelector('.grow-t').textContent;
        const cur = b.querySelector('.grow-val').textContent;
        const v = await sheetPrompt({ title, sub: 'Joriy: ' + (cur === 'Belgilanmagan' ? '—' : cur), icon: 'pencil', input: {} });
        if (v === null || v === '') return;
        showVeil('Saqlanmoqda');
        try {
          await App.api('admin_settings_set', { updates: { [key]: v } });
          hideVeil();
          App.notify('success');
          toast('Saqlandi', 'ok');
          App.render('a-card', {}, false);
        } catch (e) { hideVeil(); App.notify('error'); toast(e.message, 'err'); }
      };
    });
  },

  /* ================================================================
   *  PROVIDERLAR
   * ================================================================ */
  async providers(view) {
    App.paintTopbar('Providerlar');
    view.innerHTML = UI.skeleton(3, 110);

    let d;
    try { d = await App.api('admin_providers'); }
    catch (e) { view.innerHTML = UI.errorBox(e.message, true); return; }

    const p1 = d.providers['1'], p2 = d.providers['2'];

    const prov = (num, name, icon, stateHtml, buttonsHtml) => `
    <div class="card card-pad">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <span class="rowic ${num === '1' ? '' : 'purple'}">${UI.icon(icon, 18)}</span>
        <div style="flex:1">
          <div class="rowt">Provider ${num} · ${name}</div>
          <div class="rowsub">${num === '1' ? 'api.starstg.uz' : 'fragment-api.uz'}</div>
        </div>
      </div>
      <div class="sum">${stateHtml}</div>
      <div class="btn-row" style="margin-top:12px">${buttonsHtml}</div>
    </div>`;

    let h = prov('1', 'StarsPaymee', 'server', `
      <div class="srow"><span class="srow-k">Manzil</span><span class="srow-v" style="font-size:11.5px;word-break:break-all">${UI.esc(p1.url || '—')}</span></div>
      <div class="srow"><span class="srow-k">Kalit</span><span class="srow-v">${p1.has_key ? UI.esc(p1.key_masked) : 'kiritilmagan'}</span></div>
      <div class="srow"><span class="srow-k">Balans</span>
        <span class="srow-v ${p1.balance.ok ? 'ok' : ''}">${p1.balance.ok ? (UI.esc(String(p1.balance.balance ?? '—')) + ' USDT' + (p1.balance.unlimited ? ' · limitsiz' : '')) : 'ulanish xatosi'}</span></div>
    `, `
      <button class="btn soft sm" data-pk="1:key">${UI.icon('key-round', 14)} Kalit</button>
      <button class="btn gray sm" data-pk="1:url">${UI.icon('globe', 14)} Manzil</button>
    `);

    h += prov('2', 'Fragment', 'server', `
      <div class="srow"><span class="srow-k">Kalit</span><span class="srow-v">${p2.has_key ? UI.esc(p2.key_masked) : 'kiritilmagan'}</span></div>
      <div class="srow"><span class="srow-k">Wallet</span>
        <span class="srow-v ${p2.balance.ok ? 'ok' : ''}">${p2.balance.ok ? (UI.esc(String(p2.balance.usdt ?? '—')) + ' USDT · ' + UI.esc(String(p2.balance.ton ?? '—')) + ' TON') : 'ulanish xatosi'}</span></div>
    `, `
      <button class="btn soft sm" data-pk="2:key">${UI.icon('key-round', 14)} Kalit</button>
    `);

    h += `
    ${UI.section('Xizmat marshrutlash')}
    <div class="card group">
      ${['stars', 'premium'].map(svc => {
        const cur = svc === 'stars' ? d.stars_provider : d.premium_provider;
        return `
        <button class="grow" data-pick="${svc}">
          <span class="grow ic ${cur === '2' ? 'purple' : ''}">${UI.icon(svc === 'stars' ? 'star' : 'crown')}</span>
          <span class="bd"><span class="grow-t">${svc === 'stars' ? 'Stars' : 'Premium'} provideri</span></span>
          <span class="grow-end"><span class="grow-val">${cur === '2' ? '2 · Fragment' : '1 · StarsPaymee'}</span>${UI.icon('link', 15)}</span>
        </button>`;
      }).join('')}
    </div>`;

    view.innerHTML = h;

    // Kalit/manzil o'rnatish
    view.querySelectorAll('[data-pk]').forEach(b => {
      b.onclick = async () => {
        App.tap();
        const [prov, field] = b.dataset.pk.split(':');
        const isUrl = field === 'url';
        const v = await sheetPrompt({
          title: isUrl ? 'API manzil' : `Provider ${prov} kaliti`,
          sub: isUrl ? 'To\'liq URL kiriting' : 'X-API-Key qiymati',
          icon: isUrl ? 'globe' : 'key-round',
          input: { type: 'text', placeholder: isUrl ? 'https://...' : 'sj_...' },
        });
        if (!v) return;
        showVeil('Saqlanmoqda');
        try {
          await App.api('admin_provider_set', {
            provider: prov,
            field: isUrl ? 'api_base_url' : 'api_key',
            value: v,
          });
          hideVeil();
          App.notify('success');
          toast('Saqlandi', 'ok');
          App.render('a-providers', {}, false);
        } catch (e) { hideVeil(); App.notify('error'); toast(e.message, 'err'); }
      };
    });

    // Provider tanlash
    view.querySelectorAll('[data-pick]').forEach(b => {
      b.onclick = () => {
        App.tap();
        const svc = b.dataset.pick;
        const cur = svc === 'stars' ? d.stars_provider : d.premium_provider;
        openSheet(`
          <div class="grab"></div>
          <h3>${UI.icon(svc === 'stars' ? 'star' : 'crown')} ${svc === 'stars' ? 'Stars' : 'Premium'} — provider tanlash</h3>
          <p class="sheet-sub">Joriy: ${cur === '2' ? 'Fragment' : 'StarsPaymee'}</p>
          <div class="btn-row" style="flex-direction:column;margin-top:14px">
            <button class="btn gray" data-v="1">1 — StarsPaymee</button>
            <button class="btn gray" data-v="2">2 — Fragment</button>
          </div>`);
        document.getElementById('sheet').querySelectorAll('[data-v]').forEach(x => {
          x.onclick = async () => {
            closeSheet();
            showVeil();
            try {
              const r = await App.api('admin_provider_pick', { service: svc, provider: x.dataset.v });
              hideVeil();
              App.notify('success');
              if (r.warning) { toast(r.warning, 'warn'); App.notify('warning'); }
              else toast('Saqlandi', 'ok');
              App.render('a-providers', {}, false);
            } catch (e) { hideVeil(); toast(e.message, 'err'); }
          };
        });
      };
    });
  },

  /* ================================================================
   *  XIZMATLAR (yoqish/o'chirish)
   * ================================================================ */
  async services(view) {
    App.paintTopbar('Xizmatlar boshqaruvi');

    let d;
    try { d = await App.api('admin_settings_get'); }
    catch (e) { view.innerHTML = UI.errorBox(e.message, true); return; }
    const s = d.settings;

    view.innerHTML = `
    ${UI.note('info', `O'chirilgan xizmat foydalanuvchilar uchun "vaqtincha mavjud emas" ko'rinishida chiqadi.`)}
    <div class="card group">
      ${[
        ['service_stars_enabled', 'star', 'Stars xizmati', 'Foydalanuvchilar Stars sotib oladi'],
        ['service_premium_enabled', 'crown', 'Premium xizmati', 'Foydalanuvchilar Premium sotib oladi'],
      ].map(([key, ic, t, sub]) => `
      <div class="grow">
        <span class="grow ic gold">${UI.icon(ic)}</span>
        <span class="bd"><span class="grow-t">${t}</span><span class="grow-d">${sub}</span></span>
        <label class="sw"><input type="checkbox" data-svc="${key}" ${s[key] === '1' ? 'checked' : ''}><span class="sw-i"></span></label>
      </div>`).join('')}
    </div>`;

    view.querySelectorAll('[data-svc]').forEach(sw => {
      sw.onchange = async () => {
        const svc = sw.dataset.svc.includes('stars') ? 'stars' : 'premium';
        try {
          const r = await App.api('admin_services_toggle', { service: svc });
          App.notify('success');
          toast(`${r.service === 'stars' ? 'Stars' : 'Premium'} ${r.enabled ? 'yoqildi' : 'o\'chirildi'}`, 'ok');
        } catch (e) {
          App.notify('error');
          toast(e.message, 'err');
          sw.checked = !sw.checked;
        }
      };
    });
  },

  /* ================================================================
   *  BROADCAST
   * ================================================================ */
  async broadcast(view) {
    App.paintTopbar('Xabar yuborish');

    let histories = [];
    try { histories = (await App.api('admin_broadcasts')).broadcasts; }
    catch (e) {}

    let h = `
    <div class="card card-pad">
      <div class="field">
        <label class="field-l">Xabar matni</label>
        <textarea class="inp" id="bc-text" rows="5" placeholder="Xabar matnini yozing..."></textarea>
      </div>
      <div class="field-l" style="margin:14px 0 8px">Kimga yuborilsin</div>
      <div class="seg" id="bc-target">
        <button data-t="users" class="on">Userlar</button>
        <button data-t="channels">Kanallar</button>
        <button data-t="both">Hammasi</button>
      </div>
      <button class="btn" id="bc-go">${UI.icon('send', 16)} Navbatga qo'shish</button>
      <div class="hint" style="margin-top:8px">${UI.icon('info', 14)}Xabar bot tomonidan bir necha soniyada yuboriladi</div>
    </div>`;

    if (histories.length) {
      h += UI.section('So\'nggi xabarlar') + '<div class="rows">';
      histories.forEach(b => {
        h += `
        <div class="rowcard">
          <span class="rowic">${UI.icon('megaphone', 18)}</span>
          <div class="rowbd">
            <div class="rowt" style="white-space:normal">${UI.esc(b.text.slice(0, 60))}${b.text.length > 60 ? '…' : ''}</div>
            <div class="rowsub">${UI.esc(b.target)} · ${UI.esc(b.date)} · ${UI.num(b.sent)}/${UI.num(b.total)}</div>
          </div>
          <div class="rowend">${UI.status(b.status)}</div>
        </div>`;
      });
      h += '</div>';
    }

    view.innerHTML = h;

    let target = 'users';
    view.querySelectorAll('#bc-target button').forEach(b => {
      b.onclick = () => {
        App.tap();
        view.querySelectorAll('#bc-target button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        target = b.dataset.t;
      };
    });

    view.querySelector('#bc-go').onclick = async () => {
      const text = view.querySelector('#bc-text').value.trim();
      if (!text) { toast('Matn kiriting', 'err'); App.notify('error'); return; }

      const label = target === 'both' ? 'hamma' : target === 'users' ? 'barcha userlar' : 'barcha kanallar';
      const ok = await sheetConfirm('Xabar yuborish', `Xabar ${label}ga yuborilsinmi?`);
      if (!ok) return;

      showVeil('Navbatga qo\'shilmoqda');
      try {
        const r = await App.api('admin_broadcast', { text, target });
        hideVeil();
        App.notify('success');
        toast(r.note || 'Navbatga qo\'shildi', 'ok');
        App.render('a-broadcast', {}, false);
      } catch (e) { hideVeil(); App.notify('error'); toast(e.message, 'err'); }
    };
  },

  /* ================================================================
   *  MAJBURIY OBUNA KANALLARI
   * ================================================================ */
  async channels(view) {
    App.paintTopbar('Majburiy obuna');

    let d;
    try { d = await App.api('admin_channels'); }
    catch (e) { view.innerHTML = UI.errorBox(e.message, true); return; }

    let h = `
    <button class="btn" id="ch-add" style="margin-bottom:12px">${UI.icon('plus', 16)} Kanal qo'shish</button>
    ${UI.note('info', `Kanal qo'shish uchun bot kanalda <b>admin</b> bo'lishi shart. @username yoki ID yuboring — bot tekshirib qo'shadi.`)}`;

    if (d.channels.length) {
      h += '<div class="rows">';
      d.channels.forEach(c => {
        h += `
        <div class="rowcard">
          <span class="rowic">${UI.icon('link', 18)}</span>
          <div class="rowbd">
            <div class="rowt">${UI.esc(c.title || 'Noma\'lum')}</div>
            <div class="rowsub">${c.username ? '@' + UI.esc(c.username) + ' · ' : ''}${c.chat_id}</div>
          </div>
          <button class="btn sm red-soft" data-del="${c.chat_id}">${UI.icon('trash-2', 14)}</button>
        </div>`;
      });
      h += '</div>';
    } else {
      h += UI.empty('rss', 'Kanallar yo\'q', 'Hali majburiy obuna kanali qo\'shilmagan');
    }

    view.innerHTML = h;

    view.querySelector('#ch-add').onclick = async () => {
      App.tap();
      const v = await sheetPrompt({
        title: 'Kanal qo\'shish',
        sub: 'Bot kanalda admin bo\'lishi shart',
        icon: 'rss',
        input: { type: 'text', placeholder: '@kanal yoki -100123...' },
      });
      if (!v) return;
      showVeil('Yuborilmoqda');
      try {
        const r = await App.api('admin_channel_add', { channel: v });
        hideVeil();
        App.notify('success');
        toast(r.note || 'Qo\'shildi', 'ok');
        setTimeout(() => App.render('a-channels', {}, false), 2500);
      } catch (e) { hideVeil(); App.notify('error'); toast(e.message, 'err'); }
    };

    view.querySelectorAll('[data-del]').forEach(b => {
      b.onclick = async () => {
        const ok = await sheetConfirm('O\'chirish', 'Kanal majburiy obunadan olib tashlanadi', true);
        if (!ok) return;
        showVeil();
        try {
          await App.api('admin_channel_delete', { chat_id: parseInt(b.dataset.del, 10) });
          hideVeil();
          App.notify('success');
          toast('O\'chirildi', 'ok');
          App.render('a-channels', {}, false);
        } catch (e) { hideVeil(); toast(e.message, 'err'); }
      };
    });
  },

  /* ================================================================
   *  REFERALLAR
   * ================================================================ */
  async referrals(view) {
    App.paintTopbar('Referallar');
    view.innerHTML = UI.skeleton(3, 90);

    let d;
    try { d = await App.api('admin_referrals'); }
    catch (e) { view.innerHTML = UI.errorBox(e.message, true); return; }

    let h = `
    <div class="tiles t3">
      <div class="tile"><div class="tile-l">${UI.icon('users', 12)}Jami</div><div class="tile-v">${UI.num(d.users_count)}</div></div>
      <div class="tile purple"><div class="tile-l">${UI.icon('link', 12)}Referal</div><div class="tile-v">${UI.num(d.with_referrer)}</div></div>
      <div class="tile ok"><div class="tile-l">${UI.icon('hand-coins', 12)}To'langan</div><div class="tile-v">${UI.num(d.paid_out)}</div></div>
    </div>

    <div class="card card-pad" style="margin-top:12px">
      <div class="srow"><span class="srow-k">Bonus foizi</span><span class="srow-v">${UI.num(d.bonus_percent)}%</span></div>
      <div class="srow"><span class="srow-k">To'langan bonuslar</span><span class="srow-v">${UI.sum(d.paid_out)}</span></div>
    </div>`;

    if (d.top.length) {
      h += UI.section('TOP 20 referalchi') + '<div class="card group">';
      d.top.forEach(t => {
        h += `
        <div class="lead">
          <span class="lead-n ${t.place <= 3 ? 'p' + t.place : ''}">${t.place}</span>
          <div class="lead-bd">
            <div class="lead-t">${UI.esc(t.name)} <span class="dim" style="color:var(--hint);font-weight:500">(${t.id})</span></div>
            <div class="lead-s">${UI.num(t.count)} ta referal</div>
          </div>
          <span class="lead-v">${UI.num(t.earnings)}</span>
        </div>`;
      });
      h += '</div>';
    }

    h += `<button class="btn red-soft" id="ref-reset" style="margin-top:14px">${UI.icon('trash-2', 15)} Barcha referallarni tozalash</button>`;

    view.innerHTML = h;

    view.querySelector('#ref-reset').onclick = async () => {
      const ok = await sheetConfirm(
        'Tasdiqlang',
        "BARCHA foydalanuvchilarning ref_id maydoni NULL bo'ladi. Bu amal QAYTARILMAYDI.",
        true
      );
      if (!ok) return;
      showVeil();
      try {
        const r = await App.api('admin_referrals_reset');
        hideVeil();
        App.notify('success');
        toast(UI.num(r.cleared) + ' ta referal tozalandi', 'ok');
      } catch (e) { hideVeil(); toast(e.message, 'err'); }
    };
  },

  /* ================================================================
   *  API HISOBI (foydada/zarar)
   * ================================================================ */
  async apiInfo(view, p) {
    const provider = p.provider || '1';
    App.paintTopbar('API hisobi');

    view.innerHTML = `
    <div class="seg" id="api-seg">
      <button data-p="1" class="${provider === '1' ? 'on' : ''}">StarsPaymee</button>
      <button data-p="2" class="${provider === '2' ? 'on' : ''}">Fragment</button>
    </div>
    <div id="api-b">${UI.skeleton(3, 90)}</div>`;

    view.querySelectorAll('#api-seg button').forEach(b => {
      b.onclick = () => { App.tap(); App.go('a-api', { provider: b.dataset.p }); };
    });

    const body = view.querySelector('#api-b');
    let d;
    try { d = await App.api('admin_api_info', { provider }); }
    catch (e) { body.innerHTML = UI.errorBox(e.message); return; }

    let h = `
    <div class="card card-pad">
      <div class="srow"><span class="srow-k">Balans</span>
        <span class="srow-v">${provider === '2'
          ? (UI.esc(String(d.balance.usdt ?? '—')) + ' USDT · ' + UI.esc(String(d.balance.ton ?? '—')) + ' TON')
          : (UI.esc(String(d.balance.usdt ?? '—')) + ' USDT' + (d.balance.unlimited ? ' · limitsiz' : ''))}</span></div>
    </div>`;

    if (d.profit) {
      const st = d.profit.stars;
      h += `
      ${UI.section('Stars foydasi')}
      <div class="card card-pad">
        <div class="srow"><span class="srow-k">API narxi</span><span class="srow-v">${UI.sum(st.api_price)} / dona</span></div>
        <div class="srow"><span class="srow-k">Sotuv narxi</span><span class="srow-v">${UI.sum(st.sell_price)} / dona</span></div>
        <div class="srow total"><span class="srow-k">Foyda</span>
          <span class="srow-v" style="color:${st.profit >= 0 ? 'var(--ok)' : 'var(--danger)'}">
            ${st.profit >= 0 ? '+' : ''}${UI.num(st.profit)} (${st.percent}%)</span></div>
      </div>

      ${UI.section('Premium foydasi')}
      <div class="card card-pad">`;
      Object.entries(d.profit.premium).forEach(([m, pr]) => {
        const label = m === '12' ? '1 yil' : m + ' oy';
        h += `
        <div class="srow"><span class="srow-k">${label}</span>
          <span class="srow-v">${UI.num(pr.sell_price)}
            <span style="color:${pr.profit >= 0 ? 'var(--ok)' : 'var(--danger)'};font-size:11.5px">${pr.profit >= 0 ? '+' : ''}${UI.num(pr.profit)} (${pr.percent}%)</span>
          </span></div>`;
      });
      h += '</div>';
    } else {
      h += UI.note('warn', `<b>Jonli narxlar olinmadi</b> — zaxira narxlar ishlatilmoqda. API kalitini tekshiring.`);
    }

    body.innerHTML = h;
  },
};
