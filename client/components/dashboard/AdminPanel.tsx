import { useState } from "react";
import { Key, Users, AlertCircle, BarChart3 } from "lucide-react";
import { getThemeColors } from "@/lib/theme-colors";
import { AdminKeyManagement } from "./AdminKeyManagement";
import { AdminUserManagement } from "./AdminUserManagement";
import { AdminMaintenanceMode } from "./AdminMaintenanceMode";
import { AdminGlobalStats } from "./AdminGlobalStats";
import {
  UserRole,
  canAccessAdmin,
  canManageKeys,
  canManageUsers,
  canViewStats,
} from "@/lib/auth-utils";

interface AdminPanelProps {
  theme: string;
  userRole: UserRole;
  userId: string;
}

type AdminTab = "keys" | "users" | "maintenance" | "stats";

export function AdminPanel({ theme, userRole, userId }: AdminPanelProps) {
  const colors = getThemeColors(theme);
  const [activeTab, setActiveTab] = useState<AdminTab>("keys");

  if (!canAccessAdmin(userRole)) {
    return null;
  }

  const adminTabs: Array<{
    id: AdminTab;
    label: string;
    icon: React.ReactNode;
    visible: boolean;
  }> = [
    {
      id: "keys",
      label: "Keys",
      icon: <Key className="w-4 h-4" />,
      visible: canManageKeys(userRole),
    },
    {
      id: "users",
      label: "Users",
      icon: <Users className="w-4 h-4" />,
      visible: canManageUsers(userRole),
    },
    {
      id: "maintenance",
      label: "Maintenance",
      icon: <AlertCircle className="w-4 h-4" />,
      visible: true,
    },
    {
      id: "stats",
      label: "Stats",
      icon: <BarChart3 className="w-4 h-4" />,
      visible: canViewStats(userRole),
    },
  ];

  const visibleTabs = adminTabs.filter((tab) => tab.visible);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2
          className="text-xl font-bold"
          style={{ color: colors.text }}
        >
          Administration
        </h2>
        <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
          Manage your system settings and users
        </p>
      </div>

      {/* Minimal Tab Navigation */}
      <div
        className="flex gap-1 p-1 rounded-lg w-fit"
        style={{ backgroundColor: colors.sidebar }}
      >
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all font-medium"
            style={{
              backgroundColor:
                activeTab === tab.id
                  ? colors.card
                  : "transparent",
              color:
                activeTab === tab.id
                  ? colors.text
                  : colors.textSecondary,
            }}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
        }}
      >
        {activeTab === "keys" && canManageKeys(userRole) && (
          <AdminKeyManagement
            theme={theme}
            userRole={userRole}
            userId={userId}
          />
        )}

        {activeTab === "users" && canManageUsers(userRole) && (
          <AdminUserManagement
            theme={theme}
            userRole={userRole}
            currentUserId={userId}
          />
        )}

        {activeTab === "maintenance" && (
          <AdminMaintenanceMode theme={theme} userRole={userRole} />
        )}

        {activeTab === "stats" && canViewStats(userRole) && (
          <AdminGlobalStats theme={theme} userRole={userRole} />
        )}
      </div>
    </div>
  );
}
