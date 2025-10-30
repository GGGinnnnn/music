import { BRANCH, GITHUB_USER, LYRICS_PATH, REPO_NAME, SONGS_PATH } from "./config.js";

const SONGS_API = `https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${SONGS_PATH}?ref=${BRANCH}`;

export async function fetchSongIndex() {
  const response = await fetch(SONGS_API);
  if (!response.ok) {
    throw new Error(`无法访问 ${SONGS_PATH} 目录: ${response.status}`);
  }

  const data = await response.json();
  return data
    .filter((file) => file.name.match(/\.(mp3|wav|m4a|ogg)$/i))
    .map((file) => ({ name: file.name, downloadUrl: file.download_url }))
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

export function buildLyricUrl(songFileName) {
  const lyricName = songFileName.replace(/\.[^/.]+$/, ".lrc");
  return `https://raw.githubusercontent.com/${GITHUB_USER}/${REPO_NAME}/${BRANCH}/${LYRICS_PATH}/${lyricName}`;
}
