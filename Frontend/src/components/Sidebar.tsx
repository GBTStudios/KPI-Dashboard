import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Upload,
  History,
  ArrowRightLeft,
  SquarePen,
  Users,
  Settings,
  LogOut,
  Building2,
  ChevronDown,
} from "lucide-react";
import logo from "../assets/logo.png";
import "../styles/Sidebar.css";

// "Dashboard" is handled separately below (it's now a dropdown),
// so it's no longer in this array. Every other item is UNCHANGED —
// same order, same icons, same NavLink behavior.
const navItems = [
  { to: "/import-data", label: "Import Data", icon: Upload },
  { to: "/import-history", label: "Import History", icon: History },
  { to: "/kpi-entry", label: "KPI Entry", icon: ArrowRightLeft },
  { to: "/kpi-update", label: "KPI Update", icon: SquarePen },
  { to: "/user-management", label: "User Management", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

// The two links nested under the Dashboard dropdown.
const dashboardSublinks = [
  { to: "/dashboard", label: "Dashboard Overview" },
  { to: "/department-dashboard", label: "Department Dashboard" },
];

interface SidebarProps {
  onSignOut?: () => void;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  onAvatarClick?: () => void;
}

export default function Sidebar({
  onSignOut,
  userName = "Super Admin",
  userRole = "Administrator",
  userAvatar,
  onAvatarClick,
}: SidebarProps) {
  // const initials = userName
  //   .split(" ")
  //   .map((w) => w[0])
  //   .join("")
  //   .slice(0, 2)
  //   .toUpperCase();

  const location = useLocation();

  // The Dashboard section is "active" whenever the user is on EITHER
  // of its two sub-routes — not just an exact string match, since
  // there are two possible pages under this one dropdown.
  const isDashboardRoute =
    location.pathname === "/dashboard" ||
    location.pathname === "/department-dashboard";

  const [isDashboardOpen, setIsDashboardOpen] = useState(
    () => isDashboardRoute,
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img
          src={logo}
          alt="Groundbreaker Talents logo"
          className="sidebar-logo"
        />
        <span className="sidebar-brand-name">Groundbreaker Talents</span>
      </div>

      <nav className="sidebar-nav">
        {/* Dashboard dropdown — replaces the old standalone Dashboard
            NavLink. Reuses the exact same .sidebar-link / .active
            classes as every other item, so the highlighted look is
            identical, just applied conditionally instead of via
            NavLink's automatic isActive (a <button> can't use that). */}
        <button
          type="button"
          className={`sidebar-link sidebar-dropdown-toggle ${
            isDashboardOpen ? "open" : ""
          }`}
          onClick={() => setIsDashboardOpen((prev) => !prev)}
          aria-expanded={isDashboardOpen}
        >
          <span className="sidebar-link-icon">
            <LayoutGrid size={16} />
          </span>
          <span>Dashboard</span>
          <ChevronDown size={14} className="sidebar-dropdown-chevron" />
        </button>

        {isDashboardOpen && (
          <div className="sidebar-sublist">
            {dashboardSublinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `sidebar-link sidebar-sublink ${isActive ? "active" : ""}`
                }
              >
                <span className="sidebar-link-icon">
                  <Building2 size={15} />
                </span>
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        )}

        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
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
  <button
    type="button"
    className="sidebar-avatar-button"
    onClick={onAvatarClick}
    aria-label="Open profile"
  >
    <img
      src={userAvatar || "/default-avatar.png"}
      alt={userName}
      className="sidebar-avatar"
    />
  </button>

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
