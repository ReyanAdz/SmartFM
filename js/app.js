// ===== SmartFM study app =====
const MODES = { manual: 'Manual', suggested: 'Suggested', automatic: 'Automatic' };
const ORDERS = [
  ['manual', 'suggested', 'automatic'], ['manual', 'automatic', 'suggested'],
  ['suggested', 'manual', 'automatic'], ['suggested', 'automatic', 'manual'],
  ['automatic', 'manual', 'suggested'], ['automatic', 'suggested', 'manual']
];
const MODE_INSTR = {
  manual: 'For each file, <b>browse to the folder where you want to save it</b> and press <b>Save here</b>.',
  suggested: 'For each file, SmartFM will <b>suggest up to 3 folders</b> and say why. Click a suggestion to save there, or browse and choose your own folder.',
  automatic: 'For each file, press <b>Save</b> and SmartFM will <b>choose the folder and save it for you</b>. You will see where each file was saved.'
};

const $ = s => document.querySelector(s);
const app = () => $('#app');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const now = () => performance.now();

// seeded RNG so a participant's file order is reproducible
function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function shuffle(a, r) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

let S = null; // session state

// ---------------- logging ----------------
function logEvent(type, detail) {
  if (!S) return;
  const b = S.blocks[S.bi];
  S.events.push({ participant: S.pid, t_ms: Math.round(now() - S.t0), block: S.bi + 1, mode: b ? b.mode : '', scenario: b ? b.scenario.id : '', type, detail: detail || '' });
}
function persist() {
  try { localStorage.setItem('smartfm_' + S.pid, JSON.stringify({ pid: S.pid, order: S.order, saves: S.saves, refinds: S.refinds, events: S.events, distractor: S.distractor })); } catch (e) { }
}
function toCSV(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const q = v => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  return [cols.join(',')].concat(rows.map(r => cols.map(c => q(r[c])).join(','))).join('\n');
}
function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
}

// click counter for the active trial
let clickCount = 0;
document.addEventListener('pointerdown', () => { clickCount++; }, true);

// ---------------- file browser component ----------------
// opts: {root, path, onNavigate(path, how), onFileClick(name, path), filesClickable}
function browserHTML(root, path, filesClickable) {
  const node = getFolder(root, path);
  const parts = path ? path.split('/') : [];
  let crumbs = `<span class="crumb" data-nav="">Home</span>`;
  parts.forEach((p, i) => { crumbs += ` <span class="sep">›</span> <span class="crumb" data-nav="${esc(parts.slice(0, i + 1).join('/'))}">${esc(p)}</span>`; });
  const items = node.children.map(c => `<div class="item folder" data-open="${esc(path ? path + '/' + c.name : c.name)}">${FOLDER_SVG}<span>${esc(c.name)}</span></div>`)
    .concat(node.files.map(f => `<div class="item file ${filesClickable ? 'clickable' : ''}" data-file="${esc(f)}"><span class="ext ext-${ext(f)}">${esc(ext(f).toUpperCase())}</span><span>${esc(f)}</span></div>`));
  return `<div class="browser">
    <div class="bar"><button class="up" ${path ? '' : 'disabled'} data-up>↑ Up</button><div class="crumbs">${crumbs}</div></div>
    <div class="items">${items.join('') || '<div class="empty">This folder is empty</div>'}</div></div>`;
}
function bindBrowser(el, opts) {
  el.querySelectorAll('[data-nav]').forEach(x => x.onclick = () => opts.onNavigate(x.dataset.nav, 'breadcrumb'));
  el.querySelectorAll('[data-open]').forEach(x => x.onclick = () => opts.onNavigate(x.dataset.open, 'open'));
  const up = el.querySelector('[data-up]');
  if (up) up.onclick = () => { const p = opts.path.split('/'); p.pop(); opts.onNavigate(p.join('/'), 'up'); };
  if (opts.onFileClick) el.querySelectorAll('[data-file]').forEach(x => x.onclick = () => opts.onFileClick(x.dataset.file, x));
}
const FOLDER_SVG = '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.6l2 2h8.4A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" fill="#f2c14e" stroke="#d9a520"/></svg>';

