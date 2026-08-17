const language = localStorage.getItem("encore-language") || "zh";
const zh = language === "zh";
const tickets = JSON.parse(localStorage.getItem("encore-tickets") || "[]");
const isIllustration = tickets.length === 0;
if (isIllustration) tickets.push(
  { id:"illustration-one", title:"Encore", venue:"Encore Theatre", actualMinutes:"—", completedDate:"—", intermission:"—", floor:"—", language, status:"completed" },
  { id:"illustration-two", title:"Encore", venue:"Encore Theatre", actualMinutes:"—", completedDate:"—", intermission:"—", floor:"—", language, status:"completed" },
  { id:"illustration-three", title:"Encore", venue:"Encore Theatre", actualMinutes:"—", completedDate:"—", intermission:"—", floor:"—", language, status:"completed" }
);

const stage = document.querySelector("#ticket-stage");
const dots = document.querySelector("#carousel-dots");
const carousel = document.querySelector("#depth-carousel");
const count = document.querySelector("#archive-count");
const note = document.querySelector("#archive-note");
let position = 0;
let focused = 0;
let animation = null;

document.documentElement.lang = zh ? "zh-CN" : "en";
document.querySelectorAll("#archive-language [data-language]").forEach(node => node.classList.toggle("is-current", node.dataset.language === language));
document.querySelector("#archive-language").addEventListener("click", () => { localStorage.setItem("encore-language", zh ? "en" : "zh"); location.reload(); });
const today = new Date();
document.querySelector("#archive-month").textContent = zh ? `${today.getMonth() + 1}月` : today.toLocaleDateString("en-US", { month:"short" });
document.querySelector("#archive-day").textContent = String(today.getDate());
document.querySelector(".archive-intro p").textContent = zh ? "查看收藏" : "VIEW YOUR COLLECTION";
document.querySelector(".archive-intro h1").textContent = zh ? "全部票根" : "All tickets";
note.textContent = isIllustration ? (zh ? "这是票根展示效果；完成第一场专注后，这里会出现属于你的票根。" : "These are illustrative tickets. Complete your first focus session to collect your own.") : (zh ? "使用左右箭头翻阅你的票根。" : "Use the arrows to browse your tickets.");
count.textContent = isIllustration ? (zh ? "票根展示" : "Ticket preview") : (zh ? `${tickets.length} 张收藏票根` : `${tickets.length} collected tickets`);

function key(ticket) { return `v2-${ticket.id || `legacy-${ticket.completedAt || ticket.completedDate || "draft"}-${ticket.title || "ticket"}`}`; }
function card(ticket, index) {
  const failed = ticket.status === "failed";
  const ticketZh = (ticket.language || language) === "zh";
  const signature = localStorage.getItem(`encore-ticket-signature-${key(ticket)}`);
  const breakTime = ticket.intermission === "—" ? "—" : ticket.intermission ? `${ticket.intermission} ${ticketZh ? "分钟" : "MIN"}` : ticket.intermission === 0 ? (ticketZh ? "无" : "NONE") : "—";
  const seat = ticket.floor === "—" ? "—" : ticket.floor ? `${ticket.floor}${ticketZh ? "层" : "F"} ${ticket.row}${ticketZh ? "排" : "R"} ${ticket.seat}${ticketZh ? "座" : "S"}` : "—";
  const minutes = failed ? "0" : ticket.actualMinutes ?? ticket.duration ?? "—";
  const unit = minutes === "—" ? "" : ticketZh ? "分钟" : "MIN";
  return `<article class="archive-ticket${failed ? " archive-ticket--failed" : ""}" data-index="${index}"><p>ENCORE / TICKET STUB</p><h2>${ticket.title || "Encore"}</h2><span>${ticket.venue || "ENCORE"}</span><div class="archive-ticket__rule"></div><dl><div><dt>${ticketZh ? "日期" : "DATE"}</dt><dd>${ticket.completedDate || "—"}</dd></div><div><dt>${ticketZh ? "专注时长" : "FOCUS TIME"}</dt><dd>${minutes} ${unit}</dd></div><div><dt>${ticketZh ? "中场" : "BREAK"}</dt><dd>${breakTime}</dd></div><div><dt>${ticketZh ? "座位" : "SEAT"}</dt><dd>${seat}</dd></div></dl>${signature ? `<img class="archive-ticket__mark" src="${signature}" alt="" />` : ""}</article>`;
}

stage.innerHTML = tickets.map(card).join("");
dots.innerHTML = tickets.map((_, index) => `<button type="button" data-index="${index}" aria-label="${index + 1}"></button>`).join("");
dots.hidden = true;
const cards = [...stage.querySelectorAll(".archive-ticket")];

function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
function distance(index, pos) {
  let value = index - pos;
  const count = tickets.length;
  value = ((value % count) + count) % count;
  if (value > count / 2) value -= count;
  return value;
}
function layout(pos) {
  cards.forEach((cardNode, index) => {
    const d = distance(index, pos);
    const back = Math.max(0, d);
    const shown = Math.abs(d) <= 3.5;
    const opacity = d < 0 ? Math.max(0, 1 + d) : 1;
    const brightness = Math.max(.25, 1 - back * .2);
    cardNode.style.transition = "none";
    cardNode.style.transform = `translate(-50%,-50%) translateX(${(d * 70).toFixed(1)}px) translateZ(${(-170 * d).toFixed(1)}px) rotateY(${(22 * clamp(d, 0, 1)).toFixed(1)}deg) scale(${(1 - back * .06).toFixed(3)})`;
    cardNode.style.opacity = shown ? String(opacity) : "0";
    cardNode.style.filter = `brightness(${brightness})`;
    cardNode.style.zIndex = String(Math.round(2000 - d * 20));
  });
}
function updateDots() { [...dots.children].forEach((dot, index) => dot.classList.toggle("is-active", index === focused)); }
function normalize(value) { return ((value % tickets.length) + tickets.length) % tickets.length; }
function animateTo(target) {
  if (animation) cancelAnimationFrame(animation);
  const start = position;
  const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 520;
  const started = performance.now();
  const tick = now => {
    const progress = duration ? clamp((now - started) / duration, 0, 1) : 1;
    const eased = 1 - Math.pow(1 - progress, 4);
    position = start + (target - start) * eased;
    layout(position);
    if (progress < 1) animation = requestAnimationFrame(tick);
    else { position = normalize(target); focused = Math.round(position) % tickets.length; layout(position); updateDots(); animation = null; }
  };
  animation = requestAnimationFrame(tick);
}
function setFocus(index) {
  const next = normalize(index);
  let delta = next - position;
  if (delta > tickets.length / 2) delta -= tickets.length;
  if (delta < -tickets.length / 2) delta += tickets.length;
  animateTo(position + delta);
}

document.querySelector("#previous-ticket").addEventListener("click", () => setFocus(focused - 1));
document.querySelector("#next-ticket").addEventListener("click", () => setFocus(focused + 1));
layout(position);
updateDots();
