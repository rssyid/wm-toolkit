"use server";

import { auth } from "@/auth";
import { loadInitialAppStateForUser } from "@/server/initial-state";

export async function getInitialAppStateAction() {
  let userId: string | undefined;

  if (process.env.TEST_AUTH_USER_ID && process.env.NODE_ENV !== "production") {
    userId = process.env.TEST_AUTH_USER_ID;
  } else {
    const session = await auth();
    userId = session?.user?.id;
  }

  if (!userId) {
    return {
      success: false as const,
      hasDbData: false as const,
      error: "UNAUTHORIZED: Sesi Anda telah berakhir. Silakan login kembali.",
    };
  }

  return loadInitialAppStateForUser(userId);
}
