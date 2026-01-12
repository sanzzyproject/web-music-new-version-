const axios = require('axios');

export default async function handler(req, res) {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ status: 'error', msg: 'Query kosong' });
    }

    try {
        // 1. Ambil Token/Nonce halaman utama
        const html = await axios.get('https://spotify.downloaderize.com', {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        // Regex yang lebih aman untuk menangkap nonce
        const securityMatch = html.data.match(/"nonce":"([^"]+)"/);
        const security = securityMatch ? securityMatch[1] : null;

        if (!security) throw new Error("Gagal mengambil token keamanan (Nonce).");

        // 2. Request Search
        const r = await axios.get('https://spotify.downloaderize.com/wp-admin/admin-ajax.php', {
            params: {
                action: 'sts_search_spotify',
                query: query,
                security: security
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K)',
                'x-requested-with': 'XMLHttpRequest',
                'referer': 'https://spotify.downloaderize.com/'
            }
        });

        const items = r.data?.data?.tracks?.items || [];
        
        if (items.length === 0) {
            return res.status(200).json({ status: 'success', results: [] });
        }

        const results = items.map(v => ({
            title: v.name,
            artist: v.artists.map(a => a.name).join(', '),
            album: v.album.name,
            thumbnail: v.album.images?.[0]?.url || null,
            id: v.id,
            // PENTING: Gunakan URL asli spotify agar player bisa memproses
            url: v.external_urls?.spotify || `https://open.spotify.com/track/${v.id}`
        }));

        return res.status(200).json({ status: 'success', results });

    } catch (e) {
        console.error("Search Error:", e.message);
        return res.status(500).json({ status: 'error', msg: e.message });
    }
}
