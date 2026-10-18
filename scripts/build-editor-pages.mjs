#!/usr/bin/env node
/* Builds the pages of the live book editor workspace from one source, in both editions (dark G, light GL) and for both sides:
 *
 *   customer (account sub-nav "Live editor")   G23 / GL23  canvas (hand-written, only patched here)
 *                                              G80-G89 / GL80-GL89   storyboard, photos, layouts, text, cover, style, flipbook, print check, history, send to proof
 *   studio   (Orders > "Book editor")          G70 / GL70  canvas (hand-written, only patched here)
 *                                              G90-G99 / GL90-GL99   the same ten pages with the studio's tools (hand-off instead of "send to proof")
 *
 * Header, side menus and footer are copied from G23 / GL23 (customer) and G70 / GL70 (studio), so they always match the rest of the site.
 * Everything between <main> and </main> and the page's Component are written here.
 *
 *   node scripts/build-editor-pages.mjs        (idempotent: run it again after editing this file, the canvas pages are patched in place)
 * Page logic: public/editor/pages.js · styles: public/css/editor-pages.css · data: public/editor/core.js                       */
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const PUB = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const rd = (f) => fs.readFileSync(path.join(PUB, f), 'utf8');
const wr = (f, s) => fs.writeFileSync(path.join(PUB, f), s);

/* ---------- the pages ---------- */
const PAGES = [
  ['canvas', 'Canvas', null, 'canvas'],
  ['storyboard', 'Storyboard', 'Storyboard', 'board'],
  ['photos', 'Photos', 'Photos', 'photos'],
  ['layouts', 'Layouts', 'Layouts', 'layouts'],
  ['text', 'Text', 'Text', 'text'],
  ['cover', 'Cover', 'Cover', 'cover'],
  ['style', 'Style', 'Style', 'style'],
  ['flipbook', 'Flipbook', 'Flipbook', 'flip'],
  ['printcheck', 'Print check', 'PrintCheck', 'check'],
  ['history', 'History', 'History', 'history'],
  ['send', 'SEND', 'Send', 'send']
];
const SIDES = {
  customer: { first: 80, canvasNum: 23, canvas: 'Editor', sendLabel: 'Send to proof', studio: false },
  studio: { first: 90, canvasNum: 70, canvas: 'Editor', sendLabel: 'Hand-off', studio: true }
};
const file = (side, edition, page) => {
  const s = SIDES[side], i = PAGES.findIndex((p) => p[0] === page);
  if (i === 0) return `${edition}${s.canvasNum}-${s.canvas}.dc.html`;
  const name = page === 'send' ? (s.studio ? 'Handoff' : 'Send') : PAGES[i][2];
  return `${edition}${s.first + i - 1}-Ed${name}.dc.html`;
};

/* ---------- small helpers ---------- */
const ICON = {
  cross: '<path d="M6 6l12 12M18 6L6 18"/>',
  canvas: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/>',
  board: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
  photos: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>',
  layouts: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 12v9"/>',
  text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
  cover: '<path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6zM6 3v18M10 8h5"/>',
  style: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.5-.7 1.2-1.6-.4-1 .2-2 1.3-2H17a4 4 0 0 0 4-4 9 9 0 0 0-9-10z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
  flip: '<path d="M2 5.5c3-1.5 6-1.5 10 .5 4-2 7-2 10-.5V19c-3-1.5-6-1.5-10 .5-4-2-7-2-10-.5z"/><path d="M12 6v13.5"/>',
  check: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 7v5l3 2"/>',
  send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>',
  undo: '<path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3"/>',
  redo: '<path d="M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3"/>',
  tick: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  left: '<path d="M15 6l-6 6 6 6"/>', right: '<path d="M9 6l6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', dup: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', star: '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.4 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z"/>',
  print: '<path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>', play: '<path d="M8 5v14l11-7z"/>', pause: '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>',
  zoom: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/>', full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  wand: '<path d="M4 20L15 9M14 4v3M19 9h-3M18 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>', lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/>', eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'
};
const ic = (n, s = 18) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;
const IF = (v, body, hint = true) => `<sc-if value="{{${v}}}" hint-placeholder-val="{{ ${hint} }}">${body}</sc-if>`;
const FOR = (list, as, body, n = 3) => `<sc-for list="{{${list}}}" as="${as}" hint-placeholder-count="${n}">${body}</sc-for>`;
const btn = (label, on, { icon = '', cls = '', dis = '', aria = '', pressed = '' } = {}) => `<button class="ed-btn ${cls}" onClick="{{${on}}}"${dis ? ` disabled="{{${dis}}}"` : ''}${aria ? ` aria-label="${aria}"` : ''}${pressed ? ` aria-pressed="{{${pressed}}}"` : ''}>${icon ? ic(icon, cls.includes('sm') ? 16 : 18) : ''}${label ? `<span class="ed-lbl">${label}</span>` : ''}</button>`;
const seg = (aria, items) => `<div class="ed-seg" role="group" aria-label="${aria}">${items.map(([label, on, pressed, n]) => `<button onClick="{{${on}}}" aria-pressed="{{${pressed}}}">${label}${n ? `<span class="ew-n">{{${n}}}</span>` : ''}</button>`).join('')}</div>`;
const mini = (lay, cellsList, as = 'k') => `<span class="ed-mini" data-lay="${lay}">${FOR(cellsList, as, `<span class="ed-ms {{${as}.cls}}">${IF(as + '.has', `<img src="{{${as}.src}}" alt="">`)}</span>`, 2)}</span>`;
const miniIcon = (lay, list) => `<span class="ed-mini" data-lay="${lay}">${FOR(list, 'k', '<span class="ed-ms {{k.cls}}"></span>', 2)}</span>`;
const target = (cls = '') => `<div class="ed-seg ${cls}" role="group" aria-label="Change the layout of"><button onClick="{{setLtBoth}}" aria-pressed="{{ltBoth}}">Both pages</button><button onClick="{{setLtLeft}}" aria-pressed="{{ltLeft}}">Left page</button><button onClick="{{setLtRight}}" aria-pressed="{{ltRight}}">Right page</button></div>`;
const panel = (h, body, cls = '') => `<div class="ed-panel ${cls}">${h ? `<h2>${h}</h2>` : ''}${body}</div>`;
const slider = (id, label, val, on, out, min, max, step) => `<div class="ed-row"><label for="${id}">${label}</label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="{{${val}}}" onInput="{{${on}}}"><output>{{${out}}}</output></div>`;
const head = (h, sub, tools = '') => `<div class="ew-head"><div><h2 class="ew-h">${h}</h2><p class="ew-sub">${sub}</p></div>${tools ? `<div class="ed-tools">${tools}</div>` : ''}</div>`;

