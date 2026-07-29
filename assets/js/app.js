// assets/js/app.js

const audio = document.getElementById('audio');
const playPauseBtn = document.getElementById('playPause');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const modeBtn = document.getElementById('modeBtn');
const progressBar = document.getElementById('progressBar');
const volumeBar = document.getElementById('volumeBar');
const timeLabel = document.getElementById('timeLabel');
const fileInfo = document.getElementById('fileInfo');
const songsList = document.getElementById('songs-list');
const fileInput = document.getElementById('fileInput');
const lyricsContent = document.getElementById('lyricsContent');
const terminal = document.getElementById('terminal');

// 播放状态管理
let playlist = []; // { name: string, url: string, artist?: string, title?: string }
let currentIndex = -1;
let parsedLyrics = []; // [{ time: number, text: string }]
let playModes = ['顺序', '单曲循环', '随机'];
let modeIndex = 0;

// 日志输出辅助函数
function logTerminal(text) {
  const line = document.createElement('div');
  line.textContent = `> ${text}`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

function scheduleInitialMessages() {
  setTimeout(() => logger("系统初始化...", { speed: 18 }), 300);
}

// 1. 文件上传监听
fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  files.forEach(file => {
    // 简单解析文件名提取 歌手 - 歌名
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    const parts = nameWithoutExt.split('-');
    let artist = '';
    let title = nameWithoutExt;

    if (parts.length > 1) {
      artist = parts[0].trim();
      title = parts.slice(1).join('-').trim();
    }

    playlist.push({
      name: file.name,
      url: URL.createObjectURL(file), // 创建本地播放内存链接，无需网络载入
      artist,
      title
    });
  });

  logTerminal(`已导入 ${files.length} 首本地歌曲`);
  renderPlaylist();
  
  if (currentIndex === -1 && playlist.length > 0) {
    loadTrack(0);
  }
});

// 2. 渲染歌曲列表
function renderPlaylist() {
  songsList.innerHTML = '';
  if (playlist.length === 0) {
    songsList.textContent = '暂无歌曲，请导入本地音频';
    return;
  }

  playlist.forEach((track, index) => {
    const item = document.createElement('div');
    item.className = `song-item ${index === currentIndex ? 'active' : ''}`;
    item.style.padding = '4px 8px';
    item.style.cursor = 'pointer';
    item.textContent = `${index + 1}. ${track.name}`;
    item.onclick = () => loadTrack(index, true);
    songsList.appendChild(item);
  });
}

// 3. 加载并播放指定索引的歌曲
function loadTrack(index, autoPlay = false) {
  if (index < 0 || index >= playlist.length) return;
  
  currentIndex = index;
  const track = playlist[index];
  
  audio.src = track.url;
  fileInfo.textContent = track.name;
  logTerminal(`加载歌曲: ${track.name}`);
  renderPlaylist();

  // 重置歌词
  fetchOnlineLyrics(track.artist, track.title);

  if (autoPlay) {
    audio.play().catch(err => logTerminal(`播放失败: ${err.message}`));
  }
}

// 4. 在线歌词检索 (使用 Netease 开源接口示例)
// 修改 app.js 中的 fetchOnlineLyrics 函数
  async function fetchOnlineLyrics(artist, title) {
    lyricsContent.innerHTML = '<div class="lyric-line">在线检索歌词中…</div>';
    parsedLyrics = [];

    const query = encodeURIComponent(`${artist} ${title}`.trim());
    
    try {
      // 使用支持 CORS 的代理 API（或开源歌词代理 API）
      const searchRes = await fetch(`https://api.lrc.tf/v2/search?keyword=${query}`);
      
      if (!searchRes.ok) {
        throw new Error(`网络响应错误: ${searchRes.status}`);
      }

      const data = await searchRes.json();
      
      // 如果找到了歌词
      if (data && data.lrc) {
        parseLRC(data.lrc);
        logTerminal(`歌词检索成功: ${artist} - ${title}`);
      } else {
        lyricsContent.innerHTML = '<div class="lyric-line">未检索到匹配歌词</div>';
        logTerminal('未检索到匹配歌词');
      }
    } catch (err) {
      // 捕获跨域或网络报错，保证音频依然能正常播放
      console.warn('歌词检索遭遇跨域或请求失败:', err);
      logTerminal(`歌词获取失败 (建议手动加载)`);
      lyricsContent.innerHTML = '<div class="lyric-line">歌词获取失败</div>';
    }
  }

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

