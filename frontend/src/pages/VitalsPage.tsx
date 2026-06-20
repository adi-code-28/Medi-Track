import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { Activity, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatDateTime, statusStripClass } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Badge, EmptyState, Spinner } from "@/components/ui/Badge";

const VITAL_TYPES = [
  { value: "blood_pressure", label: "Blood Pressure", unit: "mmHg", hasSecondary: true },
  { value: "blood_sugar", label: "Blood Sugar", unit: "mg/dL", hasSecondary: false },
  { value: "temperature", label: "Temperature", unit: "°C", hasSecondary: false },
  { value: "weight", label: "Weight", unit: "kg", hasSecondary: false },
  { value: "spo2", label: "SpO2", unit: "%", hasSecondary: false },
  { value: "pulse", label: "Pulse", unit: "bpm", hasSecondary: false },
];

export default function VitalsPage() {
  const qc = useQueryClient();
  const [type, setType] = useState("blood_pressure");
  const [value, setValue] = useState("");
  const [valueSecondary, setValueSecondary] = useState("");
  const [notes, setNotes] = useState("");

  const selected = VITAL_TYPES.find((t) => t.value === type)!;

  const { data: vitals, isLoading } = useQuery({
    queryKey: ["vitals"],
    queryFn: () => api.vitals(),
  });

  const createMutation = useMutation({
    mutationFn: api.createVital,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vitals"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setValue("");
      setValueSecondary("");
      setNotes("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteVital,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vitals"] }),
  });

  const bpData = (vitals || [])
    .filter((v) => v.type === "blood_pressure")
    .reverse()
    .map((v) => ({
      date: new Date(v.recorded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      systolic: v.value,
      diastolic: v.value_secondary,
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      type,
      value: parseFloat(value),
      value_secondary: valueSecondary ? parseFloat(valueSecondary) : undefined,
      unit: selected.unit,
      notes: notes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Vitals</h1>
        <p className="text-slate-500">Log and track your health measurements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Log Vital</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Type</Label>
                <Select value={type} onChange={(e) => setType(e.target.value)} className="mt-1">
                  {VITAL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>{selected.hasSecondary ? "Systolic" : "Value"}</Label>
                <Input
                  type="number"
                  step="any"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              {selected.hasSecondary && (
                <div>
                  <Label>Diastolic</Label>
                  <Input
                    type="number"
                    step="any"
                    value={valueSecondary}
                    onChange={(e) => setValueSecondary(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              )}
              <div>
                <Label>Notes (optional)</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Saving..." : "Save Vital"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Blood Pressure Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {bpData.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No BP readings yet"
                description="Log your first blood pressure reading to see trends"
              />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={bpData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[60, 160]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <ReferenceArea y1={90} y2={120} fill="#22C55E" fillOpacity={0.08} />
                  <Line type="monotone" dataKey="systolic" stroke="#0D9488" strokeWidth={2} dot />
                  <Line type="monotone" dataKey="diastolic" stroke="#64748B" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Readings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Spinner />
          ) : !vitals?.length ? (
            <EmptyState
              icon={Activity}
              title="No vitals logged"
              description="Start tracking your health measurements"
            />
          ) : (
            <div className="space-y-2">
              {vitals.map((v) => (
                <div
                  key={v.id}
                  className={`flex items-center justify-between p-4 rounded-lg bg-slate-50 ${statusStripClass(v.status)}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">
                        {v.type.replace(/_/g, " ")}
                      </span>
                      <Badge
                        variant={
                          v.status === "critical"
                            ? "critical"
                            : v.status === "warning"
                              ? "warning"
                              : "success"
                        }
                      >
                        {v.status}
                      </Badge>
                    </div>
                    <p className="text-lg font-semibold mt-1">
                      {v.value_secondary != null ? `${v.value}/${v.value_secondary}` : v.value}{" "}
                      {v.unit}
                    </p>
                    <p className="text-xs text-slate-500">{formatDateTime(v.recorded_at)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(v.id)}
                  >
                    <Trash2 className="h-4 w-4 text-slate-400" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