/* the static spread picture used by the style preview (the flipbook uses the same markup with fb* values) */
const spreadView = (p, extra = '') => `<div class="ed-spread" data-lay="{{${p}Lay}}">${IF(p + 'Story', `<div class="ed-text l">{{${p}StoryText}}</div>`, false)}${IF(p + 'StoryR', `<div class="ed-text r">{{${p}StoryTextR}}</div>`, false)}${FOR(p + 'Slots', 's', `<div class="ed-slot ro">${IF('s.has', `<img src="{{s.src}}" alt="{{s.alt}}" style="{{s.img}}">`)}</div>`)}<div class="ed-caps">${IF(p + 'ShowCapL', `<span class="ed-cap">{{${p}CapL}}</span>`)}${IF(p + 'Story', '<span></span>', false)}${IF(p + 'ShowCapR', `<span class="ed-cap">{{${p}CapR}}</span>`)}</div><span class="ed-pgn l">{{${p}PgL}}</span><span class="ed-pgn r">{{${p}PgR}}</span></div>`;
const coverView = (faceExpr, flat = false) => `<div class="{{cvFoilCls}}" data-face="${faceExpr}" data-kind="{{cvKind}}" style="{{cvStyle}}"><div class="cv-back"><p>{{cvBack}}</p>${IF('cvLogo', '<span class="logo">MILES RETOLD</span>', false)}</div><div class="cv-spine">${IF('cvSpine', '<span>{{cvTitle}}</span>')}</div><div class="cv-front">${IF('cvHasPhoto', '<img class="cv-ph" src="{{cvSrc}}" alt="">')}<div class="cv-t"><b class="cv-title" data-size="{{cvTitleSize}}">{{cvTitle}}</b><span class="cv-sub">{{cvSub}}</span></div></div></div>`;

/* ---------- page bodies ---------- */
const BODY = {};

BODY.storyboard = (S) => head('Storyboard', 'Every spread at a glance. Drag a spread to reorder it, tick several to change them together, or open one in the canvas.',
  seg('View', [['Spreads', 'setVSp', 'vSp'], ['Flat plan', 'setVFl', 'vFl']]) + btn('Print overview', 'sbPrint', { icon: 'print' }) + btn('Add a spread', 'sbAdd', { icon: 'plus', cls: 'pri keep' })) +
`<div class="ew-grid"><section class="ew-col" aria-label="Spreads">
<div class="ew-bar">${seg('Show', [['All', 'fAll', 'sbAll', 'nAll'], ['Empty frames', 'fEm', 'sbEm', 'nEm'], ['Open comments', 'fCm', 'sbCm', 'nCm'], ['Low-res', 'fLo', 'sbLo', 'nLo']])}</div>
${IF('sbSpreads', `<div class="ew-selbar" role="region" aria-label="Selected spreads"><b>{{selLabel}}</b>${IF('hasSel', `${btn('Select all', 'selectAll', { cls: 'sm' })}${btn('None', 'selectNone', { cls: 'sm' })}${target()}<div class="ew-layrow" role="group" aria-label="Set the layout of the selected spreads">${FOR('sbLays', 'l', `<button onClick="{{l.pick}}" title="{{l.name}}" aria-label="Use {{l.name}} on the selected spreads">${miniIcon('{{l.mini}}', 'l.cells')}</button>`, 4)}</div>${btn('Duplicate', 'dupSel', { icon: 'dup', cls: 'sm' })}${btn('Delete', 'delSel', { icon: 'trash', cls: 'sm' })}`, false)}${IF('noSel', btn('Select all', 'selectAll', { cls: 'sm' }))}</div>`)}
${IF('sbSpreads', `<div class="ew-cards">${FOR('sbCards', 'c', `<article class="{{c.cls}}" draggable="true" onDragStart="{{c.dragStart}}" onDragOver="{{c.dragOver}}" onDrop="{{c.drop}}" onDragEnd="{{c.dragEnd}}">
<button class="ew-tick" onClick="{{c.toggle}}" aria-pressed="{{c.on}}" aria-label="{{c.checkLabel}}">${ic('tick', 18)}</button>
<button class="ew-open" onClick="{{c.open}}" aria-label="{{c.openLabel}}">${mini('{{c.lay}}', 'c.cells')}</button>
<div class="ew-meta"><b>Spread {{c.n}}</b><span>{{c.pages}} · {{c.layName}}</span>${IF('c.hasCap', '<p class="ew-capline">{{c.capText}}</p>', false)}<div class="ew-tags">${IF('c.hasMiss', '<i class="ew-tag warn">{{c.missLabel}}</i>', false)}${IF('c.low', '<i class="ew-tag warn">Low-res</i>', false)}${IF('c.hasCm', '<i class="ew-tag acc">{{c.cmLabel}}</i>', false)}</div></div>
<div class="ew-acts">${btn('', 'c.earlier', { icon: 'left', cls: 'sm', dis: 'c.noEarlier', aria: 'Move earlier' })}${btn('', 'c.later', { icon: 'right', cls: 'sm', dis: 'c.noLater', aria: 'Move later' })}${btn('', 'c.dup', { icon: 'dup', cls: 'sm', aria: 'Duplicate spread' })}</div></article>`, 6)}</div>${IF('sbNone', '<div class="ew-empty">No spreads match this filter.</div>', false)}`)}
${IF('sbFlat', `<p class="ed-muted">Page by page, as the printer sees it: sixteen pages to a printed signature. Tap a page to open its spread.</p><div class="ew-flat">${FOR('sbPages', 'p', `${IF('p.first', '<p class="ew-sig">{{p.sigLabel}}</p>', false)}<button class="ew-pg" onClick="{{p.go}}" aria-label="{{p.label}}"><span class="{{p.sideCls}}">${mini('{{p.lay}}', 'p.cells')}</span><b>{{p.n}}</b></button>`, 8)}</div>`, false)}
</section><aside class="ew-side" aria-label="Book summary">${panel('Book summary', `<div class="ed-prog" aria-hidden="true"><i style="transform: scaleX({{sbFill}})"></i></div><p class="ed-muted">{{sbFillLabel}}</p><ul class="ed-stats ed-sec"><li><b>{{sbSpreadsN}}</b><span>spreads</span></li><li><b>{{sbOrdered}}</b><span>pages ordered</span></li><li><b>{{sbEmptyN}}</b><span>empty frames</span></li><li><b>{{sbOpenN}}</b><span>open comments</span></li></ul>`)}${panel('Good to know', '<p class="ed-muted">Moving a spread keeps its photos and captions together. Page numbers update straight away. Everything saves as you go, and <kbd>Ctrl</kbd>+<kbd>Z</kbd> undoes the last move.</p>')}</aside></div>`;

BODY.photos = (S) => head('Photo library', 'Every photo in this book: star the best, add a note, find duplicates and soft pictures, and see where each one is used.',
  btn('{{upLabel}}', 'addPhotos', { icon: 'plus', cls: 'pri keep', dis: 'upDone' })) +
