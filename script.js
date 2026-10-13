/* AIM x KUFOS interactive flowcharts. No dependencies. */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- TABS (hash routed so each board is linkable) ---------- */
const TABS = ['structure', 'decisions', 'change'];
function openTab(id) {
  if (!TABS.includes(id)) id = 'structure';
  $$('.board').forEach(b => b.classList.toggle('on', b.id === id));
  $$('#tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === id));
  if (location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  if (id === 'structure') buildTrees();
  if (id === 'decisions') resetFlow();
  if (id === 'change') resetChain();
  stopAll();
}
$$('#tabs button').forEach(b => b.onclick = () => openTab(b.dataset.tab));
addEventListener('hashchange', () => openTab(location.hash.slice(1)));

/* ---------- BOARD 1: HIERARCHY TREES ---------- */
const N = (n, s, c, d) => ({ n, s, c: c || [], d });

const AIM = N('Archbishop of Kerala', 'Patron authority', [
  N('Chairman', 'Highest authority', [
    N('Finance Controller', '', [
      N('Principal', 'Academic head', [
        N('Registrar', 'Administration', [
          N('Bursar', 'Finance and treasury', [
            N('Administrative Superintendent', 'Non-teaching staff, office operations')
          ])
        ]),
        N('Academic Council / Governing Council', '', [
          N('Dean Offices', '', [
            N('Controller of Examinations', 'Senior HOD / Dean-UG', [
              N('Heads of Departments', 'Finance, Marketing, HR, Analytics', [
                N('Faculty Members', '', [
                  N('Students', 'About 60 per batch, about 120 in total')
                ])
              ])
            ])
          ], 'Academics, student affairs, IQAC, research and consultancy, training and development, international affairs.')
        ]),
        N('Support cells / units', 'Shared services', [], 'IQAC, Student Affairs, Research and Consultancy, Training and Development, International Affairs, Alumni Affairs, Placement Cell, Grievance Cell.')
      ])
    ])
  ])
]);

const KUF = N('Governor of Kerala', 'Chancellor', [
  N('Minister for Fisheries', 'Pro-Chancellor', [
    N('Governing Council / Senate', 'Supreme executive body', [
      N('Vice-Chancellor', 'Principal executive officer', [
        N('Pro-Vice Chancellor'),
        N('Registrar', 'Administration'),
        N('Finance Officer', 'Finance and grants'),
        N('Academic Council', 'Apex academic decision body', [
          N('Dean', 'Faculty of Fisheries Management', [
            N('Director / Head', 'School of Management Studies', [
              N('Professors / Associate / Assistant Professors', '', [
                N('Controller of Examinations'),
                N('Directors', 'Research, Extension, Admissions'),
                N('Administrative Wings', 'Joint Registrar, Section Officers, Assistants'),
                N('Students', 'MBA intake: 40 seats')
              ])
            ])
          ])
        ])
      ])
    ])
  ])
]);

const TREES = {
  aim: { root: AIM, mount: '#tree-aim', line: '#line-aim' },
  kuf: { root: KUF, mount: '#tree-kuf', line: '#line-kuf' }
};
const depthOf = (n, d = 0) => Math.max(d, ...n.c.map(c => depthOf(c, d + 1)));
const MAXD = Math.max(depthOf(AIM), depthOf(KUF));
let order = 0;

function makeNode(n, d, side, parent) {
  n.parent = parent; n.depth = d;
  const li = document.createElement('li');
  li.className = 'node'; li.dataset.d = d;
  li.style.setProperty('--i', reduceMotion ? 0 : order++);
  n.el = li;

  const row = document.createElement('div'); row.className = 'row';
  const pick = document.createElement('button'); pick.className = 'nb';
  pick.innerHTML = `<span class="lv">L${d}</span><span class="tx"><b>${n.n}</b>${n.s ? `<i>${n.s}</i>` : ''}</span>${n.d ? '<span class="info" title="More detail">i</span>' : ''}`;
  pick.onclick = () => select(side, n);
  row.append(pick);

  if (n.c.length) {
    const tg = document.createElement('button'); tg.className = 'tg';
    tg.textContent = '−'; tg.setAttribute('aria-label', 'Fold or unfold ' + n.n);
    tg.onclick = () => { const c = li.classList.toggle('closed'); tg.textContent = c ? '+' : '−'; };
    row.append(tg);
  }
  li.append(row);

  if (n.d) { const det = document.createElement('div'); det.className = 'det'; det.textContent = n.d; li.append(det); }
  if (n.c.length) {
    const ul = document.createElement('ul'); ul.className = 'kids';
    n.c.forEach(c => ul.append(makeNode(c, d + 1, side, n)));
    li.append(ul);
  }
  return li;
}

function buildTrees() {
  order = 0;
  for (const [side, t] of Object.entries(TREES)) {
    const m = $(t.mount); m.replaceChildren(makeNode(t.root, 0, side, null));
    $(t.line).innerHTML = '<p class="empty">Select a box to see who sits above it.</p>';
  }
  applyLevels();
}

function select(side, n) {
  const t = TREES[side];
  $$('.node', $(t.mount)).forEach(e => e.classList.remove('sel', 'path'));
  const chain = []; for (let x = n; x; x = x.parent) chain.unshift(x);
  chain.forEach(x => {
    x.el.classList.add('path');
    if (x !== n) x.el.classList.remove('closed');
  });
  n.el.classList.remove('path'); n.el.classList.add('sel');
  const chips = chain.map((x, i) => `<span class="chip${x === n ? ' me' : ''}">${x.n}</span>${i < chain.length - 1 ? '<span class="arr">→</span>' : ''}`).join('');
  const msg = n.depth === 0
    ? `<strong>${n.n}</strong> is the top of the hierarchy.`
    : `<strong>${n.n}</strong> sits ${n.depth} level${n.depth > 1 ? 's' : ''} below <strong>${t.root.n}</strong>. Authority flows left to right:`;
  $(t.line).innerHTML = `<p style="margin:0">${msg}</p><div class="chips">${chips}</div>`;
}

function applyLevels() {
  const max = +$('#lvl').value; $('#lvlout').textContent = max;
  $$('.node').forEach(e => e.classList.toggle('lvl-hide', +e.dataset.d > max));
}
$('#lvl').max = MAXD; $('#lvl').value = MAXD; $('#lvlout').textContent = MAXD;
$('#lvl').oninput = applyLevels;
$('#replay').onclick = () => { $('#lvl').value = MAXD; buildTrees(); };
$('#expand').onclick = () => { $$('.node.closed').forEach(e => e.classList.remove('closed')); $$('.tg').forEach(t => t.textContent = '−'); };
$('#collapse').onclick = () => {
  $$('.node').forEach(e => { if (+e.dataset.d >= 1 && e.querySelector(':scope > .kids')) { e.classList.add('closed'); e.querySelector(':scope > .row .tg').textContent = '+'; } });
};

/* ---------- BOARD 2: DECISION FLOW ---------- */
const FLOW = {
  aim: [
    ['Need identified', 'Based on industry demand, placements and academic requirements', 'Initiate'],
    ['IQAC feasibility study', 'Academic justification and resource requirement', 'Study'],
    ['Academic Committee review', 'Review by internal academic bodies', 'Review'],
    ['Governing Council approval', 'Institutional-level review', 'Approve'],
    ['Trust and University approval', 'Final approval', 'Final']
  ],
  kuf: [
    ['Proposal developed', 'By the faculty or department', 'Initiate'],
    ['Board of Studies review', 'Subject experts review', 'Review'],
    ['Academic Council approval', 'University academic body', 'Approve'],
    ['Governing Council approval', 'Final ratification', 'Ratify'],
    ['Implementation', 'Institution-wide', 'Done']
  ]
};
const NAME = { aim: 'AIM', kuf: 'KUFOS' };
const cur = { aim: -1, kuf: -1 };
let timers = [];

function buildFlow(side) {
  const ol = $('#flow-' + side); ol.replaceChildren();
  FLOW[side].forEach((s, i) => {
    if (i) { const j = document.createElement('li'); j.className = 'join'; j.setAttribute('aria-hidden', 'true'); ol.append(j); }
    const li = document.createElement('li'); li.className = 'step'; li.tabIndex = 0;
    li.innerHTML = `<span class="num">${i + 1}</span><div><b>${s[0]}</b><p>${s[1]}</p></div><span class="kind">${s[2]}</span>`;
    const go = () => { stopAll(); setStep(side, i); setStatus(); };
    li.onclick = go; li.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
    ol.append(li);
  });
  $('#seg-' + side).innerHTML = '<i></i><i></i><i></i><i></i><i></i>';
}
function setStep(side, i) {
  cur[side] = i;
  const kids = $$('#flow-' + side + ' > li');
  kids.forEach((el, k) => {
    if (el.classList.contains('step')) { const si = k / 2; el.classList.toggle('cur', si === i); el.classList.toggle('done', si < i); }
    else el.classList.toggle('go', (k + 1) / 2 <= i);
  });
  $$('#seg-' + side + ' i').forEach((s, k) => s.classList.toggle('on', k <= i));
}
function setStatus(msg) {
  const st = $('#status');
  if (msg) { st.textContent = msg; return; }
  const a = cur.aim, k = cur.kuf;
  if (a < 0 && k < 0) st.textContent = 'Ready. Press Next step to start the proposal.';
  else st.textContent = `AIM: ${a < 0 ? 'not started' : FLOW.aim[a][0] + ` (${a + 1} of 5)`}   |   KUFOS: ${k < 0 ? 'not started' : FLOW.kuf[k][0] + ` (${k + 1} of 5)`}`;
}
function stopAll() { timers.forEach(clearInterval); timers = []; $$('#together,#race').forEach(b => b.classList.remove('on')); }
function resetFlow() { stopAll(); ['aim', 'kuf'].forEach(s => { buildFlow(s); setStep(s, -1); }); setStatus(); }

function run(pace, btn, label) {
  stopAll(); resetFlow(); btn.classList.add('on');
  let finished = null;
  ['aim', 'kuf'].forEach(side => {
    const t = setInterval(() => {
      const n = cur[side] + 1;
      if (n > 4) { clearInterval(t); return; }
      setStep(side, n); 
      if (n === 4 && !finished) finished = side;
      if (cur.aim === 4 && cur.kuf === 4) { btn.classList.remove('on'); setStatus(`${label}: ${NAME[finished]} reached its last step first.`); }
      else setStatus();
    }, pace[side]);
    timers.push(t);
  });
}
$('#next').onclick = () => { stopAll(); ['aim', 'kuf'].forEach(s => setStep(s, Math.min(4, cur[s] + 1))); setStatus(); };
$('#prev').onclick = () => { stopAll(); ['aim', 'kuf'].forEach(s => setStep(s, Math.max(-1, cur[s] - 1))); setStatus(); };
$('#together').onclick = () => run({ aim: 1300, kuf: 1300 }, $('#together'), 'Together');
$('#race').onclick = () => run({ aim: 1000, kuf: 1700 }, $('#race'), 'Race (illustrative pacing)');
$('#reset2').onclick = resetFlow;

[
  ['Nature', 'Private, trust-based', 'State public university'],
  ['Initiation', 'Internal (based on demand)', 'Faculty / department'],
  ['Key review body', 'IQAC, Academic Committee', 'Board of Studies'],
  ['Final approval', 'Trust and University', 'Academic Council → Governing Council'],
  ['Speed', 'Relatively faster (fewer layers)', 'More formal and multi-layered'],
  ['External influence', 'Trust and affiliating university', 'Government, statutory bodies'],
  ['Degree of formalization', 'Moderate', 'Higher']
].forEach(r => $('#cmp').insertAdjacentHTML('beforeend', `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`));

/* ---------- BOARD 3: CHANGE RESPONSE ---------- */
const CHAIN = {
  aim: ['Relaxed performance metrics for entering the 4th year', 'More UG students may continue for 4 years', 'Possible dip in PG enrolments (including MBA)', 'Pressure on institutions built for the 3-year UG model'],
  kuf: ['Introduction of the 4-year UG programme (FYUGP) from 2026-27', '5-year integrated PG programs (e.g. Climate and Data Science, Business Administration)', 'Honours with Research for high-performing students (CGPA 7.5 or above)', 'Leverages research facilities and the multi-acre campus ecosystem']
};
let shown = 0, ctimer = null;
function buildChain() {
  ['aim', 'kuf'].forEach(side => {
    const ol = $('#chain-' + side); ol.replaceChildren();
    CHAIN[side].forEach((t, i) => {
      if (i) { const j = document.createElement('li'); j.className = 'join'; j.setAttribute('aria-hidden', 'true'); ol.append(j); }
      const li = document.createElement('li'); li.className = 'step';
      li.innerHTML = `<span class="num">${i + 1}</span><div><b>${t}</b></div>`;
      ol.append(li);
    });
  });
}
function showChain(n) {
  shown = n;
  ['aim', 'kuf'].forEach(side => {
    $$('#chain-' + side + ' > li').forEach((el, k) => {
      if (el.classList.contains('step')) { const i = k / 2; el.classList.toggle('show', i < n); el.classList.toggle('cur', i === n - 1); }
      else el.classList.toggle('show', (k + 1) / 2 < n);
    });
  });
}
function stopChain() { clearInterval(ctimer); ctimer = null; $('#cplay').classList.remove('on'); }
function resetChain() { stopChain(); buildChain(); showChain(0); }
$('#cnext').onclick = () => { stopChain(); showChain(Math.min(4, shown + 1)); };
$('#creset').onclick = resetChain;
$('#cplay').onclick = () => {
  resetChain(); $('#cplay').classList.add('on');
  ctimer = setInterval(() => { if (shown >= 4) { stopChain(); return; } showChain(shown + 1); }, 1100);
};
const _stopAll = stopAll; stopAll = function () { _stopAll(); stopChain(); };

/* ---------- INIT ---------- */
buildFlow('aim'); buildFlow('kuf'); buildChain();
openTab(location.hash.slice(1));

/* ---------- TASKBAR CLOCK ---------- */
(function () {
  const c = $('#clock');
  const tick = () => { c.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); };
  tick(); setInterval(tick, 15000);
})();