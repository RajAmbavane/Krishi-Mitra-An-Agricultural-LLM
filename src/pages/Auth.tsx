
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-green-200/30 rounded-full"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-emerald-200/20 rounded-full"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-green-300/25 rounded-full"></div>
        <div className="absolute bottom-40 right-10 w-16 h-16 bg-emerald-300/30 rounded-full"></div>
      </div>
      
      <div className="w-full max-w-md relative">
        {/* Main auth card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-green-100 overflow-hidden">
          {/* Header section */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wheat size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">KRISHI MITRA</h1>
            <p className="mt-2 text-green-100">
              Your Agricultural Assistant
            </p>
          </div>

          {/* Form section */}
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {isLogin ? "Welcome Back" : "Join Our Community"}
              </h2>
              <p className="text-gray-600 mt-2">
                {isLogin 
                  ? "Continue your agricultural journey" 
                  : "Start your smart farming experience"
                }
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email Address
                  </Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-12 border-green-300 focus:border-green-500 focus:ring-green-500 bg-white"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-gray-700 font-medium">
                    Password
                  </Label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 h-12 border-green-300 focus:border-green-500 focus:ring-green-500 bg-white"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium shadow-lg transition-all"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Wheat className="h-5 w-5 animate-pulse" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Leaf size={18} />
                    <span>{isLogin ? "Sign In" : "Create Account"}</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-green-600 hover:text-green-800 font-medium transition-colors"
              >
                {isLogin
                  ? "New to Krishi Mitra? Create an account"
                  : "Already have an account? Sign in"}
              </button>
            </div>

            {/* Features highlight */}
            <div className="mt-8 pt-6 border-t border-green-100">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <Wheat size={20} className="text-green-600" />
                  </div>
                  <span className="text-xs text-gray-600">Crop Guidance</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                    <Leaf size={20} className="text-green-600" />
                  </div>
                  <span className="text-xs text-gray-600">Expert Advice</span>
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
