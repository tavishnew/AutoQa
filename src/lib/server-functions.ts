import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { projects, runs, testResults, users, userSettings, sessions, accounts } from "@/db/schema";
import { eq, and, desc, count, inArray } from "drizzle-orm";
import { authClient } from "@/auth/client";
import { encrypt, decrypt } from "@/lib/server/crypto";

export type Run = {
  id: string;
  projectId: string;
  targetUrl: string;
  status: "running" | "pending" | "completed" | "failed" | "cancelled";
  startedAt: Date | null;
  finishedAt: Date | null;
  reportUrl: string | null;
  errorMessage: string | null;
  createdAt: Date;
  projectName: string;
};

export type Project = {
  id: string;
  ownerId: string;
  name: string;
  targetUrl: string | null;
  createdAt: Date;
};

export const getProjects = createServerFn({ method: "GET" }).handler(
  async (): Promise<Project[]> => {
    const { data: session } = await authClient.getSession();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.ownerId, session.user.id))
      .orderBy(desc(projects.createdAt));
    return userProjects;
  },
);

export const createProject = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { name, targetUrl } = data as { name: string; targetUrl?: string };
    if (!name || name.trim().length === 0) {
      throw new Error("Project name is required");
    }
    return { name: name.trim(), targetUrl: targetUrl?.trim() || null };
  })
  .handler(async ({ data }): Promise<Project> => {
    const { data: session } = await authClient.getSession();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const [project] = await db
      .insert(projects)
      .values({
        ownerId: session.user.id,
        name: data.name,
        targetUrl: data.targetUrl,
      })
      .returning();
    return project;
  });

export const deleteProject = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { id } = data as { id: string };
    if (!id) throw new Error("Project ID is required");
    return { id };
  })
  .handler(async ({ data }): Promise<{ success: true }> => {
    const { data: session } = await authClient.getSession();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    await db
      .delete(projects)
      .where(and(eq(projects.id, data.id), eq(projects.ownerId, session.user.id)));
    return { success: true };
  });

export const getRuns = createServerFn({ method: "GET" })
  .validator((data: unknown) => {
    const { projectId } = data as { projectId?: string };
    return { projectId };
  })
  .handler(async ({ data }): Promise<Run[]> => {
    const { data: session } = await authClient.getSession();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const conditions = [];
    if (data.projectId) {
      conditions.push(eq(runs.projectId, data.projectId));
    }
    const userRuns = await db
      .select({
        id: runs.id,
        projectId: runs.projectId,
        targetUrl: runs.targetUrl,
        status: runs.status,
        startedAt: runs.startedAt,
        finishedAt: runs.finishedAt,
        reportUrl: runs.reportUrl,
        errorMessage: runs.errorMessage,
        createdAt: runs.createdAt,
        projectName: projects.name,
      })
      .from(runs)
      .innerJoin(projects, eq(runs.projectId, projects.id))
      .where(
        conditions.length > 0
          ? and(eq(projects.ownerId, session.user.id), ...conditions)
          : eq(projects.ownerId, session.user.id),
      )
      .orderBy(desc(runs.createdAt));
    return userRuns;
  });

export const createRun = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { projectId, targetUrl } = data as { projectId: string; targetUrl: string };
    if (!projectId || !targetUrl) {
      throw new Error("Project ID and target URL are required");
    }
    try {
      new URL(targetUrl);
    } catch {
      throw new Error("Invalid target URL");
    }
    return { projectId, targetUrl };
  })
  .handler(async ({ data }) => {
    const { data: session } = await authClient.getSession();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const project = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, data.projectId), eq(projects.ownerId, session.user.id)))
      .limit(1);
    if (project.length === 0) {
      throw new Error("Project not found or access denied");
    }
    const [run] = await db
      .insert(runs)
      .values({
        projectId: data.projectId,
        targetUrl: data.targetUrl,
        status: "pending",
      })
      .returning();
    return run;
  });

export const getDashboardStats = createServerFn({ method: "GET" }).handler(async () => {
  const { data: session } = await authClient.getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const [projectCount] = await db
    .select({ count: count() })
    .from(projects)
    .where(eq(projects.ownerId, session.user.id));
  const [runCount] = await db
    .select({ count: count() })
    .from(runs)
    .innerJoin(projects, eq(runs.projectId, projects.id))
    .where(eq(projects.ownerId, session.user.id));
  const [passedRunCount] = await db
    .select({ count: count() })
    .from(runs)
    .innerJoin(projects, eq(runs.projectId, projects.id))
    .where(and(eq(projects.ownerId, session.user.id), eq(runs.status, "completed")));
  const [failedRunCount] = await db
    .select({ count: count() })
    .from(runs)
    .innerJoin(projects, eq(runs.projectId, projects.id))
    .where(and(eq(projects.ownerId, session.user.id), eq(runs.status, "failed")));
  return {
    projectCount: projectCount?.count || 0,
    runCount: runCount?.count || 0,
    passedRunCount: passedRunCount?.count || 0,
    failedRunCount: failedRunCount?.count || 0,
  };
});

