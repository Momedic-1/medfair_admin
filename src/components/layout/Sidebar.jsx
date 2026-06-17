import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getNavForRole } from "../../constants/navigation";
import { RoleBadge } from "../ui/Badge";

export function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = getNavForRole(user?.role);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className="flex h-full w-full flex-col bg-gradient-to-b from-medfair via-medfair-dark to-medfair-light text-white">
      <div className="shrink-0 border-b border-white/10 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg font-bold">
            M
          </div>
          <div>
            <p className="text-lg font-bold tracking-wide">MEDFAIR</p>
            <p className="text-xs text-white/70">Admin Portal</p>
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-white text-medfair shadow-sm"
                      : "text-white/85 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="shrink-0 border-t border-white/10 p-4">
        <div className="mb-3 rounded-xl bg-white/10 p-3">
          <p className="truncate text-sm font-semibold">{user?.fullName}</p>
          <p className="truncate text-xs text-white/70">{user?.email}</p>
          <div className="mt-2">
            <RoleBadge role={user?.role} />
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
