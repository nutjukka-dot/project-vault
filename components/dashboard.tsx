"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Leaf, LayoutDashboard, FolderKanban, Trash2, Plus, Search, Grid2X2, List,
  Code2, ExternalLink, Github, Globe2, FileText, MoreHorizontal, ArrowUpRight,
  Boxes, CheckCircle2, Clock3, CircleDot, Database, Download, LogOut, X,
  ChevronRight, FolderOpen, SlidersHorizontal, Pencil, RotateCcw, Archive
} from "lucide-react";

type Status = "Planning" | "Developing" | "Completed" | "Archived";
type Project = {
  id: string; title: string; description: string; category: string; status: Status;
  tech_stack: string[]; tags: string[]; github_url: string | null; demo_url: string | null;
  hosting_url: string | null; docs_url: string | null; notes: string;
  created_at: string; updated_at: string; deleted_at: string | null;
};
const EMPTY_FORM = { title:"", description:"", category:"Web App", status:"Planning" as Status, tech_stack:"", tags:"", github_url:"", demo_url:"", hosting_url:"", docs_url:"", notes:"" };
const statusLabel: Record<Status,string> = { Planning:"Planning", Developing:"Developing", Completed:"Completed", Archived:"Archived" };
const categories = ["Web App","Website","Mobile App","AI / ML","Tool","Other"];
const sampleProjects: Project[] = [];

function relativeDate(value?: string) {
  if (!value) return "ยังไม่มีการแก้ไข";
  const days = Math.max(0, Math.floor((Date.now()-new Date(value).getTime())/86400000));
  if (days===0) return "Updated today";
  if (days===1) return "Updated yesterday";
  if (days<30) return `Updated ${days} days ago`;
  return new Date(value).toLocaleDateString("th-TH",{day:"numeric",month:"short",year:"numeric"});
}
function projectIcon(category:string) {
  if (category==="AI / ML") return <Boxes size={18}/>;
  if (category==="Tool") return <SlidersHorizontal size={18}/>;
  if (category==="Mobile App") return <CircleDot size={18}/>;
  return <Code2 size={18}/>;
}
function statusClass(status:string) { return status.toLowerCase(); }

