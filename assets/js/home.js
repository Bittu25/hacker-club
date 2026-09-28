(function () {
  const { $, esc, money } = HC;

  // Featured: the live contest, or the next upcoming one
  function renderFeatured() {
    const live = HC.contests.find((c) => HC.status(c).state === "live");
    const next = HC.contests.filter((c) => HC.status(c).state === "upcoming").sort((a, b) => a.start - b.start)[0];
    const c = live || next;
    if (!c) return;
    const st = HC.status(c);
    $("#featured").innerHTML = `
      <div class="featured-event">
        <div>
          <div class="chips" style="gap:8px;margin-bottom:12px">${HC.statusBadge(c)}<span class="badge ${c.level}">${c.level}</span><span class="badge cat">${HC.catName(c.category)}</span></div>
          <h2>${esc(c.title)}</h2>
          <p class="muted" style="margin-bottom:18px">${esc(c.about)}</p>
          <div class="meta" style="grid-template-columns:repeat(3,1fr);max-width:520px;margin-bottom:22px">
            <div class="prize"><small>Prize pool</small><b>${money(c.prize)}</b></div>
            <div><small>Entry</small><b>${money(c.fee)}</b></div>
            <div><small>Registered</small><b>${c.registered.toLocaleString()}</b></div>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">${HC.actionBtn(c, "contest", "btn-lg")}<a class="btn btn-outline btn-lg" href="contest.html?id=${c.id}">View details</a></div>
        </div>
        <div>
          <p class="mono muted" style="font-size:.85rem;margin-bottom:10px">${st.state === "live" ? "// ends in" : "// starts in"}</p>
          <div class="big-countdown" data-cd-blocks="${st.state === "live" ? st.end : c.start}"></div>
          <p class="muted" style="font-size:.85rem;margin-top:12px">${HC.fmtDate(c.start)} · ${HC.fmtDuration(c.durationMin)}</p>
        </div>
      </div>`;
  }

  function renderCategories() {
    $("#catGrid").innerHTML = HC.categories.map((cat) => {
      const n = HC.contests.filter((c) => c.category === cat.id && HC.status(c).state !== "ended").length;
      return `<a class="cat-card" href="contests.html?category=${cat.id}">
        <div class="cat-icon">${cat.icon}</div>
        <div><h3>${cat.name}</h3><p>${cat.desc}</p><span class="count">${n} open event${n === 1 ? "" : "s"} →</span></div>
      </a>`;
    }).join("");
  }

  function renderLists() {
    const open = HC.contests.filter((c) => HC.status(c).state !== "ended")
      .sort((a, b) => (HC.status(b).state === "live") - (HC.status(a).state === "live") || a.start - b.start);
    $("#contestCards").innerHTML = open.slice(0, 6).map(HC.contestCard).join("");
    $("#hackCards").innerHTML = HC.hackathons.slice(0, 3).map(HC.hackCard).join("");
  }

  function renderLeaderboard() {
    $("#lbBody").innerHTML = HC.hackers.slice(0, 7).map((h, i) => {
      const t = HC.tier(h.rating);
      return `<tr>
        <td class="rank ${i < 3 ? "r" + (i + 1) : ""}">${i + 1}</td>
        <td><span class="user">${HC.avatar(h.name)}${esc(h.name)}</span></td>
        <td>${HC.flag(h.country)} <span class="muted" style="font-size:.85rem">${h.country}</span></td>
        <td class="rating" style="color:${t.color}">${h.rating}</td>
        <td class="win">${money(h.winnings)}</td>
      </tr>`;
    }).join("");
    $("#tierChips").innerHTML = [3000, 2400, 2000, 1700, 1400, 0].map((r) => {
      const t = HC.tier(r);
      return `<span class="chip" style="border-color:${t.color}55;color:${t.color}">${t.name}${r ? " " + r + "+" : ""}</span>`;
    }).join("");
  }

  // Live activity ticker
  function ticker() {
    const el = $("#tickerMsg");
    const tick = () => {
      const h = HC.hackers[(Math.random() * 120) | 0];
      const tpl = HC.activityTemplates[(Math.random() * HC.activityTemplates.length) | 0];
      el.innerHTML = tpl(h) + ` <span class="muted">· ${((Math.random() * 50) | 0) + 2}s ago</span>`;
      el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
    };
    tick();
    setInterval(tick, 3500);
  }

  // Hero typing effect
  const code = [
    ["cm", "# Problem: find two numbers that sum to target\n"],
    ["kw", "def "], ["fn", "two_sum"], ["", "(nums, target):\n"],
    ["", "    seen = {}\n"],
    ["kw", "    for "], ["", "i, x "], ["kw", "in "], ["fn", "enumerate"], ["", "(nums):\n"],
    ["kw", "        if "], ["", "target - x "], ["kw", "in "], ["", "seen:\n"],
    ["kw", "            return "], ["", "[seen[target - x], i]\n"],
    ["", "        seen[x] = i\n"],
    ["kw", "    return "], ["", "[]\n\n"],
    ["fn", "print"], ["", "(two_sum(["], ["num", "2, 7, 11, 15"], ["", "], "], ["num", "9"], ["", "))  "], ["cm", "# [0, 1]"],
  ];
  function typeCode() {
    const out = $("#typed"), verdict = $("#verdict");
    const done = () => { verdict.textContent = "✔ Accepted · 24/24 tests passed"; verdict.classList.add("pass"); };
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      out.innerHTML = code.map(([c, t]) => (c ? `<span class="${c}">${esc(t)}</span>` : esc(t))).join("");
      return done();
    }
    let seg = 0, ch = 0, span = null;
    (function tick() {
      if (seg >= code.length) {
        setTimeout(done, 500);
        setTimeout(() => { out.innerHTML = ""; seg = 0; ch = 0; verdict.textContent = "● Running tests…"; verdict.classList.remove("pass"); tick(); }, 6000);
        return;
      }
      const [cls, text] = code[seg];
      if (ch === 0) { span = document.createElement("span"); if (cls) span.className = cls; out.appendChild(span); }
      span.textContent += text[ch++];
      if (ch >= text.length) { seg++; ch = 0; }
      setTimeout(tick, text[ch - 1] === "\n" ? 90 : 22 + Math.random() * 30);
    })();
  }

  function renderAll() { renderFeatured(); renderLists(); }

  $("#tzName").textContent = `your local time (${HC.tz})`;
  $("#faq").innerHTML = HC.faqHTML(HC.faq.slice(0, 5));
  renderAll();
  renderCategories();
  renderLeaderboard();
  ticker();
  typeCode();
  HC.countUp();
  HC.reveal(".step, .feature, .cat-card, .faq details, .table-wrap");
  document.addEventListener("hc:change", renderAll);
})();
