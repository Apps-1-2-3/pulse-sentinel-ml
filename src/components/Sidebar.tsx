import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Database,
  AlertTriangle,
  Activity,
  Brain,
  ShieldAlert,
  Wrench,
  FileText,
  Radio,
} from "lucide-react";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/analysis", label: "Data Analysis", icon: Database },
  { to: "/anomaly", label: "Anomaly Detection", icon: AlertTriangle },
  { to: "/damage", label: "Damage Assessment", icon: Activity },
  { to: "/xai", label: "Explainable AI", icon: Brain },
  { to: "/risk", label: "Risk Assessment", icon: ShieldAlert },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/report", label: "Report", icon: FileText },
] as const;

export function Sidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-panel/60 backdrop-blur flex flex-col">
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="h-5 w-5 text-primary" />
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald animate-pulse" />
          </div>
          <div className="mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            SHM • XAI
          </div>
        </div>
        <h1 className="mt-2 text-sm font-semibold leading-tight">
          Predictive Structural<br />Health Monitoring
        </h1>
        <p className="mono text-[10px] text-muted-foreground mt-1">v1.0 · ML + SHAP</p>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = path === to;
          return (
            <Link
              key={to}
              to={to}
              className={[
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-accent text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-border mono text-[10px] text-muted-foreground">
        <div className="flex justify-between"><span>BACKEND</span><span className="text-emerald">PYTHON · OFFLINE</span></div>
        <div className="flex justify-between mt-1"><span>MODEL</span><span>XGBOOST</span></div>
        <div className="flex justify-between mt-1"><span>XAI</span><span>SHAP TREE</span></div>
      </div>
    </aside>
  );
}
