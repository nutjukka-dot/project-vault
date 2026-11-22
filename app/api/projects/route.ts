import { NextResponse } from "next/server";
import { hasSession } from "@/lib/auth";
import { getSupabaseAdmin, isDatabaseConfigured, isProductionStorageReady } from "@/lib/supabase";
import { listLocalProjects, createLocalProject } from "@/lib/local-store";

function storageUnavailable() {
  return NextResponse.json(
    { error: "Production database is not configured. Connect Supabase before using hosted storage." },
    { status: 503 },
  );
}

export async function GET(request: Request) {
  if (!(await hasSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isProductionStorageReady) return storageUnavailable();

  const trash = new URL(request.url).searchParams.get("trash") === "true";
  if (!isDatabaseConfigured) {
    return NextResponse.json({
      projects: await listLocalProjects(trash),
      databaseConfigured: false,
      storageMode: "local",
    });
  }

  let query = getSupabaseAdmin()!.from("projects").select("*").order("updated_at", { ascending: false });
  query = trash ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ projects: data ?? [], databaseConfigured: true, storageMode: "supabase" });
}

export async function POST(request: Request) {
  if (!(await hasSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isProductionStorageReady) return storageUnavailable();

  const body = await request.json();
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Project name is required" }, { status: 400 });

  if (!isDatabaseConfigured) {
    return NextResponse.json(
      { project: await createLocalProject({ ...body, title }), storageMode: "local" },
      { status: 201 },
    );
  }

  const payload = {
    title,
    description: body.description ?? "",
    category: body.category ?? "Other",
    status: body.status ?? "Planning",
    tech_stack: body.tech_stack ?? [],
    tags: body.tags ?? [],
    github_url: body.github_url || null,
    demo_url: body.demo_url || null,
    hosting_url: body.hosting_url || null,
    docs_url: body.docs_url || null,
    notes: body.notes ?? "",
  };
  const { data, error } = await getSupabaseAdmin()!.from("projects").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project: data }, { status: 201 });
}