import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { Pencil, PlusIcon, Trash2 } from "lucide-react";
import { IconButton } from "../../components/IconButton";
import VideoFormModal from "./VideoFormModal";
import Button from "../../components/Buttons/Button";
import { useVideos } from "../../hooks/videos/useVideos";

function ManageVideosView() {
    const [searchParams, setSearchParams] = useSearchParams();

    const action = searchParams.get("action");
    const actionId = searchParams.get("id");

    const isEdit = action === "edit";
    const isCreate = action === "create";

    const modalType = isEdit ? "editar" : isCreate ? "crear" : null;

    const UseVideos = useVideos();

    const { data: videos, isLoading, error: videosError } = UseVideos.Get();

    const { mutateAsync: createVideo } = UseVideos.Create;
    const { mutateAsync: updateVideo } = UseVideos.Update;
    const { mutateAsync: deleteVideo, isPending: isDeleting } = UseVideos.Delete;

    useEffect(() => {
        if (videosError && !isLoading) {
            console.error(videosError);
            Swal.fire({ icon: "error", title: "Error", text: "No se pudieron cargar los videos.", confirmButtonColor: "#802907" });
        }
    }, [isLoading, videosError]);

    const videoSeleccionado = (videos || []).find(
        (video) => String(video.id) === String(actionId)
    );

    const abrirModalVideo = () => {
        setSearchParams({
            action: "create",
        });
    };

    const abrirModalEditarVideo = (video) => {
        setSearchParams({
            action: "edit",
            id: video.id,
        });
    };

    const cerrarModalVideo = () => {
        setSearchParams({});
    };

    const guardarVideo = async (data) => {
        if (isCreate) {
            await createVideo(data);
        }

        if (isEdit) {
            await updateVideo({ id: actionId, data });
        }
    };

    const eliminarVideo = async (video) => {
        const confirm = await Swal.fire({
            title: "Eliminar video",
            text: `¿Deseas eliminar "${video.titulo}"?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar",
            cancelButtonText: "Cancelar",
            showLoaderOnConfirm: isDeleting,
        });

        if (!confirm.isConfirmed) return;

        try {
            await deleteVideo(video.id);
            Swal.fire({ icon: "success", title: "Eliminado", confirmButtonColor: "#802907" });
        } catch (err) {
            console.error(err);
            Swal.fire({ icon: "error", title: "Error", text: "No se pudo eliminar el video.", confirmButtonColor: "#802907" });
        }
    };

    if (isLoading) return null;

    return (
        <div className="relative p-6">
            {/* SECCIÓN DE VIDEOS */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6">
                <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">
                            Videos
                        </h3>

                        <p className="text-sm text-gray-500">
                            Administra los videos publicados y sus enlaces.
                        </p>
                    </div>

                    <Button
                        Icon={PlusIcon}
                        onClick={abrirModalVideo}
                    >
                        Agregar video
                    </Button>
                </div>

                <div className="mt-4">
                    <div className="grid gap-2 text-sm text-gray-700">
                        {!videos || videos.length === 0 ? (
                            <p className="text-gray-500">
                                No hay videos registrados.
                            </p>
                        ) : (
                            videos.map((video) => (
                                <div
                                    key={video.id}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 transition hover:border-zinc-200 hover:bg-zinc-50"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-gray-800">
                                            {video.titulo}
                                        </p>

                                        <p
                                            className="mt-1 truncate text-xs text-gray-500"
                                            title={video.url}
                                        >
                                            {video.url || "Sin enlace"}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 space-x-1">
                                        <IconButton
                                            icon={Pencil}
                                            variant="primary"
                                            title="Editar"
                                            filled={false}
                                            onClick={() =>
                                                abrirModalEditarVideo(video)
                                            }
                                        />

                                        <IconButton
                                            icon={Trash2}
                                            variant="danger"
                                            title="Eliminar"
                                            filled={false}
                                            onClick={() =>
                                                eliminarVideo(video)
                                            }
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL */}
            <VideoFormModal
                open={Boolean(modalType)}
                mode={modalType}
                video={videoSeleccionado}
                onSave={guardarVideo}
                onClose={cerrarModalVideo}
            />
        </div>
    );
}

export default ManageVideosView;