`<div class="ew-grid"><section class="ew-col" aria-label="Photos">
${panel('', `<div class="ew-tools"><div class="ew-search ed-field" style="margin:0"><label class="ed-vh" for="ph-q">Search photos</label><input id="ph-q" type="text" placeholder="Search by name or note" value="{{phQ}}" onInput="{{onQ}}"></div>${seg('Sort', [['Library order', 'setSOrder', 'sOrder'], ['A–Z', 'setSName', 'sName'], ['Used first', 'setSUsed', 'sUsed']])}<label class="ed-muted" for="ph-size">Size</label><input id="ph-size" type="range" min="80" max="220" step="10" value="{{phSize}}" onInput="{{onSize}}" style="max-inline-size:140px"></div>
<div class="ew-bar" style="margin-block-start:12px">${seg('Show', [['All', 'fAll', 'pAll', 'nAll'], ['Unused', 'fUn', 'pUn', 'nUn'], ['Used', 'fUs', 'pUs', 'nUs'], ['Starred', 'fSt', 'pSt', 'nSt'], ['Low-res', 'fLo', 'pLo', 'nLo'], ['Duplicates', 'fDu', 'pDu', 'nDu'], ['Removed', 'fHi', 'pHi', 'nHi']])}</div>`)}
<p class="ed-muted" aria-live="polite">{{phCount}}. The number on a photo is the spread it is used on. Drag a photo onto a frame in the canvas, or use the buttons on the right.</p>
<div class="ew-phgrid" style="{{phGrid}}">${FOR('phTiles', 'p', `<button class="{{p.cls}}" draggable="true" onDragStart="{{p.dragStart}}" onClick="{{p.pick}}" aria-label="{{p.label}}" title="{{p.name}}"><img src="{{p.src}}" alt="" draggable="false">${IF('p.hasN', '<span class="ed-n">{{p.n}}</span>', false)}${IF('p.star', `<span class="ed-st">${ic('star', 16)}</span>`, false)}${IF('p.low', '<span class="ed-lo">Low-res</span>', false)}${IF('p.dupe', '<span class="ew-dp">Duplicate?</span>', false)}</button>`, 9)}</div>
${IF('phNone', '<div class="ew-empty">No photos match. Try another filter or clear the search.</div>', false)}
${IF('hasDupes', panel('Possible duplicates', `<p class="ed-muted">These photos share the same file. Keep the first and remove the extra copies that are not placed yet.</p>${FOR('dupRows', 'd', `<div class="ew-dup"><div class="th">${FOR('d.thumbs', 't', '<img class="{{t.cls}}" src="{{t.src}}" alt="">', 2)}</div><span><b>{{d.label}}</b></span>${btn('Remove extra copies', 'd.fix', { cls: 'sm' })}</div>`, 2)}`), false)}
</section><aside class="ew-side" aria-label="Photo details">
${panel('Photo', `${IF('hasPick', `<div class="ew-detail"><img src="{{dSrc}}" alt="{{dName}}"><h3>{{dName}}</h3><p class="ed-muted">{{dDims}}</p></div><p class="{{dSharpCls}}" style="margin-block-start:10px">{{dSharp}}</p><p class="ed-muted ed-sec">{{dUsed}}${IF('dHasSame', '<br>{{dSame}}', false)}</p>
<div class="ew-actions ed-sec">${IF('dVisible', `<button class="ed-btn sm" onClick="{{toggleStar}}" aria-pressed="{{dStarOn}}">${ic('star', 16)}<span>{{dStarLabel}}</span></button><button class="ed-btn sm" onClick="{{placeNext}}" disabled="{{noEmpty}}">${ic('plus', 16)}Place in next empty frame</button>${IF('dIsUsed', btn('Open its spread', 'openAt', { icon: 'eye', cls: 'sm' }), false)}<button class="ed-btn sm" onClick="{{hide}}">${ic('trash', 16)}Remove from book</button>`)}${IF('dHid', btn('Put back in the library', 'unhide', { cls: 'sm pri' }), false)}</div>
<div class="ed-field ed-sec"><label for="ph-note">Note (only you and the studio see this)</label><textarea id="ph-note" placeholder="Where was this taken? Anything the designer should know?" value="{{dMemo}}" onInput="{{onMemo}}"></textarea></div>`)}${IF('noPick', '<div class="ed-empty-note">Pick a photo to see its size, where it is used and to add a note.</div>', false)}`)}
${panel('Add photos', `<div class="ew-drop" onDragOver="{{upOver}}" onDrop="{{upDrop}}">${IF('upIdle', `<span>${ic('plus', 22)}</span><span>Drop photos here, or use the button above.<br>This demo adds sample photos ({{upLeft}} left).</span>`)}${IF('upBusy', '<span>Uploading…</span><div class="ew-bar-up" aria-hidden="true"><i style="{{upBar}}"></i></div>', false)}</div>`)}
</aside></div>`;

BODY.layouts = (S) => head('Layouts', 'Pick how the photos sit on a spread. Change one spread, several at once, or let the editor fill the empty frames and build spreads from the photos you have not used.',
  btn('Fill empty frames', 'autoFill', { icon: 'wand', cls: 'pri keep', dis: 'lyNoEmpty' })) +
`<div class="ew-grid"><section class="ew-col" aria-label="Layouts">
${panel('', `<div class="ew-curbar">${btn('', 'lyPrev', { icon: 'left', cls: 'sq', dis: 'lyNoPrev', aria: 'Previous spread' })}<div><b>Spread {{lyCur}}</b><br><span class="ed-muted">{{lyCurName}} · {{lyFrames}}</span></div>${btn('', 'lyNext', { icon: 'right', cls: 'sq', dis: 'lyNoNext', aria: 'Next spread' })}</div><div class="ew-curbar ew-mt10">${target()}<span class="ed-muted">{{lyTarget}}</span></div>`)}
<div class="ew-lays" role="group" aria-label="Layouts">${FOR('lyCards', 'l', `<div class="ew-lay" data-on="{{l.on}}"><button class="ew-open" onClick="{{l.pick}}" aria-label="Use {{l.label}}">${miniIcon('{{l.mini}}', 'l.cells')}</button><h3><span>{{l.name}}</span>${IF('l.isCur', '<i class="ew-tag acc">This spread</i>', false)}</h3><p>{{l.best}}</p><p><b>{{l.frames}}</b></p>${IF('l.lose', '<p class="ew-note is-bad">{{l.loseLabel}}</p>', false)}<div class="ew-actions">${btn('Use here', 'l.pick', { cls: 'sm' })}${IF('lyHasSel', btn('Use on selected', 'l.applySel', { cls: 'sm' }), false)}</div></div>`, 6)}</div>
${panel('Apply to several spreads', `<p class="ed-muted">Tick spreads, then choose Use on selected under any layout. It follows the Both pages / Left page / Right page choice above. Tap a thumbnail to jump to it.</p><div class="ew-actions" style="margin-block:10px">${btn('Select all', 'lySelAll', { cls: 'sm' })}${btn('None', 'lySelNone', { cls: 'sm' })}<span class="ed-muted" aria-live="polite" style="align-self:center">{{lySelLabel}}</span></div><div class="ew-strip">${FOR('lyStrip', 's', `<div class="{{s.cls}}" data-cur="{{s.cur}}"><button class="ew-tick" onClick="{{s.toggle}}" aria-pressed="{{s.on}}" aria-label="{{s.tLabel}}">${ic('tick', 16)}</button><button class="ew-go" onClick="{{s.go}}" aria-label="{{s.label}}" aria-current="{{s.cur}}">${mini('{{s.lay}}', 's.cells', 'k')}<span>Spread {{s.n}} · {{s.layName}}</span></button></div>`, 6)}</div>`)}
</section><aside class="ew-side" aria-label="Automatic tools">
${panel('Fill empty frames', `<p class="ed-muted">Puts your next unused photos into every empty frame, in reading order. Soft photos go last.</p><div class="ew-actions" style="margin-block-start:10px"><button class="ed-btn pri" onClick="{{autoFill}}" disabled="{{lyNoEmpty}}">${ic('wand')}<span>{{lyFillLabel}}</span></button></div><p class="ed-muted ed-sec">{{lyAvail}} sharp photos are not used yet.</p>`)}
${panel('Build spreads from unused photos', `<p class="ed-muted">Adds new spreads at the end, with the layout that fits the number of photos.</p><div class="ed-seg" role="group" aria-label="Photos per spread" style="margin-block:10px">${FOR('perOpts', 'o', '<button onClick="{{o.pick}}" aria-pressed="{{o.on}}">{{o.label}}</button>', 3)}</div><p class="ed-muted">{{lyNewLabel}}</p>${IF('lyOverflow', '<p class="ew-note is-bad" style="margin-block-start:10px">{{lyOverLabel}}</p>', false)}<div class="ew-actions" style="margin-block-start:10px"><button class="ed-btn" onClick="{{autoLayout}}" disabled="{{lyNoPool}}">${ic('layouts')}<span>Add the spreads</span></button></div>`)}
</aside></div>`;

