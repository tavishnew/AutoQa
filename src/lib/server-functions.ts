import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { projects, runs, testResults, users } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { authClient } from "@/auth/client";

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
