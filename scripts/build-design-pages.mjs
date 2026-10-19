#!/usr/bin/env node
/* Builds the design-only pages: privacy and security for the customer, editor extras (smart help, approvals, Arabic captions,
 * trip map, shortcuts), and the studio's photo access, access log, retention, privacy checklist and print-ready export.
 *
 *   customer   G120-G126 / GL120-GL126  Privacy & security   (linked from the account sub-navigation: "Privacy")
 *              G127-G131 / GL127-GL131  Editor extras        (linked from the "Extras" tab of the live editor)
 *   studio     G132-G136 / GL132-GL136  Privacy & data       (linked from the studio menu and the editor's "Privacy & data" tab)
 *
 * Every page says "Design preview: nothing here is saved or enforced". They show a client how a feature could look; none of
 * it protects anything yet (see the README). Page behaviour is demo state only: public/editor/design.js. Styles: css/design-pages.css.
 *
 *   node scripts/build-design-pages.mjs      (idempotent; also adds the navigation links to the pages that point here) */
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const PUB = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const rd = (f) => fs.readFileSync(path.join(PUB, f), 'utf8');
const wr = (f, s) => fs.writeFileSync(path.join(PUB, f), s);

/* ---------- the pages ---------- */
const P = [
  // key, number, file suffix, side, group, nav label, kicker, title, lead
  ['privacy', 120, 'Privacy', 'customer', 'privacy', 'Overview', 'Privacy & security', 'Your photos are yours', 'What we do to keep your photos private, in plain words, and where you can change it.'],
  ['upload', 121, 'PrivateUpload', 'customer', 'privacy', 'Protected upload', 'Privacy & security', 'Adding photos safely', 'See what happens to a photo the moment you add it.'],
  ['share', 122, 'ShareLinks', 'customer', 'privacy', 'Sharing', 'Privacy & security', 'Share a proof', 'Show your book to someone you trust. Every link expires, and you can turn it off.'],
  ['consent', 123, 'Consent', 'customer', 'privacy', 'Your choices', 'Privacy & security', 'What we may do', 'Everything beyond printing your book is your choice, and the answer starts at no.'],
  ['del', 124, 'DeleteData', 'customer', 'privacy', 'Delete data', 'Privacy & security', 'Keep or delete your photos', 'Choose how long we keep your files, take a copy, or delete everything.'],
  ['views', 125, 'AccessLog', 'customer', 'privacy', 'Who has looked', 'Privacy & security', 'Who has looked at your book', 'A plain list of every time your photos or pages were opened.'],
  ['security', 126, 'Security', 'customer', 'privacy', 'Sign-in & devices', 'Privacy & security', 'Sign-in and devices', 'Where you are signed in, and how your code keeps strangers out.'],
  ['smart', 127, 'SmartAssist', 'customer', 'extras', 'Smart help', 'Editor extras', 'Smart help, on your device', 'Suggestions that never send your photos anywhere.'],
  ['approvals', 128, 'Approvals', 'customer', 'extras', 'Approvals', 'Editor extras', 'Pin a comment, approve a spread', 'Point at the exact photo, and approve the book one spread at a time.'],
  ['arabic', 129, 'ArabicText', 'customer', 'extras', 'Arabic captions', 'Editor extras', 'Arabic and two-language captions', 'Write in Arabic, English or both, with dates the way you say them.'],
  ['tripmap', 130, 'TripMap', 'customer', 'extras', 'Trip map', 'Editor extras', 'A map of your trip', 'A route page for the front of the book, drawn from the places you choose.'],
  ['shortcuts', 131, 'Shortcuts', 'customer', 'extras', 'Shortcuts & access', 'Editor extras', 'Keyboard and accessibility', 'Everything you can do with a mouse, you can do without one.'],
  ['photoaccess', 132, 'PhotoAccess', 'studio', 'studio', 'Photo access', 'Privacy & data', 'Who can open customer photos', 'Give each role only what it needs. Everything else stays closed.'],
  ['audit', 133, 'AuditLog', 'studio', 'studio', 'Access log', 'Privacy & data', 'Access log', 'Every open, download and export of a customer photo, with who and where.'],
  ['retention', 134, 'Retention', 'studio', 'studio', 'Retention', 'Privacy & data', 'Retention and deletion', 'When originals are deleted, and the requests customers have made.'],
  ['compliance', 135, 'Compliance', 'studio', 'studio', 'Privacy checklist', 'Privacy & data', 'Privacy checklist', 'The controls this studio promises, where each one stands, and what to ask a lawyer.'],
  ['export', 136, 'PrintExport', 'studio', 'studio', 'Print export', 'Privacy & data', 'Print-ready export', 'Make the files for the printer, and send them without sending the originals.']
];
const file = (edition, key) => { const p = P.find((q) => q[0] === key); return `${edition}${p[1]}-${p[2]}.dc.html`; };
const GROUPS = { privacy: ['Privacy', 'Privacy and security'], extras: ['Extras', 'Editor extras'], studio: ['Privacy & data', 'Privacy and data'] };

