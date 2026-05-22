// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Chỉ tạo 1 instance duy nhất và export nó ra
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const AuthService = {
    // Đăng ký
    async signUp(email, password, fullName) {
        // Input validation
        if (!email || !password || !fullName) {
            throw new Error('Email, password, and full name are required');
        }
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { display_name: fullName }
            }
        });
        if (error) throw error;
        return data;
    },

    // Đăng nhập
    async signIn(email, password) {
        // Input validation
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },

    // Lấy thông tin user hiện tại
    async getCurrentUser() {
        try {
            const { data: { user } } = await supabase.auth.getUser();        
            
            if (user) {
                // 2. Lấy display_name từ bảng profiles
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('display_name')
                    .eq('id', user.id)
                    .single();
        
                if (profileData) {
                    return {
                        name: profileData.display_name || 'User',
                        avatar: (profileData.display_name || 'U').charAt(0).toUpperCase(),
                        userEmail: user.email // Lấy email trực tiếp từ object auth user
                    };
                }
            }    
        } catch (err) {
            console.error('Failed to get current user:', err);
            return null;
        }
    },

    async getSession() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            return session;
        } catch (err) {
            console.error('Failed to get session:', err);
            return null;
        }
    },
};