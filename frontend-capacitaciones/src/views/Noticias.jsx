import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useLockBodyScroll } from "../hooks/useLockBodyScroll";
import { ArrowLeft, ArrowRight, Plus, X } from "lucide-react";

function Noticias() {
    const [noticias, setNoticias] = useState([]);
    const [modalType, setModalType] = useState(null); // 'crear', 'editar', o 'ver'
    const [selectedNoticia, setSelectedNoticia] = useState(null);

    // Aviso de emergencia fijo: se colapsa/expande a demanda, pero siempre
    // debe iniciar expandido en cada login (ver Login.jsx, que limpia esta
    // clave de sessionStorage al iniciar sesión).
    const [aviso, setAviso] = useState(null);
    const [avisoColapsado, setAvisoColapsado] = useState(
        () => typeof window !== 'undefined' && sessionStorage.getItem('aviso_colapsado') === '1'
    );

    useLockBodyScroll(!!modalType);

    // Cambiamos 'file' por 'files' (arreglo) para soportar múltiples
    const [formData, setFormData] = useState({ title: '', body: '', evidence: '', files: [] });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const storedUser = typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('user') || 'null') : null;
    const rol = storedUser?.puesto?.nombre || null;
    const permisosUsuario = storedUser?.permissions || {};
    const puedeVerNoticias = permisosUsuario.news_access !== false;
    const puedeCrearNoticias = rol === 'SistemasAdmin' || permisosUsuario.manage_news === true;
    const puedeAdministrarNoticias = puedeCrearNoticias;

    useEffect(() => {
        if (puedeVerNoticias) {
            obtenerNoticias();
            obtenerAviso();
        }
    }, [puedeVerNoticias]);

    const obtenerNoticias = async () => {
        try {
            const response = await axios.get(`${API_URL}/noticias`);
            setNoticias(response.data);
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las noticias.', confirmButtonColor: '#802907' });
        }
    };

    const obtenerAviso = async () => {
        try {
            const response = await axios.get(`${API_URL}/aviso-emergencia`);
            setAviso(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    const toggleAviso = () => {
        setAvisoColapsado(prev => {
            const nuevo = !prev;
            sessionStorage.setItem('aviso_colapsado', nuevo ? '1' : '0');
            return nuevo;
        });
    };

    const editarAviso = async () => {
        const { value: mensaje, isConfirmed } = await Swal.fire({
            title: 'Editar aviso de emergencia',
            input: 'textarea',
            inputValue: aviso?.mensaje || '',
            inputPlaceholder: 'Ej. En caso de emergencia llamar a: 5555-5555',
            showCancelButton: true,
            confirmButtonText: 'Guardar',
            confirmButtonColor: '#802907',
            cancelButtonText: 'Cancelar',
            inputValidator: (v) => !v ? 'Escribe un mensaje.' : undefined,
        });

        if (!isConfirmed) return;

        try {
            const response = await axios.put(`${API_URL}/aviso-emergencia`, { mensaje });
            setAviso(response.data);
            setAvisoColapsado(false);
            sessionStorage.setItem('aviso_colapsado', '0');
            Swal.fire({ icon: 'success', title: 'Aviso actualizado', confirmButtonColor: '#802907' });
        } catch {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar el aviso.', confirmButtonColor: '#802907' });
        }
    };

    const abrirModalCrear = () => {
        setSelectedNoticia(null);
        setFormData({ title: '', body: '', evidence: '', files: [] });
        setModalType('crear');
    };

    const abrirModalEditar = (noticia) => {
        setSelectedNoticia(noticia);
        setFormData({
            title: noticia.title,
            body: noticia.body,
            evidence: noticia.evidence || '',
            files: [] // Se reinicia al editar para adjuntar nuevos
        });
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        const filesArray = Array.from(e.target.files);
        setFormData({ ...formData, files: filesArray });
    };

    const guardarNoticia = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.body) {
            Swal.fire({ icon: 'warning', title: 'Faltan datos', text: 'Completa el título y el cuerpo.', confirmButtonColor: '#802907' });
            return;
        }

        Swal.fire({ title: 'Guardando noticia...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        try {
            const dataToSend = new FormData();
            dataToSend.append('title', formData.title);
            dataToSend.append('body', formData.body);
            if (formData.evidence) dataToSend.append('evidence', formData.evidence);

            if (formData.files && formData.files.length > 0) {
                formData.files.forEach((file) => {
                    dataToSend.append('files[]', file);
                });
            }

            if (modalType === 'crear') {
                await axios.post(`${API_URL}/noticias`, dataToSend);
                Swal.fire({ icon: 'success', title: 'Publicada', confirmButtonColor: '#802907' });
            } else {
                dataToSend.append('_method', 'PUT');
                await axios.post(`${API_URL}/noticias/${selectedNoticia.id}`, dataToSend);
                Swal.fire({ icon: 'success', title: 'Actualizada', confirmButtonColor: '#802907' });
            }

            obtenerNoticias();
            cerrarModal();
        } catch (err) {
            Swal.close();
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la noticia.', confirmButtonColor: '#802907' });
        }
    };

    const eliminarNoticia = async (noticia, e) => {
        e.stopPropagation();
        const confirm = await Swal.fire({
            title: 'Eliminar noticia',
            text: `¿Deseas eliminar "${noticia.title}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar'
        });

        if (!confirm.isConfirmed) return;

        try {
            await axios.delete(`${API_URL}/noticias/${noticia.id}`);
            obtenerNoticias();
            setModalType(null);
            Swal.fire({ icon: 'success', title: 'Eliminada', confirmButtonColor: '#802907' });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar.', confirmButtonColor: '#802907' });
        }
    };

    const obtenerImagenes = (noticia) => noticia.file_urls || [];

    const CarouselTile = ({ images }) => {
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

    const FullCarousel = ({ images }) => {
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

    return (
        <div
            className="min-h-screen w-full p-4 md:p-6 font-sans text-gray-900 bg-zinc-100 bg-center bg-no-repeat bg-fixed"
        // style={{ backgroundImage: `url(${fondodeinterfaz})` }}
        >
            <div className="w-[95%] max-w-[1600px] mx-auto">

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
                ) : noticias.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500">
                        No hay noticias.
                    </div>
                ) : (
                    /* --- NUEVO GRID: 2 Columnas para mejor proporción --- */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
                        {noticias.map((noticia, index) => {
                            const imagenes = obtenerImagenes(noticia);
                            const imgUrl = imagenes[0];
                            const esVideo = imgUrl && imgUrl.match(/\.(mp4|webm|ogg)$/i);

                            // La noticia principal ocupa TODO el ancho de la fila (col-span-2)
                            const isFeatured = index === 0;

                            return (
                                <div
                                    key={noticia.id}
                                    onClick={() => abrirModalVer(noticia)}
                                    className={`group relative flex flex-col overflow-hidden rounded-xl bg-[#2d2d2d] transition-transform duration-300 hover:scale-[1.01] hover:shadow-2xl cursor-pointer ${isFeatured ? 'md:col-span-2 h-[400px] md:h-[550px]' : 'col-span-1 h-[280px] md:h-[350px]'
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
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                                                <span className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-400">Sin imagen</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* CAPA DE DEGRADADO OSCURO (Para que el texto se lea bien) */}
                                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

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

            {/* --- AVISO DE EMERGENCIA: fijo en la parte inferior, se mueve con el scroll --- */}
            {puedeVerNoticias && (aviso?.mensaje || puedeAdministrarNoticias) && (
                <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 pointer-events-none">
                    {avisoColapsado ? (
                        <button
                            onClick={toggleAviso}
                            className="pointer-events-auto flex items-center gap-2 rounded-xl border-red-700 bg-red-700/90  backdrop-blur-sm px-4 py-2.5 text-sm  text-white shadow-lg hover:scale-102 transition-all "
                            title="Mostrar aviso de emergencia"
                        >
                            🚨 Aviso de emergencia
                        </button>
                    ) : (
                        <div className="pointer-events-auto flex flex-row items-center w-full max-w-3xl  gap-3 rounded-xl border border-red-700 bg-red-700/90   backdrop-blur-sm px-5 py-4 text-white shadow-2xl">
                            <span className="text-xl leading-none shrink-0">🚨</span>
                            <p className="flex-1 text-sm leading-snug whitespace-pre-wrap self-center">
                                {aviso?.mensaje || (puedeAdministrarNoticias ? 'Aún no has configurado el aviso de emergencia.' : '')}
                            </p>
                            <div className="flex items-center gap-1 shrink-0">
                                {puedeAdministrarNoticias && (
                                    <button onClick={editarAviso} className="rounded-full p-1.5 hover:bg-white/10" title="Editar aviso">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                    </button>
                                )}
                                <button onClick={toggleAviso} className="rounded-full p-1.5 hover:bg-white/10" title="Minimizar aviso">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- MODAL DE LECTURA COMPLETA --- */}
            {modalType === "ver" && selectedNoticia && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                    onClick={cerrarModal}
                >
                    <div
                        className="relative w-full max-w-4xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Botón cerrar fijo */}
                        <button
                            onClick={cerrarModal}
                            className="
                    absolute right-3 top-3 z-50
                    rounded-full
                    bg-black/60
                    p-2
                    text-white
                    backdrop-blur-md
                    shadow-lg
                    transition
                    hover:bg-black/80
                "
                        >
                            <X size={18} />
                        </button>

                        {/* Contenedor con scroll */}
                        <div className="
                max-h-[90vh]
                overflow-y-auto
                hide-scrollbar
                rounded-3xl
                bg-white
                shadow-2xl
            ">

                            {/* Imagen principal */}
                            <div className="relative h-72 w-full overflow-hidden bg-gray-100 md:h-80">

                                {(() => {
                                    const imgs = obtenerImagenes(selectedNoticia);

                                    if (!imgs || imgs.length === 0) return null;

                                    if (imgs.length === 1) {
                                        const src = imgs[0];
                                        const esVid = src.match(/\.(mp4|webm|ogg)(\?|$)/i);

                                        return esVid ? (
                                            <video
                                                src={src}
                                                className="h-full w-full object-cover"
                                                controls
                                            />
                                        ) : (
                                            <img
                                                src={src}
                                                alt="Portada"
                                                className="h-full w-full object-cover"
                                            />
                                        );
                                    }

                                    return <FullCarousel images={imgs} />;
                                })()}

                            </div>


                            {/* Contenido */}
                            <div className="p-6 md:p-10">

                                <div className="border-b border-gray-200 pb-6">

                                    {noticias[0]?.id === selectedNoticia.id && (
                                        <span className="
                                            mb-4
                                            inline-flex
                                            rounded-full
                                            bg-red-100
                                            px-3
                                            py-1
                                            text-xs
                                            font-semibold
                                            text-red-800
                                        ">
                                            Contenido destacado
                                        </span>
                                    )}

                                    <h2 className="
                            mt-3
                            text-3xl
                            font-bold
                            tracking-tight
                            text-gray-900
                            md:text-4xl
                        ">
                                        {selectedNoticia.title}
                                    </h2>

                                    <p className="mt-3 text-sm text-gray-500">
                                        Publicado recientemente
                                    </p>

                                </div>


                                {/* Texto */}
                                <div className="mt-8">
                                    <p className="
                            whitespace-pre-wrap
                            text-lg
                            leading-8
                            text-gray-700
                        ">
                                        {selectedNoticia.body}
                                    </p>
                                </div>


                                {/* Evidencia */}
                                {selectedNoticia.evidence && (
                                    <div className="
                            mt-10
                            rounded-xl
                            border
                            border-zinc-200
                            bg-zinc-50
                            p-5
                        ">
                                        <h4 className="
                                mb-2
                                text-sm
                                font-semibold
                                text-zinc-700
                            ">
                                            Información adicional
                                        </h4>

                                        <p className="
                                leading-7
                                text-gray-700
                            ">
                                            {selectedNoticia.evidence}
                                        </p>
                                    </div>
                                )}


                                {/* Galería */}
                                {selectedNoticia.file_urls &&
                                    selectedNoticia.file_urls.length > 1 && (
                                        <div className="mt-10">

                                            <h4 className="
                                    mb-4
                                    text-lg
                                    font-semibold
                                    text-gray-900
                                ">
                                                Galería
                                            </h4>


                                            <div className="
                                    grid
                                    grid-cols-2
                                    gap-4
                                    sm:grid-cols-4
                                ">
                                                {selectedNoticia.file_urls
                                                    .slice(1)
                                                    .map((url, i) => (
                                                        <a
                                                            key={i}
                                                            href={url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="
                                                    group
                                                    overflow-hidden
                                                    rounded-xl
                                                    border
                                                    border-gray-200
                                                "
                                                        >
                                                            <img
                                                                src={url}
                                                                alt="Archivo adjunto"
                                                                className="
                                                        h-32
                                                        w-full
                                                        object-cover
                                                        transition
                                                        duration-300
                                                        group-hover:scale-105
                                                    "
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
            )}
            {/* --- MODAL CREAR / EDITAR (CON INPUT MULTIPLE) --- */}
            {(modalType === 'crear' || modalType === 'editar') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
                    <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">

                        {/* Header */}
                        <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        {modalType === "crear"
                                            ? "Publicar nueva noticia"
                                            : "Editar noticia"}
                                    </h3>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Completa la información para publicar la noticia.
                                    </p>
                                </div>

                                <button
                                    onClick={cerrarModal}
                                    className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                                >
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Contenido scrolleable */}
                        <form
                            onSubmit={guardarNoticia}
                            className="flex-1 overflow-y-auto p-6"
                        >
                            <div className="space-y-5">

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Titular
                                    </label>

                                    <input
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Titular llamativo..."
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-red-800 focus:outline-none focus:ring-1 focus:ring-red-800"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Desarrollo de la noticia
                                    </label>

                                    <textarea
                                        name="body"
                                        rows={5}
                                        value={formData.body}
                                        onChange={handleChange}
                                        placeholder="Escribe todo el contenido aquí..."
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-red-800 focus:outline-none focus:ring-1 focus:ring-red-800"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Notas / Evidencia <span className="text-gray-400">(Opcional)</span>
                                    </label>

                                    <textarea
                                        name="evidence"
                                        rows={2}
                                        value={formData.evidence}
                                        onChange={handleChange}
                                        placeholder="Links o información adicional..."
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-red-800 focus:outline-none focus:ring-1 focus:ring-red-800"
                                    />
                                </div>

                                <div className="">
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Adjuntar archivos
                                    </label>

                                    <input
                                        type="file"
                                        name="files"
                                        multiple
                                        accept=".jpg,.jpeg,.png,.mp4"
                                        onChange={handleFileChange}
                                        className="
                                            w-full text-sm text-gray-600
                                            file:mr-4
                                            file:rounded-lg
                                            file:border-0
                                            file:bg-red-900
                                            file:px-4
                                            file:py-2
                                            file:font-medium
                                            file:text-white
                                            hover:file:bg-red-800
                                            cursor-pointer
                                        "
                                    />

                                    {formData.files.length > 0 && (
                                        <p className="mt-2 text-sm text-zinc-600">
                                            {formData.files.length} archivo(s) seleccionado(s).
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Footer fijo */}
                            <div className="sticky bottom-0 mt-6 flex justify-end gap-3 border-t border-gray-200 bg-white pt-5">
                                <button
                                    type="button"
                                    onClick={cerrarModal}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="rounded-lg bg-red-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800"
                                >
                                    {modalType === "crear"
                                        ? "Publicar"
                                        : "Guardar cambios"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Noticias;