BODY.text = (S) => head('Text', 'Every caption and story in the book, in reading order. Fix spelling in one place, find and replace across pages, and set the caption type for the whole book.',
  btn('Download captions (CSV)', 'exportCsv', { icon: 'download' }) + btn('Tidy all', 'fixAll', { icon: 'wand', cls: 'pri keep', dis: 'noFixAll' })) +
`<div class="ew-grid"><section class="ew-col" aria-label="Texts">
<div class="ew-bar">${seg('Show', [['All', 'fAll', 'tAll', 'nAll'], ['Empty', 'fEm', 'tEm', 'nEm'], ['Too long', 'fLo', 'tLo', 'nLo'], ['To tidy', 'fIs', 'tIs', 'nIs']])}</div>
<div class="ew-txs">${FOR('txRows', 'r', `<div class="{{r.cls}}"><div class="lab"><span>{{r.label}}</span>${btn('Open spread', 'r.open', { cls: 'sm' })}</div><div><textarea rows="{{r.rows}}" aria-label="{{r.inLabel}}" placeholder="Nothing here yet" value="{{r.text}}" onInput="{{r.onInput}}"></textarea></div><div class="foot"><span class="{{r.countCls}}">{{r.count}} characters</span><span class="ew-pill-row">${FOR('r.issues', 'is', `<button class="ed-btn sm" onClick="{{is.fix}}">{{is.msg}}: {{is.fixLabel}}</button>`, 1)}${IF('r.canTrim', '<button class="ed-btn sm" onClick="{{r.trim}}">Shorten to fit</button>', false)}</span></div></div>`, 4)}</div>
${IF('txNone', '<div class="ew-empty">Nothing to show here. Everything looks good.</div>', false)}
</section><aside class="ew-side" aria-label="Text tools">
${panel('Caption type', `<div class="ew-prev" style="margin-block-end:12px">{{txSample}}<small>Preview of the caption on every page</small></div><p class="ew-mini-h">Font</p>${seg('Font', [['Sans', 'setSans', 'fSans'], ['Serif', 'setSerif', 'fSerif'], ['Italic', 'setScript', 'fScript']])}<p class="ew-mini-h">Size</p>${seg('Size', [['Small', 'setZS', 'zS'], ['Medium', 'setZM', 'zM'], ['Large', 'setZL', 'zL']])}<p class="ew-mini-h">Alignment</p>${seg('Alignment', [['Left', 'setAL', 'aL'], ['Centre', 'setAC', 'aC'], ['Right', 'setAR', 'aR']])}`)}
${panel('Find and replace', `<div class="ew-fr"><label class="ed-vh" for="tx-find">Find</label><input id="tx-find" type="text" placeholder="Find" value="{{find}}" onInput="{{onFind}}"><label class="ed-vh" for="tx-rep">Replace with</label><input id="tx-rep" type="text" placeholder="Replace with" value="{{rep}}" onInput="{{onRep}}"><div class="ew-toggle"><span>Match capital letters</span><button class="ew-sw2" onClick="{{toggleMc}}" aria-pressed="{{mcOn}}" aria-label="Match capital letters"></button></div><p class="ed-muted" aria-live="polite">{{matchLabel}}</p><button class="ed-btn" onClick="{{replaceAll}}" disabled="{{noReplace}}">Replace all</button></div>`)}
</aside></div>`;

BODY.cover = (S) => head('Cover', 'Design the front, spine and back. The preview is live, and the same cover appears in the flipbook.', btn('Reset cover', 'cvReset', { icon: 'reset' })) +
`<div class="ew-grid wide"><section class="ew-col" aria-label="Cover preview">
<div class="ew-bar">${'<div class="ed-seg" role="group" aria-label="Cover side">' + FOR('cvFaces', 'f', '<button onClick="{{f.pick}}" aria-pressed="{{f.on}}">{{f.name}}</button>', 4) + '</div>'}<span class="ed-muted">{{cvColourName}} · {{cvFoilName}} foil</span></div>
<div class="ew-stage">${coverView('{{cvFace}}')}</div>
</section><aside class="ew-side" aria-label="Cover settings">
${panel('Words', `<div class="ed-field"><label for="cv-title">Title</label><input id="cv-title" type="text" maxlength="40" value="{{cvTitle}}" onInput="{{onTitle}}"></div><p class="{{cvTitleCls}}" style="margin:-4px 0 6px">{{cvTitleLabel}}</p><div class="ed-field"><label for="cv-sub">Line under the title</label><input id="cv-sub" type="text" maxlength="40" value="{{cvSub}}" onInput="{{onSub}}"></div><div class="ed-field"><label for="cv-back">Back cover words</label><textarea id="cv-back" maxlength="140" value="{{cvBack}}" onInput="{{onBack}}"></textarea></div><div class="ew-toggle"><span>Title on the spine</span><button class="ew-sw2" onClick="{{toggleSpine}}" aria-pressed="{{spineOn}}" aria-label="Title on the spine"></button></div><div class="ew-toggle"><span>Miles Retold mark on the back</span><button class="ew-sw2" onClick="{{toggleLogo}}" aria-pressed="{{logoOn}}" aria-label="Miles Retold mark on the back"></button></div>`)}
${panel('Look', `<p class="ew-mini-h">Style</p><div class="ed-seg" role="group" aria-label="Cover style">${FOR('cvKinds', 'k', '<button onClick="{{k.pick}}" aria-pressed="{{k.on}}">{{k.name}}</button>', 3)}</div><p class="ew-mini-h" style="margin-block-start:14px">Cover colour</p><div class="ew-sw" role="group" aria-label="Cover colour">${FOR('cvColours', 'c', '<button style="{{c.sw}}" onClick="{{c.pick}}" aria-pressed="{{c.on}}" aria-label="{{c.label}}" title="{{c.name}}"></button>', 8)}</div><p class="ew-mini-h" style="margin-block-start:14px">Foil</p><div class="ew-sw" role="group" aria-label="Foil colour">${FOR('cvFoils', 'f', '<button class="{{f.cls}}" style="{{f.sw}}" onClick="{{f.pick}}" aria-pressed="{{f.on}}" aria-label="{{f.label}}" title="{{f.name}}"></button>', 5)}</div>`)}
${panel('Cover photo', `<div class="ew-cvp" role="group" aria-label="Cover photo">${FOR('cvPhotos', 'p', '<button onClick="{{p.pick}}" aria-pressed="{{p.on}}" aria-label="{{p.label}}" title="{{p.name}}"><img src="{{p.src}}" alt=""></button>', 8)}</div><p class="ed-muted ed-sec">Low-resolution photos are left out: a cover is printed large.</p>`)}
</aside></div>`;

