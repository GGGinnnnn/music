/**
 * Append a typewriter-style log line to the provided container.
 * @param {HTMLElement} container
 * @param {Object} options
 * @param {string} options.text
 * @param {string} [options.className]
 * @param {number} [options.speed]
 * @param {Function} [options.onComplete]
 */
export function typeLine(container, { text = "", className = "", speed = 30, onComplete = null } = {}) {
  const line = document.createElement("div");
  line.className = `line ${className}`.trim();
  line.innerHTML = '<span class="prompt">&gt; </span><span class="text"></span><span class="cursor"></span>';
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;

  const textSpan = line.querySelector(".text");
  const cursor = line.querySelector(".cursor");
  let index = 0;

  const timer = setInterval(() => {
    if (index < text.length) {
      textSpan.textContent += text.charAt(index);
      index += 1;
      container.scrollTop = container.scrollHeight;
    } else {
      clearInterval(timer);
      cursor?.remove();
      if (typeof onComplete === "function") {
        onComplete();
      }
    }
  }, speed);
}

/**
 * Utility to create a logger bound to a container element.
 * @param {HTMLElement} container
 */
export function createLogger(container) {
  return (text, options = {}) => typeLine(container, { text, ...options });
}
