import React, { useState } from 'react'; // Sửa lỗi viết hoa chữ 'React'
import { supabase } from '/src/lib/supabase'; // Chỉ cần dùng instance supabase
import { useAuthStore } from '/src/lib/store.js';

const Register = () => {
    const setcurrentState = useAuthStore((state) => state.setcurrentState);

    // 1. Tạo các state để lưu thông tin nhập từ Form
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // 2. Hàm xử lý đăng ký (Deploy Identity)
    const handleRegister = async (e) => {
        e.preventDefault(); // Chặn việc load lại trang của form mặc định
        
        if (!fullName || !email || !password) {
            alert("PROTOCOL_ERROR: Toàn bộ thông tin không được để trống.");
            return;
        }

        setLoading(true);

        try {
            // Bước A: Đăng ký tài khoản vào hệ thống Auth Supabase
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
            });

            if (authError) throw authError;

            // Bước B: Nếu đăng ký Auth thành công, lấy user.id ghi đè profile sang bảng 'profiles'
            if (authData?.user) {
                // Use upsert to avoid unique constraint errors if a profile already exists
                const { error: profileError } = await supabase
                    .from('profiles') // Ensure table name matches your DB
                    .upsert([
                        {
                            id: authData.user.id, // Use Auth user id as profile id
                            display_name: fullName,
                            updated_at: new Date().toISOString(),
                        }
                    ]);

                if (profileError) throw profileError;

                alert("IDENTITY_DEPLOYED: Đăng ký thành công! Hãy kiểm tra Email để xác thực (nếu bật định cấu hình xác thực) hoặc tiến hành đăng nhập.");
                
                // Đăng ký xong tự động đá trạng thái về màn hình đăng nhập
                setcurrentState('Login');
            }

        } catch (error) {
            alert(`SYSTEM_FAILURE: ${error.message}`);
        } finally {
            setcurrentState('Login'); // Đảm bảo luôn chuyển về Login sau khi xử lý
        }
    };

    return (
        <div className="paper-bg text-[#2A2820] font-sans h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full">
                <div className="mb-12 text-center">
                    <div className="inline-block w-12 h-12 bg-[#2A2820] rounded mb-6 flex items-center justify-center">
                        <div className="w-2 h-2 bg-[#D8D1B4] animate-pulse"></div>
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Create New Identity</h1>
                    <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Protocol: User_Initialization_v1</p>
                </div>

                {/* Bỏ action="#", thay bằng onSubmit={handleRegister} */}
                <form onSubmit={handleRegister} className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest">Full Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Marcus Aurelius" 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-transparent border-2 border-[#2A2820]/10 rounded-xl px-5 py-4 text-sm font-bold outline-none focus:border-[#4A5D4E] transition-all"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest">Architecture ID (Email)</label>
                        <input 
                            type="email" 
                            placeholder="dev@productive-os.com" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-transparent border-2 border-[#2A2820]/10 rounded-xl px-5 py-4 text-sm font-bold outline-none focus:border-[#4A5D4E] transition-all"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase opacity-40 ml-2 tracking-widest">Access Key (Password)</label>
                        <input 
                            type="password" 
                            placeholder="••••••••••••" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-transparent border-2 border-[#2A2820]/10 rounded-xl px-5 py-4 text-sm font-bold outline-none focus:border-[#4A5D4E] transition-all"
                        />
                    </div>

                    <div className="pt-4">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-[#2A2820] text-[#D8D1B4] py-5 rounded-xl font-black text-xs uppercase tracking-[0.3em] hover:bg-[#4A5D4E] transition-all shadow-lg disabled:opacity-50"
                        >
                            {loading ? 'DEPLOYING...' : 'Deploy Identity'}
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">
                        Already registered? <a onClick={() => setcurrentState('Login')} className="text-[#2A2820] underline font-black hover:cursor-pointer">Authorize Session</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;