// 5. LRC 歌词解析
function parseLRC(lrcText) {
  parsedLyrics = [];
  const lines = lrcText.split('\n');
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  lines.forEach(line => {
    const match = timeRegex.exec(line);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
      const time = minutes * 60 + seconds + milliseconds / 1000;
      const text = line.replace(timeRegex, '').trim();
      
      if (text) {
        parsedLyrics.push({ time, text });
      }
    }
  });

  // 按时间排序
  parsedLyrics.sort((a, b) => a.time - b.time);
  renderLyricsUI();
}

function renderLyricsUI() {
  lyricsContent.innerHTML = '';
  if (parsedLyrics.length === 0) {
    lyricsContent.innerHTML = '<div class="lyric-line">无纯文本歌词</div>';
    return;
  }

  parsedLyrics.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'lyric-line';
    div.id = `lyric-line-${i}`;
    div.textContent = item.text;
    lyricsContent.appendChild(div);
  });
}

// 6. 播放进度与歌词高亮同步
audio.addEventListener('timeupdate', () => {
  if (isNaN(audio.duration)) return;

  // 更新进度条与时间
  const progress = (audio.currentTime / audio.duration) * 100;
  progressBar.value = progress || 0;
  timeLabel.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;

  // 同步高亮歌词
  if (parsedLyrics.length > 0) {
    let activeIndex = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (audio.currentTime >= parsedLyrics[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }

    if (activeIndex !== -1) {
      const lines = lyricsContent.querySelectorAll('.lyric-line');
      lines.forEach((el, i) => {
        if (i === activeIndex) {
          if (!el.classList.contains('active')) {
            el.classList.add('active');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } else {
          el.classList.remove('active');
        }
      });
    }
  }
});

// 7. 拖拽进度条
progressBar.addEventListener('input', (e) => {
  if (audio.duration) {
    audio.currentTime = (e.target.value / 100) * audio.duration;
  }
});

// 8. 音量控制
volumeBar.addEventListener('input', (e) => {
  audio.volume = e.target.value;
});

// 9. 播放/暂停控制
playPauseBtn.addEventListener('click', () => {
  if (playlist.length === 0) return;

  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
});

audio.addEventListener('play', () => {
  playPauseBtn.textContent = '暂停';
  logTerminal('开始播放');
});

audio.addEventListener('pause', () => {
  playPauseBtn.textContent = '播放';
  logTerminal('暂停播放');
});

// 10. 切歌与播放结束逻辑 (支持播放模式)
function playNext() {
  if (playlist.length === 0) return;
  const currentMode = playModes[modeIndex];

  if (currentMode === '单曲循环') {
    audio.currentTime = 0;
    audio.play();
  } else if (currentMode === '随机') {
    const nextIdx = Math.floor(Math.random() * playlist.length);
    loadTrack(nextIdx, true);
  } else {
    // 顺序播放
    const nextIdx = (currentIndex + 1) % playlist.length;
    loadTrack(nextIdx, true);
  }
}

function playPrev() {
  if (playlist.length === 0) return;
  const prevIdx = (currentIndex - 1 + playlist.length) % playlist.length;
  loadTrack(prevIdx, true);
}

prevBtn.addEventListener('click', playPrev);
nextBtn.addEventListener('click', playNext);
audio.addEventListener('ended', playNext);

// 切换播放模式
modeBtn.addEventListener('click', () => {
  modeIndex = (modeIndex + 1) % playModes.length;
  modeBtn.textContent = playModes[modeIndex];
  logTerminal(`播放模式切换为: ${playModes[modeIndex]}`);
});