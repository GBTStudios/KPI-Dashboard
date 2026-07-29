import { Search, Bell } from "lucide-react";
import "../styles/Header.css";

interface HeaderProps {
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  hasNotifications?: boolean;
  userAvatar?: string;
  userName?: string;
}

export default function Header({
  searchPlaceholder = "Search KPIs, reports...",
  onSearch,
  hasNotifications = false,
  userAvatar,
  userName = "User",
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-search">
        <Search size={15} className="header-search-icon" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </div>

      <div className="header-actions">
        <button type="button" className="header-notification" aria-label="Notifications">
          <Bell size={18} />
          {hasNotifications && <span className="notification-dot" />}
        </button>

        <img
          src={userAvatar || "/default-avatar.png"}
          alt={userName}
          className="header-avatar"
        />
      </div>
    </header>
  );
}