// ---------------- screens ----------------
function screenSetup() {
  let saved = [];
  try { saved = Object.keys(localStorage).filter(k => k.startsWith('smartfm_')); } catch (e) { }
  app().innerHTML = `<div class="card narrow">
    <h1>SmartFM <span class="muted">study setup</span></h1>
    <p class="muted">Experimenter screen. Fill this in before handing the computer to the participant.</p>
    <label>Participant number <input id="pid" type="number" min="1" value="1"></label>
    <label>Mode order <select id="order">${ORDERS.map((o, i) => `<option value="${i}">${i + 1}. ${o.map(m => MODES[m]).join(' → ')}</option>`).join('')}</select></label>
    <p class="hint">Auto-set from participant number (rotates through all 6 orders). Scenarios always run Student → Photographer → Organizer, so each mode gets paired with every scenario across participants.</p>
    <details><summary>Study settings</summary>
      <label>Files to refind per block <input id="nref" type="number" min="1" max="12" value="6"></label>
      <label>Distractor task length (seconds) <input id="dsec" type="number" min="0" value="60"></label>
      <label>Refind time limit per file (seconds) <input id="rto" type="number" min="10" value="60"></label>
      <label>"Saved to…" confirmation shown for (seconds) <input id="toast" type="number" min="1" step="0.5" value="2.5"></label>
    </details>
    <button class="primary big" id="start">Start session</button>
    ${saved.length ? `<hr><p class="muted">Sessions stored in this browser: ${saved.map(k => esc(k.replace('smartfm_', 'P'))).join(', ')}</p>
      <button id="dlall">Download all stored sessions (CSV)</button>` : ''}
  </div>`;
  const pid = $('#pid'), order = $('#order');
  pid.oninput = () => { order.value = String((Math.max(1, +pid.value || 1) - 1) % 6); };
  $('#start').onclick = () => startSession(+pid.value || 1, ORDERS[+order.value], {
    nref: +$('#nref').value || 6, dsec: +$('#dsec').value, rto: +$('#rto').value || 60, toast: (+$('#toast').value || 2.5) * 1000
  });
  if ($('#dlall')) $('#dlall').onclick = () => {
    const all = saved.map(k => JSON.parse(localStorage.getItem(k)));
    download('smartfm_all_save_trials.csv', toCSV(all.flatMap(d => d.saves)));
    download('smartfm_all_refind_trials.csv', toCSV(all.flatMap(d => d.refinds)));
  };
}

function startSession(pid, order, cfg) {
  const r = rng(pid * 7919);
  S = {
    pid, order, cfg, t0: now(), bi: 0, saves: [], refinds: [], events: [], distractor: [],
    blocks: order.map((mode, i) => ({ mode, scenario: SCENARIOS[i], tree: cloneTree(SCENARIOS[i].tree), queue: shuffle(SCENARIOS[i].incoming, r), history: [], savedFiles: [] })),
    r
  };
  logEvent('session_start', 'order=' + order.join('>'));
  screenWelcome();
}

function screenWelcome() {
  app().innerHTML = `<div class="card narrow">
    <h1>Welcome to SmartFM</h1>
    <p>In this study you'll save some files on a pretend computer, and later try to find them again.</p>
    <p>There are <b>3 parts</b>. Each part uses a different pretend computer and a different way of saving files.</p>
    <p>Please work at a natural pace. There are no trick questions, and we're testing the software, not you.</p>
    <button class="primary big" id="go">Begin</button></div>`;
  $('#go').onclick = screenBlockIntro;
}

