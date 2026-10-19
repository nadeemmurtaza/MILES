/* Miles Retold · design-only pages (privacy, security, editor extras, studio compliance).
   These pages show how a feature could look and feel to a client. Nothing is saved, uploaded or enforced: every control only
   changes what is on the page, and a reload puts it back. (Same idea as the Team & permissions demo pages.)

     constructor: this.dz = MilesDesign.create('consent', this, { links: {...} });  this.state = Object.assign({...}, this.dz.initial());
     componentDidMount: this.dz.mount();   componentWillUnmount: this.dz.unmount();   renderVals: Object.assign(base, this.dz.vals())

   Pages: privacy · upload · share · consent · delete · views · security · smart · approvals · arabic · tripmap · shortcuts
          photoaccess · audit · retention · compliance · export                                                        */
(function () {
  'use strict';
  var IMG = ['1bebe18032c3ba7f722debbe5fa70f36', 'd79cb5916bf021b810ad3e0168beec13', '6dc6964be6ca87733a870c819d870936', '40f21930485ef5903566224ed85a9273',
    '44c3ed2b417e619b81afb56289c69c25', 'd4b2aafa1f1446ed8701326e3284b455', '3936155b1de2d6f9d237753228c056d0', '6b43c91be8c10d0cbed5dc2520dde00d',
    '8384abb23ebdfeb24e7152bf3fdd1a9b', 'b305aa7d0c1ed679fe60219a9e088e10', '2523c5562a95c13a7e6113539f573d2d', 'ae8f12954b4a72155451fa4ddff588b7'];
  function src(i) { return '/_blob/' + IMG[i % IMG.length]; }
  function on(v) { return v ? 'true' : 'false'; }
  function plural(n, w, m) { return n + ' ' + (n === 1 ? w : (m || w + 's')); }
  var B = {};
  B.static = function () { return { vals: function () { return {}; } }; };   /* pages with no behaviour of their own (notifications, emails, interface kit): the header and footer still need the shell */

  /* every page can show a short confirmation message */
  function toaster(x) {
    var t = 0;
    return { say: function (m) { x.set({ toast: m }); clearTimeout(t); t = setTimeout(function () { x.set({ toast: '' }); }, 2800); }, stop: function () { clearTimeout(t); } };
  }

  /* ===== PRIVACY CENTRE ===== */
  B.privacy = function (x) {
    var timer = 0;
    var CHECKS = [
      ['Photos are stored privately', 'Nobody can open a photo without signing in. Links to photos stop working after a few minutes.'],
      ['Location is removed from your photos', 'Where a picture was taken is stripped when you upload it. The date stays, so the book keeps its order.'],
      ['Only you and your designer can open this book', 'The studio sees it while your order is active. Nobody else does.'],
      ['Sharing is off until you turn it on', 'You choose who gets a link, for how long, and at what quality.'],
      ['Your photos are not used for marketing', 'We only show your pages in our Lookbook or on social media if you say yes.'],
      ['Your files are deleted after delivery', 'Originals are removed after the time you choose. You can delete them sooner.']
    ];
    return {
      initial: function () { return { n: CHECKS.length, run: false }; },
      unmount: function () { clearInterval(timer); },
      vals: function () {
        var s = x.S(), L = x.opts.links;
        return {
          pvChecks: CHECKS.map(function (c, i) { return { t: c[0], d: c[1], done: i < s.n, wait: i >= s.n, cls: 'dp-chk' + (i < s.n ? ' is-good' : '') }; }),
          pvRun: function () { if (s.run) return; x.set({ n: 0, run: true }); clearInterval(timer); timer = setInterval(function () { var n = x.S().n + 1; if (n >= CHECKS.length) { clearInterval(timer); x.set({ n: CHECKS.length, run: false }); } else x.set({ n: n }); }, 420); },
          pvRunLabel: s.run ? 'Checking…' : 'Check again', pvBusy: s.run,
          pvPeople: [
            { n: 'Sara A.', r: 'You · owner', d: 'Can see, edit and share everything in this book.', av: 'S' },
            { n: 'Rameen', r: 'Designer · Miles Retold', d: 'Can open and edit while your order is active.', av: 'R' },
            { n: 'Print partner', r: 'Printer', d: 'Receives the print files only when you approve the design. Never your original photos.', av: 'P' }
          ],
          pvCards: [
            { t: 'Add photos safely', d: 'See what happens to a photo the moment you add it.', href: L.upload }, { t: 'Share a proof', d: 'Links that expire, with a preview quality you choose.', href: L.share },
            { t: 'Your choices', d: 'Decide what we may and may not do.', href: L.consent }, { t: 'Delete your photos', d: 'Keep them for as long as you like, or none of it.', href: L.del },
            { t: 'Who has looked', d: 'A plain list of every time something was opened.', href: L.views }, { t: 'Sign-in and devices', d: 'Where you are signed in, and how to sign out.', href: L.security }
          ]
        };
      }
    };
  };

  /* ===== PROTECTED UPLOAD ===== */
  B.upload = function (x) {
    var timer = 0, T = toaster(x), NAMES = ['IMG_2041.HEIC', 'IMG_2042.HEIC', 'IMG_2043.JPG', 'IMG_2050.HEIC', 'IMG_2051.JPG', 'IMG_2058.HEIC'];
    var STAGES = ['Waiting', 'Uploading', 'Removing location', 'Locking away', 'Ready'];
    return {
      initial: function () { return { files: [{ id: 1, name: 'IMG_2038.HEIC', st: 4, img: 0 }, { id: 2, name: 'IMG_2039.JPG', st: 4, img: 3 }], strip: true, busy: false, toast: '' }; },
      unmount: function () { clearInterval(timer); T.stop(); },
      vals: function () {
        var s = x.S();
        function add() {
          if (s.busy) return;
          var base = s.files.length, extra = [0, 1, 2].map(function (i) { return { id: base + i + 10, name: NAMES[(base + i) % NAMES.length], st: 0, img: (base + i + 4) % 12 }; });
          x.set({ files: s.files.concat(extra), busy: true });
          clearInterval(timer);
          timer = setInterval(function () {
            var f = x.S().files.map(function (q) { return q.st < 4 && q.id >= base + 10 ? Object.assign({}, q, { st: q.st + 1 }) : q; });
            var all = f.every(function (q) { return q.st === 4; });
            x.set({ files: f, busy: !all }); if (all) { clearInterval(timer); T.say('3 photos added and protected'); }
          }, 650);
        }
        return {
          upFiles: s.files.map(function (f) {
            var stages = STAGES.map(function (n, i) { return { n: n, cls: 'dp-st' + (i < f.st ? ' done' : i === f.st ? ' now' : '') }; });
            var skip = !s.strip && f.st >= 2;
            return { name: f.name, src: src(f.img), stage: f.st === 4 ? 'Protected' : STAGES[f.st], ready: f.st === 4, work: f.st < 4, steps: stages.slice(1, 4), pct: Math.min(100, f.st * 25), bar: 'transform:scaleX(' + (f.st / 4).toFixed(2) + ')', note: f.st === 4 ? (s.strip ? 'Location removed · date kept' : 'Location kept at your request') : '', warn: !s.strip && f.st === 4 };
          }),
          upAdd: add, upBusy: s.busy, upAddLabel: s.busy ? 'Adding…' : 'Add 3 photos',
          upStrip: on(s.strip), upToggle: function () { x.set({ strip: !s.strip }); }, upStripOn: s.strip, upStripOff: !s.strip,
          upBeforeRows: [['Taken', '12 March 2022, 4:12 pm', ''], ['Camera', 'iPhone 14', ''], ['Location', '4.1755° N, 73.5093° E', 'risk'], ['Orientation', 'Portrait', '']].map(function (r) { return { k: r[0], v: r[1], cls: r[2] }; }),
          upAfter: [['Taken', '12 March 2022, 4:12 pm', ''], ['Camera', 'Removed', 'gone'], ['Location', s.strip ? 'Removed' : '4.1755° N, 73.5093° E', s.strip ? 'gone' : 'risk'], ['Orientation', 'Portrait', '']].map(function (r) { return { k: r[0], v: r[1], cls: r[2] }; }),
          upCount: plural(s.files.filter(function (f) { return f.st === 4; }).length, 'photo') + ' ready'
        };
      }
    };
  };

  /* ===== SHARE LINKS ===== */
  B.share = function (x) {
    var T = toaster(x), n = 0;
    return {
      initial: function () {
        return { who: 'code', exp: '7d', qual: 'preview', cm: true, toast: '', links: [
          { id: 'k9x2-4fqa', who: 'Needs a code', exp: 'Expires in 6 days', views: 3, qual: 'Preview, watermarked', live: true, to: 'Mum' },
          { id: 'p3m8-7ruw', who: 'Anyone with the link', exp: 'Expired 2 days ago', views: 11, qual: 'Preview, watermarked', live: false, to: 'Office group' }] };
      },
      unmount: T.stop,
      vals: function () {
        var s = x.S(), EXP = { '24h': 'Expires in 24 hours', '7d': 'Expires in 7 days', '30d': 'Expires in 30 days' };
        function opt(key, id, label) { return { label: label, on: on(s[key] === id), pick: function () { var o = {}; o[key] = id; x.set(o); } }; }
        return {
          shWho: [opt('who', 'code', 'Needs a code'), opt('who', 'anyone', 'Anyone with the link')], shExp: [opt('exp', '24h', '24 hours'), opt('exp', '7d', '7 days'), opt('exp', '30d', '30 days')],
          shQual: [opt('qual', 'preview', 'Preview, watermarked'), opt('qual', 'full', 'Full quality flipbook')],
          shCm: on(s.cm), shCmToggle: function () { x.set({ cm: !s.cm }); },
          shWarn: s.who === 'anyone' || s.qual === 'full', shWarnText: s.who === 'anyone' && s.qual === 'full' ? 'Anyone who gets this link can see your pages at full quality until it expires.' : s.who === 'anyone' ? 'Anyone who gets this link can open it. A code sent to your WhatsApp keeps it between you and one person.' : 'Full quality shows your photos sharp enough to copy. A watermarked preview is safer.',
          shCreate: function () { n++; var id = 'n' + n + 'q-' + Math.random().toString(36).slice(2, 6); x.set({ links: [{ id: id, who: s.who === 'code' ? 'Needs a code' : 'Anyone with the link', exp: EXP[s.exp], views: 0, qual: s.qual === 'preview' ? 'Preview, watermarked' : 'Full quality flipbook', live: true, to: 'New link' }].concat(s.links) }); T.say('Link created. Nothing is shared until you send it.'); },
          shLinks: s.links.map(function (l) { return { url: '…/share/' + l.id, who: l.who, exp: l.exp, views: plural(l.views, 'view'), qual: l.qual, live: l.live, dead: !l.live, to: l.to, cls: 'dp-link' + (l.live ? '' : ' off'), copy: function () { T.say('Link copied'); }, revoke: function () { x.set({ links: s.links.map(function (q) { return q.id === l.id ? Object.assign({}, q, { live: false, exp: 'Turned off just now' }) : q; }) }); T.say('Link turned off. It stops working straight away.'); } }; }),
          shActive: s.links.filter(function (l) { return l.live; }).length
        };
      }
    };
  };

  /* ===== CONSENT ===== */
  B.consent = function (x) {
    var T = toaster(x);
    var ROWS = [
      ['print', 'Print my book', 'We need your photos to design and print the book. Without this we cannot make it.', true, true],
      ['whatsapp', 'WhatsApp updates about this order', 'Proofs, balance reminders and shipping news. Nothing else.', true, false],
      ['device', 'Smart help on my device', 'Find duplicates and suggest chapters. It runs on your phone or laptop: the photos never leave it for this.', true, false],
      ['lookbook', 'Show pages of my book in the Lookbook', 'Pages could appear on our website. We would ask you which pages, and you can take them down any time.', false, false],
      ['social', 'Share pictures of my book on social media', 'Our Instagram. Photos of the book itself, not your private photos.', false, false],
      ['analytics', 'Anonymous usage statistics', 'Which buttons get used, so we can make the editor easier. Never your photos, captions or names.', false, false]
    ];
    return {
      initial: function () { var o = {}; ROWS.forEach(function (r) { o[r[0]] = r[3]; }); return { on: o, at: {}, toast: '' }; },
      unmount: T.stop,
      vals: function () {
        var s = x.S();
        return {
          cnRows: ROWS.map(function (r) {
            return { t: r[1], d: r[2], locked: r[4], free: !r[4], on: on(s.on[r[0]]), isOn: s.on[r[0]], when: s.at[r[0]] || (r[4] ? 'Required' : 'Not changed'),
              flip: function () { if (r[4]) return; var o = Object.assign({}, s.on), a = Object.assign({}, s.at); o[r[0]] = !o[r[0]]; a[r[0]] = 'Changed just now'; x.set({ on: o, at: a }); T.say(o[r[0]] ? 'Saved: you said yes' : 'Saved: you said no'); },
              label: r[1] + (s.on[r[0]] ? ', on' : ', off') };
          }),
          cnOnN: ROWS.filter(function (r) { return s.on[r[0]]; }).length, cnTotal: ROWS.length,
          cnAllOff: function () { var o = {}, a = {}; ROWS.forEach(function (r) { o[r[0]] = r[4]; if (!r[4]) a[r[0]] = 'Changed just now'; }); x.set({ on: o, at: a }); T.say('Everything optional is off'); }
        };
      }
    };
  };

  /* ===== DELETE & KEEP ===== */
  B.del = function (x) {
    var timer = 0, T = toaster(x);
    return {
      initial: function () { return { keep: '90', ask: false, typed: '', gone: false, zip: 0, toast: '' }; },
      unmount: function () { clearInterval(timer); T.stop(); },
      vals: function () {
        var s = x.S();
        function opt(id, label) { return { label: label, on: on(s.keep === id), pick: function () { x.set({ keep: id }); } }; }
        var steps = [['Order placed', 'You added photos and we started designing.', true], ['Book delivered', 'Your copy arrives.', true], ['Originals deleted', 'Your original photos are removed ' + s.keep + ' days after delivery.', false], ['Design file kept', 'A low-resolution copy of the finished book stays, so we can reprint it if you ask.', false]];
        return {
          dlOpts: [opt('30', '30 days'), opt('90', '90 days'), opt('180', '6 months')],
          dlSteps: steps.map(function (r, i) { return { t: r[0], d: r[1], done: r[2], cls: 'dp-tl' + (r[2] ? ' done' : '') }; }),
          dlKeep: s.keep === '180' ? '6 months' : s.keep + ' days',
          dlZip: s.zip > 0 && s.zip < 100, dlZipReady: s.zip >= 100, dlZipBar: 'transform:scaleX(' + (Math.min(s.zip, 100) / 100).toFixed(2) + ')', dlZipIdle: s.zip === 0,
          dlExport: function () { if (s.zip > 0) return; x.set({ zip: 1 }); clearInterval(timer); timer = setInterval(function () { var z = x.S().zip + 14; if (z >= 100) { clearInterval(timer); x.set({ zip: 100 }); T.say('Your download is ready'); } else x.set({ zip: z }); }, 260); },
          dlAsk: s.ask && !s.gone, dlOpen: function () { x.set({ ask: true, typed: '' }); }, dlCancel: function () { x.set({ ask: false, typed: '' }); },
          dlTyped: s.typed, dlOnType: function (e) { x.set({ typed: e.target.value }); }, dlCanDelete: s.typed.trim().toUpperCase() === 'DELETE', dlNoDelete: s.typed.trim().toUpperCase() !== 'DELETE',
          dlDelete: function () { x.set({ gone: true, ask: false }); }, dlGone: s.gone, dlLive: !s.gone,
          dlUndo: function () { x.set({ gone: false }); }
        };
      }
    };
  };

  /* ===== WHO HAS LOOKED ===== */
  B.views = function (x) {
    var E = [
      ['studio', 'Rameen (Studio)', 'opened spread 3 to fix your comment', 'Today, 10:42', 'Riyadh · studio laptop'], ['link', 'Share link …k9x2-4fqa', 'was opened (needed the code)', 'Today, 09:15', 'Riyadh · iPhone'],
      ['studio', 'Rameen (Studio)', 'sent proof round 2 to you', 'Yesterday, 17:30', 'Studio'], ['you', 'You', 'signed in with a WhatsApp code', 'Yesterday, 16:02', 'Riyadh · this phone'],
      ['link', 'Share link …k9x2-4fqa', 'was opened (needed the code)', 'Mon, 20:11', 'Jeddah · Android'], ['studio', 'Noor K. (Studio)', 'checked the print sharpness', 'Mon, 11:48', 'Lahore · studio laptop'],
      ['print', 'Print partner', 'is scheduled to receive print files after you approve', 'Not yet', 'Not sent'], ['link', 'Share link …p3m8-7ruw', 'was turned off after it expired', 'Sat, 08:00', 'Automatic']
    ];
    return {
      initial: function () { return { f: 'all' }; },
      vals: function () {
        var s = x.S(), list = E.filter(function (r) { return s.f === 'all' || r[0] === s.f; });
        function f(id, label) { var n = id === 'all' ? E.length : E.filter(function (r) { return r[0] === id; }).length; return { label: label, n: n, on: on(s.f === id), pick: function () { x.set({ f: id }); } }; }
        return {
          vwFilters: [f('all', 'Everything'), f('studio', 'Studio team'), f('link', 'Share links'), f('print', 'Printer'), f('you', 'You')],
          vwRows: list.map(function (r) { return { who: r[1], what: r[2], when: r[3], where: r[4], kind: r[0], cls: 'dp-ev ' + r[0] }; }), vwNone: list.length === 0,
          vwSummary: [['Studio team', E.filter(function (r) { return r[0] === 'studio'; }).length + ' times this week'], ['Share links', E.filter(function (r) { return r[0] === 'link'; }).length + ' opens'], ['Print partner', 'Nothing sent yet']].map(function (r) { return { k: r[0], v: r[1] }; })
        };
      }
    };
  };

  /* ===== SIGN-IN AND DEVICES ===== */
  B.security = function (x) {
    var T = toaster(x);
    return {
      initial: function () { return { devs: [{ id: 1, n: 'iPhone · Safari', w: 'This device · Riyadh', now: true }, { id: 2, n: 'MacBook · Chrome', w: 'Last used 2 days ago · Riyadh', now: false }, { id: 3, n: 'Android · Chrome', w: 'Last used 3 weeks ago · Jeddah', now: false }], alerts: true, tries: 0, toast: '' }; },
      unmount: T.stop,
      vals: function () {
        var s = x.S();
        return {
          scDevs: s.devs.map(function (d) { return { n: d.n, w: d.w, now: d.now, other: !d.now, out: function () { x.set({ devs: s.devs.filter(function (q) { return q.id !== d.id; }) }); T.say('Signed out of ' + d.n); } }; }),
          scOutAll: function () { x.set({ devs: s.devs.filter(function (q) { return q.now; }) }); T.say('Signed out everywhere else'); }, scOthers: s.devs.filter(function (d) { return !d.now; }).length > 0,
          scAlerts: on(s.alerts), scAlertsToggle: function () { x.set({ alerts: !s.alerts }); },
          scTries: s.tries, scTry: function () { x.set({ tries: Math.min(3, s.tries + 1) }); }, scReset: function () { x.set({ tries: 0 }); },
          scLocked: s.tries >= 3, scOpen: s.tries < 3, scTriesLabel: s.tries === 0 ? '3 tries left' : s.tries < 3 ? (3 - s.tries) + ' tries left' : 'No tries left',
          scDots: [0, 1, 2].map(function (i) { return { cls: 'dp-try' + (i < s.tries ? ' used' : '') }; }),
          scRules: [['Your code works once', 'And only for 10 minutes. Then you ask for a new one.'], ['Three tries', 'After three wrong codes you wait before asking again.'], ['We never pre-fill it', 'The code arrives on your WhatsApp. Nobody sees it but you.'], ['We tell you about new sign-ins', 'A WhatsApp message when a new device signs in to your account.']].map(function (r) { return { t: r[0], d: r[1] }; })
        };
      }
    };
  };

  /* ===== SMART HELP (on the device) ===== */
  B.smart = function (x) {
    var T = toaster(x);
    var DAYS = [['Fri 11 March', 'Arriving', [0, 1, 2, 3]], ['Sat 12 March', 'The first morning', [4, 5, 6, 7, 8]], ['Sun 13 March', 'Boat day', [9, 10, 11]], ['Mon 14 March', 'Last night', [2, 5]]];
    return {
      initial: function () { return { assist: true, made: false, dupGone: false, faces: true, toast: '' }; },
      unmount: T.stop,
      vals: function () {
        var s = x.S();
        return {
          smOn: on(s.assist), smToggle: function () { x.set({ assist: !s.assist }); }, smEnabled: s.assist, smDisabled: !s.assist,
          smDays: DAYS.map(function (d) { return { day: d[0], name: d[1], n: plural(d[2].length, 'photo'), thumbs: d[2].map(function (i) { return { src: src(i) }; }) }; }),
          smMake: function () { x.set({ made: true }); T.say('Chapters made. You can rename or move any of them.'); }, smMade: s.made, smNotMade: !s.made,
          smDup: [[0, 'Same photo twice (kept)', false], [1, 'Same photo twice', true], [7, 'A little blurry', true], [11, 'Very dark', true]].map(function (r) { return { src: src(r[0]), t: r[1], cls: s.dupGone && r[2] ? 'dp-aside' : '' }; }),
          smClean: function () { x.set({ dupGone: true }); T.say('Set aside. Nothing is deleted: you can bring them back.'); }, smCleaned: s.dupGone, smNotCleaned: !s.dupGone,
          smFacesOn: on(s.faces), smFacesToggle: function () { x.set({ faces: !s.faces }); },
          smCropA: 'object-position:50% 50%', smCropB: 'object-position:50% 12%', smFaces: s.faces, smNoFaces: !s.faces, smSrc: src(6),
          smShape: true
        };
      }
    };
  };

  /* ===== PINNED COMMENTS AND SPREAD APPROVAL ===== */
  B.approvals = function (x) {
    var T = toaster(x);
    var PINS = [[{ x: 34, y: 38, n: 1, who: 'Sara', t: 'Can the sunset fill the whole left page?' }], [{ x: 62, y: 30, n: 1, who: 'Sara', t: 'Please brighten this one a little.' }], [], [{ x: 78, y: 70, n: 1, who: 'Sara', t: 'Maybe add our wedding date in the corner?' }, { x: 22, y: 24, n: 2, who: 'Rameen', t: 'Added a line for it on the left. Check the spelling.' }], [], []];
    var LABEL = { approved: 'Approved', changes: 'Changes asked', review: 'To review' };
    return {
      initial: function () { return { sel: 3, st: ['approved', 'approved', 'changes', 'changes', 'review', 'review'], locked: false, draft: '', pins: PINS, toast: '' }; },
      unmount: T.stop,
      vals: function () {
        var s = x.S(), appr = s.st.filter(function (q) { return q === 'approved'; }).length, cur = s.pins[s.sel];
        function set(i, v) { var st = s.st.slice(); st[i] = v; x.set({ st: st }); }
        return {
          apCards: s.st.map(function (q, i) { return { n: i + 1, src: src([0, 1, 3, 6, 8, 11][i]), st: q, label: LABEL[q], cls: 'dp-ap ' + q + (i === s.sel ? ' sel' : ''), on: on(i === s.sel), pick: function () { x.set({ sel: i }); }, aria: 'Spread ' + (i + 1) + ', ' + LABEL[q] }; }),
          apSel: s.sel + 1, apSrc: src([0, 1, 3, 6, 8, 11][s.sel]), apStatus: LABEL[s.st[s.sel]], apStatusCls: 'dp-badge ' + s.st[s.sel],
          apPins: cur.map(function (p) { return { n: p.n, pos: 'left:' + p.x + '%;top:' + p.y + '%', label: 'Comment ' + p.n + ' by ' + p.who }; }),
          apThread: cur.map(function (p) { return { n: p.n, who: p.who, t: p.t, mine: p.who === 'Sara' }; }), apNoThread: cur.length === 0,
          apApprove: function () { set(s.sel, 'approved'); T.say('Spread ' + (s.sel + 1) + ' approved'); }, apChange: function () { set(s.sel, 'changes'); T.say('Changes asked on spread ' + (s.sel + 1)); },
          apIsApproved: s.st[s.sel] === 'approved', apNotApproved: s.st[s.sel] !== 'approved',
          apDraft: s.draft, apOnDraft: function (e) { x.set({ draft: e.target.value }); },
          apAdd: function () { var t = (s.draft || '').trim(); if (!t) return; var pins = s.pins.slice(); pins[s.sel] = pins[s.sel].concat([{ x: 40 + pins[s.sel].length * 12, y: 55, n: pins[s.sel].length + 1, who: 'Sara', t: t }]); x.set({ pins: pins, draft: '' }); T.say('Pinned to the photo'); },
          apProg: appr + ' of ' + s.st.length + ' spreads approved', apBar: 'transform:scaleX(' + (appr / s.st.length).toFixed(2) + ')', apAll: appr === s.st.length, apNotAll: appr !== s.st.length,
          apLock: function () { x.set({ locked: true }); T.say('Design locked (preview only)'); }, apLocked: s.locked, apOpen: !s.locked,
          apLeft: s.st.length - appr
        };
      }
    };
  };

  /* ===== ARABIC AND BILINGUAL CAPTIONS ===== */
  B.arabic = function (x) {
    return {
      initial: function () { return { lang: 'both', date: 'both', font: 'plex', en: 'The first morning', ar: 'الصباح الأول', size: 'm' }; },
      vals: function () {
        var s = x.S();
        function opt(key, id, label) { return { label: label, on: on(s[key] === id), pick: function () { var o = {}; o[key] = id; x.set(o); } }; }
        var dEn = '12 March 2022', dAr = '١٢ مارس ٢٠٢٢', hEn = '9 Sha‘ban 1443', hAr = '٩ شعبان ١٤٤٣';
        var dateEn = s.date === 'gregorian' ? dEn : s.date === 'hijri' ? hEn : dEn + ' · ' + hEn, dateAr = s.date === 'gregorian' ? dAr : s.date === 'hijri' ? hAr : dAr + ' · ' + hAr;
        return {
          arLang: [opt('lang', 'en', 'English'), opt('lang', 'ar', 'العربية'), opt('lang', 'both', 'Both')], arDate: [opt('date', 'gregorian', 'Gregorian'), opt('date', 'hijri', 'Hijri'), opt('date', 'both', 'Both')],
          arFont: [opt('font', 'plex', 'Plex Arabic'), opt('font', 'amiri', 'Amiri')], arSize: [opt('size', 's', 'Small'), opt('size', 'm', 'Medium'), opt('size', 'l', 'Large')],
          arEn: s.en, arAr: s.ar, arOnEn: function (e) { x.set({ en: e.target.value }); }, arOnAr: function (e) { x.set({ ar: e.target.value }); },
          arShowEn: s.lang !== 'ar', arShowAr: s.lang !== 'en', arDateEn: dateEn, arDateAr: dateAr,
          arPageCls: 'dp-arpage ' + s.size + (s.font === 'amiri' ? ' amiri' : ''),
          arNotes: [['Text runs right to left', 'Cursor, punctuation and numbers follow Arabic rules, even when a caption mixes both languages.'], ['The book keeps its own direction', 'An Arabic book opens from the right. You can choose that when you start a book.'], ['A native reader checks it', 'Every Arabic string here is a sample. Have a native reader review it before launch.']].map(function (r) { return { t: r[0], d: r[1] }; })
        };
      }
    };
  };

  /* ===== TRIP MAP ===== */
  B.tripmap = function (x) {
    var T = toaster(x);
    return {
      initial: function () { return { stops: ['Malé', 'Maafushi', 'Dhigurah', 'Ukulhas'], style: 'line', gps: false, name: '', toast: '' }; },
      unmount: T.stop,
      vals: function () {
        var s = x.S(), n = s.stops.length, pts = s.stops.map(function (nm, i) { return { x: n < 2 ? 50 : 12 + i * (76 / (n - 1)), y: 34 + Math.sin(i * 1.3 + .4) * 17 + (i % 2 ? 6 : -4), n: nm }; });
        var d = pts.map(function (p, i) { if (!i) return 'M' + p.x.toFixed(1) + ' ' + p.y.toFixed(1); var q = pts[i - 1], mx = (q.x + p.x) / 2, my = Math.min(q.y, p.y) - (s.style === 'arc' ? 14 : 0); return 'Q' + mx.toFixed(1) + ' ' + (s.style === 'arc' ? my : (q.y + p.y) / 2 + (i % 2 ? 6 : -6)).toFixed(1) + ' ' + p.x.toFixed(1) + ' ' + p.y.toFixed(1); }).join(' ');
        function opt(id, label) { return { label: label, on: on(s.style === id), pick: function () { x.set({ style: id }); } }; }
        return {
          tmD: d, tmDash: s.style === 'dots' ? '1 4' : s.style === 'arc' ? '5 3' : '0', tmStyle: [opt('line', 'Line'), opt('dots', 'Dots'), opt('arc', 'Flights')],
          tmPts: pts.map(function (p, i) { return { cx: p.x.toFixed(1), cy: p.y.toFixed(1), pos: 'left:' + p.x.toFixed(1) + '%;top:' + ((p.y > 46 ? p.y - 11 : p.y + 3.5) / 64 * 100).toFixed(1) + '%', n: p.n, i: i + 1 }; }),
          tmStops: s.stops.map(function (nm, i) { return { n: nm, i: i + 1, up: function () { if (!i) return; var a = s.stops.slice(); var t = a[i]; a[i] = a[i - 1]; a[i - 1] = t; x.set({ stops: a }); }, down: function () { if (i === n - 1) return; var a = s.stops.slice(); var t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; x.set({ stops: a }); }, del: function () { x.set({ stops: s.stops.filter(function (q, k) { return k !== i; }) }); }, noUp: i === 0, noDown: i === n - 1 }; }),
          tmName: s.name, tmOnName: function (e) { x.set({ name: e.target.value }); }, tmAdd: function () { var t = (s.name || '').trim(); if (!t) return; x.set({ stops: s.stops.concat([t]), name: '' }); T.say(t + ' added to the route'); },
          tmGps: on(s.gps), tmGpsToggle: function () { x.set({ gps: !s.gps }); }, tmGpsOn: s.gps,
          tmDays: [['Fri', 'Malé', 'Arrive, sunset on the jetty'], ['Sat', 'Maafushi', 'The first morning, market stall'], ['Sun', 'Dhigurah', 'Boat day'], ['Mon', 'Ukulhas', 'Last night']].map(function (r) { return { d: r[0], p: r[1], t: r[2] }; }),
          tmCount: plural(n, 'stop')
        };
      }
    };
  };

  /* ===== SHORTCUTS AND ACCESSIBILITY ===== */
  B.shortcuts = function (x) {
    var T = toaster(x);
    var KEYS = [
      [['←', '→'], 'Previous / next spread', true], [['Ctrl', 'Z'], 'Undo', true], [['Ctrl', 'Shift', 'Z'], 'Redo', true], [['Delete'], 'Take the photo out of the selected frame', true], [['Esc'], 'Close preview', true],
      [['Ctrl', 'scroll'], 'Zoom the selected photo', true], [['M'], 'Move the selected photo to another frame (choose with the arrow keys)', false], [['+', '−'], 'Zoom the selected photo', false], [['Shift', '←', '→', '↑', '↓'], 'Move what shows inside the frame', false], [['?'], 'Show this list anywhere', false]
    ];
    var ALT = [[0, 'Jetty at sunset with two small boats'], [3, ''], [6, 'Sara looking down, smiling, in soft light'], [9, '']];
    return {
      initial: function () { return { reduce: false, big: false, contrast: false, alts: ALT.map(function (a) { return a[1]; }), toast: '' }; },
      unmount: T.stop,
      vals: function () {
        var s = x.S();
        function tg(key, label, d) { return { label: label, d: d, on: on(s[key]), flip: function () { var o = {}; o[key] = !s[key]; x.set(o); } }; }
        return {
          shKeys: KEYS.map(function (k) { return { keys: k[0].map(function (c) { return { c: c }; }), t: k[1], live: k[2], soon: !k[2] }; }),
          shOpts: [tg('reduce', 'Reduce motion', 'No page-turn or sliding animations.'), tg('big', 'Larger buttons', 'Bigger touch targets on every screen.'), tg('contrast', 'Stronger contrast', 'Darker text and clearer outlines.')],
          shPrev: 'dp-prev' + (s.contrast ? ' hc' : '') + (s.big ? ' bigbtn' : ''),
          shAlt: ALT.map(function (a, i) { return { src: src(a[0]), v: s.alts[i], empty: !s.alts[i].trim(), onIn: function (e) { var q = s.alts.slice(); q[i] = e.target.value; x.set({ alts: q }); }, auto: function () { var q = s.alts.slice(); q[i] = 'A holiday photo: people and a sunny place (suggested on your device, please check)'; x.set({ alts: q }); T.say('Suggestion added. Please read it and correct it.'); }, id: 'alt' + i }; }),
          shAltDone: s.alts.filter(function (a) { return a.trim(); }).length, shAltTotal: s.alts.length
        };
      }
    };
  };

  /* ===== STUDIO: WHO CAN OPEN PHOTOS ===== */
  B.photoaccess = function (x) {
    var T = toaster(x);
    var ROLES = ['Designer', 'Print operator', 'Customer support', 'Studio owner'];
    var ACTS = ['See previews', 'See full-size photos', 'Download originals', 'Export print files', 'Delete photos'];
    var DEF = [[1, 1, 0, 0, 0], [0, 0, 0, 1, 0], [1, 0, 0, 0, 0], [1, 1, 1, 1, 1]];
    return {
      initial: function () { return { m: DEF, grants: [{ w: 'Noor K.', why: 'Colour-check order MR-1038', left: 'Ends in 3 h', live: true }], req: false, reason: '', toast: '' }; },
      unmount: T.stop,
      vals: function () {
        var s = x.S();
        return {
          paActs: ACTS.map(function (a) { return { a: a }; }),
          paRows: ROLES.map(function (r, ri) { return { r: r, cells: ACTS.map(function (a, ai) { var v = !!s.m[ri][ai]; return { on: on(v), label: r + ': ' + a + (v ? ', allowed' : ', not allowed'), flip: function () { var m = s.m.map(function (row) { return row.slice(); }); m[ri][ai] = m[ri][ai] ? 0 : 1; x.set({ m: m }); T.say('Updated (preview only)'); } }; }) }; }),
          paGrants: s.grants.map(function (g, i) { return { w: g.w, why: g.why, left: g.left, live: g.live, end: function () { var q = s.grants.slice(); q[i] = Object.assign({}, g, { live: false, left: 'Ended just now' }); x.set({ grants: q }); T.say('Access ended'); } }; }),
          paReq: s.req, paOpen: function () { x.set({ req: true }); }, paClose: function () { x.set({ req: false, reason: '' }); },
          paReason: s.reason, paOnReason: function (e) { x.set({ reason: e.target.value }); }, paCanSend: s.reason.trim().length > 8, paNoSend: s.reason.trim().length <= 8,
          paSend: function () { x.set({ grants: [{ w: 'You', why: s.reason.trim(), left: 'Waiting for the owner to approve', live: true }].concat(s.grants), req: false, reason: '' }); T.say('Request sent to the studio owner'); }
        };
      }
    };
  };

  /* ===== STUDIO: ACCESS LOG ===== */
  B.audit = function (x) {
    var E = [
      ['staff', 'Rameen', 'Opened spread 3', 'MR-1042', 'Today 10:42', 'Studio laptop'], ['staff', 'Rameen', 'Sent proof round 2', 'MR-1042', 'Yesterday 17:30', 'Studio laptop'], ['cust', 'Sara A.', 'Signed in', 'MR-1042', 'Yesterday 16:02', 'iPhone · Riyadh'],
      ['staff', 'Noor K.', 'Viewed full-size photo', 'MR-1038', 'Mon 11:48', 'Studio laptop'], ['staff', 'Noor K.', 'Downloaded 41 originals in 4 minutes', 'MR-1038', 'Mon 11:52', 'Studio laptop', 'flag'], ['print', 'Print partner', 'Received print files', 'MR-1031', 'Fri 14:20', 'Secure transfer'],
      ['cust', 'Hamza R.', 'Opened a share link', 'MR-1040', 'Fri 09:05', 'Android · Karachi'], ['staff', 'Rameen', 'Exported print files', 'MR-1031', 'Thu 15:12', 'Studio laptop'], ['staff', 'Admin', 'Deleted originals (retention)', 'MR-1019', 'Thu 02:00', 'Automatic']
    ];
    return {
      initial: function () { return { f: 'all', q: '', flag: true }; },
      vals: function () {
        var s = x.S(), q = s.q.toLowerCase(), list = E.filter(function (r) { return (s.f === 'all' || r[0] === s.f) && (!q || (r[1] + ' ' + r[2] + ' ' + r[3]).toLowerCase().indexOf(q) >= 0); });
        function f(id, label) { return { label: label, on: on(s.f === id), pick: function () { x.set({ f: id }); } }; }
        return {
          auF: [f('all', 'Everyone'), f('staff', 'Studio staff'), f('cust', 'Customers'), f('print', 'Printer')], auQ: s.q, auOnQ: function (e) { x.set({ q: e.target.value }); },
          auRows: list.map(function (r) { return { who: r[1], what: r[2], order: r[3], when: r[4], where: r[5], flag: !!r[6], cls: 'dp-au' + (r[6] ? ' flag' : '') }; }), auNone: list.length === 0, auN: plural(list.length, 'event'),
          auFlag: s.flag, auDismiss: function () { x.set({ flag: false }); }
        };
      }
    };
  };

  /* ===== STUDIO: RETENTION AND ERASURE ===== */
  B.retention = function (x) {
    var T = toaster(x);
    return {
      initial: function () {
        return { days: '90', hold: false, rows: [
          { id: 'MR-1019', who: 'Hamza R.', del: 'Done · Thu 02:00', st: 'done' }, { id: 'MR-1031', who: 'Aisha M.', del: 'In 12 days', st: 'wait' }, { id: 'MR-1038', who: 'Layla S.', del: 'In 41 days', st: 'wait' }, { id: 'MR-1042', who: 'Sara A.', del: 'After delivery + 90 days', st: 'wait' }],
          req: [{ id: 'ER-07', who: 'Dina F.', order: 'MR-1027', due: '5 days left', st: 'open' }, { id: 'ER-06', who: 'Omar T.', order: 'MR-1012', due: 'Completed', st: 'done' }], toast: '' };
      },
      unmount: T.stop,
      vals: function () {
        var s = x.S();
        function opt(id, label) { return { label: label, on: on(s.days === id), pick: function () { x.set({ days: id }); } }; }
        return {
          rtOpts: [opt('30', '30 days'), opt('90', '90 days'), opt('180', '6 months')], rtHold: on(s.hold), rtHoldToggle: function () { x.set({ hold: !s.hold }); T.say(s.hold ? 'Hold lifted' : 'Hold on: nothing will be deleted'); }, rtHoldOn: s.hold,
          rtRows: s.rows.map(function (r) { return { id: r.id, who: r.who, del: r.del, done: r.st === 'done', wait: r.st === 'wait', held: s.hold && r.st === 'wait', now: function () { x.set({ rows: s.rows.map(function (q) { return q.id === r.id ? Object.assign({}, q, { st: 'done', del: 'Done · just now' }) : q; }) }); T.say('Originals for ' + r.id + ' deleted'); } }; }),
          rtReq: s.req.map(function (r) { return { id: r.id, who: r.who, order: r.order, due: r.due, open: r.st === 'open', done: r.st === 'done', approve: function () { x.set({ req: s.req.map(function (q) { return q.id === r.id ? Object.assign({}, q, { st: 'done', due: 'Completed just now' }) : q; }) }); T.say('Deleted. A confirmation goes to the customer.'); } }; }),
          rtOpen: s.req.filter(function (r) { return r.st === 'open'; }).length
        };
      }
    };
  };

  /* ===== STUDIO: PRIVACY CHECKLIST ===== */
  B.compliance = function (x) {
    var ITEMS = [
      ['Photos in private storage, never public', 'Storage'], ['Short-lived links for every photo', 'Storage'], ['Location data removed on upload', 'Photos'], ['Every open and download is logged', 'Access'], ['Studio roles limit who sees originals', 'Access'],
      ['Sign-in codes expire and cannot be guessed', 'Access'], ['Customers can delete their photos', 'Customer rights'], ['Customers choose what we may do (consent)', 'Customer rights'], ['Agreement with the print partner on how they use files', 'Partners'], ['A plan if something goes wrong', 'Partners']
    ];
    var NEXT = { todo: 'doing', doing: 'done', done: 'todo' }, LABEL = { todo: 'To do', doing: 'In progress', done: 'Done' };
    return {
      initial: function () { return { st: ITEMS.map(function () { return 'todo'; }) }; },   /* nothing here is built yet: every control starts as To do */
      vals: function () {
        var s = x.S(), done = s.st.filter(function (q) { return q === 'done'; }).length;
        return {
          cpRows: ITEMS.map(function (r, i) { return { t: r[0], g: r[1], st: s.st[i], label: LABEL[s.st[i]], cls: 'dp-pill ' + s.st[i], cycle: function () { var a = s.st.slice(); a[i] = NEXT[a[i]]; x.set({ st: a }); }, aria: r[0] + ': ' + LABEL[s.st[i]] + '. Tap to change.' }; }),
          cpDone: done, cpTotal: ITEMS.length, cpBar: 'transform:scaleX(' + (done / ITEMS.length).toFixed(2) + ')',
          cpFlow: [['Customer', 'Adds photos on a phone or laptop'], ['Upload', 'Location removed, file locked away'], ['Private storage', 'Only opened through short-lived links'], ['Studio editor', 'Designers see what their role allows'], ['Print partner', 'Receives print files after approval']].map(function (r, i) { return { n: i + 1, t: r[0], d: r[1] }; }),
          cpAsk: [['Where may the files be stored, and may they leave the country?', 'Saudi Arabia and Pakistan may have different rules. Ask a lawyer who knows both.'], ['How long may we keep order files after delivery?', 'This sets the default on the Retention page.'], ['What must we tell customers, and when?', 'The wording of the consent page and of the privacy policy.'], ['What does the print partner promise us in writing?', 'Their use of files, their storage, and their deletion.']].map(function (r) { return { q: r[0], d: r[1] }; })
        };
      }
    };
  };

  /* ===== STUDIO: PRINT-READY EXPORT ===== */
  B.export = function (x) {
    var timer = 0, T = toaster(x);
    return {
      initial: function () { return { bleed: '3', marks: true, proof: true, prog: 0, sent: false, ok: true, toast: '' }; },
      unmount: function () { clearInterval(timer); T.stop(); },
      vals: function () {
        var s = x.S();
        function opt(id, label) { return { label: label, on: on(s.bleed === id), pick: function () { x.set({ bleed: id }); } }; }
        var files = [['Interior pages', 'PDF · 40 pages · print quality'], ['Cover wrap', 'PDF · front, spine and back'], ['Customer proof', s.proof ? 'PDF · low resolution, watermarked' : 'Skipped']];
        return {
          exBleed: [opt('0', 'None'), opt('3', '3 mm'), opt('5', '5 mm')], exMarks: on(s.marks), exMarksToggle: function () { x.set({ marks: !s.marks }); }, exProof: on(s.proof), exProofToggle: function () { x.set({ proof: !s.proof }); },
          exChecks: [['Print check: nothing to fix', true], ['Every photo sharp enough at its size', true], ['Customer approved the design', s.ok], ['Print partner agreement on file', true]].map(function (r) { return { t: r[0], ok: r[1], bad: !r[1] }; }),
          exOk: on(s.ok), exOkToggle: function () { x.set({ ok: !s.ok }); },
          exRun: function () { if (s.prog > 0 && s.prog < 100) return; x.set({ prog: 1, sent: false }); clearInterval(timer); timer = setInterval(function () { var p = x.S().prog + 9; if (p >= 100) { clearInterval(timer); x.set({ prog: 100 }); T.say('Files ready'); } else x.set({ prog: p }); }, 240); },
          exBusy: s.prog > 0 && s.prog < 100, exReady: s.prog >= 100, exIdle: s.prog === 0, exBar: 'transform:scaleX(' + (Math.min(s.prog, 100) / 100).toFixed(2) + ')', exPct: Math.min(s.prog, 100) + '%',
          exFiles: files.map(function (f) { return { n: f[0], d: f[1], skip: f[1] === 'Skipped' }; }),
          exSend: function () { x.set({ sent: true }); T.say('Files sent securely (preview only)'); }, exSent: s.sent, exCanSend: s.prog >= 100 && s.ok && !s.sent, exNoSend: !(s.prog >= 100 && s.ok && !s.sent),
          exSendLabel: s.sent ? 'Sent to the print partner' : 'Send to the print partner',
          exWhy: s.prog < 100 ? 'Make the files first.' : !s.ok ? 'The customer has not approved the design yet.' : s.sent ? 'The partner opens the files through a link that expires.' : 'The partner gets a link that expires. Your originals are not included.'
        };
      }
    };
  };

  function create(name, c, opts) {
    opts = opts || {};
    var x = { c: c, opts: opts, S: function () { return c.state; }, set: function (o) { c.setState(o); } };
    var pg = B[name](x);
    return { initial: pg.initial || function () { return {}; }, mount: pg.mount || function () {}, unmount: pg.unmount || function () {}, vals: function () { var v = pg.vals(); v.toast = x.S().toast || ''; v.hasToast = !!v.toast; return v; } };
  }
  window.MilesDesign = { create: create, pages: B };
})();
