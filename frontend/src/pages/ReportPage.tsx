import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Disclaimer } from "@/components/Layout";

export default function ReportPage() {
  const [loading, setLoading] = useState(false);

  const download = async () => {
    setLoading(true);
    try {
      const blob = await api.downloadReport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meditrack-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Download failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Health Report</h1>
        <p className="text-slate-500">Generate a doctor-readable PDF summary</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-clinical-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-clinical-600" />
            </div>
            <div>
              <CardTitle>Weekly Health Report</CardTitle>
              <CardDescription>
                Includes vitals, symptoms, medications, and adherence summary
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-sm text-slate-600 space-y-2">
            <li>• Patient profile and allergies</li>
            <li>• Medication adherence (last 7 days)</li>
            <li>• Vitals table with dates</li>
            <li>• Symptom log with severity scores</li>
          </ul>
          <Button onClick={download} disabled={loading} size="lg">
            <Download className="h-4 w-4" />
            {loading ? "Generating..." : "Download PDF Report"}
          </Button>
        </CardContent>
      </Card>

      <Disclaimer />
    </div>
  );
}
