const $=id=>document.getElementById(id);
async function get(path){const r=await fetch(path);const d=await r.json();if(!r.ok)throw new Error(d.error||"Request failed");return d}
function list(el,items,render){if(!Array.isArray(items)||!items.length){el.innerHTML='<div class="muted">কোনো তথ্য পাওয়া যায়নি।</div>';return}el.innerHTML=items.slice(0,12).map(render).join("")}
function esc(v){return String(v??"—").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function load(){
 $("connection").textContent="সার্ভারের সঙ্গে সংযোগ হচ্ছে…";
 try{
  const [status,account,groups,pricing,history,tx,coupons,activity]=await Promise.all([
   get("/api/status"),get("/api/account"),get("/api/groups"),get("/api/pricing"),get("/api/group-history"),get("/api/transactions"),get("/api/coupons"),get("/api/activity-log")
  ]);
  $("connection").textContent=status.configured?"Connected · Read-only mode":"API keys configure করা হয়নি";
  $("username").textContent=account.username||"—";$("basic").textContent=account.basic_credits??"—";$("premium").textContent=account.premium_credits??"—";$("maxgroups").textContent=account.max_groups??"—";
  $("groupcount").textContent=Array.isArray(groups)?groups.length+" groups":"";
  list($("groups"),groups,g=>`<div class="item"><span><b>${esc(g.group_id)}</b><br><span class="muted">Clan: ${esc(g.clan_id)} · ${esc(g.region)}</span></span><span class="good">${esc(g.status)}</span></div>`);
  const regions=pricing.regions||[];$("pricing").innerHTML=`<div class="item"><span>Basic credit</span><b>$${esc(pricing.basic_credit_usd)}</b></div><div class="item"><span>Premium credit</span><b>$${esc(pricing.premium_credit_usd)}</b></div>`+regions.map(x=>`<div class="item"><span>${esc(x.region_name)} (${esc(x.id)})</span><b>${esc(x.tier)} · ${x.enabled?"Enabled":"Disabled"}</b></div>`).join("");
  list($("history"),history,h=>`<div class="item"><span>${esc(h.group_id)}<br><span class="muted">Clan ${esc(h.clan_id)}</span></span><span>${Number(h.glory_farmed||0).toLocaleString()} Glory<br><span class="muted">${esc(h.status)}</span></span></div>`);
  list($("transactions"),tx,t=>`<div class="item"><span>${esc(t.id)}<br><span class="muted">${esc(t.created_at)}</span></span><span>${esc(t.status)}<br><span class="muted">Basic ${esc(t.basic_credits)} / Premium ${esc(t.premium_credits)}</span></span></div>`);
  list($("coupons"),coupons,c=>`<div class="item"><span>${esc(c.code)}</span><span>${esc(c.status)}</span></div>`);
  list($("activity"),activity,a=>`<div class="item"><span>${esc(a.action)}<br><span class="muted">${esc(a.timestamp)}</span></span><span>${esc(a.group_id||"—")}</span></div>`);
 }catch(e){$("connection").textContent="সংযোগ হয়নি: "+e.message;["groups","pricing","history","transactions","coupons","activity"].forEach(id=>$(id).textContent=e.message)}
}
$("refresh").addEventListener("click",load);
$("loadprogress").addEventListener("click",async()=>{const id=$("groupid").value.trim();if(!id){$("progress").textContent="Group ID লিখুন।";return} $("progress").textContent="লোড হচ্ছে…";try{$("progress").textContent=JSON.stringify(await get("/api/glory-progression?group_id="+encodeURIComponent(id)),null,2)}catch(e){$("progress").textContent=e.message}});
if("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(()=>{});
load();