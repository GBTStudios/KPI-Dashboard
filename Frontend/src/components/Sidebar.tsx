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
  Wallet,
  ChevronDown,
} from "lucide-react";
import logo from "../assets/logo.png";
import "../styles/Sidebar.css";

// UNCHANGED — same array, same items, same order.
const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/import-data", label: "Import Data", icon: Upload },
  { to: "/import-history", label: "Import History", icon: History },
  { to: "/kpi-entry", label: "KPI Entry", icon: ArrowRightLeft },
  { to: "/kpi-update", label: "KPI Update", icon: SquarePen },
  { to: "/user-management", label: "User Management", icon: Users },
  { to: "/settings", label: "Settings", icon: Settings },
];

// NEW — kept as its own small array so adding more departments later
// (Programs, Marketing, Mentorship, Partnerships) is a one-line change,
// exactly as the spec asked for.
const departmentLinks = [{ to: "/departments/funding", label: "Funding", icon: Wallet }];

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

  const location = useLocation();

  // Starts open if we're already on a /departments/* route, so a
  // hard refresh on /departments/funding doesn't hide the active link
  // inside a collapsed menu. useState(() => ...) with a function runs
  // this check only once, on first render — not on every re-render.
  const [isDepartmentsOpen, setIsDepartmentsOpen] = useState(() =>
    location.pathname.startsWith("/departments"),
  );

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

        {/* NEW — Departments dropdown. Uses the exact same
            .sidebar-link classes as every other item, so it inherits
            identical spacing/hover/typography with zero new CSS
            required for the base look. */}
        <button
          type="button"
          className={`sidebar-link sidebar-dropdown-toggle ${
            isDepartmentsOpen ? "open" : ""
          }`}
          onClick={() => setIsDepartmentsOpen((prev) => !prev)}
          aria-expanded={isDepartmentsOpen}
        >
          <span className="sidebar-link-icon">
            <Building2 size={16} />
          </span>
          <span>Departments</span>
          <ChevronDown size={14} className="sidebar-dropdown-chevron" />
        </button>

        {isDepartmentsOpen && (
          <div className="sidebar-sublist">
            {departmentLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `sidebar-link sidebar-sublink ${isActive ? "active" : ""}`
                }
              >
                <span className="sidebar-link-icon">
                  <Icon size={15} />
                </span>
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        )}
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