import { setupBinaryRain } from "./binaryRain.js";
import { createLogger } from "./typing.js";
import { fetchSongIndex, buildLyricUrl } from "./songsService.js";
import { findLyricIndex, parseLRC, renderLyrics, showLyricsMessage, updateActiveLyric } from "./lyrics.js";

const elements = {
  songsList: document.getElementById("songs-list"),
  terminal: document.getElementById("terminal"),
  audio: document.getElementById("audio"),
  playPause: document.getElementById("playPause"),
  stop: document.getElementById("stopBtn"),
  fileInfo: document.getElementById("fileInfo"),
  timeLabel: document.getElementById("timeLabel"),
  lyricsContent: document.getElementById("lyricsContent"),
  binaryCanvas: document.getElementById("binaryCanvas"),
};

const logger = createLogger(elements.terminal);
setupBinaryRain(elements.binaryCanvas);

const state = {
  songs: [],
  lyrics: [],
  currentLyricIndex: -1,
};

init();

function init() {
  scheduleInitialMessages();
  attachControls();
  bootstrapSongs();
  setupLyricSync();
}

function scheduleInitialMessages() {
  setTimeout(() => logger("系统初始化...", { speed: 18 }), 300);
}

function attachControls() {
  elements.playPause.addEventListener("click", async () => {
    if (elements.audio.paused) {
      try {
        await elements.audio.play();
        logger("播放");
      } catch (error) {
        logger(`播放失败: ${error.message}`);
      }
    } else {
      elements.audio.pause();
      logger("暂停");
    }
  });

  elements.stop.addEventListener("click", () => {
    elements.audio.pause();
    elements.audio.currentTime = 0;
    updateTimeLabel();
    logger("停止");
  });
}

function setupLyricSync() {
  elements.audio.addEventListener("timeupdate", () => {
    const index = findLyricIndex(state.lyrics, elements.audio.currentTime);
    if (index !== state.currentLyricIndex) {
      updateActiveLyric(elements.lyricsContent, state.currentLyricIndex, index);
      state.currentLyricIndex = index;
    }
    updateTimeLabel();
  });
}

function updateTimeLabel() {
  const format = (value) => {
    if (!Number.isFinite(value)) return "00:00";
    const minutes = Math.floor(value / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(value % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  elements.timeLabel.textContent = `${format(elements.audio.currentTime)} / ${format(elements.audio.duration)}`;
}

async function bootstrapSongs() {
  elements.songsList.textContent = "读取中…";

  try {
    state.songs = await fetchSongIndex();
    renderSongButtons();
    logger(`发现 ${state.songs.length} 首歌曲。`, { speed: 20 });
  } catch (error) {
    elements.songsList.innerHTML = `<div style="color:rgba(255,0,0,0.6)">加载失败: ${error.message}</div>`;
    logger(`错误: ${error.message}`, { speed: 20 });
  }
}

function renderSongButtons() {
  elements.songsList.innerHTML = "";
  const fragment = document.createDocumentFragment();

  state.songs.forEach((song) => {
    const button = document.createElement("button");
    button.className = "song-btn";
    button.innerHTML = `<span class="title">${song.name.replace(/\.[^/.]+$/, "")}</span><span class="meta">播放</span>`;
    button.addEventListener("click", () => loadAndPlaySong(song));
    fragment.appendChild(button);
  });

  elements.songsList.appendChild(fragment);
}

async function loadAndPlaySong(song) {
  state.lyrics = [];
  state.currentLyricIndex = -1;
  showLyricsMessage(elements.lyricsContent, "正在加载歌词…");

  logger(`加载歌曲: ${song.name}`, { speed: 18 });
  elements.audio.src = song.downloadUrl;
  elements.audio.crossOrigin = "anonymous";
  elements.fileInfo.textContent = `当前: ${song.name}`;

  try {
    await elements.audio.play();
    logger(`播放: ${song.name}`, { speed: 18 });
  } catch (error) {
    logger(`播放失败: ${error.message}`, { speed: 18 });
  }

  await loadLyricsForSong(song);
}

async function loadLyricsForSong(song) {
  const lyricUrl = buildLyricUrl(song.name);
  try {
    const response = await fetch(lyricUrl);
    if (!response.ok) {
      throw new Error("未找到歌词");
    }
    const text = await response.text();
    state.lyrics = parseLRC(text);
    renderLyrics(elements.lyricsContent, state.lyrics);
    logger(`歌词加载成功: ${song.name.replace(/\.[^/.]+$/, ".lrc")}`, { speed: 18 });
  } catch (error) {
    showLyricsMessage(elements.lyricsContent, `未找到歌词: ${song.name.replace(/\.[^/.]+$/, ".lrc")}`);
    logger(`歌词加载失败: ${error.message}`, { speed: 18 });
  }
}
