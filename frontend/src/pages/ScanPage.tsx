import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Camera, Check, Edit2, ScanLine, Upload } from "lucide-react";
import { api, type ExtractedMedicine, type PrescriptionOCRResult } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Badge, Spinner } from "@/components/ui/Badge";

export default function ScanPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<PrescriptionOCRResult | null>(null);
  const [medicines, setMedicines] = useState<ExtractedMedicine[]>([]);
  const [step, setStep] = useState<"upload" | "review" | "done">("upload");

  const scanMutation = useMutation({
    mutationFn: api.scanPrescription,
    onSuccess: (data) => {
      setResult(data);
      setMedicines(data.medicines);
      setStep("review");
    },
  });

  const confirmMutation = useMutation({
    mutationFn: api.confirmPrescription,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medicines"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setStep("done");
    },
  });

  const handleFile = (file: File) => {
    setPreview(URL.createObjectURL(file));
    scanMutation.mutate(file);
  };

  const updateMedicine = (index: number, field: keyof ExtractedMedicine, value: string) => {
    setMedicines((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Scan Prescription</h1>
        <p className="text-slate-500">
          Upload a prescription photo — AI extracts medicines and creates reminders
        </p>
      </div>

      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5 text-clinical-600" />
              Upload Prescription
            </CardTitle>
            <CardDescription>Supports printed and handwritten prescriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              className="border-2 border-dashed border-clinical-500/30 rounded-xl p-12 text-center cursor-pointer hover:bg-clinical-50 transition-colors"
            >
              {scanMutation.isPending ? (
                <div className="flex flex-col items-center gap-3">
                  <Spinner className="h-10 w-10" />
                  <p className="text-slate-600">Analyzing prescription with AI...</p>
                </div>
              ) : preview ? (
                <img src={preview} alt="Prescription" className="max-h-64 mx-auto rounded-lg" />
              ) : (
                <>
                  <Upload className="h-12 w-12 text-clinical-500/50 mx-auto mb-4" />
                  <p className="font-medium text-slate-700">Drop prescription image here</p>
                  <p className="text-sm text-slate-500 mt-1">or click to browse</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {scanMutation.isError && (
              <p className="text-red-600 text-sm mt-4">
                {scanMutation.error instanceof Error ? scanMutation.error.message : "Scan failed"}
              </p>
            )}
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <Camera className="h-4 w-4" />
              Tip: Good lighting and flat photo improve OCR accuracy
            </div>
          </CardContent>
        </Card>
      )}

      {step === "review" && result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Review Extracted Medicines</CardTitle>
              <Badge
                variant={
                  result.confidence === "high"
                    ? "success"
                    : result.confidence === "medium"
                      ? "warning"
                      : "critical"
                }
              >
                {result.confidence} confidence
              </Badge>
            </div>
            {result.doctor_name && (
              <CardDescription>Prescribed by {result.doctor_name}</CardDescription>
            )}
            {result.raw_notes && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                {result.raw_notes}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {medicines.length === 0 ? (
              <p className="text-slate-500">No medicines detected. Try a clearer photo.</p>
            ) : (
              medicines.map((med, i) => (
                <div key={i} className="p-4 rounded-lg bg-slate-50 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-clinical-600">
                    <Edit2 className="h-4 w-4" />
                    Edit before confirming
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Medicine</Label>
                      <Input
                        value={med.name}
                        onChange={(e) => updateMedicine(i, "name", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Dosage</Label>
                      <Input
                        value={med.dosage}
                        onChange={(e) => updateMedicine(i, "dosage", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Frequency</Label>
                      <Input
                        value={med.frequency}
                        onChange={(e) => updateMedicine(i, "frequency", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Instructions</Label>
                      <Input
                        value={med.instructions || ""}
                        onChange={(e) => updateMedicine(i, "instructions", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => confirmMutation.mutate(medicines)}
                disabled={!medicines.length || confirmMutation.isPending}
              >
                <Check className="h-4 w-4" />
                Confirm & Add Reminders
              </Button>
              <Button variant="secondary" onClick={() => setStep("upload")}>
                Scan again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "done" && (
        <Card className="text-center py-12">
          <CardContent>
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold">Medicines added!</h2>
            <p className="text-slate-500 mt-2">Reminders have been created for your medications</p>
            <Button className="mt-6" onClick={() => navigate("/medicines")}>
              View Medicines
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
