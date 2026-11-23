"use strict";
/* =========================================================
   保存（クッキー）
   1カード = "id-状態-覚えた回数-間違えた回数"   状態 0未学習 1まだ 2覚えた
   4KB制限に備えて <教科>_p0, <教科>_p1 ... に分割して保存
   ========================================================= */
const SUBJECT_KEY = document.currentScript.dataset.subject;
const SUBJECT = window.SUBJECTS[SUBJECT_KEY];
const DECKS = SUBJECT.decks;
const CARDS = SUBJECT.cards;
const COOKIE_PREFIX = SUBJECT_KEY + "_p";
const SET_COOKIE = SUBJECT_KEY + "_set";
const LS_KEY = SUBJECT_KEY + "_progress";
const BACKUP_TAG = SUBJECT_KEY.toUpperCase() + "1:";

document.body.insertAdjacentHTML("afterbegin", `
<!-- ============ HOME ============ -->
<main id="home" class="wrap">
  <header class="top">
    <a class="crumb" href="../">← 教科をえらぶ</a>
    <p id="lead"></p>
    <h1 id="title"></h1>
  </header>

  <section class="overall">
    <div class="nums">
      <div class="big" id="ovKnown">0<small>/ 0 覚えた</small></div>
      <div class="legend"><span><i style="background:var(--ok)"></i>覚えた</span><span><i style="background:var(--mid)"></i>まだ</span><span><i style="background:var(--new)"></i>未学習</span></div>
    </div>
    <div class="bar"><span class="k" id="ovK"></span><span class="m" id="ovM"></span></div>
  </section>

  <div class="label">出題するカード</div>
  <div class="seg" id="modeSeg">
    <button data-mode="all">すべて</button>
    <button data-mode="todo">覚えてない</button>
    <button data-mode="wrong">間違えた</button>
  </div>
  <div class="toggles">
    <button class="tog" id="tShuffle"><span class="box"></span>シャッフル</button>
    <button class="tog" id="tReverse"><span class="box"></span>答え → 問題</button>
  </div>

  <div class="label">単元</div>
  <button class="all-btn" id="startAll">全単元まとめて<small id="allCount"></small></button>
  <div class="decks" id="decks"></div>

  <div class="foot">
    <button id="openStats">📊 記録を見る</button>
    <button id="openBackup">💾 バックアップ</button>
    <button id="openReset">↺ リセット</button>
  </div>
  <p class="note">学習記録（覚えた／まだ／間違えた回数）はこの端末のブラウザのクッキーに保存されます。<br>別の端末に移すときは「バックアップ」を使ってください。</p>
</main>

<!-- ============ STUDY ============ -->
<main id="study" class="wrap hidden">
  <div class="sbar">
    <button class="back" id="quit" aria-label="戻る">←</button>
    <div class="t"><b id="sTitle"></b><div class="bar"><span id="sProg"></span></div></div>
    <div class="pos" id="sPos"></div>
  </div>

  <div class="stage">
    <div class="flip" id="flip">
      <div class="face front">
        <div class="tag"><span id="fDeck"></span><span class="st" id="fSt"></span></div>
        <div class="main"><div class="q" id="fQ"></div></div>
        <div class="hint">タップして答えを見る</div>
      </div>
      <div class="face backside">
        <div class="tag"><span id="bDeck"></span><span class="st" id="bSt"></span></div>
        <div class="main">
          <div class="qmini" id="bQ"></div>
          <div class="a" id="bA"></div>
          <div class="n hidden" id="bN"></div>
        </div>
        <div class="meta"><span>✕ 間違えた <b id="bW">0</b>回</span><span>○ 覚えた <b id="bC">0</b>回</span></div>
      </div>
    </div>
  </div>

  <div class="answers locked" id="answers">
    <button class="ng" data-r="ng"><span class="ic">✕</span>間違えた<small>もう一度出る</small></button>
    <button class="mid" data-r="mid"><span class="ic">△</span>まだ不安<small>覚えてない</small></button>
    <button class="ok" data-r="ok"><span class="ic">○</span>覚えた<small>完璧！</small></button>
  </div>
  <div class="kbd">スペース：めくる ／ 1：間違えた ／ 2：まだ不安 ／ 3：覚えた</div>
</main>

<!-- ============ DONE ============ -->
<main id="done" class="wrap hidden">
  <div class="done">
    <h2>おつかれさま！</h2>
    <p id="dSub" style="color:var(--sub);margin:0"></p>
    <div class="score">
      <div><b style="color:var(--ok)" id="dOk">0</b><span>○ 覚えた</span></div>
      <div><b style="color:var(--mid)" id="dMid">0</b><span>△ まだ不安</span></div>
      <div><b style="color:var(--red)" id="dNg">0</b><span>✕ 間違えた</span></div>
    </div>
    <button class="btn primary" id="retry">△と✕のカードをもう一度</button>
    <button class="btn" id="toHome">単元一覧へ戻る</button>
  </div>
</main>

<!-- ============ STATS ============ -->
<main id="stats" class="wrap hidden">
  <div class="sbar">
    <button class="back" id="statsBack" aria-label="戻る">←</button>
    <div class="t stats"><h2>学習記録</h2></div>
  </div>
  <div style="display:flex;gap:8px">
    <select id="fDeckSel"></select>
    <select id="fSort">
      <option value="wrong">間違いが多い順</option>
      <option value="status">覚えてない順</option>
      <option value="order">ノート順</option>
    </select>
  </div>
  <div class="list" id="list"></div>
</main>

<!-- dialogs -->
<dialog id="dlgBackup">
  <h3>バックアップ</h3>
  <p>下のコードをコピーして保存しておくと、別の端末やブラウザで記録を復元できます。</p>
  <textarea id="exportBox" readonly></textarea>
  <div class="drow"><button id="copyBtn" class="go">コピー</button></div>
  <p style="margin-top:16px">復元するときは、コードを貼り付けて「復元」を押してください。</p>
  <textarea id="importBox" placeholder="ここにバックアップコードを貼り付け"></textarea>
  <div class="drow"><button id="closeBackup">閉じる</button><button id="importBtn" class="go">復元</button></div>
</dialog>
<dialog id="dlgReset">
  <h3>記録をリセット</h3>
  <p>すべてのカードの「覚えた／まだ／間違えた回数」を消去します。元に戻せません。</p>
  <div class="drow"><button id="cancelReset">やめる</button><button id="doReset" class="danger">リセット</button></div>
</dialog>
<div class="toast" id="toast"></div>

`);
document.title = `${SUBJECT.short}フラッシュカード｜${SUBJECT.name}`;
document.getElementById("lead").textContent = SUBJECT.lead;
document.getElementById("title").innerHTML = SUBJECT.titleHTML;
const MAX_AGE = 60 * 60 * 24 * 400; // 約400日（ブラウザ上限）
const CHUNK = 3000;

