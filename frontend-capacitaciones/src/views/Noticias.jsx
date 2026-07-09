import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import fondodeinterfaz from '../assets/fondodeinterfaz.jpg';
import { useLockBodyScroll } from "../hooks/useLockBodyScroll";

function Noticias() {
    const [noticias, setNoticias] = useState([]);
    const [modalType, setModalType] = useState(null); // 'crear', 'editar', o 'ver'
    const [selectedNoticia, setSelectedNoticia] = useState(null);

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
        }
    }, [puedeVerNoticias]);

    const obtenerNoticias = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/noticias`);
            setNoticias(response.data);
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las noticias.', confirmButtonColor: '#802907' });
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
                await axios.post(`${API_URL}/api/noticias`, dataToSend);
                Swal.fire({ icon: 'success', title: 'Publicada', confirmButtonColor: '#802907' });
            } else {
                dataToSend.append('_method', 'PUT');
                await axios.post(`${API_URL}/api/noticias/${selectedNoticia.id}`, dataToSend);
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
            await axios.delete(`${API_URL}/api/noticias/${noticia.id}`);
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

                <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white">‹</button>
                <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white">›</button>

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
            className="min-h-screen w-full p-4 md:p-6 font-sans text-gray-900 bg-cover bg-center bg-no-repeat bg-fixed"
        //style={{ backgroundImage: `url(${fondodeinterfaz})` }}
        >
            <div className="w-[95%] max-w-[1600px] mx-auto">

                {/* CABEZERA */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-white/20 pb-5 pt-5 px-6 bg-white/30 backdrop-blur-md rounded-2xl shadow-lg">
                    <div>
                        {/* drop-shadow para la cabezera */}
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 drop-shadow-md">Panel de Noticias</h2>
                        <p className="text-sm font-semibold text-gray-800 mt-1 drop-shadow-sm">Titulares destacados y actualizaciones recientes.</p>
                    </div>
                    {puedeCrearNoticias && (
                        <button onClick={abrirModalCrear} className="rounded-lg bg-[#802907] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#5a1b04] transition-all shadow-md hover:shadow-lg hover:scale-105">
                            + Crear Noticia
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            <span className="mb-3 w-max rounded bg-blue-600 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
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

            {/* --- MODAL DE LECTURA COMPLETA --- */}
            {modalType === 'ver' && selectedNoticia && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm" onClick={cerrarModal}>
                    <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-[#1e1e1e] shadow-2xl border border-gray-700" onClick={(e) => e.stopPropagation()}>

                        <div className="relative w-full h-80 bg-black">
                            <button onClick={cerrarModal} className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-gray-700 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                            {(() => {
                                const imgs = obtenerImagenes(selectedNoticia);
                                if (!imgs || imgs.length === 0) return null;
                                if (imgs.length === 1) {
                                    const src = imgs[0];
                                    const esVid = src.match(/\.(mp4|webm|ogg)(\?|$)/i);
                                    return esVid ? (
                                        <video src={src} className="w-full h-full object-cover opacity-80" controls />
                                    ) : (
                                        <img src={src} className="w-full h-full object-cover opacity-80" alt="Portada" />
                                    );
                                }
                                return <FullCarousel images={imgs} />;
                            })()}
                        </div>

                        <div className="p-8 md:p-10">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{selectedNoticia.title}</h2>
                            <div className="flex items-center gap-3 text-sm text-gray-400 mb-8 border-b border-gray-700 pb-5">
                                {noticias[0]?.id === selectedNoticia.id && (
                                    <span className="bg-[#802907] text-white px-3 py-1 rounded-md font-semibold">Contenido destacado</span>
                                )}
                                <span>Publicado recientemente</span>
                            </div>

                            <div className="prose prose-invert max-w-none">
                                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-lg">{selectedNoticia.body}</p>
                            </div>

                            {selectedNoticia.evidence && (
                                <div className="mt-8 rounded-lg bg-blue-900/20 border border-blue-800 p-5">
                                    <h4 className="text-blue-400 font-bold mb-2">Información Adicional / Evidencia:</h4>
                                    <p className="text-sm text-gray-300 leading-relaxed">{selectedNoticia.evidence}</p>
                                </div>
                            )}

                            {selectedNoticia.file_urls && selectedNoticia.file_urls.length > 1 && (
                                <div className="mt-10">
                                    <h4 className="text-gray-400 font-bold mb-4">Galería adjunta</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {selectedNoticia.file_urls.slice(1).map((url, i) => (
                                            <a key={i} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg">
                                                <img src={url} className="w-full h-32 object-cover hover:scale-110 hover:opacity-80 transition duration-300" alt="Evidencia adjunta" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL CREAR / EDITAR (CON INPUT MULTIPLE) --- */}
            {(modalType === 'crear' || modalType === 'editar') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm">
                    <div className="w-full max-w-xl overflow-hidden rounded-xl bg-[#2d2d2d] p-6 shadow-2xl border border-gray-600 text-white">
                        <div className="mb-5 flex items-start justify-between border-b border-gray-700 pb-3">
                            <h3 className="text-xl font-bold">{modalType === 'crear' ? 'Publicar Nueva Noticia' : 'Editar Noticia'}</h3>
                            <button onClick={cerrarModal} className="text-gray-400 hover:text-white">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <form onSubmit={guardarNoticia} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-gray-300">Titular</label>
                                <input name="title" value={formData.title} onChange={handleChange} className="w-full rounded bg-[#1e1e1e] border border-gray-600 p-2 text-white focus:border-blue-500 focus:outline-none" placeholder="Titular llamativo..." />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-gray-300">Desarrollo de la Noticia</label>
                                <textarea name="body" rows={5} value={formData.body} onChange={handleChange} className="w-full rounded bg-[#1e1e1e] border border-gray-600 p-2 text-white focus:border-blue-500 focus:outline-none" placeholder="Escribe todo el contenido aquí..." />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-gray-300">Notas / Evidencia (Opcional)</label>
                                <textarea name="evidence" rows={2} value={formData.evidence} onChange={handleChange} className="w-full rounded bg-[#1e1e1e] border border-gray-600 p-2 text-white focus:border-blue-500 focus:outline-none" placeholder="Links o información extra..." />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-blue-400">Adjuntar Archivos (Puedes seleccionar varias fotos)</label>
                                <input
                                    type="file"
                                    name="files"
                                    multiple
                                    accept=".jpg,.jpeg,.png,.mp4"
                                    onChange={handleFileChange}
                                    className="w-full text-sm text-gray-400 file:mr-3 file:rounded file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700 cursor-pointer"
                                />
                                {formData.files.length > 0 && (
                                    <p className="mt-2 text-xs text-green-400">{formData.files.length} archivo(s) preparado(s) para subir.</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                                <button type="button" onClick={cerrarModal} className="rounded bg-transparent px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white">Cancelar</button>
                                <button type="submit" className="rounded bg-[#802907] px-6 py-2 text-sm font-bold text-white hover:bg-[#5a1b04]">Publicar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Noticias;