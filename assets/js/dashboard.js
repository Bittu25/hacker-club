(function () {
  const { $, esc, money } = HC;
  const { DAY } = HC.time;

  function loggedOut() {
    $("#root").innerHTML = `
      <section class="section">
        <div class="narrow center">
          <p class="eyebrow">// dashboard</p>
          <h1 style="font-size:clamp(2rem,5vw,3rem)">Your hacker HQ</h1>
          <p class="sub center" style="margin-bottom:28px">Track your rating, solved problems, upcoming events and badges — all in one place. Log in or create a free account to get started.</p>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
            <button class="btn btn-primary btn-lg" data-auth="signup">Create free account</button>
            <button class="btn btn-outline btn-lg" data-auth="login">Log in</button>
          </div>
        </div>
      </section>`;
  }

  function ratingHistory(u) {
    // Built from real activity: +30 per contest joined, +45 per newly solved problem
    const events = [
      ...HC.regs().filter((r) => r.kind === "contest").map((r) => ({ at: r.at, d: 30, label: "Joined " + (HC.contest(r.id)?.title || "contest") })),
    ];
    const seen = new Set();
    [...HC.subs()].reverse().forEach((s) => {
      if (s.kind === "submit" && s.verdict === "AC" && !seen.has(s.problem)) { seen.add(s.problem); events.push({ at: s.at, d: 45, label: "Solved " + (HC.problem(s.problem)?.title || s.problem) }); }
    });
    events.sort((a, b) => a.at - b.at);
    let r = 1200;
    const pts = [{ at: u.joined, r, label: "Joined Hacker Club" }];
    events.forEach((e) => { r += e.d; pts.push({ at: e.at, r, label: e.label }); });
    return pts;
  }

  function chartSVG(pts) {
    const W = 640, H = 220, P = 34;
    const min = Math.min(...pts.map((p) => p.r)) - 40, max = Math.max(...pts.map((p) => p.r)) + 40;
    const x = (i) => P + (i / Math.max(1, pts.length - 1)) * (W - P * 2);
    const y = (v) => H - P - ((v - min) / (max - min)) * (H - P * 2);
    const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.r).toFixed(1)}`).join(" ");
    const area = `${line} L${x(pts.length - 1)},${H - P} L${x(0)},${H - P} Z`;
    const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => { const v = Math.round(min + (max - min) * f); return `<line x1="${P}" x2="${W - P}" y1="${y(v)}" y2="${y(v)}" stroke="#1e2d26" stroke-dasharray="3 4"/><text x="${P - 6}" y="${y(v) + 4}" fill="#8aa399" font-size="10" text-anchor="end" font-family="JetBrains Mono">${v}</text>`; }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Rating history chart">
      <defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#39ff88" stop-opacity=".35"/><stop offset="1" stop-color="#39ff88" stop-opacity="0"/></linearGradient></defs>
      ${grid}
      <path d="${area}" fill="url(#g)"/>
      <path d="${line}" fill="none" stroke="#39ff88" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.r)}" r="4.5" fill="#070b09" stroke="#39ff88" stroke-width="2" data-i="${i}" style="cursor:pointer"/>`).join("")}
    </svg>`;
  }

  function heatmap() {
    const counts = {};
    HC.subs().forEach((s) => { const k = new Date(s.at).toDateString(); counts[k] = (counts[k] || 0) + 1; });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(today - (26 * 7 - 1) * DAY - today.getDay() * DAY);
    const cells = [];
    for (let d = new Date(start); d <= today; d = new Date(+d + DAY)) {
      const n = counts[d.toDateString()] || 0;
      cells.push(`<i data-l="${n ? Math.min(4, Math.ceil(n / 2)) : 0}" title="${d.toLocaleDateString()} · ${n} submission${n === 1 ? "" : "s"}"></i>`);
    }
    return cells.join("");
  }

  function badges(u, st) {
    const subs = HC.subs(), regs = HC.regs();
    const acs = new Set(subs.filter((s) => s.kind === "submit" && s.verdict === "AC").map((s) => s.problem));
    return [
      ["🎉", "Club member", "Created an account", true],
      ["🩸", "First blood", "Solve your first problem", acs.size >= 1],
      ["🧠", "Problem solver", "Solve 3 problems", acs.size >= 3],
      ["🏁", "Completionist", "Solve every practice problem", acs.size >= HC.problems.length],
      ["⚔", "Competitor", "Join a contest", regs.some((r) => r.kind === "contest")],
      ["🚀", "Hackathoner", "Join a hackathon", regs.some((r) => r.kind === "hackathon")],
      ["🔁", "Persistent", "Make 10 submissions", subs.length >= 10],
      ["🦉", "Night owl", "Submit between midnight and 5am", subs.some((s) => new Date(s.at).getHours() < 5)],
      ["⚡", "Pro", "Upgrade to Hacker Pro", u.plan === "pro"],
      ["🏆", "Specialist", "Reach a 1400 rating", st.rating >= 1400],
    ].map(([ic, name, desc, got]) => `<div class="achv ${got ? "" : "lockd"}" title="${esc(desc)}"><span class="ic">${ic}</span><b>${name}</b><small>${got ? "Unlocked" : esc(desc)}</small></div>`).join("");
  }

  function render() {
    const u = HC.user();
    if (!u) return loggedOut();
    const st = HC.myStats();
    const tier = HC.tier(st.rating);
    const all = [...HC.hackers, st].sort((a, b) => b.rating - a.rating);
    const rank = all.findIndex((h) => h.me) + 1;
    const pts = ratingHistory(u);
    const regs = HC.regs().map((r) => ({ ...r, ...HC.findEvent(r.id) })).filter((r) => r.ev);
    const upcoming = regs.filter((r) => HC.status(r.ev).state !== "ended").sort((a, b) => a.ev.start - b.ev.start);
    const subs = HC.subs().filter((s) => s.kind === "submit").slice(0, 8);
    const names = { AC: "Accepted", WA: "Wrong Answer", RE: "Runtime Error", TLE: "Time Limit", CE: "Compile Error" };
    const spent = regs.reduce((s, r) => s + (r.paid || 0), 0);

    $("#root").innerHTML = `
    <section class="page-hero">
      <div class="container dash-head">
        ${HC.avatar(u.handle, "lg")}
        <div class="info">
          <p class="crumbs">dashboard</p>
          <h1>${esc(u.handle)} ${u.plan === "pro" ? '<span class="badge registered" style="vertical-align:middle">PRO</span>' : ""}</h1>
          <p class="muted"><span style="color:${tier.color};font-weight:700">${tier.name}</span> · ${HC.flag(u.country)} ${esc(u.country)} · member since ${HC.fmtDay(u.joined)}</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <a class="btn btn-primary" href="arena.html">⌨ Practice now</a>
          <a class="btn btn-outline" href="contests.html">Find a contest</a>
        </div>
      </div>
    </section>

    <div class="container" style="padding-bottom:80px">
      <div class="stat-cards">
        <div class="stat-card"><small>Rating</small><b style="color:${tier.color}">${st.rating}</b><span class="delta">${pts.length > 1 ? "+" + (st.rating - 1200) + " since joining" : "Starts at 1200"}</span></div>
        <div class="stat-card"><small>Global rank</small><b>#${rank}</b><span class="delta">of ${all.length} hackers</span></div>
        <div class="stat-card"><small>Problems solved</small><b>${st.solved}</b><span class="delta">${HC.problems.length - Math.min(st.solved, HC.problems.length)} practice problems left</span></div>
        <div class="stat-card"><small>Events joined</small><b>${regs.length}</b><span class="delta">${money(spent)} in entry fees</span></div>
      </div>

      <div class="dash-grid">
        <div>
          <div class="panel">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px"><h3 style="margin:0">Rating history</h3><span class="muted mono" style="font-size:.8rem">${pts.length - 1} rating event${pts.length === 2 ? "" : "s"}</span></div>
            ${pts.length > 1
              ? `<div class="chart-wrap" id="chart">${chartSVG(pts)}<div class="chart-tip" id="tip"></div></div>`
              : `<div class="empty"><span class="icon">📈</span>Your rating chart fills in as you solve problems and join contests.<br><a class="accent" href="arena.html">Solve your first problem →</a></div>`}
          </div>
          <div class="panel">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px"><h3 style="margin:0">Activity</h3><span class="muted" style="font-size:.8rem">Last 26 weeks · ${HC.subs().length} submissions</span></div>
            <div class="heatmap">${heatmap()}</div>
          </div>
          <div class="panel">
            <h3>Recent submissions</h3>
            ${subs.length ? `<div class="table-wrap" style="border:0"><table class="lb" style="min-width:0"><thead><tr><th>Problem</th><th>Verdict</th><th>Tests</th><th>When</th></tr></thead><tbody>
              ${subs.map((s) => `<tr><td><a href="arena.html?${s.contest ? "contest=" + s.contest + "&" : ""}problem=${s.problem}">${esc(HC.problem(s.problem)?.title || s.problem)}</a></td><td><span class="verdict ${s.verdict.toLowerCase()}">${names[s.verdict]}</span></td><td class="num">${s.passed}/${s.total}</td><td class="muted">${HC.ago(s.at)}</td></tr>`).join("")}
            </tbody></table></div>` : `<div class="empty"><span class="icon">⌁</span>No submissions yet.</div>`}
          </div>
        </div>

        <div>
          <div class="panel">
            <h3>My upcoming events</h3>
            <div class="list">
              ${upcoming.length ? upcoming.map((r) => {
                const s = HC.status(r.ev);
                const href = r.kind === "contest" ? `contest.html?id=${r.ev.id}` : `hackathon.html?id=${r.ev.id}`;
                return `<div class="list-item"><div><a href="${href}"><b>${esc(r.ev.title)}</b></a><br><small class="muted">${r.kind}${r.team ? " · team " + esc(r.team) : ""}</small></div>
                  ${s.state === "live" ? (r.kind === "contest" ? `<a class="btn btn-primary btn-sm" href="arena.html?contest=${r.ev.id}">Enter</a>` : '<span class="badge live">Live</span>') : `<span class="countdown" data-cd="${r.ev.start}" style="font-size:.8rem">${HC.countdown(r.ev.start)}</span>`}</div>`;
              }).join("") : `<div class="empty"><span class="icon">📅</span>You haven't registered for anything yet.<br><a class="accent" href="contests.html">Browse contests →</a></div>`}
            </div>
          </div>
          <div class="panel">
            <h3>Badges</h3>
            <div class="badges">${badges(u, st)}</div>
          </div>
          <div class="panel">
            <h3>Profile settings</h3>
            <form id="profileForm" class="form-grid">
              <label class="field">Username<input name="handle" value="${esc(u.handle)}" required minlength="3" maxlength="20" pattern="[A-Za-z0-9_]+" /></label>
              <label class="field">Country<select name="country">${HC.countries.map(([n, f]) => `<option ${n === u.country ? "selected" : ""} value="${n}">${f} ${n}</option>`).join("")}</select></label>
              <button class="btn btn-primary" type="submit">Save changes</button>
            </form>
            <hr style="border:0;border-top:1px solid var(--border);margin:20px 0" />
            <button class="btn btn-danger btn-sm" id="resetData">Reset demo data</button>
          </div>
        </div>
      </div>
    </div>`;

    // Chart tooltip
    const chart = $("#chart");
    if (chart) {
      chart.addEventListener("mousemove", (e) => {
        const c = e.target.closest("circle");
        const tip = $("#tip");
        if (!c) { tip.style.opacity = 0; return; }
        const p = pts[+c.dataset.i];
        const box = chart.getBoundingClientRect(), cb = c.getBoundingClientRect();
        tip.innerHTML = `<b style="color:var(--green)">${p.r}</b> · ${esc(p.label)}<br><span class="muted">${HC.fmtDay(p.at)}</span>`;
        tip.style.left = cb.left - box.left + cb.width / 2 + "px";
        tip.style.top = cb.top - box.top + "px";
        tip.style.opacity = 1;
      });
      chart.addEventListener("mouseleave", () => ($("#tip").style.opacity = 0));
    }
    $("#profileForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      HC.store.set("user", { ...HC.user(), handle: f.get("handle").trim(), country: f.get("country") });
      HC.toast("Profile updated.");
      location.reload();
    });
    $("#resetData").addEventListener("click", () => {
      if (!confirm("This clears your demo account, registrations and submissions from this browser. Continue?")) return;
      try { Object.keys(localStorage).filter((k) => k.startsWith("hc_")).forEach((k) => localStorage.removeItem(k)); } catch {}
      location.href = "index.html";
    });
  }

  render();
  document.addEventListener("hc:change", render);
})();
