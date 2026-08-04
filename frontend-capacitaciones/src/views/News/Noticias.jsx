import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useMe } from "../../hooks/auth/useMe";
import { useNews } from "../../hooks/news/useNews";
import NewsFormModal from "./NewsFormModal";
import ViewNewsModal from "./ViewNewsModal";
import { obtenerImagenes } from "../utils/images";
import { Plus } from "lucide-react";
import { AlertCapsule } from "./AlertCapsule";
import { CarouselTile } from "../components/Carrousel";
import { NewsCard } from "./NewsCard";
import { UseOverlayState } from "../../hooks/useOverlayState";

function Noticias() {

    const state = UseOverlayState({
        defaultOpen: false,
        onOpenChange: (isOpen) => console.log("Estado del modal:", isOpen),
    });

    const [modalType, setModalType] = useState(null); // 'crear', 'editar', o 'ver'
    const [selectedNoticia, setSelectedNoticia] = useState(null);

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
        state.open()
    };

    const abrirModalEditar = (noticia) => {
        setSelectedNoticia(noticia);
        setModalType('editar');
        state.open()
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
            title: 'Eliminar noticia',
            text: `¿Deseas eliminar "${noticia.title}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
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
            className="w-full p-4 md:p-6 font-sans text-gray-900 bg-zinc-100 bg-center bg-no-repeat bg-fixed "
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
                            return (<NewsCard noticia={noticia} isFeatured={index === 0} onClick={() => abrirModalVer(noticia)} canEdit={puedeAdministrarNoticias || noticia.created_by === storedUser?.id} canDelete={puedeAdministrarNoticias} onActions={(a) => { handleOnClickActions(a, noticia) }} />)
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
                state={state}
                mode={modalType}
                noticia={selectedNoticia}
                onClose={cerrarModal}
                onSave={guardarNoticia}
            />
        </div>
    );
}

export default Noticias;