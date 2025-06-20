import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from '@firebase/firestore';
import clsx from 'clsx';
import { Edit, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';
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

    const [isOpen, setIsOpen] = useState(false);
    const [id, setId] = useState(null);
    const [isDelete, setIsDelete] = useState(false);
    const [isEditing, setIsEditing] = useState(false);


    const { control, register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm({
        defaultValues: {
            listProduct: [{ id: Date.now(), product: '' }]
        }
    });
    
    const productArray = useFieldArray({
        control,
        name: 'listProduct'
    });

    const handleRemove = (array, id) => {
        if (array.fields.length < 1) return;
        const index = array.fields.findIndex((item) => item.id === id);
        if (index !== -1) {
            array.remove(index);
        }
    };

    const handleOpen = () => {
        setIsOpen(!isOpen);
        setIsDelete(false);
        setIsEditing(false);
        reset({
            listProduct: [{ id: Date.now(), product: '' }]
        });
    };

    const onSubmit = async (formData) => {
        try {
            let data = { ...formData };
            if (data.status_pembayaran !== 'DP') {
                data.nominal_dp = null;
            } else {
                data.nominal_dp = Number(data.nominal_dp) || 0;
            }
            data.price = Number(data.price) || 0;

            if (isDelete) {
                await deleteDoc(doc(db, 'transaksis', id));
                toast.success('Transaksi deleted successfully');
            } else if (isEditing) {
                await updateDoc(doc(db, 'transaksis', id), { ...data, date_transaction: serverTimestamp() });
                toast.success('Transaksi updated successfully');
            } else {
                await addDoc(collection(db, 'transaksis'), { 
                    ...data, 
                    status_pengerjaan: 'menunggu antrian',
                    date_transaction: serverTimestamp() 
                });
                toast.success('Transaksi added successfully');
            }

            reset({
                listProduct: [{ id: Date.now(), product: '' }]
            });
            mutate('transaksis');
            handleOpen();
        } catch (error) {
            toast.error(isDelete ? 'Error deleting transaksi' : isEditing ? 'Error updating transaksi' : 'Error saving transaksi');
            console.error(error);
        }
    };

    const handleDelete = (data) => {
        handleOpen();
        handleEdit(data);
        setIsDelete(true);
    };

    const handleEdit = (data) => {
        handleOpen();
        setId(data.id);
        setValue('customer', data.customer);
        setValue('status_pembayaran', data.status_pembayaran);
        setValue('status_pengerjaan', data.status_pengerjaan);
        setValue('listProduct', data.listProduct?.map(lp => ({
            ...lp,
            product: typeof lp.product === 'string' ? lp.product : ''
        })));
        setValue('nominal_dp', data.nominal_dp || '');
        setIsEditing(true);
    };

    const totalHarga = (() => {
        const list = watch('listProduct') || [];
        return list
            .map(e => {
                const priceProduct = Number(
                    typeof e.product === 'string' && e.product.includes(',')
                        ? e.product.split(',')[1]
                        : 0
                );
                const bahan = Number(e.bahan) || 0;
                const laminating = Number(e.laminating) || 0;
                const qty = Number(e.qty) || 0;
                return (priceProduct + ((bahan + laminating) * qty));
            })
            .reduce((acc, cur) => acc + cur, 0);
    })();

    useEffect(() => {
        setValue('price', totalHarga);
    }, [totalHarga, setValue]);

    if (isLoading || isCustomersLoading || isProductsLoading || isLaminatingsLoading || isBahansLoading) {
        return <>Please wait...</>;
    }
    

    const nominalDP = Number(watch('nominal_dp')) || 0;
    const sisaPembayaran = watch('status_pembayaran') === 'DP' ? Math.max(totalHarga - nominalDP, 0) : 0;

    return (
        <>
            <div className="p-4 container">
                <div className="flex justify-between gap-x-4 items-center mb-4">
                    <h2 className="text-2xl font-semibold">Transaksi</h2>
                    <button onClick={handleOpen} className="btn btn-primary">Add Transaksi</button>
                </div>

                <Modal isOpen={isOpen} handleOpen={handleOpen} title={isDelete ? 'Delete Transaksi' : isEditing ? 'Update Transaksi' : 'Add Transaksi'}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block mb-2">Customer:</label>
                            <select disabled={isEditing || isDelete} {...register('customer')} className="w-full p-2 border rounded" required>
                                <option value=''>Select Customer</option>
                                {customers
                                    ?.slice()
                                    .sort((a, b) => a.nama.localeCompare(b.nama))
                                    .map((option, id) =>
                                        <option key={id} value={option.nama}>{option.nama}</option>
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
                                                {products
                                                    ?.slice()
                                                    .sort((a, b) => a.product.localeCompare(b.product))
                                                    .map((option, index) =>
                                                        <option key={index} value={[option.product, option.price]}>{option.product}</option>
                                                    )}
                                            </select>
                                            <select disabled={isEditing || isDelete} {...register(`listProduct.${id}.bahan`)} className=" p-2 border rounded" required>
                                                <option value="">Select Bahan</option>
                                                {bahans?.map((option, index) =>
                                                    <option key={index} value={option.price}>{option.bahan}</option>
                                                )}
                                            </select>
                                            <select disabled={isEditing || isDelete} {...register(`listProduct.${id}.laminating`)} className=" border rounded">
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
                                <button className="btn border w-full" type="button" onClick={() => productArray.append({ id: Date.now(), product: '' })}>
                                    Add Product
                                </button>
                            }
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
                        {watch('status_pembayaran') === 'DP' && (
                            <div>
                                <label className="block mb-2">Nominal DP:</label>
                                <input
                                    type="number"
                                    {...register('nominal_dp', {
                                        required: true,
                                        min: 1,
                                        max: totalHarga
                                    })}
                                    className="w-full p-2 border rounded"
                                    placeholder="Masukkan nominal DP"
                                    disabled={isDelete}
                                />
                                <small className="text-gray-500">Maksimal: Rp{totalHarga.toLocaleString()}</small>
                                <div className="mt-1 text-sm">
                                    Sisa pembayaran: <span className="font-semibold">Rp{sisaPembayaran.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        {isEditing && (
                            <div>
                                <label className="block mb-2">Status Pengerjaan:</label>
                                <select disabled={isDelete} {...register('status_pengerjaan')} className="w-full p-2 border rounded" required>
                                    <option value=''>Pilih Status Pengerjaan</option>
                                    {['menunggu antrian', 'sedang dikerjakan', 'cancel', 'sudah selesai']?.map((option, id) =>
                                        <option key={id} value={option}>{option}</option>
                                    )}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block mb-2">Total Harga:</label>
                            <span>Rp{totalHarga.toLocaleString()}</span>
                            <input type="hidden" {...register('price')} value={totalHarga} />
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
                <Table rows={['#', 'Customer', 'Produk', 'Total Harga', 'Nominal DP', 'Sisa Pembayaran', 'Tanggal', 'Status', 'Status Pembayaran', 'Invoice', '']}>
                    {data
                        ?.slice()
                        .sort((a, b) => b.date_transaction.seconds - a.date_transaction.seconds)
                        .map((data, id) => {
                            const price = Number(data.price) || 0;
                            const nominalDP = Number(data.nominal_dp) || 0;
                            const sisaPembayaran = data.status_pembayaran === 'DP' ? Math.max(price - nominalDP, 0) : 0;
                            return (
                                <tr key={id} >
                                    <td>{id + 1}</td>
                                    <td>{data.customer}</td>
                                    <td>
                                        {data.listProduct?.map((data, id) => <div key={id}>
                                            {typeof data.product === 'string' ? data.product.split(',')[0] : ''}, {data.qty}m <br />
                                        </div>)}
                                    </td>
                                    <td>
                                        {`Rp${price.toLocaleString()}`}
                                    </td>
                                    <td>
                                        {data.status_pembayaran === 'DP'
                                            ? `Rp${nominalDP.toLocaleString()}`
                                            : '-'}
                                    </td>
                                    <td>
                                        {data.status_pembayaran === 'DP'
                                            ? `Rp${sisaPembayaran.toLocaleString()}`
                                            : '-'}
                                    </td>
                                    <td>{data.date_transaction.toDate().toLocaleString('en-GB')}</td>
                                    <td>{data.status_pengerjaan}</td>
                                    <td>{data.status_pembayaran}</td>
                                    <td>
                                        <button
                                            className={clsx(
                                                "px-4 py-2 rounded font-semibold shadow transition",
                                                data.status_pengerjaan === 'cancel'
                                                    ? "bg-gray-400 text-white cursor-not-allowed"
                                                    : "bg-green-500 hover:bg-green-600 text-white"
                                            )}
                                            onClick={() => {
                                                if (data.status_pengerjaan !== 'cancel') {
                                                    window.open(`/#/invoice/${data.id}`, '_blank')
                                                }
                                            }}
                                            disabled={data.status_pengerjaan === 'cancel'}
                                        >
                                            Invoice
                                        </button>
                                    </td>
                                    <td>
                                        <div className="flex gap-2 justify-center items-center">
                                            <button
                                                onClick={() => handleEdit(data)}
                                                className="btn-warning btn"
                                                disabled={data.status_pengerjaan === 'cancel' || data.status_pengerjaan === 'sudah selesai'}
                                                style={
                                                    data.status_pengerjaan === 'cancel' || data.status_pengerjaan === 'sudah selesai'
                                                        ? { opacity: 0.5, cursor: 'not-allowed' }
                                                        : {}
                                                }
                                            >
                                                <Edit size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                </Table>
            </div>
        </>
    );
}

export default Transaksi;
