import { Search } from "lucide-react";
import "../styles/Header.css";

interface HeaderProps {
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  userAvatar?: string;
  userName?: string;
  onAvatarClick?: () => void;
}

export default function Header({
  searchPlaceholder = "Search KPIs, parameters...",
  onSearch,
  userAvatar,
  userName = "User",
  onAvatarClick,
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
        <button
          type="button"
          className="header-avatar-button"
          onClick={onAvatarClick}
          aria-label="Open profile"
        >
          <img
            src={userAvatar || "/default-avatar.png"}
            alt={userName}
            className="header-avatar"
          />
        </button>
      </div>
    </header>
  );
}