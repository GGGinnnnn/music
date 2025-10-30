/**
 * Parse an LRC formatted string into a sorted lyrics array.
 * @param {string} content
 * @returns {{time:number, text:string}[]}
 */
export function parseLRC(content) {
  const entries = [];
  const lines = content.split(/\r?\n/);
  const timeRegexGlobal = /\[(\d+):(\d+)([:.](\d+))?\]/g;

  for (const raw of lines) {
    if (!raw.trim()) continue;

    const matches = [...raw.matchAll(timeRegexGlobal)];
    const text = raw.replace(timeRegexGlobal, "").trim();
    if (matches.length === 0 || !text) continue;

    for (const match of matches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const fraction = match[4] ? match[4] : "0";

      let ms = 0;
      if (fraction.length === 1) ms = parseInt(fraction, 10) * 100;
      else if (fraction.length === 2) ms = parseInt(fraction, 10) * 10;
      else ms = parseInt(fraction.slice(0, 3), 10);

      const time = minutes * 60 + seconds + ms / 1000;
      entries.push({ time, text });
    }
  }

  entries.sort((a, b) => a.time - b.time);
  return entries;
}

export function renderLyrics(container, lyrics) {
  container.innerHTML = "";

  if (!lyrics.length) {
    showLyricsMessage(container, "歌词为空或未解析到时间戳");
    return;
  }

  const fragment = document.createDocumentFragment();
  lyrics.forEach((entry, index) => {
    const el = document.createElement("div");
    el.className = "lyric-line";
    el.id = `ly_${index}`;
    el.textContent = entry.text;
    fragment.appendChild(el);
  });

  container.appendChild(fragment);
}

export function showLyricsMessage(container, message) {
  container.innerHTML = "";
  const el = document.createElement("div");
  el.className = "lyric-line";
  el.textContent = message;
  container.appendChild(el);
}

export function updateActiveLyric(container, previousIndex, nextIndex) {
  if (previousIndex >= 0) {
    container.querySelector(`#ly_${previousIndex}`)?.classList.remove("active");
  }
  if (nextIndex >= 0) {
    const el = container.querySelector(`#ly_${nextIndex}`);
    if (el) {
      el.classList.add("active");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

export function findLyricIndex(lyrics, currentTime) {
  let index = -1;
  for (let i = 0; i < lyrics.length; i += 1) {
    if (currentTime >= lyrics[i].time) {
      index = i;
    } else {
      break;
    }
  }
  return index;
}
