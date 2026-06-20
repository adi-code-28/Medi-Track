import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Disclaimer } from "@/components/Layout";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail("demo@meditrack.app");
    setPassword("demo123");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-clinical-50 to-clinical-100">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-clinical-600 items-center justify-center mb-4">
            <Heart className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-clinical-700">Welcome to MediTrack</h1>
          <p className="text-slate-500 mt-1">Your AI-powered health companion</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Track vitals, medicines, and health insights</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="mt-1"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <Button variant="secondary" className="w-full" onClick={fillDemo} type="button">
                Use demo account
              </Button>
              <p className="text-xs text-slate-500 text-center mt-2">
                demo@meditrack.app / demo123
              </p>
            </div>

            <p className="text-sm text-center text-slate-500 mt-4">
              No account?{" "}
              <Link to="/register" className="text-clinical-600 font-medium hover:underline">
                Register
              </Link>
            </p>
          </CardContent>
        </Card>

        <Disclaimer />
      </div>
    </div>
  );
}
