// Convierte cualquier formato de link de YouTube (watch, youtu.be, shorts,
// o embed ya armado) al formato /embed/ID, el único que YouTube permite
// mostrar dentro de un iframe (X-Frame-Options bloquea los demás).
export function getYoutubeEmbedUrl(url) {
    if (!url) return null;

    let parsed;
    try {
        parsed = new URL(url);
    } catch {
        return null;
    }

    if (parsed.hostname === "youtu.be") {
        const id = parsed.pathname.slice(1);
        return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (!/(^|\.)youtube\.com$/.test(parsed.hostname)) {
        return null;
    }

    if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    const shortsMatch = parsed.pathname.match(/^\/shorts\/([^/]+)/);
    if (shortsMatch) {
        return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }

    const embedMatch = parsed.pathname.match(/^\/embed\/([^/]+)/);
    if (embedMatch) {
        return `https://www.youtube.com/embed/${embedMatch[1]}`;
    }

    return null;
}
