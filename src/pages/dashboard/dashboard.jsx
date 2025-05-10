import React, { useState } from "react";
import { Link, NavLink, Outlet } from "react-router";
import decal from '../../assets/adecal1.png'
import { MaterialSymbolsLogout } from "../../assets/logoutIcon";
import { LogOut, Menu, X } from "lucide-react";
import { signOut } from "@firebase/auth";
import { auth } from "../../firebase";
function Dashboard() {
    const [openMenu, setOpenMenu] = useState(false)

    return (<>
        <div>
            <div className="flex justify-between items-center bg-green-800 p-4 text-white">
                <button className="sm:hidden hover:opacity-60" onClick={() => { setOpenMenu(true) }}>
                    <Menu />
                </button>
                <img src={decal} alt="" className="w-24 h-5" />
                <div className="hidden sm:flex gap-x-4">
                    <NavLink end className={({ isActive }) => isActive ? 'font-bold' : 'opacity-60 font-bold hover:opacity-100'} to="/dashboard">Dashboard</NavLink>
                    <NavLink end className={({ isActive }) => isActive ? 'font-bold' : 'opacity-60 font-bold hover:opacity-100'} to="/dashboard/product">Product</NavLink>
                    <NavLink end className={({ isActive }) => isActive ? 'font-bold' : 'opacity-60 font-bold hover:opacity-100'} to="/dashboard/sales">Sales</NavLink>
                </div>
                {
                    openMenu ?
                        <div className="sm:hidden absolute top-0 left-0 bg-green-800 p-4 w-full flex flex-col gap-y-2 h-screen">
                            <button onClick={() => { setOpenMenu(false) }} className="justify-end flex hover:opacity-60">
                                <X />
                            </button>
                            <NavLink end className={({ isActive }) => isActive ? 'font-bold' : 'opacity-60 font-bold hover:opacity-100'} to="/dashboard">Dashboard</NavLink>
                            <NavLink end className={({ isActive }) => isActive ? 'font-bold' : 'opacity-60 font-bold hover:opacity-100'} to="/dashboard/product">Product</NavLink>
                            <NavLink end className={({ isActive }) => isActive ? 'font-bold' : 'opacity-60 font-bold hover:opacity-100'} to="/dashboard/sales">Sales</NavLink>
                        </div>
                        : <></>
                }
                <button className="hover:opacity-60" onClick={() => { signOut(auth) }}>
                    <LogOut />
                </button>
            </div>
            <div className="container m-4">
                <Outlet />
            </div>

        </div>

    </>);
}

export default Dashboard;