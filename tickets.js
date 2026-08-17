const language = localStorage.getItem("encore-language") || "zh";
const zh = language === "zh";
const tickets = JSON.parse(localStorage.getItem("encore-tickets") || "[]");
let active = Math.max(0, tickets.length - 1);
let dragStart = null;
const stage = document.querySelector("#ticket-stage");
const dots = document.querySelector("#carousel-dots");
const count = document.querySelector("#archive-count");
const note = document.querySelector("#archive-note");

document.documentElement.lang = zh ? "zh-CN" : "en";
const today = new Date();
document.querySelector("#archive-month").textContent = zh ? `${today.getMonth() + 1}月` : today.toLocaleDateString("en-US", { month:"short" });
document.querySelector("#archive-day").textContent = String(today.getDate());
document.querySelector("#archive-language").addEventListener("click", () => { localStorage.setItem("encore-language", zh ? "en" : "zh"); location.reload(); });
document.querySelector(".archive-intro p").textContent = zh ? "查看收藏" : "VIEW YOUR COLLECTION";
document.querySelector(".archive-intro h1").textContent = zh ? "全部票根" : "All tickets";
note.textContent = tickets.length ? (zh ? "左右滑动或使用箭头翻阅你的票根。" : "Swipe or use the arrows to browse your tickets.") : (zh ? "暂时还没有票根收藏，快去完成一场专注吧。" : "No tickets collected yet. Complete a focus session to begin.");
count.textContent = zh ? `${tickets.length} 张收藏票根` : `${tickets.length} collected tickets`;
if (!tickets.length) { document.querySelector("#previous-ticket").hidden = true; document.querySelector("#next-ticket").hidden = true; }

function key(ticket) {
  return `v2-${ticket.id || `legacy-${ticket.completedAt || ticket.completedDate || "draft"}-${ticket.title || "ticket"}`}`;
}

function card(ticket, index) {
  const failed = ticket.status === "failed";
  const signature = localStorage.getItem(`encore-ticket-signature-${key(ticket)}`);
  return `<article class="archive-ticket${failed ? " archive-ticket--failed" : ""}" data-index="${index}">
    <p>ENCORE / TICKET STUB</p><h2>${ticket.title || "Encore"}</h2><span>${ticket.venue || "ENCORE"}</span>
    <div class="archive-ticket__rule"></div><dl><div><dt>DATE</dt><dd>${ticket.completedDate || "—"}</dd></div><div><dt>FOCUS TIME</dt><dd>${failed ? "0" : ticket.actualMinutes ?? ticket.duration ?? "—"} ${zh ? "分钟" : "MIN"}</dd></div></dl>
    ${signature ? `<img class="archive-ticket__mark" src="${signature}" alt="" />` : ""}
  </article>`;
}

function layoutTickets() {
  document.querySelectorAll(".archive-ticket").forEach((element, index) => {
    let offset = index - active;
    if (offset > tickets.length / 2) offset -= tickets.length;
    if (offset < -tickets.length / 2) offset += tickets.length;
    const depth = Math.abs(offset);
    const behind = Math.max(0, offset);
    element.style.transform = `translate(-50%,-50%) translateX(${offset * 49}px) translateZ(${-depth * 145}px) rotateY(${offset < 0 ? -Math.min(22, depth * 19) : Math.min(22, depth * 19)}deg) scale(${1 - depth * .07})`;
    element.style.opacity = depth > 3 ? "0" : String(Math.max(.16, 1 - behind * .25));
    element.style.filter = `brightness(${1 - behind * .14}) blur(${behind * 1.1}px)`;
    element.style.zIndex = String(100 - depth);
  });
}

function render() {
  stage.innerHTML = tickets.map(card).join("");
  dots.innerHTML = tickets.map((_, index) => `<button type="button" data-index="${index}" class="${index === active ? "is-active" : ""}" aria-label="${index + 1}"></button>`).join("");
  layoutTickets();
}

function go(step) {
  active = (active + step + tickets.length) % tickets.length;
  render();
}

document.querySelector("#previous-ticket").addEventListener("click", () => go(-1));
document.querySelector("#next-ticket").addEventListener("click", () => go(1));
dots.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;
  active = Number(button.dataset.index);
  render();
});
const carousel = document.querySelector("#depth-carousel");
carousel.addEventListener("pointerdown", event => { dragStart = event.clientX; });
carousel.addEventListener("pointerup", event => {
  if (dragStart === null) return;
  const delta = event.clientX - dragStart;
  dragStart = null;
  if (Math.abs(delta) > 35) go(delta > 0 ? -1 : 1);
});
carousel.addEventListener("keydown", event => {
  if (event.key === "ArrowLeft") go(-1);
  if (event.key === "ArrowRight") go(1);
});
render();
