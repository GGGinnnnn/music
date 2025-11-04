const SONGS_MANIFEST = "./songs.json";

export async function fetchSongIndex() {
  const response = await fetch(SONGS_MANIFEST);
  if (!response.ok) {
    throw new Error(`无法访问 : ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("歌曲清单格式无效");
  }

  return data
    .map((entry) => {
      if (typeof entry === "string") {
        return { name: entry, downloadUrl: `./songs/${entry}` };
      }

      const name = entry?.name ?? "";
      const downloadUrl = entry?.downloadUrl ?? entry?.path ?? (name ? `./songs/${name}` : "");

      return { name, downloadUrl };
    })
    .filter(
      (file) =>
        file.name &&
        file.downloadUrl &&
        file.name.match(/\.(mp3|wav|m4a|ogg)$/i)
    )
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

export function buildLyricUrl(songFileName) {
  const lyricName = songFileName.replace(/\.[^/.]+$/, ".lrc");
  return `./lyrics/${lyricName}`;
}