BODY.style = (S) => head('Style', 'The look of every page: colours, margins, spacing, rounded corners and photo borders. Changes show on the canvas, the storyboard and the flipbook.', btn('Reset style', 'stReset', { icon: 'reset' })) +
`<div class="ew-grid wide"><section class="ew-col" aria-label="Preview">
${panel('', `<div class="ew-curbar" style="margin-block-end:14px">${btn('', 'stPrev', { icon: 'left', cls: 'sq', dis: 'stNoPrev', aria: 'Previous spread' })}<b>Spread {{stN}} of {{stTotal}}</b>${btn('', 'stNext', { icon: 'right', cls: 'sq', dis: 'stNoNext', aria: 'Next spread' })}<span class="ed-muted">Theme: {{stThemeName}}</span></div>${spreadView('pv')}`)}
</section><aside class="ew-side" aria-label="Style settings">
${panel('Theme', `<div class="ew-themes" role="group" aria-label="Theme">${FOR('stThemes', 't', '<button class="ew-theme" style="{{t.sw}}" onClick="{{t.pick}}" aria-pressed="{{t.on}}" aria-label="{{t.label}}"><span>{{t.name}}</span><i></i><i></i></button>', 5)}</div>`)}
${panel('Colours', `<p class="ew-mini-h">Page colour</p><div class="ew-sw" role="group" aria-label="Page colour">${FOR('stBgs', 'c', '<button style="{{c.sw}}" onClick="{{c.pick}}" aria-pressed="{{c.on}}" aria-label="{{c.label}}"></button>', 8)}</div><p class="ew-mini-h" style="margin-block-start:14px">Text colour</p><div class="ew-sw" role="group" aria-label="Text colour">${FOR('stInks', 'c', '<button style="{{c.sw}}" onClick="{{c.pick}}" aria-pressed="{{c.on}}" aria-label="{{c.label}}"></button>', 6)}</div>`)}
${panel('Space and shape', `${slider('st-m', 'Page margin', 'margin', 'onMargin', 'marginL', 0, 8, 0.2)}${slider('st-g', 'Photo spacing', 'gap', 'onGap', 'gapL', 0, 2, 0.1)}${slider('st-r', 'Corners', 'radius', 'onRadius', 'radiusL', 0, 16, 1)}${slider('st-b', 'Photo border', 'border', 'onBorder', 'borderL', 0, 8, 1)}<p class="ed-muted">Wider margins keep photos and words further from the trimmed edge.</p>`)}
</aside></div>`;

BODY.flipbook = (S) => head('Flipbook', 'Read the book from cover to cover, the way it will feel in your hands. Arrow keys turn pages, space plays and pauses.',
  btn('Zoom', 'fbToggleZoom', { icon: 'zoom', pressed: 'fbZoomOn' }) + IF('fbCanFs', btn('Full screen', 'fbFull', { icon: 'full', cls: 'pri keep' }), false)) +
`<div class="{{fbStageCls}}" ref="{{fbRef}}">
${IF('fbSpread', `<div class="ew-turn">${spreadView('fb')}</div>`)}${IF('fbCover', `<div class="ew-turn ew-cvwrap"><div class="{{cvFoilCls}}" data-face="front" data-kind="{{cvKind}}" style="{{cvStyle}}"><div class="cv-front">${IF('cvHasPhoto', '<img class="cv-ph" src="{{cvSrc}}" alt="">')}<div class="cv-t"><b class="cv-title" data-size="{{cvTitleSize}}">{{cvTitle}}</b><span class="cv-sub">{{cvSub}}</span></div></div></div></div>`, false)}${IF('fbBack', `<div class="ew-turn ew-cvwrap"><div class="{{cvFoilCls}}" data-face="back" data-kind="{{cvKind}}" style="{{cvStyle}}"><div class="cv-back"><p>{{cvBack}}</p>${IF('cvLogo', '<span class="logo">MILES RETOLD</span>', false)}</div></div></div>`, false)}
<p class="ew-fbl" aria-live="polite">{{fbLabel}}</p></div>
<div class="ew-fbc"><div class="ed-tools">${btn('', 'fbPrev', { icon: 'left', cls: 'sq', aria: 'Previous page' })}<span class="ed-count">{{fbPos}}</span>${btn('', 'fbNext', { icon: 'right', cls: 'sq', aria: 'Next page' })}</div>
<div class="ew-dots" role="group" aria-label="Go to page">${FOR('fbDots', 'd', '<button class="{{d.cls}}" onClick="{{d.go}}" aria-label="{{d.label}}" aria-current="{{d.cur}}"></button>', 8)}</div>
<div class="ed-tools"><button class="ed-btn" onClick="{{fbToggleAuto}}" aria-pressed="{{fbAuto}}">${IF('fbPaused', ic('play'), false)}${IF('fbPlaying', ic('pause'), false)}<span class="ed-lbl">{{fbAutoLabel}}</span></button>${seg('Speed', [['Quick', 'fbSpeed3', 'fbS3'], ['Slow', 'fbSpeed6', 'fbS6']])}</div></div>`;

BODY.printcheck = (S) => head('Print check', 'What could go wrong at the printer, found for you. Fix items with one tap, or open the spread to decide yourself.',
  btn('{{pcRunLabel}}', 'pcRun', { icon: 'reset' }) + btn('{{pcFixLabel}}', 'fixAll', { icon: 'wand', cls: 'pri keep', dis: 'noFix' })) +
