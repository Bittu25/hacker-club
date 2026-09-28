/* Hacker Club Arena — in-browser editor + judge.
   JavaScript solutions really run (inside a sandboxed Web Worker with a time limit).
   Other languages will be judged by the server-side judge at launch. */
(function () {
  const { $, $$, esc } = HC;
  const LETTERS = "ABCDEFGH";
  const TIME_LIMIT_MS = 2000;

  // ---------- Mode: contest or practice ----------
  const contest = HC.contest(HC.param("contest"));
  const cStatus = contest ? HC.status(contest) : null;
  const rated = contest && cStatus.state === "live";
  const ctxKey = rated ? contest.id : "practice";
  const problems = (contest ? contest.problems : HC.problems.map((p) => p.id)).map(HC.problem).filter(Boolean);
  let current = problems.find((p) => p.id === HC.param("problem")) || problems[0];
  let lang = HC.store.get("lang", "javascript");
  const startedAt = Date.now();

  if (contest && cStatus.state === "upcoming") {
    $(".arena").innerHTML = `<div class="section" style="grid-column:1/-1"><div class="narrow center"><p class="eyebrow">// locked</p><h2>${esc(contest.title)} hasn't started yet</h2><p class="muted" style="margin-bottom:18px">Problems unlock in <span class="countdown" data-cd="${contest.start}">${HC.countdown(contest.start)}</span>.</p><a class="btn btn-primary" href="arena.html">Practice meanwhile</a> <a class="btn btn-outline" href="contest.html?id=${contest.id}">Contest page</a></div></div>`;
    $("#arenaTitle").innerHTML = esc(contest.title);
    return;
  }

  // ---------- Header bar ----------
  function renderBar() {
    $("#arenaTitle").innerHTML = contest
      ? `${rated ? '<span class="badge live"><span class="dot red live"></span>Live</span>' : '<span class="badge ended">Unrated practice</span>'} <a href="contest.html?id=${contest.id}">${esc(contest.title)}</a>`
      : `<span class="badge easy">Practice</span> Practice arena`;
    const solved = problems.filter((p) => bestVerdict(p.id) === "AC");
    const pts = solved.reduce((s, p) => s + p.points, 0);
    $("#arenaScore").innerHTML = `Solved <b>${solved.length}/${problems.length}</b> · Score <b>${pts}</b>`;
  }
  setInterval(() => {
    if (rated) {
      const left = cStatus.end - Date.now();
      $("#arenaTimer").textContent = left > 0 ? HC.countdown(cStatus.end) : "Contest over";
      $("#arenaTimer").style.color = left < 10 * 60e3 ? "var(--red)" : "";
    } else {
      const p = HC.parts(Date.now() - startedAt);
      $("#arenaTimer").textContent = `${HC.pad(p.h)}:${HC.pad(p.m)}:${HC.pad(p.s)}`;
    }
  }, 1000);

  // ---------- Submissions ----------
  const mySubs = () => HC.subs().filter((s) => s.ctx === ctxKey);
  function bestVerdict(pid) {
    const s = mySubs().filter((x) => x.problem === pid && x.kind === "submit");
    if (!s.length) return null;
    return s.some((x) => x.verdict === "AC") ? "AC" : s[0].verdict;
  }

  // ---------- Problem panel ----------
  function renderTabs() {
    $("#probTabs").innerHTML = problems.map((p, i) => {
      const v = bestVerdict(p.id);
      return `<button class="prob-tab ${p === current ? "active" : ""}" data-pid="${p.id}"><span class="st ${v === "AC" ? "ac" : v ? "wa" : ""}"></span>${LETTERS[i]}. ${esc(p.title)}</button>`;
    }).join("");
  }
  function renderProblem() {
    const p = current;
    const i = problems.indexOf(p);
    $("#probBody").innerHTML = `
      <div class="chips" style="gap:8px;margin-bottom:10px"><span class="badge ${p.difficulty.toLowerCase()}">${p.difficulty}</span><span class="badge cat">${p.points} pts</span>${bestVerdict(p.id) === "AC" ? '<span class="badge registered">✓ Solved</span>' : ""}</div>
      <h2>${LETTERS[i]}. ${esc(p.title)}</h2>
      <div class="statement">${p.statement}</div>
      <h4>Examples</h4>
      ${p.examples.map((e, j) => `<div class="example"><b>Example ${j + 1}</b>\n<b>Input:</b>  ${esc(e.input)}\n<b>Output:</b> ${esc(e.output)}${e.note ? `\n<b>Why:</b>    ${esc(e.note)}` : ""}</div>`).join("")}
      <h4>Constraints</h4>
      <ul>${p.constraints.map((c) => `<li><code>${esc(c)}</code></li>`).join("")}</ul>
      <h4>Judging</h4>
      <ul><li><b>Run</b> checks the ${Math.min(2, p.tests.length)} sample tests.</li><li><b>Submit</b> checks all ${p.tests.length} tests, including hidden ones.</li><li>Time limit: ${TIME_LIMIT_MS / 1000}s per submission.</li></ul>
      ${rated ? `<h4>Live standings</h4><div class="mini-lb" id="miniLb"></div>` : ""}
    `;
    if (rated) renderMiniLb();
  }
  function renderMiniLb() {
    const r = HC.rng(contest.id + "mini");
    const maxPts = problems.reduce((s, p) => s + p.points, 0);
    const prog = Math.min(1, (Date.now() - contest.start) / cStatus.len);
    const rows = HC.hackers.slice(0, 40).sort(() => r() - 0.5).slice(0, 8).map((h) => ({ name: h.name, pts: Math.round((maxPts * prog * (0.4 + r() * 0.8)) / 100) * 100 }));
    const u = HC.user();
    const mine = problems.filter((p) => bestVerdict(p.id) === "AC").reduce((s, p) => s + p.points, 0);
    rows.push({ name: u ? u.handle : "you", pts: mine, me: true });
    rows.sort((a, b) => b.pts - a.pts || (a.me ? -1 : 1));
    $("#miniLb").innerHTML = rows.map((x, i) => `<div class="${x.me ? "me" : ""}"><span>${i + 1}. ${esc(x.name)}${x.me ? " (you)" : ""}</span><span class="mono">${Math.min(x.pts, maxPts)}</span></div>`).join("");
  }

  // ---------- Editor ----------
  const ta = $("#code"), hl = $("#hl"), gutter = $("#gutter"), pre = $(".code-wrap pre");
  const KW = {
    javascript: "function return const let var if else for while do of in new class extends true false null undefined this typeof break continue switch case default try catch throw async await Math Map Set Array Object Number String Infinity",
    python: "def return if elif else for while in not and or is None True False class self import from as pass break continue lambda try except raise with len range list dict set int str float max min sorted enumerate",
    cpp: "int long double float char bool void return if else for while class struct public private const auto vector string map set unordered_map true false nullptr new delete using namespace std include",
    java: "int long double float char boolean void return if else for while class public private static final new true false null String int[] HashMap Map List ArrayList this",
  };
  const kwSets = Object.fromEntries(Object.entries(KW).map(([k, v]) => [k, new Set(v.split(" "))]));
  function highlight(src) {
    const re = lang === "python"
      ? /(#.*$)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)/gm
      : /(\/\/.*$|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_$][\w$]*\b)/gm;
    const kw = kwSets[lang];
    let out = "", last = 0;
    src.replace(re, (m, c, s, n, w, idx) => {
      out += esc(src.slice(last, idx));
      if (c) out += `<span class="cm">${esc(m)}</span>`;
      else if (s) out += `<span class="str">${esc(m)}</span>`;
      else if (n) out += `<span class="num">${m}</span>`;
      else if (kw.has(w)) out += `<span class="kw">${m}</span>`;
      else if (src[idx + m.length] === "(") out += `<span class="fn">${m}</span>`;
      else out += esc(m);
      last = idx + m.length;
      return m;
    });
    return out + esc(src.slice(last));
  }
  const codeKey = () => `code_${current.id}_${lang}`;
  function paint() {
    hl.innerHTML = highlight(ta.value) + "\n";
    const n = ta.value.split("\n").length;
    gutter.textContent = Array.from({ length: n }, (_, i) => i + 1).join("\n");
    syncScroll();
  }
  function syncScroll() { pre.scrollTop = ta.scrollTop; pre.scrollLeft = ta.scrollLeft; gutter.scrollTop = ta.scrollTop; }
  function loadCode() { ta.value = HC.store.get(codeKey(), current.starter[lang]); paint(); }
  let saveT;
  ta.addEventListener("input", () => { paint(); clearTimeout(saveT); saveT = setTimeout(() => HC.store.set(codeKey(), ta.value), 300); });
  ta.addEventListener("scroll", syncScroll);
  function insert(text, selectOffset) {
    const { selectionStart: s, selectionEnd: e } = ta;
    ta.setRangeText(text, s, e, "end");
    if (selectOffset != null) ta.selectionStart = ta.selectionEnd = s + selectOffset;
    ta.dispatchEvent(new Event("input"));
  }
  ta.addEventListener("keydown", (e) => {
    const indent = lang === "python" || lang === "java" ? "    " : "  ";
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); e.shiftKey ? judge("submit") : judge("run"); return; }
    if (e.key === "Tab") {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: en, value: v } = ta;
      if (s === en && !e.shiftKey) return insert(indent);
      // indent / outdent selected lines
      const ls = v.lastIndexOf("\n", s - 1) + 1;
      const block = v.slice(ls, en);
      const next = e.shiftKey ? block.replace(new RegExp("^" + indent, "gm"), "") : block.replace(/^/gm, indent);
      ta.setRangeText(next, ls, en, "select");
      ta.dispatchEvent(new Event("input"));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const v = ta.value, s = ta.selectionStart;
      const line = v.slice(v.lastIndexOf("\n", s - 1) + 1, s);
      let ind = line.match(/^\s*/)[0];
      const prev = line.trimEnd().slice(-1);
      if ("{[(:".includes(prev) && prev) ind += indent;
      const nextCh = v[s];
      if ("{[(".includes(prev) && prev && "}])".includes(nextCh) && nextCh) {
        return insert("\n" + ind + "\n" + ind.slice(indent.length), ind.length + 1);
      }
      return insert("\n" + ind);
    }
    const pairs = { "(": ")", "[": "]", "{": "}", '"': '"', "'": "'", "`": "`" };
    if (pairs[e.key] && ta.selectionStart === ta.selectionEnd) {
      const next = ta.value[ta.selectionStart];
      if (e.key === next && `"'\``.includes(e.key)) { e.preventDefault(); ta.selectionStart = ta.selectionEnd = ta.selectionStart + 1; return; }
      if (!next || /[\s)\]};,]/.test(next)) { e.preventDefault(); return insert(e.key + pairs[e.key], 1); }
    }
    if (")]}".includes(e.key) && ta.value[ta.selectionStart] === e.key) { e.preventDefault(); ta.selectionStart = ta.selectionEnd = ta.selectionStart + 1; }
  });

  // ---------- Judge ----------
  const workerSrc = `
    self.onmessage = function (e) {
      var d = e.data, logs = [];
      var con = { log: function () { logs.push([].slice.call(arguments).map(function (x) { return typeof x === "string" ? x : JSON.stringify(x); }).join(" ")); } };
      con.error = con.warn = con.info = con.log;
      var fn;
      try { fn = new Function("console", d.code + "\\n;return typeof " + d.fn + " !== 'undefined' ? " + d.fn + " : undefined;")(con); }
      catch (err) { self.postMessage({ type: "CE", error: String(err), logs: logs }); return; }
      if (typeof fn !== "function") { self.postMessage({ type: "CE", error: "Function '" + d.fn + "' was not found. Keep the function name from the starter code.", logs: logs }); return; }
      var results = d.tests.map(function (t) {
        var t0 = performance.now();
        try { var out = fn.apply(null, JSON.parse(JSON.stringify(t.args))); return { ok: true, out: out === undefined ? null : out, ms: performance.now() - t0 }; }
        catch (err) { return { ok: false, error: String(err), ms: performance.now() - t0 }; }
      });
      self.postMessage({ type: "done", results: results, logs: logs.slice(0, 50) });
    };`;
  const workerURL = URL.createObjectURL(new Blob([workerSrc], { type: "text/javascript" }));

  function runInWorker(code, p, tests) {
    return new Promise((resolve) => {
      const w = new Worker(workerURL);
      const timer = setTimeout(() => { w.terminate(); resolve({ type: "TLE" }); }, TIME_LIMIT_MS);
      w.onmessage = (e) => { clearTimeout(timer); w.terminate(); resolve(e.data); };
      w.onerror = (e) => { clearTimeout(timer); w.terminate(); resolve({ type: "CE", error: e.message }); e.preventDefault(); };
      w.postMessage({ code, fn: p.fn, tests: tests.map((t) => ({ args: t.args })) });
    });
  }
  const normalize = (v, p) => (p.compare === "sorted" && Array.isArray(v) ? [...v].sort((a, b) => a - b) : v);
  const same = (a, b, p) => JSON.stringify(normalize(a, p)) === JSON.stringify(normalize(b, p));
  const show = (v) => esc(JSON.stringify(v));

  let busy = false;
  async function judge(kind) {
    if (busy) return;
    const p = current;
    if (kind === "submit" && rated && !HC.isRegistered(contest.id)) {
      return HC.requireUser(() => HC.openCheckout(contest.id));
    }
    showConsole("result");
    const body = $("#consoleBody");
    if (lang !== "javascript") {
      body.innerHTML = `<div class="verdict-banner" style="color:var(--cyan)">ℹ Demo judge</div><p class="muted">In this preview, only <b>JavaScript</b> solutions are executed in your browser. ${esc($("#lang").selectedOptions[0].text)} will run on the secure server-side judge at launch.</p><p style="margin-top:10px"><button class="btn btn-outline btn-sm" id="toJs">Switch to JavaScript</button></p>`;
      $("#toJs").onclick = () => { $("#lang").value = "javascript"; $("#lang").dispatchEvent(new Event("change")); };
      return;
    }
    busy = true;
    $("#runBtn").disabled = $("#submitBtn").disabled = true;
    const tests = kind === "run" ? p.tests.slice(0, 2) : p.tests;
    body.innerHTML = `<div class="verdict-banner"><span class="spinner"></span> ${kind === "run" ? "Running sample tests" : "Judging against " + tests.length + " tests"}…</div>`;
    const t0 = performance.now();
    const [res] = await Promise.all([runInWorker(ta.value, p, tests), new Promise((r) => setTimeout(r, 450))]);
    const wall = Math.round(performance.now() - t0 - 450);
    busy = false;
    $("#runBtn").disabled = $("#submitBtn").disabled = false;

    let verdict, passed = 0, html = "";
    if (res.type === "TLE") { verdict = "TLE"; html = `<p class="muted">Your code ran longer than ${TIME_LIMIT_MS / 1000}s. Check for infinite loops or use a faster algorithm.</p>`; }
    else if (res.type === "CE") { verdict = "CE"; html = `<pre class="test-result fail" style="display:block;white-space:pre-wrap;color:var(--red)">${esc(res.error)}</pre>`; }
    else {
      const rows = res.results.map((r, i) => {
        const t = tests[i];
        const ok = r.ok && same(r.out, t.expected, p);
        if (ok) passed++;
        const hidden = kind === "submit" && i >= 2;
        return { ok, r, t, i, hidden };
      });
      const firstErr = rows.find((x) => !x.r.ok);
      verdict = passed === tests.length ? "AC" : firstErr ? "RE" : "WA";
      const visible = kind === "run" ? rows : rows.filter((x) => !x.ok || !x.hidden).slice(0, 4);
      html = visible.map((x) => `
        <div class="test-result ${x.ok ? "pass" : "fail"}">
          <span class="lbl">${x.ok ? "✔" : "✕"} Test ${x.i + 1}${x.hidden ? " (hidden)" : ""}</span><span class="${x.ok ? "accent" : ""}" style="color:${x.ok ? "" : "var(--red)"}">${x.ok ? "Passed" : x.r.ok ? "Wrong answer" : "Runtime error"} · ${x.r.ms.toFixed(1)}ms</span>
          ${x.hidden && !x.ok ? "" : `<span class="lbl">Input</span><span>${x.t.args.map(show).join(", ")}</span>`}
          ${x.r.ok ? `<span class="lbl">Output</span><span>${show(x.r.out)}</span>` : `<span class="lbl">Error</span><span style="color:var(--orange)">${esc(x.r.error)}</span>`}
          ${x.hidden && !x.ok ? "" : `<span class="lbl">Expected</span><span>${show(x.t.expected)}</span>`}
        </div>`).join("");
      if (kind === "submit" && passed > 0 && passed < tests.length) html = `<p class="muted" style="margin-bottom:10px">${passed} of ${tests.length} tests passed. Showing sample tests and the first failures.</p>` + html;
      if (res.logs && res.logs.length) html += `<div style="margin-top:12px"><span class="lbl muted">Console output</span>${res.logs.map((l) => `<div class="log-line">&gt; ${esc(l)}</div>`).join("")}</div>`;
    }
    const names = { AC: ["Accepted", "var(--green)", "✔"], WA: ["Wrong Answer", "var(--red)", "✕"], RE: ["Runtime Error", "var(--orange)", "⚠"], TLE: ["Time Limit Exceeded", "var(--amber)", "⏱"], CE: ["Compilation Error", "var(--red)", "✕"] };
    const [label, color, icon] = names[verdict];
    const wasSolved = bestVerdict(p.id) === "AC";
    body.innerHTML = `<div class="verdict-banner" style="color:${color}">${icon} ${kind === "run" && verdict === "AC" ? "Sample tests passed" : label} <small>${passed}/${tests.length} tests · ${verdict === "TLE" ? ">" + TIME_LIMIT_MS : Math.max(1, wall)}ms</small></div>` + html
      + (kind === "run" && verdict === "AC" ? `<p class="muted" style="margin-top:8px">Looks good! Hit <b>Submit</b> to run the hidden tests.</p>` : "");

    // Record
    const sub = { id: Date.now(), ctx: ctxKey, contest: contest?.id || null, problem: p.id, lang, kind, verdict, passed, total: tests.length, ms: verdict === "TLE" ? TIME_LIMIT_MS : Math.max(1, wall), at: Date.now() };
    HC.store.set("subs", [sub, ...HC.subs()].slice(0, 300));
    if (kind === "submit") {
      if (verdict === "AC" && !wasSolved) {
        HC.toast(`<b>${esc(p.title)}</b> solved! +${p.points} points${HC.user() ? "" : ". <a class='accent' href='#' data-auth='signup'>Sign up</a> to save your progress."}`);
        confetti();
      }
      renderTabs(); renderBar(); renderProblem();
    }
  }

  function confetti() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const c = document.createElement("canvas");
    Object.assign(c.style, { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 150 });
    c.width = innerWidth; c.height = innerHeight;
    document.body.appendChild(c);
    const ctx = c.getContext("2d");
    const colors = ["#39ff88", "#22d3ee", "#a78bfa", "#fbbf24", "#f472b6"];
    const bits = Array.from({ length: 140 }, () => ({ x: innerWidth / 2, y: innerHeight / 2, vx: (Math.random() - 0.5) * 16, vy: Math.random() * -16 - 4, s: 4 + Math.random() * 5, c: colors[(Math.random() * 5) | 0], r: Math.random() * 6 }));
    let f = 0;
    (function frame() {
      ctx.clearRect(0, 0, c.width, c.height);
      bits.forEach((b) => { b.x += b.vx; b.y += b.vy; b.vy += 0.45; b.r += 0.1; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.r); ctx.fillStyle = b.c; ctx.fillRect(-b.s / 2, -b.s / 2, b.s, b.s * 0.6); ctx.restore(); });
      if (++f < 110) requestAnimationFrame(frame); else c.remove();
    })();
  }

  // ---------- Console tabs ----------
  function showConsole(tab) {
    $$("[data-ctab]").forEach((b) => b.classList.toggle("active", b.dataset.ctab === tab));
    if (tab === "subs") {
      const subs = mySubs().filter((s) => s.problem === current.id && s.kind === "submit").slice(0, 20);
      const names = { AC: "Accepted", WA: "Wrong Answer", RE: "Runtime Error", TLE: "Time Limit", CE: "Compile Error" };
      $("#consoleBody").innerHTML = subs.length
        ? `<table class="lb" style="min-width:0"><thead><tr><th>When</th><th>Verdict</th><th>Tests</th><th>Lang</th><th>Time</th></tr></thead><tbody>${subs.map((s) => `<tr><td class="muted">${HC.ago(s.at)}</td><td><span class="verdict ${s.verdict.toLowerCase()}">${names[s.verdict]}</span></td><td class="num">${s.passed}/${s.total}</td><td>${s.lang}</td><td class="num">${s.ms}ms</td></tr>`).join("")}</tbody></table>`
        : `<div class="empty"><span class="icon">⌁</span>No submissions for this problem yet.</div>`;
    }
  }
  function idleConsole() {
    $("#consoleBody").innerHTML = `<p class="muted">Write your solution above, then press <b>Run</b> to check the sample tests or <b>Submit</b> for the full judge.</p>
      ${!HC.user() ? `<p class="muted" style="margin-top:8px">Tip: <a href="#" class="accent" data-auth="signup">create an account</a> to track your solved problems on your dashboard.</p>` : ""}`;
  }
  $$("[data-ctab]").forEach((b) => b.addEventListener("click", () => (b.dataset.ctab === "result" ? (showConsole("result"), idleConsole()) : showConsole("subs"))));

  // ---------- Wiring ----------
  function selectProblem(id) {
    current = HC.problem(id);
    history.replaceState(null, "", `arena.html?${contest ? "contest=" + contest.id + "&" : ""}problem=${id}`);
    renderTabs(); renderProblem(); loadCode(); showConsole("result"); idleConsole();
    $("#probBody").scrollTop = 0;
  }
  $("#probTabs").addEventListener("click", (e) => { const b = e.target.closest("[data-pid]"); if (b) selectProblem(b.dataset.pid); });
  $("#lang").value = lang;
  $("#lang").addEventListener("change", (e) => { lang = e.target.value; HC.store.set("lang", lang); loadCode(); showConsole("result"); idleConsole(); });
  $("#resetCode").addEventListener("click", () => { if (confirm("Reset your code to the starter template?")) { HC.store.del(codeKey()); loadCode(); } });
  $("#runBtn").addEventListener("click", () => judge("run"));
  $("#submitBtn").addEventListener("click", () => judge("submit"));
  document.addEventListener("hc:change", () => { renderBar(); if (rated) renderMiniLb(); });

  renderBar(); renderTabs(); renderProblem(); loadCode(); idleConsole();
  if (rated) setInterval(() => $("#miniLb") && renderMiniLb(), 15000);
  if (contest && rated && !HC.isRegistered(contest.id)) HC.toast(`You're viewing <b>${esc(contest.title)}</b>. Register to submit rated solutions.`, "info");
})();
