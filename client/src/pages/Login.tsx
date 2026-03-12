import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { authAPI } from "@/lib/api";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("メールアドレスとパスワードを入力してください");
      return;
    }

    setIsLoading(true);
    try {
      const response = isSignUp
        ? await authAPI.register(email, password)
        : await authAPI.login(email, password);

      localStorage.setItem("auth_token", response.data.token);
      localStorage.setItem("user_email", response.data.user.email);
      localStorage.setItem("user_id", response.data.user.id.toString());

      toast.success(isSignUp ? "アカウントを作成しました" : "ログインしました");
      setLocation("/dashboard");
    } catch (error: any) {
      const message = error.response?.data?.error || "エラーが発生しました";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-200 shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-slate-900">
            {isSignUp ? "アカウント作成" : "ログイン"}
          </CardTitle>
          <CardDescription className="text-slate-600">
            {isSignUp
              ? "新しいアカウントを作成してください"
              : "判断資産管理システムにログイン"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">メールアドレス</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="border-slate-300"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">パスワード</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="border-slate-300"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isLoading ? "処理中..." : isSignUp ? "アカウント作成" : "ログイン"}
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {isSignUp ? "ログインページへ" : "アカウント作成"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
