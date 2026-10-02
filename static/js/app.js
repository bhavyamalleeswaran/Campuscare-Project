"use strict";
const API = "/api";
const state = { complaints: [], departments: [], view: "overview" };
const $ = (s, root = document) => root.querySelector(s);
const safe = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function csrfToken(){const match=document.cookie.match(/(?:^|; )csrftoken=([^;]+)/);return match?decodeURIComponent(match[1]):"";}
async function request(path, options = {}) {
  const headers = { Accept: "application/json", ...(options.body ? {"Content-Type":"application/json"} : {}) };
  if(options.method && options.method !== "GET"){const token=csrfToken();if(token)headers["X-CSRFToken"]=token;}
  const response = await fetch(`${API}${path}`, { ...options, headers, body: options.body ? JSON.stringify(options.body) : undefined });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(Object.entries(data).map(([k,v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" · ") || `Request failed (${response.status})`);
  return data;
}
const rows = data => Array.isArray(data) ? data : data?.results || [];
const statusKey = status => String(status || "submitted").toLowerCase().replaceAll(" ", "_");
const statusLabel = status => ({in_progress:"In Progress"}[statusKey(status)] || (status || "Submitted").replaceAll("_", " "));
const dateLabel = value => value ? new Intl.DateTimeFormat(undefined,{day:"numeric",month:"short",year:"numeric"}).format(new Date(value)) : "—";
function toast(message) { const el=$("#toast"); el.textContent=message; el.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove("show"),3200); }
function renderStats() {
  const all=state.complaints;
  $("#stat-total").textContent=all.length;
  $("#stat-progress").textContent=all.filter(c=>["submitted","assigned","in_progress"].includes(statusKey(c.status))).length;
  $("#stat-resolved").textContent=all.filter(c=>statusKey(c.status)==="resolved").length;
  $("#stat-departments").textContent=state.departments.length;
  $("#nav-count").textContent=all.length;
}
function renderComplaints() {
  const search=$("#search").value.trim().toLowerCase(), filter=$("#status-filter").value;
  let list=state.complaints.filter(c=>`${c.title} ${c.department_name} ${c.description} ${c.id}`.toLowerCase().includes(search) && (!filter || statusKey(c.status)===filter));
  if(state.view==="overview") list=list.slice(0,5);
  $("#complaint-rows").innerHTML=list.length ? list.map(c=>`<tr><td><span class="complaint-title">${safe(c.title)}</span><span class="complaint-meta">#${safe(c.id)} · ${safe(c.student_code)}</span></td><td>${safe(c.department_name)}</td><td>${dateLabel(c.created_at)}</td><td><span class="badge badge-${safe(statusKey(c.status))}">${safe(statusLabel(c.status))}</span></td><td><button class="row-action" data-detail="${safe(c.id)}" aria-label="View complaint">→</button></td></tr>`).join("") : `<tr><td colspan="5" class="empty">${state.complaints.length?"No complaints match these filters.":"No complaints yet. Raise the first one."}</td></tr>`;
  $("#result-count").textContent=`${list.length} ${list.length===1?"complaint":"complaints"} shown`;
}
function renderDepartments() {
  const icons=["⌂","⚙","✦","▧","♡","◈"];
  $("#department-grid").innerHTML=state.departments.length?state.departments.map((d,i)=>`<article class="dept-card"><i>${icons[i%icons.length]}</i><b>${safe(d.name)}</b><small>${safe(d.description||d.email||"Campus support team")}</small></article>`).join(""):"<div class='empty'>No departments found. Add departments in the Django admin.</div>";
  $("#department-select").innerHTML='<option value="">Select a department</option>'+state.departments.map(d=>`<option value="${safe(d.id)}">${safe(d.name)}</option>`).join("");
}
function render(){renderStats();renderComplaints();renderDepartments();}
async function load(){
  $("#complaint-rows").innerHTML='<tr><td colspan="5" class="empty">Loading complaints…</td></tr>';
  try { const [complaints,departments]=await Promise.all([request("/complaints/"),request("/departments/")]); state.complaints=rows(complaints);state.departments=rows(departments);render(); }
  catch(error){$("#complaint-rows").innerHTML=`<tr><td colspan="5" class="empty">Could not load API data: ${safe(error.message)}. Start Django and refresh.</td></tr>`;$("#department-grid").innerHTML="<div class='empty'>API unavailable.</div>";toast("Could not connect to CampusCare API.");}
}
function setView(view){state.view=view;document.body.dataset.view=view;const names={overview:"Overview",complaints:"Complaints",departments:"Departments"};$("#crumb").textContent=names[view];$("#list-title").textContent=view==="complaints"?"All complaints":"Recent complaints";$("#page-title").innerHTML=view==="overview"?"Good morning <em>✦</em>":names[view];document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===view));renderComplaints();$("#sidebar").classList.remove("open");}
function openDetail(c){
  $("#detail-content").innerHTML=`<div class="detail-head"><div><div class="eyebrow">COMPLAINT #${safe(c.id)}</div><h2>${safe(c.title)}</h2></div><button class="close" data-close="detail-dialog">×</button></div><p class="detail-desc">${safe(c.description)}</p><div class="detail-meta"><div><small>Department</small><b>${safe(c.department_name)}</b></div><div><small>Status</small><b><span class="badge badge-${safe(statusKey(c.status))}">${safe(statusLabel(c.status))}</span></b></div><div><small>Submitted</small><b>${dateLabel(c.created_at)}</b></div><div><small>Student</small><b>${safe(c.student_name)} · ${safe(c.student_code)}</b></div>${c.assignee_name?`<div><small>Assigned to</small><b>${safe(c.assignee_name)}</b></div>`:""}</div><h3>Progress history</h3><div class="history">${(c.status_updates||[]).map(u=>`<p><b>${safe(statusLabel(u.status))}</b> · ${dateLabel(u.created_at)}<br><small>${safe(u.note||"")}</small></p>`).join("")||"No updates yet."}</div><div class="detail-actions">${statusKey(c.status)==="resolved"?`<button class="button quiet" id="feedback" data-id="${safe(c.id)}">Leave feedback</button>`:""}<button class="button primary" data-close="detail-dialog">Done</button></div>`;
  const actions=$("#detail-content .detail-actions");
  const assignButton=document.createElement("button");assignButton.className="button quiet";assignButton.id="assign";assignButton.dataset.id=c.id;assignButton.textContent="Assign";actions.prepend(assignButton);
  const statusButton=document.createElement("button");statusButton.className="button quiet";statusButton.id="update-status";statusButton.dataset.id=c.id;statusButton.textContent="Update status";actions.prepend(statusButton);
  $("#detail-dialog").showModal();
}
async function leaveFeedback(id){const rating=Number(prompt("Rate the resolution from 1 to 5:"));if(!Number.isInteger(rating)||rating<1||rating>5){toast("Enter a rating from 1 to 5.");return;}const comment=prompt("Optional comment:")||"";try{await request("/feedback/",{method:"POST",body:{complaint:id,rating,comment}});$("#detail-dialog").close();toast("Thanks for your feedback.");}catch(e){toast(e.message);}}
async function assignComplaint(id){const staff_name=prompt("Staff member name:");if(!staff_name?.trim())return;const note=prompt("Assignment note (optional):")||"";try{await request("/assignments/",{method:"POST",body:{complaint:Number(id),staff_name:staff_name.trim(),note}});toast("Complaint assigned.");await load();}catch(e){toast(e.message);}}
async function updateComplaintStatus(id){const values=["submitted","assigned","in_progress","resolved","rejected"];const status=prompt(`New status (${values.join(", ")}):`);if(!status)return;if(!values.includes(status.trim())){toast("Choose a status from the list.");return;}const note=prompt("Update note (optional):")||"";const updated_by=prompt("Staff name (optional):")||"";try{await request("/status-updates/",{method:"POST",body:{complaint:Number(id),status:status.trim(),note,updated_by}});toast("Status updated.");await load();}catch(e){toast(e.message);}}
async function submitComplaint(event){event.preventDefault();const form=event.currentTarget, values=Object.fromEntries(new FormData(form));const button=$("#submit-complaint");button.disabled=true;button.textContent="Submitting…";$("#form-error").textContent="";
  try { let student=rows(await request(`/students/?search=${encodeURIComponent(values.student_code)}`)).find(s=>s.student_id.toLowerCase()===values.student_code.trim().toLowerCase());
    if(!student){const name=prompt("First submission: enter your full name.");if(!name?.trim())throw new Error("A student name is required to register your ID.");const email=prompt("Enter your student email address:");if(!email?.trim())throw new Error("A student email is required to register your ID.");student=await request("/students/",{method:"POST",body:{student_id:values.student_code.trim(),full_name:name.trim(),email:email.trim()}});}
    await request("/complaints/",{method:"POST",body:{student:student.id,department:Number(values.department),title:values.title.trim(),description:values.description.trim()}});
    $("#complaint-dialog").close();form.reset();toast("Your complaint has been submitted.");await load();
  } catch(e){$("#form-error").textContent=e.message;} finally{button.disabled=false;button.textContent="Submit complaint →";}}
