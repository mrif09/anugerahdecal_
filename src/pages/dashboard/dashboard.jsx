import React from "react";
import { Link, Outlet } from "react-router";
import decal from '../../assets/adecal1.png'
import { MaterialSymbolsLogout } from "../../assets/logoutIcon";
function Dashboard() {
    return (<>
        <div>
            <div className="flex justify-between items-center bg-green-800 p-4 text-white">
                <img src={decal} alt="" className="w-24 h-5" />
                <div className="flex gap-x-4">
                    <Link className="font-bold hover:opacity-60" to="/dashboard">Dashboard</Link>
                    <Link className="font-bold hover:opacity-60" to="/dashboard/product">Product</Link>
                    <Link className="font-bold hover:opacity-60" to="/dashboard/sales">Sales</Link>
                </div>
                <button><MaterialSymbolsLogout className='text-white hover:opacity-80' /></button>
            </div>
            <div className="container m-4">                
                <Outlet />
            </div>

        </div>

    </>);
}

export default Dashboard;