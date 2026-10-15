/* Miles Retold · invoicing demo core.
   Real, client-side and verifiable here:
     - invoice records and totals (KSA: 15% VAT, prices on the site include VAT; PK: 18% sales tax)
     - the ZATCA QR payload: TLV (tags 1-5) -> base64, drawn as a QR code (invoicing/qrcode.js, MIT)
     - UBL 2.1 XML (ZATCA simplified-invoice shape), FBR Digital Invoicing JSON, CSV, print
   Simulated (no network, no credentials): reporting / clearance to ZATCA (Fatoora) and posting to FBR.
   A live connection needs a backend that holds the certificate / token and signs the invoice; see docs/invoicing-integration.md.
   window.MilesInvoices                                                                                                  */
(function () {
  'use strict';
  var SELLER = {
    name: 'Miles Retold Trading', nameAr: 'مايلز ريتولد للتجارة', vat: '399999999900003' /* ZATCA sandbox test VAT number */, crn: '1010000000', ntn: '1234567-8', strn: '0000000000000',
    addr: 'Building 12, King Fahd Rd, Al Olaya, Riyadh 12214, Saudi Arabia', addrPk: 'Gulberg III, Lahore 54660, Pakistan', phone: '+966 55 000 0000', email: 'hello@milesretold.com'
  };
  var RATE = { KSA: 0.15, PK: 0.18 };
  var CUR = { KSA: 'SAR', PK: 'PKR' };

  /* sample customers + items; amounts are VAT-inclusive prices from the price list */
  var L = {
    book: function (d, p) { return { d: d || 'Portrait book 8 × 10 in · 40 pages', q: 1, p: p || 280 }; },
    ship: function (p) { return { d: 'Delivery · SMSA Express', q: 1, p: p || 24 }; },
    wrap: function () { return { d: 'Gift wrap & handwritten note', q: 1, p: 15 }; },
    copy: function (n) { return { d: 'Extra copy (reprint price)', q: n || 1, p: 154 }; },
    gift: function (p) { return { d: 'Gift card', q: 1, p: p || 300 }; }
  };
  var RAW = [
    { id: 'INV-2026-000131', date: '2026-09-14T21:12:00+03:00', order: 'MR-1042', who: 'Sara Ahmed', phone: '+966 55 123 4567', city: 'Riyadh', c: 'KSA', type: 'simplified', pay: 'mada', st: 'reported', lines: [L.book('Deposit (50%) · Portrait book 8 × 10 in · Honeymoon', 140)], note: 'Deposit for order MR-1042' },
    { id: 'INV-2026-000098', date: '2026-05-02T10:30:00+03:00', order: 'MR-0877', who: 'Sara Ahmed', phone: '+966 55 123 4567', city: 'Riyadh', c: 'KSA', type: 'simplified', pay: 'Apple Pay', st: 'reported', lines: [L.book('Portrait book 8 × 10 in · London · 40 pages', 280), L.ship(24)] },
    { id: 'INV-2026-000145', date: '2026-10-07T14:40:00+03:00', order: 'MR-1042', who: 'Sara Ahmed', phone: '+966 55 123 4567', city: 'Riyadh', c: 'KSA', type: 'simplified', pay: 'mada', st: 'reported', lines: [L.book('Portrait book 8 × 10 in · Honeymoon · 40 pages'), L.ship(24)], note: 'Balance (50%) · deposit invoiced INV-2026-000131' },
    { id: 'INV-2026-000144', date: '2026-10-05T11:10:00+03:00', order: 'MR-1039', who: 'Noura Al-Qahtani', phone: '+966 50 777 1212', city: 'Jeddah', c: 'KSA', type: 'simplified', pay: 'Apple Pay', st: 'reported', lines: [L.book('Landscape book 11 × 8.5 in · Travel · 48 pages', 332), L.wrap(), L.ship(24)] },
    { id: 'INV-2026-000143', date: '2026-10-04T16:25:00+03:00', order: 'MR-1038', who: 'Al Rawabi Events', phone: '+966 11 400 8800', city: 'Riyadh', c: 'KSA', type: 'standard', pay: 'Bank transfer', st: 'cleared', buyerVat: '310122393500003', lines: [L.book('Square book 10 × 10 in · Wedding · 60 pages', 372), L.copy(4), L.ship(44)] },
    { id: 'INV-2026-000142', date: '2026-10-03T09:02:00+03:00', order: 'MR-1036', who: 'Dana Mansour', phone: '+966 56 330 9090', city: 'Dammam', c: 'KSA', type: 'simplified', pay: 'STC Pay', st: 'pending', lines: [L.book('Portrait book 8 × 10 in · Love story · 40 pages'), L.ship(24)] },
    { id: 'INV-2026-000141', date: '2026-10-02T19:45:00+03:00', order: 'GIFT-0412', who: 'Bilal Qureshi', phone: '+966 54 101 4040', city: 'Riyadh', c: 'KSA', type: 'simplified', pay: 'Tabby', st: 'rejected', err: 'KSA-CVV-28: seller VAT registration number is missing in the QR payload (demo response)', lines: [L.gift(450)] },
    { id: 'INV-2026-000140', date: '2026-09-29T13:30:00+03:00', order: 'MR-1031', who: 'Ayesha Tariq', phone: '+966 55 909 0101', city: 'Medina', c: 'KSA', type: 'simplified', pay: 'mada', st: 'reported', lines: [L.book('Portrait book 8 × 10 in · Travel · 40 pages'), L.copy(1), L.ship(24)] },
    { id: 'INV-2026-000139', date: '2026-09-27T10:05:00+03:00', order: 'MR-1029', who: 'Faisal Nasser', phone: '+966 59 202 2020', c: 'KSA', city: 'Riyadh', type: 'simplified', pay: 'mada', st: 'draft', lines: [L.book('Landscape book 11 × 8.5 in · Camera roll · 40 pages', 320)] },
    { id: 'PK-2026-000072', date: '2026-10-06T15:20:00+05:00', order: 'MR-1041', who: 'Hira Siddiqui', phone: '+92 300 555 0101', city: 'Lahore', c: 'PK', type: 'sale', pay: 'JazzCash', st: 'reported', buyerNtn: '4210112345671', lines: [{ d: 'Portrait book 8 × 10 in · Travel · 40 pages', q: 1, p: 20720, hs: '4901.9900' }, { d: 'Delivery · TCS', q: 1, p: 592, hs: '9965.9000' }] },
    { id: 'PK-2026-000071', date: '2026-10-03T12:00:00+05:00', order: 'MR-1035', who: 'Usman Khan', phone: '+92 321 555 0188', city: 'Karachi', c: 'PK', type: 'sale', pay: 'Easypaisa', st: 'reported', lines: [{ d: 'Square book 10 × 10 in · Wedding · 52 pages', q: 1, p: 22200, hs: '4901.9900' }, { d: 'Gift wrap & note', q: 1, p: 1110, hs: '4818.9000' }] },
    { id: 'PK-2026-000070', date: '2026-10-01T18:40:00+05:00', order: 'MR-1033', who: 'Mehwish Ali', phone: '+92 333 555 0155', city: 'Islamabad', c: 'PK', type: 'sale', pay: 'Bank transfer', st: 'pending', lines: [{ d: 'Landscape book 11 × 8.5 in · Honeymoon · 40 pages', q: 1, p: 23680, hs: '4901.9900' }] },
    { id: 'PK-2026-000069', date: '2026-09-28T09:15:00+05:00', order: 'GIFT-0409', who: 'Zainab Raza', phone: '+92 345 555 0166', city: 'Lahore', c: 'PK', type: 'sale', pay: 'Raast', st: 'rejected', err: 'FBR 0052: buyer NTN / CNIC is required for this scenario (demo response)', lines: [{ d: 'Gift card', q: 1, p: 22200, hs: '4911.9900' }] },
    { id: 'PK-2026-000068', date: '2026-09-25T14:00:00+05:00', order: 'MR-1027', who: 'Omar Farooq', phone: '+92 322 555 0177', city: 'Faisalabad', c: 'PK', type: 'sale', pay: 'JazzCash', st: 'draft', lines: [{ d: 'Portrait book 8 × 10 in · Love story · 40 pages', q: 1, p: 20720, hs: '4901.9900' }] }
  ];

  function r2(n) { return Math.round(n * 100) / 100; }
  function build(x) {
    var rate = RATE[x.c], cur = CUR[x.c];
    var lines = x.lines.map(function (l) {
      var gross = l.p * l.q, net = r2(gross / (1 + rate)), tax = r2(gross - net);
      return { d: l.d, q: l.q, unitNet: r2(l.p / (1 + rate)), unitGross: l.p, net: net, tax: tax, gross: gross, hs: l.hs || '' };
    });
    var sub = r2(lines.reduce(function (a, l) { return a + l.net; }, 0)), tax = r2(lines.reduce(function (a, l) { return a + l.tax; }, 0)), total = r2(sub + tax);
    var seq = parseInt(x.id.replace(/\D+/g, '').slice(-6), 10);
    var o = {};
    Object.keys(x).forEach(function (k) { o[k] = x[k]; });
    o.cur = cur; o.rate = rate; o.lines = lines; o.sub = sub; o.tax = tax; o.total = total; o.seq = seq;
    o.uuid = fakeUuid(x.id); o.hash = fakeHash(x.id); o.prevHash = fakeHash('prev-' + x.id);
    o.irn = x.c === 'PK' && x.st === 'reported' ? '4210112345671' + x.date.slice(0, 10).replace(/-/g, '') + String(seq).padStart(6, '0') : '';
    o.authority = x.c === 'KSA' ? 'ZATCA' : 'FBR';
    return o;
  }
  function fakeHash(s) { var h = 2166136261, out = ''; for (var i = 0; i < 44; i++) { h ^= s.charCodeAt(i % s.length) + i; h = Math.imul(h, 16777619); out += 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'[(h >>> 7) & 63]; } return out.slice(0, 43) + '='; }
  function fakeUuid(s) { var a = fakeHash(s).replace(/[^0-9a-f]/gi, '0').toLowerCase().padEnd(32, '0'); return a.slice(0, 8) + '-' + a.slice(8, 12) + '-4' + a.slice(13, 16) + '-a' + a.slice(17, 20) + '-' + a.slice(20, 32); }
  var invoices = RAW.map(build);
  function byId(id) { for (var i = 0; i < invoices.length; i++) if (invoices[i].id === id) return invoices[i]; return invoices[2]; }

  /* ---------- money / dates ---------- */
  function money(n, cur) { return (cur ? cur + ' ' : '') + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function dateOf(iso) { var d = new Date(iso); return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  function timeOf(iso) { return iso.slice(11, 16); }

  /* ---------- ZATCA QR (phase 1): TLV tags 1..5 -> base64 ---------- */
  function tlv(tag, value) { var b = new TextEncoder().encode(String(value)); var out = new Uint8Array(2 + b.length); out[0] = tag; out[1] = b.length; out.set(b, 2); return out; }
  function zatcaQrPayload(inv) {
    var parts = [tlv(1, SELLER.name), tlv(2, SELLER.vat), tlv(3, new Date(inv.date).toISOString().replace(/\.\d{3}Z$/, 'Z')), tlv(4, inv.total.toFixed(2)), tlv(5, inv.tax.toFixed(2))];
    var len = parts.reduce(function (a, p) { return a + p.length; }, 0), all = new Uint8Array(len), o = 0;
    parts.forEach(function (p) { all.set(p, o); o += p.length; });
    var s = ''; for (var i = 0; i < all.length; i++) s += String.fromCharCode(all[i]);
    return btoa(s);
  }
  function qrText(inv) { return inv.c === 'KSA' ? zatcaQrPayload(inv) : (inv.irn ? 'https://fbr.gov.pk/di/verify?irn=' + inv.irn : 'FBR-PENDING:' + inv.id); }
  function qrSvgUri(text, size) {
    var q = window.qrcode(0, 'M'); q.addData(text, 'Byte'); q.make();
    var svg = q.createSvgTag({ cellSize: size || 4, margin: 0, scalable: true });
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /* ---------- UBL 2.1 (ZATCA simplified / standard invoice shape, unsigned) ---------- */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function ubl(inv) {
    var d = new Date(inv.date), ymd = inv.date.slice(0, 10), hms = inv.date.slice(11, 19);
    var code = inv.type === 'standard' ? '0100000' : '0200000';
    var x = ['<?xml version="1.0" encoding="UTF-8"?>',
      '<!-- Demo file generated in the browser. It is NOT signed (no XAdES signature, certificate or cryptographic stamp), so ZATCA would not accept it as is. -->',
      '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">',
      '  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>', '  <cbc:ID>' + esc(inv.id) + '</cbc:ID>', '  <cbc:UUID>' + inv.uuid + '</cbc:UUID>',
      '  <cbc:IssueDate>' + ymd + '</cbc:IssueDate>', '  <cbc:IssueTime>' + hms + '</cbc:IssueTime>',
      '  <cbc:InvoiceTypeCode name="' + code + '">388</cbc:InvoiceTypeCode>', '  <cbc:Note languageID="en">' + esc(inv.note || 'Order ' + inv.order) + '</cbc:Note>',
      '  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>', '  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>',
      '  <cac:AdditionalDocumentReference><cbc:ID>ICV</cbc:ID><cbc:UUID>' + inv.seq + '</cbc:UUID></cac:AdditionalDocumentReference>',
      '  <cac:AdditionalDocumentReference><cbc:ID>PIH</cbc:ID><cac:Attachment><cbc:EmbeddedDocumentBinaryObject mimeType="text/plain">' + inv.prevHash + '</cbc:EmbeddedDocumentBinaryObject></cac:Attachment></cac:AdditionalDocumentReference>',
      '  <cac:AdditionalDocumentReference><cbc:ID>QR</cbc:ID><cac:Attachment><cbc:EmbeddedDocumentBinaryObject mimeType="text/plain">' + zatcaQrPayload(inv) + '</cbc:EmbeddedDocumentBinaryObject></cac:Attachment></cac:AdditionalDocumentReference>',
      '  <cac:AccountingSupplierParty><cac:Party><cac:PartyIdentification><cbc:ID schemeID="CRN">' + SELLER.crn + '</cbc:ID></cac:PartyIdentification>',
      '    <cac:PartyLegalEntity><cbc:RegistrationName>' + esc(SELLER.name) + '</cbc:RegistrationName></cac:PartyLegalEntity>',
      '    <cac:PartyTaxScheme><cbc:CompanyID>' + SELLER.vat + '</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme></cac:Party></cac:AccountingSupplierParty>',
      '  <cac:AccountingCustomerParty><cac:Party><cac:PartyLegalEntity><cbc:RegistrationName>' + esc(inv.who) + '</cbc:RegistrationName></cac:PartyLegalEntity>' + (inv.buyerVat ? '<cac:PartyTaxScheme><cbc:CompanyID>' + inv.buyerVat + '</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>' : '') + '</cac:Party></cac:AccountingCustomerParty>',
      '  <cac:TaxTotal><cbc:TaxAmount currencyID="SAR">' + inv.tax.toFixed(2) + '</cbc:TaxAmount></cac:TaxTotal>',
      '  <cac:LegalMonetaryTotal><cbc:LineExtensionAmount currencyID="SAR">' + inv.sub.toFixed(2) + '</cbc:LineExtensionAmount><cbc:TaxExclusiveAmount currencyID="SAR">' + inv.sub.toFixed(2) + '</cbc:TaxExclusiveAmount><cbc:TaxInclusiveAmount currencyID="SAR">' + inv.total.toFixed(2) + '</cbc:TaxInclusiveAmount><cbc:PayableAmount currencyID="SAR">' + inv.total.toFixed(2) + '</cbc:PayableAmount></cac:LegalMonetaryTotal>'];
    inv.lines.forEach(function (l, i) {
      x.push('  <cac:InvoiceLine><cbc:ID>' + (i + 1) + '</cbc:ID><cbc:InvoicedQuantity unitCode="PCE">' + l.q + '</cbc:InvoicedQuantity><cbc:LineExtensionAmount currencyID="SAR">' + l.net.toFixed(2) + '</cbc:LineExtensionAmount>',
        '    <cac:TaxTotal><cbc:TaxAmount currencyID="SAR">' + l.tax.toFixed(2) + '</cbc:TaxAmount><cbc:RoundingAmount currencyID="SAR">' + l.gross.toFixed(2) + '</cbc:RoundingAmount></cac:TaxTotal>',
        '    <cac:Item><cbc:Name>' + esc(l.d) + '</cbc:Name><cac:ClassifiedTaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>15.00</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory></cac:Item>',
        '    <cac:Price><cbc:PriceAmount currencyID="SAR">' + l.unitNet.toFixed(2) + '</cbc:PriceAmount></cac:Price></cac:InvoiceLine>');
    });
    x.push('</Invoice>', '');
    return x.join('\n');
  }

  /* ---------- FBR Digital Invoicing JSON (reference shape; check the current FBR technical document before going live) ---------- */
  function fbrJson(inv) {
    return JSON.stringify({
      invoiceType: 'Sale Invoice', invoiceDate: inv.date.slice(0, 10), sellerNTNCNIC: SELLER.ntn.replace('-', ''), sellerBusinessName: SELLER.name, sellerProvince: 'Punjab', sellerAddress: SELLER.addrPk,
      buyerNTNCNIC: inv.buyerNtn || '', buyerBusinessName: inv.who, buyerProvince: 'Punjab', buyerAddress: inv.city, buyerRegistrationType: inv.buyerNtn ? 'Registered' : 'Unregistered', invoiceRefNo: inv.id, scenarioId: 'SN002',
      items: inv.lines.map(function (l) {
        return { hsCode: l.hs || '4901.9900', productDescription: l.d, rate: '18%', uoM: 'Numbers, pieces, units', quantity: l.q, totalValues: l.gross, valueSalesExcludingST: l.net, fixedNotifiedValueOrRetailPrice: 0, salesTaxApplicable: l.tax, salesTaxWithheldAtSource: 0, extraTax: 0, furtherTax: 0, sroScheduleNo: '', fedPayable: 0, discount: 0, saleType: 'Goods at standard rate (default)', sroItemSerialNo: '' };
      })
    }, null, 2);
  }

  /* ---------- downloads / print ---------- */
  function save(name, mime, text) {
    var blob = new Blob([text], { type: mime + ';charset=utf-8' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function csv(list) {
    var head = ['Invoice', 'Date', 'Order', 'Customer', 'Country', 'Currency', 'Net', 'Tax', 'Total', 'Authority', 'Status', 'Authority reference'];
    var rows = list.map(function (i) { return [i.id, i.date.slice(0, 10), i.order, i.who, i.c, i.cur, i.sub.toFixed(2), i.tax.toFixed(2), i.total.toFixed(2), i.authority, i.st, i.c === 'KSA' ? i.uuid : i.irn]; });
    return [head].concat(rows).map(function (r) { return r.map(function (c) { c = String(c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
  }
  function downloadXml(inv) { save(inv.id + (inv.c === 'KSA' ? '.xml' : '.json'), inv.c === 'KSA' ? 'application/xml' : 'application/json', inv.c === 'KSA' ? ubl(inv) : fbrJson(inv)); }
  function downloadCsv(list, name) { save(name || 'invoices.csv', 'text/csv', csv(list)); }

  /* ---------- authority status (simulated) ---------- */
  var ST = {
    reported: { t: 'Reported', cls: 'is-ok' }, cleared: { t: 'Cleared', cls: 'is-ok' }, pending: { t: 'Pending', cls: 'is-warn' },
    rejected: { t: 'Rejected', cls: 'is-bad' }, draft: { t: 'Draft', cls: '' }
  };
  function stage(inv) {
    var s = inv.st, ksa = inv.c === 'KSA';
    var steps = ksa ? ['Invoice created', 'XML built and hashed', 'Signed with the CSID certificate', inv.type === 'standard' ? 'Cleared by ZATCA' : 'Reported to ZATCA'] : ['Invoice created', 'Validated (FBR validate API)', 'Posted to FBR', 'IRN and QR received'];
    var done = s === 'draft' ? 1 : s === 'pending' ? 2 : s === 'rejected' ? 3 : 4;
    return steps.map(function (t, i) { return { t: t, cls: i < done ? 'done' : (s === 'rejected' && i === 3 ? 'bad' : ''), at: i < done ? timeOf(inv.date) : '' }; });
  }

  window.MilesInvoices = {
    seller: SELLER, invoices: invoices, byId: byId, money: money, dateOf: dateOf, timeOf: timeOf, ST: ST, stage: stage,
    qrText: qrText, qrSvgUri: qrSvgUri, zatcaQrPayload: zatcaQrPayload, ubl: ubl, fbrJson: fbrJson, csv: csv, downloadXml: downloadXml, downloadCsv: downloadCsv, save: save,
    print: function () { window.print(); }
  };
})();