function setCookie(name, value, maxAge = MAX_AGE) {
  document.cookie = `${name}=${value}; max-age=${maxAge}; path=/; SameSite=Lax` + (location.protocol === "https:" ? "; Secure" : "");
}
function getCookie(name) {
  const m = document.cookie.split("; ").find(c => c.startsWith(name + "="));
  return m ? m.slice(name.length + 1) : null;
}

const byId = Object.fromEntries(CARDS.map(c => [c.id, c]));
let P = {}; // id -> {s, c, w}

function serialize() {
  return Object.entries(P)
    .filter(([id, v]) => byId[id] && (v.s || v.c || v.w))
    .map(([id, v]) => `${id}-${v.s}-${v.c}-${v.w}`).join(".");
}
function parse(str) {
  const out = {};
  if (!str) return out;
  for (const part of str.split(".")) {
    const [id, s, c, w] = part.split("-");
    if (!byId[id]) continue;
    out[id] = { s: +s || 0, c: +c || 0, w: +w || 0 };
  }
  return out;
}
function loadProgress() {
  let s = "", i = 0, v;
  while ((v = getCookie(COOKIE_PREFIX + i)) !== null) { s += v; i++; }
  if (!s) { try { s = localStorage.getItem(LS_KEY) || ""; } catch (e) {} }
  P = parse(s);
}
function saveProgress() {
  const s = serialize();
  let i = 0;
  for (let p = 0; p < s.length; p += CHUNK, i++) setCookie(COOKIE_PREFIX + i, s.slice(p, p + CHUNK));
  if (!s.length) i = 0;
  while (getCookie(COOKIE_PREFIX + i) !== null) { setCookie(COOKIE_PREFIX + i, "", 0); i++; }
  try { localStorage.setItem(LS_KEY, s); } catch (e) {} // 予備
}
const prog = id => P[id] || { s: 0, c: 0, w: 0 };

let S = { mode: "all", shuffle: true, reverse: false };
function loadSettings() {
  const v = getCookie(SET_COOKIE);
  if (!v) return;
  const [m, sh, rv] = v.split("-");
  if (["all", "todo", "wrong"].includes(m)) S.mode = m;
  S.shuffle = sh === "1"; S.reverse = rv === "1";
}
function saveSettings() { setCookie(SET_COOKIE, `${S.mode}-${S.shuffle ? 1 : 0}-${S.reverse ? 1 : 0}`); }

/* ========================================================= */
const $ = id => document.getElementById(id);
const deckOf = id => DECKS.find(d => d.id === id);
const ST_LABEL = ["未学習", "まだ", "覚えた"];
function show(screen) {
  for (const s of ["home", "study", "done", "stats"]) $(s).classList.toggle("hidden", s !== screen);
  window.scrollTo(0, 0);
}
function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 1800);
}
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function fmtQ(q) { return esc(q).replace(/〔〕/g, '<span class="blank">？</span>'); }

