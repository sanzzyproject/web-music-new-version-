const axios = require('axios');

export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) return res.status(400).json({ error: 'URL required' });

    try {
        const html = await axios.get('https://spotify.downloaderize.com');
        const nonceMatch = html.data.match(/"nonce":"([^"]+)"/);
        const nonce = nonceMatch ? nonceMatch[1] : null;

        const r = await axios.post('https://spotify.downloaderize.com/wp-admin/admin-ajax.php', 
            new URLSearchParams({
                action: 'spotify_downloader_get_info',
                url: url,
                nonce: nonce
            }).toString(), 
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K)',
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'x-requested-with': 'XMLHttpRequest',
                    'origin': 'https://spotify.downloaderize.com',
                    'referer': 'https://spotify.downloaderize.com/'
                }
            }
        );

        const d = r.data.data;
        if(!d || !d.medias || d.medias.length === 0) {
             // Fallback jika gagal
             throw new Error("Gagal mengambil link download.");
        }

        const result = {
            title: d.title,
            artist: d.author,
            thumbnail: d.thumbnail,
            download: d.medias[0].url
        };

        return res.status(200).json({ status: 'success', result });

    } catch (e) {
        return res.status(500).json({ status: 'error', msg: e.message });
    }
}