function screenBlockIntro() {
  const b = S.blocks[S.bi];
  app().innerHTML = `<div class="card narrow">
    <div class="pill">Part ${S.bi + 1} of 3 · ${MODES[b.mode]} saving</div>
    <h1>${esc(b.scenario.label)}</h1>
    <p>${esc(b.scenario.intro)}</p>
    <p class="instr">${MODE_INSTR[b.mode]}</p>
    <p class="muted">You'll save ${b.queue.length} files.</p>
    <button class="primary big" id="go">Start part ${S.bi + 1}</button></div>`;
  $('#go').onclick = () => { logEvent('block_start'); b.ti = 0; trialStart(); };
}

// ---------------- SAVE phase ----------------
function trialStart() {
  const b = S.blocks[S.bi];
  if (b.ti >= b.queue.length) return screenDistractor();
  const [name, desc, intended] = b.queue[b.ti];
  const preds = predict(b.tree, name, b.history);
  const T = b.trial = { name, desc, intended, preds, start: now(), path: '', opens: 0, ups: 0, crumbs: 0, visited: new Set() };
  clickCount = 0;
  logEvent('save_trial_start', name);
  if (b.mode === 'automatic') renderAuto(); else renderSaveDialog();
}

function fileCard(T, b) {
  return `<div class="filecard"><span class="ext ext-${ext(T.name)} lg">${ext(T.name).toUpperCase()}</span>
    <div><div class="fname">${esc(T.name)}</div><div class="muted">${esc(T.desc)}</div></div>
    <div class="progress">File ${b.ti + 1} of ${b.queue.length}</div></div>`;
}

function renderAuto() {
  const b = S.blocks[S.bi], T = b.trial;
  app().innerHTML = `<div class="card">${fileCard(T, b)}
    <div class="autobox"><p>SmartFM will choose a folder for this file.</p><button class="primary big" id="save">Save</button></div></div>`;
  $('#save').onclick = () => finishSave(T.preds[0].path, 1);
}

function renderSaveDialog() {
  const b = S.blocks[S.bi], T = b.trial;
  const sugg = b.mode === 'suggested' ? `<div class="sugg"><div class="sugg-h">SmartFM suggests</div>
    ${T.preds.slice(0, 3).map((p, i) => `<button class="sugg-item" data-s="${i}"><span class="spath">${FOLDER_SVG}<span>Home / ${esc(p.path.split('/').join(' / '))}</span></span><span class="why">${esc(p.reason)}</span></button>`).join('')}
    <div class="muted small">…or browse below and pick your own folder.</div></div>` : '';
  app().innerHTML = `<div class="card">${fileCard(T, b)}${sugg}
    <div id="br"></div>
    <div class="savebar"><span>Save to: <b id="dest"></b></span><button class="primary" id="savehere">Save here</button></div></div>`;
  const draw = () => {
    $('#br').innerHTML = browserHTML(b.tree, T.path, false);
    $('#dest').textContent = 'Home' + (T.path ? ' / ' + T.path.split('/').join(' / ') : '');
    bindBrowser($('#br'), {
      path: T.path, onNavigate: (p, how) => {
        T.path = p; T.visited.add(p);
        if (how === 'open') T.opens++; else if (how === 'up') T.ups++; else T.crumbs++;
        logEvent('save_nav', how + ':' + (p || 'Home')); draw();
      }
    });
  };
  draw();
  document.querySelectorAll('[data-s]').forEach(x => x.onclick = () => finishSave(T.preds[+x.dataset.s].path, +x.dataset.s + 1));
  $('#savehere').onclick = () => finishSave(T.path, 0);
}

