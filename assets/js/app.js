// assets/js/app.js

// 仓库配置信息（请替换为你自己的 GitHub 账号和仓库名）
const GITHUB_USER = 'YOUR_GITHUB_USERNAME'; 
const GITHUB_REPO = 'YOUR_REPO_NAME';
const SONGS_PATH = 'songs';

let playlist = [];
let currentIndex = -1;
let parsedLyrics = [];
const playModes = ['顺序', '单曲循环', '随机'];
let modeIndex = 0;

// 建议将核心逻辑与 DOM 绑定的初始化放在 DOMContentLoaded 之后
document.addEventListener('DOMContentLoaded', () => {
  // 获取 DOM 元素
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
  const lyricsContent = document.getElementById('lyricsContent');
  const terminal = document.getElementById('terminal');

  // 防护检查：确保关键元素都成功读取
  if (!audio || !playPauseBtn || !songsList) {
    console.error('DOM 元素未找全，请检查 HTML 中的 ID 是否拼写正确！');
    return;
  }

  function logTerminal(text) {
    if (!terminal) return;
    const line = document.createElement('div');
    line.textContent = `> ${text}`;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
  }

  function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // 从 GitHub 获取音频文件列表
  async function fetchSongsFromGitHub() {
    songsList.textContent = '正在获取 GitHub 歌曲列表…';
    logTerminal('正在连接 GitHub API 读取歌曲目录...');

    try {
      const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${SONGS_PATH}`;
      const res = await fetch(apiUrl);
      
      if (!res.ok) throw new Error(`GitHub API 响应异常: ${res.status}`);

      const files = await res.json();
      
      // 匹配主流音频格式
      const audioFiles = files.filter(file => 
        /\.(mp3|wav|flac|ogg|oga|m4a|aac|webm|opus|ape|wma|aiff)$/i.test(file.name)
      );

      if (audioFiles.length === 0) {
        songsList.textContent = 'songs 目录下未找到支持的音频文件';
        logTerminal('警告: 未在该路径找到支持的音频文件');
        return;
      }

      playlist = audioFiles.map(file => {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        const parts = nameWithoutExt.split('-');
        let artist = '';
        let title = nameWithoutExt;

        if (parts.length > 1) {
          artist = parts[0].trim();
          title = parts.slice(1).join('-').trim();
        }

        return {
          name: file.name,
          url: file.download_url,
          artist,
          title
        };
      });

      logTerminal(`成功获取 ${playlist.length} 首歌曲`);
      renderPlaylist();

    } catch (err) {
      console.error(err);
      songsList.textContent = '列表读取失败，请检查配置或网络';
      logTerminal(`错误: ${err.message}`);
    }
  }

  function renderPlaylist() {
    songsList.innerHTML = '';
    playlist.forEach((track, index) => {
      const item = document.createElement('div');
      item.className = `song-item ${index === currentIndex ? 'active' : ''}`;
      item.style.padding = '6px 8px';
      item.style.cursor = 'pointer';
      item.textContent = `${index + 1}. ${track.name}`;
      item.onclick = () => loadTrack(index, true);
      songsList.appendChild(item);
    });
  }

  function loadTrack(index, autoPlay = false) {
    if (index < 0 || index >= playlist.length) return;
    
    currentIndex = index;
    const track = playlist[index];
    
    audio.src = track.url;
    if (fileInfo) fileInfo.textContent = track.name;
    logTerminal(`加载歌曲: ${track.name}`);
    renderPlaylist();

    fetchOnlineLyrics(track.artist, track.title);

    if (autoPlay) {
      audio.play().catch(err => logTerminal(`播放阻塞: ${err.message}`));
    }
  }

  async function fetchOnlineLyrics(artist, title) {
    if (!lyricsContent) return;
    lyricsContent.innerHTML = '<div class="lyric-line">在线检索歌词中…</div>';
    parsedLyrics = [];

    const query = encodeURIComponent(`${artist} ${title}`.trim());
    
    try {
      const searchRes = await fetch(`https://api.lrc.tf/v2/search?keyword=${query}`);
      if (!searchRes.ok) throw new Error('网络请求失败');

      const data = await searchRes.json();
      
      if (data && data.lrc) {
        parseLRC(data.lrc);
        logTerminal(`歌词检索成功: [${artist}] ${title}`);
      } else {
        lyricsContent.innerHTML = '<div class="lyric-line">未检索到匹配歌词</div>';
        logTerminal('未找到匹配歌词');
      }
    } catch (err) {
      console.warn('歌词获取失败:', err);
      lyricsContent.innerHTML = '<div class="lyric-line">歌词获取失败</div>';
      logTerminal('歌词检索失败');
    }
  }

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

    parsedLyrics.sort((a, b) => a.time - b.time);
    renderLyricsUI();
  }

  function renderLyricsUI() {
    if (!lyricsContent) return;
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

  // 事件监听绑定
  audio.addEventListener('timeupdate', () => {
    if (isNaN(audio.duration)) return;

    if (progressBar) progressBar.value = (audio.currentTime / audio.duration) * 100 || 0;
    if (timeLabel) timeLabel.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;

    if (parsedLyrics.length > 0 && lyricsContent) {
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

  if (progressBar) {
    progressBar.addEventListener('input', (e) => {
      if (audio.duration) {
        audio.currentTime = (e.target.value / 100) * audio.duration;
      }
    });
  }

  if (volumeBar) {
    volumeBar.addEventListener('input', (e) => {
      audio.volume = e.target.value;
    });
  }

  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      if (playlist.length === 0) return;
      if (currentIndex === -1) {
        loadTrack(0, true);
        return;
      }

      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    });
  }

  audio.addEventListener('play', () => logTerminal('开始播放'));
  audio.addEventListener('pause', () => logTerminal('暂停播放'));
  audio.addEventListener('waiting', () => logTerminal('缓冲中...'));
  audio.addEventListener('canplay', () => logTerminal('缓冲完成，可以播放'));

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
      const nextIdx = (currentIndex + 1) % playlist.length;
      loadTrack(nextIdx, true);
    }
  }

  function playPrev() {
    if (playlist.length === 0) return;
    const prevIdx = (currentIndex - 1 + playlist.length) % playlist.length;
    loadTrack(prevIdx, true);
  }

  if (prevBtn) prevBtn.addEventListener('click', playPrev);
  if (nextBtn) nextBtn.addEventListener('click', playNext);
  audio.addEventListener('ended', playNext);

  if (modeBtn) {
    modeBtn.addEventListener('click', () => {
      modeIndex = (modeIndex + 1) % playModes.length;
      modeBtn.textContent = playModes[modeIndex];
      logTerminal(`播放模式: ${playModes[modeIndex]}`);
    });
  }

  // 初始化执行
  fetchSongsFromGitHub();
});