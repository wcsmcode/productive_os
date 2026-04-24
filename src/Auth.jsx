import {react,useState,useEffect} from 'react'
import SignIn from './components/auth/SignIn.jsx';
import { supabase } from './lib/supabase.js';

const Auth = () => {
    useEffect(() => {
        const session = supabase.auth.session();
        if (!session) {
            return <SignIn />;
        }
    },[])
}