`<div class="ew-grid wide"><section class="ew-col" aria-label="Findings">
${panel('', `<div class="ew-score"><div class="ew-ring {{pcRing}}" role="img" aria-label="Print score {{pcScore}} out of 100"><svg width="132" height="132" viewBox="0 0 132 132" aria-hidden="true"><circle class="bg" cx="66" cy="66" r="52"/><circle class="fg" cx="66" cy="66" r="52" stroke-dasharray="{{pcDash}}"/></svg><b>{{pcScore}}<small>of 100</small></b></div><div><p class="{{pcVerdictCls}}">{{pcVerdict}}</p><p class="ed-muted" style="margin-block-start:6px">{{pcSub}}</p><p class="ed-muted" aria-live="polite">{{pcAt}}</p></div></div>`)}
<div class="ew-bar">${seg('Show', [['All', 'fAll', 'pcAllFilter'], ['Fix before printing', 'fBad', 'pcBadFilter'], ['Worth a look', 'fWarn', 'pcWarnFilter']])}</div>
${FOR('pcCats', 'c', IF('c.show', `<div class="ed-panel ew-cat {{c.cls}}"><h3><span>{{c.name}}</span><i class="ew-tag">{{c.countLabel}}</i></h3>${FOR('c.items', 'i', `<div class="{{i.cls}}"><div><small>{{i.sevLabel}}</small>{{i.text}}</div>${IF('i.hasFix', `<button class="ed-btn sm" onClick="{{i.fix}}">{{i.fixLabel}}</button>`, false)}</div>`, 2)}</div>`, false), 3)}
${IF('pcNone', '<div class="ew-empty">Nothing found for this filter. Every check passed.</div>', false)}
${panel('Photo sharpness, frame by frame', `<p class="ed-muted">Dots per inch at the printed size. 200 and above prints crisp; below 150 will look soft. Tap a number to open that frame.</p><div class="ew-dpirows" style="margin-block-start:10px">${FOR('pcRows', 'r', `<div class="ew-dpirow"><span>Spread {{r.n}}</span><span class="chips">${FOR('r.chips', 'c', '<button class="{{c.cls}}" title="{{c.title}}" onClick="{{c.open}}">{{c.label}}</button>', 3)}</span></div>`, 6)}</div><p class="ew-key"><span>≥ 200 crisp</span><span>150–199 fine when small</span><span>&lt; 150 soft</span><span>– empty</span></p>`)}
</section><aside class="ew-side" aria-label="Print tools">
${panel('What is checked', `<ul class="ed-stats" style="grid-template-columns:1fr 1fr"><li><b>{{pcFrames}}</b><span>frames</span></li><li><b>{{pcPages}} / {{pcOrdered}}</b><span>pages designed</span></li></ul><p class="ed-muted ed-sec">Photo sharpness at print size · empty frames · zoom and crop · repeated photos · text inside the safe area · double spaces · page count · cover title · open comments.</p>`)}
${S ? panel('Studio sign-off', `<p class="ed-muted">Mark the book ready once every red item is cleared. The hand-off page uses this mark.</p><div class="ew-actions" style="margin-block-start:10px"><button class="ed-btn pri" onClick="{{toggleReady}}" aria-pressed="{{pcMark}}" disabled="{{pcNoMark}}">${ic('check')}<span>{{pcMarkLabel}}</span></button></div>`) : ''}
${panel('Take it with you', `<div class="ew-actions"><button class="ed-btn sm" onClick="{{exportCsv}}">${ic('download', 16)}Captions (CSV)</button><button class="ed-btn sm" onClick="{{exportJson}}">${ic('download', 16)}Book data (JSON)</button></div>`)}
</aside></div>`;

BODY.history = (S) => head('History', 'Saved versions of the book, what changed between them, and the conversation about the pages.',
  `<div class="ed-field" style="margin:0"><label class="ed-vh" for="hv-name">Version name</label><input id="hv-name" class="ed-in" type="text" maxlength="40" placeholder="Name this version" value="{{vname}}" onInput="{{onVname}}"></div>` + btn('Save version', 'saveNamed', { icon: 'check', cls: 'pri keep' })) +
`<div class="ew-grid wide"><section class="ew-col" aria-label="Versions">
${panel('Saved versions', `<div class="ew-vers">${FOR('hvList', 'v', `<div class="{{v.cls}}"><header><b>{{v.label}}</b><small>{{v.by}} · {{v.when}} · {{v.nLabel}}</small></header><div class="ew-thumbs">${FOR('v.thumbs', 't', `<span>${IF('t.has', '<img src="{{t.src}}" alt="">')}</span>`, 4)}</div><div class="ew-actions">${btn('Compare with now', 'v.compare', { cls: 'sm', pressed: 'v.on' })}<button class="ed-btn sm" onClick="{{v.restore}}">${ic('reset', 16)}<span>{{v.restoreLabel}}</span></button>${IF('v.conf', btn('Cancel', 'v.cancel', { cls: 'sm' }), false)}${IF('v.canDel', btn('', 'v.del', { icon: 'trash', cls: 'sm', aria: 'Delete this version' }), false)}</div></div>`, 2)}</div>${IF('hvNone', '<div class="ed-empty-note">No saved versions yet. Name one above.</div>', false)}<p class="ed-muted ed-sec">Restoring a version puts its spreads back. Your current work is saved first, so nothing is lost.</p>`)}
${panel('What changed', `<p class="ed-muted" aria-live="polite">{{hvDiffLabel}}</p>${FOR('hvRows', 'r', `<div class="{{r.cls}}"><b>{{r.kind}}</b><span>{{r.text}}</span>${IF('r.canJump', btn('Open', 'r.jump', { cls: 'sm' }), false)}</div>`, 3)}`)}
</section><aside class="ew-side" aria-label="Comments and activity">
${panel('Comments', `<div class="ew-bar" style="margin-block-end:12px">${seg('Comments', [['Open', 'setCmOpen', 'cmOpen', 'cmOpenN'], ['All', 'setCmAll', 'cmAll', 'cmAllN']])}</div>
${FOR('cmList', 'c', `<div class="{{c.cls}}"><header><span>{{c.who}} · {{c.where}}</span><span>{{c.when}}</span></header><p style="margin:0">{{c.t}}</p>${FOR('c.replies', 'r', '<p class="ew-reply"><b>{{r.who}} · {{r.when}}</b>{{r.t}}</p>', 1)}<div class="ew-rf"><label class="ed-vh" for="rp-{{c.id}}">{{c.replyLabel}}</label><input id="rp-{{c.id}}" type="text" placeholder="Reply" value="{{c.draft}}" onInput="{{c.onDraft}}"><button class="ed-btn sm" onClick="{{c.send}}">Send</button></div><footer><button class="ed-btn sm" onClick="{{c.toggle}}">{{c.label}}</button><button class="ed-btn sm" onClick="{{c.jump}}">Open spread</button></footer></div>`, 2)}
${IF('cmNone', '<div class="ed-empty-note">{{cmNoneLabel}}</div>', false)}
<div class="ew-cmf ed-sec"><div class="ew-curbar">${btn('', 'cmPrev', { icon: 'left', cls: 'sm', dis: 'cmNoPrev', aria: 'Previous spread' })}<b>New comment on {{cmWhere}}</b>${btn('', 'cmNext', { icon: 'right', cls: 'sm', dis: 'cmNoNext', aria: 'Next spread' })}</div><label class="ed-vh" for="cm-new">New comment</label><textarea id="cm-new" class="ed-in" placeholder="What should change on this spread?" value="{{cmDraft}}" onInput="{{onCmDraft}}"></textarea>${btn('Add comment', 'cmAdd', { cls: 'sm pri' })}</div>`)}
${panel('Activity', `${FOR('acList', 'a', `<div class="ew-act"><i class="{{a.dot}}"></i><div>{{a.msg}}<small>{{a.by}} · {{a.when}}</small></div></div>`, 4)}${IF('acNone', '<div class="ed-empty-note">Nothing yet.</div>', false)}`)}
</aside></div>`;

