import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity,
  Brain,
  FileText,
  Heart,
  LayoutDashboard,
  LogOut,
  Pill,
  ScanLine,
  ShieldAlert,
  StickyNote,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/vitals", icon: Activity, label: "Vitals" },
  { to: "/medicines", icon: Pill, label: "Medicines" },
  { to: "/symptoms", icon: StickyNote, label: "Symptoms" },
  { to: "/scan", icon: ScanLine, label: "Scan Rx" },
  { to: "/ai", icon: Brain, label: "AI Assistant" },
  { to: "/report", icon: FileText, label: "Report" },
  { to: "/profile", icon: User, label: "Profile" },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="md:w-64 bg-white border-r border-slate-100 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="h-10 w-10 rounded-xl bg-clinical-600 flex items-center justify-center">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-clinical-700">MediTrack</h1>
            <p className="text-xs text-slate-500">AI Health Companion</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 hidden md:block">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-clinical-50 text-clinical-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 hidden md:block">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-slate-800 truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
        <header className="bg-white border-b border-slate-100 px-6 py-4 md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-clinical-600" />
              <span className="font-bold text-clinical-700">MediTrack</span>
            </div>
            <button onClick={handleLogout} className="text-slate-500">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-2 flex justify-around z-50">
        {navItems.slice(0, 5).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px]",
                isActive ? "text-clinical-600" : "text-slate-500"
              )
            }
          >
            <Icon className="h-5 w-5" />
            {label.split(" ")[0]}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function Disclaimer() {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-800">
      <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
      <p>
        MediTrack is not a medical device. Always consult a qualified healthcare professional for
        medical advice.
      </p>
    </div>
  );
}
