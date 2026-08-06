import { auth } from "../../auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}
