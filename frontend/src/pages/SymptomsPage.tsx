import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StickyNote, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Input";
import { EmptyState, Spinner } from "@/components/ui/Badge";

const SYMPTOM_PRESETS = ["Headache", "Fatigue", "Nausea", "Dizziness", "Chest pain", "Insomnia"];

function severityColor(severity: number) {
  if (severity <= 3) return "bg-green-100 text-green-700";
  if (severity <= 6) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export default function SymptomsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState("");

  const { data: symptoms, isLoading } = useQuery({
    queryKey: ["symptoms"],
    queryFn: api.symptoms,
  });

  const createMutation = useMutation({
    mutationFn: api.createSymptom,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["symptoms"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setName("");
      setSeverity(5);
      setNotes("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteSymptom,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["symptoms"] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ name, severity, notes: notes || undefined });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Symptom Diary</h1>
        <p className="text-slate-500">Track how you feel over time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Log Symptom</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Symptom</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
                <div className="flex flex-wrap gap-2 mt-2">
                  {SYMPTOM_PRESETS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setName(s)}
                      className="text-xs px-2 py-1 rounded-full bg-clinical-50 text-clinical-700 hover:bg-clinical-100"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Severity: {severity}/10</Label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={severity}
                  onChange={(e) => setSeverity(parseInt(e.target.value))}
                  className="w-full mt-2 accent-clinical-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Mild</span>
                  <span>Severe</span>
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                Log Symptom
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Spinner />
            ) : !symptoms?.length ? (
              <EmptyState
                icon={StickyNote}
                title="No symptoms logged"
                description="Track symptoms to help your AI assistant prepare for doctor visits"
              />
            ) : (
              <div className="space-y-3">
                {symptoms.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50"
                    style={{
                      borderLeft: `4px solid ${s.severity <= 3 ? "#22C55E" : s.severity <= 6 ? "#F59E0B" : "#EF4444"}`,
                    }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{s.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${severityColor(s.severity)}`}>
                          {s.severity}/10
                        </span>
                      </div>
                      {s.notes && <p className="text-sm text-slate-500 mt-1">{s.notes}</p>}
                      <p className="text-xs text-slate-400 mt-1">{formatDateTime(s.recorded_at)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(s.id)}>
                      <Trash2 className="h-4 w-4 text-slate-400" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
