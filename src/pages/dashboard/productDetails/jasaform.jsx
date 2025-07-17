import { addDoc, collection, deleteDoc, doc, updateDoc } from "@firebase/firestore";
import clsx from "clsx";
import { Edit, Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import useSWR, { mutate } from "swr";
import Modal from "../../../components/modal";
import Table from "../../../components/table";
import { fetcherJasas } from "../../../lib/fetcher"; // Pastikan fetcherJasas sudah ada
import { db } from "../../../lib/firebase";

function JasaForm() {
    const { data: jasas, isLoading } = useSWR('jasas', fetcherJasas);
    const [isOpen, setIsOpen] = useState(false);
    const [id, setId] = useState();
    const [isDelete, setIsDelete] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm();

    const handleOpen = () => {
        setIsOpen(!isOpen);
        setIsDelete(false);
        setIsEditing(false);
        reset();
    };

    const onSubmit = async (data) => {
        try {
            if (isDelete) {
                await deleteDoc(doc(db, "jasas", id));
                toast.success("Jasa deleted successfully");
            } else if (isEditing) {
                await updateDoc(doc(db, "jasas", id), data);
                toast.success("Jasa updated successfully");
            } else {
                await addDoc(collection(db, "jasas"), data);
                toast.success("Jasa added successfully");
            }
            reset();
            mutate('jasas');
            handleOpen();
        } catch (error) {
            toast.error(isDelete ? "Error deleting jasa" : isEditing ? "Error updating jasa" : "Error saving jasa");
            console.log(error);
        }
    };

    const handleEdit = (data) => {
        handleOpen();
        setId(data.id);
        setValue('kategori', data.kategori);
        setValue('harga', data.harga);
        setIsEditing(true);
    };

    const handleDelete = (data) => {
        handleOpen();
        handleEdit(data);
        setIsDelete(true);
    };

    if (isLoading) {
        return <>Please wait...</>;
    }

    return (
        <>
            <button onClick={handleOpen} className="my-2 w-full mb-4 btn btn-primary">Add Jasa</button>
            <Modal isOpen={isOpen} handleOpen={handleOpen} title={isDelete ? "Delete Jasa" : isEditing ? "Edit Jasa" : "Add Jasa"}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block mb-2">Kategori Jasa:</label>
                        <input
                            disabled={isDelete}
                            {...register("kategori")}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-2">Harga:</label>
                        <input
                            type="number"
                            disabled={isDelete}
                            {...register("harga")}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={clsx("btn", isDelete ? "btn-danger" : isEditing ? "btn-warning" : "btn-primary")}
                    >
                        {isSubmitting
                            ? 'Saving...'
                            : isDelete
                                ? 'Delete Jasa'
                                : isEditing
                                    ? 'Update Jasa'
                                    : 'Add Jasa'}
                    </button>
                </form>
            </Modal>
            <Table rows={['#', 'Kategori Jasa', 'Harga', '']}>
                {jasas?.map((data, id) => (
                    <tr key={id}>
                        <td>{id + 1}</td>
                        <td>{data.kategori}</td>
                        <td>Rp {parseInt(data.harga).toLocaleString()}</td>
                        <td>
                            <div className="flex gap-2 justify-center items-center">
                                <button onClick={() => handleEdit(data)} className="btn-warning btn">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDelete(data)} className="btn-danger btn">
                                    <Trash size={16} />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </Table>
        </>
    );
}

export default JasaForm;