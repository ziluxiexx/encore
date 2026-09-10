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
  const intermission = ticket.status === "intermission";
  const ticketZh = (ticket.language || language) === "zh";
  const signature = localStorage.getItem(`encore-ticket-signature-${key(ticket)}`);
  const breakTime = ticket.intermission === "—" ? "—" : ticket.intermission ? `${ticket.intermission} ${ticketZh ? "分钟" : "MIN"}` : ticket.intermission === 0 ? (ticketZh ? "无" : "NONE") : "—";
  const seat = ticket.floor === "—" ? "—" : ticket.floor ? `${ticket.floor}${ticketZh ? "层" : "F"} ${ticket.row}${ticketZh ? "排" : "R"} ${ticket.seat}${ticketZh ? "座" : "S"}` : "—";
  const minutes = failed ? "0" : ticket.actualMinutes ?? ticket.duration ?? "—";
  const unit = minutes === "—" ? "" : ticketZh ? "分钟" : "MIN";
  return `<article class="archive-ticket${failed ? " archive-ticket--failed" : ""}${intermission ? " archive-ticket--intermission" : ""}" data-index="${index}"><p>ENCORE / TICKET STUB</p><h2>${ticket.title || "Encore"}</h2><span>${ticket.venue || "ENCORE"}</span><div class="archive-ticket__rule"></div><dl><div><dt>${ticketZh ? "日期" : "DATE"}</dt><dd>${ticket.completedDate || "—"}</dd></div><div><dt>${ticketZh ? "专注时长" : "FOCUS TIME"}</dt><dd>${minutes} ${unit}</dd></div><div><dt>${ticketZh ? "中场" : "BREAK"}</dt><dd>${breakTime}</dd></div><div><dt>${ticketZh ? "座位" : "SEAT"}</dt><dd>${seat}</dd></div></dl>${intermission ? `<em class="archive-ticket__status">${ticketZh ? "中场离席 · 上半场已完成" : "ACT I ONLY"}</em>` : ""}${signature ? `<img class="archive-ticket__mark" src="${signature}" alt="" />` : ""}</article>`;
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

