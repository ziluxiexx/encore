(()=>{
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
document.querySelector("#archive-language").addEventListener("click", () => { localStorage.setItem("encore-language", zh ? "en" : "zh"); window.EncoreRouter.go('tickets'); });
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

const archiveActions=document.querySelector("#archive-ticket-actions"),archiveSign=document.querySelector("#archive-sign"),archiveSave=document.querySelector("#archive-save"),signatureDialog=document.querySelector("#archive-signature-dialog"),signatureCanvas=document.querySelector("#archive-signature-canvas"),signatureClose=document.querySelector("#archive-signature-close"),signatureUndo=document.querySelector("#archive-signature-undo"),signatureClear=document.querySelector("#archive-signature-clear");
let archiveInk=signatureCanvas.getContext("2d"),archiveDrawing=false,archiveLast=null,archiveHistory=[],archiveColor="#b98a36";
function archiveCurrent(){return tickets[focused]}
function archiveKey(ticket){return `encore-ticket-signature-${key(ticket)}`}
function archiveBreak(ticket,ticketZh){return ticket.intermission?`${ticket.intermission} ${ticketZh?"分钟":"MIN"}`:(ticket.intermission===0?(ticketZh?"无":"NONE"):"—")}
function archiveSeat(ticket,ticketZh){return ticket.floor?`${ticket.floor}${ticketZh?"层":"F"} ${ticket.row}${ticketZh?"排":"R"} ${ticket.seat}${ticketZh?"座":"S"}`:"—"}
function updateArchiveActions(){const ticket=archiveCurrent(),available=ticket&&!isIllustration&&ticket.status!=="failed";archiveActions.hidden=!available;archiveSign.textContent=zh?"为我的票根签名":"Sign my ticket";archiveSave.textContent=zh?"保存到相册":"Save to photos"}
const originalArchiveDots=updateDots;updateDots=function(){originalArchiveDots();updateArchiveActions()};updateArchiveActions();
function fillSignatureTicket(ticket){const ticketZh=(ticket.language||language)==="zh",minutes=ticket.actualMinutes??ticket.duration??"—";document.querySelector("#archive-signature-kicker").textContent=ticketZh?"为我的票根签名":"Sign my ticket";document.querySelector("#archive-signature-title").textContent=ticket.title||"Encore";document.querySelector("#archive-signature-venue").textContent=ticket.venue||"Encore Theatre";document.querySelector("#signature-date-label").textContent=ticketZh?"日期":"DATE";document.querySelector("#signature-focus-label").textContent=ticketZh?"专注时长":"FOCUS TIME";document.querySelector("#signature-break-label").textContent=ticketZh?"中场":"BREAK";document.querySelector("#signature-seat-label").textContent=ticketZh?"座位":"SEAT";document.querySelector("#archive-signature-date").textContent=ticket.completedDate||"—";document.querySelector("#archive-signature-focus").textContent=minutes==="—"?"—":`${minutes} ${ticketZh?"分钟":"MIN"}`;document.querySelector("#archive-signature-break").textContent=archiveBreak(ticket,ticketZh);document.querySelector("#archive-signature-seat").textContent=archiveSeat(ticket,ticketZh);document.querySelector("#archive-marker-label").textContent=ticketZh?"选择马克笔":"Choose a marker";signatureUndo.textContent=ticketZh?"撤回":"Undo";signatureClear.textContent=ticketZh?"清除":"Clear"}
function sizeArchiveCanvas(){const rect=signatureCanvas.getBoundingClientRect(),ratio=window.devicePixelRatio||1;signatureCanvas.width=Math.round(rect.width*ratio);signatureCanvas.height=Math.round(rect.height*ratio);archiveInk=signatureCanvas.getContext("2d");archiveInk.scale(ratio,ratio);archiveInk.lineCap="round";archiveInk.lineJoin="round";const saved=localStorage.getItem(archiveKey(archiveCurrent()));if(saved){const image=new Image();image.onload=()=>archiveInk.drawImage(image,0,0,rect.width,rect.height);image.src=saved}}
function archivePoint(event){const rect=signatureCanvas.getBoundingClientRect();return{x:event.clientX-rect.left,y:event.clientY-rect.top}}
function archiveSnapshot(){archiveHistory.push(signatureCanvas.toDataURL("image/png"));if(archiveHistory.length>30)archiveHistory.shift()}
function archiveRestore(data){const rect=signatureCanvas.getBoundingClientRect();archiveInk.clearRect(0,0,rect.width,rect.height);if(!data)return;const image=new Image();image.onload=()=>archiveInk.drawImage(image,0,0,rect.width,rect.height);image.src=data}
signatureCanvas.addEventListener("pointerdown",event=>{archiveDrawing=true;archiveLast=archivePoint(event);archiveSnapshot();signatureCanvas.setPointerCapture(event.pointerId)});signatureCanvas.addEventListener("pointermove",event=>{if(!archiveDrawing)return;const point=archivePoint(event);archiveInk.strokeStyle=archiveColor;archiveInk.lineWidth=3.4;archiveInk.beginPath();archiveInk.moveTo(archiveLast.x,archiveLast.y);archiveInk.lineTo(point.x,point.y);archiveInk.stroke();archiveLast=point});["pointerup","pointercancel"].forEach(type=>signatureCanvas.addEventListener(type,()=>{archiveDrawing=false;archiveLast=null}));
document.querySelectorAll(".archive-marker").forEach(button=>button.addEventListener("click",()=>{archiveColor=button.dataset.color;document.querySelectorAll(".archive-marker").forEach(node=>node.classList.toggle("is-active",node===button))}));signatureUndo.addEventListener("click",()=>archiveRestore(archiveHistory.pop()));signatureClear.addEventListener("click",()=>{archiveSnapshot();const rect=signatureCanvas.getBoundingClientRect();archiveInk.clearRect(0,0,rect.width,rect.height)});
function closeArchiveSignature(save=true){if(save){const data=signatureCanvas.toDataURL("image/png");localStorage.setItem(archiveKey(archiveCurrent()),data);const currentCard=stage.querySelector(`.archive-ticket[data-index="${focused}"]`);let mark=currentCard.querySelector(".archive-ticket__mark");if(!mark){mark=document.createElement("img");mark.className="archive-ticket__mark";mark.alt="";currentCard.append(mark)}mark.src=data}signatureDialog.hidden=true}
archiveSign.addEventListener("click",()=>{fillSignatureTicket(archiveCurrent());signatureDialog.hidden=false;archiveHistory=[];requestAnimationFrame(sizeArchiveCanvas)});signatureClose.addEventListener("click",()=>closeArchiveSignature());signatureDialog.addEventListener("click",event=>{if(event.target===signatureDialog)closeArchiveSignature()});
function ticketImageData(ticket){const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d"),w=1200,h=760,ticketZh=(ticket.language||language)==="zh",minutes=ticket.actualMinutes??ticket.duration??"—";canvas.width=w;canvas.height=h;ctx.fillStyle="#fffaf0";ctx.fillRect(0,0,w,h);ctx.fillStyle="#6c2635";ctx.font="700 34px Arial";ctx.fillText("ENCORE / TICKET STUB",70,90);ctx.fillStyle="#24211e";ctx.font="92px Georgia";ctx.fillText(ticket.title||"Encore",70,225);ctx.fillStyle="#70675e";ctx.font="35px Arial";ctx.fillText(ticket.venue||"Encore Theatre",70,285);ctx.strokeStyle="#c6b9a8";ctx.setLineDash([14,12]);ctx.beginPath();ctx.moveTo(70,350);ctx.lineTo(w-70,350);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#80776e";ctx.font="26px Arial";ctx.fillText(ticketZh?"日期":"DATE",70,425);ctx.fillText(ticketZh?"专注时长":"FOCUS TIME",620,425);ctx.fillText(ticketZh?"中场":"BREAK",70,585);ctx.fillText(ticketZh?"座位":"SEAT",620,585);ctx.fillStyle="#24211e";ctx.font="bold 35px Arial";ctx.fillText(ticket.completedDate||"—",70,475);ctx.fillText(minutes==="—"?"—":`${minutes} ${ticketZh?"分钟":"MIN"}`,620,475);ctx.fillText(archiveBreak(ticket,ticketZh),70,635);ctx.fillText(archiveSeat(ticket,ticketZh),620,635);return canvas}
archiveSave.addEventListener("click",async()=>{const ticket=archiveCurrent(),canvas=ticketImageData(ticket),saved=localStorage.getItem(archiveKey(ticket));if(saved){await new Promise(resolve=>{const image=new Image();image.onload=()=>{canvas.getContext("2d").drawImage(image,0,0,canvas.width,canvas.height);resolve()};image.onerror=resolve;image.src=saved})}const imageData=canvas.toDataURL("image/png");if(window.xhs&&window.xhs.miniTool){window.xhs.miniTool.saveImageToPhotosAlbum({filePath:imageData})}else{alert(zh?"请在小红书小工具内保存图片。":"Please save this image in the Mini Tool.")}});

})();
