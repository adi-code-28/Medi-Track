import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Pill, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Badge, EmptyState, Spinner } from "@/components/ui/Badge";

export default function MedicinesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [instructions, setInstructions] = useState("");
  const [reminderTimes, setReminderTimes] = useState("08:00,20:00");

  const { data: medicines, isLoading } = useQuery({
    queryKey: ["medicines"],
    queryFn: api.medicines,
  });

  const createMutation = useMutation({
    mutationFn: api.createMedicine,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medicines"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setName("");
      setDosage("");
      setFrequency("");
      setInstructions("");
    },
  });

  const logMutation = useMutation({
    mutationFn: api.logMedicine,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: api.toggleMedicine,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicines"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteMedicine,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medicines"] }),
  });

  const requestNotification = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const markTaken = (medicineId: number, medName: string) => {
    logMutation.mutate({
      medicine_id: medicineId,
      scheduled_at: new Date().toISOString(),
      status: "taken",
    });
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("MediTrack", { body: `Marked ${medName} as taken` });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      dosage,
      frequency,
      instructions: instructions || undefined,
      reminder_times: reminderTimes,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Medicines</h1>
          <p className="text-slate-500">Manage medications and track adherence</p>
        </div>
        <Button variant="secondary" size="sm" onClick={requestNotification}>
          <Bell className="h-4 w-4" />
          Enable reminders
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Medicine</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
              </div>
              <div>
                <Label>Dosage</Label>
                <Input
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="500mg"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Frequency</Label>
                <Input
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="Twice daily"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Reminder times</Label>
                <Input
                  value={reminderTimes}
                  onChange={(e) => setReminderTimes(e.target.value)}
                  placeholder="08:00,20:00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Instructions</Label>
                <Input
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                Add Medicine
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <Spinner />
          ) : !medicines?.length ? (
            <Card>
              <CardContent>
                <EmptyState
                  icon={Pill}
                  title="No medicines yet"
                  description="Add manually or scan a prescription to get started"
                />
              </CardContent>
            </Card>
          ) : (
            medicines.map((med) => (
              <Card
                key={med.id}
                className={med.is_active ? "status-strip-normal" : "opacity-60 border-l-4 border-l-slate-300"}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{med.name}</h3>
                        {!med.is_active && <Badge>Paused</Badge>}
                      </div>
                      <p className="text-slate-600 mt-1">
                        {med.dosage} · {med.frequency}
                      </p>
                      {med.instructions && (
                        <p className="text-sm text-slate-500 mt-1">{med.instructions}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                        <Bell className="h-3 w-3" />
                        Reminders: {med.reminder_times}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {med.is_active && (
                        <>
                          <Button size="sm" onClick={() => markTaken(med.id, med.name)}>
                            <Check className="h-4 w-4" />
                            Taken
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              logMutation.mutate({
                                medicine_id: med.id,
                                scheduled_at: new Date().toISOString(),
                                status: "missed",
                              })
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => toggleMutation.mutate(med.id)}
                      >
                        {med.is_active ? "Pause" : "Resume"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(med.id)}
                      >
                        <Trash2 className="h-4 w-4 text-slate-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
