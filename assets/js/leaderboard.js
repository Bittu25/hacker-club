(function () {
  const { $, $$, esc, money } = HC;
  const PER_PAGE = 20;
  const state = { period: "rating", q: "", country: "all", page: 1 };
  const labels = { rating: "Rating", season: "Season pts", month: "Month pts", winnings: "Winnings" };

  $("#country").innerHTML += HC.countries.map(([n, f]) => `<option value="${n}">${f} ${n}</option>`).join("");

  function ranked() {
    const all = [...HC.hackers];
    const me = HC.myStats();
    if (me) all.push(me);
    const key = state.period;
    all.sort((a, b) => b[key] - a[key]);
    return all.map((h, i) => ({ ...h, rank: i + 1 }));
  }

  function metric(h) {
    if (state.period === "winnings") return `<span class="win">${money(h.winnings)}</span>`;
    if (state.period === "rating") { const t = HC.tier(h.rating); return `<span class="rating" style="color:${t.color}">${h.rating}</span> <span class="tier-tag" style="color:${t.color}">${t.name}</span>`; }
    return `<span class="rating" style="color:var(--green)">${h[state.period].toLocaleString()}</span>`;
  }

  function render() {
    const all = ranked();
    const q = state.q.toLowerCase();
    const list = all.filter((h) => (state.country === "all" || h.country === state.country) && (!q || h.name.toLowerCase().includes(q)));
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    state.page = Math.min(state.page, pages);
    const slice = list.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);

    $("#metricHead").textContent = labels[state.period];
    $("#body").innerHTML = slice.length ? slice.map((h) => `
      <tr class="${h.me ? "me" : ""}" ${h.me ? 'id="meRow"' : ""}>
        <td class="rank ${h.rank <= 3 ? "r" + h.rank : ""}">${h.rank}</td>
        <td><span class="user">${HC.avatar(h.name)}${esc(h.name)}${h.me ? ' <span class="badge registered">You</span>' : ""}</span></td>
        <td>${HC.flag(h.country)} <span class="muted" style="font-size:.85rem">${esc(h.country)}</span></td>
        <td>${metric(h)}</td>
        <td class="num">${h.contests}</td>
        <td class="num">${h.solved}</td>
        <td class="win">${money(h.winnings)}</td>
      </tr>`).join("") : `<tr><td colspan="7"><div class="empty">No hackers found.</div></td></tr>`;

    // Pager
    const btns = [];
    const add = (p, label = p, dis = false) => btns.push(`<button data-page="${p}" ${dis ? "disabled" : ""} class="${p === state.page && label === p ? "active" : ""}">${label}</button>`);
    add(state.page - 1, "‹", state.page === 1);
    const shown = new Set([1, pages, state.page - 1, state.page, state.page + 1].filter((p) => p >= 1 && p <= pages));
    let last = 0;
    [...shown].sort((a, b) => a - b).forEach((p) => { if (p - last > 1) btns.push(`<button disabled>…</button>`); add(p); last = p; });
    add(state.page + 1, "›", state.page === pages);
    $("#pager").innerHTML = btns.join("");

    // Podium (top 3 of current filter)
    const top = list.slice(0, 3);
    $("#podium").innerHTML = [1, 0, 2].map((i) => {
      const h = top[i];
      if (!h) return "<div></div>";
      return `<div class="pod ${i === 0 ? "first" : ""}"><span class="rk">${["🥇 #1", "🥈 #2", "🥉 #3"][i]}</span>${HC.avatar(h.name)}<b>${esc(h.name)} ${HC.flag(h.country)}</b><span>${metric(h)}</span><small class="muted">${h.contests} contests · ${money(h.winnings)} won</small></div>`;
    }).join("");

    $("#jumpMe").classList.toggle("hidden", !HC.user());
  }

  function sidebars() {
    const byCountry = {};
    HC.hackers.slice(0, 100).forEach((h) => (byCountry[h.country] = (byCountry[h.country] || 0) + 1));
    const top = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = top[0][1];
    $("#countries").innerHTML = top.map(([c, n]) => `<div class="bar-row"><span>${HC.flag(c)}</span><span>${esc(c)}</span><b class="mono" style="font-size:.82rem">${n}</b><div class="track"><span style="width:${(n / max) * 100}%"></span></div></div>`).join("") + `<small class="muted">Hackers in the global top 100</small>`;
    const tiers = {};
    HC.hackers.forEach((h) => { const t = HC.tier(h.rating); tiers[t.name] = tiers[t.name] || { n: 0, color: t.color }; tiers[t.name].n++; });
    const tmax = Math.max(...Object.values(tiers).map((t) => t.n));
    $("#tiers").innerHTML = Object.entries(tiers).map(([name, t]) => `<div class="bar-row"><span style="color:${t.color}">●</span><span>${name}</span><b class="mono" style="font-size:.82rem">${t.n}</b><div class="track"><span style="width:${(t.n / tmax) * 100}%;background:${t.color}"></span></div></div>`).join("");
  }

  function jumpToMe() {
    const all = ranked().filter((h) => (state.country === "all" || h.country === state.country));
    const idx = all.findIndex((h) => h.me);
    if (idx < 0) return HC.toast("You're not in this filter.", "info");
    state.q = ""; $("#q").value = "";
    state.page = Math.floor(idx / PER_PAGE) + 1;
    render();
    $("#meRow")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  $("#periodTabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-period]"); if (!b) return;
    state.period = b.dataset.period; state.page = 1;
    $$("#periodTabs .tab").forEach((x) => x.classList.toggle("active", x === b));
    render();
  });
  $("#q").addEventListener("input", (e) => { state.q = e.target.value; state.page = 1; render(); });
  $("#country").addEventListener("change", (e) => { state.country = e.target.value; state.page = 1; render(); });
  $("#pager").addEventListener("click", (e) => { const b = e.target.closest("[data-page]"); if (b && !b.disabled) { state.page = +b.dataset.page; render(); $(".table-wrap").scrollIntoView({ behavior: "smooth", block: "start" }); } });
  $("#jumpMe").addEventListener("click", jumpToMe);
  document.addEventListener("hc:change", render);

  render();
  sidebars();
  if (HC.param("me") && HC.user()) setTimeout(jumpToMe, 200);
})();
