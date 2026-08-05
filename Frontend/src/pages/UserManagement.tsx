import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  ShieldCheck,
  Clock3,
  MoreHorizontal,
  Ban,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { api, ApiError } from "../services/api";
import type { AdminUser, AdminUserListResponse, AdminUserStats } from "../types/admin";
import "../styles/UserManagement.css";

const PAGE_SIZE = 5;

type ActionType = "suspend" | "reactivate" | "delete";

interface PendingAction {
  type: ActionType;
  user: AdminUser;
}

/** "2 mins ago" / "3 days ago" / "Never" - no extra dependency needed for this. */
function formatLastActivity(iso: string | null): string {
  if (!iso) return "Never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function UserManagement() {
  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<AdminUserStats | null>(null);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [actionInFlight, setActionInFlight] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(PAGE_SIZE),
      });
      if (query.trim()) params.set("search", query.trim());

      const [listRes, statsRes] = await Promise.all([
        api.get<AdminUserListResponse>(`/admin/users?${params.toString()}`),
        api.get<AdminUserStats>("/admin/users/stats"),
      ]);

      setUsers(listRes.items);
      setTotal(listRes.total);
      setStats(statsRes);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        // Not the seeded admin — this screen isn't for them.
        navigate("/dashboard", { replace: true });
        return;
      }
      setError(err instanceof ApiError ? err.message : "Could not load users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [page, query, navigate]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Debounce search so we're not hitting the API on every keystroke.
  useEffect(() => {
    const handle = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => (prev.size === users.length ? new Set() : new Set(users.map((u) => u.id))));
  }

  function clearFilters() {
    setQuery("");
    setPage(1);
  }

  async function confirmAction() {
    if (!pendingAction) return;
    const { type, user } = pendingAction;
    setActionInFlight(true);
    try {
      if (type === "delete") {
        await api.delete(`/admin/users/${user.id}`);
      } else if (type === "suspend") {
        await api.post(`/admin/users/${user.id}/suspend`, {});
      } else {
        await api.post(`/admin/users/${user.id}/unsuspend`);
      }
      setPendingAction(null);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
      await loadUsers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That action didn't go through. Please try again.");
      setPendingAction(null);
    } finally {
      setActionInFlight(false);
    }
  }

  return (
    <div className="um-page">
      <div className="um-heading">
        <h1>User Management</h1>
        <p>Manage organization members and monitor account status.</p>
      </div>

      <div className="um-stats">
        <div className="um-stat-card">
          <div className="um-stat-text">
            <span className="um-stat-label">Total Members</span>
            <span className="um-stat-value">{stats?.total_members ?? "—"}</span>
          </div>
          <div className="um-stat-icon icon-purple">
            <Users size={18} />
          </div>
        </div>

        <div className="um-stat-card">
          <div className="um-stat-text">
            <span className="um-stat-label">Active Admins</span>
            <span className="um-stat-value">{stats?.active_admins ?? "—"}</span>
          </div>
          <div className="um-stat-icon icon-green">
            <ShieldCheck size={18} />
          </div>
        </div>

        <div className="um-stat-card">
          <div className="um-stat-text">
            <span className="um-stat-label">Suspended Accounts</span>
            <span className="um-stat-value">{stats?.suspended_accounts ?? "—"}</span>
          </div>
          <div className="um-stat-icon icon-amber">
            <Clock3 size={18} />
          </div>
        </div>
      </div>

      <div className="um-toolbar">
        <div className="um-search">
          <Search size={15} className="um-search-icon" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="button" className="um-clear-filters" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {error && (
        <div className="um-empty" role="alert" style={{ marginBottom: 12, color: "#b91c1c" }}>
          {error}
        </div>
      )}

      <div className="um-table-card">
        <table className="um-table">
          <colgroup>
            <col style={{ width: "44px" }} />
            <col />
            <col style={{ width: "140px" }} />
            <col style={{ width: "150px" }} />
            <col style={{ width: "70px" }} />
          </colgroup>
          <thead>
            <tr>
              <th className="um-checkbox-col">
                <input
                  type="checkbox"
                  checked={users.length > 0 && selected.size === users.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>User Information</th>
              <th className="um-center-col">Status</th>
              <th className="um-center-col">Last Activity</th>
              <th className="um-actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="um-empty">
                  Loading users...
                </td>
              </tr>
            )}

            {!isLoading &&
              users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(user.id)}
                      onChange={() => toggleSelect(user.id)}
                    />
                  </td>
                  <td>
                    <div className="um-user-cell">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name} className="um-avatar" />
                      ) : (
                        <div className="um-avatar" aria-hidden="true" style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "#e5e7eb", fontSize: 12, fontWeight: 600, color: "#4b5563",
                        }}>
                          {initials(user.full_name)}
                        </div>
                      )}
                      <div>
                        <div className="um-user-name">{user.full_name}</div>
                        <div className="um-user-email">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="um-center-col">
                    <span className={`um-status um-status-${user.status}`}>
                      {user.status === "active" ? "ACTIVE" : "SUSPENDED"}
                    </span>
                  </td>
                  <td className="um-center-col um-last-activity">{formatLastActivity(user.last_login)}</td>
                  <td className="um-actions-col">
                    <div className="um-row-menu-wrap" ref={openMenuId === user.id ? menuRef : null}>
                      <button
                        type="button"
                        className="um-row-menu"
                        aria-label="Row actions"
                        onClick={() => setOpenMenuId((prev) => (prev === user.id ? null : user.id))}
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {openMenuId === user.id && (
                        <div className="um-dropdown">
                          {user.status === "active" ? (
                            <button
                              type="button"
                              className="um-dropdown-item"
                              onClick={() => {
                                setPendingAction({ type: "suspend", user });
                                setOpenMenuId(null);
                              }}
                            >
                              <Ban size={14} />
                              Suspend
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="um-dropdown-item"
                              onClick={() => {
                                setPendingAction({ type: "reactivate", user });
                                setOpenMenuId(null);
                              }}
                            >
                              <RotateCcw size={14} />
                              Reactivate
                            </button>
                          )}
                          <button
                            type="button"
                            className="um-dropdown-item um-dropdown-danger"
                            onClick={() => {
                              setPendingAction({ type: "delete", user });
                              setOpenMenuId(null);
                            }}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

            {!isLoading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="um-empty">
                  No users match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="um-pagination">
          <span className="um-pagination-summary">
            Showing <strong>{users.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
            {(page - 1) * PAGE_SIZE + users.length}</strong> of{" "}
            <strong>{total}</strong> users
          </span>
          <div className="um-pagination-controls">
            <button type="button" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" className={n === page ? "active" : ""} onClick={() => setPage(n)}>
                {n}
              </button>
            ))}
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {pendingAction && (
        <ConfirmModal
          action={pendingAction}
          busy={actionInFlight}
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmAction}
        />
      )}
    </div>
  );
}