// acceptedRank: 0 = user browsed & chose, 1-3 = clicked suggestion (automatic logs 1)
function finishSave(path, acceptedRank) {
  const b = S.blocks[S.bi], T = b.trial;
  const ms = Math.round(now() - T.start);
  getFolder(b.tree, path).files.push(T.name);
  b.history.push(path);
  b.savedFiles.push({ name: T.name, path });
  const top3 = T.preds.slice(0, 3).map(p => p.path);
  S.saves.push({
    participant: S.pid, block: S.bi + 1, mode: b.mode, scenario: b.scenario.id, trial: b.ti + 1,
    file: T.name, intended_folder: T.intended, saved_folder: path || 'Home',
    saved_matches_intended: path === T.intended ? 1 : 0,
    pred_top1: top3[0], pred_top1_correct: top3[0] === T.intended ? 1 : 0, pred_in_top3: top3.includes(T.intended) ? 1 : 0,
    suggestion_rank_used: b.mode === 'manual' ? '' : acceptedRank,
    time_ms: ms, clicks: clickCount, folders_opened: T.opens, up_clicks: T.ups, breadcrumb_clicks: T.crumbs,
    distinct_folders_visited: T.visited.size
  });
  logEvent('save', T.name + ' -> ' + (path || 'Home'));
  persist();
  // same confirmation in every mode, so location exposure is equal across conditions
  app().innerHTML = `<div class="card"><div class="toast">✓ Saved <b>${esc(T.name)}</b> to<div class="toastpath">${FOLDER_SVG} Home${path ? ' / ' + esc(path.split('/').join(' / ')) : ''}</div></div></div>`;
  setTimeout(() => { b.ti++; trialStart(); }, S.cfg.toast);
}

// ---------------- distractor ----------------
function screenDistractor() {
  const b = S.blocks[S.bi];
  logEvent('save_phase_end');
  if (!S.cfg.dsec) return screenRefindIntro();
  let end = now() + S.cfg.dsec * 1000, correct = 0, attempted = 0, q;
  const next = () => { const a = 10 + Math.floor(S.r() * 40), c = 10 + Math.floor(S.r() * 40); q = { a, c }; $('#q').textContent = `${a} + ${c} = ?`; $('#ans').value = ''; $('#ans').focus(); };
  app().innerHTML = `<div class="card narrow center"><div class="pill">Short break</div>
    <h1>Quick maths</h1><p>Answer as many as you can. Press Enter after each answer.</p>
    <div id="q" class="q"></div><input id="ans" type="number" class="ans" autocomplete="off">
    <div class="muted" id="timer"></div></div>`;
  next();
  $('#ans').onkeydown = e => { if (e.key === 'Enter' && $('#ans').value !== '') { attempted++; if (+$('#ans').value === q.a + q.c) correct++; next(); } };
  const tick = setInterval(() => {
    const left = Math.ceil((end - now()) / 1000);
    if (left <= 0) {
      clearInterval(tick);
      S.distractor.push({ participant: S.pid, block: S.bi + 1, mode: b.mode, attempted, correct });
      logEvent('distractor_end', `attempted=${attempted} correct=${correct}`);
      screenRefindIntro();
    } else $('#timer').textContent = left + ' s left';
  }, 250);
}

// ---------------- REFIND phase ----------------
function screenRefindIntro() {
  const b = S.blocks[S.bi];
  b.targets = shuffle(b.savedFiles, S.r).slice(0, Math.min(S.cfg.nref, b.savedFiles.length));
  app().innerHTML = `<div class="card narrow">
    <div class="pill">Part ${S.bi + 1} of 3 · Finding files</div>
    <h1>Now find some of the files you just saved</h1>
    <p class="instr">You'll be shown a file name. <b>Browse the folders and click the file</b> when you find it. There is no search.</p>
    <p class="muted">${b.targets.length} files. If you can't find one, press "I can't find it".</p>
    <button class="primary big" id="go">Start</button></div>`;
  $('#go').onclick = () => { b.ri = 0; refindStart(); };
}

