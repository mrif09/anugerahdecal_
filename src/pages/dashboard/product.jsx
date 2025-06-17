import { addDoc, collection, deleteDoc, doc, updateDoc } from '@firebase/firestore';
import clsx from 'clsx';
import { Edit, Trash } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import useSWR, { mutate } from 'swr';
import Modal from '../../components/modal';
import Table from '../../components/table';
import { fetcherKategoris, fetcherMerks, fetcherModels, fetcherProducts } from '../../lib/fetcher';
import { db } from '../../lib/firebase';

function Product() {
    const { data: products, isProductsLoading } = useSWR('products', fetcherProducts);
    const { data: merks, isMerksLoading } = useSWR('merks', fetcherMerks);
    const { data: models, isModelsLoading } = useSWR('models', fetcherModels);
    const { data: kategoris, isKategorisLoading } = useSWR('kategoris', fetcherKategoris);
    

    const [editingProduct, setEditingProduct] = useState(null);
    const [isDelete, setIsDelete] = useState(false);
    const { register, handleSubmit, reset, setValue, watch, formState: { isSubmitting } } = useForm();

    const [isModalOpen, setIsModalOpen] = useState(false);


    const onSubmit = async (data) => {
        try {
            const imageBase64 = watch('imageChange') ?? data.image

            if (!imageBase64 && !editingProduct) {
                toast.error('Image is required');
                return;
            }

            if(data.product.includes(',')){
                toast.error('Nama produk dilarang menggunakan , (koma)')
                return
            }

            const productData = {
                product: data.product,
                description: data.description,
                image: imageBase64,
                category: data.category,
                merk: data.merk,
                model: data.model,
                price: data.price
            };

            if (isDelete) {
                await deleteDoc(doc(db, 'products', editingProduct.id));
                toast.success('Product deleted successfully');
            }
            else if (editingProduct) {
                await updateDoc(doc(db, 'products', editingProduct.id), productData);
                toast.success('Product updated successfully');
            }
            else {
                await addDoc(collection(db, 'products'), productData);
                toast.success('Product added successfully');
            }

            reset();
            setEditingProduct(null);
            handleOpen();
            mutate('products');
        } catch (error) {
            toast.error(isDelete ? 'Error delete product' : editingProduct ? 'Error update product' : 'Error saving product');
            console.log(error)
        }
    };

    const handleDelete = (product) => {
        setIsDelete(true)
        handleEdit(product)
    };

    const handleEdit = (data) => {
        setEditingProduct(data);
        setValue('product', data.product);
        setValue('description', data.description);
        setValue('category', data.category);
        setValue('merk', data.merk);
        setValue('model', data.model);
        setValue('image', data.image);
        setValue('price', data.price);
        setIsModalOpen(true);
    };

    const handleOpen = () => {
        setIsModalOpen(!isModalOpen);
        setIsDelete(false)
        setEditingProduct(null);
        reset();
    };

    if (isProductsLoading || isMerksLoading || isModelsLoading || isKategorisLoading) {
        return <>Please wait...</>
    }

    return (
        <div className="p-4 container">

            <div className="flex justify-between gap-x-4  items-center mb-4">
                <h2 className="text-2xl font-semibold">Product</h2>
                <button onClick={handleOpen} className="btn btn-primary">Add Product</button>
            </div>

            <Modal isOpen={isModalOpen} handleOpen={handleOpen} title={isDelete ? 'Delete Product' : editingProduct ? 'Edit Product' : 'Add Product'}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className=" mb-2">Product:</label>
                        <input placeholder="product" disabled={isDelete} {...register('product')} className="w-full p-2 border rounded" required />
                    </div>

                    <div>
                        <label className="mb-2 ">Image: *max 100kb
                            {(watch('image')?.length > 0 || watch('imageChange')?.length > 0) && (
                                <img
                                    src={watch('imageChange') || watch('image')}
                                    alt="Image Preview"
                                    className={'mt-2 w-32 h-32 object-cover'}
                                />
                            )}
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            {...register('image')}
                            className={clsx(isDelete && 'hidden', 'w-full p-2 border rounded')}
                            required={!editingProduct}
                            onChange={(e) => {
                                const file = e.target.files[0]
                                if (file.size > 100 * 1024) {
                                    toast.error('File size must be less than 100KB');
                                    setValue('image', null)
                                    return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    setValue('imageChange', reader.result);
                                };
                                reader.readAsDataURL(file);
                            }}
                        />
                    </div>

                    <div>
                        <label className=" mb-2">Description:</label>
                        <textarea placeholder="deskripsi" disabled={isDelete} {...register('description')} className="w-full p-2 border rounded" required />
                    </div>

                    <div>
                        <label className=" mb-2">Category:</label>
                        <select disabled={isDelete} {...register('category')} className="w-full p-2 border rounded" required>
                            <option value="">Select Category</option>
                            {kategoris?.map((option, id) =>
                                <option key={id} value={option.kategori}>{option.kategori}</option>
                            )}
                        </select>
                    </div>

                    <div>
                        <label className=" mb-2">Merk:</label>
                        <select disabled={isDelete} {...register('merk')} className="w-full p-2 border rounded" required>
                            <option value="">Select Merk</option>
                            {merks?.map((option, id) =>
                                <option key={id} value={option.merk}>{option.merk}</option>
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2">Model:</label>
                        <select disabled={isDelete} {...register('model')} className="w-full p-2 border rounded" required>
                            <option value="">Select Model</option>
                            {models?.filter(e => e.merk == watch('merk')).map((option, id) =>
                                <option key={id} value={option.model}>{option.model}</option>
                            )}
                        </select>
                    </div>

                    <div>
                        <label className=" mb-2">Price:</label>
                        <input type='number' placeholder="price" disabled={isDelete} {...register('price')} className="w-full p-2 border rounded" required />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={clsx('btn', isDelete ? 'btn-danger' : editingProduct ? 'btn-warning' : 'btn-primary')}
                    >
                        {isSubmitting ? 'Saving...' : isDelete ? 'Delete Product' : editingProduct ? 'Update Product' : 'Add Product'}
                    </button>
                </form>
            </Modal>

            <Table rows={['#', 'Image', 'Product', 'Description', 'Category', 'Merk', 'Model', 'Price', '']}>
                {products?.map((data, id) => (
                    <tr key={id} >
                        <td>{id + 1}</td>
                        <td>
                            <img src={data.image} alt={data.name} className="w-24 h-24 object-cover rounded" />
                        </td>
                        <td>{data.product} </td>
                        <td>{data.description}</td>
                        <td>{data.category}</td>
                        <td>{data.merk}</td>
                        <td>{data.model}</td>
                        <td>{Number(data.price).toLocaleString()}</td>
                        <td>
                            <div className="flex flex-col gap-2 justify-center items-center">
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
    );
}

export default Product;