const axios = require('axios');

export default async function handler(req, res) {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ status: 'error', msg: 'Query kosong' });
    }

    try {
        // 1. Ambil Halaman Utama untuk cari Token (Nonce)
        const mainPage = await axios.get('https://spotify.downloaderize.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        });

        // 2. Regex yang lebih luas untuk menangkap nonce (karena sering berubah posisi)
        // Mencari pola "nonce":"12345abcde"
        const nonceMatch = mainPage.data.match(/"nonce":"([a-zA-Z0-9]+)"/);
        const security = nonceMatch ? nonceMatch[1] : null;

        if (!security) {
            throw new Error("Gagal mendapatkan token keamanan dari server penyedia.");
        }

        // 3. Request Search ke API Target
        const searchRes = await axios.get('https://spotify.downloaderize.com/wp-admin/admin-ajax.php', {
            params: {
                action: 'sts_search_spotify',
                query: query,
                security: security
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'x-requested-with': 'XMLHttpRequest',
                'referer': 'https://spotify.downloaderize.com/'
            }
        });

        const items = searchRes.data?.data?.tracks?.items || [];

        // 4. Format Hasil
        const results = items.map(v => ({
            title: v.name,
            artist: v.artists.map(a => a.name).join(', '),
            album: v.album.name,
            thumbnail: v.album.images?.[0]?.url || 'https://via.placeholder.com/150',
            // PERBAIKAN PENTING: Menggunakan URL external spotify langsung agar tidak error saat parsing ID
            url: v.external_urls.spotify, 
            id: v.id
        }));

        return res.status(200).json({ status: 'success', results });

    } catch (e) {
        console.error("Server Error Log:", e.message);
        // Pastikan return JSON, bukan HTML error
        return res.status(500).json({ 
            status: 'error', 
            msg: 'Gagal menghubungi server musik. Coba refresh atau cari kata kunci lain.' 
        });
    }
}
