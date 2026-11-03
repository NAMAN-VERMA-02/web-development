const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const params = new URLSearchParams(location.search);

// localStorage can throw (private mode, blocked storage), so the site must work without it.
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem("cs:" + key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("cs:" + key, JSON.stringify(value)); return true; } catch { return false; }
  }
};

function scoreBadge(score) {
  return score == null
    ? `<span class="badge badge-muted">Review soon</span>`
    : `<span class="badge" aria-label="Critic score ${score} out of 10">★ ${score}</span>`;
}

function card(t) {
  return `<a class="card" href="review.html?id=${t.id}">
    <div class="card-img"><img src="${t.poster}" alt="" loading="lazy">${scoreBadge(t.score)}</div>
    <div class="card-body">
      <h3>${esc(t.title)}</h3>
      <p class="meta">${t.type} · ${esc(t.year)}</p>
    </div>
  </a>`;
}

/* ---------- Home ---------- */
function filterTitles(list, query, type) {
  const q = query.trim().toLowerCase();
  return list.filter((t) =>
    (type === "All" || t.type === type) &&
    (!q || [t.title, t.creator, ...t.genres].join(" ").toLowerCase().includes(q))
  );
}

function initHome() {
  const input = $("#search");
  const grid = $("#grid");
  const count = $("#count");
  const sortSel = $("#sort");
  let type = params.get("type") || "All";
  input.value = params.get("q") || "";

  const picks = TITLES.filter((t) => t.score === 10);
  $("#picks").innerHTML = picks.map(card).join("");
  $("#stat-titles").textContent = TITLES.length;
  $("#stat-tens").textContent = picks.length;

  if (typeof TRENDING !== "undefined" && TRENDING.length) {
    $("#trending-grid").innerHTML = TRENDING.map((t) => `<a class="card" href="${esc(t.url)}" target="_blank" rel="noopener">
      <div class="card-img"><img src="${esc(t.poster)}" alt="" loading="lazy">${t.score == null ? "" : `<span class="badge badge-muted">TMDB ${t.score}</span>`}</div>
      <div class="card-body"><h3>${esc(t.title)}</h3><p class="meta">${t.type}${t.year ? " · " + esc(t.year) : ""}</p></div>
    </a>`).join("");
    $("#trending-updated").textContent = "Updated " + new Date(TRENDING_UPDATED).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
    $("#trending").hidden = false;
  }

  function render() {
    let list = filterTitles(TITLES, input.value, type);
    if (sortSel.value === "title") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    else list = [...list].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    grid.innerHTML = list.length ? list.map(card).join("") : `<p class="empty">No reviews match “${esc(input.value)}”. Try another title, genre or creator.</p>`;
    count.textContent = `${list.length} ${list.length === 1 ? "title" : "titles"}`;
    document.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c.dataset.type === type));
    const url = new URL(location);
    input.value ? url.searchParams.set("q", input.value) : url.searchParams.delete("q");
    type !== "All" ? url.searchParams.set("type", type) : url.searchParams.delete("type");
    history.replaceState(null, "", url);
  }

  input.addEventListener("input", render);
  sortSel.addEventListener("change", render);
  document.querySelectorAll(".chip").forEach((c) => c.addEventListener("click", () => { type = c.dataset.type; render(); }));
  $("#hero-search").addEventListener("submit", (e) => { e.preventDefault(); render(); $("#browse").scrollIntoView({ behavior: "smooth" }); });
  render();
  if (params.get("q") || params.get("type")) $("#browse").scrollIntoView();
}