/* ---------- small helpers (same idea as build-editor-pages.mjs) ---------- */
const ICON = {
  tick: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', cross: '<path d="M6 6l12 12M18 6L6 18"/>', lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>', link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>',
  next: '<path d="M5 12h14M13 6l6 6-6 6"/>', plus: '<path d="M12 5v14M5 12h14"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
  up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>',
  pin: '<path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>', flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>', wand: '<path d="M4 20L15 9M14 4v3M19 9h-3M18 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>', key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>'
};
const ic = (n, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;
const IF = (v, body, hint = true) => `<sc-if value="{{${v}}}" hint-placeholder-val="{{ ${hint} }}">${body}</sc-if>`;
const FOR = (list, as, body, n = 3) => `<sc-for list="{{${list}}}" as="${as}" hint-placeholder-count="${n}">${body}</sc-for>`;
const seg = (aria, list) => `<div class="ed-seg" role="group" aria-label="${aria}">${FOR(list, 'o', '<button onClick="{{o.pick}}" aria-pressed="{{o.on}}">{{o.label}}</button>', 3)}</div>`;
const panel = (h, body, cls = '') => `<section class="ed-panel ${cls}">${h ? `<h2>${h}</h2>` : ''}${body}</section>`;
const toggle = (on, flip, label) => `<button class="ew-sw2" onClick="{{${flip}}}" aria-pressed="{{${on}}}" aria-label="${label}"></button>`;
const note = (cls, t) => `<p class="ew-note ${cls}">${t}</p>`;
const btn = (label, on, { icon = '', cls = '', dis = '' } = {}) => `<button class="ed-btn ${cls}" onClick="{{${on}}}"${dis ? ` disabled="{{${dis}}}"` : ''}>${icon ? ic(icon, 18) : ''}<span>${label}</span></button>`;
const mark = (okVar, badVar) => `${IF(okVar, ic('tick', 18))}${IF(badVar, ic('cross', 18), false)}`;

/* ---------- page bodies ---------- */
const BODY = {};
BODY.privacy = () => `<div class="dp-grid">
${panel('', `<div class="dp-top"><div><h2 class="dp-h2">Right now, for this book</h2><p class="ed-muted">Six promises, and whether each one holds.</p></div>${btn('{{pvRunLabel}}', 'pvRun', { icon: 'shield', dis: 'pvBusy' })}</div><ul class="dp-checks">${FOR('pvChecks', 'c', `<li class="{{c.cls}}"><i>${IF('c.done', ic('tick', 16))}${IF('c.wait', '<u class="dp-spin"></u>', false)}</i><div><b>{{c.t}}</b><p>{{c.d}}</p></div></li>`, 6)}</ul>`)}
${panel('Who can open this book', `<ul class="dp-people">${FOR('pvPeople', 'p', '<li><span class="dp-av">{{p.av}}</span><div><b>{{p.n}}</b><small>{{p.r}}</small><p>{{p.d}}</p></div></li>', 3)}</ul>`)}
</div>
<h2 class="dp-h2 dp-mt">Manage it</h2><div class="dp-cards">${FOR('pvCards', 'c', `<a class="dp-card" href="{{c.href}}"><b>{{c.t}}</b><span>{{c.d}}</span>${ic('next', 20)}</a>`, 6)}</div>`;

BODY.upload = () => `<div class="dp-grid">
<div class="dp-col">
${panel('', `<div class="dp-row"><div><b>Remove where my photos were taken</b><p class="ed-muted">Recommended. A photo can carry the exact place it was taken. We take that out before storing it, and keep the date so your book stays in order.</p></div>${toggle('upStrip', 'upToggle', 'Remove location from my photos')}</div>${IF('upStripOff', note('is-bad', 'Location stays in your photos. Anyone who opens the file could see where you were.'), false)}`)}
${panel('Your photos', `<div class="dp-drop"><span>${ic('plus', 24)}</span><div><b>Drop photos here</b><p class="ed-muted">or choose them from your phone or computer. In this preview the button below adds three examples.</p></div>${btn('{{upAddLabel}}', 'upAdd', { icon: 'plus', cls: 'pri', dis: 'upBusy' })}</div><p class="ed-muted" aria-live="polite">{{upCount}}</p>
<ul class="dp-files">${FOR('upFiles', 'f', `<li class="dp-file"><img src="{{f.src}}" alt=""><div class="dp-fb"><b>{{f.name}}</b><span class="dp-state">{{f.stage}}</span>${IF('f.work', `<div class="dp-steps">${FOR('f.steps', 's', '<i class="{{s.cls}}">{{s.n}}</i>', 3)}</div><div class="ew-bar-up" aria-hidden="true"><i style="{{f.bar}}"></i></div>`, false)}${IF('f.ready', `<span class="dp-ok">${ic('lock', 14)} {{f.note}}</span>`, false)}</div></li>`, 3)}</ul>`)}
</div>
<div class="dp-col">${panel('What is in a photo', `<p class="ed-muted">The same picture, before and after.</p><div class="dp-meta"><div><h3>As it comes from your phone</h3><dl>${FOR('upBeforeRows', 'r', '<div class="dp-m {{r.cls}}"><dt>{{r.k}}</dt><dd>{{r.v}}</dd></div>', 4)}</dl></div><div><h3>As we keep it</h3><dl>${FOR('upAfter', 'r', '<div class="dp-m {{r.cls}}"><dt>{{r.k}}</dt><dd>{{r.v}}</dd></div>', 4)}</dl></div></div>`)}
${panel('How it is kept', `<ul class="dp-plain"><li>Stored privately. There is no public address for your photos.</li><li>Opened only through links that stop working after a few minutes.</li><li>Your original is kept for printing. The editor works from smaller copies.</li></ul>`)}</div></div>`;

BODY.share = () => `<div class="dp-grid">
${panel('New link', `<p class="ew-mini-h">Who can open it</p>${seg('Who can open it', 'shWho')}<p class="ew-mini-h dp-mt">How long it works</p>${seg('How long it works', 'shExp')}<p class="ew-mini-h dp-mt">What they see</p>${seg('What they see', 'shQual')}<div class="dp-row dp-mt"><div><b>Let them leave comments</b><p class="ed-muted">They can pin a comment on a photo. They cannot change your book.</p></div>${toggle('shCm', 'shCmToggle', 'Let them leave comments')}</div>${IF('shWarn', '<p class="ew-note is-bad dp-mt">{{shWarnText}}</p>', false)}<div class="ew-actions dp-mt">${btn('Create link', 'shCreate', { icon: 'link', cls: 'pri' })}</div>`)}
${panel('Your links', `<p class="ed-muted">{{shActive}} working now. Turning a link off stops it straight away.</p><ul class="dp-links">${FOR('shLinks', 'l', `<li class="{{l.cls}}"><div><b>{{l.to}}</b><code>{{l.url}}</code><small>{{l.who}} · {{l.qual}}</small><small>{{l.exp}} · {{l.views}}</small></div><div class="ew-actions">${IF('l.live', `<button class="ed-btn sm" onClick="{{l.copy}}">Copy</button><button class="ed-btn sm" onClick="{{l.revoke}}" data-confirm="Turn this link off?" data-confirm-body="Anyone who has it will lose access straight away." data-confirm-label="Turn off" data-danger>Turn off</button>`, false)}${IF('l.dead', '<span class="ed-chip"><i></i>Off</span>', false)}</div></li>`, 2)}</ul>`)}
</div>`;

BODY.consent = () => `${panel('', `<div class="dp-top"><div><h2 class="dp-h2">{{cnOnN}} of {{cnTotal}} switched on</h2><p class="ed-muted">Each choice is separate. You can change any of them at any time, and nothing is switched on for you.</p></div><button class="ed-btn" onClick="{{cnAllOff}}">Turn off everything optional</button></div>`)}
<ul class="dp-consent">${FOR('cnRows', 'r', `<li class="ed-panel"><div class="dp-row"><div><b>{{r.t}}</b><p class="ed-muted">{{r.d}}</p><small class="dp-when">{{r.when}}</small></div>${IF('r.free', '<button class="ew-sw2" onClick="{{r.flip}}" aria-pressed="{{r.on}}" aria-label="{{r.label}}"></button>', false)}${IF('r.locked', `<span class="ed-chip">${ic('lock', 14)}Needed</span>`, false)}</div></li>`, 6)}</ul>`;

BODY.del = () => `<div class="dp-grid">
<div class="dp-col">
${panel('How long we keep your originals', `<p class="ed-muted">After your book is delivered, we delete your original photos. You choose when.</p>${seg('Keep originals for', 'dlOpts')}<ol class="dp-timeline">${FOR('dlSteps', 's', '<li class="{{s.cls}}"><b>{{s.t}}</b><p>{{s.d}}</p></li>', 4)}</ol>`)}
${panel('Take a copy first', `<p class="ed-muted">All your photos and the finished book, in one download.</p>${IF('dlZipIdle', btn('Prepare my download', 'dlExport', { icon: 'download' }), false)}${IF('dlZip', '<div class="ew-bar-up" aria-hidden="true"><i style="{{dlZipBar}}"></i></div><p class="ed-muted">Preparing…</p>', false)}${IF('dlZipReady', btn('Download is ready', 'dlExport', { icon: 'tick', cls: 'pri' }), false)}`)}
</div>
<div class="dp-col">${panel('Delete everything now', `${IF('dlLive', `<p class="ed-muted">This removes your original photos and your book from our systems. It cannot be undone, and we cannot reprint the book afterwards.</p><ul class="dp-plain"><li>Your photos and captions are deleted.</li><li>Records of your payments stay, as the law asks of us.</li><li>If your book is already at the printer, that copy is still yours.</li></ul><div class="ew-actions dp-mt">${btn('Delete my photos', 'dlOpen', { icon: 'trash' })}</div>`)}${IF('dlGone', `${note('is-ok', 'Request received. Your files are being deleted, and we will message you on WhatsApp when it is done.')}<div class="ew-actions dp-mt">${btn('Undo this preview', 'dlUndo')}</div>`, false)}`, 'dp-danger')}</div></div>
${IF('dlAsk', `<div class="dp-modal-bg" onClick="{{dlCancel}}"></div><div class="dp-modal" role="dialog" aria-modal="true" aria-label="Delete my photos"><h2>Delete all your photos?</h2><p class="ed-muted">Type <b>DELETE</b> to confirm.</p><div class="ed-field"><label class="ed-vh" for="dl-type">Type DELETE</label><input id="dl-type" type="text" autocomplete="off" value="{{dlTyped}}" onInput="{{dlOnType}}"></div><div class="ew-actions">${btn('Cancel', 'dlCancel')}${btn('Delete everything', 'dlDelete', { icon: 'trash', cls: 'pri', dis: 'dlNoDelete' })}</div></div>`, false)}`;

BODY.views = () => `<div class="dp-grid">
<div class="dp-col">${panel('', `<div class="ed-seg" role="group" aria-label="Show">${FOR('vwFilters', 'o', '<button onClick="{{o.pick}}" aria-pressed="{{o.on}}">{{o.label}}<span class="ew-n">{{o.n}}</span></button>', 5)}</div><ul class="dp-events">${FOR('vwRows', 'e', '<li class="{{e.cls}}"><i aria-hidden="true"></i><div><b>{{e.who}}</b> {{e.what}}<small>{{e.when}} · {{e.where}}</small></div></li>', 5)}</ul>${IF('vwNone', '<div class="ew-empty">Nothing here.</div>', false)}`)}</div>
<div class="dp-col">${panel('This week', `<ul class="dp-stats">${FOR('vwSummary', 's', '<li><b>{{s.v}}</b><span>{{s.k}}</span></li>', 3)}</ul>`)}${panel('Something look wrong?', `<p class="ed-muted">If you see a visit you do not recognise, turn off your share links, sign out of other devices, and tell us.</p><div class="ew-actions"><button class="ed-btn">${ic('flag', 18)}<span>Report a problem</span></button></div>`)}</div></div>`;

BODY.security = () => `<div class="dp-grid">
<div class="dp-col">${panel('Where you are signed in', `<ul class="dp-dev">${FOR('scDevs', 'd', `<li><div><b>{{d.n}}</b><small>{{d.w}}</small></div>${IF('d.now', '<span class="ed-chip is-ok"><i></i>This device</span>', false)}${IF('d.other', '<button class="ed-btn sm" onClick="{{d.out}}">Sign out</button>', false)}</li>`, 3)}</ul>${IF('scOthers', `<div class="ew-actions dp-mt">${btn('Sign out everywhere else', 'scOutAll')}</div>`, false)}`)}
${panel('', `<div class="dp-row"><div><b>Tell me when a new device signs in</b><p class="ed-muted">A WhatsApp message, so you know straight away.</p></div>${toggle('scAlerts', 'scAlertsToggle', 'Tell me when a new device signs in')}</div>`)}</div>
<div class="dp-col">${panel('How your code works', `<ul class="dp-plain dp-rules">${FOR('scRules', 'r', `<li><b>{{r.t}}</b><span>{{r.d}}</span></li>`, 4)}</ul>`)}
${panel('Try it', `<p class="ed-muted">Press the button to type a wrong code.</p><div class="dp-code">${FOR('scDots', 'd', '<i class="{{d.cls}}"></i>', 3)}<span>{{scTriesLabel}}</span></div>${IF('scOpen', `<div class="ew-actions">${btn('Type a wrong code', 'scTry')}</div>`, false)}${IF('scLocked', `${note('is-bad', 'Too many wrong codes. Wait 10 minutes, then ask for a new code on WhatsApp.')}<div class="ew-actions dp-mt">${btn('Start again', 'scReset')}</div>`, false)}`)}</div></div>`;

BODY.smart = () => `${panel('', `<div class="dp-row"><div><b>Use smart help</b><p class="ed-muted">It runs inside your browser, on your phone or laptop. Your photos are not sent to us, or to anyone else, for this.</p></div>${toggle('smOn', 'smToggle', 'Use smart help')}</div>`)}
<div class="dp-smart">
${panel('Chapters by day', `<p class="ed-muted">We read the date each photo was taken and group them. You rename and move them.</p><div class="dp-days">${FOR('smDays', 'd', `<div class="dp-day"><div class="dp-dh"><b>{{d.day}}</b><span>{{d.name}} · {{d.n}}</span></div><div class="dp-strip">${FOR('d.thumbs', 't', '<img src="{{t.src}}" alt="">', 4)}</div></div>`, 4)}</div><div class="ew-actions dp-mt">${IF('smNotMade', btn('Make these chapters', 'smMake', { icon: 'wand', cls: 'pri' }), false)}${IF('smMade', `<span class="ed-chip is-ok"><i></i>Chapters made</span>`, false)}</div>`)}
${panel('Tidy up', `<p class="ed-muted">Photos that are doubles, blurry or very dark. Nothing is deleted: they are set aside.</p><div class="dp-tidy">${FOR('smDup', 'd', '<figure class="{{d.cls}}"><img src="{{d.src}}" alt=""><figcaption>{{d.t}}</figcaption></figure>', 4)}</div><div class="ew-actions dp-mt">${IF('smNotCleaned', btn('Set these aside', 'smClean', { icon: 'wand' }), false)}${IF('smCleaned', '<span class="ed-chip is-ok"><i></i>Set aside</span>', false)}</div>`)}
${panel('Keep faces in the frame', `<div class="dp-row"><div><p class="ed-muted">When a photo is cropped, keep the people in it.</p></div>${toggle('smFacesOn', 'smFacesToggle', 'Keep faces in the frame')}</div><div class="dp-crops"><figure><div class="dp-crop"><img src="{{smSrc}}" alt="" style="{{smCropA}}"></div><figcaption>Cropped to the middle</figcaption></figure><figure><div class="dp-crop">${IF('smFaces', '<img src="{{smSrc}}" alt="" style="{{smCropB}}">', false)}${IF('smNoFaces', '<img src="{{smSrc}}" alt="" style="{{smCropA}}">', false)}${IF('smFaces', '<i class="dp-face" aria-hidden="true"></i>', false)}</div><figcaption>With faces kept</figcaption></figure></div>`)}
${panel('Match the shape', `<p class="ed-muted">A tall photo in a wide frame loses its top and bottom. We suggest the frame that fits.</p><div class="dp-shape"><div class="fit"><i class="w"></i><span>Wide photo, wide frame</span></div><div class="crop"><i class="t"></i><span>Tall photo, wide frame: cropped</span></div></div>`)}
</div>`;

BODY.approvals = () => `${panel('', `<div class="dp-top"><div><h2 class="dp-h2">{{apProg}}</h2><div class="ed-prog" aria-hidden="true"><i style="{{apBar}}"></i></div></div>${IF('apAll', `${IF('apOpen', btn('Approve and lock the design', 'apLock', { icon: 'lock', cls: 'pri' }), false)}${IF('apLocked', '<span class="ed-chip is-ok"><i></i>Locked</span>', false)}`, false)}${IF('apNotAll', '<span class="ed-muted">{{apLeft}} to go</span>', false)}</div>`)}
<div class="dp-grid dp-ap-grid"><div class="dp-col"><div class="dp-aps">${FOR('apCards', 'c', `<button class="{{c.cls}}" onClick="{{c.pick}}" aria-pressed="{{c.on}}" aria-label="{{c.aria}}"><img src="{{c.src}}" alt=""><b>{{c.n}}</b><span>{{c.label}}</span></button>`, 6)}</div></div>
<div class="dp-col">${panel('Spread {{apSel}}', `<span class="{{apStatusCls}}">{{apStatus}}</span><div class="dp-pinbox"><img src="{{apSrc}}" alt="Spread {{apSel}}">${FOR('apPins', 'p', '<i class="dp-pin" style="{{p.pos}}" aria-label="{{p.label}}">{{p.n}}</i>', 1)}</div><ul class="dp-thread">${FOR('apThread', 't', '<li class="dp-msg"><b>{{t.who}}</b> <span class="dp-no">{{t.n}}</span><p>{{t.t}}</p></li>', 2)}</ul>${IF('apNoThread', '<p class="ed-muted">No comments on this spread.</p>', false)}<div class="ed-field"><label for="ap-new">Pin a comment</label><textarea id="ap-new" placeholder="What should change here?" value="{{apDraft}}" onInput="{{apOnDraft}}"></textarea></div><div class="ew-actions">${btn('Pin comment', 'apAdd', { icon: 'pin' })}${btn('Ask for changes', 'apChange', { icon: 'flag' })}${btn('Approve this spread', 'apApprove', { icon: 'tick', cls: 'pri' })}</div>`)}</div></div>`;

BODY.arabic = () => `<div class="dp-grid">
<div class="dp-col">${panel('Language', `${seg('Caption language', 'arLang')}<p class="ew-mini-h dp-mt">Dates</p>${seg('Date style', 'arDate')}<p class="ew-mini-h dp-mt">Arabic type</p>${seg('Arabic font', 'arFont')}<p class="ew-mini-h dp-mt">Size</p>${seg('Caption size', 'arSize')}`)}
${panel('Caption', `<div class="ed-field"><label for="ar-en">English</label><input id="ar-en" type="text" dir="ltr" value="{{arEn}}" onInput="{{arOnEn}}"></div><div class="ed-field"><label for="ar-ar">العربية</label><input id="ar-ar" type="text" dir="rtl" lang="ar" value="{{arAr}}" onInput="{{arOnAr}}"></div>`)}</div>
<div class="dp-col">${panel('On the page', `<div class="{{arPageCls}}"><img src="/_blob/1bebe18032c3ba7f722debbe5fa70f36" alt=""><div class="dp-cap">${IF('arShowAr', '<p class="ar" lang="ar" dir="rtl">{{arAr}}</p><small class="ar" lang="ar" dir="rtl">{{arDateAr}}</small>')}${IF('arShowEn', '<p class="en" lang="en" dir="ltr">{{arEn}}</p><small lang="en" dir="ltr">{{arDateEn}}</small>')}</div></div>`)}
${panel('Good to know', `<ul class="dp-plain dp-rules">${FOR('arNotes', 'n', '<li><b>{{n.t}}</b><span>{{n.d}}</span></li>', 3)}</ul>`)}</div></div>`;

BODY.tripmap = () => `<div class="dp-grid">
<div class="dp-col">${panel('The page', `<div class="dp-map"><svg viewBox="0 0 100 64" role="img" aria-label="Route map">
<defs><pattern id="dpdots" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".25" fill="currentColor" opacity=".18"/></pattern></defs><rect width="100" height="64" fill="url(#dpdots)"/><path d="{{tmD}}" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-dasharray="{{tmDash}}"/>
${FOR('tmPts', 'p', '<circle cx="{{p.cx}}" cy="{{p.cy}}" r="2.2" fill="var(--e-acc)" stroke="var(--e-paper)" stroke-width=".8"/>', 4)}</svg>${FOR('tmPts', 'p', '<span class="dp-lbl" style="{{p.pos}}">{{p.n}}</span>', 4)}</div><div class="dp-days dp-mt">${FOR('tmDays', 'd', '<div class="dp-day"><div class="dp-dh"><b>{{d.d}}</b><span>{{d.p}}</span></div><p class="ed-muted">{{d.t}}</p></div>', 4)}</div>`)}</div>
<div class="dp-col">${panel('Your route · {{tmCount}}', `<ol class="dp-stops">${FOR('tmStops', 's', `<li><span class="dp-no">{{s.i}}</span><b>{{s.n}}</b><span class="dp-mv"><button class="ed-btn sm sq" onClick="{{s.up}}" disabled="{{s.noUp}}" aria-label="Move earlier">${ic('up', 16)}</button><button class="ed-btn sm sq" onClick="{{s.down}}" disabled="{{s.noDown}}" aria-label="Move later">${ic('down', 16)}</button><button class="ed-btn sm sq" onClick="{{s.del}}" aria-label="Remove">${ic('cross', 16)}</button></span></li>`, 4)}</ol><div class="dp-add"><div class="ed-field"><label class="ed-vh" for="tm-add">Add a place</label><input id="tm-add" type="text" placeholder="Add a place" value="{{tmName}}" onInput="{{tmOnName}}"></div>${btn('Add', 'tmAdd', { icon: 'plus' })}</div><p class="ew-mini-h dp-mt">Route style</p>${seg('Route style', 'tmStyle')}`)}
${panel('', `<div class="dp-row"><div><b>Use the places in my photos</b><p class="ed-muted">Works out the stops on your device. Exact coordinates are never saved, only the place names you confirm.</p></div>${toggle('tmGps', 'tmGpsToggle', 'Use the places in my photos')}</div>${IF('tmGpsOn', note('', 'Your photos are read on this device. Nothing about where they were taken is sent to us.'), false)}`)}</div></div>`;

BODY.shortcuts = () => `<div class="dp-grid">
<div class="dp-col">${panel('Keyboard', `<ul class="dp-keys">${FOR('shKeys', 'k', `<li><span class="dp-kk">${FOR('k.keys', 'c', '<kbd>{{c.c}}</kbd>', 2)}</span><span>{{k.t}}</span>${IF('k.live', '<em class="dp-live">Works now</em>', false)}${IF('k.soon', '<em class="dp-soon">Design only</em>', false)}</li>`, 6)}</ul>`)}
${panel('Make it easier to use', `${FOR('shOpts', 'o', `<div class="dp-row"><div><b>{{o.label}}</b><p class="ed-muted">{{o.d}}</p></div><button class="ew-sw2" onClick="{{o.flip}}" aria-pressed="{{o.on}}" aria-label="{{o.label}}"></button></div>`, 3)}<div class="{{shPrev}}"><b>Preview</b><p>This is how text and buttons look with your choices.</p><button class="ed-btn pri">A button</button></div>`)}</div>
<div class="dp-col">${panel('Describe your photos', `<p class="ed-muted">A short description helps people who use a screen reader, and it prints nowhere. {{shAltDone}} of {{shAltTotal}} done.</p><ul class="dp-alts">${FOR('shAlt', 'a', `<li><img src="{{a.src}}" alt=""><div class="ed-field"><label for="{{a.id}}">What is in this photo?</label><input id="{{a.id}}" type="text" value="{{a.v}}" onInput="{{a.onIn}}" placeholder="Describe it in a few words"><button class="ed-btn sm" onClick="{{a.auto}}">${ic('wand', 16)}<span>Suggest</span></button></div></li>`, 4)}</ul>`)}</div></div>`;

BODY.photoaccess = () => `<div class="dp-grid dp-wide">
<div class="dp-col">${panel('What each role can do', `<div class="dp-matrix" role="table" aria-label="Roles and what they can do with customer photos"><div class="dp-mh" role="row"><span role="columnheader">Role</span>${FOR('paActs', 'a', '<span role="columnheader">{{a.a}}</span>', 5)}</div>${FOR('paRows', 'r', `<div class="dp-mr" role="row"><b role="rowheader">{{r.r}}</b>${FOR('r.cells', 'c', `<button role="cell" class="dp-cell" onClick="{{c.flip}}" aria-pressed="{{c.on}}" aria-label="{{c.label}}"><i></i></button>`, 5)}</div>`, 4)}</div><p class="ed-muted dp-mt">Tap a square to allow or remove it. The default is closed.</p>`)}</div>
<div class="dp-col">${panel('Temporary access', `<p class="ed-muted">When someone needs more than their role allows, they ask, say why, and the owner approves. It ends by itself.</p><ul class="dp-grants">${FOR('paGrants', 'g', `<li><div><b>{{g.w}}</b><small>{{g.why}}</small><small>{{g.left}}</small></div>${IF('g.live', '<button class="ed-btn sm" onClick="{{g.end}}">End now</button>', false)}</li>`, 2)}</ul><div class="ew-actions dp-mt">${btn('Ask for access', 'paOpen', { icon: 'key' })}</div>`)}</div></div>
${IF('paReq', `<div class="dp-modal-bg" onClick="{{paClose}}"></div><div class="dp-modal" role="dialog" aria-modal="true" aria-label="Ask for access"><h2>Ask for access</h2><p class="ed-muted">The studio owner sees your reason and decides.</p><div class="ed-field"><label for="pa-why">Why do you need it?</label><textarea id="pa-why" placeholder="For example: colour-check order MR-1042 before printing" value="{{paReason}}" onInput="{{paOnReason}}"></textarea></div><div class="ew-actions">${btn('Cancel', 'paClose')}${btn('Send request', 'paSend', { icon: 'send', cls: 'pri', dis: 'paNoSend' })}</div></div>`, false)}`;

BODY.audit = () => `${IF('auFlag', `<section class="dp-alert" role="alert">${ic('flag', 22)}<div><b>Worth a look</b><p>Noor K. downloaded 41 original photos from order MR-1038 in four minutes.</p></div><button class="ed-btn sm" onClick="{{auDismiss}}">Mark as checked</button></section>`, false)}
${panel('', `<div class="dp-top">${seg('Who', 'auF')}<div class="ed-field dp-search"><label class="ed-vh" for="au-q">Search the log</label><input id="au-q" type="text" placeholder="Search by name, order or action" value="{{auQ}}" onInput="{{auOnQ}}"></div></div><p class="ed-muted" aria-live="polite">{{auN}}</p><ul class="dp-log">${FOR('auRows', 'r', '<li class="{{r.cls}}"><span class="dp-t">{{r.when}}</span><div><b>{{r.who}}</b> {{r.what}}<small>{{r.order}} · {{r.where}}</small></div></li>', 6)}</ul>${IF('auNone', '<div class="ew-empty">Nothing matches.</div>', false)}`)}`;

BODY.retention = () => `<div class="dp-grid">
<div class="dp-col">${panel('Policy', `<p class="ed-muted">Delete original photos this long after delivery.</p>${seg('Delete after', 'rtOpts')}<div class="dp-row dp-mt"><div><b>Legal hold</b><p class="ed-muted">Pause every deletion, for example during a dispute.</p></div>${toggle('rtHold', 'rtHoldToggle', 'Legal hold')}</div>${IF('rtHoldOn', note('is-bad', 'Nothing is being deleted while this is on.'), false)}`)}
${panel('Orders', `<ul class="dp-ret">${FOR('rtRows', 'r', `<li><div><b>{{r.id}} · {{r.who}}</b><small>Originals: {{r.del}}</small></div>${IF('r.wait', '<button class="ed-btn sm" onClick="{{r.now}}">Delete now</button>', false)}${IF('r.done', `<span class="ed-chip is-ok"><i></i>Deleted</span>`, false)}</li>`, 4)}</ul>`)}</div>
<div class="dp-col">${panel('Customer requests · {{rtOpen}} open', `<p class="ed-muted">A customer asked us to delete their photos. Each one has a deadline.</p><ul class="dp-ret">${FOR('rtReq', 'r', `<li><div><b>{{r.id}} · {{r.who}}</b><small>{{r.order}} · {{r.due}}</small></div>${IF('r.open', '<button class="ed-btn sm pri" onClick="{{r.approve}}">Delete and confirm</button>', false)}${IF('r.done', '<span class="ed-chip is-ok"><i></i>Done</span>', false)}</li>`, 2)}</ul>`)}</div></div>`;

BODY.compliance = () => `${panel('', `<div class="dp-top"><div><h2 class="dp-h2">{{cpDone}} of {{cpTotal}} in place</h2><div class="ed-prog" aria-hidden="true"><i style="{{cpBar}}"></i></div></div></div><p class="ew-note">These statuses are examples. Set each one to what is true, and only tell customers about what is done.</p><ul class="dp-cp">${FOR('cpRows', 'r', '<li><div><b>{{r.t}}</b><small>{{r.g}}</small></div><button class="{{r.cls}}" onClick="{{r.cycle}}" aria-label="{{r.aria}}">{{r.label}}</button></li>', 5)}</ul>`)}
<div class="dp-grid dp-mt"><div class="dp-col">${panel('Where a photo travels', `<ol class="dp-flow">${FOR('cpFlow', 'f', '<li><span class="dp-no">{{f.n}}</span><div><b>{{f.t}}</b><small>{{f.d}}</small></div></li>', 5)}</ol>`)}</div>
<div class="dp-col">${panel('Ask a lawyer', `<p class="ed-muted">Questions only a lawyer can answer for Saudi Arabia and Pakistan.</p><ul class="dp-plain dp-rules">${FOR('cpAsk', 'q', '<li><b>{{q.q}}</b><span>{{q.d}}</span></li>', 4)}</ul>`)}</div></div>`;

BODY.export = () => `<div class="dp-grid">
<div class="dp-col">${panel('Settings', `<p class="ew-mini-h">Bleed</p>${seg('Bleed', 'exBleed')}<div class="dp-row dp-mt"><div><b>Crop marks</b><p class="ed-muted">Small lines in the corner so the printer knows where to cut.</p></div>${toggle('exMarks', 'exMarksToggle', 'Crop marks')}</div><div class="dp-row"><div><b>Also make a proof for the customer</b><p class="ed-muted">Low resolution and watermarked, safe to share.</p></div>${toggle('exProof', 'exProofToggle', 'Make a proof for the customer')}</div>`)}
${panel('Before you export', `<ul class="dp-checks2">${FOR('exChecks', 'c', `<li class="ed-ck">${mark('c.ok', 'c.bad')}<span>{{c.t}}</span></li>`, 4)}</ul><div class="dp-row"><div><b>Customer approved the design</b><p class="ed-muted">Switch it to see what happens when they have not.</p></div>${toggle('exOk', 'exOkToggle', 'Customer approved the design')}</div>`)}</div>
<div class="dp-col">${panel('Files', `${IF('exIdle', `<p class="ed-muted">Make the files for the printer.</p>${btn('Make the files', 'exRun', { icon: 'download', cls: 'pri' })}`, false)}${IF('exBusy', '<div class="ew-bar-up" aria-hidden="true"><i style="{{exBar}}"></i></div><p class="ed-muted">Making files… {{exPct}}</p>', false)}${IF('exReady', `<ul class="dp-fl">${FOR('exFiles', 'f', '<li><b>{{f.n}}</b><span>{{f.d}}</span></li>', 3)}</ul>`, false)}`)}
${panel('Send to the printer', `<p class="ed-muted">{{exWhy}}</p><div class="ew-actions">${btn('{{exSendLabel}}', 'exSend', { icon: 'send', cls: 'pri', dis: 'exNoSend' })}</div>`)}</div></div>`;

/* ---------- shells ---------- */
const pvBlock = (edition, current) => {
  const link = (k) => `<a href="${file(edition, k)}"${k === current ? ' class="on" aria-current="page"' : ''}>${P.find((q) => q[0] === k)[5]}</a>`;
  return `<!--pv--><span class="smh">Privacy &amp; data</span>${P.filter((q) => q[3] === 'studio').map((q) => link(q[0])).join('')}<!--/pv-->`;
};
function groupNav(edition, side, group, current) {
  const items = P.filter((q) => q[4] === group);
  const [label, aria] = GROUPS[group];
  if (side === 'studio') return `<nav class="ed-ws" aria-label="${aria}">${items.map((q) => `<a href="${file(edition, q[0])}"${q[0] === current ? ' aria-current="page"' : ''}>${q[5]}</a>`).join('')}</nav>`;
  const back = group === 'extras' ? `<a href="${edition}23-Editor.dc.html">Live editor</a>` : `<a href="${edition}9-Account.dc.html">My account</a>`;
  return `<div class="subnav-top subnav-23"><nav class="subnav" aria-label="${aria}"><b>${label}</b>${back}${items.map((q) => `<a href="${file(edition, q[0])}"${q[0] === current ? ' aria-current="page"' : ''}>${q[5]}</a>`).join('')}</nav></div>`;
}

function assemble(edition, key) {
  const p = P.find((q) => q[0] === key), [, , , side, group, , kicker, title, lead] = p, studio = side === 'studio', D = edition === 'G';
  const base = rd(`${edition}${studio ? 70 : 23}-Editor.dc.html`);
  const mIdx = base.indexOf('<main id="main"'), eIdx = base.indexOf('</main>'), sIdx = base.indexOf('<script type="text/x-dc"');
  let top = base.slice(0, mIdx), tail = base.slice(eIdx, sIdx), script = base.slice(sIdx);
  // head: no editor scripts, the design-page logic and styles instead
  top = top.replace(/<script src="\/editor\/(core|ui|pages|gestures)\.js"><\/script>\n?/g, '').replace('<link rel="stylesheet" href="/css/editor-pages.css">', '<link rel="stylesheet" href="/css/editor-pages.css">\n<link rel="stylesheet" href="/css/design-pages.css">\n<script src="/editor/design.js"></script>');
  top = top.replace(/<title>[\s\S]*?<\/title>/, `<title>${studio ? `${D ? '' : 'Light · '}Studio · ${title}` : `${D ? '' : 'Light · '}${title} · Miles Retold`}</title>`);
  const twin = file(D ? 'GL' : 'G', key);
  top = top.replace(/(<a class="thm" href=")[^"]*(")/, `$1${twin}$2`).replace(/(<a class="rl thr" href=")[^"]*(")/, `$1${twin}$2`).replace(/(<a href=")[^"]*(">(?:Dark|Light) theme<\/a>)/, `$1${twin}$2`);
  if (studio) {
    // the studio menus: these pages live under Settings, with their own "Privacy & data" group
    top = top.replace(/<a class="rl on" href="([^"]*)" aria-current="page" title="Orders">/, '<a class="rl" href="$1" title="Orders">').replace(/<a class="rl" (href="[^"]*" title="Settings">)/, '<a class="rl on" aria-current="page" $1');
    top = top.replace(/<a href="([^"]*)" class="on" aria-current="page">Book editor<\/a>/g, '<a href="$1">Book editor</a>');
    top = top.replace(/<!--pv-->[\s\S]*?<!--\/pv-->/, '').replace('<span class="smh">Settings</span>', `${pvBlock(edition, key)}<span class="smh">Settings</span>`);
    top = top.replace(/<nav class="sub2 gl" aria-label="Orders pages">[\s\S]*?<\/nav>/, `<nav class="sub2 gl" aria-label="Privacy and data pages"><div class="s2h"><b>Privacy &amp; data</b><label class="s2x" for="s2t" tabindex="0" role="button" aria-label="Hide the menu" title="Hide menu and show full sidebar">${ic('cross', 16)}</label></div><div class="s2g">Customer photos</div>${P.filter((q) => q[3] === 'studio').map((q) => `<a href="${file(edition, q[0])}"${q[0] === key ? ' class="on" aria-current="page"' : ''}>${q[5]}</a>`).join('')}<div class="s2g">Elsewhere</div><a href="${edition}46-StudioSettings.dc.html">Settings</a><a href="${edition}70-Editor.dc.html">Book editor</a></nav>`);
  } else {
    top = top.replace(/<div class="subnav-top subnav-23">[\s\S]*?<\/nav><\/div>/, groupNav(edition, side, group, key));
  }
  const cls = `{{edCls}} dpm${studio ? ' dps' : ''}`;
  const banner = `<p class="dp-banner" role="note"><b>Design preview</b><span>Nothing on this page is saved, sent or enforced yet. It shows how the feature could look and feel.</span></p>`;
  const main = `<main id="main" class="${cls}">\n<div class="dp">${studio ? groupNav(edition, side, group, key) : ''}\n${banner}\n<header class="dp-head"><p class="ed-kicker">${kicker}</p><h1 class="dp-h1">${title}</h1><p class="dp-lead">${lead}</p></header>\n${BODY[key]()}\n</div>\n${IF('hasToast', '<div class="ed-toast" role="status">{{toast}}</div>', false)}\n`;
  const links = Object.fromEntries(P.map((q) => [q[0], file(edition, q[0])]));
  const opts = `{ links: ${JSON.stringify(links)} }`;
  const edCls = `'ed${D ? '' : ' ed-light'}${studio ? ' ed-studio' : ''}'`;
  if (studio) {
    script = `<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":1100}}'>
class Component extends DCLogic {
  constructor(p) { super(p); this.dz = MilesDesign.create('${key}', this, ${opts}); this.state = Object.assign({}, this.dz.initial()); }
  componentDidMount() { this.dz.mount(); }
  componentWillUnmount() { this.dz.unmount(); }
  renderVals() { return Object.assign({ edCls: ${edCls} }, this.dz.vals()); }
}
</script>
</body>
</html>
`;
  } else {
    script = script
      .replace(/this\.ed = MilesEditorUI\.create\(this, \{[^}]*\}\);/, `this.dz = MilesDesign.create('${key}', this, ${opts});`)
      .replace('this.ed.initial()); }', 'this.dz.initial()); }')
      .replace('mountPage() { this.ed.mount(); }', 'mountPage() { this.dz.mount(); }')
      .replace('unmountPage() { this.ed.unmount(); }', 'unmountPage() { this.dz.unmount(); }')
      .replace('const v = this.ed.vals();', `const v = Object.assign({ edCls: ${edCls} }, this.dz.vals());`)
      .replace('v.noDel = !v.canDel; v.noRequest = !v.canRequest;', '');
  }
  return top + utilStyles(main, `${edition}${key}`) + tail + script;
}

