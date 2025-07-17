import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc, getDoc } from '@firebase/firestore';
import clsx from 'clsx';
import { Edit, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import useSWR, { mutate } from 'swr';
import Modal from '../../components/modal';
import Table from '../../components/table';
import { fetcherBahans, fetcherCustomers, fetcherLaminatings, fetcherProducts, fetcherTransactions, fetcherJasas } from '../../lib/fetcher';
import { db } from '../../lib/firebase';

function Transaksi() {
    const { data: customers, isCustomersLoading } = useSWR('customers', fetcherCustomers);
    const { data: products, isProductsLoading } = useSWR('products', fetcherProducts);
    const { data: bahans, isBahansLoading } = useSWR('bahans', fetcherBahans);
    const { data: laminatings, isLaminatingsLoading } = useSWR('laminatings', fetcherLaminatings);
    const { data: jasas, isLoading: isJasasLoading } = useSWR('jasas', fetcherJasas);
    const { data, isLoading } = useSWR('transaksis', fetcherTransactions);

    const [isOpen, setIsOpen] = useState(false);
    const [id, setId] = useState(null);
    const [isDelete, setIsDelete] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isEditDisabled, setIsEditDisabled] = useState(false);
    const [initialStatusPembayaran, setInitialStatusPembayaran] = useState('');
    const [isLunasOnlyEditable, setIsLunasOnlyEditable] = useState(false);

    // Filter & Search State
    const [filterCustomer, setFilterCustomer] = useState('');
    const [filterPembayaran, setFilterPembayaran] = useState('');
    const [filterPengerjaan, setFilterPengerjaan] = useState('');
    const [search, setSearch] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

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
        setIsEditDisabled(false);
        setIsLunasOnlyEditable(false);
        setInitialStatusPembayaran('');
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

            // Pastikan status pembayaran ikut cancel jika status pengerjaan cancel
            if (data.status_pengerjaan === 'cancel') {
                data.status_pembayaran = 'cancel';
            }

            // Menambahkan transaksi
            if (isDelete) {
                await deleteDoc(doc(db, 'transaksis', id));
                toast.success('Transaksi deleted successfully');
            } else if (isEditing) {
                const updatePayload = { ...data, date_transaction: serverTimestamp() };
                await updateDoc(doc(db, 'transaksis', id), updatePayload);
                toast.success('Transaksi updated successfully');
            } else {
                // Update stok bahan dan laminating
                // --- START: Tambahkan harga bahan, laminating, jasa ke setiap produk ---
                const listProduct = formData.listProduct.map(product => {
                    const qty = Number(product.qty) || 0;
                    // Ambil harga bahan dari id
                    const bahanObj = bahans?.find(b => b.id === product.bahan);
                    const harga_bahan = bahanObj ? Number(bahanObj.price) : 0;
                    // Ambil harga laminating dari id
                    const laminatingObj = laminatings?.find(l => l.id === product.laminating);
                    const harga_laminating = laminatingObj ? Number(laminatingObj.price) : 0;
                    // Ambil harga jasa dari value select (format: [id,harga])
                    let harga_jasa = 0;
                    if (product.jasa && typeof product.jasa === 'string' && product.jasa.includes(',')) {
                        harga_jasa = Number(product.jasa.split(',')[1]);
                    }
                    return {
                        ...product,
                        harga_bahan,
                        harga_laminating,
                        harga_jasa,
                    };
                });
                // --- END: Tambahkan harga bahan, laminating, jasa ke setiap produk ---

                // Update stok bahan dan laminating
                for (const product of listProduct) {
                    const qty = Number(product.qty) || 0;

                    // Update stok bahan jika dipilih
                    if (product.bahan) {
                        const bahanRef = doc(db, 'bahans', product.bahan);
                        const bahanDoc = await getDoc(bahanRef);
                        if (bahanDoc.exists()) {
                            const bahanData = bahanDoc.data();
                            if (bahanData.stok >= qty) {
                                await updateDoc(bahanRef, { stok: bahanData.stok - qty });
                            } else {
                                toast.error('Stok bahan tidak cukup');
                                return;
                            }
                        } else {
                            toast.error('Bahan tidak ditemukan');
                            return;
                        }
                    }

                    // Update stok laminating jika dipilih
                    if (product.laminating) {
                        const laminatingRef = doc(db, 'laminatings', product.laminating);
                        const laminatingDoc = await getDoc(laminatingRef);
                        if (laminatingDoc.exists()) {
                            const laminatingData = laminatingDoc.data();
                            if (laminatingData.stok >= qty) {
                                await updateDoc(laminatingRef, { stok: laminatingData.stok - qty });
                            } else {
                                toast.error('Stok laminating tidak cukup');
                                return;
                            }
                        } else {
                            toast.error('Laminating tidak ditemukan');
                            return;
                        }
                    }
                }

                await addDoc(collection(db, 'transaksis'), {
                    ...data,
                    listProduct, // simpan listProduct yang sudah ada harga
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
            product: typeof lp.product === 'string' ? lp.product : '',
            jasa: typeof lp.jasa === 'string' ? lp.jasa : ''
        })));
        setValue('nominal_dp', data.nominal_dp || '');
        setIsEditing(true);
        setInitialStatusPembayaran(data.status_pembayaran);

        // Status pembayaran tidak bisa diedit jika sudah lunas
        if (data.status_pembayaran === 'lunas') {
            setIsLunasOnlyEditable(true);
        } else {
            setIsLunasOnlyEditable(false);
        }

        // Tombol edit/modal disable jika sudah selesai DAN lunas, atau cancel
        if (
            (data.status_pengerjaan === 'sudah selesai' && data.status_pembayaran === 'lunas') ||
            data.status_pengerjaan === 'cancel'
        ) {
            setIsEditDisabled(true);
        } else {
            setIsEditDisabled(false);
        }
    };

    // Penjumlahan harga yang benar (ambil harga bahan/laminating dari id, harga jasa dari value select)
    const totalHarga = (() => {
        const list = watch('listProduct') || [];
        return list
            .map(e => {
                // Ambil harga produk
                const priceProduct = Number(
                    typeof e.product === 'string' && e.product.includes(',')
                        ? e.product.split(',')[1]
                        : 0
                );
                // Ambil harga jasa dari value select (format: [id,harga])
                const priceJasa = Number(
                    typeof e.jasa === 'string' && e.jasa.includes(',')
                        ? e.jasa.split(',')[1]
                        : 0
                );
                // Ambil harga bahan dari id
                const bahanObj = bahans?.find(b => b.id === e.bahan);
                const hargaBahan = bahanObj ? Number(bahanObj.price) : 0;
                // Ambil harga laminating dari id
                const laminatingObj = laminatings?.find(l => l.id === e.laminating);
                const hargaLaminating = laminatingObj ? Number(laminatingObj.price) : 0;
                const qty = Number(e.qty) || 0;
                return (priceProduct + priceJasa + ((hargaBahan + hargaLaminating) * qty));
            })
            .reduce((acc, cur) => acc + cur, 0);
    })();

    useEffect(() => {
        setValue('price', totalHarga);
    }, [totalHarga, setValue]);

    // Otomatis update status pembayaran jadi cancel jika status pengerjaan cancel
    useEffect(() => {
        if (watch('status_pengerjaan') === 'cancel') {
            setValue('status_pembayaran', 'cancel');
        }
    }, [watch('status_pengerjaan'), setValue]);

    if (isLoading || isCustomersLoading || isProductsLoading || isLaminatingsLoading || isBahansLoading || isJasasLoading) {
        return <>Please wait...</>;
    }

    // Ambil nominal DP sebagai angka
    const nominalDPRaw = watch('nominal_dp');
    const nominalDP = Number(nominalDPRaw) || 0;
    const sisaPembayaran = watch('status_pembayaran') === 'DP' ? Math.max(totalHarga - nominalDP, 0) : 0;

    // FILTER & SEARCH LOGIC
    const filteredData = data?.filter(item => {
        // Filter
        const matchCustomer = filterCustomer ? item.customer === filterCustomer : true;
        const matchPembayaran = filterPembayaran ? item.status_pembayaran === filterPembayaran : true;
        const matchPengerjaan = filterPengerjaan ? item.status_pengerjaan === filterPengerjaan : true;

        // Filter tanggal
        let matchDate = true;
        if (filterStartDate && filterEndDate && item.date_transaction) {
            const itemDate = item.date_transaction.toDate();
            const startDate = new Date(filterStartDate);
            const endDate = new Date(filterEndDate);
            endDate.setHours(23, 59, 59, 999); // agar termasuk transaksi di akhir hari
            matchDate = itemDate >= startDate && itemDate <= endDate;
        }

        // Pencarian
        const searchLower = search.toLowerCase();
        const matchSearch =
            item.customer?.toLowerCase().includes(searchLower) ||
            item.listProduct?.some(p => typeof p.product === 'string' && p.product.split(',')[0].toLowerCase().includes(searchLower)) ||
            (item.id && item.id.toLowerCase().includes(searchLower));

        return matchCustomer && matchPembayaran && matchPengerjaan && (search === '' || matchSearch) && matchDate;
    });

    return (
        <>
            <div className="p-4 container">
                <div className="flex justify-between gap-x-4 items-center mb-4">
                    <h2 className="text-2xl font-semibold">Transaksi</h2>
                    <button onClick={handleOpen} className="btn btn-primary">Add Transaksi</button>
                </div>

                {/* FILTER & SEARCH UI */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <input
                        type="text"
                        className="border rounded p-2"
                        placeholder="Cari customer, produk, invoice..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ minWidth: 200 }}
                    />
                    <select
                        className="border rounded p-2"
                        value={filterCustomer}
                        onChange={e => setFilterCustomer(e.target.value)}
                    >
                        <option value="">Filter Customer</option>
                        {customers?.map((c, idx) => (
                            <option key={idx} value={c.nama}>{c.nama}</option>
                        ))}
                    </select>
                    <select
                        className="border rounded p-2"
                        value={filterPembayaran}
                        onChange={e => setFilterPembayaran(e.target.value)}
                    >
                        <option value="">Status Pembayaran</option>
                        <option value="DP">DP</option>
                        <option value="lunas">lunas</option>
                        <option value="cancel">cancel</option>
                    </select>
                    <select
                        className="border rounded p-2"
                        value={filterPengerjaan}
                        onChange={e => setFilterPengerjaan(e.target.value)}
                    >
                        <option value="">Status Pengerjaan</option>
                        <option value="menunggu antrian">menunggu antrian</option>
                        <option value="sedang dikerjakan">sedang dikerjakan</option>
                        <option value="sudah selesai">sudah selesai</option>
                        <option value="cancel">cancel</option>
                    </select>
                    {/* Filter tanggal */}
                    <input
                        type="date"
                        className="border rounded p-2"
                        value={filterStartDate}
                        onChange={e => setFilterStartDate(e.target.value)}
                    />
                    <span>-</span>
                    <input
                        type="date"
                        className="border rounded p-2"
                        value={filterEndDate}
                        onChange={e => setFilterEndDate(e.target.value)}
                    />
                    <button
                        className="px-4 py-2 rounded font-semibold shadow border bg-red-100 text-red-700 hover:bg-red-500 hover:text-white transition"
                        onClick={() => {
                            setFilterCustomer('');
                            setFilterPembayaran('');
                            setFilterPengerjaan('');
                            setSearch('');
                            setFilterStartDate('');
                            setFilterEndDate('');
                        }}>Reset</button>
                </div>

                <Modal isOpen={isOpen} handleOpen={handleOpen} title={isDelete ? 'Delete Transaksi' : isEditing ? 'Update Transaksi' : 'Add Transaksi'}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="block mb-2">Customer:</label>
                            <select disabled={isEditing || isDelete || isEditDisabled || isLunasOnlyEditable} {...register('customer')} className="w-full p-2 border rounded" required>
                                <option value=''>Select Customer</option>
                                {customers?.slice().sort((a, b) => a.nama.localeCompare(b.nama)).map((option, id) =>
                                    <option key={id} value={option.nama}>{option.nama}</option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-2">Product & Jasa:</label>
                            {
                                productArray.fields.map((field, id) => {
                                    return (
                                        <div key={id} className="flex gap-2 my-2 w-full">
                                            <select disabled={isEditing || isDelete || isEditDisabled || isLunasOnlyEditable} {...register(`listProduct.${id}.product`)} className="flex-1 p-2 border rounded" required>
                                                <option value="">Select Product</option>
                                                {products?.slice().sort((a, b) => a.product.localeCompare(b.product)).map((option, index) =>
                                                    <option key={index} value={[option.product, option.price]}>{option.product}</option>
                                                )}
                                            </select>
                                            {/* Pilihan jasa */}
                                            <select disabled={isEditing || isDelete || isEditDisabled || isLunasOnlyEditable} {...register(`listProduct.${id}.jasa`)} className="p-2 border rounded">
                                                <option value="">Select Jasa</option>
                                                {jasas?.map((option, index) =>
                                                    <option key={index} value={[option.id, option.harga]}>{option.kategori}</option>
                                                )}
                                            </select>
                                            <select disabled={isEditing || isDelete || isEditDisabled || isLunasOnlyEditable} {...register(`listProduct.${id}.bahan`)} className="p-2 border rounded" required>
                                                <option value="">Select Bahan</option>
                                                {bahans?.map((option, index) =>
                                                    <option key={index} value={option.id}>{option.bahan} (Stok: {option.stok})</option>
                                                )}
                                            </select>
                                            <select disabled={isEditing || isDelete || isEditDisabled || isLunasOnlyEditable} {...register(`listProduct.${id}.laminating`)} className="border rounded">
                                                <option value="">Select Laminating</option>
                                                {laminatings?.map((option, index) =>
                                                    <option key={index} value={option.id}>{option.laminating} (Stok: {option.stok})</option>
                                                )}
                                            </select>
                                            <input disabled={isEditing || isDelete || isEditDisabled || isLunasOnlyEditable} {...register(`listProduct.${id}.qty`)} type="number" className="w-20 border p-2 rounded" placeholder="1" required min={1} />
                                            {!(isEditing || isDelete || isEditDisabled || isLunasOnlyEditable) &&
                                                <button type="button" onClick={() => handleRemove(productArray, field.id)}>
                                                    <Minus className="hover:opacity-70" />
                                                </button>
                                            }
                                        </div>
                                    );
                                })
                            }
                            {!(isEditing || isDelete || isEditDisabled || isLunasOnlyEditable) &&
                                <button className="btn border w-full" type="button" onClick={() => productArray.append({ id: Date.now(), product: '' })}>
                                    Add Product
                                </button>
                            }
                        </div>

                        <div>
                            <label className="block mb-2">Status Pembayaran:</label>
                            <select
                                disabled={isDelete || (isEditing && initialStatusPembayaran === 'lunas')}
                                {...register('status_pembayaran')}
                                className="w-full p-2 border rounded"
                                required
                            >
                                <option value=''>Select Status Pembayaran</option>
                                {['DP', 'lunas'].map((option, id) =>
                                    <option key={id} value={option}>{option}</option>
                                )}
                            </select>
                        </div>
                        {watch('status_pembayaran') === 'DP' && (
                            <div>
                                <label className="block mb-2">Nominal DP:</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
                                    <input
                                        type="text"
                                        {...register('nominal_dp', {
                                            required: true,
                                            min: 1,
                                            max: totalHarga,
                                            onChange: e => {
                                                // Hanya angka, hapus karakter non-digit
                                                const raw = e.target.value.replace(/[^\d]/g, '');
                                                setValue('nominal_dp', raw);
                                            }
                                        })}
                                        className="w-full pl-8 p-2 border rounded"
                                        placeholder="0"
                                        disabled={isDelete || isEditDisabled || isLunasOnlyEditable}
                                        value={nominalDPRaw || ''}
                                        onChange={e => {
                                            // Hanya angka, hapus karakter non-digit
                                            const raw = e.target.value.replace(/[^\d]/g, '');
                                            setValue('nominal_dp', raw);
                                        }}
                                    />
                                </div>
                                <small className="text-gray-500">Maksimal: Rp{totalHarga.toLocaleString('id-ID')}</small>
                                <div className="mt-1 text-sm">
                                    Sisa pembayaran: <span className="font-semibold">Rp{sisaPembayaran.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        )}

                        {/* Status Pengerjaan hanya tampil saat edit/delete */}
                        {(isEditing || isDelete) && (
                            <div>
                                <label className="block mb-2">Status Pengerjaan:</label>
                                <select
                                    disabled={
                                        isDelete ||
                                        isEditDisabled ||
                                        (isEditing
                                            ? watch('status_pengerjaan') === 'sudah selesai'
                                            : false
                                        )
                                    }
                                    {...register('status_pengerjaan')}
                                    className="w-full p-2 border rounded"
                                    required
                                >
                                    <option value=''>Pilih Status Pengerjaan</option>
                                    {['menunggu antrian', 'sedang dikerjakan', 'cancel', 'sudah selesai'].map((option, id) =>
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
                            disabled={isSubmitting || isEditDisabled}
                            className={clsx('btn', isDelete ? 'btn-danger' : isEditing ? 'btn-warning' : 'btn-primary')}
                        >
                            {isSubmitting ? 'Saving...' : isDelete ? 'Delete Transaksi' : isEditing ? 'Update Transaksi' : 'Add Transaksi'}
                        </button>
                    </form>
                </Modal>

                <Table rows={['#', 'Customer', 'Produk', 'Total Harga', 'Nominal DP', 'Sisa Pembayaran', 'Tanggal', 'Status pengerjaan', 'Status Pembayaran', 'Invoice', '']}>
                    {filteredData?.slice().sort((a, b) => b.date_transaction.seconds - a.date_transaction.seconds).map((data, id) => {
                        const price = Number(data.price) || 0;
                        const nominalDP = Number(data.nominal_dp) || 0;
                        const sisaPembayaran = data.status_pembayaran === 'DP' ? Math.max(price - nominalDP, 0) : 0;
                        // Tombol edit disable jika sudah selesai DAN lunas, atau cancel
                        const disableEdit =
                            (data.status_pengerjaan === 'sudah selesai' && data.status_pembayaran === 'lunas') ||
                            data.status_pengerjaan === 'cancel';

                        return (
                            <tr key={id} className={data.status_pembayaran === 'cancel' ? 'bg-red-100' : ''}>
                                <td>{id + 1}</td>
                                <td>{data.customer}</td>
                                <td>
                                    {data.listProduct?.map((lp, idx) => {
                                        // Ambil nama jasa jika ada
                                        let jasaName = '';
                                        if (lp.jasa && jasas) {
                                            if (typeof lp.jasa === 'string' && lp.jasa.includes(',')) {
                                                // Format [id,harga]
                                                const jasaId = lp.jasa.split(',')[0];
                                                const jasaObj = jasas.find(j => j.id === jasaId);
                                                jasaName = jasaObj ? jasaObj.kategori : '';
                                            }
                                        }
                                        return (
                                            <div key={idx}>
                                                {typeof lp.product === 'string' ? lp.product.split(',')[0] : ''}
                                                {jasaName ? `, ${jasaName}` : ''}
                                                , {lp.qty}m <br />
                                            </div>
                                        );
                                    })}
                                </td>
                                <td>{`Rp${price.toLocaleString()}`}</td>
                                <td>{data.status_pembayaran === 'DP' ? `Rp${nominalDP.toLocaleString()}` : '-'}</td>
                                <td>{data.status_pembayaran === 'DP' ? `Rp${sisaPembayaran.toLocaleString()}` : '-'}</td>
                                <td>{data.date_transaction.toDate().toLocaleString('en-GB')}</td>
                                <td>{data.status_pengerjaan}</td>
                                <td>{data.status_pembayaran}</td>
                                <td>
                                    <button
                                        className={clsx("px-4 py-2 rounded font-semibold shadow transition", data.status_pengerjaan === 'cancel' ? "bg-gray-400 text-white cursor-not-allowed" : "bg-green-500 hover:bg-green-600 text-white")}
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
                                            disabled={disableEdit}
                                            style={disableEdit ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
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