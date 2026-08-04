import { Calendar, Pencil, Trash2 } from "lucide-react";
import { PrettyDate } from "../utils/date";
import { obtenerImagenes } from "../utils/images";
import { CarouselTile } from "../components/Carrousel";

export function NewsCard({ noticia, isFeatured, canEdit, canDelete, onClick, onActions }) {
    if (!noticia) return null
    const createdAt = PrettyDate(noticia.created_at)
    const imagenes = obtenerImagenes(noticia);

    const imgUrl = imagenes[0];
    const esVideo = imgUrl && imgUrl.match(/\.(mp4|webm|ogg)$/i);

    const media = imagenes?.length > 1 ? (
        <CarouselTile images={imagenes} />
    ) : imgUrl ? (
        esVideo ? (
            <video src={imgUrl} className="h-full w-full object-cover" muted loop playsInline />
        ) : (
            <img src={imgUrl} alt="cover" className="h-full w-full object-cover" />
        )
    ) : (
        <div className="object-cover">
            <span className="text-sm font-semibold  self-center uppercase tracking-[0.3em] text-gray-400">
                Sin imagen
            </span>
        </div>
    );


    return (
        <div
            onClick={onClick}
            className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl ${isFeatured
                ? "col-span-2 md:col-span-3"
                : "flex flex-col items-start gap-2"
                }`}
        >
            <div
                className={`overflow-hidden bg-[#1e1e1e] ${isFeatured ? "aspect-2/1" : "aspect-video rounded-2xl"
                    }`}
            >

                <div className="transition-all duration-700 group-hover:scale-104 group-hover:opacity-80 flex h-full items-center justify-center">
                    {media}
                </div>
                {canEdit && (<div className="absolute top-2 right-2 flex gap-1 opacity-10 transition-opacity group-hover:opacity-100 z-20">
                    <button onClick={(e) => { e.stopPropagation(); onActions("edit") }} className="rounded-xl bg-black/60  text-white hover:bg-zinc-400/40 backdrop-blur-sm h-8 w-8 flex items-center justify-center" title="Editar">
                        <Pencil size={13} />
                    </button>
                    {canDelete && (
                        <button onClick={(e) => { e.stopPropagation(); onActions("delete") }} className="rounded-xl bg-black/60  text-white hover:bg-red-500/90 backdrop-blur-xs h-8 w-8 flex items-center justify-center" title="Editar">
                            <Trash2 size={13} />
                        </button>
                    )}
                </div>)}
            </div>

            {isFeatured && (
                <div className="absolute inset-0 z-10 bg-linear-to-t from-black/90 via-black/40 to-transparent" />
            )}

            <div
                className={
                    isFeatured
                        ? "absolute bottom-0 left-0 z-20 flex flex-col items-start gap-2 p-4"
                        : "mt-2 flex flex-col items-start gap-2"
                }
            >
                <p
                    className={`rounded-2xl px-3 py-1 font-medium ${isFeatured
                        ? "bg-white text-sm"
                        : "bg-zinc-200 text-[9px]"
                        }`}
                >
                    {isFeatured ? "Contenido destacado" : "NOTICIA"}
                </p>

                <p
                    className={
                        isFeatured
                            ? "text-4xl text-white"
                            : "text-md"
                    }
                >
                    {noticia.title}
                </p>

                <span className="mb-2 flex items-center gap-1">
                    <Calendar
                        size={isFeatured ? 15 : 13}
                        className={isFeatured ? "text-white/80" : "opacity-60"}
                    />

                    <p
                        className={
                            isFeatured
                                ? "text-sm text-white/80"
                                : "text-xs opacity-60"
                        }
                    >
                        {createdAt}
                    </p>
                </span>
            </div>
        </div>
    )
}