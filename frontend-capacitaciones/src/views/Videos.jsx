import { useEffect, useRef, useState } from "react";
import { VideoOff } from "lucide-react";
import bg from "../assets/bg.jpeg";

function Videos() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const iframeRefs = useRef([]);
    const itemRefs = useRef([]);

    const shorts = [
    ];

    const videos = [
        ...shorts,
        ...shorts,
        ...shorts,
    ];

    useEffect(() => {
        if (!videos.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (
                        entry.isIntersecting &&
                        entry.intersectionRatio >= 0.6
                    ) {
                        setCurrentIndex(
                            Number(entry.target.dataset.index)
                        );
                    }
                });
            },
            {
                threshold: [0.6],
            }
        );

        itemRefs.current.forEach((element) => {
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [videos.length]);

    useEffect(() => {
        if (!videos.length) return;

        iframeRefs.current.forEach((iframe, index) => {
            if (!iframe) return;

            iframe.contentWindow.postMessage(
                JSON.stringify({
                    event: "command",
                    func:
                        index === currentIndex
                            ? "playVideo"
                            : "pauseVideo",
                    args: [],
                }),
                "https://www.youtube.com"
            );
        });
    }, [currentIndex, videos.length]);

    useEffect(() => {
        if (!videos.length) return;

        if (currentIndex < shorts.length * 2) return;

        const originalIndex = currentIndex - shorts.length;
        const element = itemRefs.current[originalIndex];

        if (!element) return;

        setTimeout(() => {
            element.scrollIntoView({
                behavior: "instant",
                block: "start",
            });

            setCurrentIndex(originalIndex);
        }, 100);
    }, [currentIndex, videos.length]);

    return (
        <div className="relative w-full overflow-hidden font-sans text-gray-900">
            {/* Fondo */}
            <div
                className="fixed inset-0 scale-110 bg-cover bg-center blur-2xl"
                style={{
                    backgroundImage: `url(${bg})`,
                }}
            />

            {/* Oscurecer */}
            <div className="fixed inset-0 bg-white/95" />

            {/* Glow */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_60%)]" />

            {videos.length === 0 ? (
                /* ESTADO SIN VIDEOS */
                <div className="relative z-10 flex h-[calc(100vh-56px)] items-center justify-center px-6">
                    <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-gray-200 bg-white/90 px-8 py-12 text-center shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-md">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                            <VideoOff size={38} strokeWidth={1.7} />
                        </div>

                        <h2 className="text-xl font-bold text-gray-800">
                            Aún no hay videos
                        </h2>

                        <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                            En este momento no hay videos disponibles para
                            mostrar. Cuando se publiquen nuevos contenidos,
                            aparecerán aquí.
                        </p>

                        <div className="mt-6 h-1 w-12 rounded-full bg-brand-primary" />
                    </div>
                </div>
            ) : (
                /* REELS */
                <div className="relative z-10 h-[calc(100vh-56px)] snap-y snap-mandatory overflow-y-auto hide-scrollbar">
                    {videos.map((item, idx) => (
                        <div
                            key={idx}
                            ref={(element) => {
                                itemRefs.current[idx] = element;
                            }}
                            data-index={idx}
                            className="flex h-full w-full snap-start snap-always items-center justify-center py-6"
                        >
                            <div className="relative h-full max-h-full w-100 rounded-2xl bg-zinc-200">
                                {/* Glow alrededor del video */}
                                <div className="absolute -inset-6 rounded-3xl bg-slate-400/40 blur-2xl" />

                                <iframe
                                    ref={(element) => {
                                        iframeRefs.current[idx] = element;
                                    }}
                                    className="relative z-10 aspect-9/16 h-full max-h-full w-full max-w-125 rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,.6)]"
                                    src={`${item}?autoplay=0&mute=1&enablejsapi=1&origin=${window.location.origin}`}
                                    title={`YouTube video ${idx + 1}`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Videos;