import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from '@firebase/firestore';
import clsx from 'clsx';
import { Edit, Minus, Trash } from 'lucide-react';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import useSWR, { mutate } from 'swr';
import Modal from '../../components/modal';
import Table from '../../components/table';
import { fetcherBahans, fetcherCustomers, fetcherLaminatings, fetcherProducts, fetcherTransactions } from '../../lib/fetcher';
import { db } from '../../lib/firebase';

function Transaksi() {
    const { data: customers, isCustomersLoading } = useSWR('customers', fetcherCustomers);
    const { data: products, isProductsLoading } = useSWR('products', fetcherProducts);
    const { data: bahans, isBahansLoading } = useSWR('bahans', fetcherBahans);
    const { data: laminatings, isLaminatingsLoading } = useSWR('laminatings', fetcherLaminatings);
    const { data, isLoading } = useSWR('transaksis', fetcherTransactions);

    const [isOpen, setIsOpen] = useState(false)
    const [id, setId] = useState()
    const [isDelete, setIsDelete] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const { control, register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm({
        defaultValues: {
            listProduct: [{ id: Date.now(), product: [], }]
        }
    })
    const productArray = useFieldArray({
        control,
        name: 'listProduct'
    })


    const handleRemove = (array, id) => {
        if (array.fields.length < 1) return
        const index = array.fields.findIndex((item) => item.id === id);
        if (index !== -1) {
            array.remove(index);
        }
    };

    const handleOpen = () => {
        setIsOpen(!isOpen)
        setIsDelete(false)
        setIsEditing(false)
        reset()
    }
    const onSubmit = async (data) => {
        try {


            if (isDelete) {
                await deleteDoc(doc(db, 'transaksis', id));
                toast.success('Transaksi delete successfully')
            }
            else if (isEditing) {
                await updateDoc(doc(db, 'transaksis', id), { ...data, date_transaction: serverTimestamp() })
                toast.success('Transaksi update successfully')
            }
            else {
                await addDoc(collection(db, 'transaksis'), { ...data, date_transaction: serverTimestamp() })
                toast.success('Transaksi added successfully')
            }
            reset()
            mutate('transaksis')
            handleOpen()
        } catch (error) {
            toast.error(isDelete ? 'Error delete transaksi' : isEditing ? 'Error update transaksi' : 'Error saving transaksi');
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
        setValue('customer', data.customer)
        setValue('status_pembayaran', data.status_pembayaran)
        setValue('status_pengerjaan', data.status_pengerjaan)
        setValue('listProduct', data.listProduct)
        setIsEditing(true)
    }

    if (isLoading || isCustomersLoading || isProductsLoading || isLaminatingsLoading || isBahansLoading) {
        return <>Please wait...</>
    }

    console.log(data)

    return (<>
        <div className="p-4 container">
            <div className="flex justify-between gap-x-4  items-center mb-4">
                <h2 className="text-2xl font-semibold">Transaksi</h2>
                <button onClick={handleOpen} className="btn btn-primary">Add Transaksi</button>
            </div>
            <Modal isOpen={isOpen} handleOpen={handleOpen} title={isDelete ? 'Delete Transaksi' : isEditing ? 'Update Transaksi' : 'Add Transaksi'}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block mb-2">Customer:</label>
                        <select disabled={isEditing || isDelete} {...register('customer')} className="w-full p-2 border rounded" required>
                            <option value=''>Select Customer</option>
                            {customers?.map((option, id) =>
                                <option key={id} value={option.nama}>{option.nama}</option>
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2">Status Pembayaran:</label>
                        <select disabled={isDelete} {...register('status_pembayaran')} className="w-full p-2 border rounded" required>
                            <option value=''>Select Status Pembayaran</option>
                            {['DP', 'Lunas']?.map((option, id) =>
                                <option key={id} value={option}>{option}</option>
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2">Status Pengerjaan:</label>
                        <select disabled={isDelete} {...register('status_pengerjaan')} className="w-full p-2 border rounded" required>
                            <option value=''>Select Status Pengerjaan</option>
                            {['menunggu antrian', 'sedang dikerjakan', 'sudah selesai']?.map((option, id) =>
                                <option key={id} value={option}>{option}</option>
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2">Product: *product + ((bahan + laminating) x panjang/meter)</label>
                        {
                            productArray.fields.map((field, id) => {
                                return (
                                    <div key={id} className="flex gap-2 my-2 w-full">
                                        <select disabled={isEditing || isDelete} {...register(`listProduct.${id}.product`)} className="flex-1 p-2 border rounded" required>
                                            <option value="">Select Product</option>
                                            {products?.map((option, index) =>
                                                <option key={index} value={[option.product, option.price]}>{option.product}</option>
                                            )}
                                        </select>
                                        <select disabled={isEditing || isDelete} {...register(`listProduct.${id}.bahan`)} className=" p-2 border rounded" required>
                                            <option value="">Select Bahan</option>
                                            {bahans?.map((option, index) =>
                                                <option key={index} value={option.price}>{option.bahan}</option>
                                            )}
                                        </select>
                                        <select disabled={isEditing || isDelete} {...register(`listProduct.${id}.laminating`)} className=" border rounded" required>
                                            <option value="">Select Laminating</option>
                                            {laminatings?.map((option, index) =>
                                                <option key={index} value={option.price}>{option.laminating}</option>
                                            )}
                                        </select>
                                        <input disabled={isEditing || isDelete} {...register(`listProduct.${id}.qty`)} type="number" className="w-20 border p-2 rounded" placeholder="1" required />
                                        {!(isEditing || isDelete) &&
                                            <button type="button" onClick={() => handleRemove(productArray, field.id)}>
                                                <Minus className="hover:opacity-70" />
                                            </button>
                                        }
                                    </div>
                                );
                            })
                        }
                        {!(isEditing || isDelete) &&
                            <button className="btn border w-full" type="button" onClick={() => productArray.append({ id: Date.now() })}>
                                Add Product
                            </button>
                        }
                    </div>
                    <div>
                        <label className="block mb-2">Total Harga:</label>
                        {(() => {
                            const total = watch('listProduct')?.
                                map(e => {
                                    const priceProduct = Number(Array.isArray(e.product) ? 0 : e.product?.split(',')[1] ?? 0) 
                                    return (  priceProduct + (( Number(e.bahan) + Number(e.laminating) )  * Number(e.qty))   ) 
                                })
                                .reduce((acc, cur) => acc + cur, 0)
                            setValue('price', total)
                            return <>Rp{total.toLocaleString()}</>
                        })()}
                        <input type="hidden" {...register('price')} />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={clsx('btn', isDelete ? 'btn-danger' : isEditing ? 'btn-warning' : 'btn-primary')}
                    >
                        {isSubmitting ? 'Saving...' : isDelete ? 'Delete Transaksi' : isEditing ? 'Update Transaksi' : 'Add Transaksi'}
                    </button>
                </form>
            </Modal>
            <Table rows={['#', 'Customer', 'Produk', 'Total Harga', 'Tanggal', 'Status Pengerjaan', 'Status Pembayaran', '']}>
                {data?.map((data, id) => (
                    <tr key={id} >
                        <td>{id + 1}</td>
                        <td>{data.customer}</td>
                        <td>
                            {data.listProduct?.map((data, id) => <div key={id}>
                                {data.product.split(',')[0]}, {data.qty}m <br />
                            </div>)}
                        </td>
                        <td>{data.price.toLocaleString()}</td>
                        <td>{data.date_transaction.toDate().toLocaleString('en-GB')}</td>
                        <td>{data.status_pengerjaan}</td>
                        <td>{data.status_pembayaran}</td>
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
        </div>
    </>);
}

export default Transaksi;