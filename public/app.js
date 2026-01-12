const audio = document.getElementById('audioPlayer');
const searchInput = document.getElementById('searchInput');
const trackList = document.getElementById('trackList');
const playIcon = document.getElementById('playIcon');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');

// UI View Elements
const homeView = document.getElementById('homeView');
const resultsView = document.getElementById('resultsView');
const loader = document.getElementById('loader');

// Event Listener Search
searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const query = e.target.value;
        if(query) searchMusic(query);
    }
});

function showHome() {
    homeView.classList.remove('hidden');
    resultsView.classList.add('hidden');
}

function focusSearch() {
    searchInput.focus();
}

function triggerSearch(query) {
    searchInput.value = query;
    searchMusic(query);
}

// Search Logic
async function searchMusic(query) {
    homeView.classList.add('hidden');
    resultsView.classList.remove('hidden');
    loader.classList.remove('hidden');
    trackList.innerHTML = '';
    
    try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();

        loader.classList.add('hidden');

        if(data.status === 'success' && data.results.length > 0) {
            data.results.forEach(track => {
                const div = document.createElement('div');
                div.className = 'track-row';
                div.innerHTML = `
                    <img src="${track.thumbnail || 'https://via.placeholder.com/40'}" class="track-img">
                    <div class="track-info">
                        <div class="track-title">${track.title}</div>
                        <div class="track-artist">${track.artist}</div>
                    </div>
                    <i class="fas fa-play-circle track-play"></i>
                `;
                // Kirim URL khusus yang didapat dari search API
                div.onclick = () => playMusic(track.url, track);
                trackList.appendChild(div);
            });
        } else {
            trackList.innerHTML = '<p style="text-align:center; color: #b3b3b3; margin-top:20px;">Lagu tidak ditemukan.</p>';
        }

    } catch (error) {
        loader.classList.add('hidden');
        console.error(error);
        trackList.innerHTML = '<p style="text-align:center; color: red;">Terjadi kesalahan saat mencari.</p>';
    }
}

// Play Logic
async function playMusic(url, metaData) {
    // Update UI Player sementara
    document.getElementById('playerTitle').innerText = metaData.title;
    document.getElementById('playerArtist').innerText = metaData.artist;
    document.getElementById('playerImg').src = metaData.thumbnail || 'https://via.placeholder.com/50';
    
    // Tampilkan loading di button play
    playIcon.className = "fas fa-spinner fa-spin";

    try {
        const res = await fetch(`/api/play?url=${encodeURIComponent(url)}`);
        const data = await res.json();

        if(data.status === 'success' && data.result.download) {
            audio.src = data.result.download;
            audio.play();
            playIcon.className = "fas fa-pause";
        } else {
            alert("Gagal memutar lagu (Link tidak valid).");
            playIcon.className = "fas fa-play";
        }

    } catch (error) {
        console.error(error);
        alert("Gagal mengambil stream audio.");
        playIcon.className = "fas fa-play";
    }
}

// Audio Controls
function togglePlay() {
    if (audio.paused) {
        audio.play();
        playIcon.className = "fas fa-pause";
    } else {
        audio.pause();
        playIcon.className = "fas fa-play";
    }
}

audio.addEventListener('timeupdate', () => {
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.value = isNaN(progress) ? 0 : progress;
    
    // Format Time
    const currentMins = Math.floor(audio.currentTime / 60);
    const currentSecs = Math.floor(audio.currentTime % 60);
    currentTimeEl.innerText = `${currentMins}:${currentSecs < 10 ? '0' : ''}${currentSecs}`;
    
    if(!isNaN(audio.duration)){
        const durMins = Math.floor(audio.duration / 60);
        const durSecs = Math.floor(audio.duration % 60);
        durationEl.innerText = `${durMins}:${durSecs < 10 ? '0' : ''}${durSecs}`;
    }
});

progressBar.addEventListener('input', () => {
    const time = (progressBar.value / 100) * audio.duration;
    audio.currentTime = time;
});

audio.addEventListener('ended', () => {
    playIcon.className = "fas fa-play";
    progressBar.value = 0;
});
