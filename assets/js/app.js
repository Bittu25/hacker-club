/* Hacker Club — shared app logic used by every page */
(function () {
  const HC = window.HC;
  const { MIN, HOUR, DAY } = HC.time;

  // ---------------- Helpers ----------------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  HC.$ = $; HC.$$ = $$;
  HC.esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  HC.money = (n) => "$" + Number(n).toLocaleString("en-US");
  HC.fmtDate = (ms, opts) => new Date(ms).toLocaleString(undefined, opts || { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  HC.fmtDay = (ms) => new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  HC.param = (k) => new URLSearchParams(location.search).get(k);
  HC.tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "local time"; } })();
  HC.pad = (n) => String(n).padStart(2, "0");
  HC.parts = (ms) => {
    let d = Math.max(0, ms);
    const days = Math.floor(d / DAY); d -= days * DAY;
    const h = Math.floor(d / HOUR); d -= h * HOUR;
    const m = Math.floor(d / MIN); d -= m * MIN;
    return { days, h, m, s: Math.floor(d / 1000) };
  };
  HC.countdown = (target) => {
    const p = HC.parts(target - Date.now());
    return (p.days ? `${p.days}d ` : "") + `${HC.pad(p.h)}:${HC.pad(p.m)}:${HC.pad(p.s)}`;
  };
  HC.ago = (ms) => {
    const s = Math.round((Date.now() - ms) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };
  const avatarColors = ["#39ff88", "#22d3ee", "#a78bfa", "#fbbf24", "#f472b6", "#fb923c", "#34d399", "#60a5fa"];
  HC.avatar = (name, cls = "") => {
    const i = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length;
    return `<span class="avatar ${cls}" style="background:${avatarColors[i]}">${HC.esc(name[0].toUpperCase())}</span>`;
  };

  // ---------------- Storage (safe) ----------------
  HC.store = {
    get(k, d) { try { const v = localStorage.getItem("hc_" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("hc_" + k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem("hc_" + k); } catch {} },
  };
  HC.user = () => HC.store.get("user", null);
  HC.regs = () => HC.store.get("regs", []);
  HC.isRegistered = (id) => HC.regs().some((r) => r.id === id);
  HC.subs = () => HC.store.get("subs", []);
  HC.emit = (name) => document.dispatchEvent(new CustomEvent(name));

  // ---------------- Event status ----------------
  HC.status = (ev) => {
    const len = ev.durationMin ? ev.durationMin * MIN : ev.lengthHrs * HOUR;
    const end = ev.start + len;
    const now = Date.now();
    return { state: now < ev.start ? "upcoming" : now < end ? "live" : "ended", end, len };
  };
  HC.statusBadge = (ev) => {
    const s = HC.status(ev).state;
    return s === "live" ? '<span class="badge live"><span class="dot red live"></span>Live now</span>'
      : s === "upcoming" ? '<span class="badge upcoming">Upcoming</span>' : '<span class="badge ended">Ended</span>';
  };
  HC.catName = (id) => (HC.categories.find((c) => c.id === id) || {}).name || id;
  HC.fmtDuration = (min) => (min >= 60 ? `${+(min / 60).toFixed(1)} hr${min > 60 ? "s" : ""}` : `${min} min`);

  // Primary action button for an event, depending on status + registration
  HC.actionBtn = (ev, kind, extra = "") => {
    const st = HC.status(ev).state;
    const reg = HC.isRegistered(ev.id);
    const detail = kind === "contest" ? `contest.html?id=${ev.id}` : `hackathon.html?id=${ev.id}`;
    if (st === "ended") return `<a class="btn btn-outline ${extra}" href="${detail}">View results</a>`;
    if (kind === "contest" && st === "live" && reg) return `<a class="btn btn-primary ${extra}" href="arena.html?contest=${ev.id}">Enter arena →</a>`;
    if (reg) return `<a class="btn btn-success ${extra}" href="${detail}">✓ Registered</a>`;
    const label = st === "live" ? (kind === "contest" ? "Join now" : "Join late") : kind === "contest" ? "Register" : "Join hackathon";
    return `<button class="btn ${st === "live" ? "btn-primary" : kind === "contest" ? "btn-outline" : "btn-primary"} ${extra}" data-register="${ev.id}" data-kind="${kind}">${label} · ${HC.money(ev.fee)}</button>`;
  };

  // The logged-in user joins the table with a rating based on their activity
  HC.myStats = function () {
    const u = HC.user();
    if (!u) return null;
    const solved = new Set(HC.subs().filter((s) => s.kind === "submit" && s.verdict === "AC").map((s) => s.problem)).size;
    const contests = HC.regs().filter((r) => r.kind === "contest").length;
    const rating = 1200 + solved * 45 + contests * 30;
    return { name: u.handle, country: u.country, rating, contests, solved, wins: 0, winnings: 0, season: solved * 120 + contests * 60, month: solved * 40 + contests * 20, me: true };
  };

  // ---------------- Shared card renderers ----------------
  HC.contestCard = (c) => {
    const st = HC.status(c);
    const right = st.state === "live"
      ? `<span class="countdown" data-cd="${st.end}" data-cd-prefix="ends in ">ends in ${HC.countdown(st.end)}</span>`
      : st.state === "upcoming" ? `<span class="countdown" data-cd="${c.start}">${HC.countdown(c.start)}</span>`
      : `<span class="badge ended">Ended ${HC.ago(st.end)}</span>`;
    const fill = Math.min(100, Math.round((c.registered / c.capacity) * 100));
    return `
    <article class="card hoverable reveal in">
      <div class="card-top">
        <div class="chips" style="gap:6px"><span class="badge ${c.level}">${c.level}</span>${st.state === "live" ? HC.statusBadge(c) : ""}${HC.isRegistered(c.id) && st.state !== "ended" ? '<span class="badge registered">✓ Joined</span>' : ""}</div>
        ${right}
      </div>
      <div>
        <small class="muted mono" style="font-size:.76rem">${HC.catName(c.category)}</small>
        <h3><a href="contest.html?id=${c.id}">${HC.esc(c.title)}</a></h3>
      </div>
      <p class="desc">${HC.esc(c.desc)}</p>
      <div class="meta">
        <div class="prize"><small>Prize pool</small><b>${HC.money(c.prize)}</b></div>
        <div><small>Entry fee</small><b>${HC.money(c.fee)}</b></div>
        <div><small>${st.state === "ended" ? "Held on" : "Starts"}</small><b>${st.state === "live" ? "Started" : HC.fmtDate(c.start, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</b></div>
        <div><small>Duration</small><b>${HC.fmtDuration(c.durationMin)}</b></div>
      </div>
      ${st.state === "ended" && c.winners
        ? `<div class="muted" style="font-size:.85rem">🏆 Won by <b style="color:var(--text)">${c.winners[0]}</b></div>`
        : `<div><div class="progress"><span style="width:${fill}%"></span></div><small class="muted" style="font-size:.78rem">${c.registered.toLocaleString()} / ${c.capacity.toLocaleString()} spots filled</small></div>`}
      <div class="card-foot">
        <a class="link-arrow" href="contest.html?id=${c.id}" style="font-size:.86rem">Details</a>
        ${HC.actionBtn(c, "contest", "btn-sm")}
      </div>
    </article>`;
  };

  HC.hackCard = (h) => {
    const st = HC.status(h);
    return `
    <article class="hack reveal in">
      <a href="hackathon.html?id=${h.id}" class="hack-banner" style="background:${h.gradient}">
        <span class="theme-tag">theme: ${HC.esc(h.theme)}</span>
        ${HC.isRegistered(h.id) ? '<span class="badge registered" style="position:relative;z-index:1;background:rgba(0,0,0,.5)">✓ Joined</span>' : ""}
      </a>
      <div class="hack-body">
        <h3><a href="hackathon.html?id=${h.id}">${HC.esc(h.title)}</a></h3>
        <p class="muted" style="font-size:.9rem;margin-top:-6px">${HC.esc(h.tagline)}</p>
        <div class="tags">${h.tags.map((t) => `<span class="tag">#${HC.esc(t)}</span>`).join("")}</div>
        <div class="meta">
          <div class="prize"><small>Prize pool</small><b>${HC.money(h.prize)}</b></div>
          <div><small>Entry / team</small><b>${HC.money(h.fee)}</b></div>
          <div><small>Starts</small><b>${HC.fmtDate(h.start, { month: "short", day: "numeric" })}</b></div>
          <div><small>Length · Team</small><b>${h.lengthHrs}h · ${h.teamSize}</b></div>
        </div>
        <div class="card-foot">
          ${st.state === "upcoming" ? `<span class="countdown" data-cd="${h.start}">${HC.countdown(h.start)}</span>` : HC.statusBadge(h)}
          ${HC.actionBtn(h, "hackathon", "btn-sm")}
        </div>
      </div>
    </article>`;
  };

  // ---------------- Layout: header + footer ----------------
  const NAV = [
    ["contests", "contests.html", "Contests"],
    ["hackathons", "hackathons.html", "Hackathons"],
    ["arena", "arena.html", "Arena"],
    ["leaderboard", "leaderboard.html", "Leaderboard"],
    ["pricing", "pricing.html", "Pricing"],
    ["about", "about.html", "About"],
  ];
  const page = document.body.dataset.page;

  function renderHeader() {
    const el = $("#site-header");
    if (!el) return;
    const u = HC.user();
    const right = u
      ? `<div class="user-menu">
          <button class="user-btn" id="userBtn" aria-haspopup="true">${HC.avatar(u.handle, "round")}<span>${HC.esc(u.handle)}</span>${u.plan === "pro" ? '<span class="badge registered" style="font-size:.6rem">PRO</span>' : ""}</button>
          <div class="dropdown" id="userDropdown">
            <div class="dd-head"><b>${HC.esc(u.handle)}</b>${HC.esc(u.email)}</div>
            <a href="dashboard.html">▦ Dashboard</a>
            <a href="arena.html">⌨ Practice arena</a>
            <a href="leaderboard.html?me=1">★ My rank</a>
            ${u.plan !== "pro" ? '<a href="pricing.html">⚡ Upgrade to Pro</a>' : ""}
            <hr /><button data-logout>⎋ Log out</button>
          </div>
        </div>`
      : `<button class="btn btn-ghost desk" data-auth="login">Log in</button>
         <button class="btn btn-primary desk" data-auth="signup">Join the Club</button>`;
    el.className = "nav";
    el.innerHTML = `
      <div class="container nav-inner">
        <a href="index.html" class="logo"><span class="logo-mark">&gt;_</span> Hacker<span class="accent">Club</span></a>
        <nav class="nav-links">
          ${NAV.map(([k, href, label]) => `<a href="${href}" class="${page === k ? "active" : ""}">${label}</a>`).join("")}
          ${u ? `<a href="dashboard.html" class="mobile-only ${page === "dashboard" ? "active" : ""}">Dashboard</a>` : `<button class="btn btn-primary mobile-only" data-auth="signup">Join the Club</button><button class="btn btn-outline mobile-only" data-auth="login">Log in</button>`}
        </nav>
        <div class="nav-cta">
          <button class="kbd-hint desk" data-cmdk><span class="lbl">Search</span><kbd>${/Mac|iPhone/.test(navigator.platform) ? "⌘" : "Ctrl"}</kbd><kbd>K</kbd></button>
          ${right}
        </div>
        <button class="burger" id="burger" aria-label="Menu"><span></span><span></span><span></span></button>
      </div>`;
  }

  function renderFooter() {
    const el = $("#site-footer");
    if (!el) return;
    el.className = "footer";
    el.innerHTML = `
      <div class="container foot-grid">
        <div>
          <a href="index.html" class="logo"><span class="logo-mark">&gt;_</span> Hacker<span class="accent">Club</span></a>
          <p class="muted">The global arena for coding competitions and online hackathons. Compete from anywhere, win real prizes.</p>
        </div>
        <div><h4>Compete</h4><a href="contests.html">Contests</a><a href="hackathons.html">Hackathons</a><a href="arena.html">Practice arena</a><a href="leaderboard.html">Leaderboard</a></div>
        <div><h4>Club</h4><a href="about.html">About us</a><a href="pricing.html">Pricing</a><a href="pricing.html#host">Host an event</a><a href="about.html#contact">Contact</a></div>
        <div><h4>Legal</h4><a href="#">Terms of Service</a><a href="#">Privacy Policy</a><a href="#">Contest Rules</a><a href="#">Refund Policy</a></div>
      </div>
      <div class="container foot-bottom muted">
        <span>© ${new Date().getFullYear()} Hacker Club. All rights reserved.</span>
        <span class="status-ok"><span class="dot live"></span> All systems operational · times in ${HC.esc(HC.tz)}</span>
      </div>`;
  }

  // ---------------- Toasts ----------------
  HC.toast = (msg, type = "ok") => {
    let box = $(".toasts");
    if (!box) { box = document.createElement("div"); box.className = "toasts"; document.body.appendChild(box); }
    const t = document.createElement("div");
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${type === "err" ? "✕" : type === "info" ? "ℹ" : "✔"}</span><div>${msg}</div>`;
    box.appendChild(t);
    setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 300); }, 3800);
  };

  // ---------------- Modal ----------------
  function ensureModal() {
    let m = $("#modal");
    if (m) return m;
    m = document.createElement("div");
    m.className = "modal"; m.id = "modal";
    m.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true"><button class="modal-close" data-close aria-label="Close">×</button><div id="modalBody"></div></div>`;
    document.body.appendChild(m);
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest("[data-close]")) HC.closeModal(); });
    return m;
  }
  HC.openModal = (html) => {
    const m = ensureModal();
    $("#modalBody", m).innerHTML = html;
    m.classList.add("open");
    setTimeout(() => $("input, button:not(.modal-close)", m)?.focus(), 50);
  };
  HC.closeModal = () => $("#modal")?.classList.remove("open");

  // ---------------- Auth ----------------
  let afterAuth = null;
  HC.openAuth = (mode = "signup", then = null) => {
    afterAuth = then;
    const signup = mode === "signup";
    HC.openModal(`
      <h3>${signup ? "Join the Club" : "Welcome back"}</h3>
      <p class="muted">${signup ? (then ? "Create a free account to finish registering." : "Create your free account and start competing.") : "Log in to your Hacker Club account."}</p>
      <form id="authForm">
        ${signup ? `<label class="field">Username<input name="handle" required minlength="3" maxlength="20" pattern="[A-Za-z0-9_]+" placeholder="h4ck3r_42" title="Letters, numbers and underscores" /></label>` : ""}
        <label class="field">Email<input name="email" type="email" required placeholder="you@example.com" /></label>
        ${signup ? `<label class="field">Country<select name="country">${HC.countries.map(([n, f]) => `<option value="${n}">${f} ${n}</option>`).join("")}</select></label>` : ""}
        <label class="field">Password<input name="password" type="password" required minlength="8" placeholder="At least 8 characters" /></label>
        <button class="btn btn-primary btn-block" type="submit">${signup ? "Create account" : "Log in"}</button>
        <div class="divider"><span>or</span></div>
        <button type="button" class="btn btn-outline btn-block" data-oauth="GitHub">Continue with GitHub</button>
        <button type="button" class="btn btn-outline btn-block" data-oauth="Google">Continue with Google</button>
        <p class="switch-auth">${signup ? 'Already a member? <button type="button" data-auth="login">Log in</button>' : 'New here? <button type="button" data-auth="signup">Create an account</button>'}</p>
        <p class="demo-note">Demo mode: your account is saved only in this browser. Passwords are never stored.</p>
      </form>`);
    $("#authForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const email = f.get("email").trim();
      const existing = HC.user();
      const handle = signup ? f.get("handle").trim() : existing && existing.email === email ? existing.handle : email.split("@")[0].replace(/[^A-Za-z0-9_]/g, "").slice(0, 20) || "hacker";
      login({ handle, email, country: signup ? f.get("country") : existing?.country || "India" });
    });
    $$("[data-oauth]").forEach((b) => b.addEventListener("click", () => HC.toast(`${b.dataset.oauth} sign-in will be available at launch.`, "info")));
  };
  function login(data) {
    const prev = HC.user();
    const user = { plan: "free", joined: Date.now(), ...(prev && prev.email === data.email ? prev : {}), ...data };
    HC.store.set("user", user);
    HC.closeModal();
    renderHeader();
    HC.toast(`Welcome, <b>${HC.esc(user.handle)}</b>! You're in the Club.`);
    HC.emit("hc:change");
    if (afterAuth) { const fn = afterAuth; afterAuth = null; setTimeout(fn, 250); }
  }
  HC.logout = () => {
    HC.store.del("user");
    renderHeader();
    HC.toast("Logged out. See you in the arena.", "info");
    HC.emit("hc:change");
  };
  HC.requireUser = (then) => { if (HC.user()) then(); else HC.openAuth("signup", then); };

  // ---------------- Registration / checkout ----------------
  HC.findEvent = (id) => { const c = HC.contest(id); return c ? { ev: c, kind: "contest" } : { ev: HC.hackathon(id), kind: "hackathon" }; };
  HC.priceFor = (ev, kind) => {
    const pro = HC.user()?.plan === "pro";
    if (!pro) return { price: ev.fee, note: "" };
    return kind === "contest" ? { price: 0, note: "Included in Hacker Pro" } : { price: ev.fee / 2, note: "Pro: 50% off" };
  };
  HC.openCheckout = (id) => {
    const { ev, kind } = HC.findEvent(id);
    if (!ev) return;
    if (HC.isRegistered(id)) return HC.toast("You're already registered for this event.", "info");
    const { price, note } = HC.priceFor(ev, kind);
    const st = HC.status(ev);
    HC.openModal(`
      <p class="eyebrow">// checkout</p>
      <h3>${HC.esc(ev.title)}</h3>
      <p class="muted">${kind === "contest" ? HC.fmtDuration(ev.durationMin) + " contest" : ev.lengthHrs + "h hackathon"} · ${st.state === "live" ? "Live now" : HC.fmtDate(ev.start)}</p>
      ${kind === "hackathon" ? `<form id="teamForm" style="margin-top:16px"><label class="field">Team name (optional)<input name="team" maxlength="30" placeholder="Solo or name your team" /></label></form>` : ""}
      <div class="checkout-summary">
        <div><span class="muted">Entry fee</span><span class="mono">${HC.money(ev.fee)}</span></div>
        ${note ? `<div><span class="muted">${note}</span><span class="mono accent">−${HC.money(ev.fee - price)}</span></div>` : ""}
        <div><span class="muted">Prize pool</span><span class="mono amber">${HC.money(ev.prize)}</span></div>
        <div class="total"><span>Total</span><b>${price ? HC.money(price) : "Free"}</b></div>
      </div>
      <form id="payForm" style="margin-top:18px">
        <label class="field" style="flex-direction:row;display:flex;gap:10px;align-items:flex-start"><input type="checkbox" required style="width:auto;margin-top:4px" /> <span>I agree to the contest rules and refund policy.</span></label>
        <button class="btn btn-primary btn-block btn-lg" type="submit">${price ? `Pay ${HC.money(price)} & register` : "Confirm registration"}</button>
        <p class="demo-note">Demo checkout — no payment is taken. Real payments will be handled by a secure payment provider.</p>
      </form>`);
    $("#payForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = $("button[type=submit]", e.target);
      btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Processing…';
      setTimeout(() => {
        const team = $("#teamForm input")?.value.trim() || "";
        HC.store.set("regs", [...HC.regs(), { id, kind, at: Date.now(), paid: price, team }]);
        HC.closeModal();
        HC.toast(`You're registered for <b>${HC.esc(ev.title)}</b>. Good luck!`);
        HC.emit("hc:change");
        if (kind === "contest" && st.state === "live") setTimeout(() => (location.href = `arena.html?contest=${id}`), 900);
      }, 900);
    });
  };
  HC.register = (id) => HC.requireUser(() => HC.openCheckout(id));

  // ---------------- Calendar (.ics) ----------------
  HC.downloadICS = (ev) => {
    const st = HC.status(ev);
    const f = (ms) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hacker Club//EN", "BEGIN:VEVENT",
      `UID:${ev.id}@hackerclub`, `DTSTAMP:${f(Date.now())}`, `DTSTART:${f(ev.start)}`, `DTEND:${f(st.end)}`,
      `SUMMARY:${ev.title} — Hacker Club`, `DESCRIPTION:${(ev.desc || ev.tagline || "").replace(/,/g, "\\,")}`,
      "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", "DESCRIPTION:Starts in 30 minutes", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = `${ev.id}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    HC.toast("Calendar invite downloaded.", "info");
  };
  HC.copyLink = () => {
    navigator.clipboard?.writeText(location.href).then(() => HC.toast("Link copied to clipboard."), () => HC.toast("Couldn't copy link.", "err"));
  };

  // ---------------- Command palette ----------------
  let cmdItems = [], cmdSel = 0;
  function cmdSource() {
    const u = HC.user();
    return [
      ...[["Home", "index.html", "~"], ...NAV.map(([, h, l]) => [l, h, "›"]), ["Dashboard", "dashboard.html", "▦"]].map(([t, href, ic]) => ({ g: "Pages", t, href, ic })),
      ...HC.contests.map((c) => ({ g: "Contests", t: c.title, href: `contest.html?id=${c.id}`, ic: "λ", sub: HC.status(c).state })),
      ...HC.hackathons.map((h) => ({ g: "Hackathons", t: h.title, href: `hackathon.html?id=${h.id}`, ic: "◆", sub: h.theme })),
      ...HC.problems.map((p) => ({ g: "Practice problems", t: p.title, href: `arena.html?problem=${p.id}`, ic: "⌨", sub: p.difficulty })),
      ...(u ? [{ g: "Account", t: "Log out", ic: "⎋", run: HC.logout }] : [{ g: "Account", t: "Log in", ic: "→", run: () => HC.openAuth("login") }, { g: "Account", t: "Create account", ic: "+", run: () => HC.openAuth("signup") }]),
    ];
  }
  function ensureCmdk() {
    let c = $("#cmdk");
    if (c) return c;
    c = document.createElement("div");
    c.className = "cmdk"; c.id = "cmdk";
    c.innerHTML = `<div class="cmdk-box"><div class="cmdk-input"><span>&gt;_</span><input id="cmdkInput" placeholder="Search contests, hackathons, problems, pages…" autocomplete="off" /></div><div class="cmdk-list" id="cmdkList"></div><div class="cmdk-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div></div>`;
    document.body.appendChild(c);
    c.addEventListener("click", (e) => { if (e.target === c) closeCmdk(); const it = e.target.closest(".cmdk-item"); if (it) runCmd(+it.dataset.i); });
    $("#cmdkInput").addEventListener("input", (e) => renderCmd(e.target.value));
    $("#cmdkInput").addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); cmdSel = Math.min(cmdItems.length - 1, cmdSel + 1); paintSel(); }
      if (e.key === "ArrowUp") { e.preventDefault(); cmdSel = Math.max(0, cmdSel - 1); paintSel(); }
      if (e.key === "Enter") { e.preventDefault(); runCmd(cmdSel); }
    });
    return c;
  }
  function renderCmd(q = "") {
    const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    cmdItems = cmdSource().filter((it) => terms.every((t) => (it.t + " " + (it.sub || "") + " " + it.g).toLowerCase().includes(t)));
    cmdSel = 0;
    let lastG = "", html = "";
    cmdItems.slice(0, 40).forEach((it, i) => {
      if (it.g !== lastG) { html += `<div class="cmdk-group">${it.g}</div>`; lastG = it.g; }
      html += `<div class="cmdk-item" data-i="${i}"><span class="ic">${it.ic}</span>${HC.esc(it.t)}${it.sub ? `<small>${HC.esc(it.sub)}</small>` : ""}</div>`;
    });
    $("#cmdkList").innerHTML = html || `<div class="empty">No results for “${HC.esc(q)}”</div>`;
    paintSel();
  }
  function paintSel() {
    $$(".cmdk-item").forEach((el) => el.classList.toggle("sel", +el.dataset.i === cmdSel));
    $(`.cmdk-item[data-i="${cmdSel}"]`)?.scrollIntoView({ block: "nearest" });
  }
  function runCmd(i) {
    const it = cmdItems[i];
    if (!it) return;
    closeCmdk();
    if (it.run) it.run(); else location.href = it.href;
  }
  HC.openCmdk = () => { const c = ensureCmdk(); c.classList.add("open"); $("#cmdkInput").value = ""; renderCmd(); setTimeout(() => $("#cmdkInput").focus(), 20); };
  function closeCmdk() { $("#cmdk")?.classList.remove("open"); }

  // ---------------- Global events ----------------
  document.addEventListener("click", (e) => {
    const t = e.target;
    const auth = t.closest("[data-auth]");
    if (auth) { e.preventDefault(); HC.openAuth(auth.dataset.auth, afterAuth); }
    const reg = t.closest("[data-register]");
    if (reg) { e.preventDefault(); HC.register(reg.dataset.register); }
    if (t.closest("[data-logout]")) HC.logout();
    if (t.closest("[data-cmdk]")) HC.openCmdk();
    if (t.closest("#burger")) $("#site-header").classList.toggle("menu-open");
    else if (t.closest(".nav-links a, .nav-links button")) $("#site-header")?.classList.remove("menu-open");
    const ub = t.closest("#userBtn");
    const dd = $("#userDropdown");
    if (ub) dd?.classList.toggle("open"); else if (dd && !t.closest("#userDropdown")) dd.classList.remove("open");
  });
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); $("#cmdk.open") ? closeCmdk() : HC.openCmdk(); }
    if (e.key === "Escape") { HC.closeModal(); closeCmdk(); $("#userDropdown")?.classList.remove("open"); }
  });

  // Live countdowns: any element with data-cd="<timestamp>"
  setInterval(() => {
    $$("[data-cd]").forEach((el) => {
      const target = +el.dataset.cd;
      el.textContent = target - Date.now() > 0 ? (el.dataset.cdPrefix || "") + HC.countdown(target) : el.dataset.cdDone || "Starting…";
    });
    $$("[data-cd-blocks]").forEach((el) => {
      const p = HC.parts(+el.dataset.cdBlocks - Date.now());
      el.innerHTML = [["days", p.days], ["hours", p.h], ["mins", p.m], ["secs", p.s]].map(([l, v]) => `<div><b>${HC.pad(v)}</b><small>${l}</small></div>`).join("");
    });
  }, 1000);

  // ---------------- Visual effects ----------------
  HC.reveal = (sel) => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.1 });
    $$(sel).forEach((el) => { if (!el.classList.contains("in")) { el.classList.add("reveal"); io.observe(el); } });
  };
  HC.countUp = (root = document) => {
    $$("[data-count]", root).forEach((el) => {
      const target = +el.dataset.count, prefix = el.dataset.prefix || "", suffix = el.dataset.suffix ?? "+";
      const start = performance.now(), dur = 1600;
      const step = (t) => {
        const p = Math.min(1, (t - start) / dur);
        el.textContent = prefix + Math.floor(target * (1 - Math.pow(1 - p, 3))).toLocaleString("en-US") + (p === 1 ? suffix : "");
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  };
  function matrix() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || document.body.classList.contains("arena-page")) return;
    const c = document.createElement("canvas");
    c.id = "matrix"; c.setAttribute("aria-hidden", "true");
    document.body.prepend(c);
    const ctx = c.getContext("2d");
    const chars = "01{}[]<>/=+*;:$#@&アイウエオカキクケコ".split("");
    const size = 16;
    let drops = [];
    const resize = () => { c.width = innerWidth; c.height = innerHeight; drops = Array(Math.floor(c.width / size)).fill(0).map(() => Math.random() * -50); };
    resize(); addEventListener("resize", resize);
    setInterval(() => {
      if (document.hidden) return;
      ctx.fillStyle = "rgba(7,11,9,0.12)"; ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#39ff88"; ctx.font = `${size - 2}px JetBrains Mono, monospace`;
      drops.forEach((y, i) => {
        ctx.fillText(chars[(Math.random() * chars.length) | 0], i * size, y * size);
        drops[i] = y * size > c.height && Math.random() > 0.975 ? 0 : y + 1;
      });
    }, 60);
  }

  // Tabs helper: <div class="page-tabs" data-tabs="x"><button data-tab="a"> + .tab-panel[data-panel="a"]
  HC.initTabs = (root = document) => {
    $$(".page-tabs", root).forEach((bar) => {
      bar.addEventListener("click", (e) => {
        const b = e.target.closest("[data-tab]");
        if (!b) return;
        $$("[data-tab]", bar).forEach((x) => x.classList.toggle("active", x === b));
        $$(".tab-panel", root).forEach((p) => p.classList.toggle("active", p.dataset.panel === b.dataset.tab));
        history.replaceState(null, "", `${location.search}#${b.dataset.tab}`);
      });
      const want = location.hash.slice(1);
      const btn = want && $(`[data-tab="${want}"]`, bar);
      if (btn) btn.click();
    });
  };

  HC.faqHTML = (items = HC.faq) => items.map(([q, a]) => `<details><summary>${HC.esc(q)}</summary><p>${HC.esc(a)}</p></details>`).join("");

  // Newsletter forms anywhere
  document.addEventListener("submit", (e) => {
    if (!e.target.matches("[data-newsletter]")) return;
    e.preventDefault();
    const msg = e.target.parentElement.querySelector(".form-msg");
    if (msg) msg.textContent = "> subscribed ✔ — you'll hear about new events first.";
    HC.store.set("newsletter", true);
    e.target.reset();
  });

  // ---------------- Init ----------------
  renderHeader();
  renderFooter();
  matrix();
})();
