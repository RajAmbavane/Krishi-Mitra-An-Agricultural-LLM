import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Wheat, Leaf, Mail, Lock } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        if (data.user) {
          toast.success("Welcome back to Krishi Mitra!");
          navigate("/");
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) throw error;
        if (data.user) {
          toast.success("Welcome to Krishi Mitra! Your agricultural journey begins now.");
          navigate("/");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-6">
      {/* Background decorative elements with better spacing */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 left-16 w-24 h-24 bg-green-200/30 rounded-full"></div>
        <div className="absolute top-48 right-24 w-36 h-36 bg-emerald-200/20 rounded-full"></div>
        <div className="absolute bottom-24 left-1/3 w-28 h-28 bg-green-300/25 rounded-full"></div>
        <div className="absolute bottom-48 right-16 w-20 h-20 bg-emerald-300/30 rounded-full"></div>
      </div>
      
      <div className="w-full max-w-lg relative">
        {/* Main auth card with enhanced padding */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-green-100 overflow-hidden">
          {/* Header section with better spacing */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-10 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Wheat size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">KRISHI MITRA</h1>
            <p className="mt-3 text-green-100 text-lg">
              Your Agricultural Assistant
            </p>
          </div>

          {/* Form section with enhanced padding */}
          <div className="p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">
                {isLogin ? "Welcome Back" : "Join Our Community"}
              </h2>
              <p className="text-gray-600 mt-3 text-lg">
                {isLogin 
                  ? "Continue your agricultural journey" 
                  : "Start your smart farming experience"
                }
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <Label htmlFor="email" className="text-gray-700 font-semibold text-base">
                    Email Address
                  </Label>
                  <div className="relative mt-3">
                    <Mail className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-12 h-14 border-2 border-green-300 focus:border-green-500 focus:ring-green-500 bg-white rounded-2xl text-base"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-gray-700 font-semibold text-base">
                    Password
                  </Label>
                  <div className="relative mt-3">
                    <Lock className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-12 h-14 border-2 border-green-300 focus:border-green-500 focus:ring-green-500 bg-white rounded-2xl text-base"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg transition-all duration-200 rounded-2xl text-base"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-3">
                    <Wheat className="h-6 w-6 animate-pulse" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Leaf size={20} />
                    <span>{isLogin ? "Sign In" : "Create Account"}</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center mt-8">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-green-600 hover:text-green-800 font-semibold transition-colors duration-200 text-base"
              >
                {isLogin
                  ? "New to Krishi Mitra? Create an account"
                  : "Already have an account? Sign in"}
              </button>
            </div>

            {/* Features highlight with better spacing */}
            <div className="mt-10 pt-8 border-t border-green-100">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-3 shadow-sm">
                    <Wheat size={24} className="text-green-600" />
                  </div>
                  <span className="text-sm text-gray-600 font-medium">Crop Guidance</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-3 shadow-sm">
                    <Leaf size={24} className="text-green-600" />
                  </div>
                  <span className="text-sm text-gray-600 font-medium">Expert Advice</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
