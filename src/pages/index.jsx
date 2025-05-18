import React, { useEffect } from "react";
import {  useNavigate } from "react-router";

function Index() {
    const navigate = useNavigate()
    useEffect(()=>{
        navigate('/dashboard')
    }, )

    return ( <></> );
}

export default Index;