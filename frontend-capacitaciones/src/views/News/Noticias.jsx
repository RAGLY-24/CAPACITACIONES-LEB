import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useLockBodyScroll } from "../../hooks/useLockBodyScroll";
import { useMe } from "../../hooks/auth/useMe";
import { useNews } from "../../hooks/news/useNews";
import NewsFormModal from "./NewsFormModal";
import ViewNewsModal from "./ViewNewsModal";
import { obtenerImagenes } from "../utils/images";
import { Plus } from "lucide-react";
import { AlertCapsule } from "./AlertCapsule";
import { CarouselTile } from "../components/Carrousel";
import { NewsCard } from "./NewsCard";

function Noticias() {
    const [modalType, setModalType] = useState(null); // 'crear', 'editar', o 'ver'
    const [selectedNoticia, setSelectedNoticia] = useState(null);


    useLockBodyScroll(!!modalType);


    // --- Usuario autenticado  ---
    const { data } = useMe();

    const storedUser = typeof window !== 'undefined' ? data : null;
    const rol = storedUser?.puesto?.nombre || null;
    const permisosUsuario = storedUser?.permissions || {};
    const puedeVerNoticias = permisosUsuario.news_access !== false;
    const puedeCrearNoticias = rol === 'SistemasAdmin' || permisosUsuario.manage_news === true;
    const puedeAdministrarNoticias = puedeCrearNoticias;

    const UseNews = useNews()

    const { data: news, isLoading, error: newsError } = UseNews.Get()
    const { mutateAsync: deleteNews, isPending: isDeleting } = UseNews.Delete;
    const { mutateAsync: create } = UseNews.Create;
    const { mutateAsync: update } = UseNews.Update;

    useEffect(() => {
        if (newsError && !isLoading) {
            console.error(newsError);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las noticias.', confirmButtonColor: '#802907' });
        }
    }, [isLoading, newsError])

    const abrirModalCrear = () => {
        setSelectedNoticia(null);
        setModalType('crear');
    };

    const abrirModalEditar = (noticia) => {
        setSelectedNoticia(noticia);
        setModalType('editar');
    };

    const abrirModalVer = (noticia) => {
        setSelectedNoticia(noticia);
        setModalType('ver');
    };

    const cerrarModal = () => {
        setModalType(null);
        setSelectedNoticia(null);
    };

    const guardarNoticia = async (data) => {
        if (modalType === "crear") {
            await create({ data });
        } else {
            await update({
                id: selectedNoticia.id,
                data,
            });
        }
    };


    const handleOnClickActions = async (action, noticia) => {
        switch (action) {
            case "edit":
                abrirModalEditar(noticia);
                break;
            case "delete":
                await eliminarNoticia(noticia)
                break;
            default:
                break;
        }
    }

    const eliminarNoticia = async (noticia) => {

        const confirm = await Swal.fire({
            theme: 'bootstrap-5',
            title: 'Eliminar noticia',
            text: `¿Deseas eliminar "${noticia.title}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#752323',
            cancelButtonColor: '#3a3a3a',
            confirmButtonText: 'Sí, eliminar',
            showLoaderOnConfirm: isDeleting
        });

        if (!confirm.isConfirmed) return;

        try {
            await deleteNews(noticia.id)
            Swal.fire({ icon: 'success', title: 'Eliminada', confirmButtonColor: '#802907' });

        } catch (error) {
            console.error(error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar.', confirmButtonColor: '#802907' });
        }
        setModalType(null);
    };

    if (!news || isLoading) return null

    return (
        <div
            className="min-h-screen w-full p-4 md:p-6 font-sans text-gray-900 bg-zinc-100 bg-center bg-no-repeat bg-fixed"
        // style={{ backgroundImage: `url(${fondodeinterfaz})` }}
        >
            <div className="w-[95%] max-w-400 mx-auto">

                {/* CABEZERA */}
                {/* CABEZERA */}
                <div className="mb-8 flex flex-col gap-5 rounded-2xl border border-white/20 bg-white px-6 py-5 shadow-lg backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                        <h2 className="text-3xl font-medium tracking-tight text-gray-900">
                            Panel de Noticias
                        </h2>

                        <p className="mt-2 text-sm text-zinc-500">
                            Titulares destacados y actualizaciones recientes.
                        </p>
                    </div>

                    {puedeCrearNoticias && (
                        <button
                            onClick={abrirModalCrear}
                            className="
                inline-flex shrink-0 items-center justify-center gap-2
                rounded-lg
                bg-brand-primary
                px-4 py-2.5
                text-sm font-medium text-white
                transition-colors duration-200
                hover:bg-red-800
                active:bg-red-950
                focus:outline-none
                focus:ring-2
                focus:ring-red-700/40
            "
                        >
                            <Plus size={18} strokeWidth={2.2} />
                            <span className="">
                                Crear noticia
                            </span>
                        </button>
                    )}
                </div>

                {!puedeVerNoticias ? (
                    <div className="rounded-lg border border-red-900 bg-red-900/20 p-6 text-center text-sm text-red-400">
                        Acceso denegado al feed de noticias.
                    </div>
                ) : news.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500">
                        No hay noticias.
                    </div>
                ) : (
                    /* --- NUEVO GRID: 2 Columnas para mejor proporción --- */
                    <div className="grid grid-cols-2 md:grid-cols-3  gap-4 mb-20">
                        {news.map((noticia, index) => {
                            const EXPERIMENTAL = true
                            const imagenes = obtenerImagenes(noticia);
                            const imgUrl = imagenes[0];
                            const esVideo = imgUrl && imgUrl.match(/\.(mp4|webm|ogg)$/i);

                            // La noticia principal ocupa TODO el ancho de la fila (col-span-2)
                            const isFeatured = index === 0;

                            if (EXPERIMENTAL) {
                                return (<NewsCard noticia={noticia} isFeatured={isFeatured} onClick={() => abrirModalVer(noticia)} canEdit={puedeAdministrarNoticias || noticia.created_by === storedUser?.id} canDelete={puedeAdministrarNoticias} onActions={(a) => { handleOnClickActions(a, noticia) }} />)
                            }

                            return (
                                <div
                                    key={noticia.id}
                                    onClick={() => abrirModalVer(noticia)}
                                    className={`group relative flex flex-col overflow-hidden rounded-xl bg-[#2d2d2d] transition-transform duration-300 hover:scale-[1.01] hover:shadow-2xl cursor-pointer ${isFeatured ? 'md:col-span-3 col-span-2 lg:col-span-4 h-100 md:h-137.5 ' : 'col-span-1 h-70 md:h-87.5'
                                        }`}
                                >
                                    {/* FONDO IMAGEN/VIDEO */}
                                    <div className="absolute inset-0 z-0 bg-[#1e1e1e]">
                                        {imagenes && imagenes.length > 1 ? (
                                            <CarouselTile images={imagenes} />
                                        ) : imgUrl ? (
                                            esVideo ? (
                                                <video src={imgUrl} className="h-full w-full object-cover opacity-80" muted loop playsInline />
                                            ) : (
                                                <img src={imgUrl} className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" alt="cover" />
                                            )
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-gray-700 to-gray-900">
                                                <span className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-400">Sin imagen</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* CAPA DE DEGRADADO OSCURO (Para que el texto se lea bien) */}
                                    <div className="absolute inset-0 z-10 bg-linear-to-t from-black/90 via-black/40 to-transparent"></div>

                                    {/* CONTENIDO TEXTUAL (Sobre la imagen) */}
                                    <div className="relative z-20 flex h-full flex-col justify-end p-6">

                                        {/* Botones administrativos flotantes */}
                                        {(puedeAdministrarNoticias || noticia.created_by === storedUser?.id) && (
                                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                <button onClick={(e) => { e.stopPropagation(); abrirModalEditar(noticia); }} className="rounded-full bg-black/60 p-2 text-white hover:bg-blue-600 backdrop-blur-sm" title="Editar">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                </button>
                                                {puedeAdministrarNoticias && (
                                                    <button onClick={(e) => eliminarNoticia(noticia, e)} className="rounded-full bg-black/60 p-2 text-white hover:bg-red-600 backdrop-blur-sm" title="Eliminar">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {isFeatured && (
                                            <span className="mb-3 w-max rounded bg-red-600 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
                                                Contenido destacado
                                            </span>
                                        )}

                                        <h3 className={`font-bold leading-tight text-white group-hover:underline decoration-2 underline-offset-4 ${isFeatured ? 'text-3xl md:text-5xl line-clamp-3 mb-4' : 'text-xl md:text-2xl line-clamp-2 mb-2'}`}>
                                            {noticia.title}
                                        </h3>

                                        {/* Mostrar siempre un fragmento del cuerpo en todas, pero más largo en la destacada */}
                                        <p className={`text-gray-300 ${isFeatured ? 'text-lg line-clamp-3 mb-4' : 'text-sm line-clamp-2 mb-3'}`}>
                                            {noticia.body}
                                        </p>

                                        <div className="flex items-center text-sm font-semibold text-gray-300 hover:text-white transition-colors">
                                            <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            Leer noticia completa
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <AlertCapsule
                show={puedeVerNoticias || puedeAdministrarNoticias}
                canEdit={puedeAdministrarNoticias}
            />



            <ViewNewsModal
                open={modalType === "ver" && selectedNoticia}
                mode={modalType}
                noticia={selectedNoticia}
                isRecent={news[0]?.id === selectedNoticia?.id}
                onClose={cerrarModal}
            />

            <NewsFormModal
                open={modalType === "crear" || modalType === "editar"}
                mode={modalType}
                noticia={selectedNoticia}
                onClose={cerrarModal}
                onSave={guardarNoticia}
            />
        </div>
    );
}

export default Noticias;