export type UserSettings = {
  id: string;
  userId: string;
  ollamaBaseUrl: string;
  nvidiaApiKeyMasked: string | null;
  openRouterApiKeyMasked: string | null;
  preferredProvider: string;
  notificationPrefs: {
    emailRunComplete: boolean;
    emailRunFailed: boolean;
    weeklyDigest: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
};

function maskKey(key: string | null): string | null {
  if (!key) return null;
  return "•".repeat(key.length - 4) + key.slice(-4);
}

function decryptKeyIfProvided(existingEncrypted: string | null, newPlaintext: string | undefined): string | null {
  if (newPlaintext === undefined) {
    return existingEncrypted;
  }
  if (newPlaintext === "") {
    return null;
  }
  return encrypt(newPlaintext);
}

function toUserSettings(settings: typeof userSettings.$inferSelect): UserSettings {
  return {
    ...settings,
    ollamaBaseUrl: settings.ollamaBaseUrl ?? "http://localhost:11434",
    nvidiaApiKeyMasked: maskKey(settings.nvidiaApiKeyEncrypted ? decrypt(settings.nvidiaApiKeyEncrypted) : null),
    openRouterApiKeyMasked: maskKey(settings.openRouterApiKeyEncrypted ? decrypt(settings.openRouterApiKeyEncrypted) : null),
    preferredProvider: settings.preferredProvider ?? "ollama",
    notificationPrefs: (settings.notificationPrefs ?? {}) as UserSettings["notificationPrefs"],
  };
}

export const getUserSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<UserSettings> => {
    const { data: session } = await authClient.getSession();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.user.id))
      .limit(1);
    if (!settings) {
      const [newSettings] = await db
        .insert(userSettings)
        .values({ userId: session.user.id })
        .returning();
      return toUserSettings(newSettings);
    }
    return toUserSettings(settings);
  },
);

export const saveUserSettings = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const {
      ollamaBaseUrl,
      nvidiaApiKey,
      openRouterApiKey,
      preferredProvider,
      notificationPrefs,
    } = data as {
      ollamaBaseUrl?: string;
      nvidiaApiKey?: string;
      openRouterApiKey?: string;
      preferredProvider?: string;
      notificationPrefs?: {
        emailRunComplete?: boolean;
        emailRunFailed?: boolean;
        weeklyDigest?: boolean;
      };
    };
    return {
      ollamaBaseUrl: ollamaBaseUrl?.trim() || "http://localhost:11434",
      nvidiaApiKey: nvidiaApiKey?.trim(),
      openRouterApiKey: openRouterApiKey?.trim(),
      preferredProvider: preferredProvider?.trim() || "ollama",
      notificationPrefs: notificationPrefs || {
        emailRunComplete: true,
        emailRunFailed: true,
        weeklyDigest: true,
      },
    };
  })
  .handler(async ({ data }): Promise<UserSettings> => {
    const { data: session } = await authClient.getSession();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const [existing] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.user.id))
      .limit(1);
    const nvidiaEncrypted = decryptKeyIfProvided(
      existing?.nvidiaApiKeyEncrypted ?? null,
      data.nvidiaApiKey,
    );
    const openRouterEncrypted = decryptKeyIfProvided(
      existing?.openRouterApiKeyEncrypted ?? null,
      data.openRouterApiKey,
    );
    const [saved] = await db
      .insert(userSettings)
      .values({
        userId: session.user.id,
        ollamaBaseUrl: data.ollamaBaseUrl,
        nvidiaApiKeyEncrypted: nvidiaEncrypted,
        openRouterApiKeyEncrypted: openRouterEncrypted,
        preferredProvider: data.preferredProvider,
        notificationPrefs: data.notificationPrefs,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          ollamaBaseUrl: data.ollamaBaseUrl,
          nvidiaApiKeyEncrypted: nvidiaEncrypted,
          openRouterApiKeyEncrypted: openRouterEncrypted,
          preferredProvider: data.preferredProvider,
          notificationPrefs: data.notificationPrefs,
          updatedAt: new Date(),
        },
      })
      .returning();
    return toUserSettings(saved);
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const { confirm } = data as { confirm?: boolean };
    if (!confirm) throw new Error("Deletion must be confirmed");
    return { confirm: true };
  })
  .handler(async (): Promise<{ success: true; redirect: string }> => {
    const { data: session } = await authClient.getSession();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }
    const userId = session.user.id;
    await db.transaction(async (tx) => {
      const userProjectIds = tx
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.ownerId, userId));
      const userRunIds = tx
        .select({ id: runs.id })
        .from(runs)
        .where(inArray(runs.projectId, userProjectIds));
      await tx.delete(testResults).where(inArray(testResults.runId, userRunIds));
      await tx.delete(runs).where(inArray(runs.projectId, userProjectIds));
      await tx.delete(projects).where(eq(projects.ownerId, userId));
      await tx.delete(userSettings).where(eq(userSettings.userId, userId));
      await tx.delete(accounts).where(eq(accounts.userId, userId));
      await tx.delete(sessions).where(eq(sessions.userId, userId));
      await tx.delete(users).where(eq(users.id, userId));
    });
    await authClient.signOut();
    return { success: true, redirect: "/" };
  });
