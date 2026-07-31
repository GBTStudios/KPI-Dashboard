import { useState, useRef, useEffect, useMemo } from "react";
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
import "../styles/UserManagement.css";

type UserStatus = "active" | "suspended";

interface OrgUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  status: UserStatus;
  lastActivity: string;
}

const initialUsers: OrgUser[] = [
  { id: "1", name: "Jane Doe", email: "jane.doe@insightflow.com", avatar: "/avatars/jane.png", status: "active", lastActivity: "2 mins ago" },
  { id: "2", name: "Robert Chen", email: "robert.chen@insightflow.com", avatar: "/avatars/robert.png", status: "active", lastActivity: "1 hour ago" },
  { id: "3", name: "Sarah Williams", email: "s.williams@insightflow.com", avatar: "/avatars/sarah.png", status: "suspended", lastActivity: "Never" },
  { id: "4", name: "Michael Scott", email: "m.scott@insightflow.com", avatar: "/avatars/michael.png", status: "suspended", lastActivity: "3 days ago" },
  { id: "5", name: "Emily Blunt", email: "e.blunt@insightflow.com", avatar: "/avatars/emily.png", status: "active", lastActivity: "5 hours ago" },
];

const PAGE_SIZE = 5;

type ActionType = "suspend" | "reactivate" | "delete";

interface PendingAction {
  type: ActionType;
  user: OrgUser;
}

export default function UserManagement() {
  const [users, setUsers] = useState<OrgUser[]>(initialUsers);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.status.toLowerCase().includes(q)
    );
  }, [query, users]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageUsers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalMembers = users.length;
  const activeAdmins = users.filter((u) => u.status === "active").length;
  const suspendedAccounts = users.filter((u) => u.status === "suspended").length;

function toggleSelect(id: string) {
  setSelected((prev) => {
    const next = new Set(prev);

    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }

    return next;
  });
}

  function toggleSelectAll() {
    setSelected((prev) =>
      prev.size === pageUsers.length ? new Set() : new Set(pageUsers.map((u) => u.id))
    );
  }

  function clearFilters() {
    setQuery("");
    setPage(1);
  }

  function confirmAction() {
    if (!pendingAction) return;
    const { type, user } = pendingAction;

    if (type === "delete") {
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } else {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, status: type === "suspend" ? "suspended" : "active" }
            : u
        )
      );
    }
    setPendingAction(null);
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
            <span className="um-stat-value">{totalMembers}</span>
          </div>
          <div className="um-stat-icon icon-purple">
            <Users size={18} />
          </div>
        </div>

        <div className="um-stat-card">
          <div className="um-stat-text">
            <span className="um-stat-label">Active Admins</span>
            <span className="um-stat-value">{activeAdmins}</span>
          </div>
          <div className="um-stat-icon icon-green">
            <ShieldCheck size={18} />
          </div>
        </div>

        <div className="um-stat-card">
          <div className="um-stat-text">
            <span className="um-stat-label">Suspended Accounts</span>
            <span className="um-stat-value">{suspendedAccounts}</span>
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
            placeholder="Search by name, email, or role..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <button type="button" className="um-clear-filters" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

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
                  checked={pageUsers.length > 0 && selected.size === pageUsers.length}
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
            {pageUsers.map((user) => (
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
                    <img src={user.avatar} alt={user.name} className="um-avatar" />
                    <div>
                      <div className="um-user-name">{user.name}</div>
                      <div className="um-user-email">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="um-center-col">
                  <span className={`um-status um-status-${user.status}`}>
                    {user.status === "active" ? "ACTIVE" : "SUSPENDED"}
                  </span>
                </td>
                <td className="um-center-col um-last-activity">{user.lastActivity}</td>
                <td className="um-actions-col">
                  <div className="um-row-menu-wrap" ref={openMenuId === user.id ? menuRef : null}>
                    <button
                      type="button"
                      className="um-row-menu"
                      aria-label="Row actions"
                      onClick={() =>
                        setOpenMenuId((prev) => (prev === user.id ? null : user.id))
                      }
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
            {pageUsers.length === 0 && (
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
            Showing <strong>{pageUsers.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
            {(page - 1) * PAGE_SIZE + pageUsers.length}</strong> of{" "}
            <strong>{filtered.length}</strong> users
          </span>
          <div className="um-pagination-controls">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                className={n === page ? "active" : ""}
                onClick={() => setPage(n)}
              >
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
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmAction}
        />
      )}
    </div>
  );
}

interface ConfirmModalProps {
  action: PendingAction;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmModal({ action, onCancel, onConfirm }: ConfirmModalProps) {
  const { type, user } = action;

  const copy = {
    suspend: {
      title: "Suspend account",
      description: `${user.name} will lose access immediately and will be marked as suspended until reactivated.`,
      icon: <Ban size={20} />,
      iconClass: "um-modal-icon-amber",
      confirmLabel: "Suspend",
      confirmClass: "um-btn-amber",
    },
    reactivate: {
      title: "Reactivate account",
      description: `${user.name} will regain full access and be marked as active again.`,
      icon: <RotateCcw size={20} />,
      iconClass: "um-modal-icon-green",
      confirmLabel: "Reactivate",
      confirmClass: "um-btn-green",
    },
    delete: {
      title: "Delete account",
      description: `This will permanently remove ${user.name} from your organization. This action cannot be undone.`,
      icon: <Trash2 size={20} />,
      iconClass: "um-modal-icon-red",
      confirmLabel: "Delete",
      confirmClass: "um-btn-red",
    },
  }[type];

  return (
    <div className="um-modal-overlay" onClick={onCancel}>
      <div className="um-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="um-modal-close" onClick={onCancel} aria-label="Close">
          <X size={16} />
        </button>

        <div className={`um-modal-icon ${copy.iconClass}`}>{copy.icon}</div>

        <h2 className="um-modal-title">{copy.title}</h2>
        <p className="um-modal-description">{copy.description}</p>

        <div className="um-modal-actions">
          <button type="button" className="um-btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={copy.confirmClass} onClick={onConfirm}>
            {copy.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}