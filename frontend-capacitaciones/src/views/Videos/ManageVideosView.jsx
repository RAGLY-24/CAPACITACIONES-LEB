import { useSearchParams } from "react-router-dom";
import { Pencil, PlusIcon, Trash2 } from "lucide-react";
import { IconButton } from "../../components/IconButton";
import VideoFormModal from "./VideoFormModal";
import Button from "../../components/Buttons/Button";

function ManageVideosView() {
    const [searchParams, setSearchParams] = useSearchParams();

    const action = searchParams.get("action");
    const actionId = searchParams.get("id");

    const isEdit = action === "edit";
    const isCreate = action === "create";

    const modalType = isEdit ? "editar" : isCreate ? "crear" : null;

    // Tus videos vendrían del backend
    const videos = [];

    const videoSeleccionado = videos.find(
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
            // POST
            console.log("Agregar video", data);
        }

        if (isEdit) {
            // PUT / PATCH
            console.log("Editar video", actionId, data);
        }
    };

    const eliminarVideo = async (video) => {
        console.log("Eliminar video", video);
    };

    return (
        <div className="relative p-6">
            {/* SECCIÓN DE VIDEOS */}
            <div className="mt-8 rounded-3xl border border-gray-200 bg-white p-6">
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
                        {videos.length === 0 ? (
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
                                            {video.videoTitle}
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