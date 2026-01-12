const axios = require('axios');

export default async function handler(req, res) {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const html = await axios.get('https://spotify.downloaderize.com');
        const security = html.data.match(/var\s+sts_ajax\s*=\s*\{[^}]*"nonce":"([^"]+)"/i)[1];

        const r = await axios.get('https://spotify.downloaderize.com/wp-admin/admin-ajax.php', {
            params: {
                action: 'sts_search_spotify',
                query,
                security
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'x-requested-with': 'XMLHttpRequest',
                referer: 'https://spotify.downloaderize.com/'
            }
        });

        const items = r.data?.data?.tracks?.items || [];
        
        const results = items.map(v => ({
            title: v.name,
            artist: v.artists.map(a => a.name).join(', '),
            album: v.album.name,
            thumbnail: v.album.images?.[0]?.url || null,
            // Perbaikan syntax ${v.id}
            url: `https://open.spotify.com/track/$${v.id}`, 
            original_url: v.external_urls?.spotify // Backup original link
        }));

        return res.status(200).json({ status: 'success', results });

    } catch (e) {
        return res.status(500).json({ status: 'error', msg: e.message });
    }
}
