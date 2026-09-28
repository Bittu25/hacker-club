(function () {
  const { $, $$, money } = HC;
  const state = { q: "", status: "open", level: "all", category: HC.param("category") || "all", sort: "soon" };

  $("#tzName").textContent = HC.tz;
  $("#category").innerHTML += HC.categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
  $("#category").value = state.category;

  const open = HC.contests.filter((c) => HC.status(c).state !== "ended");
  $("#contestStats").innerHTML = `
    <div><strong data-count="${open.length}" data-suffix="">0</strong><span>Open contests</span></div>
    <div><strong data-count="${open.reduce((s, c) => s + c.prize, 0)}" data-prefix="$" data-suffix="">0</strong><span>In prize pools</span></div>
    <div><strong data-count="${open.reduce((s, c) => s + c.registered, 0)}">0</strong><span>Registered hackers</span></div>`;
  HC.countUp($("#contestStats"));

  function counts() {
    const by = (s) => HC.contests.filter((c) => (s === "open" ? HC.status(c).state !== "ended" : HC.status(c).state === s)).length;
    return [["open", "Open", by("open")], ["live", "Live", by("live")], ["upcoming", "Upcoming", by("upcoming")], ["ended", "Past", by("ended")], ["mine", "My contests", HC.contests.filter((c) => HC.isRegistered(c.id)).length]];
  }
  function renderTabs() {
    $("#statusTabs").innerHTML = counts().map(([k, l, n]) => `<button class="tab ${state.status === k ? "active" : ""}" data-status="${k}">${l}<span class="count">${n}</span></button>`).join("");
  }

  function render() {
    const q = state.q.toLowerCase();
    let list = HC.contests.filter((c) => {
      const s = HC.status(c).state;
      if (state.status === "open" && s === "ended") return false;
      if (["live", "upcoming", "ended"].includes(state.status) && s !== state.status) return false;
      if (state.status === "mine" && !HC.isRegistered(c.id)) return false;
      if (state.level !== "all" && c.level !== state.level) return false;
      if (state.category !== "all" && c.category !== state.category) return false;
      return !q || (c.title + " " + c.desc + " " + HC.catName(c.category)).toLowerCase().includes(q);
    });
    const live = (c) => (HC.status(c).state === "live" ? 1 : 0);
    const sorters = {
      soon: (a, b) => live(b) - live(a) || (state.status === "ended" ? b.start - a.start : a.start - b.start),
      prize: (a, b) => b.prize - a.prize,
      fee: (a, b) => a.fee - b.fee,
      popular: (a, b) => b.registered - a.registered,
    };
    list.sort(sorters[state.sort]);
    $("#resultCount").innerHTML = `Showing <b style="color:var(--text)">${list.length}</b> contest${list.length === 1 ? "" : "s"}`;
    $("#grid").innerHTML = list.length
      ? list.map(HC.contestCard).join("")
      : `<div class="empty" style="grid-column:1/-1"><span class="icon">∅</span>${state.status === "mine" ? 'You haven\'t joined any contests yet. <a class="accent" href="#" data-status-link="open">Browse open contests →</a>' : "No contests match your filters."}</div>`;
    renderTabs();
    const params = new URLSearchParams();
    if (state.category !== "all") params.set("category", state.category);
    history.replaceState(null, "", "contests.html" + (params.toString() ? "?" + params : ""));
  }

  $("#q").addEventListener("input", (e) => { state.q = e.target.value; render(); });
  $("#category").addEventListener("change", (e) => { state.category = e.target.value; render(); });
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  $("#statusTabs").addEventListener("click", (e) => { const b = e.target.closest("[data-status]"); if (b) { state.status = b.dataset.status; render(); } });
  $("#grid").addEventListener("click", (e) => { const b = e.target.closest("[data-status-link]"); if (b) { e.preventDefault(); state.status = b.dataset.statusLink; render(); } });
  $("#levelChips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-level]");
    if (!b) return;
    state.level = b.dataset.level;
    $$("#levelChips .chip").forEach((x) => x.classList.toggle("active", x === b));
    render();
  });
  $("#reset").addEventListener("click", () => {
    Object.assign(state, { q: "", status: "open", level: "all", category: "all", sort: "soon" });
    $("#q").value = ""; $("#category").value = "all"; $("#sort").value = "soon";
    $$("#levelChips .chip").forEach((x) => x.classList.toggle("active", x.dataset.level === "all"));
    render();
  });
  document.addEventListener("hc:change", render);
  render();
  HC.reveal(".feature");
})();
