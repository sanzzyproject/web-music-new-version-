const axios = require('axios');

export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) return res.status(400).json({ status: 'error', msg: 'URL required' });

    try {
        // 1. Ambil Token lagi (diperlukan untuk setiap session download)
        const mainPage = await axios.get('https://spotify.downloaderize.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const nonceMatch = mainPage.data.match(/"nonce":"([a-zA-Z0-9]+)"/);
        const nonce = nonceMatch ? nonceMatch[1] : null;

        if (!nonce) throw new Error("Token download tidak ditemukan.");

        // 2. Request Link Download
        const dlRes = await axios.post('https://spotify.downloaderize.com/wp-admin/admin-ajax.php', 
            new URLSearchParams({
                action: 'spotify_downloader_get_info',
                url: url,
                nonce: nonce
            }).toString(), 
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'x-requested-with': 'XMLHttpRequest',
                    'origin': 'https://spotify.downloaderize.com',
                    'referer': 'https://spotify.downloaderize.com/'
                }
            }
        );

        const d = dlRes.data?.data;
        
        // Cek validitas data
        if(!d || !d.medias || d.medias.length === 0) {
            throw new Error("Link audio tidak ditemukan atau diproteksi.");
        }

        const result = {
            title: d.title,
            artist: d.author,
            thumbnail: d.thumbnail,
            download: d.medias[0].url // Mengambil URL MP3
        };

        return res.status(200).json({ status: 'success', result });

    } catch (e) {
        console.error("Play Error Log:", e.message);
        return res.status(500).json({ status: 'error', msg: e.message });
    }
}
