import { FormEvent, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import BrandLogo from "@/components/shared/BrandLogo";

export default function Login() {
  const { login, isAuthenticated, authLoading } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState("counselor_sara");
  const [password, setPassword] = useState("Counselor@123");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  if (!authLoading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      toast.success("Welcome back");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-border rounded-lg bg-card p-6 space-y-5">
        <div className="flex items-center justify-center">
          <BrandLogo variant="full" className="w-60" />
        </div>
        <h1 className="text-lg font-semibold text-center">Sign in to Tunisian Hope</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full h-10 px-3 text-sm border border-border rounded-md bg-background"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full h-10 px-3 text-sm border border-border rounded-md bg-background"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || authLoading}
            className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Demo accounts:</p>
          <p>- counselor_sara / Counselor@123</p>
          <p>- operator_nour / Operator@123</p>
          <p>- admin_karim / Admin@123</p>
        </div>
      </div>
    </div>
  );
}