$("#new-complaint").addEventListener("click",()=>$("#complaint-dialog").showModal());$("#hero-new").addEventListener("click",()=>$("#complaint-dialog").showModal());$("#complaint-form").addEventListener("submit",submitComplaint);$("#search").addEventListener("input",renderComplaints);$("#status-filter").addEventListener("change",renderComplaints);$("#menu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
document.addEventListener("click",e=>{const view=e.target.closest("[data-view]");if(view)setView(view.dataset.view);const close=e.target.closest("[data-close]");if(close)$(`#${close.dataset.close}`).close();const detail=e.target.closest("[data-detail]");if(detail){const item=state.complaints.find(c=>String(c.id)===detail.dataset.detail);if(item)openDetail(item);}if(e.target.id==="feedback")leaveFeedback(e.target.dataset.id);if(e.target.id==="assign")assignComplaint(e.target.dataset.id);if(e.target.id==="update-status")updateComplaintStatus(e.target.dataset.id);});
$("#date-label").textContent=new Intl.DateTimeFormat(undefined,{weekday:"long",month:"long",day:"numeric"}).format(new Date()).toUpperCase();const hour=new Date().getHours();$("#page-title").innerHTML=`${hour<12?"Good morning":hour<17?"Good afternoon":"Good evening"} <em>✦</em>`;load();