function counts(cards) {
  let k = 0, m = 0;
  for (const c of cards) { const s = prog(c.id).s; if (s === 2) k++; else if (s === 1) m++; }
  return { k, m, n: cards.length };
}
function setBar(kEl, mEl, r) {
  kEl.style.width = (r.k / r.n * 100) + "%";
  mEl.style.width = (r.m / r.n * 100) + "%";
}
function filterCards(cards) {
  if (S.mode === "todo") return cards.filter(c => prog(c.id).s !== 2);
  if (S.mode === "wrong") return cards.filter(c => prog(c.id).w > 0);
  return cards;
}

/* ---------- HOME ---------- */
function renderHome() {
  const all = counts(CARDS);
  $("ovKnown").innerHTML = `${all.k}<small>/ ${all.n} 覚えた</small>`;
  setBar($("ovK"), $("ovM"), all);
  document.querySelectorAll("#modeSeg button").forEach(b => b.classList.toggle("on", b.dataset.mode === S.mode));
  $("tShuffle").classList.toggle("on", S.shuffle);
  $("tReverse").classList.toggle("on", S.reverse);

  const allN = filterCards(CARDS).length;
  $("allCount").textContent = `${allN}枚`;
  $("startAll").disabled = !allN;
  $("startAll").style.opacity = allN ? 1 : .5;

  const box = $("decks"); box.innerHTML = "";
  for (const d of DECKS) {
    const cards = CARDS.filter(c => c.d === d.id);
    const r = counts(cards), n = filterCards(cards).length;
    const b = document.createElement("button");
    b.className = "deck"; b.disabled = !n;
    b.innerHTML = `<div class="sub">${esc(d.sub)}</div><div class="name">${esc(d.name)}</div>
      <div class="row"><div class="bar"><span class="k" style="width:${r.k / r.n * 100}%"></span><span class="m" style="width:${r.m / r.n * 100}%"></span></div>
      <div class="cnt">${r.k}/${r.n}${S.mode !== "all" ? `・出題${n}` : ""}</div></div>
      ${!n ? `<div class="empty">${S.mode === "todo" ? "全部覚えた！" : "間違えたカードなし"}</div>` : ""}`;
    b.onclick = () => startSession(cards, d.name);
    box.appendChild(b);
  }
}
document.querySelectorAll("#modeSeg button").forEach(b => b.onclick = () => { S.mode = b.dataset.mode; saveSettings(); renderHome(); });
$("tShuffle").onclick = () => { S.shuffle = !S.shuffle; saveSettings(); renderHome(); };
$("tReverse").onclick = () => { S.reverse = !S.reverse; saveSettings(); renderHome(); };
$("startAll").onclick = () => startSession(CARDS, "全単元");

/* ---------- STUDY ---------- */
let Q = [], qi = 0, title = "", tally = {}, flipped = false, again = [];
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

function startSession(cards, name, raw = false) {
  let list = raw ? cards.slice() : filterCards(cards).slice();
  if (!list.length) return toast("出題するカードがありません");
  if (S.mode === "wrong" && !raw) list.sort((a, b) => prog(b.id).w - prog(a.id).w);
  if (S.shuffle) shuffle(list);
  Q = list; qi = 0; title = name; tally = { ok: 0, mid: 0, ng: 0 }; again = [];
  show("study"); renderCard();
}
function renderCard() {
  const c = Q[qi], p = prog(c.id), d = deckOf(c.d);
  flipped = false;
  const fl = $("flip");
  fl.style.transition = "none"; fl.classList.remove("turned"); void fl.offsetWidth; fl.style.transition = "";
  $("answers").classList.add("locked");

  $("sTitle").textContent = title;
  $("sPos").textContent = `${qi + 1} / ${Q.length}`;
  $("sProg").style.width = (qi / Q.length * 100) + "%";
  for (const k of ["f", "b"]) {
    $(k + "Deck").textContent = d.name;
    const st = $(k + "St"); st.className = "st s" + p.s; st.textContent = ST_LABEL[p.s];
  }
  const isKanji = !!d.kanji;
  const front = S.reverse ? esc(c.a) : fmtQ(c.q);
  const back = S.reverse ? fmtQ(c.q) : esc(c.a);
  const fq = $("fQ");
  fq.innerHTML = front;
  fq.className = "q" + (isKanji && !S.reverse ? " kanji" : "");
  $("bQ").innerHTML = S.reverse ? esc(c.a) : fmtQ(c.q);
  const ba = $("bA");
  ba.innerHTML = back;
  ba.className = "a" + ((S.reverse ? c.q : c.a).length > 22 ? " small" : "");
  $("bN").textContent = c.n || "";
  $("bN").classList.toggle("hidden", !c.n);
  $("bW").textContent = p.w; $("bC").textContent = p.c;
}
function flip() {
  flipped = !flipped;
  $("flip").classList.toggle("turned", flipped);
  if (flipped) $("answers").classList.remove("locked");
}
$("flip").onclick = flip;