function refindStart() {
  const b = S.blocks[S.bi];
  if (b.ri >= b.targets.length) return endBlock();
  const tg = b.targets[b.ri];
  const R = b.rtrial = { ...tg, start: now(), path: '', opens: 0, ups: 0, crumbs: 0, wrongFolders: 0, wrongFiles: 0, visited: new Set() };
  clickCount = 0;
  logEvent('refind_start', tg.name);
  R.timer = setTimeout(() => finishRefind(false, true), S.cfg.rto * 1000);
  const onPath = p => !p || R.path === p || tg.path === p || tg.path.startsWith(p + '/');
  const draw = () => {
    app().innerHTML = `<div class="card"><div class="filecard"><span class="ext ext-${ext(tg.name)} lg">${ext(tg.name).toUpperCase()}</span>
      <div><div class="muted small">Find this file</div><div class="fname">${esc(tg.name)}</div></div>
      <div class="progress">File ${b.ri + 1} of ${b.targets.length}</div></div>
      <div id="br"></div><div class="savebar"><span></span><button id="giveup">I can't find it</button></div></div>`;
    $('#br').innerHTML = browserHTML(b.tree, R.path, true);
    bindBrowser($('#br'), {
      path: R.path,
      onNavigate: (p, how) => {
        R.path = p; R.visited.add(p);
        if (how === 'open') { R.opens++; if (!onPath(p)) R.wrongFolders++; } else if (how === 'up') R.ups++; else R.crumbs++;
        logEvent('refind_nav', how + ':' + (p || 'Home')); draw();
      },
      onFileClick: (f, el) => {
        if (f === tg.name && R.path === tg.path) finishRefind(true, false);
        else { R.wrongFiles++; logEvent('refind_wrong_file', f); el.classList.add('wrong'); setTimeout(() => el.classList.remove('wrong'), 500); }
      }
    });
    $('#giveup').onclick = () => finishRefind(false, false);
  };
  draw();
}

function finishRefind(success, timedOut) {
  const b = S.blocks[S.bi], R = b.rtrial;
  clearTimeout(R.timer);
  const save = S.saves.find(s => s.block === S.bi + 1 && s.file === R.name);
  S.refinds.push({
    participant: S.pid, block: S.bi + 1, mode: b.mode, scenario: b.scenario.id, trial: b.ri + 1,
    file: R.name, saved_folder: b.targets[b.ri].path, saved_matches_intended: save ? save.saved_matches_intended : '',
    success: success ? 1 : 0, gave_up: !success && !timedOut ? 1 : 0, timed_out: timedOut ? 1 : 0,
    time_ms: Math.round(now() - R.start), clicks: clickCount, folders_opened: R.opens, wrong_folders_opened: R.wrongFolders,
    up_clicks: R.ups, breadcrumb_clicks: R.crumbs, wrong_file_clicks: R.wrongFiles
  });
  logEvent('refind_end', `${R.name} success=${success ? 1 : 0}${timedOut ? ' timeout' : ''}`);
  persist();
  b.ri++; refindStart();
}

function endBlock() {
  logEvent('block_end');
  persist();
  S.bi++;
  if (S.bi < S.blocks.length) {
    app().innerHTML = `<div class="card narrow center"><h1>Part ${S.bi} done</h1><p>Take a short break if you like.</p><button class="primary big" id="go">Continue to part ${S.bi + 1}</button></div>`;
    $('#go').onclick = screenBlockIntro;
  } else screenEnd();
}

function screenEnd() {
  logEvent('session_end'); persist();
  app().innerHTML = `<div class="card narrow center"><h1>All done, thank you!</h1>
    <p>Please let the researcher know you've finished.</p>
    <hr><p class="muted small">Researcher: download the data for participant ${S.pid}.</p>
    <div class="row"><button id="d1">Save trials CSV</button><button id="d2">Refind trials CSV</button><button id="d3">Event log CSV</button><button id="d4">Distractor CSV</button></div>
    <button class="link" id="new">Back to setup</button></div>`;
  const p = 'smartfm_P' + S.pid + '_';
  $('#d1').onclick = () => download(p + 'save_trials.csv', toCSV(S.saves));
  $('#d2').onclick = () => download(p + 'refind_trials.csv', toCSV(S.refinds));
  $('#d3').onclick = () => download(p + 'events.csv', toCSV(S.events));
  $('#d4').onclick = () => download(p + 'distractor.csv', toCSV(S.distractor));
  $('#new').onclick = () => { S = null; screenSetup(); };
}

screenSetup();
