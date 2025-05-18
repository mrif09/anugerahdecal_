import clsx from "clsx";
import { NavLink as RNavlink } from "react-router";

function Navlink({to='',className='', children}) {
    return (<RNavlink  className={({ isActive }) =>
        clsx(className,"flex font-bold gap-x-2", { "opacity-60 hover:opacity-100": !isActive })} to={to}>
        {children}
    </RNavlink>);
}

export default Navlink;