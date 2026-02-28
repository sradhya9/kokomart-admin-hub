import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, Lock, ShieldCheck, ChefHat } from "lucide-react";

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn, signUp } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsLoading(true);
        try {
            if (isLogin) {
                await signIn(formData.email, formData.password);
                toast.success("Welcome back!");
            } else {
                await signUp(formData.email, formData.password);
                toast.success("Admin account created successfully");
            }
            navigate(from, { replace: true });
        } catch (error: any) {
            console.error("Auth error:", error);
            toast.error(error.message || "Authentication failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    return (
        <div className="flex min-h-screen" style={{ background: '#200f0f' }}>
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
                style={{ background: 'linear-gradient(160deg, #200f0f 0%, #63020c 60%, #8f0503 100%)' }}>
                {/* Decorative circles */}
                <div className="absolute top-[-80px] left-[-80px] h-64 w-64 rounded-full opacity-10"
                    style={{ background: '#fdf8e4' }} />
                <div className="absolute bottom-[-60px] right-[-60px] h-80 w-80 rounded-full opacity-5"
                    style={{ background: '#fdf8e4' }} />

                <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center">
                    {/* Logo Icon */}
                    <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl shadow-2xl ring-1 ring-white/10"
                        style={{ background: 'rgba(253,248,228,0.08)' }}>
                        <img src="/logo.png" alt="Meat Up" className="h-16 w-16 object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <ShieldCheck className="h-12 w-12 hidden" style={{ color: '#fdf8e4' }} />
                    </div>

                    <h1 className="mb-3 text-5xl font-extrabold tracking-tight"
                        style={{ color: '#fdf8e4' }}>
                        Meat Up
                    </h1>
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em]"
                        style={{ color: 'rgba(253,248,228,0.5)' }}>
                        Admin Dashboard
                    </p>
                    <div className="mt-6 h-px w-16 mx-auto" style={{ background: 'rgba(253,248,228,0.2)' }} />
                    <p className="mt-6 max-w-xs text-sm leading-relaxed"
                        style={{ color: 'rgba(253,248,228,0.6)' }}>
                        Manage your products, orders, and operations from one powerful and secure platform.
                    </p>

                    {/* Feature pills */}
                    <div className="mt-10 flex flex-wrap gap-2 justify-center">
                        {['Orders', 'Products', 'Analytics', 'Users'].map((feat) => (
                            <span key={feat} className="rounded-full border px-3 py-1 text-xs font-medium"
                                style={{ borderColor: 'rgba(253,248,228,0.15)', color: 'rgba(253,248,228,0.6)' }}>
                                {feat}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right side - Auth Form */}
            <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2"
                style={{ background: '#fdf8e4' }}>
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile logo */}
                    <div className="flex lg:hidden items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                            style={{ background: '#63020c' }}>
                            <ChefHat className="h-5 w-5" style={{ color: '#fdf8e4' }} />
                        </div>
                        <span className="text-lg font-bold" style={{ color: '#200f0f' }}>Meat Up Admin</span>
                    </div>

                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: '#200f0f' }}>
                            {isLogin ? "Sign in" : "Create admin"}
                        </h2>
                        <p className="mt-2 text-sm" style={{ color: '#200f0f99' }}>
                            {isLogin
                                ? "Enter your admin credentials to access the dashboard"
                                : "Register a new administrator account"}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold" style={{ color: '#200f0f' }}>
                                Email address
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                                    style={{ color: '#63020c' }} />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="pl-10 h-11 rounded-xl border-2 bg-white focus-visible:ring-0 focus-visible:border-primary transition-colors"
                                    style={{ borderColor: 'rgba(99,2,12,0.2)', color: '#200f0f' }}
                                    placeholder="admin@meatup.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-semibold" style={{ color: '#200f0f' }}>
                                Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                                    style={{ color: '#63020c' }} />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                    required
                                    className="pl-10 h-11 rounded-xl border-2 bg-white focus-visible:ring-0 focus-visible:border-primary transition-colors"
                                    style={{ borderColor: 'rgba(99,2,12,0.2)', color: '#200f0f' }}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] shadow-lg"
                            style={{ background: 'linear-gradient(135deg, #63020c, #8f0503)', color: '#fdf8e4' }}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Please wait...
                                </>
                            ) : isLogin ? (
                                "Sign In"
                            ) : (
                                "Create Admin Account"
                            )}
                        </Button>
                    </form>

                    <div className="text-center">
                        <button
                            type="button"
                            className="text-sm font-semibold transition-colors hover:opacity-70"
                            style={{ color: '#63020c' }}
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setFormData({ email: "", password: "" });
                            }}
                            disabled={isLoading}
                        >
                            {isLogin
                                ? "Need an admin account? Sign up →"
                                : "Already have an account? Sign in →"}
                        </button>
                    </div>

                    <p className="text-center text-xs" style={{ color: '#20100f80' }}>
                        Access restricted to authorized administrators only
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
