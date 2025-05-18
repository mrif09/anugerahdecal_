import { addDoc, collection, deleteDoc, doc, updateDoc } from "@firebase/firestore";
import clsx from "clsx";
import { Edit, Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import useSWR, { mutate } from "swr";
import Modal from "../../../components/modal";
import Table from "../../../components/table";
import { fetcherMerks, fetcherModels } from "../../../lib/fetcher";
import { db } from "../../../lib/firebase";


function Model() {
    const { data: models, isLoading: isModelsLoading } = useSWR('models', fetcherModels);
    const { data: merks, isLoading: isMerksLoading } = useSWR('merks', fetcherMerks);
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
                await deleteDoc(doc(db, "models", id));
                toast.success("Model delete successfully")
            }
            else if (isEditing) {
                await updateDoc(doc(db, "models", id), data)
                toast.success("Model update successfully")
            }
            else {
                await addDoc(collection(db, "models"), data)
                toast.success("Model added successfully")
            }
            reset()
            mutate('models')
            handleOpen()
        } catch (error) {
            toast.error(isDelete ? "Error delete model" : isEditing ? "Error update model" : "Error saving model");
            console.log(error)
        }
    }

    const handleEdit = (data) => {
        handleOpen()
        setId(data.id)
        setValue('model', data.model)
        setValue('merk', data.merk)
        setIsEditing(true)
    }
    const handleDelete = (data) => {
        handleOpen()
        handleEdit(data)
        setIsDelete(true)
    }

    if (isModelsLoading || isMerksLoading) {
        return <>Please wait...</>
    }

    return (<>
        <button onClick={handleOpen} className="my-2 w-full mb-4 btn btn-primary">Add Model</button>
        <Modal isOpen={isOpen} handleOpen={handleOpen} title="Add Model">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block mb-2">Merk:</label>
                    <select {...register("merk")} className="w-full p-2 border rounded" required>
                        <option value="" >Select Merk</option>
                        {merks?.map((option, id) =>
                            <option key={id} value={option.merk}>{option.merk}</option>
                        )}
                    </select>
                </div>
                <div>
                    <label className="block mb-2">Model:</label>
                    <input disabled={isDelete} {...register("model")} className="w-full p-2 border rounded" required />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={clsx("btn", isDelete ? "btn-danger" : isEditing ? "btn-warning" : "btn-primary")}
                >
                    {isSubmitting ? 'Saving...' : (isDelete ? 'Delete Merk' : isEditing ? 'Update Merk' : 'Add Merk')}
                </button>
            </form>
        </Modal>
        <Table rows={['#', 'Merk', 'Model', '']}>
            {models?.map((data, id) => (
                <tr key={id} >
                    <td>{id + 1}</td>
                    <td>{data.merk}</td>
                    <td>{data.model}</td>
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

export default Model;