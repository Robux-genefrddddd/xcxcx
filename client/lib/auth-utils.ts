import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { sanitizeInput } from "./input-validation";

export type UserRole = "user" | "admin" | "founder";

// Valid roles for validation
const VALID_ROLES: Record<string, UserRole> = {
  user: "user",
  admin: "admin",
  founder: "founder",
};

export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    // Sanitize user ID to prevent injection
    const sanitizedId = sanitizeInput(userId);
    if (!sanitizedId || sanitizedId.length === 0) {
      return "user";
    }

    const userDocRef = doc(db, "userRoles", sanitizedId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      const role = data?.role as UserRole;

      // Validate role is in allowed list
      if (VALID_ROLES[role]) {
        return role;
      }
      return "user";
    } else {
      // Initialize new user with "user" role
      await setDoc(userDocRef, {
        role: "user",
        createdAt: new Date().toISOString(),
      });
      return "user";
    }
  } catch (error) {
    console.error("Error getting user role:", error);
    return "user";
  }
}

export async function updateUserRole(
  userId: string,
  newRole: UserRole,
): Promise<void> {
  try {
    // Validate new role
    if (!VALID_ROLES[newRole]) {
      throw new Error(`Invalid role: ${newRole}`);
    }

    // Sanitize user ID to prevent injection
    const sanitizedId = sanitizeInput(userId);
    if (!sanitizedId || sanitizedId.length === 0) {
      throw new Error("Invalid user ID");
    }

    const userDocRef = doc(db, "userRoles", sanitizedId);
    await updateDoc(userDocRef, {
      role: newRole,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
}

export function canAccessAdmin(role: UserRole): boolean {
  return role === "admin" || role === "founder";
}

export function canManageKeys(role: UserRole): boolean {
  return role === "founder";
}

export function canCreateKeys(role: UserRole): boolean {
  return role === "founder";
}

export function canManageUsers(role: UserRole): boolean {
  return role === "founder" || role === "admin";
}

export function canPerformCriticalActions(role: UserRole): boolean {
  return role === "founder";
}

export function canToggleMaintenance(role: UserRole): boolean {
  return role === "founder";
}

export function canViewStats(role: UserRole): boolean {
  return role === "founder" || role === "admin";
}
