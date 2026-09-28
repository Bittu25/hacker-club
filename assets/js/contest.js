(function () {
  const { $, esc, money } = HC;
  const c = HC.contest(HC.param("id")) || null;

  if (!c) {
    $("#root").innerHTML = `<section class="section"><div class="narrow center"><h1>404</h1><p class="muted">We couldn't find that contest.</p><a class="btn btn-primary" href="contests.html" style="margin-top:20px">Browse contests</a></div></section>`;
    return;
  }
  document.title = `${c.title} — Hacker Club`;

  // Seeded standings for live / ended contests
  function standings() {
    const r = HC.rng(c.id);
    const pool = [...HC.hackers].sort(() => r() - 0.5).slice(0, 25);
    const total = c.problems.length;
    const st = HC.status(c);
    const progress = st.state === "ended" ? 1 : Math.min(1, (Date.now() - c.start) / st.len);
    let rows = pool.map((h) => {
      const skill = (h.rating - 800) / 2700;
      const solved = Math.min(total, Math.round(total * progress * (0.35 + skill * 0.7 + r() * 0.25)));
      const pts = c.problems.slice(0, solved).reduce((s, id) => s + (HC.problem(id)?.points || 100), 0);
      return { h, solved, pts, penalty: Math.round(solved * (8 + r() * 30)) };
    });
    if (c.winners) c.winners.forEach((w, i) => { const row = rows.find((x) => x.h.name === w) || rows[i]; row.h = HC.hackers.find((x) => x.name === w) || row.h; row.pts = 99999 - i; });
    rows.sort((a, b) => b.pts - a.pts || a.penalty - b.penalty);
    if (c.winners) rows.forEach((x) => { if (x.pts > 9999) { x.solved = total; x.pts = c.problems.reduce((s, id) => s + (HC.problem(id)?.points || 100), 0); } });
    return rows;
  }

  function render() {
    const st = HC.status(c);
    const reg = HC.isRegistered(c.id);
    const fill = Math.min(100, Math.round((c.registered / c.capacity) * 100));
    const letters = "ABCDEFGH";
    const target = st.state === "live" ? st.end : c.start;

    $("#root").innerHTML = `
    <section class="detail-hero">
      <div class="bg" style="background:radial-gradient(ellipse at 20% 0%, rgba(57,255,136,.25), transparent 60%)"></div>
      <div class="container">
        <p class="crumbs"><a href="index.html">home</a><span>/</span><a href="contests.html">contests</a><span>/</span>${c.id}</p>
        <div class="chips" style="gap:8px;margin-top:16px">${HC.statusBadge(c)}<span class="badge ${c.level}">${c.level}</span><span class="badge cat">${HC.catName(c.category)}</span>${reg ? '<span class="badge registered">✓ You are registered</span>' : ""}</div>
        <h1>${esc(c.title)}</h1>
        <p class="lead">${esc(c.desc)}</p>
      </div>
    </section>

    <div class="container detail-grid">
      <div>
        <div class="page-tabs">
          <button data-tab="overview" class="active">Overview</button>
          <button data-tab="problems">Problems</button>
          <button data-tab="prizes">Prizes</button>
          <button data-tab="rules">Rules</button>
          <button data-tab="standings">Standings</button>
        </div>

        <div class="tab-panel active prose" data-panel="overview">
          <p>${esc(c.about)}</p>
          <h3>What to expect</h3>
          <ul>
            <li><b>${c.problems.length} problems</b> ordered roughly by difficulty.</li>
            <li><b>${HC.fmtDuration(c.durationMin)}</b> to solve as many as you can.</li>
            <li>Format: ${esc(c.format)}.</li>
            <li>Code in any of 40+ languages in the in-browser arena.</li>
            <li>Results and editorials are published right after the contest ends.</li>
          </ul>
          <h3>Schedule <small class="muted" style="font-weight:400;font-size:.8rem">(${HC.tz})</small></h3>
          <div class="timeline">
            ${[["Registration opens", c.start - 14 * HC.time.DAY], ["Registration closes", c.start - 10 * HC.time.MIN], ["Contest starts", c.start], ["Contest ends", st.end], ["Results & editorials", st.end + HC.time.HOUR]]
              .map(([l, t], i, arr) => { const done = Date.now() >= t; const now = done && (i === arr.length - 1 || Date.now() < arr[i + 1][1]); return `<div class="tl-item ${now ? "now" : done ? "done" : ""}"><b>${l}</b><small>${HC.fmtDate(t)}</small></div>`; }).join("")}
          </div>
        </div>

        <div class="tab-panel" data-panel="problems">
          ${st.state === "upcoming"
            ? `<div class="locked"><span class="icon">🔒</span><b style="color:var(--text)">Problems unlock when the contest starts</b><p style="margin:6px 0 16px">In the meantime, warm up in the practice arena.</p><a class="btn btn-outline" href="arena.html">Open practice arena</a></div>`
            : `<div class="problem-list">${c.problems.map((id, i) => { const p = HC.problem(id); return `
                <div class="problem-row"><span class="letter">${letters[i]}</span><div><b>${esc(p.title)}</b></div><span class="badge ${p.difficulty.toLowerCase()}">${p.difficulty}</span><span class="pts">${p.points} pts</span></div>`; }).join("")}</div>
              <p class="muted" style="margin-top:16px;font-size:.9rem">${st.state === "live" ? (reg ? '<a class="accent" href="arena.html?contest=' + c.id + '">Open these problems in the arena →</a>' : "Register to open these problems in the arena.") : `<a class="accent" href="arena.html?contest=${c.id}">Practice these problems (unrated) →</a>`}</p>`}
        </div>

        <div class="tab-panel" data-panel="prizes">
          <div class="podium">
            ${[1, 0, 2].map((i) => `<div class="place p${i + 1}"><span class="medal">${["🥇", "🥈", "🥉"][i]}</span><span class="amount">${money(c.prizes[i])}</span><small class="muted">${["1st place", "2nd place", "3rd place"][i]}</small>${c.winners ? `<div style="margin-top:8px;font-weight:600">${c.winners[i]}</div>` : ""}</div>`).join("")}
          </div>
          <div class="prose" style="margin-top:24px">
            <h3>Also up for grabs</h3>
            <ul>
              <li>Top 10: verified certificate and a <b>Top 10</b> profile badge.</li>
              <li>Top 25%: rating boost and eligibility for invite-only rounds.</li>
              <li>Everyone who solves at least one problem gets a participation certificate.</li>
            </ul>
            <p class="muted" style="font-size:.88rem">Prizes are paid within 7 days of results being finalised, after a fair-play review.</p>
          </div>
        </div>

        <div class="tab-panel prose" data-panel="rules">
          <h3 style="margin-top:0">Rules</h3>
          <ul>
            <li>Individual participation only${c.format.includes("Teams") ? " — except this event, which allows teams of up to 3" : ""}.</li>
            <li>You may use any personal notes, library code and official language documentation.</li>
            <li>Sharing solutions or collaborating during the contest is not allowed.</li>
            <li>AI coding assistants are <b>not allowed</b> in rated contests.</li>
            <li>Each wrong submission adds a 5-minute penalty to your time on that problem.</li>
            <li>Ties are broken by total time including penalties.</li>
            <li>Plagiarism checks run on every submission. Violations lead to disqualification.</li>
          </ul>
          <h3>Eligibility</h3>
          <p>Open to everyone aged 16+ worldwide, except where prohibited by local law. Prize winners must verify their identity before payout.</p>
        </div>

        <div class="tab-panel" data-panel="standings">
          ${st.state === "upcoming"
            ? `<div class="locked"><span class="icon">⏳</span><b style="color:var(--text)">Standings appear when the contest starts</b><p>${c.registered.toLocaleString()} hackers are registered so far.</p></div>`
            : `<div class="table-wrap"><table class="lb"><thead><tr><th>#</th><th>Hacker</th><th>Solved</th><th>Score</th><th>Penalty</th></tr></thead><tbody>
                ${standings().map((x, i) => `<tr><td class="rank ${i < 3 ? "r" + (i + 1) : ""}">${i + 1}</td><td><span class="user">${HC.avatar(x.h.name)}${esc(x.h.name)} <span>${HC.flag(x.h.country)}</span></span></td><td class="num">${x.solved}/${c.problems.length}</td><td class="num" style="color:var(--green)">${x.pts}</td><td class="num muted">${x.penalty}m</td></tr>`).join("")}
              </tbody></table></div>
              ${st.state === "live" ? '<p class="muted" style="margin-top:12px;font-size:.85rem"><span class="dot live"></span> Updating live</p>' : ""}`}
        </div>
      </div>

      <aside class="sidebar">
        <div class="panel">
          <p class="mono muted" style="font-size:.82rem;margin-bottom:10px">${st.state === "live" ? "// ends in" : st.state === "upcoming" ? "// starts in" : "// contest ended"}</p>
          ${st.state === "ended" ? `<p style="font-size:1.1rem;font-weight:700">${HC.fmtDay(st.end)}</p>` : `<div class="big-countdown" data-cd-blocks="${target}"></div>`}
          <div style="margin-top:18px;display:grid;gap:10px">
            ${HC.actionBtn(c, "contest", "btn-block btn-lg")}
            ${st.state === "upcoming" ? `<button class="btn btn-outline btn-block" id="ics">📅 Add to calendar</button>` : ""}
          </div>
          ${st.state !== "ended" ? `<div style="margin-top:18px"><div class="progress"><span style="width:${fill}%"></span></div><small class="muted">${c.registered.toLocaleString()} of ${c.capacity.toLocaleString()} spots filled (${fill}%)</small></div>` : ""}
        </div>
        <div class="panel">
          <h3>Contest details</h3>
          <div class="fact-list">
            <div><span>Prize pool</span><b class="amber mono">${money(c.prize)}</b></div>
            <div><span>Entry fee</span><b class="mono">${money(c.fee)}${HC.user()?.plan === "pro" ? ' <small class="accent">(free with Pro)</small>' : ""}</b></div>
            <div><span>Starts</span><b>${HC.fmtDate(c.start)}</b></div>
            <div><span>Duration</span><b>${HC.fmtDuration(c.durationMin)}</b></div>
            <div><span>Format</span><b>${esc(c.format)}</b></div>
            <div><span>Problems</span><b>${c.problems.length}</b></div>
            <div><span>Rated</span><b>Yes</b></div>
          </div>
        </div>
        <div class="panel" style="display:flex;gap:10px">
          <button class="btn btn-outline btn-sm" style="flex:1" id="share">🔗 Copy link</button>
          <a class="btn btn-outline btn-sm" style="flex:1" href="contests.html">← All contests</a>
        </div>
      </aside>
    </div>`;

    HC.initTabs($("#root"));
    $("#ics")?.addEventListener("click", () => HC.downloadICS(c));
    $("#share").addEventListener("click", HC.copyLink);
  }

  render();
  document.addEventListener("hc:change", render);
})();
