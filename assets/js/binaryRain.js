const CHARACTERS = "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789";
const FONT_SIZE = 14;

export function setupBinaryRain(canvas) {
  if (!canvas) {
    return () => {};
  }

  const ctx = canvas.getContext("2d");
  let columns = 0;
  let drops = [];
  let animationFrame = 0;

  function resize() {
    canvas.width = canvas.clientWidth || window.innerWidth;
    canvas.height = canvas.clientHeight || window.innerHeight;
    columns = Math.floor(canvas.width / FONT_SIZE);
    drops = Array.from({ length: columns }, () => Math.floor(Math.random() * canvas.height / FONT_SIZE));
  }

  function draw() {
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--green") || "#00ff41";
    ctx.font = `${FONT_SIZE}px monospace`;

    for (let i = 0; i < drops.length; i += 1) {
      const text = CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
      ctx.fillText(text, i * FONT_SIZE, drops[i] * FONT_SIZE);

      if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i] += 1;
    }

    animationFrame = requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener("resize", resize);

  return () => {
    cancelAnimationFrame(animationFrame);
    window.removeEventListener("resize", resize);
  };
}
