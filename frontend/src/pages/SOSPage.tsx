import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Heart, Phone, User } from "lucide-react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui/Badge";

export default function SOSPage() {
  const { userId } = useParams<{ userId: string }>();
  const { data: patient, isLoading, error } = useQuery({
    queryKey: ["sos", userId],
    queryFn: () => api.sos(parseInt(userId!)),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <p className="text-red-600">Emergency card not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" />
            EMERGENCY MEDICAL INFO
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-red-100">
          <div className="bg-red-600 text-white p-6 text-center">
            <Heart className="h-10 w-10 mx-auto mb-2" />
            <h1 className="text-2xl font-bold">{patient.full_name}</h1>
            <p className="text-red-100 mt-1">
              Age {patient.age || "—"} · Blood Group {patient.blood_group || "—"}
            </p>
          </div>

          <div className="p-6 space-y-6">
            <section>
              <h2 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">
                Allergies
              </h2>
              <p className="text-lg font-semibold text-red-700">
                {patient.allergies || "None recorded"}
              </p>
            </section>

            <section>
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Medical Conditions
              </h2>
              <p className="text-slate-800">{patient.conditions || "None recorded"}</p>
            </section>

            {patient.emergency_contact_name && (
              <section className="bg-slate-50 rounded-xl p-4">
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Emergency Contact
                </h2>
                <p className="font-semibold">{patient.emergency_contact_name}</p>
                {patient.emergency_contact_phone && (
                  <a
                    href={`tel:${patient.emergency_contact_phone}`}
                    className="flex items-center gap-2 text-clinical-600 font-medium mt-2"
                  >
                    <Phone className="h-4 w-4" />
                    {patient.emergency_contact_phone}
                  </a>
                )}
              </section>
            )}
          </div>

          <div className="px-6 pb-6">
            <p className="text-xs text-slate-400 text-center">
              Powered by MediTrack · Read-only emergency card
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
