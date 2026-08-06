import { useEffect, useState } from "react";

export const CarouselTile = ({ images }) => {
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        if (!images || images.length <= 1) return;
        const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 7000);
        return () => clearInterval(t);
    }, [images]);

    if (!images || images.length === 0) return null;
    const src = images[idx];
    const esVideo = src.match(/\.(mp4|webm|ogg)(\?|$)/i);

    return esVideo ? (
        <video src={src} className="h-full w-full object-cover opacity-80" muted loop playsInline />
    ) : (
        <img src={src} className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" alt="cover" />
    );
};

