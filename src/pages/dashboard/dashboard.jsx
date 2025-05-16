import { signOut } from "@firebase/auth";
import { LogOut } from "lucide-react";
import { NavLink, Outlet } from "react-router";
import decal from '../../assets/adecal1.png';
import { auth } from "../../firebase";

function Dashboard() {

    return (<>
    <div className="flex">

        <div className="flex h-screen w-fit flex-col  items-center bg-green-800 p-4 py-12 text-white">
         
            <img src={decal} alt="" className="w-24 h-5 mb-12" />
            <div className="flex gap-y-4 flex-col px-8">
                <NavLink end className={({ isActive }) => isActive ? 'font-bold' : 'opacity-60 font-bold hover:opacity-100'} to="/dashboard">Dashboard</NavLink>
                <NavLink end className={({ isActive }) => isActive ? 'font-bold' : 'opacity-60 font-bold hover:opacity-100'} to="/dashboard/product">Product</NavLink>
                <NavLink end className={({ isActive }) => isActive ? 'font-bold' : 'opacity-60 font-bold hover:opacity-100'} to="/dashboard/merk">Merk</NavLink>
                <NavLink end className={({ isActive }) => isActive ? 'font-bold' : 'opacity-60 font-bold hover:opacity-100'} to="/dashboard/model">Model</NavLink>
                <NavLink end className={({ isActive }) => isActive ? 'font-bold' : 'opacity-60 font-bold hover:opacity-100'} to="/dashboard/category">Kategori</NavLink>
                <NavLink end className={({ isActive }) => isActive ? 'font-bold' : 'opacity-60 font-bold hover:opacity-100'} to="/dashboard/bahan">Bahan</NavLink>
                <NavLink end className={({ isActive }) => isActive ? 'font-bold' : 'opacity-60 font-bold hover:opacity-100'} to="/dashboard/laminating">Laminasi</NavLink>
                <NavLink end className={({ isActive }) => isActive ? 'font-bold' : 'opacity-60 font-bold hover:opacity-100'} to="/dashboard/customer">Customer</NavLink>
                <NavLink end className={({ isActive }) => isActive ? 'font-bold' : 'opacity-60 font-bold hover:opacity-100'} to="/dashboard/transaksi">Transaksi</NavLink>
            </div>

            
            <div className="flex h-screen justify-end items-end">
                <button className="font-bold hover:opacity-60 " onClick={() => { signOut(auth) }}>
                    <LogOut />
                </button>
            </div>
        </div>
        <div className="flex flex-1 container m-4">
            <Outlet />
        </div>
    </div>

    </>);
}

export default Dashboard;