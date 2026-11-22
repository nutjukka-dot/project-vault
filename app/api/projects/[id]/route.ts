import { NextResponse } from "next/server";
import { hasSession } from "@/lib/auth";
import { getSupabaseAdmin, isDatabaseConfigured, isProductionStorageReady } from "@/lib/supabase";
import { deleteLocalProject, updateLocalProject } from "@/lib/local-store";

type Context = { params: Promise<{ id: string }> };
function storageUnavailable() {
  return NextResponse.json(
    { error: "Production database is not configured. Connect Supabase before using hosted storage." },
    { status: 503 },
  );
}

export async function PATCH(request: Request, context: Context) {
  if (!(await hasSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isProductionStorageReady) return storageUnavailable();

  const { id } = await context.params;
  const body = await request.json();
  if (!isDatabaseConfigured) {
    const project = await updateLocalProject(id, body);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json({ project, storageMode: "local" });
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of [
    "title", "description", "category", "status", "tech_stack", "tags",
    "github_url", "demo_url", "hosting_url", "docs_url", "notes", "deleted_at",
  ]) {
    if (key in body) patch[key] = body[key];
  }
  const { data, error } = await getSupabaseAdmin()!.from("projects").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project: data });
}

export async function DELETE(_request: Request, context: Context) {
  if (!(await hasSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isProductionStorageReady) return storageUnavailable();

  const { id } = await context.params;
  if (!isDatabaseConfigured) {
    const project = await deleteLocalProject(id);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json({ ok: true, storageMode: "local" });
  }

  const now = new Date().toISOString();
  const { error } = await getSupabaseAdmin()!
    .from("projects")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}