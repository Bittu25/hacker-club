(function () {
  const { $, esc, money } = HC;
  const { HOUR, DAY } = HC.time;
  const h = HC.hackathon(HC.param("id"));

  if (!h) {
    $("#root").innerHTML = `<section class="section"><div class="narrow center"><h1>404</h1><p class="muted">We couldn't find that hackathon.</p><a class="btn btn-primary" href="hackathons.html" style="margin-top:20px">Browse hackathons</a></div></section>`;
    return;
  }
  document.title = `${h.title} — Hacker Club`;

  const postsKey = "team_posts_" + h.id;
  const seekers = () => [...HC.store.get(postsKey, []), ...HC.teamSeekers];

  function timeline() {
    const end = h.start + h.lengthHrs * HOUR;
    return [
      ["Registration opens", h.start - 30 * DAY],
      ["Team formation & mentor AMAs", h.start - 7 * DAY],
      ["Kickoff stream · themes revealed", h.start],
      ["Mid-point check-in", h.start + (h.lengthHrs / 2) * HOUR],
      ["Submissions close", end],
      ["Judging", end + 2 * HOUR],
      ["Winners announced (live stream)", end + 3 * DAY],
    ];
  }

  function seekerHTML() {
    return seekers().map((s) => `
      <div class="panel person" style="margin-top:0">
        ${HC.avatar(s.name)}
        <div class="who">
          <b>${esc(s.name)} <span style="font-weight:400">${HC.flag(s.country)}</span>${s.mine ? ' <span class="badge registered">You</span>' : ""}</b>
          <small>${esc(s.role)}</small>
          <p>${esc(s.note)}</p>
          <div class="tags">${s.skills.map((k) => `<span class="tag">${esc(k)}</span>`).join("")}</div>
        </div>
        ${s.mine ? `<button class="btn btn-danger btn-sm" data-remove-post>Remove</button>` : `<button class="btn btn-outline btn-sm" data-invite="${esc(s.name)}">Invite</button>`}
      </div>`).join("");
  }

  function render() {
    const st = HC.status(h);
    const reg = HC.regs().find((r) => r.id === h.id);
    const total = h.prizes.reduce((s, p) => s + p.amount, 0) + h.tracks.reduce((s, t) => s + t.prize, 0);

    $("#root").innerHTML = `
    <section class="detail-hero banner">
      <div class="bg" style="background:${h.gradient};opacity:.55"></div>
      <div class="container">
        <p class="crumbs"><a href="index.html">home</a><span>/</span><a href="hackathons.html">hackathons</a><span>/</span>${h.id}</p>
        <div class="chips" style="gap:8px;margin-top:16px">${HC.statusBadge(h)}<span class="badge cat">${esc(h.theme)}</span>${reg ? `<span class="badge registered">✓ Registered${reg.team ? " as " + esc(reg.team) : ""}</span>` : ""}</div>
        <h1>${esc(h.title)}</h1>
        <p class="lead">${esc(h.tagline)}</p>
        <div class="tags" style="margin-top:14px">${h.tags.map((t) => `<span class="tag">#${esc(t)}</span>`).join("")}</div>
      </div>
    </section>

    <div class="container detail-grid">
      <div>
        <div class="page-tabs">
          <button data-tab="overview" class="active">Overview</button>
          <button data-tab="tracks">Tracks</button>
          <button data-tab="prizes">Prizes</button>
          <button data-tab="schedule">Schedule</button>
          <button data-tab="judging">Judging</button>
          <button data-tab="teams">Team finder</button>
        </div>

        <div class="tab-panel active prose" data-panel="overview">
          <p>${esc(h.about)}</p>
          <h3>Who should join?</h3>
          <ul>
            <li>Developers, designers, data scientists and product people — all skill levels welcome.</li>
            <li>Teams of ${h.teamSize} people. Solo hackers can use the <a class="accent" href="#teams" data-goto="teams">team finder</a>.</li>
            <li>Anyone aged 16+, from anywhere in the world.</li>
          </ul>
          <h3>What you'll submit</h3>
          <ul>
            <li>A public code repository with a README.</li>
            <li>A demo video of up to 3 minutes.</li>
            <li>A short written pitch: the problem, your solution and what's next.</li>
          </ul>
          <h3>Resources</h3>
          <p>Every registered team gets access to mentor office hours, a shared Discord-style chat, starter kits for each track and cloud credits from our sponsors.</p>
        </div>

        <div class="tab-panel" data-panel="tracks">
          <div class="cards" style="grid-template-columns:1fr">
            ${h.tracks.map((t, i) => `
              <div class="card">
                <div class="card-top"><span class="mono accent">track_0${i + 1}</span><span class="mono amber">${money(t.prize)} track prize</span></div>
                <h3>${esc(t.name)}</h3>
                <p class="desc">${esc(t.desc)}</p>
              </div>`).join("")}
          </div>
          <p class="muted" style="margin-top:16px;font-size:.9rem">Every project competes for the overall prizes <i>and</i> one track prize of your choice.</p>
        </div>

        <div class="tab-panel" data-panel="prizes">
          <div class="pool-out" style="margin-bottom:22px">
            <p class="muted mono" style="font-size:.82rem">// total prize pool</p>
            <div class="big">${money(h.prize)}</div>
            <p class="muted" style="font-size:.85rem">${money(total)} in cash prizes · the rest as cloud credits &amp; swag</p>
          </div>
          <div class="list">
            ${h.prizes.map((p, i) => `<div class="list-item"><div><b>${["🥇", "🥈", "🏅"][i] || "🏅"} ${esc(p.place)}</b>${p.extra ? `<br><small class="muted">${esc(p.extra)}</small>` : ""}</div><b class="mono amber">${money(p.amount)}</b></div>`).join("")}
            ${h.tracks.map((t) => `<div class="list-item"><div><b>◆ ${esc(t.name)}</b><br><small class="muted">Track winner</small></div><b class="mono amber">${money(t.prize)}</b></div>`).join("")}
          </div>
        </div>

        <div class="tab-panel" data-panel="schedule">
          <p class="muted" style="margin-bottom:20px;font-size:.9rem">All times in ${HC.tz}.</p>
          <div class="timeline">
            ${timeline().map(([l, t], i, arr) => { const done = Date.now() >= t; const now = done && (i === arr.length - 1 || Date.now() < arr[i + 1][1]); return `<div class="tl-item ${now ? "now" : done ? "done" : ""}"><b>${l}</b><small>${HC.fmtDate(t)}</small></div>`; }).join("")}
          </div>
        </div>

        <div class="tab-panel" data-panel="judging">
          <p class="muted" style="margin-bottom:22px">Each project is scored by at least three judges. Scores are normalised to remove judge bias.</p>
          <div class="weights">
            ${HC.judging.map((j) => `<div class="weight-row"><div><b>${j.name}</b><br><small class="muted">${j.desc}</small></div><div class="bar"><span style="width:${j.weight * 2.5}%"></span></div><span class="pct">${j.weight}%</span></div>`).join("")}
          </div>
        </div>

        <div class="tab-panel" data-panel="teams">
          <div class="panel" style="margin-bottom:20px">
            <h3>Looking for teammates?</h3>
            <p class="muted" style="font-size:.9rem;margin:-6px 0 14px">Post a short intro so other hackers can find and invite you.</p>
            <form id="postForm" class="form-grid">
              <div class="form-row">
                <label class="field">Your role<input name="role" required maxlength="30" placeholder="e.g. Backend dev" /></label>
                <label class="field">Skills (comma separated)<input name="skills" required maxlength="80" placeholder="Python, React, Figma" /></label>
              </div>
              <label class="field">What are you looking for?<input name="note" required maxlength="140" placeholder="Looking for a designer for the climate track…" /></label>
              <button class="btn btn-primary" type="submit" style="justify-self:start">Post my profile</button>
            </form>
          </div>
          <div style="display:grid;gap:14px" id="seekers">${seekerHTML()}</div>
        </div>
      </div>

      <aside class="sidebar">
        <div class="panel">
          <p class="mono muted" style="font-size:.82rem;margin-bottom:10px">${st.state === "upcoming" ? "// kickoff in" : st.state === "live" ? "// submissions close in" : "// hackathon ended"}</p>
          ${st.state === "ended" ? "" : `<div class="big-countdown" data-cd-blocks="${st.state === "live" ? st.end : h.start}"></div>`}
          <div style="margin-top:18px;display:grid;gap:10px">
            ${HC.actionBtn(h, "hackathon", "btn-block btn-lg")}
            <button class="btn btn-outline btn-block" id="ics">📅 Add to calendar</button>
          </div>
        </div>
        <div class="panel">
          <h3>Hackathon details</h3>
          <div class="fact-list">
            <div><span>Prize pool</span><b class="amber mono">${money(h.prize)}</b></div>
            <div><span>Entry fee</span><b class="mono">${money(h.fee)} / team${HC.user()?.plan === "pro" ? ' <small class="accent">(50% off with Pro)</small>' : ""}</b></div>
            <div><span>Kickoff</span><b>${HC.fmtDate(h.start)}</b></div>
            <div><span>Length</span><b>${h.lengthHrs} hours</b></div>
            <div><span>Team size</span><b>${h.teamSize}</b></div>
            <div><span>Teams registered</span><b>${h.teams + (reg ? 1 : 0)}</b></div>
            <div><span>Location</span><b>Online · worldwide</b></div>
          </div>
        </div>
        <div class="panel" style="display:flex;gap:10px">
          <button class="btn btn-outline btn-sm" style="flex:1" id="share">🔗 Copy link</button>
          <a class="btn btn-outline btn-sm" style="flex:1" href="hackathons.html">← All hackathons</a>
        </div>
      </aside>
    </div>`;

    HC.initTabs($("#root"));
    $("#ics").addEventListener("click", () => HC.downloadICS(h));
    $("#share").addEventListener("click", HC.copyLink);
    $("[data-goto]")?.addEventListener("click", (e) => { e.preventDefault(); $('[data-tab="teams"]').click(); });

    $("#postForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      HC.requireUser(() => {
        const u = HC.user();
        const posts = HC.store.get(postsKey, []).filter((p) => !p.mine);
        posts.unshift({ mine: true, name: u.handle, country: u.country, role: f.get("role"), skills: f.get("skills").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6), note: f.get("note") });
        HC.store.set(postsKey, posts);
        $("#seekers").innerHTML = seekerHTML();
        e.target.reset();
        HC.toast("Your profile is live in the team finder.");
      });
    });
    $("#seekers").addEventListener("click", (e) => {
      const inv = e.target.closest("[data-invite]");
      if (inv) HC.requireUser(() => { inv.textContent = "Invited ✓"; inv.disabled = true; HC.toast(`Invite sent to <b>${esc(inv.dataset.invite)}</b>.`); });
      if (e.target.closest("[data-remove-post]")) { HC.store.set(postsKey, []); $("#seekers").innerHTML = seekerHTML(); HC.toast("Your post was removed.", "info"); }
    });
  }

  render();
  document.addEventListener("hc:change", render);
})();
