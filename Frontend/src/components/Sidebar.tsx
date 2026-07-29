import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Upload,
  History,
  ArrowRightLeft,
  SquarePen,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import logo from "../assets/logo.png";
import "../styles/Sidebar.css";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/import-data", label: "Import Data", icon: Upload },
  { to: "/import-history", label: "Import History", icon: History },
  { to: "/kpi-entry", label: "KPI Entry", icon: ArrowRightLeft },
  { to: "/kpi-update", label: "KPI Update", icon: SquarePen },
  { to: "/user-management", label: "User Management", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  onSignOut?: () => void;
  userName?: string;
  userRole?: string;
}

export default function Sidebar({
  onSignOut,
  userName = "Super Admin",
  userRole = "Administrator",
}: SidebarProps) {
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={logo} alt="Groundbreaker Talents logo" className="sidebar-logo" />
        <span className="sidebar-brand-name">Groundbreaker Talents</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
          >
            <span className="sidebar-link-icon">
              <Icon size={16} />
            </span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-profile">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-profile-text">
            <span className="sidebar-profile-name">{userName}</span>
            <span className="sidebar-profile-role">{userRole}</span>
          </div>
        </div>

        <button type="button" className="sidebar-signout" onClick={onSignOut}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}