const copy = {
  zh: {
    eyebrow: "YOUR FOCUS, ON STAGE",
    title: "让专注，成为一场<br />值得谢幕的演出。",
    intro: "选择一场演出，走进剧院。<br />时间落幕时，收下一张属于你的票根。",
    stageCaption: "今晚的演出，即将开场",
    start: "进入剧院",
    hint: "早点进场，选一个舒适的位置。",
  },
  en: {
    eyebrow: "YOUR FOCUS, ON STAGE",
    title: "Make focus a performance<br />worth an encore.",
    intro: "Choose a performance and take your seat.<br />When the curtain falls, keep the ticket as your own.",
    stageCaption: "Tonight's performance is about to begin",
    start: "Enter the theatre",
    hint: "Arrive early. Find a seat that feels right.",
  },
};

const toggle = document.querySelector(".language-button");
let language = localStorage.getItem("encore-language") || "zh";

function applyLanguage() {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.innerHTML = copy[language][element.dataset.i18n];
  });
  document.querySelectorAll(".language-option").forEach((option) => {
    option.classList.toggle("language-option--active", option.dataset.language === language);
  });
}

toggle.addEventListener("click", () => {
  language = language === "zh" ? "en" : "zh";
  localStorage.setItem("encore-language", language);
  applyLanguage();
});

applyLanguage();