export type UserStatus = "active" | "suspended";

/** Matches app.schemas.user.UserListItem */
export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  is_suspended: boolean;
  is_active: boolean;
  is_verified: boolean;
  last_login: string | null;
  created_at: string;
  status: UserStatus;
}

/** Matches app.schemas.user.UserListResponse */
export interface AdminUserListResponse {
  items: AdminUser[];
  total: number;
  page: number;
  page_size: number;
}

/** Matches app.schemas.user.UserStatsOut */
export interface AdminUserStats {
  total_members: number;
  active_admins: number;
  suspended_accounts: number;
}
