import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export const FullCarousel = ({ images }) => {
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + images.length) % images.length);
            if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % images.length);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [images.length]);

    const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
    const next = () => setIdx((i) => (i + 1) % images.length);

    const src = images[idx];
    const esVideo = src.match(/\.(mp4|webm|ogg)(\?|$)/i);

    return (
        <div className="relative h-full w-full bg-black">
            {esVideo ? (
                <video src={src} className="w-full h-full object-cover" controls />
            ) : (
                <img src={src} className="w-full h-full object-cover" alt={`slide-${idx}`} />
            )}

            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/40 backdrop-blur-lg p-2 text-white">
                <ArrowLeft size={15} className="text-white" />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full  bg-black/60 hover:bg-black/40 backdrop-blur-lg  p-2 text-white">
                <ArrowRight size={15} className="text-white" />
            </button>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                    <button key={i} onClick={() => setIdx(i)} className={`h-2 w-6 rounded ${i === idx ? 'bg-white' : 'bg-white/40'}`} />
                ))}
            </div>
        </div>
    );
};