interface ConfirmModalProps {
  action: PendingAction;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmModal({ action, busy, onCancel, onConfirm }: ConfirmModalProps) {
  const { type, user } = action;

  const copy = {
    suspend: {
      title: "Suspend account",
      description: `${user.full_name} will lose access immediately and will be marked as suspended until reactivated.`,
      icon: <Ban size={20} />,
      iconClass: "um-modal-icon-amber",
      confirmLabel: "Suspend",
      confirmClass: "um-btn-amber",
    },
    reactivate: {
      title: "Reactivate account",
      description: `${user.full_name} will regain full access and be marked as active again.`,
      icon: <RotateCcw size={20} />,
      iconClass: "um-modal-icon-green",
      confirmLabel: "Reactivate",
      confirmClass: "um-btn-green",
    },
    delete: {
      title: "Delete account",
      description: `This will remove ${user.full_name} from your organization. This action cannot be undone.`,
      icon: <Trash2 size={20} />,
      iconClass: "um-modal-icon-red",
      confirmLabel: "Delete",
      confirmClass: "um-btn-red",
    },
  }[type];

  return (
    <div className="um-modal-overlay" onClick={busy ? undefined : onCancel}>
      <div className="um-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="um-modal-close" onClick={onCancel} aria-label="Close" disabled={busy}>
          <X size={16} />
        </button>

        <div className={`um-modal-icon ${copy.iconClass}`}>{copy.icon}</div>

        <h2 className="um-modal-title">{copy.title}</h2>
        <p className="um-modal-description">{copy.description}</p>

        <div className="um-modal-actions">
          <button type="button" className="um-btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={copy.confirmClass} onClick={onConfirm} disabled={busy}>
            {busy ? "Working..." : copy.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
