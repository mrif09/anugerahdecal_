import { addDoc, collection, deleteDoc, doc, updateDoc } from '@firebase/firestore';
import clsx from 'clsx';
import { Edit, Trash } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import useSWR, { mutate } from 'swr';
import Modal from '../../../components/modal';
import Table from '../../../components/table';
import { fetcherLaminatings } from '../../../lib/fetcher';
import { db } from '../../../lib/firebase';

function Laminating() {
    const { data, isLoading } = useSWR('laminatings', fetcherLaminatings);
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
                await deleteDoc(doc(db, 'laminatings', id));
                toast.success('Laminating delete successfully')
            }
            else if (isEditing) {
                await updateDoc(doc(db, 'laminatings', id), data)
                toast.success('Laminating update successfully')
            }
            else {
                await addDoc(collection(db, 'laminatings'), data)
                toast.success('Laminating added successfully')
            }
            reset()
            mutate('laminatings')
            handleOpen()
        } catch (error) {
            toast.error(isDelete ? 'Error delete laminating' : isEditing ? 'Error update laminating' : 'Error saving laminating');
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
        setValue('laminating', data.laminating)
        setValue('price', data.price)
        setIsEditing(true)
    }

    if (isLoading) {
        return <>Please wait...</>
    }

    return (<>
        <button onClick={handleOpen} className="my-2 w-full mb-4 btn btn-primary">{isDelete ? 'Delete Laminating' : isEditing ? 'Update Laminating' : 'Add Laminating'}</button>
        <Modal isOpen={isOpen} handleOpen={handleOpen} title={isDelete ? 'Delete Laminating' : isEditing ? 'Update Laminating' : 'Add Laminating'}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block mb-2">Laminating:</label>
                    <input disabled={isDelete} {...register('laminating')} className="w-full p-2 border rounded" required />
                </div>
                <div>
                    <label className="block mb-2">Price:</label>
                    <input type='number' disabled={isDelete} {...register('price')} className="w-full p-2 border rounded" required />
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={clsx('btn', isDelete ? 'btn-danger' : isEditing ? 'btn-warning' : 'btn-primary')}
                >
                    {isSubmitting ? 'Saving...' : (isDelete ? 'Delete Laminating' : isEditing ? 'Update Laminating' : 'Add Laminating')}
                </button>
            </form>
        </Modal>
        <Table rows={['#', 'Laminating', 'Price / Meter', '']}>
            {data?.map((data, id) => (
                <tr key={id} >
                    <td>{id + 1}</td>
                    <td>{data.laminating}</td>
                    <td>{Number(data.price).toLocaleString()}</td>
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

export default Laminating;