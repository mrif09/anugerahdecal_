import { signOut } from '@firebase/auth';
import clsx from 'clsx';
import { Home, LogOut, Menu, Package, ReceiptText, ShoppingCart, Users } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router';
import decal from '../../assets/adecal1.png';
import Navlink from '../../components/navlink';
import { auth } from '../../lib/firebase';

const links = [
    { to: '/dashboard/product', text: 'Product', icon: <Package /> },
    { to: '/dashboard/product-details', text: 'Product Details', icon: <ReceiptText /> },
    { to: '/dashboard/customer', text: 'Customer', icon: <Users /> },
    { to: '/dashboard/transaksi', text: 'Transaksi', icon: <ShoppingCart /> },
]

function Dashboard() {
    const [minimize, setMinimize] = useState(true)
    return (<>
        <div className="flex">
            <div className="flex h-screen w-fit flex-col  items-center bg-green-800 p-6 py-12 text-white">
                <div className="flex w-full h-5 gap-x-2 mb-12 items-center">
                    <Menu onClick={() => setMinimize(!minimize)} className="hover:opacity-100 opacity-60" />
                    <img src={decal} alt="logo" className={clsx('w-20', { 'hidden': minimize })} />
                </div>
                <div className="flex gap-y-8 flex-col ">
                    <Navlink end={true} to={'/dashboard'}>
                        <Home />
                        <span className={clsx({ 'hidden': minimize })}>
                            Dashboard
                        </span>
                    </Navlink>
                    {
                        links.map(data => (
                            <Navlink key={data.text} to={data.to}>
                                {data.icon}
                                <span className={clsx({ 'hidden': minimize })}>
                                    {data.text}
                                </span>
                            </Navlink>
                        ))
                    }
                </div>

                <div className="flex h-screen justify-start w-full items-end">
                    <button className="flex gap-4 font-bold hover:opacity-100 opacity-60 " onClick={() => { signOut(auth) }}>
                        <LogOut />
                        <span className={clsx({ 'hidden': minimize },)}>
                            Logout
                        </span>
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