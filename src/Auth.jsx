import {react,useState,useEffect, use} from 'react'
import SignIn from './components/auth/SignIn.jsx';
import { supabase } from './lib/supabase.js';
import Wellcome from './components/auth/Wellcome.jsx';
import Register from './components/auth/Register.jsx';
import {useAuthStore} from './lib/store.js';

const Auth = () => {
    const currentState = useAuthStore((state) => state.currentState);
    const setcurrentState = useAuthStore((state) => state.setcurrentState);
    useEffect(() => {
        const session = supabase.auth.getSession();
        if (!session) {
            setcurrentState('Login');
        } else {
            setcurrentState('Authorized');
        }
    },[]);
    if (currentState === 'Login'){
        return <SignIn/>;
    }
    else if (currentState === 'Authorized'){
        return <Wellcome/>;
    }
    else{
        return <Register/>;
    }
};

export default Auth;