/* ---------- Review ---------- */
function initReview() {
  const t = TITLES.find((x) => x.id === params.get("id"));
  const main = $("#review");
  if (!t) {
    main.innerHTML = `<section class="container notfound"><h1>Review not found</h1><p>That title isn't in our library yet.</p><a class="btn" href="index.html#browse">Browse all reviews</a></section>`;
    return;
  }
  document.title = `${t.title} review · CineSedation`;
  $('meta[name="description"]').setAttribute("content", t.tagline);

  const section = (h, body) => body ? `<section class="block"><h2>${h}</h2><p>${esc(body)}</p></section>` : "";
  const watch = t.watch.length
    ? t.watch.map(([name, url]) => `<a class="btn btn-ghost" href="${url}" target="_blank" rel="noopener">${name} ↗</a>`).join("")
    : `<p class="muted">Availability varies by region.</p>`;
  const related = TITLES.filter((x) => x.id !== t.id && x.genres.some((g) => t.genres.includes(g))).slice(0, 4);

  main.innerHTML = `
    <header class="review-hero">
      <div class="review-hero-bg" style="background-image:url('${t.backdrop || t.poster}')"></div>
      <div class="container review-hero-inner">
        <img class="poster" src="${t.poster}" alt="${esc(t.title)} poster">
        <div>
          <p class="eyebrow">${t.type} · ${esc(t.year)}</p>
          <h1>${esc(t.title)}</h1>
          <p class="tagline">${esc(t.tagline)}</p>
          <p class="meta">Created by ${esc(t.creator)}</p>
          <ul class="tags">${t.genres.map((g) => `<li><a href="index.html?q=${encodeURIComponent(g)}">${g}</a></li>`).join("")}</ul>
          <div class="score">${t.score == null
            ? `<span class="score-num">—</span><span>Full review coming soon</span>`
            : `<span class="score-num">${t.score}<small>/10</small></span><span>CineSedation score</span>`}</div>
        </div>
      </div>
    </header>
    <div class="container review-layout">
      <article>
        ${section("Overview", t.overview)}
        ${section("Themes &amp; motifs", t.themes)}
        ${section("Characters", t.characters)}
        ${section("Final verdict", t.verdict)}
        <section class="block">
          <h2>Trailer</h2>
          <div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${t.trailer}" title="${esc(t.title)} trailer" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe></div>
        </section>
      </article>
      <aside>
        <div class="panel">
          <h2>Where to watch</h2>
          <div class="watch">${watch}</div>
        </div>
        <div class="panel">
          <h2>Your rating</h2>
          <div class="rate" role="radiogroup" aria-label="Your rating out of 5">
            ${[1, 2, 3, 4, 5].map((n) => `<button type="button" role="radio" data-n="${n}" aria-label="${n} star${n > 1 ? "s" : ""}">★</button>`).join("")}
          </div>
          <p class="muted" id="rate-msg"></p>
        </div>
        <form class="panel" id="review-form">
          <h2>Write a review</h2>
          <label for="r-name">Name</label>
          <input id="r-name" maxlength="40" required placeholder="Your name">
          <label for="r-text">Review</label>
          <textarea id="r-text" rows="4" maxlength="1000" required placeholder="What did you think?"></textarea>
          <button class="btn" type="submit">Post review</button>
          <p class="muted small">Reviews are saved in this browser only.</p>
        </form>
      </aside>
    </div>
    <section class="container block">
      <h2>Community reviews</h2>
      <ul class="user-reviews" id="user-reviews"></ul>
    </section>
    ${related.length ? `<section class="container block"><h2>More like this</h2><div class="grid">${related.map(card).join("")}</div></section>` : ""}`;

  // Your rating
  const stars = main.querySelectorAll(".rate button");
  const paint = (n) => {
    stars.forEach((b) => { const on = +b.dataset.n <= n; b.classList.toggle("on", on); b.setAttribute("aria-checked", +b.dataset.n === n); });
    $("#rate-msg").textContent = n ? `You rated this ${n}/5. Click again to change it.` : "Tap a star to rate.";
  };
  paint(store.get("rating:" + t.id, 0));
  stars.forEach((b) => b.addEventListener("click", () => { store.set("rating:" + t.id, +b.dataset.n); paint(+b.dataset.n); }));

  // Community reviews (rendered with textContent so user input can never inject HTML)
  const list = $("#user-reviews");
  const showReviews = () => {
    const reviews = store.get("reviews:" + t.id, []);
    list.replaceChildren();
    if (!reviews.length) { const li = document.createElement("li"); li.className = "muted"; li.textContent = "No reviews yet. Be the first."; list.append(li); return; }
    reviews.forEach((r) => {
      const li = document.createElement("li");
      const h = document.createElement("strong"); h.textContent = r.name;
      const d = document.createElement("time"); d.textContent = new Date(r.at).toLocaleDateString();
      const p = document.createElement("p"); p.textContent = r.text;
      li.append(h, d, p);
      list.append(li);
    });
  };
  showReviews();
  $("#review-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#r-name").value.trim(), text = $("#r-text").value.trim();
    if (!name || !text) return;
    const reviews = [{ name, text, at: Date.now() }, ...store.get("reviews:" + t.id, [])];
    if (!store.set("reviews:" + t.id, reviews)) { alert("Couldn't save: your browser is blocking local storage."); return; }
    e.target.reset();
    showReviews();
  });
}

/* ---------- Shared ---------- */
$("#nav-toggle")?.addEventListener("click", (e) => {
  const open = document.body.classList.toggle("nav-open");
  e.currentTarget.setAttribute("aria-expanded", open);
});
$("#year") && ($("#year").textContent = new Date().getFullYear());

if (document.body.dataset.page === "home") initHome();
if (document.body.dataset.page === "review") initReview();