export default function Dashboard() {
  const router = useRouter();
  const [projects,setProjects] = useState<Project[]>(sampleProjects);
  const [trash,setTrash] = useState<Project[]>([]);
  const [databaseConfigured,setDatabaseConfigured] = useState(false);
  const [storageUnavailable,setStorageUnavailable] = useState(false);
  const [loading,setLoading] = useState(true);
  const [activeTab,setActiveTab] = useState<"overview"|"projects"|"trash">("overview");
  const [query,setQuery] = useState("");
  const [categoryFilter,setCategoryFilter] = useState("All categories");
  const [statusFilter,setStatusFilter] = useState("All status");
  const [view,setView] = useState<"grid"|"list">("grid");
  const [modal,setModal] = useState<"create"|"edit"|"detail"|null>(null);
  const [selected,setSelected] = useState<Project|null>(null);
  const [form,setForm] = useState(EMPTY_FORM);
  const [saving,setSaving] = useState(false);
  const [toast,setToast] = useState("");
  const [menuId,setMenuId] = useState<string|null>(null);

  const notify = useCallback((message:string) => { setToast(message); window.setTimeout(()=>setToast(""),2800); },[]);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [activeRes,trashRes] = await Promise.all([fetch("/api/projects"),fetch("/api/projects?trash=true")]);
      if (activeRes.status===401) { router.replace("/login"); return; }
      const activeData = await activeRes.json();
      const trashData = await trashRes.json();
      setStorageUnavailable(activeRes.status === 503 || trashRes.status === 503);
      setDatabaseConfigured(Boolean(activeData.databaseConfigured));
      setProjects(activeData.projects ?? []);
      setTrash(trashData.projects ?? []);
      if (activeRes.status === 503) notify(activeData.error || "ยังไม่ได้ตั้งค่าฐานข้อมูลสำหรับ Production");
    } catch { notify("ไม่สามารถโหลดข้อมูลได้"); }
    finally { setLoading(false); }
  },[router,notify]);
  useEffect(()=>{ void load(); },[load]);

  const filtered = useMemo(()=>projects.filter(p=>{
    const haystack=[p.title,p.description,p.category,...(p.tech_stack??[]),...(p.tags??[])].join(" ").toLowerCase();
    return haystack.includes(query.toLowerCase()) && (categoryFilter==="All categories"||p.category===categoryFilter) && (statusFilter==="All status"||p.status===statusFilter);
  }),[projects,query,categoryFilter,statusFilter]);
  const stats = useMemo(()=>({
    total:projects.length, active:projects.filter(p=>p.status==="Developing").length,
    completed:projects.filter(p=>p.status==="Completed").length,
    planning:projects.filter(p=>p.status==="Planning").length
  }),[projects]);

  function openCreate() { setSelected(null); setForm(EMPTY_FORM); setModal("create"); }
  function openEdit(p:Project) { setSelected(p); setForm({...EMPTY_FORM,...p,tech_stack:(p.tech_stack??[]).join(", "),tags:(p.tags??[]).join(", "),github_url:p.github_url??"",demo_url:p.demo_url??"",hosting_url:p.hosting_url??"",docs_url:p.docs_url??""}); setModal("edit"); setMenuId(null); }
  function openDetail(p:Project) { setSelected(p); setModal("detail"); setMenuId(null); }
  function setField(key:string,value:string) { setForm(old=>({...old,[key]:value})); }

  async function saveProject(e:React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    const payload={...form,tech_stack:form.tech_stack.split(",").map(x=>x.trim()).filter(Boolean),tags:form.tags.split(",").map(x=>x.trim()).filter(Boolean)};
    try {
      const res=await fetch(selected&&modal==="edit"?`/api/projects/${selected.id}`:"/api/projects",{method:selected&&modal==="edit"?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await res.json(); if(!res.ok)throw new Error(data.error||"บันทึกไม่สำเร็จ");
      setModal(null); await load(); notify(selected?"อัปเดตโปรเจกต์แล้ว":"เพิ่มโปรเจกต์แล้ว");
    } catch(err) { notify(err instanceof Error?err.message:"บันทึกไม่สำเร็จ"); }
    finally { setSaving(false); }
  }

  async function archiveProject(p:Project) {
    try { const res=await fetch(`/api/projects/${p.id}`,{method:"DELETE"}); if(!res.ok)throw new Error(); await load(); setMenuId(null); setModal(null); notify("ย้ายโปรเจกต์ไปถังขยะแล้ว"); }
    catch { notify("ไม่สามารถลบโปรเจกต์ได้"); }
  }
  async function restoreProject(p:Project) {
    try { const res=await fetch(`/api/projects/${p.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({deleted_at:null})}); if(!res.ok)throw new Error(); await load(); notify("กู้คืนโปรเจกต์แล้ว"); }
    catch { notify("กู้คืนไม่สำเร็จ"); }
  }
  async function logout() { await fetch("/api/logout",{method:"POST"}); router.replace("/login"); router.refresh(); }
  function exportCSV() {
    const rows=[["Name","Description","Category","Status","Tech Stack","Tags","GitHub","Demo","Hosting","Documentation","Notes","Created","Updated"],...projects.map(p=>[p.title,p.description,p.category,p.status,(p.tech_stack??[]).join("; "),(p.tags??[]).join("; "),p.github_url??"",p.demo_url??"",p.hosting_url??"",p.docs_url??"",p.notes,p.created_at,p.updated_at])];
    const csv=rows.map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const url=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"})); const a=document.createElement("a");a.href=url;a.download="project-vault-backup.csv";a.click();URL.revokeObjectURL(url);notify("Export ข้อมูลแล้ว");
  }

  const pageTitle=activeTab==="overview"?"Overview":activeTab==="projects"?"All Projects":"Trash";
  const pageSub=activeTab==="overview"?"Your ideas, work and experiments — all in one quiet place.":activeTab==="projects"?"จัดการและค้นหาโปรเจกต์ทั้งหมดของคุณ":"โปรเจกต์ที่ลบไว้ สามารถกู้คืนได้จากที่นี่";
  const visible=activeTab==="trash"?trash:activeTab==="overview"?projects.slice(0,6):filtered;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="side-brand"><div className="brand-mark"><Leaf size={19}/></div><div><strong>Project Vault</strong><span>PERSONAL WORKSPACE</span></div></div>
      <p className="nav-label">WORKSPACE</p>
      <nav className="side-nav">
        <button className={`nav-item ${activeTab==="overview"?"active":""}`} onClick={()=>setActiveTab("overview")}><LayoutDashboard size={17}/>Overview</button>
        <button className={`nav-item ${activeTab==="projects"?"active":""}`} onClick={()=>setActiveTab("projects")}><FolderKanban size={17}/>All Projects<span className="nav-count">{projects.length}</span></button>
        <button className={`nav-item ${activeTab==="trash"?"active":""}`} onClick={()=>setActiveTab("trash")}><Trash2 size={17}/>Trash<span className="nav-count">{trash.length}</span></button>
      </nav>
      <div className="sidebar-bottom">
        <div className="storage-note"><div className="note-icon"><Database size={16}/></div><strong>One space, every project</strong><p>เก็บลิงก์และรายละเอียดสำคัญ เพื่อกลับมาทำงานต่อได้ทุกที่</p></div>
        <div className="profile-row"><div className="avatar">PV</div><div className="profile-meta"><strong>My Workspace</strong><span>Private account</span></div><button className="icon-button" title="ออกจากระบบ" onClick={logout}><LogOut size={15}/></button></div>
      </div>
    </aside>

    <main className="main-area">
      <div className="mobile-header"><div className="mobile-brand"><div className="brand-mark"><Leaf size={17}/></div>Project Vault</div><button className="icon-button" onClick={logout} title="ออกจากระบบ"><LogOut size={17}/></button></div>
      <div className="topbar"><div className="breadcrumb">WORKSPACE <span> / </span><b>{pageTitle.toUpperCase()}</b></div><div className="top-actions"><span className="date-label">{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</span><button className="btn" onClick={exportCSV}><Download size={14}/>Export</button><button className="btn btn-primary" onClick={openCreate}><Plus size={15}/>Add Project</button></div></div>
      <div className="page-heading"><div><p className="section-kicker">YOUR DIGITAL WORKSPACE</p><h1>{pageTitle}</h1><p>{pageSub}</p></div>{activeTab!=="trash"&&<button className="btn btn-primary" onClick={openCreate}><Plus size={15}/>New Project</button>}</div>

      {!databaseConfigured&&!storageUnavailable&&<div className="database-banner"><Database size={18}/><div><strong>Local storage mode</strong><p>ข้อมูลจะถูกบันทึกไว้ในเครื่องนี้โดยอัตโนมัติ และสามารถ Export เป็น CSV เพื่อสำรองข้อมูลได้</p></div><span className="tag">Saved locally</span></div>}
      {storageUnavailable&&<div className="database-banner is-warning"><Database size={18}/><div><strong>Production database is not configured</strong><p>ต้องเชื่อมต่อ Supabase และตั้งค่า Environment Variables บน Vercel ก่อนจึงจะบันทึกข้อมูลบนเว็บไซต์จริงได้</p></div></div>}

      {activeTab==="overview"&&<div className="stats-grid">
        <div className="stat-card"><div className="stat-top">Total Projects<span className="stat-icon"><FolderKanban size={15}/></span></div><div className="stat-value">{stats.total}</div><div className="stat-caption">All projects in your vault</div></div>
        <div className="stat-card"><div className="stat-top">In Development<span className="stat-icon"><CircleDot size={15}/></span></div><div className="stat-value">{stats.active}</div><div className="stat-caption">Currently being worked on</div></div>
        <div className="stat-card"><div className="stat-top">Completed<span className="stat-icon"><CheckCircle2 size={15}/></span></div><div className="stat-value">{stats.completed}</div><div className="stat-caption">Finished projects</div></div>
        <div className="stat-card"><div className="stat-top">Planning<span className="stat-icon"><Clock3 size={15}/></span></div><div className="stat-value">{stats.planning}</div><div className="stat-caption">Ideas and upcoming work</div></div>
      </div>}

      {activeTab!=="overview"&&activeTab!=="trash"&&<div className="toolbar">
        <div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ค้นหาชื่อ โปรเจกต์ หรือเทคโนโลยี..."/></div>
        <select className="filter-select" value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option>All categories</option>{categories.map(c=><option key={c}>{c}</option>)}</select>
        <select className="filter-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>All status</option>{Object.keys(statusLabel).map(s=><option key={s}>{s}</option>)}</select>
        <div className="view-toggle"><button className={view==="grid"?"active":""} onClick={()=>setView("grid")}><Grid2X2 size={15}/></button><button className={view==="list"?"active":""} onClick={()=>setView("list")}><List size={16}/></button></div>
      </div>}

      <section className="content-card">
        <div className="content-head"><div><h2>{activeTab==="overview"?"Recently Updated":activeTab==="trash"?"Deleted Projects":"Project Library"}</h2><p>{activeTab==="overview"?"โปรเจกต์ที่คุณแก้ไขล่าสุด":activeTab==="trash"?"รายการที่อยู่ในถังขยะ":`${filtered.length} projects found`}</p></div>{activeTab==="overview"&&<button className="text-link" onClick={()=>setActiveTab("projects")}>View all <ChevronRight size={14}/></button>}</div>
        {loading?<div className="empty-state"><div className="empty-icon"><FolderOpen size={22}/></div><p>กำลังโหลดข้อมูล...</p></div>:
        activeTab==="trash"?(trash.length===0?<div className="empty-state"><div className="empty-icon"><Trash2 size={22}/></div><h3>ถังขยะว่างเปล่า</h3><p>โปรเจกต์ที่คุณลบจะปรากฏที่นี่</p></div>:<div className="project-list">{trash.map(p=><div className="project-row" key={p.id}><div className="project-symbol">{projectIcon(p.category)}</div><div className="project-row-main"><strong>{p.title}</strong><span>{p.category} · Deleted {relativeDate(p.deleted_at??undefined)}</span></div><button className="btn btn-small" onClick={()=>restoreProject(p)}><RotateCcw size={13}/>Restore</button></div>)}</div>):
        visible.length===0?<div className="empty-state"><div className="empty-icon"><FolderOpen size={22}/></div><h3>ยังไม่มีโปรเจกต์ในคลัง</h3><p>เพิ่มโปรเจกต์แรกของคุณเพื่อเริ่มต้น</p><button className="btn btn-primary" onClick={openCreate}><Plus size={14}/>Add your first project</button></div>:
        <div className={view==="grid"||activeTab==="overview"?"project-grid":"project-list"}>{visible.map(p=><article className={view==="grid"||activeTab==="overview"?"project-card":"project-row"} key={p.id} onClick={()=>openDetail(p)}>
          <div className="project-card-top"><div className="project-symbol">{projectIcon(p.category)}</div><button className="project-menu" onClick={e=>{e.stopPropagation();setMenuId(menuId===p.id?null:p.id)}}><MoreHorizontal size={18}/></button>
            {menuId===p.id&&<div className="row-menu"><button onClick={e=>{e.stopPropagation();openEdit(p)}}><Pencil size={13}/>Edit</button><button onClick={e=>{e.stopPropagation();void archiveProject(p)}}><Trash2 size={13}/>Move to trash</button></div>}
          </div>
          <h3>{p.title}</h3><p className="project-desc">{p.description||"No description added yet."}</p>
          <div className="project-tags">{(p.tech_stack??[]).slice(0,3).map(t=><span className="tag" key={t}>{t}</span>)}{(p.tech_stack??[]).length>3&&<span className="tag tag-more">+{p.tech_stack.length-3}</span>}</div>
          <div className="project-card-foot"><span className={`status ${statusClass(p.status)}`}>{p.status}</span><span className="updated">{relativeDate(p.updated_at)}</span></div>
        </article>)}</div>}
      </section>
      <div className="footer-note">MADE FOR FOCUS <span>·</span> YOUR PROJECTS, IN ONE PLACE</div>
    </main>
    <nav className="mobile-nav"><button className={activeTab==="overview"?"active":""} onClick={()=>setActiveTab("overview")}><LayoutDashboard size={17}/>Home</button><button className={activeTab==="projects"?"active":""} onClick={()=>setActiveTab("projects")}><FolderKanban size={17}/>Projects</button><button onClick={exportCSV}><Download size={17}/>Export</button><button className={activeTab==="trash"?"active":""} onClick={()=>setActiveTab("trash")}><Trash2 size={17}/>Trash</button></nav>

    {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(null)}}><div className="modal">
      <div className="modal-header"><div><h2>{modal==="create"?"Add a project":modal==="edit"?"Edit project":selected?.title}</h2><p>{modal==="detail"?"Project information and useful links": "เพิ่มรายละเอียดที่จำเป็น แล้วกลับมาแก้ไขได้ภายหลัง"}</p></div><button className="modal-close" onClick={()=>setModal(null)}><X size={17}/></button></div>
      {modal==="detail"&&selected?<div>
        <div className="project-tags"><span className="tag">{selected.category}</span><span className={`status ${statusClass(selected.status)}`}>{selected.status}</span>{(selected.tags??[]).map(t=><span className="tag" key={t}>{t}</span>)}</div>
        <div className="detail-links">{selected.github_url&&<a className="detail-link" href={selected.github_url} target="_blank" rel="noreferrer"><Github size={14}/>GitHub <ExternalLink size={11}/></a>}{selected.demo_url&&<a className="detail-link" href={selected.demo_url} target="_blank" rel="noreferrer"><Globe2 size={14}/>Live Demo <ExternalLink size={11}/></a>}{selected.hosting_url&&<a className="detail-link" href={selected.hosting_url} target="_blank" rel="noreferrer"><ExternalLink size={14}/>Hosting</a>}{selected.docs_url&&<a className="detail-link" href={selected.docs_url} target="_blank" rel="noreferrer"><FileText size={14}/>Documentation</a>}</div>
        <div className="detail-block"><h4>DESCRIPTION</h4><p>{selected.description||"No description added."}</p></div>
        <div className="detail-block"><h4>TECH STACK</h4><div className="project-tags">{(selected.tech_stack??[]).map(t=><span className="tag" key={t}>{t}</span>)}</div></div>
        {selected.notes&&<div className="detail-block"><h4>NOTES</h4><p>{selected.notes}</p></div>}
        <div className="detail-block"><h4>LAST UPDATED</h4><p>{relativeDate(selected.updated_at)}</p></div>
        <div className="modal-actions"><button className="btn" onClick={()=>openEdit(selected)}><Pencil size={14}/>Edit project</button><button className="btn btn-primary" onClick={()=>setModal(null)}>Done</button></div>
      </div>:<form onSubmit={saveProject}>
        <div className="form-grid">
          <div className="field full"><label>Project name *</label><input required value={form.title} onChange={e=>setField("title",e.target.value)} placeholder="เช่น Supplemate"/></div>
          <div className="field full"><label>Description</label><textarea value={form.description} onChange={e=>setField("description",e.target.value)} placeholder="โปรเจกต์นี้เกี่ยวกับอะไร..."/></div>
          <div className="field"><label>Category</label><select value={form.category} onChange={e=>setField("category",e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
          <div className="field"><label>Status</label><select value={form.status} onChange={e=>setField("status",e.target.value)}>{Object.keys(statusLabel).map(s=><option key={s}>{s}</option>)}</select></div>
          <div className="field full"><label>Tech Stack</label><input value={form.tech_stack} onChange={e=>setField("tech_stack",e.target.value)} placeholder="Next.js, Python, Supabase"/><p className="field-hint">คั่นแต่ละรายการด้วยเครื่องหมายจุลภาค</p></div>
          <div className="field"><label>GitHub Repository</label><input type="url" value={form.github_url} onChange={e=>setField("github_url",e.target.value)} placeholder="https://github.com/..."/></div>
          <div className="field"><label>Live Demo</label><input type="url" value={form.demo_url} onChange={e=>setField("demo_url",e.target.value)} placeholder="https://..."/></div>
          <div className="field"><label>Hosting URL</label><input type="url" value={form.hosting_url} onChange={e=>setField("hosting_url",e.target.value)} placeholder="https://..."/></div>
          <div className="field"><label>Documentation</label><input type="url" value={form.docs_url} onChange={e=>setField("docs_url",e.target.value)} placeholder="https://..."/></div>
          <div className="field full"><label>Tags</label><input value={form.tags} onChange={e=>setField("tags",e.target.value)} placeholder="Personal, University, Research"/></div>
          <div className="field full"><label>Notes</label><textarea value={form.notes} onChange={e=>setField("notes",e.target.value)} placeholder="บันทึกสิ่งที่ควรจำ หรือสิ่งที่ต้องทำต่อ..."/></div>
        </div>
        <div className="modal-actions"><button type="button" className="btn" onClick={()=>setModal(null)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}><Plus size={14}/>{saving?"Saving...":"Save Project"}</button></div>
      </form>}
    </div></div>}
    {toast&&<div className="toast"><CheckCircle2 size={16}/>{toast}</div>}
  </div>;
}