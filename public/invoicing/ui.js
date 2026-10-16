/* Miles Retold · invoicing UI layer: binds window.MilesInvoices to a Design Component.
   create(component, { mode: 'list' | 'detail' | 'integrations', studio, light, pre })
   Reporting to ZATCA / FBR is SIMULATED here (no network, no credentials); the tax authorities' answers are canned.        */
(function () {
  'use strict';
  var M = window.MilesInvoices;
  var KEY = 'miles.inv.st', KEYI = 'miles.inv.int';
  function ls(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function lw(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function withStatus(list) {
    var o = ls(KEY, {});
    return list.map(function (i) { var c = {}; Object.keys(i).forEach(function (k) { c[k] = i[k]; }); if (o[i.id]) { c.st = o[i.id]; if (c.st === 'reported' && c.c === 'PK' && !c.irn) c.irn = '4210112345671' + c.date.slice(0, 10).replace(/-/g, '') + String(c.seq).padStart(6, '0'); delete c.err; } return c; });
  }
  function setStatus(id, st) { var o = ls(KEY, {}); o[id] = st; lw(KEY, o); }

  function create(c, opts) {
    var self = {}, toastT = 0, pre = opts.pre || 'G';
    function set(o) { c.setState(o); }
    function toast(m) { set({ toast: m }); clearTimeout(toastT); toastT = setTimeout(function () { set({ toast: '' }); }, 3600); }
    function href(id, extra) { return pre + (opts.studio ? '79-InvoiceFile' : '77-Invoice') + '.dc.html?id=' + encodeURIComponent(id) + (extra || ''); }
    function chip(st) { var s = M.ST[st] || M.ST.draft; return { t: s.t, cls: 'us-chip ' + s.cls }; }

    self.initial = function () {
      var q = new URLSearchParams(location.search);
      return { tick: 0, q: '', ctry: 'all', stf: 'all', sel: {}, toast: '', id: q.get('id') || 'INV-2026-000145', busy: '', env: ls(KEYI, {}), clock: 0 };
    };
    self.mount = function () {
      var q = new URLSearchParams(location.search);
      if (opts.mode === 'detail' && q.get('print') === '1') setTimeout(function () { window.print(); }, 700);
      self._st = function (e) { if (e.key === KEY || e.key === KEYI) set({ tick: Date.now(), env: ls(KEYI, {}) }); };
      window.addEventListener('storage', self._st);
    };
    self.unmount = function () { window.removeEventListener('storage', self._st); clearTimeout(toastT); };

    /* simulated submission */
    function submit(inv) {
      if (c.state.busy) return;
      set({ busy: inv.id }); toast('Sending ' + inv.id + ' to ' + inv.authority + ' (demo)…');
      setTimeout(function () {
        var ok = inv.c === 'PK' ? true : true;
        setStatus(inv.id, inv.type === 'standard' ? 'cleared' : 'reported');
        set({ busy: '', tick: Date.now() });
        toast(inv.authority === 'ZATCA' ? 'Demo reply: accepted. ' + (inv.type === 'standard' ? 'Cleared' : 'Reported') + ' with ZATCA.' : 'Demo reply: accepted. IRN issued by FBR.');
      }, 1300);
    }

    self.vals = function () {
      var s = c.state, list = withStatus(M.invoices), v = { toast: s.toast, hasToast: !!s.toast };
      if (opts.customer && opts.mode === 'list') list = list.filter(function (i) { return i.who === 'Sara Ahmed'; });
      v.edCls = 'iv' + (opts.light ? ' iv-light' : '');
      if (opts.mode === 'list') {
        var q = (s.q || '').toLowerCase();
        var rows = list.filter(function (i) {
          if (s.ctry !== 'all' && i.c !== s.ctry) return false;
          if (s.stf !== 'all' && i.st !== s.stf) return false;
          if (q && (i.id + ' ' + i.who + ' ' + i.order).toLowerCase().indexOf(q) < 0) return false;
          return true;
        });
        var selN = rows.filter(function (i) { return s.sel[i.id]; }).length;
        v.rows = rows.map(function (i) {
          var st = chip(i.st);
          return {
            id: i.id, date: M.dateOf(i.date), order: i.order, who: i.who, where: i.city + ' · ' + i.c, auth: i.authority, total: M.money(i.total, i.cur), tax: M.money(i.tax, i.cur), stT: st.t, stCls: st.cls,
            open: href(i.id), openPrint: href(i.id, '&print=1'), checked: !!s.sel[i.id], busy: s.busy === i.id,
            canSend: i.st === 'pending' || i.st === 'rejected' || i.st === 'draft', sendLabel: i.st === 'rejected' ? 'Fix and resend' : i.st === 'draft' ? 'Issue and send' : 'Send now',
            ref: i.c === 'KSA' ? i.uuid.slice(0, 8) + '…' : (i.irn ? i.irn.slice(-10) : '—'), err: i.err || '', hasErr: !!i.err && i.st === 'rejected',
            fileLabel: i.c === 'KSA' ? 'XML' : 'JSON', fileAria: 'Download ' + i.id + (i.c === 'KSA' ? ' as UBL XML' : ' as FBR JSON'),
            toggle: function () { var n = {}; Object.keys(s.sel).forEach(function (k) { n[k] = s.sel[k]; }); n[i.id] = !n[i.id]; set({ sel: n }); },
            dl: function () { M.downloadXml(i); toast('Downloaded ' + i.id + (i.c === 'KSA' ? '.xml (unsigned demo file)' : '.json')); },
            send: function () { submit(i); }
          };
        });
        v.count = rows.length + ' of ' + list.length + ' invoices'; v.selN = selN; v.hasSel = selN > 0; v.selLabel = selN + ' selected';
        var all = list; var net = 0, vat = 0, pend = 0, rej = 0, ksa = 0, pk = 0;
        all.forEach(function (i) { if (i.st !== 'draft') { if (i.c === 'KSA') { ksa += i.tax; } else { pk += i.tax; } } if (i.st === 'pending') pend++; if (i.st === 'rejected') rej++; });
        v.kIssued = all.filter(function (i) { return i.st !== 'draft'; }).length; v.kVatKsa = M.money(ksa, 'SAR'); v.kVatPk = M.money(pk, 'PKR'); v.kPending = pend; v.kRejected = rej;
        v.setQ = function (e) { set({ q: e.target.value }); };
        ['all', 'KSA', 'PK'].forEach(function (k) { v['ct_' + k] = s.ctry === k ? 'true' : 'false'; v['setCt_' + k] = function () { set({ ctry: k }); }; });
        ['all', 'reported', 'cleared', 'pending', 'rejected', 'draft'].forEach(function (k) { v['sf_' + k] = s.stf === k ? 'true' : 'false'; v['setSf_' + k] = function () { set({ stf: k }); }; });
        v.csvAll = function () { M.downloadCsv(rows, 'miles-invoices.csv'); toast('Downloaded ' + rows.length + ' invoices as CSV'); };
        v.csvSel = function () { var pick = rows.filter(function (i) { return s.sel[i.id]; }); M.downloadCsv(pick, 'miles-invoices-selected.csv'); toast('Downloaded ' + pick.length + ' selected as CSV'); };
        v.printList = function () { window.print(); };
        v.sendSel = function () { rows.filter(function (i) { return s.sel[i.id] && (i.st === 'pending' || i.st === 'rejected' || i.st === 'draft'); }).forEach(function (i, n) { setTimeout(function () { setStatus(i.id, i.type === 'standard' ? 'cleared' : 'reported'); set({ tick: Date.now() }); }, 500 + n * 500); }); toast('Sending selected invoices (demo)…'); };
        v.selAll = function () { var n = {}; var on = selN !== rows.length; rows.forEach(function (i) { n[i.id] = on; }); set({ sel: n }); };
        v.allChecked = rows.length > 0 && selN === rows.length;
        v.noRows = rows.length === 0;
      }
      if (opts.mode === 'detail') {
        var inv = withStatus(list.filter(function (i) { return i.id === s.id; }))[0] || withStatus(list)[0];
        var st = chip(inv.st), ksa = inv.c === 'KSA';
        v.id = inv.id; v.date = M.dateOf(inv.date); v.time = M.timeOf(inv.date); v.order = inv.order; v.cur = inv.cur;
        v.typeLabel = inv.type === 'standard' ? 'Tax invoice' : inv.type === 'sale' ? 'Sales tax invoice' : 'Simplified tax invoice';
        v.typeAr = inv.type === 'standard' ? 'فاتورة ضريبية' : 'فاتورة ضريبية مبسّطة';
        v.isKsa = ksa; v.isPk = !ksa;
        v.sellerName = M.seller.name; v.sellerAr = M.seller.nameAr; v.sellerAddr = ksa ? M.seller.addr : M.seller.addrPk; v.sellerVat = M.seller.vat; v.sellerCrn = M.seller.crn; v.sellerNtn = M.seller.ntn; v.sellerStrn = M.seller.strn;
        v.who = inv.who; v.phone = inv.phone; v.city = inv.city; v.buyerVat = inv.buyerVat || ''; v.hasBuyerVat = !!inv.buyerVat; v.buyerNtn = inv.buyerNtn || ''; v.hasBuyerNtn = !!inv.buyerNtn;
        v.pay = inv.pay; v.note = inv.note || ''; v.hasNote = !!inv.note;
        v.lines = inv.lines.map(function (l, i) { return { n: i + 1, d: l.d, q: l.q, unit: M.money(l.unitNet), net: M.money(l.net), tax: M.money(l.tax), gross: M.money(l.gross), hs: l.hs }; });
        v.rateLabel = ksa ? 'VAT 15%' : 'Sales tax 18%'; v.sub = M.money(inv.sub, inv.cur); v.taxAmt = M.money(inv.tax, inv.cur); v.total = M.money(inv.total, inv.cur);
        v.qrSrc = M.qrSvgUri(M.qrText(inv), 4); v.qrText = M.qrText(inv); v.qrCaption = ksa ? 'ZATCA QR (TLV, base64)' : (inv.irn ? 'FBR invoice QR' : 'FBR QR is issued after posting');
        v.uuid = inv.uuid; v.icv = inv.seq; v.hash = inv.hash; v.irn = inv.irn || 'Not issued yet'; v.hasIrn = !!inv.irn;
        v.authority = inv.authority; v.stT = st.t; v.stCls = st.cls; v.err = inv.err || ''; v.hasErr = !!inv.err && inv.st === 'rejected';
        v.steps = M.stage(inv).map(function (x) { return { t: x.t, cls: 'iv-step ' + x.cls, at: x.at }; });
        v.canSend = inv.st === 'pending' || inv.st === 'rejected' || inv.st === 'draft'; v.sent = !v.canSend; v.busy = !!s.busy;
        v.sendLabel = inv.st === 'rejected' ? 'Fix and resend' : inv.st === 'draft' ? 'Issue and send' : 'Send to ' + inv.authority;
        v.isStudio = !!opts.studio;
        v.backHref = v.isStudio ? pre + '76-Invoices.dc.html' : pre + '24-Invoices.dc.html'; v.backLabel = v.isStudio ? 'All invoices' : 'My invoices';
        v.print = function () { window.print(); };
        v.pdf = function () { toast('Choose “Save as PDF” as the printer in the print window.'); setTimeout(function () { window.print(); }, 600); };
        v.xmlLabel = ksa ? 'Download XML' : 'Download JSON'; v.xml = function () { M.downloadXml(inv); toast(ksa ? 'Downloaded UBL XML (unsigned demo file)' : 'Downloaded FBR JSON payload'); };
        v.copyQr = function () { try { navigator.clipboard.writeText(M.qrText(inv)); toast('QR payload copied'); } catch (e) { toast('Copy is not available here'); } };
        v.send = function () { submit(inv); };
        v.signNote = ksa ? 'Demo XML is not signed. A live submission needs the CSID certificate and a XAdES signature.' : 'Demo JSON follows the FBR Digital Invoicing shape. A live post needs your FBR token.';
      }
      if (opts.mode === 'integrations') {
        var env = s.env || {};
        v.zEnv = env.zEnv || 'sandbox'; v.fEnv = env.fEnv || 'sandbox';
        v.zOn = env.zOn ? 'true' : 'false'; v.fOn = env.fOn ? 'true' : 'false'; v.zConnected = !!env.zOn; v.fConnected = !!env.fOn; v.zNot = !env.zOn; v.fNot = !env.fOn;
        v.zChip = env.zOn ? 'us-chip is-ok' : 'us-chip is-warn'; v.zChipT = env.zOn ? 'Connected (demo)' : 'Not connected';
        v.fChip = env.fOn ? 'us-chip is-ok' : 'us-chip is-warn'; v.fChipT = env.fOn ? 'Connected (demo)' : 'Not connected';
        function save(p) { var n = {}; Object.keys(env).forEach(function (k) { n[k] = env[k]; }); Object.keys(p).forEach(function (k) { n[k] = p[k]; }); lw(KEYI, n); set({ env: n }); }
        v.zSet = ['sandbox', 'simulation', 'production'].map(function (k) { return { k: k, on: v.zEnv === k ? 'true' : 'false', pick: function () { save({ zEnv: k }); } }; });
        v.fSet = ['sandbox', 'production'].map(function (k) { return { k: k, on: v.fEnv === k ? 'true' : 'false', pick: function () { save({ fEnv: k }); } }; });
        v.zUrl = { sandbox: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal', simulation: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation', production: 'https://gw-fatoora.zatca.gov.sa/e-invoicing/core' }[v.zEnv];
        v.fUrl = v.fEnv === 'sandbox' ? 'https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb' : 'https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata';
        v.zConnect = function () { set({ busy: 'z' }); toast('Requesting the compliance CSID (demo)…'); setTimeout(function () { save({ zOn: true }); set({ busy: '' }); toast('Demo: onboarded. Certificate valid for 12 months.'); }, 1400); };
        v.fConnect = function () { set({ busy: 'f' }); toast('Validating the token (demo)…'); setTimeout(function () { save({ fOn: true }); set({ busy: '' }); toast('Demo: FBR token accepted.'); }, 1200); };
        v.zOff = function () { save({ zOn: false }); toast('ZATCA disconnected'); }; v.fOff = function () { save({ fOn: false }); toast('FBR disconnected'); };
        v.zTest = function () { toast('Demo: ZATCA answered 200 · invoice accepted in ' + v.zEnv + '.'); }; v.fTest = function () { toast('Demo: FBR answered 200 · validated in ' + v.fEnv + '.'); };
        v.pendingN = withStatus(M.invoices).filter(function (i) { return i.st === 'pending'; }).length;
        v.retryAll = function () { withStatus(M.invoices).forEach(function (i, n) { if (i.st === 'pending' || i.st === 'rejected') setTimeout(function () { setStatus(i.id, i.type === 'standard' ? 'cleared' : 'reported'); set({ tick: Date.now() }); }, 400 + n * 300); }); toast('Retrying every pending and rejected invoice (demo)…'); };
        v.busyZ = s.busy === 'z'; v.busyF = s.busy === 'f';
      }
      return v;
    };
    return self;
  }
  window.MilesInvoicesUI = { create: create };
})();
