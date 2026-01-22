const tank = document.getElementById("tank");
const input = document.getElementById("bubbleInput");
const addBtn = document.getElementById("addBubble");

let bubbles = JSON.parse(localStorage.getItem("bubbles")) || [];

/* ===== 弾ける音 ===== */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playPopSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "triangle";
  osc.frequency.value = 700;
  gain.gain.value = 0.035;

  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
  osc.stop(audioCtx.currentTime + 0.18);
}

/* ===== 初期表示 ===== */
bubbles.forEach(createBubble);

/* ===== 追加 ===== */
addBtn.addEventListener("click", addBubble);
input.addEventListener("keypress", e => {
  if (e.key === "Enter") addBubble();
});

function addBubble() {
  if (!input.value.trim()) return;

  const size = calcSize(input.value);

  const data = {
    id: Date.now(),
    text: input.value,
    size,
    x: Math.random() * (window.innerWidth - size),
    y: Math.random() * (window.innerHeight - size - 120)
  };

  bubbles.push(data);
  save();
  createBubble(data);
  input.value = "";
}

/* ===== サイズ調整 ===== */
function calcSize(text) {
  const base = window.innerWidth < 600 ? 80 : 90;
  const extra = Math.min(text.length * 2.5, 70);
  return base + extra;
}

/* ===== シャボン玉生成 ===== */
function createBubble(data) {
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.style.width = bubble.style.height = `${data.size}px`;
  bubble.style.left = `${data.x}px`;
  bubble.style.top = `${data.y}px`;
  bubble.dataset.id = data.id;

  bubble.innerHTML = `<span>${data.text}</span>`;
  tank.appendChild(bubble);

  const popBubble = () => {
    if (bubble.classList.contains("pop")) return;

    bubble.classList.add("pop");
    playPopSound();
    createFizz(bubble);

    setTimeout(() => {
      bubble.remove();
      bubbles = bubbles.filter(b => b.id !== data.id);
      save();
    }, 450);
  };

  /* PC：ダブルクリック */
  bubble.addEventListener("dblclick", popBubble);

  /* SP：長押し */
  let pressTimer;
  bubble.addEventListener("touchstart", () => {
    pressTimer = setTimeout(popBubble, 500);
  });
  bubble.addEventListener("touchend", () => {
    clearTimeout(pressTimer);
  });
}

/* ===== シュワシュワ粒子 ===== */
function createFizz(bubble) {
  const rect = bubble.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  for (let i = 0; i < 22; i++) {
    const p = document.createElement("div");
    p.className = "splash";
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;

    const angle = Math.random() * Math.PI * 2;
    const dist = 15 + Math.random() * 55;

    p.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    p.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);

    tank.appendChild(p);
    setTimeout(() => p.remove(), 800);
  }
}

/* ===== 保存 ===== */
function save() {
  localStorage.setItem("bubbles", JSON.stringify(bubbles));
}

/* ===== 入力時の画面ズレ防止（iOS） ===== */
input.addEventListener("focus", () => {
  document.body.style.position = "fixed";
  document.body.style.width = "100%";
});

input.addEventListener("blur", () => {
  document.body.style.position = "";
  document.body.style.width = "";
});

/* =====================================================
   📱 スマホを振ったらバブルが散らばる
===================================================== */

/* iOS：センサー許可 */
if (
  typeof DeviceMotionEvent !== "undefined" &&
  typeof DeviceMotionEvent.requestPermission === "function"
) {
  document.body.addEventListener(
    "click",
    () => {
      DeviceMotionEvent.requestPermission();
    },
    { once: true }
  );
}

/* シェイク検知 */
let lastShakeTime = 0;

window.addEventListener("devicemotion", (e) => {
  const acc = e.accelerationIncludingGravity;
  if (!acc) return;

  const power =
    Math.abs(acc.x || 0) +
    Math.abs(acc.y || 0) +
    Math.abs(acc.z || 0);

  const now = Date.now();

  // しっかり振ったときだけ反応
  if (power > 25 && now - lastShakeTime > 1200) {
    lastShakeTime = now;
    scatterBubbles();
  }
});

/* バブルを散らす */
function scatterBubbles() {
  const all = document.querySelectorAll(".bubble");

  all.forEach(bubble => {
    const dx = (Math.random() - 0.5) * 160;
    const dy = (Math.random() - 0.5) * 160;

    bubble.animate(
      [
        { transform: "translate(0,0)" },
        { transform: `translate(${dx}px, ${dy}px)` }
      ],
      {
        duration: 700,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        fill: "forwards"
      }
    );
  });
}
