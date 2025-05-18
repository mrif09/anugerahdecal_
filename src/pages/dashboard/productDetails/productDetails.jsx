import { Outlet } from "react-router";
import Navlink from "../../../components/navlink";

function ProductDetails() {

    return (
        <div className="p-4 container">

            <div className="flex gap-x-4  justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Product Details</h2>

                <div className="flex gap-x-2">
                    {['Merk', 'Model', 'Kategori', 'Bahan', 'Laminating'].map((item) =>
                        <Navlink to={`./${item.toLowerCase()}`} className="btn-primary btn" key={item}>{item}</Navlink>
                    )}
                </div>

            </div>

            <Outlet />

        </div>

    );
}

export default ProductDetails;