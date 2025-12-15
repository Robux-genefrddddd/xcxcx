import { useState, useEffect } from "react";
import { Trash2, Search, Mail, Calendar } from "lucide-react";
import { getThemeColors } from "@/lib/theme-colors";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  UserRole,
  canPerformCriticalActions,
  canManageUsers,
} from "@/lib/auth-utils";

interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  plan: "free" | "premium" | "lifetime";
  storageUsed: number;
  createdAt: string;
}

interface AdminUserManagementProps {
  theme: string;
  userRole: UserRole;
  currentUserId: string;
}

export function AdminUserManagement({
  theme,
  userRole,
  currentUserId,
}: AdminUserManagementProps) {
  const colors = getThemeColors(theme);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, "userRoles"));
      const userList: AdminUser[] = [];

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const roleData = userDoc.data();

        let plan: "free" | "premium" | "lifetime" = "free";
        let storageUsed = 0;
        try {
          const planDoc = await getDoc(doc(db, "userPlans", userId));
          if (planDoc.exists()) {
            plan = planDoc.data().type || "free";
            storageUsed = planDoc.data().storageUsed || 0;
          }
        } catch (error) {
          console.error(`Error loading plan for ${userId}:`, error);
        }

        let email = "";
        let name = "";
        try {
          const filesQuery = query(
            collection(db, "files"),
            where("userId", "==", userId),
          );
          const filesSnapshot = await getDocs(filesQuery);
          if (filesSnapshot.docs.length > 0) {
            const userFile = filesSnapshot.docs[0];
            email = userFile.data().userEmail || "";
            name = userFile.data().userName || "";
          }

          if (!email && roleData.email) {
            email = roleData.email;
          }
        } catch (error) {
          console.error(`Error loading user info for ${userId}:`, error);
        }

        userList.push({
          id: userId,
          email: email || userId,
          name: name || "Unknown",
          role: roleData.role || "user",
          plan,
          storageUsed,
          createdAt: roleData.createdAt
            ? new Date(roleData.createdAt).toLocaleDateString()
            : new Date().toLocaleDateString(),
        });
      }

      setUsers(userList);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    if (userId === currentUserId) {
      alert("Cannot change your own role");
      return;
    }

    try {
      await updateDoc(doc(db, "userRoles", userId), { role: newRole });
      loadUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role");
    }
  };

  const deleteUser = async (userId: string) => {
    if (userId === currentUserId) {
      alert("Cannot delete your own account");
      return;
    }

    if (!canPerformCriticalActions(userRole)) {
      alert("You don't have permission to delete users");
      return;
    }

    try {
      await deleteDoc(doc(db, "userRoles", userId));
      await deleteDoc(doc(db, "userPlans", userId));
      loadUsers();
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(0)} MB`;
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "lifetime":
        return { bg: "rgba(168, 85, 247, 0.15)", text: "#A855F7" };
      case "premium":
        return { bg: "rgba(34, 197, 94, 0.15)", text: "#22C55E" };
      default:
        return { bg: "rgba(59, 130, 246, 0.15)", text: "#3B82F6" };
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "founder":
        return { bg: "rgba(34, 197, 94, 0.15)", text: "#22C55E" };
      case "admin":
        return { bg: "rgba(59, 130, 246, 0.15)", text: "#3B82F6" };
      default:
        return { bg: "rgba(156, 163, 175, 0.15)", text: "#9CA3AF" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      {users.length > 0 && (
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
            style={{ color: colors.textSecondary }}
          />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              color: colors.text,
            }}
          />
        </div>
      )}

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div
            className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-b-transparent"
            style={{ borderColor: colors.accent }}
          ></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div
          className="p-12 rounded-lg border text-center"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
        >
          <p style={{ color: colors.textSecondary }}>
            {searchQuery ? "No users match your search" : "No users found"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const planColors = getPlanBadgeColor(user.plan);
            const roleColors = getRoleBadgeColor(user.role);
            const isCurrentUser = user.id === currentUserId;

            return (
              <div
                key={user.id}
                className="p-4 rounded-lg border transition-all"
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: isCurrentUser ? 0.7 : 1,
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                        style={{
                          backgroundColor: colors.sidebar,
                          color: colors.text,
                        }}
                      >
                        {user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: colors.text }}
                        >
                          {user.email}
                        </p>
                        {isCurrentUser && (
                          <p className="text-xs" style={{ color: colors.primary }}>
                            (You)
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Badges and Info */}
                    <div className="flex items-center flex-wrap gap-2 ml-11">
                      {/* Role Badge */}
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor: roleColors.bg,
                          color: roleColors.text,
                        }}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>

                      {/* Plan Badge */}
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor: planColors.bg,
                          color: planColors.text,
                        }}
                      >
                        {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                      </span>

                      {/* Storage Info */}
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: "transparent",
                          color: colors.textSecondary,
                        }}
                      >
                        {formatStorage(user.storageUsed)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {canManageUsers(userRole) && !isCurrentUser && (
                      <>
                        <select
                          value={user.role}
                          onChange={(e) =>
                            updateUserRole(user.id, e.target.value as UserRole)
                          }
                          className="text-xs px-2 py-1 rounded border"
                          style={{
                            backgroundColor: colors.sidebar,
                            borderColor: colors.border,
                            color: colors.text,
                          }}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="founder">Founder</option>
                        </select>

                        {canPerformCriticalActions(userRole) && (
                          deleteConfirm === user.id ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="text-xs px-2 py-1 rounded transition-all"
                                style={{
                                  backgroundColor: "rgba(239, 68, 68, 0.2)",
                                  color: "#EF4444",
                                }}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="text-xs px-2 py-1 rounded"
                                style={{
                                  backgroundColor: colors.sidebar,
                                  color: colors.textSecondary,
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              className="p-1 rounded transition-opacity opacity-60 hover:opacity-100"
                              style={{
                                color: "#EF4444",
                              }}
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      {users.length > 0 && (
        <div
          className="p-4 rounded-lg border"
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                Total Users
              </p>
              <p
                className="text-xl font-bold mt-1"
                style={{ color: colors.accent }}
              >
                {users.length}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                Premium
              </p>
              <p
                className="text-xl font-bold mt-1"
                style={{ color: colors.primary }}
              >
                {users.filter((u) => u.plan !== "free").length}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: colors.textSecondary }}>
                Admins & Founders
              </p>
              <p
                className="text-xl font-bold mt-1"
                style={{ color: "#22C55E" }}
              >
                {users.filter((u) => u.role !== "user").length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