function answer(r) {
  if (!flipped) return;
  const c = Q[qi], p = { ...prog(c.id) };
  if (r === "ok") { p.s = 2; p.c++; }
  else if (r === "mid") { p.s = 1; }
  else { p.s = 1; p.w++; }
  P[c.id] = p; saveProgress();
  tally[r]++;
  if (r !== "ok") again.push(c);
  if (r === "ng" && Q.length - qi > 1) Q.push(c); // 間違えたら最後にもう一度
  qi++;
  if (qi >= Q.length) finish(); else renderCard();
}
document.querySelectorAll("#answers button").forEach(b => b.onclick = e => { e.stopPropagation(); answer(b.dataset.r); });

function finish() {
  $("sProg").style.width = "100%";
  $("dOk").textContent = tally.ok; $("dMid").textContent = tally.mid; $("dNg").textContent = tally.ng;
  $("dSub").textContent = `${title}・${tally.ok + tally.mid + tally.ng}回回答`;
  const uniq = [...new Map(again.map(c => [c.id, c])).values()].filter(c => prog(c.id).s !== 2);
  $("retry").classList.toggle("hidden", !uniq.length);
  $("retry").textContent = `△と✕のカードをもう一度（${uniq.length}枚）`;
  $("retry").onclick = () => startSession(uniq, title + "（復習）", true);
  show("done");
}
$("quit").onclick = () => { renderHome(); show("home"); };
$("toHome").onclick = () => { renderHome(); show("home"); };

document.addEventListener("keydown", e => {
  if ($("study").classList.contains("hidden")) return;
  if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); }
  else if (e.key === "1") answer("ng");
  else if (e.key === "2") answer("mid");
  else if (e.key === "3") answer("ok");
  else if (e.key === "Escape") { renderHome(); show("home"); }
});

/* ---------- STATS ---------- */
function renderStats() {
  const dsel = $("fDeckSel").value, sort = $("fSort").value;
  let list = CARDS.filter(c => dsel === "all" || c.d === dsel);
  const order = new Map(CARDS.map((c, i) => [c.id, i]));
  if (sort === "wrong") list.sort((a, b) => prog(b.id).w - prog(a.id).w || order.get(a.id) - order.get(b.id));
  if (sort === "status") list.sort((a, b) => ((prog(a.id).s + 2) % 3) - ((prog(b.id).s + 2) % 3) || prog(b.id).w - prog(a.id).w);
  $("list").innerHTML = list.map(c => {
    const p = prog(c.id);
    return `<div class="item"><span class="st s${p.s}">${ST_LABEL[p.s]}</span>
      <div><div class="qq">${fmtQ(c.q)}</div><div class="aa">${esc(c.a)}</div></div>
      <div class="cc"><span class="w">✕${p.w}</span><br>○${p.c}</div></div>`;
  }).join("");
}
$("fDeckSel").innerHTML = `<option value="all">全単元</option>` + DECKS.map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join("");
$("fDeckSel").onchange = renderStats; $("fSort").onchange = renderStats;
$("openStats").onclick = () => { renderStats(); show("stats"); };
$("statsBack").onclick = () => { renderHome(); show("home"); };

/* ---------- BACKUP / RESET ---------- */
$("openBackup").onclick = () => { $("exportBox").value = BACKUP_TAG + (serialize() || "(記録なし)"); $("importBox").value = ""; $("dlgBackup").showModal(); };
$("closeBackup").onclick = () => $("dlgBackup").close();
$("copyBtn").onclick = async () => {
  try { await navigator.clipboard.writeText($("exportBox").value); toast("コピーしました"); }
  catch (e) { $("exportBox").select(); document.execCommand("copy"); toast("コピーしました"); }
};
$("importBtn").onclick = () => {
  const v = $("importBox").value.trim().replace(/^[A-Z]+1:/, "");
  const data = parse(v);
  if (!Object.keys(data).length) return toast("コードが読み取れませんでした");
  P = data; saveProgress(); $("dlgBackup").close(); renderHome(); toast(`${Object.keys(data).length}枚分の記録を復元しました`);
};
$("openReset").onclick = () => $("dlgReset").showModal();
$("cancelReset").onclick = () => $("dlgReset").close();
$("doReset").onclick = () => { P = {}; saveProgress(); $("dlgReset").close(); renderHome(); toast("記録をリセットしました"); };

/* ---------- init ---------- */
loadProgress(); loadSettings(); renderHome();
