import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { db } from "../../firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "@firebase/firestore";
import toast from "react-hot-toast";
import useSWR, { mutate } from "swr";

const fetcher = async () => {
    const querySnapshot = await getDocs(collection(db, "products"));
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

function Product() {
    const { data: products, error, isLoading } = useSWR('products', fetcher);
    const [editingProduct, setEditingProduct] = useState(null);
    const { register, handleSubmit, reset, setValue, watch } = useForm();
    const [isModalOpen, setIsModalOpen] = useState(false);


    const handleImageUpload = (file) => {
        return new Promise((resolve, reject) => {
            if (!file) return resolve(null);

            // Check file size (512KB = 512 * 1024 bytes)
            if (file.size > 512 * 1024) {
                toast.error("File size must be less than 512KB");
                return resolve(null);
            }

            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };

    const onSubmit = async (data) => {
        try {
            const imageBase64 = data.image[0] ? await handleImageUpload(data.image[0]) : editingProduct?.image;

            if (!imageBase64 && !editingProduct) {
                toast.error("Image is required");
                return;
            }

            const productData = {
                name: data.name,
                description: data.description,
                image: imageBase64,
                laminating: [
                    { name: data.laminatingName, price: Number(data.laminatingPrice) }
                ],
                materials: [
                    { name: data.materialName, price: Number(data.materialPrice) }
                ]
            };

            if (editingProduct) {
                await updateDoc(doc(db, "products", editingProduct.id), productData);
                toast.success("Product updated successfully");
            } else {
                await addDoc(collection(db, "products"), productData);
                toast.success("Product added successfully");
            }

            reset();
            setEditingProduct(null);
            handleCloseModal();
            mutate('products'); // Revalidate the data using SWR
        } catch (error) {
            toast.error("Error saving product");
            console.log(error)
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                await deleteDoc(doc(db, "products", id));
                toast.success("Product deleted successfully");
                mutate('products'); // Revalidate the products data
            } catch (error) {
                toast.error("Error deleting product");
                console.log(error)
            }
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setValue("name", product.name);
        setValue("description", product.description);
        setValue("laminatingName", product.laminating[0]?.name);
        setValue("laminatingPrice", product.laminating[0]?.price);
        setValue("materialName", product.materials[0]?.name);
        setValue("materialPrice", product.materials[0]?.price);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        reset();
    };

    return (
        <div className="p-4">

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Product</h2>
                {!isLoading && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                        Add New Product
                    </button>
                )}
            </div>

            {error && <div className="text-red-500">Failed to load products</div>}
            {isLoading && <div>Loading...</div>}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-[rgba(0,0,0,.8)] bg-opacity-20 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h3>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block mb-2">Name:</label>
                                <input {...register("name")} className="w-full p-2 border rounded" required />
                            </div>

                            <div>
                                <label className="block mb-2">Image: *max 512kb
                                    {watch("image") && watch("image").length > 0 && (
                                        <img
                                            src={URL.createObjectURL(watch("image")[0])}
                                            alt="Image Preview"
                                            className="mt-2 w-32 h-32 object-cover"
                                        />
                                    )}
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    {...register("image")}
                                    className="w-full p-2 border rounded"
                                    required={!editingProduct}
                                />
                            </div>

                            <div>
                                <label className="block mb-2">Description:</label>
                                <textarea {...register("description")} className="w-full p-2 border rounded" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="font-bold mb-2">Laminating</h3>
                                    <div className="space-y-2">
                                        <input {...register("laminatingName")} placeholder="Name" className="w-full p-2 border rounded" required />
                                        <input type="number" {...register("laminatingPrice")} placeholder="Price" className="w-full p-2 border rounded" required />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold mb-2">Material</h3>
                                    <div className="space-y-2">
                                        <input {...register("materialName")} placeholder="Name" className="w-full p-2 border rounded" required />
                                        <input type="number" {...register("materialPrice")} placeholder="Price" className="w-full p-2 border rounded" required />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                            >
                                {isLoading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                            </button>
                        </form>
                    </div>
                </div>
            )}


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {products?.map(product => (
                    <div key={product.id} className="border p-4 rounded">
                        <img src={product.image} alt={product.name} className="w-full h-24 object-cover mb-2" />
                        <h3 className="font-bold">{product.name}</h3>
                        <p className="text-sm">{product.description}</p>

                        {
                            (() => {
                                const laminatingPrices = product.laminating.map(item => item.price);
                                const materialPrices = product.materials.map(item => item.price);
                                const lowestLaminating = Math.min(...laminatingPrices);
                                const lowestMaterial = Math.min(...materialPrices);
                                const total = lowestLaminating + lowestMaterial;
                                return (
                                    <h4 className="font-semibold">
                                        Rp. {total}
                                    </h4>
                                );
                            })()
                        }

                        <div className="mt-4 space-x-2">
                            <button
                                onClick={() => handleEdit(product)}
                                className="bg-yellow-500 text-white px-3 py-1 rounded"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(product.id)}
                                className="bg-red-500 text-white px-3 py-1 rounded"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Product;