const actions=document.createElement("div");actions.className="archive-actions";actions.hidden=isIllustration;actions.innerHTML=`<button id="archive-sign" type="button">${zh?"为我的票根签名":"Sign my ticket"}</button><button id="archive-save" type="button">${zh?"保存图片":"Save image"}</button>`;carousel.after(actions);
const dialog=document.createElement("section");dialog.className="archive-signature";dialog.hidden=true;dialog.innerHTML=`<div class="archive-signature__sheet"><button class="archive-signature__close" type="button" aria-label="Close">×</button><p>${zh?"为我的票根签名":"Sign my ticket"}</p><div class="archive-signature__ticket" id="archive-signature-ticket"></div><div class="archive-markers"><button data-color="#b98a36" type="button" aria-label="Gold"></button><button data-color="#8e949d" type="button" aria-label="Silver"></button><button data-color="#3d6f9e" type="button" aria-label="Blue"></button><button data-color="#24211e" type="button" aria-label="Black"></button><button class="archive-clear" type="button">${zh?"清除":"Clear"}</button></div></div>`;document.body.append(dialog);
let inkColor="#b98a36",drawing=false,lastPoint=null,signatureCanvas=null,signatureContext=null;
const ticketKey=ticket=>`encore-ticket-signature-${key(ticket)}`;
function activeTicket(){return tickets[focused]}
function drawTicketPreview(ticket){const tzh=(ticket.language||language)==="zh",mins=ticket.actualMinutes??ticket.duration??"—";return `<p>ENCORE / TICKET STUB</p><h2>${ticket.title||"Encore"}</h2><span>${ticket.venue||"Encore Theatre"}</span><i></i><dl><div><small>${tzh?"日期":"DATE"}</small><b>${ticket.completedDate||"—"}</b></div><div><small>${tzh?"专注时长":"FOCUS TIME"}</small><b>${mins==="—"?"—":`${mins} ${tzh?"分钟":"MIN"}`}</b></div><div><small>${tzh?"中场":"BREAK"}</small><b>${ticket.intermission?`${ticket.intermission} ${tzh?"分钟":"MIN"}`:(ticket.intermission===0?(tzh?"无":"NONE"):"—")}</b></div><div><small>${tzh?"座位":"SEAT"}</small><b>${ticket.floor?`${ticket.floor}${tzh?"层":"F"} ${ticket.row}${tzh?"排":"R"} ${ticket.seat}${tzh?"座":"S"}`:"—"}</b></div></dl><canvas aria-label="${zh?"签名画布":"Signature canvas"}"></canvas>`}
function openSignature(){const ticket=activeTicket();if(isIllustration||ticket.status==="failed")return;document.querySelector("#archive-signature-ticket").innerHTML=drawTicketPreview(ticket);dialog.hidden=false;signatureCanvas=dialog.querySelector("canvas");const rect=signatureCanvas.getBoundingClientRect(),ratio=window.devicePixelRatio||1;signatureCanvas.width=Math.round(rect.width*ratio);signatureCanvas.height=Math.round(rect.height*ratio);signatureContext=signatureCanvas.getContext("2d");signatureContext.scale(ratio,ratio);signatureContext.lineCap="round";signatureContext.lineJoin="round";const previous=localStorage.getItem(ticketKey(ticket));if(previous){const image=new Image();image.onload=()=>signatureContext.drawImage(image,0,0,rect.width,rect.height);image.src=previous}}
function closeSignature(save=true){if(save&&signatureCanvas){const data=signatureCanvas.toDataURL("image/png"),ticket=activeTicket();localStorage.setItem(ticketKey(ticket),data);const current=stage.querySelector(`.archive-ticket[data-index="${focused}"]`);let mark=current.querySelector(".archive-ticket__mark");if(!mark){mark=document.createElement("img");mark.className="archive-ticket__mark";mark.alt="";current.append(mark)}mark.src=data}dialog.hidden=true;signatureCanvas=null}
dialog.querySelector(".archive-signature__close").addEventListener("click",()=>closeSignature());dialog.addEventListener("click",event=>{if(event.target===dialog)closeSignature()});dialog.querySelectorAll("[data-color]").forEach(button=>button.addEventListener("click",()=>{inkColor=button.dataset.color;dialog.querySelectorAll("[data-color]").forEach(node=>node.classList.toggle("is-active",node===button))}));dialog.querySelector(".archive-clear").addEventListener("click",()=>{if(signatureCanvas)signatureContext.clearRect(0,0,signatureCanvas.width,signatureCanvas.height)});dialog.addEventListener("pointerdown",event=>{if(event.target!==signatureCanvas)return;drawing=true;const rect=signatureCanvas.getBoundingClientRect();lastPoint={x:event.clientX-rect.left,y:event.clientY-rect.top};signatureCanvas.setPointerCapture(event.pointerId)});dialog.addEventListener("pointermove",event=>{if(!drawing||event.target!==signatureCanvas)return;const rect=signatureCanvas.getBoundingClientRect(),point={x:event.clientX-rect.left,y:event.clientY-rect.top};signatureContext.strokeStyle=inkColor;signatureContext.lineWidth=3.4;signatureContext.beginPath();signatureContext.moveTo(lastPoint.x,lastPoint.y);signatureContext.lineTo(point.x,point.y);signatureContext.stroke();lastPoint=point});["pointerup","pointercancel"].forEach(type=>dialog.addEventListener(type,()=>{drawing=false;lastPoint=null}));
function exportTicket(){const ticket=activeTicket();if(isIllustration||ticket.status==="failed")return;const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d"),w=1200,h=760,tzh=(ticket.language||language)==="zh",mins=ticket.actualMinutes??ticket.duration??"—";canvas.width=w;canvas.height=h;ctx.fillStyle="#fffaf0";ctx.fillRect(0,0,w,h);ctx.fillStyle="#6c2635";ctx.font="700 34px Arial";ctx.fillText("ENCORE / TICKET STUB",70,90);ctx.fillStyle="#24211e";ctx.font="92px Georgia";ctx.fillText(ticket.title||"Encore",70,225);ctx.fillStyle="#70675e";ctx.font="35px Arial";ctx.fillText(ticket.venue||"Encore Theatre",70,285);ctx.strokeStyle="#c6b9a8";ctx.setLineDash([14,12]);ctx.beginPath();ctx.moveTo(70,350);ctx.lineTo(w-70,350);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#80776e";ctx.font="26px Arial";ctx.fillText(tzh?"日期":"DATE",70,425);ctx.fillText(tzh?"专注时长":"FOCUS TIME",620,425);ctx.fillText(tzh?"中场":"BREAK",70,585);ctx.fillText(tzh?"座位":"SEAT",620,585);ctx.fillStyle="#24211e";ctx.font="bold 35px Arial";ctx.fillText(ticket.completedDate||"—",70,475);ctx.fillText(mins==="—"?"—":`${mins} ${tzh?"分钟":"MIN"}`,620,475);const signature=localStorage.getItem(ticketKey(ticket));const finish=()=>{const link=document.createElement("a");link.href=canvas.toDataURL("image/png");link.download=`${ticket.title||"Encore"}-ticket.png`;link.click()};if(signature){const image=new Image();image.onload=()=>{ctx.drawImage(image,0,0,w,h);finish()};image.src=signature}else finish()}
document.querySelector("#archive-sign").addEventListener("click",openSignature);document.querySelector("#archive-save").addEventListener("click",exportTicket);
