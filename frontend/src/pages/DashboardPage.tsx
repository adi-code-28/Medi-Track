import { useQuery } from "@tanstack/react-query";
import { Activity, Brain, Pill, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { statusStripClass } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, Spinner } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Disclaimer } from "@/components/Layout";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboardStats,
  });

  const { data: insights } = useQuery({
    queryKey: ["insights"],
    queryFn: api.insights,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const bp = stats?.latest_bp;
  const bpStatus = bp?.status || "normal";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Good {getGreeting()}, {user?.full_name?.split(" ")[0]}
        </h1>
        <p className="text-slate-500 mt-1">Here's your health overview for today</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={bp ? statusStripClass(bpStatus) : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Latest BP</p>
                <p className="text-2xl font-bold mt-1">
                  {bp ? `${bp.value}/${bp.value_secondary}` : "—"}
                </p>
                <p className="text-xs text-slate-400">{bp ? "mmHg" : "No readings"}</p>
              </div>
              <Activity className="h-8 w-8 text-clinical-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Adherence</p>
                <p className="text-2xl font-bold mt-1">{stats?.adherence_pct ?? 0}%</p>
                <p className="text-xs text-slate-400">Last 7 days</p>
              </div>
              <Pill className="h-8 w-8 text-clinical-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Meds</p>
                <p className="text-2xl font-bold mt-1">{stats?.medicines_active ?? 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-clinical-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Symptoms</p>
                <p className="text-2xl font-bold mt-1">{stats?.symptoms_this_week ?? 0}</p>
                <p className="text-xs text-slate-400">This week</p>
              </div>
              <Brain className="h-8 w-8 text-clinical-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {insights && (
        <Card className="border-clinical-500/20 bg-gradient-to-r from-white to-clinical-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-clinical-600" />
              <CardTitle>AI Weekly Insight</CardTitle>
              <Badge variant="default">AI</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-700 leading-relaxed">{insights.summary}</p>
            {insights.action_items.length > 0 && (
              <ul className="space-y-1">
                {insights.action_items.map((item, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-clinical-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/scan">
          <Button variant="secondary" className="w-full h-auto py-4 flex-col">
            <span className="font-semibold">Scan Prescription</span>
            <span className="text-xs font-normal text-slate-500">OCR → auto reminders</span>
          </Button>
        </Link>
        <Link to="/ai">
          <Button variant="secondary" className="w-full h-auto py-4 flex-col">
            <span className="font-semibold">Doctor Prep Chat</span>
            <span className="text-xs font-normal text-slate-500">Grounded in your data</span>
          </Button>
        </Link>
        <Link to="/report">
          <Button variant="secondary" className="w-full h-auto py-4 flex-col">
            <span className="font-semibold">Download Report</span>
            <span className="text-xs font-normal text-slate-500">PDF for your doctor</span>
          </Button>
        </Link>
      </div>

      <Disclaimer />
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
