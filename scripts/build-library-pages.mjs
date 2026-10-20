#!/usr/bin/env node
/* Builds the pages and files added from the library audit (run again any time; it rewrites its own output):
 *   - email templates: public/emails/*.html (+ .txt) with {{placeholders}}, and public/emails/preview/*.html filled with sample values
 *   - customer pages (dark + light): 137 Notifications, 138 Email previews, 139 Interface kit
 * The pages reuse the shell of 120-Privacy (header, footer, theme twin, scripts), so they behave like every other customer page.
 * They are design-only, like the privacy pages: nothing is saved or sent. Styles: css/library-pages.css. */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';

const PUB = new URL('../public/', import.meta.url);
const rd = (f) => readFileSync(new URL(f, PUB), 'utf8');
const wr = (f, s) => writeFileSync(new URL(f, PUB), s);

/* ------------------------------------------------------------------ emails */
const SAMPLE = {
  customer_name: 'Sara', designer: 'Rameen', order_no: 'MR-1042', book_title: 'Maldives · March 2022', book_type: 'Portrait 8 × 10 · 40 pages · linen hardcover',
  deposit: 'SAR 152', balance: 'SAR 152', total: 'SAR 304', address: 'Al Olaya, Riyadh', round: '2', pages: '40 pages', reply_by: 'Thursday 22 October',
  courier: 'SMSA Express', tracking_no: 'SMSA-88213094', eta: 'Tuesday 3 November',
  upload_url: '#', proof_url: '#', pay_url: '#', track_url: '#', account_url: '#', help_email: 'hello@milesretold.com'
};
const EMAILS = [
  { key: 'order-confirmed', tab: 'Order confirmed', subject: 'Your Miles Retold order {{order_no}} is confirmed', pre: 'We have your deposit. Next, add your photos.',
    head: 'Thank you, {{customer_name}}.', lead: 'We have your deposit, and {{designer}} will design your {{book_title}} book. Add your photos and she can begin.',
    rows: [['Order', '{{order_no}}'], ['Book', '{{book_type}}'], ['Deposit paid', '{{deposit}}'], ['Balance, after you approve the proof', '{{balance}}'], ['Delivering to', '{{address}}']],
    cta: ['Add your photos', '{{upload_url}}'], note: 'Nothing is printed until you have seen a proof and approved it.' },
  { key: 'proof-ready', tab: 'Proof ready', subject: 'Proof round {{round}} of your book is ready', pre: 'Look it over, pin a comment on anything, then approve.',
    head: 'Your proof is ready, {{customer_name}}.', lead: 'Round {{round}} of {{book_title}} is waiting for you. Tap any page to leave a comment, or approve it when you love it.',
    rows: [['Order', '{{order_no}}'], ['Proof', 'Round {{round}} · {{pages}}'], ['Designer', '{{designer}}'], ['Please reply by', '{{reply_by}}']],
    cta: ['Review your proof', '{{proof_url}}'], note: 'No reply by that date is fine. We will wait and send a reminder, we never print without your yes.' },
  { key: 'balance-due', tab: 'Balance due', subject: 'Pay the balance and we will print your book', pre: 'Your design is locked. One payment and it goes to the printer.',
    head: 'Your design is locked.', lead: 'Once the remaining half is paid, {{book_title}} goes to the printer in this week’s batch.',
    rows: [['Order total', '{{total}}'], ['Deposit paid', '{{deposit}}'], ['Balance due', '{{balance}}'], ['Pay with', 'mada, Apple Pay, STC Pay or Tabby']],
    cta: ['Pay the balance', '{{pay_url}}'], note: 'Prices on this page are shown in your currency. The payment page asks for nothing we do not need.' },
  { key: 'shipped', tab: 'On its way', subject: 'Your book is on its way', pre: 'Courier, tracking number and the day to expect it.',
    head: 'It is on its way, {{customer_name}}.', lead: '{{book_title}} left the studio today. Someone needs to be there to receive it.',
    rows: [['Courier', '{{courier}}'], ['Tracking number', '{{tracking_no}}'], ['Expected', '{{eta}}'], ['Delivering to', '{{address}}']],
    cta: ['Track your book', '{{track_url}}'], note: 'Something wrong when it arrives? Reply to this email and we will make it right.' }
];
const BRAND = { forest: '#12342b', paper: '#f6efe6', card: '#fffcf6', ink: '#12342b', mute: '#5c6b64', line: '#e4d9cb', cta: '#b4521f' };
const fill = (s, map) => s.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in map ? map[k] : m));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function emailHtml(e) {
  const font = "Arial, Helvetica, sans-serif", serif = "Georgia, 'Times New Roman', serif";
  const rows = e.rows.map(([k, v]) => `<tr><td style="padding:10px 0;border-top:1px solid ${BRAND.line};font:14px/1.4 ${font};color:${BRAND.mute};">${esc(k)}</td><td align="right" style="padding:10px 0;border-top:1px solid ${BRAND.line};font:bold 14px/1.4 ${font};color:${BRAND.ink};">${esc(v)}</td></tr>`).join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${esc(e.subject)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.paper};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(e.pre)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
<tr><td style="padding:0 4px 16px;font:bold 22px/1 ${serif};color:${BRAND.forest};letter-spacing:.5px;">MiLes <span style="font:bold 10px/1 ${font};letter-spacing:4px;color:${BRAND.mute};">RETOLD</span></td></tr>
<tr><td style="background:${BRAND.card};border-radius:18px;padding:32px 28px;border:1px solid ${BRAND.line};">
<h1 style="margin:0 0 12px;font:normal 28px/1.2 ${serif};color:${BRAND.ink};">${esc(e.head)}</h1>
<p style="margin:0 0 22px;font:16px/1.6 ${font};color:${BRAND.ink};">${esc(e.lead)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;">
${rows}
<tr><td colspan="2" style="border-top:1px solid ${BRAND.line};font-size:0;line-height:0;">&nbsp;</td></tr></table>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:12px;background:${BRAND.cta};"><a href="${e.cta[1]}" style="display:inline-block;padding:15px 26px;font:bold 16px/1 ${font};color:#ffffff;text-decoration:none;border-radius:12px;">${esc(e.cta[0])}</a></td></tr></table>
<p style="margin:22px 0 0;font:14px/1.6 ${font};color:${BRAND.mute};">${esc(e.note)}</p>
</td></tr>
<tr><td style="padding:18px 8px 0;font:12px/1.6 ${font};color:${BRAND.mute};">You are getting this because of order {{order_no}} on Miles Retold. Questions? Reply to this email or write to {{help_email}}.<br>Your photos are private to you and the studio. <a href="{{account_url}}" style="color:${BRAND.mute};">Change what we email you</a></td></tr>
</table></td></tr></table></body></html>
`;
}
function emailText(e) {
  return `${e.head}\n\n${e.lead}\n\n${e.rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${e.cta[0]}: ${e.cta[1]}\n\n${e.note}\n\n--\nMiles Retold · order {{order_no}} · {{help_email}}\nChange what we email you: {{account_url}}\n`;
}
mkdirSync(new URL('emails/preview/', PUB), { recursive: true });
for (const e of EMAILS) {
  wr(`emails/${e.key}.html`, emailHtml(e));
  wr(`emails/${e.key}.txt`, `Subject: ${e.subject}\n\n${emailText(e)}`);
  wr(`emails/preview/${e.key}.html`, fill(emailHtml(e), SAMPLE));
}

/* ------------------------------------------------------------------ pages */
const ic = (d, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>', card: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/>', truck: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>', shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>', tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.4"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'
};

const NOTES = [
  { id: 1, ic: 'doc', unread: true, t: 'Proof round 2 is ready', d: 'Rameen finished your second proof. Look it over and approve it, or pin a comment.', when: 'Today, 09:40', go: 'Review proof', href: '11-Proof' },
  { id: 2, ic: 'card', unread: true, t: 'Balance due after you approve', d: 'SAR 152 remains. Nothing is charged until you approve the proof.', when: 'Today, 09:41', go: 'See balance', href: '12-Balance' },
  { id: 3, ic: 'chat', unread: true, t: 'Rameen sent you a message', d: '“The jetty photo looks soft at full bleed. Want to use the sunset one instead?”', when: 'Yesterday, 17:12', go: 'Open messages', href: '22-Messages' },
  { id: 4, ic: 'shield', unread: false, t: '85 photos added safely', d: 'Your photos were saved privately, and the location data was removed from every copy.', when: 'Mon 12 Oct', go: 'See how', href: '121-PrivateUpload' },
  { id: 5, ic: 'truck', unread: false, t: 'Order confirmed', d: 'Deposit received. Your designer has been assigned.', when: 'Mon 14 Sep', go: 'Order details', href: '10-Order' }
];
const PREFS = [
  ['Proof ready', 'The moment a proof is waiting for you.', [1, 1, 0]], ['Balance and payments', 'Reminders and receipts.', [1, 1, 0]], ['Shipping updates', 'Printed, shipped, delivered.', [1, 0, 1]],
  ['Messages from your designer', 'When Rameen writes to you.', [1, 0, 0]], ['Offers and news', 'Sample prices, new covers, gift ideas. Off unless you turn it on.', [0, 0, 0]]
];
const CH = ['WhatsApp', 'Email', 'SMS'];

const notifications = (E) => `<div class="dp-grid dp-wide">
<section class="ed-panel nt-list"><div class="dp-top"><div><h2 class="dp-h2">Latest</h2><p class="ed-muted">3 new since you last looked.</p></div>
<div class="ed-seg nt-filter" role="radiogroup" aria-label="Show"><input type="radio" name="nt-f" id="nt-all" checked><label for="nt-all">All</label><input type="radio" name="nt-f" id="nt-un"><label for="nt-un">New</label></div></div>
<ul class="nt-items">${NOTES.map((n) => `<li class="nt-item${n.unread ? ' is-new' : ''}"><span class="nt-ic">${ic(ICON[n.ic], 20)}</span><div class="nt-tx"><b>${n.t}${n.unread ? ' <span class="nt-dot" role="img" aria-label="New"></span>' : ''}</b><p>${n.d}</p><small>${n.when}</small></div><a class="ed-btn sm" href="${E}${n.href}.dc.html">${n.go}</a></li>`).join('')}</ul>
<p class="nt-empty ed-muted" hidden>Nothing new. We will tell you the moment something needs you.</p></section>
<section class="ed-panel"><h2 class="dp-h2">How you hear from us</h2><p class="ed-muted">Pick a way for each kind of update. Offers start switched off.</p>
<div class="nt-prefs" role="group" aria-label="Notification channels"><div class="nt-ph" aria-hidden="true"><span></span>${CH.map((c) => `<b>${c}</b>`).join('')}</div>
${PREFS.map((p, i) => `<div class="nt-pr"><div><b>${p[0]}</b><p class="ed-muted">${p[1]}</p></div>${CH.map((c, j) => `<label class="nt-ck"><input type="checkbox"${p[2][j] ? ' checked' : ''} aria-label="${p[0]} by ${c}"><span aria-hidden="true">${ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 16)}</span></label>`).join('')}</div>`).join('')}</div>
<div class="dp-row nt-quiet"><div><b>Quiet hours</b><p class="ed-muted">No WhatsApp or SMS between these times. Proofs wait for morning.</p></div><label class="nt-sel"><span class="ed-vh">Quiet hours</span><select><option>22:00 to 08:00</option><option>23:00 to 07:00</option><option>Off</option></select></label></div>
<div class="ew-actions"><button type="button" class="ed-btn pri" data-toast="Preferences saved" data-toast-kind="good">Save my choices</button></div></section></div>`;

const emails = () => `<section class="ed-panel em-wrap"><div class="dp-top"><div><h2 class="dp-h2">What lands in your inbox</h2><p class="ed-muted">One email per step. No attachments, no surprises, one clear button.</p></div>
<div class="em-test"><button type="button" class="ed-btn" data-toast="A test email would go to sara@example.com (design preview)">${ic(ICON.send)}<span>Send me a test</span></button></div></div>
<div class="em-tabs">${EMAILS.map((e, i) => `<input type="radio" name="em" id="em-${e.key}"${i === 0 ? ' checked' : ''}><label for="em-${e.key}" class="em-tab">${e.tab}</label>`).join('')}
${EMAILS.map((e) => `<div class="em-pane" data-em="${e.key}"><p class="em-subj"><span>Subject</span><b>${fill(e.subject, SAMPLE)}</b></p>
<iframe class="em-frame" title="Preview of the ${e.tab.toLowerCase()} email" src="/emails/preview/${e.key}.html" loading="lazy"></iframe>
<p class="ed-muted em-files">For the studio: <a href="/emails/${e.key}.html">HTML template</a> · <a href="/emails/${e.key}.txt">plain-text version</a>. Placeholders look like <code>&#123;&#123;order_no&#125;&#125;</code>.</p></div>`).join('')}</div></section>`;

const kit = () => `<div class="dp-grid">
<div class="dp-col">
<section class="ed-panel"><h2 class="dp-h2">Tooltips</h2><p class="ed-muted">Hover or tab to an icon button to see its name. Touch screens use the button’s label for screen readers.</p>
<div class="kit-row"><button type="button" class="ed-btn sq" aria-label="Undo" data-tip="Undo">${ic('<path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"/>', 20)}</button><button type="button" class="ed-btn sq" aria-label="Delete" data-tip="Delete" data-tip-pos="bottom">${ic(ICON.trash, 20)}</button><button type="button" class="ed-btn sq" aria-label="Send" data-tip="Send to your designer">${ic(ICON.send, 20)}</button></div></section>
<section class="ed-panel"><h2 class="dp-h2">Loading placeholders</h2><p class="ed-muted">Quiet shapes the same size as what is coming, so the page does not jump.</p>
<div class="kit-sk" aria-busy="true" aria-label="Loading a book card"><span class="sk sk-photo"></span><div><span class="sk sk-title"></span><span class="sk sk-line"></span><span class="sk sk-line kit-short"></span></div></div></section>
<section class="ed-panel"><h2 class="dp-h2">Progress</h2><p class="ed-muted">Photos added</p>
<div class="pg" role="progressbar" aria-label="Photos added" aria-valuemin="0" aria-valuemax="100" aria-valuenow="72"><i class="kit-v72"></i></div><p class="ed-muted kit-cap">72 of 100 photos</p></section></div>
<div class="dp-col">
<section class="ed-panel"><h2 class="dp-h2">Ask before it cannot be undone</h2><p class="ed-muted">Anything that deletes or turns something off asks first. The safe answer is focused.</p>
<div class="kit-row"><button type="button" class="ed-btn" data-confirm="Delete this draft?" data-confirm-body="You can not get it back." data-confirm-label="Yes, delete" data-danger>${ic(ICON.trash)}<span>Delete a draft</span></button><button type="button" class="ed-btn" data-confirm="Send the proof to Rameen?" data-confirm-body="She will see your comments straight away.">${ic(ICON.send)}<span>Send a proof</span></button></div></section>
<section class="ed-panel"><h2 class="dp-h2">Messages</h2><p class="ed-muted">They appear above the tab bar, say it once, and leave on their own after a few seconds. Errors stay a little longer.</p>
<div class="kit-row"><button type="button" class="ed-btn" data-toast="Saved to your account" data-toast-kind="good">Success</button><button type="button" class="ed-btn" data-toast="That photo is too small to print well" data-toast-kind="bad">Problem</button><button type="button" class="ed-btn" data-toast="Your cart was updated">Plain</button></div></section>
<section class="ed-panel"><h2 class="dp-h2">Empty states</h2><div class="kit-empty">${ic(ICON.mail, 28)}<b>No messages yet</b><p class="ed-muted">When Rameen writes to you, it shows up here.</p><a class="ed-btn sm" href="#main">Say hello</a></div></section></div></div>`;

/* ---- site map: every page, grouped; titles are read from the pages themselves ---- */
const titleOf = (n) => { const f = readdirSync(PUB).find((x) => new RegExp(`^G${n}-.*\\.dc\\.html$`).test(x)); if (!f) return null; const m = rd(f).match(/<title>([\s\S]*?)<\/title>/); return m ? m[1].replace(/\s*·\s*Miles Retold\s*$/, '').replace(/^Studio\s*·\s*/, '').replace(/^Light\s*·\s*/, '').trim() : f; };
const fileOf = (ed, n) => { const f = readdirSync(PUB).find((x) => new RegExp(`^G${n}-.*\\.dc\\.html$`).test(x)); return f ? ed + f.slice(1) : null; };
const MAP = [
  ['Shop', 'The storefront: what a visitor sees before and while ordering.', [1, 2, 3, 4, 5, 6, 8, 15, 16, 17, 18, 19]],
  ['My account', 'What a customer sees once they have an order.', [9, 10, 143, 145, 7, 11, 12, 13, 22, 24, 77, 14]],
  ['Live editor and photos', 'One editor and one photo gallery for the customer and the studio.', [['/book/editor.html?as=customer', 'Live editor (customer)'], ['/book/editor.html?as=customer&view=gallery', 'Photo gallery: what we hold, what was deleted, delete photos'], ['/book/editor.html?as=studio', 'Live editor (studio view)'], ['/book/editor.html?as=studio&view=gallery', 'Customer photo gallery (studio view, read-only)']]],
  ['Messages and settings', 'Updates, emails and the shared interface pieces.', [137, 138, 139]],
  ['Privacy and extras', 'Privacy, security and the editor extras (design previews).', [120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131]],
  ['Classic editor, customer', 'The first editor and its workspace pages, kept for reference.', [23, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 100, 101, 102, 103, 104]],
  ['Studio: orders', 'The pipeline and each stage.', [30, 31, 32, 33, 34, 35, 36, 37, 38, 40, 43, 44, 47]],
  ['Studio: calendar and customers', 'Planning, the inbox and the people.', [49, 50, 51, 52, 41, 45, 55, 56]],
  ['Studio: money and insights', 'Payments, invoices and how the studio is doing.', [42, 76, 78, 79, 54, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69]],
  ['Studio: team and settings', 'Who can do what, and the studio settings.', [46, 48, 53, 71, 72, 73, 74, 75]],
  ['Studio: catalog and pricing', 'Sizes, page counts, layouts and the price formula the live editor reads.', [150, 151, 152, 153]],
  ['Studio: privacy and data', 'Who can open customer photos, retention and compliance (design previews).', [132, 133, 134, 135, 136]],
  ['Classic editor, studio', 'The studio workspace pages of the first editor.', [70, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 110, 111, 112, 113, 114]],
  ['Design references', 'Rules, states and the phone preview.', [0, 20, 21]]
];
const sitemap = (E) => {
  const seen = new Set(); let count = 0;
  const groups = MAP.map(([name, lead, items]) => {
    const lis = items.map((it) => {
      if (Array.isArray(it)) { count++; return `<li><a href="${it[0]}">${it[1]}</a></li>`; }
      const f = fileOf(E, it); if (!f) return ''; seen.add(it); count++;
      return `<li><a href="${f}"${it === 23 || it === 70 ? " data-keep" : ""}>${titleOf(it)}</a></li>`;
    }).join('');
    return `<section class="ed-panel sm-g"><h2 class="dp-h2">${name}</h2><p class="ed-muted">${lead}</p><ul class="sm">${lis}</ul></section>`;
  });
  /* anything not listed above still gets a link, so no page is ever left out */
  const rest = readdirSync(PUB).filter((x) => /^G\d+-.*\.dc\.html$/.test(x)).map((x) => +x.match(/^G(\d+)-/)[1]).filter((n) => !seen.has(n) && n !== 140).sort((a, b) => a - b);
  if (rest.length) groups.push(`<section class="ed-panel sm-g"><h2 class="dp-h2">More</h2><p class="ed-muted">Pages added since this list was written.</p><ul class="sm">${rest.map((n) => `<li><a href="${fileOf(E, n)}">${titleOf(n)}</a></li>`).join('')}</ul></section>`);
  return `<label class="fld sm-f"><span>Find a page</span><input id="sm-q" type="search" placeholder="Type to filter, for example proof, gallery or invoices" autocomplete="off"></label><p class="ed-muted" id="sm-n" aria-live="polite">${count} pages</p><div class="sm-grid">${groups.join('')}</div>`;
};

const ORDERS = [
  { no: 'MR-1042', t: 'Honeymoon · Maldives', s: 'Portrait 8 × 10 · 40 pages', d: 'Ordered 14 Sep 2026', st: 'Proof ready', cls: 'now', cur: true },
  { no: 'MR-0877', t: 'London · April 2024', s: 'Landscape 10 × 8 · 32 pages', d: 'Delivered 2 May 2024', st: 'Delivered', cls: 'ok' },
  { no: 'MR-0731', t: 'Paris · July 2023', s: 'Portrait 8 × 10 · 28 pages', d: 'Delivered 14 Aug 2023', st: 'Delivered', cls: 'ok' },
  { no: 'MR-0512', t: 'Our wedding', s: 'Square 10 × 10 · 48 pages', d: 'Delivered 20 Jan 2023', st: 'Delivered', cls: 'ok' }
];
const myBooks = (E) => `<section class="ed-panel oh"><div class="dp-top"><div><h2 class="dp-h2">Your books</h2><p class="ed-muted">Every book you have ordered, newest first. Open one to see its details and order more copies.</p></div><a class="ed-btn pri" href="${E}3-Builder.dc.html">Start a new book</a></div>
<ul class="oh-list">${ORDERS.map((o) => `<li class="oh-i"><div class="oh-m"><b>${o.t}</b><p>${o.no} · ${o.s}</p><small>${o.d}</small></div><span class="oh-st ${o.cls}">${o.st}</span>
<div class="oh-act"><a class="ed-btn sm pri" href="${E}145-BookDetail.dc.html?o=${o.no}">Open</a></div></li>`).join('')}</ul></section>`;

const bookDetail = (E) => `<div class="dp-grid dp-wide"><section class="ed-panel bd" id="bd-root" data-e="${E}"><p class="ed-muted">Loading your book…</p></section></div>`;

const PAGES = [
  { n: 137, file: 'Notifications', title: 'Notifications', kicker: 'Messages', lead: 'Everything we tell you about your book in one place, and how you want to hear it.', body: notifications },
  { n: 138, file: 'EmailPreviews', title: 'Emails we send you', kicker: 'Messages', lead: 'What lands in your inbox at each step, in plain words. Each one is a real template the studio can send.', body: emails },
  { n: 143, file: 'OrderHistory', title: 'My books', kicker: 'Orders', lead: 'Your current book and every book you have ordered before.', body: myBooks },
  { n: 145, file: 'BookDetail', title: 'Book details', kicker: 'My books', lead: 'The details of one book, its invoice, and a way to order more copies.', body: bookDetail },
  { n: 140, file: 'SiteMap', title: 'All pages', kicker: 'Settings', lead: 'Every page in one place, grouped by who uses it. Light and dark follow the theme you chose.', body: sitemap },
  { n: 139, file: 'UiKit', title: 'Interface kit', kicker: 'Settings', lead: 'The small pieces every page shares: tooltips, loading placeholders, progress, confirmations and messages. Try each one.', body: kit }
];

function assemble(edition, pg) {
  const D = edition === 'G', base = rd(`${edition}120-Privacy.dc.html`);
  const mIdx = base.indexOf('<main id="main"'), eIdx = base.indexOf('</main>'), sIdx = base.indexOf('<script type="text/x-dc"');
  let top = base.slice(0, mIdx), tail = base.slice(eIdx, sIdx), script = base.slice(sIdx);
  top = top.replace(/<title>[\s\S]*?<\/title>/, `<title>${D ? '' : 'Light · '}${pg.title} · Miles Retold</title>`);
  const twin = `${D ? 'GL' : 'G'}${pg.n}-${pg.file}.dc.html`;
  top = top.replace(/(<a class="thm" href=")[^"]*(")/, `$1${twin}$2`);
  top = top.replace(/<div class="subnav-top subnav-23">[\s\S]*?<\/nav><\/div>/, '');
  if (!top.includes('/css/library-pages.css')) top = top.replace('</head>', '<link rel="stylesheet" href="/css/library-pages.css">\n</head>');
  if (pg.n === 140 && !top.includes('/sitemap.js')) top = top.replace('</head>', '<script src="/sitemap.js" defer></script>\n</head>');
  if (pg.n === 145 && !top.includes('/reorder.js')) top = top.replace('</head>', '<script src="/reorder.js" defer></script>\n</head>');
  script = script.replace(/MilesDesign\.create\('privacy', this, \{[^}]*\}\)/, "MilesDesign.create('static', this, {})");
  const banner = `<p class="dp-banner" role="note"><b>Design preview</b><span>Nothing on this page is saved or sent yet. It shows how the feature could look and feel.</span></p>`;
  const main = `<main id="main" class="{{edCls}} dpm">\n<div class="dp">\n${banner}\n<header class="dp-head"><p class="ed-kicker">${pg.kicker}</p><h1 class="dp-h1">${pg.title}</h1><p class="dp-lead">${pg.lead}</p></header>\n${pg.body(edition)}\n</div>\n`;
  return top + main + tail + script;
}
for (const pg of PAGES) for (const ed of ['G', 'GL']) wr(`${ed}${pg.n}-${pg.file}.dc.html`, assemble(ed, pg));
console.log(`built ${EMAILS.length} email templates (+ text + previews) and ${PAGES.length * 2} pages`);
