const cfg=window.BOOKITA_CONFIG||{};
const validConfig=cfg.supabaseUrl&&!cfg.supabaseUrl.includes("YOUR-PROJECT")&&cfg.supabaseAnonKey&&!cfg.supabaseAnonKey.includes("YOUR-SUPABASE");
const sb=validConfig&&window.supabase?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;
const demoServices=[{id:"s1",name:"Make Up Look",description:"Make up natural hingga glam untuk berbagai acara.",duration_minutes:90,price:350000,image_url:"https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=700&q=80"},{id:"s2",name:"Hair Styling",description:"Blow, curl, dan styling dengan hasil profesional.",duration_minutes:60,price:250000,image_url:"https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=700&q=80"},{id:"s3",name:"Nail Art",description:"Perawatan kuku dan nail art dengan desain cantik.",duration_minutes:60,price:200000,image_url:"https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=700&q=80"},{id:"s4",name:"Facial Treatment",description:"Deep cleansing untuk kulit terasa lebih segar.",duration_minutes:60,price:300000,image_url:"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=700&q=80"}];
const demoStaff=[{id:"st1",name:"Victoria Bair"},{id:"st2",name:"Alexandra Sel"},{id:"st3",name:"Laura Martin"}];
let services=[],staff=[],demoBookings=JSON.parse(localStorage.getItem("bookitaV2Bookings")||"[]");
const $=s=>document.querySelector(s),fmt=n=>"Rp"+Number(n).toLocaleString("id-ID");
function notify(t){const el=$("#toast");el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2800)}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function localDateTime(date,time){return new Date(`${date}T${time}:00+07:00`).toISOString()}
async function loadCatalog(){
 if(sb){const [a,b]=await Promise.all([sb.from("services").select("*").eq("is_active",true).order("name"),sb.from("staff").select("*").eq("is_active",true).order("name")]);if(!a.error&&!b.error&&a.data.length&&b.data.length){services=a.data;staff=b.data}else{notify("Database belum memiliki layanan/stylist. Menampilkan data contoh.");services=demoServices;staff=demoStaff}}
 else{services=demoServices;staff=demoStaff}
 $("#serviceGrid").innerHTML=services.map((s,i)=>`<article class="service-card"><div class="service-image"><img src="${escapeHtml(s.image_url||demoServices[i%demoServices.length].image_url)}" alt="${escapeHtml(s.name)}" loading="lazy"></div><div class="service-info"><h3>${escapeHtml(s.name)}</h3><p>${escapeHtml(s.description||"Layanan salon profesional untukmu.")}</p><div class="service-meta"><b>${fmt(s.price)}</b><span>◷ ${s.duration_minutes} min</span></div></div></article>`).join("");
 $("#serviceSelect").innerHTML='<option value="">Pilih layanan</option>'+services.map(s=>`<option value="${s.id}">${escapeHtml(s.name)} · ${fmt(s.price)}</option>`).join("");
 $("#staffSelect").innerHTML='<option value="">Pilih stylist</option>'+staff.map(s=>`<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("");
}
async function getSlots(){
 const serviceId=$("#serviceSelect").value,staffId=$("#staffSelect").value,date=$("#bookingDate").value,select=$("#slotSelect"),note=$("#availabilityNote");
 select.innerHTML='<option value="">Memuat slot...</option>';
 if(!serviceId||!staffId||!date){select.innerHTML='<option value="">Pilih layanan, stylist & tanggal</option>';note.textContent="Pilih layanan, stylist, dan tanggal untuk melihat slot tersedia.";return}
 let slots=[];
 if(sb){const {data,error}=await sb.rpc("get_available_slots",{p_service_id:serviceId,p_staff_id:staffId,p_date:date});if(error){console.error(error);select.innerHTML='<option value="">Gagal memuat slot</option>';note.textContent="Tidak dapat memuat jadwal. Periksa konfigurasi database.";return}slots=(data||[]).map(x=>x.slot_start)}
 else{
  const service=services.find(s=>s.id===serviceId),duration=service?.duration_minutes||60;
  for(let m=9*60;m+duration<=18*60;m+=30){const start=`${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;const busy=demoBookings.some(b=>b.date===date&&b.staff_id===staffId&&b.status!=="cancelled"&&b.status!=="no_show"&&(()=>{let a=m,bm=b.start_min,be=bm+b.duration;return a<be&&a+duration>bm})());if(!busy)slots.push(start)}
 }
 select.innerHTML=slots.length?'<option value="">Pilih jam tersedia</option>'+slots.map(s=>{let t=sb?new Date(s).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",timeZone:cfg.timezone||"Asia/Jakarta",hour12:false}):s;return `<option value="${t}">${t}</option>`}).join(""):'<option value="">Tidak ada slot tersedia</option>';
 note.textContent=slots.length?`${slots.length} slot tersedia. Slot yang sudah terisi otomatis tidak ditampilkan.`:"Belum ada slot pada tanggal ini. Coba tanggal atau stylist lain.";
}
["serviceSelect","staffSelect","bookingDate"].forEach(id=>$("#"+id).addEventListener("change",getSlots));
$("#bookingDate").min=dateKey(new Date());
$("#customerBookingForm").addEventListener("submit",async e=>{
 e.preventDefault();const f=new FormData(e.target),service=services.find(s=>s.id===f.get("service_id")),person=staff.find(s=>s.id===f.get("staff_id"));if(!service||!person)return;
 const btn=$("#submitBooking");btn.disabled=true;btn.textContent="Processing...";
 try{
  let result;
  if(sb){const {data,error}=await sb.rpc("create_booking",{p_customer_name:f.get("customer_name").trim(),p_phone:f.get("phone").trim(),p_service_id:f.get("service_id"),p_staff_id:f.get("staff_id"),p_start_at:localDateTime(f.get("booking_date"),f.get("slot")),p_notes:f.get("notes")||""});if(error)throw error;result=data}
  else{const time=f.get("slot"),[h,m]=time.split(":").map(Number),start=h*60+m,duration=service.duration_minutes;const clash=demoBookings.some(b=>b.date===f.get("booking_date")&&b.staff_id===person.id&&b.status!=="cancelled"&&b.status!=="no_show"&&start<b.start_min+b.duration&&start+duration>b.start_min);if(clash)throw new Error("Slot baru saja dipesan orang lain. Pilih slot lain.");const code="BK"+Date.now().toString().slice(-8);result={booking_code:code,customer_name:f.get("customer_name"),service_name:service.name,staff_name:person.name,starts_at:f.get("booking_date")+"T"+time+":00",status:"confirmed"};demoBookings.push({booking_code:code,date:f.get("booking_date"),staff_id:person.id,start_min:start,duration,status:"confirmed",customer_name:f.get("customer_name"),phone:f.get("phone"),service_name:service.name,staff_name:person.name,starts_at:result.starts_at});localStorage.setItem("bookitaV2Bookings",JSON.stringify(demoBookings))}
  $("#successCode").textContent=result.booking_code;$("#successDetails").innerHTML=`${escapeHtml(result.service_name||service.name)} with ${escapeHtml(result.staff_name||person.name)}<br>${new Date(result.starts_at).toLocaleString("id-ID",{dateStyle:"long",timeStyle:"short"})}`;$("#successModal").classList.add("show");e.target.reset();await getSlots();
 }catch(err){console.error(err);notify(err.message||"Booking gagal. Silakan coba lagi.");await getSlots()}
 finally{btn.disabled=false;btn.innerHTML='Confirm my booking <span>→</span>'}
});
function closeSuccess(){$("#successModal").classList.remove("show")}$("#closeSuccess").onclick=closeSuccess;$("#doneSuccess").onclick=closeSuccess;
$("#lookupForm").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.target),code=f.get("code").trim(),phone=f.get("phone").trim(),out=$("#lookupResult");out.textContent="Memeriksa...";
 if(sb){const {data,error}=await sb.rpc("lookup_booking",{p_booking_code:code,p_phone:phone});if(error||!data){out.textContent="Booking tidak ditemukan. Periksa kode dan nomor WhatsApp.";return}out.textContent=`${data.service_name} · ${data.status} · ${new Date(data.starts_at).toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"})}`}
 else{const b=demoBookings.find(x=>x.booking_code.toLowerCase()===code.toLowerCase()&&x.phone===phone);out.textContent=b?`${b.service_name} · ${b.status} · ${b.date} ${b.starts_at.slice(11,16)}`:"Data demo hanya tersedia di browser tempat booking dibuat."}
});
$("#mobileNav").onclick=()=>$(".customer-nav").classList.toggle("mobile-open");
loadCatalog();
