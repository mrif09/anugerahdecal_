import { addDoc, collection, deleteDoc, doc, updateDoc } from "@firebase/firestore";
import clsx from "clsx";
import { Edit, Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import useSWR, { mutate } from "swr";
import Modal from "../../../components/modal";
import Table from "../../../components/table";
import { fetcherKategoris } from "../../../lib/fetcher";
import { db } from "../../../lib/firebase";


function Kategori() {
    const { data, isLoading } = useSWR('kategoris', fetcherKategoris);
    const [isOpen, setIsOpen] = useState(false)
    const [id, setId] = useState()
    const [isDelete, setIsDelete] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm()
    const handleOpen = () => {
        setIsOpen(!isOpen)
        setIsDelete(false)
        setIsEditing(false)
        reset()
    }
    const onSubmit = async (data) => {
        try {
            if (isDelete) {
                await deleteDoc(doc(db, "kategoris", id));
                toast.success("kategori delete successfully")
            }
            else if (isEditing) {
                await updateDoc(doc(db, "kategoris", id), data)
                toast.success("kategori update successfully")
            }
            else {
                await addDoc(collection(db, "kategoris"), data)
                toast.success("kategori added successfully")
            }
            reset()
            mutate('kategoris')
            handleOpen()
        } catch (error) {
            toast.error(isDelete ? "Error delete kategori" : isEditing ? "Error update kategori" : "Error saving kategori");
            console.log(error)
        }
    }

    const handleDelete = (data) => {
        handleOpen()
        handleEdit(data)
        setIsDelete(true)
    }
    const handleEdit = (data) => {
        handleOpen()
        setId(data.id)
        setValue('kategori', data.kategori)
        setIsEditing(true)
    }
    console.log(data)
    if (isLoading) {
        return <>Please wait...</>
    }
    return (<>
        <button onClick={handleOpen} className="my-2 w-full mb-4 btn btn-primary">Add Kategori</button>
        <Modal isOpen={isOpen} handleOpen={handleOpen} title="Add Kategori">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block mb-2">Kategori:</label>
                    <input disabled={isDelete} {...register("kategori")} className="w-full p-2 border rounded" required />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={clsx("btn", isDelete ? "btn-danger" : isEditing ? "btn-warning" : "btn-primary")}
                >
                    {isSubmitting ? 'Saving...' : (isDelete ? 'Delete Kategori' : isEditing ? 'Update Kategori' : 'Add Kategori')}
                </button>
            </form>
        </Modal>
        <Table rows={['#', 'Kategori', '']}>
            {data?.map((data, id) => (
                <tr key={id} >
                    <td>{id + 1}</td>
                    <td>{data.kategori}</td>
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
    </>);
}

export default Kategori;