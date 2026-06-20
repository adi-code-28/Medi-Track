import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Copy, ExternalLink, Save, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    age: "",
    blood_group: "",
    conditions: "",
    allergies: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        age: user.age?.toString() || "",
        blood_group: user.blood_group || "",
        conditions: user.conditions || "",
        allergies: user.allergies || "",
        emergency_contact_name: user.emergency_contact_name || "",
        emergency_contact_phone: user.emergency_contact_phone || "",
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: api.updateMe,
    onSuccess: () => refreshUser(),
  });

  const sosUrl = user ? `${window.location.origin}/sos/${user.id}` : "";

  const copySos = () => {
    navigator.clipboard.writeText(sosUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      full_name: form.full_name,
      age: form.age ? parseInt(form.age) : undefined,
      blood_group: form.blood_group || undefined,
      conditions: form.conditions || undefined,
      allergies: form.allergies || undefined,
      emergency_contact_name: form.emergency_contact_name || undefined,
      emergency_contact_phone: form.emergency_contact_phone || undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Profile</h1>
        <p className="text-slate-500">Manage your health profile and emergency info</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Profile</CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Full name</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Age</Label>
                <Input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Blood group</Label>
                <Input
                  value={form.blood_group}
                  onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
                  placeholder="B+"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Conditions</Label>
              <Textarea
                value={form.conditions}
                onChange={(e) => setForm({ ...form, conditions: e.target.value })}
                placeholder="Hypertension, Diabetes..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Allergies</Label>
              <Textarea
                value={form.allergies}
                onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                placeholder="Penicillin..."
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Emergency contact name</Label>
                <Input
                  value={form.emergency_contact_name}
                  onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Emergency contact phone</Label>
                <Input
                  value={form.emergency_contact_phone}
                  onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-red-100">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            <CardTitle>Emergency SOS Card</CardTitle>
          </div>
          <CardDescription>
            Shareable read-only link for first responders — no login required
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input value={sosUrl} readOnly className="text-xs" />
            <Button variant="secondary" onClick={copySos}>
              <Copy className="h-4 w-4" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <a href={sosUrl} target="_blank" rel="noreferrer">
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-4 w-4" />
              Preview SOS card
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
