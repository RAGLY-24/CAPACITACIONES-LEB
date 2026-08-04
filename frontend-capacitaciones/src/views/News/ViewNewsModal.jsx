import { X } from "lucide-react";
import { FullCarousel } from "../components/FullCarousel";
import { obtenerImagenes } from "../utils/images";

export default function ViewNewsModal({ open, noticia, isRecent, onClose }) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-50 rounded-full bg-black/60 p-2 text-white shadow-lg backdrop-blur-md transition hover:bg-black/80"
                >
                    <X size={18} />
                </button>

                <div className="hide-scrollbar max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
                    <div className="relative h-72 w-full overflow-hidden bg-gray-100 md:h-80">
                        {(() => {
                            const imgs = obtenerImagenes(noticia);
                            if (!imgs?.length) return null;

                            if (imgs.length === 1) {
                                const src = imgs[0];
                                const esVid = /\.(mp4|webm|ogg)(\?|$)/i.test(src);

                                return esVid ? (
                                    <video src={src} className="h-full w-full object-cover" controls />
                                ) : (
                                    <img src={src} alt="Portada" className="h-full w-full object-cover" />
                                );
                            }

                            return <FullCarousel images={imgs} />;
                        })()}
                    </div>

                    <div className="p-6 md:p-10">
                        <div className="border-b border-gray-200 pb-6">
                            {isRecent && (
                                <span className="mb-4 inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                                    Contenido destacado
                                </span>
                            )}

                            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                                {noticia.title}
                            </h2>

                            <p className="mt-3 text-sm text-gray-500">
                                Publicado recientemente
                            </p>
                        </div>

                        <div className="mt-8">
                            <p className="whitespace-pre-wrap text-lg leading-8 text-gray-700">
                                {noticia.body}
                            </p>
                        </div>

                        {noticia.evidence && (
                            <div className="mt-10 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                                <h4 className="mb-2 text-sm font-semibold text-zinc-700">
                                    Información adicional
                                </h4>

                                <p className="leading-7 text-gray-700">
                                    {noticia.evidence}
                                </p>
                            </div>
                        )}

                        {noticia.file_urls?.length > 1 && (
                            <div className="mt-10">
                                <h4 className="mb-4 text-lg font-semibold text-gray-900">
                                    Galería
                                </h4>

                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                    {noticia.file_urls.slice(1).map((url, i) => (
                                        <a
                                            key={i}
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group overflow-hidden rounded-xl border border-gray-200"
                                        >
                                            <img
                                                src={url}
                                                alt="Archivo adjunto"
                                                className="h-32 w-full object-cover transition duration-300 group-hover:scale-105"
                                            />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}