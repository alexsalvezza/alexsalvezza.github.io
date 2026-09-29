const sections = [
  { key: "ita", container: "songs-ita" },
  { key: "eng", container: "songs-eng" },
  { key: "fra", container: "songs-fra" }
];

const downloadLabels = {
  ita: "↓ SCARICA MP3",
  eng: "↓ DOWNLOAD MP3",
  fra: "↓ TÉLÉCHARGER MP3"
};

// Worker Cloudflare usato esclusivamente per i download MP3.
const DOWNLOAD_WORKER_BASE = "https://crimson-snowflake-6322.inform-ale.workers.dev";

function renderSongs(list, containerId) {
  const container = document.getElementById(containerId);
  const sectionKey = sections.find(s => s.container === containerId).key;
  container.innerHTML = "";

  list.forEach((song, index) => {
    const article = document.createElement("article");
    article.className = "song";
    article.dataset.title = song.title.toLowerCase();

    const num = String(index + 1).padStart(2, "0");

    article.innerHTML = `
      <div class="song-number">${num}</div>
      <div>
        <h2 class="song-title">${song.title}</h2>
        <audio controls preload="none">
          <source src="${song.file}" type="audio/mpeg">
          Il tuo browser non supporta la riproduzione audio.
        </audio>
        <div class="song-actions">
          <a href="${DOWNLOAD_WORKER_BASE}/${encodeURIComponent(song.file.split("/").pop())}" class="song-download" data-url="${DOWNLOAD_WORKER_BASE}/${encodeURIComponent(song.file.split("/").pop())}">${downloadLabels[sectionKey]}</a>
        </div>
      </div>
    `;
    container.appendChild(article);
  });
}

function applySearch() {
  const search = document.getElementById("songSearch");
  const q = search.value.trim().toLowerCase();

  document.querySelectorAll(".songs").forEach(container => {
    container.innerHTML = "";

    const section = sections.find(s => s.container === container.id);
    const filtered = songs[section.key].filter(song =>
      !q || song.title.toLowerCase().includes(q)
    );

    filtered.forEach((song) => {
      const originalIndex = songs[section.key].indexOf(song);
      const article = document.createElement("article");
      article.className = "song";
      article.dataset.title = song.title.toLowerCase();
      article.innerHTML = `
        <div class="song-number">${String(originalIndex + 1).padStart(2, "0")}</div>
        <div>
          <h2 class="song-title">${song.title}</h2>
          <audio controls preload="none">
            <source src="${song.file}" type="audio/mpeg">
            Il tuo browser non supporta la riproduzione audio.
          </audio>
          <div class="song-actions">
            <a href="${DOWNLOAD_WORKER_BASE}/${encodeURIComponent(song.file.split("/").pop())}" class="song-download" data-url="${DOWNLOAD_WORKER_BASE}/${encodeURIComponent(song.file.split("/").pop())}">${downloadLabels[section.key]}</a>
          </div>
        </div>`;
      container.appendChild(article);
    });

    if (!filtered.length && q) {
      const no = document.createElement("p");
      no.className = "no-results";
      no.textContent = "Nessun brano trovato in questa sezione.";
      container.appendChild(no);
    }
  });
}

async function downloadMp3(url, link) {
  const originalText = link.textContent;
  link.textContent = "DOWNLOAD…";
  link.setAttribute("aria-busy", "true");

  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const temp = document.createElement("a");
    temp.href = objectUrl;
    temp.download = decodeURIComponent(new URL(url).pathname.split("/").pop());
    document.body.appendChild(temp);
    temp.click();
    temp.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (error) {
    console.error("Download MP3 non riuscito:", error);
    // Fallback: apre il file R2 direttamente.
    window.open(url, "_blank", "noopener,noreferrer");
  } finally {
    link.textContent = originalText;
    link.removeAttribute("aria-busy");
  }
}

document.addEventListener("click", event => {
  const link = event.target.closest(".song-download");
  if (!link) return;

  event.preventDefault();
  downloadMp3(link.dataset.url, link);
});

document.getElementById("songSearchButton").addEventListener("click", applySearch);

document.getElementById("songSearchClear").addEventListener("click", () => {
  const search = document.getElementById("songSearch");
  search.value = "";
  applySearch();
  search.focus();
});

document.getElementById("songSearch").addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    applySearch();
  }
});

document.getElementById("songSearch").addEventListener("input", applySearch);

sections.forEach(section => renderSongs(songs[section.key], section.container));