/* static style="" becomes a utility class (README: inline style is only for values computed at runtime) */
const UTIL = {};
function utilStyles(html, where) {
  return html.replace(/<([a-z0-9-]+)((?:\s[^<>]*?)?)\sstyle="([^"{}]*)"([^<>]*)>/g, (m, tag, a, css) => { throw new Error(`static style="${css}" in ${where}`); });
}

/* ---------- the links that lead here, added to pages that already exist ---------- */
function patchNav() {
  let n = 0;
  for (const f of fs.readdirSync(PUB).filter((x) => /^GL?\d+-.*\.dc\.html$/.test(x))) {
    const edition = f.startsWith('GL') ? 'GL' : 'G';
    let h = rd(f), o = h;
    if (/^GL?(12[0-9]|13[0-6])-/.test(f)) continue;                                    // the design pages carry their own navigation
    // customer account pages: a "Privacy" pill before Settings
    if (h.includes('aria-label="My account"') && !h.includes('data-pv')) h = h.replace(new RegExp(`<a href="${edition}14-Settings\\.dc\\.html"`), `<a data-pv href="${file(edition, 'privacy')}">Privacy</a><a href="${edition}14-Settings.dc.html"`);
    // studio pages: the "Privacy & data" group in the phone menu (and the Settings side menu)
    if (h.includes('<span class="smh">Settings</span>') && !h.includes('<!--pv-->')) h = h.replace('<span class="smh">Settings</span>', `${pvBlock(edition, '')}<span class="smh">Settings</span>`);
    if (/aria-label="Settings pages"/.test(h) && !h.includes('<!--pvs-->')) h = h.replace(/(<a href="[^"]*StudioPhone\.dc\.html">Studio on phone<\/a>)(<\/nav>)/, `$1<!--pvs--><div class="s2g">Privacy &amp; data</div>${P.filter((q) => q[3] === 'studio').map((q) => `<a href="${file(edition, q[0])}">${q[5]}</a>`).join('')}<!--/pvs-->$2`);
    if (h !== o) { wr(f, h); n++; }
  }
  return n;
}

/* ---------- run ---------- */
const patched = patchNav();
let n = 0;
for (const edition of ['G', 'GL']) for (const q of P) { wr(file(edition, q[0]), assemble(edition, q[0])); n++; }
console.log(`built ${n} design pages, added links to ${patched} existing pages`);
