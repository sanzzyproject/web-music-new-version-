const audio = document.getElementById('audioPlayer');
const searchInput = document.getElementById('searchInput');
const homeView = document.getElementById('homeView');
const resultsView = document.getElementById('resultsView');
const homeGrid = document.getElementById('homeGrid');
const trackList = document.getElementById('trackList');
const searchLoader = document.getElementById('searchLoader');
const progressFill = document.getElementById('progressFill');
const playIcon = document.getElementById('playIcon');

// 1. Initial Load (Supaya Home tidak kosong)
window.addEventListener('DOMContentLoaded', () => {
    // Cari lagu default untuk mengisi beranda
    fetchAndRenderHome('Top Hits Indonesia');
});

function switchTab(tabName) {
    // UI Updates untuk Nav
    document.querySelectorAll('.nav-item, .b-nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.tab === tabName);
    });

    if(tabName === 'home') {
        homeView.classList.remove('hidden');
        resultsView.classList.add('hidden');
    } else if(tabName === 'search') {
        homeView.classList.add('hidden');
        resultsView.classList.remove('hidden');
        searchInput.focus();
    }
}

// 2. Search Logic
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch(e.target.value);
    }
});

async function performSearch(query) {
    if(!query) return;
    switchTab('search');
    trackList.innerHTML = '';
    searchLoader.classList.remove('hidden');

    try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        searchLoader.classList.add('hidden');

        if(data.status === 'success' && data.results.length > 0) {
            data.results.forEach(track => {
                const div = document.createElement('div');
                div.className = 'track-row';
                div.innerHTML = `
                    <img src="${track.thumbnail}" class="track-img">
                    <div class="track-info">
                        <h4>${track.title}</h4>
                        <p>${track.artist}</p>
                    </div>
                `;
                div.onclick = () => playMusic(track);
                trackList.appendChild(div);
            });
        } else {
            trackList.innerHTML = '<p style="text-align:center; padding:20px; color:#b3b3b3;">Tidak ada hasil ditemukan.</p>';
        }
    } catch (err) {
        searchLoader.classList.add('hidden');
        trackList.innerHTML = `<p style="text-align:center; color:red;">Gagal: ${err.message}</p>`;
    }
}

// 3. Render Home Grid
async function fetchAndRenderHome(query) {
    try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        homeGrid.innerHTML = ''; // Clear loader
        
        if(data.status === 'success') {
            data.results.slice(0, 10).forEach(track => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <img src="${track.thumbnail}">
                    <h4>${track.title}</h4>
                    <p>${track.artist}</p>
                `;
                card.onclick = () => playMusic(track);
                homeGrid.appendChild(card);
            });
        }
    } catch (e) {
        console.log("Gagal load home", e);
    }
}

// 4. Play Music Logic
async function playMusic(track) {
    // Update UI Player
    document.getElementById('playerTitle').innerText = track.title;
    document.getElementById('playerArtist').innerText = track.artist;
    document.getElementById('playerImg').src = track.thumbnail;
    playIcon.className = "fas fa-spinner fa-spin"; // Loading state

    try {
        // Panggil API Play
        const res = await fetch(`/api/play?url=${encodeURIComponent(track.url)}`);
        const data = await res.json();

        if(data.status === 'success' && data.result.download) {
            audio.src = data.result.download;
            audio.play();
            playIcon.className = "fas fa-pause";
        } else {
            alert("Maaf, sumber audio tidak ditemukan untuk lagu ini.");
            playIcon.className = "fas fa-play";
        }
    } catch (error) {
        console.error(error);
        alert("Gagal memutar lagu.");
        playIcon.className = "fas fa-play";
    }
}

// 5. Audio Control
function togglePlay() {
    if(audio.paused && audio.src) {
        audio.play();
        playIcon.className = "fas fa-pause";
    } else {
        audio.pause();
        playIcon.className = "fas fa-play";
    }
}

audio.addEventListener('timeupdate', () => {
    const pct = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = pct + "%";
});

audio.addEventListener('ended', () => {
    playIcon.className = "fas fa-play";
    progressFill.style.width = "0%";
});