const STEPS = `<ol class="ew-steps" aria-label="Progress">${FOR('sdSteps', 's', '<li class="{{s.cls}}" aria-current="{{s.cur}}"><small>Step {{s.n}}</small>{{s.name}}</li>', 4)}</ol>`;
BODY.send = (S) => S ? (
head('Hand-off', 'The last page before a proof goes out or a design is locked: where the book stands, the print pack, and what the customer asked for.',
  btn('{{sdSendLabel}}', 'sdSend', { icon: 'send', cls: 'pri keep', dis: 'sdNoSend' }) + btn('Lock design', 'sdLock', { icon: 'lock', dis: 'sdNoLock' })) +
`<div class="ew-grid"><section class="ew-col" aria-label="Hand-off">
${panel('Where the book is', STEPS)}
${panel('Ready to send?', `${FOR('sdChecks', 'c', `<div class="{{c.cls}}">${IF('c.ok', ic('tick', 18))}${IF('c.bad', ic('cross', 18), false)}<span>{{c.t}}</span>${IF('c.linkLabel', '<a class="ew-link" href="{{c.href}}">{{c.linkLabel}}</a>', false)}</div>`, 4)}`)}
${panel('{{sdSince}}', `${FOR('sdRows', 'r', '<div class="{{r.cls}}"><b>{{r.kind}}</b><span>{{r.text}}</span></div>', 3)}${IF('sdNoRows', '<div class="ed-empty-note">No changes since the last proof.</div>', false)}`)}
</section><aside class="ew-side" aria-label="Print pack">
${panel('Print pack', `${FOR('sdPack', 'r', `<div class="{{r.cls}}">${IF('r.ok', ic('tick', 18))}${IF('r.bad', ic('cross', 18), false)}<span><b>{{r.name}}</b><br><span class="ed-muted">{{r.t}}</span></span></div>`, 4)}`)}
${IF('sdHasCustNote', panel('Customer note', '<p class="ed-muted" style="color:var(--e-fg)">{{sdCustNote}}</p>'), false)}
${panel('Studio notes', `<div class="ed-field" style="margin:0"><label class="ed-vh" for="sd-notes">Studio notes</label><textarea id="sd-notes" value="{{sdNotes}}" onInput="{{sdOnNotes}}"></textarea></div>`)}
${panel('Export', `<div class="ew-actions"><button class="ed-btn sm" onClick="{{sdExportCsv}}">${ic('download', 16)}Captions (CSV)</button><button class="ed-btn sm" onClick="{{sdExportJson}}">${ic('download', 16)}Book data (JSON)</button></div>`)}
</aside></div>`) : (
head('Send to proof', 'Ask the studio to review your changes and send you the next proof. Check where the book stands first.',
  btn('Print this overview', 'sdPrint', { icon: 'print' })) +
`<div class="ew-grid"><section class="ew-col" aria-label="Send to proof">
${panel('Where your book is', STEPS)}
${panel('Before you send', `${FOR('sdChecks', 'c', `<div class="{{c.cls}}">${IF('c.ok', ic('tick', 18))}${IF('c.bad', ic('cross', 18), false)}<span>{{c.t}}</span>${IF('c.linkLabel', '<a class="ew-link" href="{{c.href}}">{{c.linkLabel}}</a>', false)}</div>`, 4)}<p class="ed-muted ed-sec">None of these block you. The studio can fix most things for you, but every item you clear means a faster proof.</p>`)}
${panel('{{sdSince}}', `${FOR('sdRows', 'r', '<div class="{{r.cls}}"><b>{{r.kind}}</b><span>{{r.text}}</span></div>', 3)}${IF('sdNoRows', '<div class="ed-empty-note">No changes yet. Edit the book first, then come back.</div>', false)}`)}
</section><aside class="ew-side" aria-label="Send">
${panel('Note for the studio', `${IF('sdCanRequest', `<div class="ed-field" style="margin-block:0 12px"><label for="sd-note">Anything the designer should know?</label><textarea id="sd-note" placeholder="For example: please use the sunset photo on the cover." value="{{sdNote}}" onInput="{{onNote}}"></textarea></div><div class="ew-confirm"><button class="ew-sw2" onClick="{{toggleSure}}" aria-pressed="{{sdSureOn}}" aria-label="I have checked my changes"></button><span>I have checked my changes and I am ready for proof round {{sdRound}}.</span></div><div class="ew-actions" style="margin-block-start:14px"><button class="ed-btn pri" onClick="{{sdRequest}}" disabled="{{sdBlock}}">${ic('send')}<span>{{sdReqLabel}}</span></button></div>`)}${IF('sdWait', '<div class="ew-note is-ok">Sent. Rameen will review your changes and send proof round {{sdRound}} within 2 days.</div>', false)}${IF('sdLocked', '<div class="ew-note is-ok">Your design is locked. Nothing left to send.</div>', false)}`)}
</aside></div>`);

/* ---------- static style="" -> utility classes (README: inline style is only for values computed at runtime) ---------- */
const UTIL = {
  'margin:0': 'ew-m0', 'margin-block-start:12px': 'ew-mt12', 'margin-block-start:10px': 'ew-mt10', 'margin-block-start:14px': 'ew-mt14', 'margin-block-start:6px': 'ew-mt6',
  'margin-block-end:12px': 'ew-mb12', 'margin-block-end:14px': 'ew-mb14', 'margin-block:10px': 'ew-my10', 'margin-block:0 12px': 'ew-mb12', 'margin:-4px 0 6px': 'ew-tight',
  'max-inline-size:140px': 'ew-w140', 'color:var(--e-fg)': 'ew-fg', 'grid-template-columns:1fr 1fr': 'ew-two', 'align-self:center': 'ew-selfc'
};
function utilStyles(html, where) {
  return html.replace(/<([a-z0-9-]+)((?:\s[^<>]*?)?)\sstyle="([^"{}]*)"([^<>]*)>/g, (m, tag, a, css, b) => {
    const cls = UTIL[css.trim()]; if (!cls) throw new Error(`static style="${css}" in ${where}: add it to UTIL in build-editor-pages.mjs`);
    const all = a + b;
    return /\sclass="/.test(all) ? `<${tag}${(a + b).replace(/\sclass="([^"]*)"/, ` class="$1 ${cls}"`)}>` : `<${tag} class="${cls}"${a}${b}>`;
  });
}

/* ---------- shells ---------- */
const NAV_HREF = (side, edition) => Object.fromEntries(PAGES.map(([id]) => [id, file(side, edition, id)]));

function topbar(side, edition, page) {
  const s = SIDES[side], h = NAV_HREF(side, edition);
  const kick = s.studio ? 'Book editor · {{order}} · {{owner}}' : 'Live editor · Order {{order}}';
  const last = page === 'send' ? '' : `<a class="ed-btn pri keep" href="${h.send}">${ic('send')}<span class="ed-lbl">${s.sendLabel}</span></a>`;
  return `<div class="ed-top"><div class="ed-title"><p class="ed-kicker">${kick}</p><label class="ed-vh" for="ed-name">Book title</label><input id="ed-name" class="ed-name" type="text" maxlength="40" value="{{title}}" onInput="{{onTitle}}"><p class="ed-meta"><span>{{dates}} · Portrait 8 × 10 · {{stTotal}} pages</span><span class="ed-chip is-ok"><i></i>{{saveLabel}}</span><span class="{{statusCls}}"><i></i>{{statusLabel}}</span></p></div>
