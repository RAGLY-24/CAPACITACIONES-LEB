import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";

function Noticias() {
    const [noticias, setNoticias] = useState([]);
    const [modalType, setModalType] = useState(null);
    const [selectedNoticia, setSelectedNoticia] = useState(null);
    const [formData, setFormData] = useState({ title: '', body: '', evidence: '' });

    const storedUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || 'null') : null;
    const rol = storedUser?.puesto?.nombre || null;
    const permisosUsuario = storedUser?.permissions || {};
    const puedeVerNoticias = permisosUsuario.news_access !== false;
    const puedeCrearNoticias = puedeVerNoticias;
    const puedeAdministrarNoticias = rol === 'SistemasAdmin' || rol === 'Gerente' || permisosUsuario.manage_news === true;

    useEffect(() => {
        if (puedeVerNoticias) {
            obtenerNoticias();
        }
    }, [puedeVerNoticias]);

    const obtenerNoticias = async () => {
        try {
            const response = await axios.get("http://localhost:8000/api/noticias");
            setNoticias(response.data);
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar las noticias.',
                confirmButtonColor: '#802907'
            });
        }
    };

    const abrirModalCrear = () => {
        setSelectedNoticia(null);
        setFormData({ title: '', body: '', evidence: '' });
        setModalType('crear');
    };

    const abrirModalEditar = (noticia) => {
        setSelectedNoticia(noticia);
        setFormData({
            title: noticia.title,
            body: noticia.body,
            evidence: noticia.evidence || ''
        });
        setModalType('editar');
    };

    const cerrarModal = () => {
        setModalType(null);
        setSelectedNoticia(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const guardarNoticia = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.body) {
            Swal.fire({
                icon: 'warning',
                title: 'Faltan datos',
                text: 'Completa el título y el cuerpo de la noticia.',
                confirmButtonColor: '#802907'
            });
            return;
        }

        Swal.fire({
            title: 'Guardando noticia...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
        });

        try {
            if (modalType === 'crear') {
                await axios.post("http://localhost:8000/api/noticias", formData);
                Swal.fire({ icon: 'success', title: 'Noticia creada', confirmButtonColor: '#802907' });
            } else {
                await axios.put(`http://localhost:8000/api/noticias/${selectedNoticia.id}`, formData);
                Swal.fire({ icon: 'success', title: 'Noticia actualizada', confirmButtonColor: '#802907' });
            }
            obtenerNoticias();
            cerrarModal();
        } catch (err) {
            Swal.close();
            const message = err.response?.data?.message || 'No se pudo guardar la noticia.';
            Swal.fire({ icon: 'error', title: 'Error', text: message, confirmButtonColor: '#802907' });
        }
    };

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
        });

        if (!confirm.isConfirmed) return;

        try {
            await axios.delete(`http://localhost:8000/api/noticias/${noticia.id}`);
            obtenerNoticias();
            Swal.fire({ icon: 'success', title: 'Noticia eliminada', confirmButtonColor: '#802907' });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar la noticia.', confirmButtonColor: '#802907' });
        }
    };

    return (
        <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Noticias Internas</h2>
                    <p className="text-sm text-gray-500">Mira las noticias, agrega evidencia y administra el muro de noticias.</p>
                </div>
                {puedeCrearNoticias && (
                    <button onClick={abrirModalCrear} className="rounded-md bg-[#802907] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4e1802]">
                        + Nueva noticia
                    </button>
                )}
            </div>

            {!puedeVerNoticias ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
                    No tienes permiso para ver o publicar noticias.
                </div>
            ) : noticias.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
                    No hay noticias publicadas todavía.
                </div>
            ) : (
                <div className="space-y-4">
                    {noticias.map((noticia) => (
                        <div key={noticia.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
                            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">{noticia.title}</h3>
                                    <p className="text-sm text-gray-500">Publicado por {noticia.author?.name || 'Usuario'}{noticia.author?.lastname ? ` ${noticia.author.lastname}` : ''}</p>
                                </div>
                                {(puedeAdministrarNoticias || noticia.created_by === storedUser?.id) && (
                                    <div className="flex gap-2">
                                        <button onClick={() => abrirModalEditar(noticia)} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                                            Editar
                                        </button>
                                        {puedeAdministrarNoticias && (
                                            <button onClick={() => eliminarNoticia(noticia)} className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <p className="mb-4 text-gray-700 whitespace-pre-line">{noticia.body}</p>
                            {noticia.evidence && (
                                <div className="rounded-xl border border-[#802907] bg-white p-4 text-sm text-gray-700">
                                    <strong className="block text-sm font-semibold text-[#802907]">Evidencia</strong>
                                    <p className="mt-2 whitespace-pre-line">{noticia.evidence}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {(modalType === 'crear' || modalType === 'editar') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
                    <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">{modalType === 'crear' ? 'Crear noticia' : 'Editar noticia'}</h3>
                                <p className="text-sm text-gray-500">Agrega texto y evidencia para apoyar la publicación.</p>
                            </div>
                            <button onClick={cerrarModal} className="text-sm font-semibold text-gray-500 hover:text-gray-800">Cerrar</button>
                        </div>

                        <form onSubmit={guardarNoticia} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">Título</label>
                                <input name="title" value={formData.title} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 focus:border-[#802907] focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">Contenido</label>
                                <textarea name="body" rows={6} value={formData.body} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 focus:border-[#802907] focus:outline-none" />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">Evidencia</label>
                                <textarea name="evidence" rows={4} value={formData.evidence} onChange={handleChange} className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 focus:border-[#802907] focus:outline-none" placeholder="Agrega notas, links o puntos importantes que respalden esta noticia." />
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button type="button" onClick={cerrarModal} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">
                                    Cancelar
                                </button>
                                <button type="submit" className="rounded-md bg-[#802907] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4e1802]">
                                    Guardar noticia
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