<div class="ed-tools"><button class="ed-btn sq" onClick="{{undo}}" disabled="{{noUndo}}" aria-label="Undo">${ic('undo', 20)}</button><button class="ed-btn sq" onClick="{{redo}}" disabled="{{noRedo}}" aria-label="Redo">${ic('redo', 20)}</button>${page === 'flipbook' ? '' : `<a class="ed-btn" href="${h.flipbook}">${ic('eye', 20)}<span class="ed-lbl">Flipbook</span></a>`}${last}</div></div>`;
}
function wsNav(side, edition, page) {
  const s = SIDES[side], h = NAV_HREF(side, edition);
  const badge = { printcheck: IF('hasBadgeCheck', '<b class="{{badgeCheckCls}}">{{badgeCheck}}</b>', false), history: IF('hasBadgeHist', '<b class="ed-badge">{{badgeHist}}</b>', false) };
  return `<!--ws--><nav class="ed-ws" aria-label="Editor pages">${PAGES.map(([id, label, , icon]) => {
    const l = id === 'send' ? s.sendLabel : label;
    return `<a href="${h[id]}"${id === page ? ' aria-current="page"' : ''}>${ic(icon)}<span>${l}</span>${badge[id] || ''}</a>`;
  }).join('')}</nav><!--/ws-->`;
}

function assemble(side, edition, page) {
  const s = SIDES[side], D = edition === 'G';
  const base = rd(`${edition}${s.canvasNum}-${s.canvas}.dc.html`);          // header, menus and footer come from the hand-written canvas page
  const mIdx = base.indexOf('<main id="main"'), eIdx = base.indexOf('</main>'), sIdx = base.indexOf('<script type="text/x-dc"');
  let top = base.slice(0, mIdx), tail = base.slice(eIdx, sIdx), script = base.slice(sIdx);
  const label = PAGES.find((p) => p[0] === page)[1] === 'SEND' ? s.sendLabel : PAGES.find((p) => p[0] === page)[1];
  const title = s.studio ? `${D ? '' : 'Light · '}Studio · Book editor · ${label}` : `${D ? '' : 'Light · '}${label} · Live book editor · Miles Retold`;
  top = top.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  const twin = file(side, D ? 'GL' : 'G', page);
  // dark / light switch points at this page's twin
  top = top.replace(/(<a class="thm" href=")[^"]*(")/, `$1${twin}$2`).replace(/(<a class="rl thr" href=")[^"]*(")/, `$1${twin}$2`).replace(/(<a href=")[^"]*(">(?:Dark|Light) theme<\/a>)/, `$1${twin}$2`);
  top = withAssets(top);
  const h = NAV_HREF(side, edition);
  const main = `<main id="main" class="{{edCls}}">\n${topbar(side, edition, page)}\n${wsNav(side, edition, page)}\n<div class="ew" style="{{styleVars}}">\n${BODY[page](s.studio)}\n</div>\n${IF('hasToast', '<div class="ed-toast" role="status">{{toast}}</div>', false)}\n`;
  const opts = `{ studio: ${s.studio}, light: ${!D}, canvas: '${h.canvas}', pages: ${JSON.stringify({ storyboard: h.storyboard, layouts: h.layouts, printcheck: h.printcheck, history: h.history })} }`;
  if (s.studio) {
    script = `<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":1300}}'>
class Component extends DCLogic {
  constructor(p) { super(p); this.ed = MilesEditorUI.create(this, { studio: true, light: ${!D}, noArrows: true }); this.pg = MilesEditorPages.create('${page}', this.ed, this, ${opts}); this.state = Object.assign({}, this.ed.initial(), this.pg.initial()); }
  componentDidMount() { this.ed.mount(); this.pg.mount(); }
  componentWillUnmount() { this.pg.unmount(); this.ed.unmount(); }
  renderVals() { const v = Object.assign(this.ed.vals(), this.pg.vals()); v.noDel = !v.canDel; return v; }
}
</script>
</body>
</html>
`;
  } else {
    script = script
      .replace(/this\.ed = MilesEditorUI\.create\(this, \{ studio: false, light: (?:true|false) \}\);/, `this.ed = MilesEditorUI.create(this, { studio: false, light: ${!D}, noArrows: true }); this.pg = MilesEditorPages.create('${page}', this.ed, this, ${opts});`)
      .replace('this.ed.initial()); }', 'this.ed.initial(), this.pg.initial()); }')
      .replace('mountPage() { this.ed.mount(); }', 'mountPage() { this.ed.mount(); this.pg.mount(); }')
      .replace('unmountPage() { this.ed.unmount(); }', 'unmountPage() { this.pg.unmount(); this.ed.unmount(); }')
      .replace('const v = this.ed.vals();', 'const v = Object.assign(this.ed.vals(), this.pg.vals());');
  }
  return top + utilStyles(main, `${edition}${page}`) + tail + script;
}

/* head: the shared scripts and the workspace stylesheet (also patched into the two hand-written canvas pages) */
function withAssets(html) {
  if (!html.includes('/editor/pages.js')) html = html.replace('<script src="/editor/ui.js"></script>', '<script src="/editor/ui.js"></script>\n<script src="/editor/pages.js"></script>');
  if (!html.includes('/css/editor-pages.css')) html = html.replace('<link rel="stylesheet" href="/css/editor.css">', '<link rel="stylesheet" href="/css/editor.css">\n<link rel="stylesheet" href="/css/editor-pages.css">');
  return html;
}

/* the hand-written canvas pages: add the workspace tabs under the title bar, and the book-look variables */
function patchCanvas(side, edition) {
  const s = SIDES[side], f = `${edition}${s.canvasNum}-${s.canvas}.dc.html`;
  let html = withAssets(rd(f));
  html = html.replace(/<!--ws-->[\s\S]*?<!--\/ws-->/, '');
  html = html.replace('<div class="ed-grid">', `${wsNav(side, edition, 'canvas')}\n<div class="ed-grid" style="{{styleVars}}">`);
  html = html.replace('<div class="ed-prev" role="dialog"', '<div class="ed-prev" style="{{styleVars}}" role="dialog"');
  const twin = file(side, edition === 'G' ? 'GL' : 'G', 'canvas');
  html = html.replace(/(<a class="thm" href=")[^"]*(")/, `$1${twin}$2`).replace(/(<a class="rl thr" href=")[^"]*(")/, `$1${twin}$2`).replace(/(<a href=")[^"]*(">(?:Dark|Light) theme<\/a>)/, `$1${twin}$2`);
  wr(f, html);
}

/* ---------- run ---------- */
let n = 0;
for (const side of Object.keys(SIDES)) for (const edition of ['G', 'GL']) {
  patchCanvas(side, edition);
  for (const [id] of PAGES) { if (id === 'canvas') continue; wr(file(side, edition, id), assemble(side, edition, id)); n++; }
}
console.log(`built ${n} pages, patched 4 canvas pages`);
