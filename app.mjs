
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';

const FIREBASE_CONFIG={apiKey:"AIzaSyB7NU4h_cgjPd9U894RkJXxj1DxuT_47aE",authDomain:"gws-project-9dfee.firebaseapp.com",projectId:"gws-project-9dfee",storageBucket:"gws-project-9dfee.firebasestorage.app",messagingSenderId:"1030738489010",appId:"1:1030738489010:web:f35eb21cc0512fed3563ab"};
const FIRESTORE_DOC_PATH=['dashboards','growth-syndicate-main'];
const CLOUD_ENABLED=Boolean(FIREBASE_CONFIG.apiKey&&FIREBASE_CONFIG.projectId);
const COLORS=['#111827','#2563eb','#7c3aed','#16803c','#c62828','#0891b2','#be185d','#475467'];
const TASK_TYPES=['Graphic Design','Video','Content','Ads','Website','Presentation','Branding','Other'];
const CHANNELS=[{key:'mail',label:'Mail'},{key:'fb',label:'FB Page'},{key:'instagram',label:'Instagram'},{key:'lineoa',label:'LINE OA'},{key:'tiktok',label:'TikTok'},{key:'shopee',label:'Shopee'},{key:'lazada',label:'Lazada'}];
const OWNER_EMAILS=['jonusworks@gmail.com'];
const DEFAULT_DATA={brands:[brandObj('Growth Syndicate','Retainer',12),brandObj('TechZone','Content Package',6),brandObj('Oasis Beauty','Branding Package',3),brandObj('ACME Corp','Ads Package',6),brandObj('สยามพาณิชย์','Presentation Package',12),brandObj('เจริญโภคภัณฑ์','Website Package',4)],team:[{name:'นายธนา สมิท',role:'manager',email:'',color:COLORS[0]},{name:'พิมชนก วงศ์เจริญ',role:'manager',email:'',color:COLORS[1]},{name:'กิตติ์ อินทรา',role:'graphic',email:'',color:COLORS[2]},{name:'อรนุช ทองดี',role:'graphic',email:'',color:COLORS[3]},{name:'ณัฐวุฒิ พรทวี',role:'graphic',email:'',color:COLORS[4]},{name:'สุภาพร แก้วมณี',role:'graphic',email:'',color:COLORS[5]}],tasks:[]};
DEFAULT_DATA.tasks=[
  {id:1,name:'โปสเตอร์โปรโมชั่นมิถุนายน',brand:'Growth Syndicate',assigner:DEFAULT_DATA.team[0],assignee:DEFAULT_DATA.team[2],startDate:'2025-05-10',deadline:'2025-05-25',status:'inprogress',review:'pending',priority:'normal',type:'Graphic Design',brief:[fileObj('Brief June','https://drive.google.com/')],deliver:[],note:'ใช้สีทองตามแบรนด์',history:[]},
  {id:2,name:'ออกแบบโลโก้ใหม่',brand:'Oasis Beauty',assigner:DEFAULT_DATA.team[1],assignee:DEFAULT_DATA.team[3],startDate:'2025-05-08',deadline:'2025-05-20',status:'review',review:'pending',priority:'medium',type:'Branding',brief:[fileObj('Logo Guideline','https://drive.google.com/')],deliver:[fileObj('Logo V1','https://drive.google.com/')],note:'',history:[]},
  {id:3,name:'Banner Social Media ประจำสัปดาห์',brand:'TechZone',assigner:DEFAULT_DATA.team[0],assignee:DEFAULT_DATA.team[4],startDate:'2025-05-15',deadline:'2025-05-17',status:'todo',review:'-',priority:'high',type:'Graphic Design',brief:[fileObj('Content Plan','https://drive.google.com/')],deliver:[],note:'',history:[]},
  {id:4,name:'อินโฟกราฟิก Annual Report 2024',brand:'สยามพาณิชย์',assigner:DEFAULT_DATA.team[1],assignee:DEFAULT_DATA.team[2],startDate:'2025-04-20',deadline:'2025-05-05',status:'done',review:'passed',priority:'normal',type:'Presentation',brief:[fileObj('Report Data','https://drive.google.com/')],deliver:[fileObj('Final PDF','https://drive.google.com/')],note:'อนุมัติแล้ว',history:[]},
  {id:5,name:'แบนเนอร์เว็บไซต์ 5 ขนาด',brand:'เจริญโภคภัณฑ์',assigner:DEFAULT_DATA.team[0],assignee:DEFAULT_DATA.team[5],startDate:'2025-05-12',deadline:'2025-05-19',status:'revision',review:'failed',priority:'medium',type:'Website',brief:[fileObj('Banner Brief','https://drive.google.com/')],deliver:[fileObj('Banner V1','https://drive.google.com/')],note:'แก้ font size hero',history:[]}
];
// Start with no sample financial rows. Existing rows from Firebase will load here after login.
DEFAULT_DATA.financial=[];
DEFAULT_DATA.tracking=[];
let tasks=[],brands=[],team=[],financial=[],tracking=[],firebaseApp=null,auth=null,googleProvider=null,currentUser=null,db=null,docRef=null,unsubscribe=null,editingTaskId=null,tempFiles={brief:[],deliver:[]},editingBrandName=null,editingTeamName=null,tempBrandInfoLinks=[],tempBrandImages=[],confirmResolver=null,isSaving=false,currentView='tasks',accessRole='graphic',editingFinanceId=null,financeSaveInProgress=false,editingTrackingId=null;
const SL={todo:'รอดำเนินการ',inprogress:'กำลังทำ',review:'รอตรวจงาน',revision:'แก้ไข',done:'เสร็จแล้ว'};
const RL={'-':'ยังไม่ตรวจ',pending:'รอตรวจ',passed:'ผ่าน',failed:'ไม่ผ่าน'};
const RC={'-':'b-none',pending:'b-pending',passed:'b-passed',failed:'b-failed'};
const PL={high:'ด่วนมาก',medium:'ด่วน',normal:'ปกติ',low:'รอได้'};
function fileObj(name,url=''){return {name,url};}
function channelDefaults(){return Object.fromEntries(CHANNELS.map(c=>[c.key,false]));}
function brandObj(name,packageName='',contractMonths=1,infoLinks=[],logoUrl='',imageLinks=[],extra={}){return {name,package:packageName,contractMonths:Number(contractMonths)||1,infoLinks:normLinks(infoLinks),logoUrl:String(logoUrl||'').trim(),imageLinks:normLinks(imageLinks),customer:extra.customer||'',product:extra.product||'',packageAmount:Number(extra.packageAmount)||0,contentTotal:extra.contentTotal||'',imageCount:Number(extra.imageCount)||0,videoCount:Number(extra.videoCount)||0,channels:Object.assign({},channelDefaults(),extra.channels||{})};}
function normalizeBrand(b){if(typeof b==='string')return brandObj(b,'',1,[],'',[]);return brandObj(b?.name||'',b?.package||'',b?.contractMonths||1,b?.infoLinks||[],b?.logoUrl||b?.imageUrl||'',b?.imageLinks||b?.productImages||[],{customer:b?.customer||b?.owner||'',product:b?.product||b?.businessProduct||'',packageAmount:b?.packageAmount||0,contentTotal:b?.contentTotal||'',imageCount:b?.imageCount||0,videoCount:b?.videoCount||0,channels:b?.channels||{}});}
function brandName(b){return typeof b==='string'?b:(b?.name||'');}
function brandPackage(b){return typeof b==='string'?'':(b?.package||'');}
function brandCustomer(b){return typeof b==='string'?'':(b?.customer||'');}
function brandProduct(b){return typeof b==='string'?'':(b?.product||'');}
function brandPackageAmount(b){return Number(typeof b==='string'?0:b?.packageAmount)||0;}
function brandContentTotal(b){return typeof b==='string'?'':(b?.contentTotal||'');}
function brandImageCount(b){return Number(typeof b==='string'?0:b?.imageCount)||0;}
function brandVideoCount(b){return Number(typeof b==='string'?0:b?.videoCount)||0;}
function brandChannels(b){return Object.assign({},channelDefaults(), typeof b==='string'?{}:(b?.channels||{}));}
function brandContractMonths(b){const n=Number(typeof b==='string'?1:b?.contractMonths);return Math.min(12,Math.max(1,n||1));}
function brandInfoLinks(b){return typeof b==='string'?[]:normLinks(b?.infoLinks||[]);}
function brandLogoUrl(b){return typeof b==='string'?'':String(b?.logoUrl||b?.imageUrl||'').trim();}
function brandImageLinks(b){return typeof b==='string'?[]:normLinks(b?.imageLinks||b?.productImages||[]);}
function brandByName(name){return brands.find(b=>brandName(b)===name);}
function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function today(){return new Date().toISOString().split('T')[0];}
function clone(x){return JSON.parse(JSON.stringify(x));}
function normalizeData(data){const d=data||clone(DEFAULT_DATA);brands=(Array.isArray(d.brands)?d.brands:clone(DEFAULT_DATA.brands)).map(normalizeBrand).filter(b=>b.name);team=(Array.isArray(d.team)?d.team:clone(DEFAULT_DATA.team)).map(m=>({...m,email:String(m.email||'').toLowerCase().trim()}));tasks=(Array.isArray(d.tasks)?d.tasks:clone(DEFAULT_DATA.tasks)).map(t=>({...t,priority:t.priority||'normal',type:t.type||'Other',brief:normLinks(t.brief),deliver:normLinks(t.deliver),history:Array.isArray(t.history)?t.history:[],comments:Array.isArray(t.comments)?t.comments:[]}));financial=(Array.isArray(d.financial)?d.financial:clone(DEFAULT_DATA.financial||[])).map(normalizeFinance);tracking=(Array.isArray(d.tracking)?d.tracking:clone(DEFAULT_DATA.tracking||[])).map(normalizeTracking);}
function normLinks(arr){if(!Array.isArray(arr))return[];return arr.map(x=>typeof x==='string'?fileObj(x,''):{name:x.name||x.url||'ลิงก์ไฟล์',url:x.url||''});}
async function init(){normalizeData(clone(DEFAULT_DATA));renderAll();if(CLOUD_ENABLED){try{firebaseApp=initializeApp(FIREBASE_CONFIG);auth=getAuth(firebaseApp);googleProvider=new GoogleAuthProvider();googleProvider.setCustomParameters({prompt:'select_account'});onAuthStateChanged(auth,async user=>{currentUser=user;if(user){showAuthScreen(false);await startDataSync();}else{stopDataSync();showAuthScreen(true);}});}catch(e){console.error(e);showAuthError('เริ่ม Firebase Authentication ไม่สำเร็จ');}}else{showAuthScreen(false);}}
function showAuthScreen(show){document.getElementById('auth-screen').style.display=show?'flex':'none';document.getElementById('app-shell').style.display=show?'none':'flex';}
async function startDataSync(){if(unsubscribe)return;try{db=getFirestore(firebaseApp);docRef=doc(db,...FIRESTORE_DOC_PATH);const snap=await getDoc(docRef);if(!snap.exists()){await setDoc(docRef,{...clone(DEFAULT_DATA),updatedAt:serverTimestamp()});}unsubscribe=onSnapshot(docRef,s=>{if(!s.exists()||isSaving)return;normalizeData(s.data());refreshAccessFromUser();setStatus(true);renderAll();},err=>{console.error(err);setStatus(false);toast('เชื่อม Firebase ไม่สำเร็จ');});}catch(e){console.error(e);setStatus(false);toast('เชื่อม Firebase ไม่สำเร็จ');}}
function stopDataSync(){if(unsubscribe){unsubscribe();unsubscribe=null;}db=null;docRef=null;accessRole='graphic';}
async function loginUser(e){e.preventDefault();const email=document.getElementById('login-email').value.trim();const password=document.getElementById('login-password').value;showAuthError('');try{await signInWithEmailAndPassword(auth,email,password);}catch(err){console.error(err);showAuthError('Email หรือรหัสผ่านไม่ถูกต้อง หรือยังไม่ได้เปิด Email/Password ใน Firebase Authentication');}}
async function loginWithGoogle(){showAuthError('');try{await signInWithPopup(auth,googleProvider);}catch(err){console.error(err);let msg='Login ด้วย Google ไม่สำเร็จ';if(err?.code==='auth/unauthorized-domain')msg='โดเมนเว็บนี้ยังไม่ได้รับอนุญาตใน Firebase Authentication > Settings > Authorized domains';if(err?.code==='auth/operation-not-allowed')msg='ยังไม่ได้เปิด Google provider ใน Firebase Authentication > Sign-in method';showAuthError(msg);}}
function showAuthError(msg){const el=document.getElementById('auth-error');if(!el)return;el.textContent=msg;el.style.display=msg?'block':'none';}
async function logoutUser(){if(auth)await signOut(auth);}
function setStatus(ok){const el=document.getElementById('cloud-status');el.className='cloud-status '+(ok?'online':'offline');el.innerHTML=ok?'<i class="ti ti-cloud-check"></i> ONLINE SYNC':'<i class="ti ti-database"></i> LOCAL DEMO';}
async function persistData(){isSaving=true;try{if(docRef){await setDoc(docRef,{brands,team,tasks,financial,tracking,updatedAt:serverTimestamp()});setStatus(true);}toast('บันทึกแล้ว');}catch(e){console.error(e);toast('บันทึกไม่สำเร็จ');setStatus(false);}finally{setTimeout(()=>{isSaving=false},250);}}
function safeRun(name,fn){try{fn();}catch(e){console.error('Render error in '+name,e);const w=document.getElementById('toast-wrap');if(w){const el=document.createElement('div');el.className='toast';el.textContent='เกิดข้อผิดพลาดบางส่วน: '+name;w.appendChild(el);setTimeout(()=>el.remove(),2600);}}}
function renderAll(){
  safeRun('filters',renderFilters);
  safeRun('stats',renderStats);
  safeRun('tasks',renderTasks);
  safeRun('dashboard',renderDashboard);
  safeRun('brands',renderBrands);
  safeRun('brand-info',renderBrandInfo);
  safeRun('team',renderTeam);
  safeRun('financial',renderFinancial);
  safeRun('tracking',renderTracking);
  safeRun('access',updateAccessUI);
}
function showView(v){
  if((v==='dashboard'||v==='financial')&&!hasManagerAccess()){
    toast((v==='dashboard'?'Dashboard':'Financial')+' ดูได้เฉพาะ Owner / Manager เท่านั้น');return;
  }
  currentView=v;
  document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
  const viewEl=document.getElementById('view-'+v); if(viewEl)viewEl.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===v));
  const titles={dashboard:'Dashboard <span>Overview</span>',financial:'Financial <span>Payments</span>',tasks:'All <span>Tasks</span>',brands:'Client <span>Brands</span>','brand-info':'Brand <span>Information</span>',tracking:'Project <span>Tracking</span>',team:'The <span>Team</span>'};
  const titleEl=document.getElementById('view-title'); if(titleEl)titleEl.innerHTML=titles[v]||'';
}
function renderStats(){const total=tasks.length,done=tasks.filter(t=>t.status==='done').length,inp=tasks.filter(t=>t.status==='inprogress').length,review=tasks.filter(t=>t.status==='review').length,over=tasks.filter(t=>t.deadline&&t.deadline<today()&&t.status!=='done').length,high=tasks.filter(t=>t.priority==='high'&&t.status!=='done').length;document.getElementById('stats-bar').innerHTML=stat(total,'งานทั้งหมด')+stat(inp,'กำลังทำ')+stat(review,'รอตรวจ')+stat(done,'เสร็จแล้ว','success')+stat(over,'เกินกำหนด','danger')+stat(high,'ด่วนมาก','danger');}
function stat(n,l,cls=''){return `<div class="stat-card ${cls}"><div class="stat-num">${n}</div><div class="stat-label">${l}</div></div>`;}
function renderFilters(){const fill=(id,items,all)=>{const el=document.getElementById(id);if(!el)return;const old=el.value;el.innerHTML=`<option value="">${all}</option>`+items.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');el.value=old;};fill('filter-brand',brands.map(brandName),'แบรนด์ทั้งหมด');fill('filter-assignee',team.map(m=>m.name),'ผู้รับงานทั้งหมด');fill('filter-type',[...new Set([...TASK_TYPES,...tasks.map(t=>t.type||'Other')])],'ประเภททั้งหมด');const ft=document.getElementById('f-type');if(ft){const old=ft.value;ft.innerHTML=TASK_TYPES.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');ft.value=old||'Graphic Design';}}
function clearFilters(event){if(event?.preventDefault)event.preventDefault();['search-input','filter-status','filter-brand','filter-assignee','filter-priority','filter-type','filter-from','filter-to'].forEach(id=>{const el=document.getElementById(id);if(!el)return;el.value='';if(el.tagName==='SELECT')el.selectedIndex=0;});setTimeout(()=>renderTasks(),0);toast('ล้างตัวกรองแล้ว');}
function filteredTasks(){const q=(document.getElementById('search-input')?.value||'').toLowerCase().trim();const fs=document.getElementById('filter-status')?.value||'';const fb=document.getElementById('filter-brand')?.value||'';const fa=document.getElementById('filter-assignee')?.value||'';const fp=document.getElementById('filter-priority')?.value||'';const ft=document.getElementById('filter-type')?.value||'';const from=document.getElementById('filter-from')?.value||'';const to=document.getElementById('filter-to')?.value||'';return tasks.filter(t=>{const hay=[t.name,t.brand,t.assigner?.name,t.assignee?.name,t.type,t.note,SL[t.status],PL[t.priority]].join(' ').toLowerCase();return (!q||hay.includes(q))&&(!fs||t.status===fs)&&(!fb||t.brand===fb)&&(!fa||t.assignee?.name===fa)&&(!fp||t.priority===fp)&&(!ft||t.type===ft)&&(!from||t.deadline>=from)&&(!to||t.deadline<=to);});}
function renderTasks(){const el=document.getElementById('task-list');if(!el)return;const list=filteredTasks().sort(sortTasks);el.innerHTML=list.length?list.map(taskRow).join(''):'<div class="no-tasks"><i class="ti ti-inbox" style="font-size:34px;display:block;margin-bottom:8px"></i>ไม่พบงาน</div>';}
function sortTasks(a,b){const pr={high:0,medium:1,normal:2,low:3};return (a.status==='done')-(b.status==='done') || (pr[a.priority]??2)-(pr[b.priority]??2) || String(a.deadline||'9999').localeCompare(String(b.deadline||'9999'));}

function hasManagerAccess(){return accessRole==='manager'||accessRole==='owner';}
function hasOwnerAccess(){return accessRole==='owner';}
function canManageAll(){return hasManagerAccess();}
function canLimitedUpdate(){return Boolean(currentUser);}
function currentActorName(){const email=currentEmail();const member=team.find(m=>String(m.email||'').toLowerCase().trim()===email);return member?.name||currentUser?.displayName||email||'ผู้ใช้งาน';}
function currentEmail(){return String(currentUser?.email||'').toLowerCase().trim();}
function roleFromSignedInUser(){const email=currentEmail();if(OWNER_EMAILS.map(x=>x.toLowerCase()).includes(email))return 'owner';const member=team.find(m=>String(m.email||'').toLowerCase().trim()===email);if(member?.role==='manager')return 'manager';return 'graphic';}
function refreshAccessFromUser(){accessRole=roleFromSignedInUser();}
function updateAccessUI(){refreshAccessFromUser();const label=accessRole==='owner'?'Owner':accessRole==='manager'?'Manager':'Graphic';const el=document.getElementById('access-status');if(el){el.className='access-status '+(accessRole==='owner'?'owner':accessRole==='manager'?'manager':'');el.innerHTML=`<i class="ti ti-user-shield"></i> ${label}`;}const emailEl=document.getElementById('signed-user-email');if(emailEl)emailEl.textContent=currentEmail();const nameEl=document.getElementById('signed-user-name');if(nameEl){const member=team.find(m=>String(m.email||'').toLowerCase().trim()===currentEmail());nameEl.textContent=member?.name||currentUser?.displayName||currentEmail()||'ผู้ใช้งาน';}const roleEl=document.getElementById('signed-user-role');if(roleEl)roleEl.textContent=label;const avatarEl=document.getElementById('signed-user-avatar');if(avatarEl)avatarEl.textContent=initials(document.getElementById('signed-user-name')?.textContent||'GS');const addBtn=document.getElementById('team-add-button');if(addBtn)addBtn.style.display=canManageAll()?'inline-flex':'none';const taskAdd=document.getElementById('task-add-button');if(taskAdd)taskAdd.style.display=canManageAll()?'inline-flex':'none';const brandAdd=document.getElementById('brand-add-button');if(brandAdd)brandAdd.style.display=canManageAll()?'inline-flex':'none';const dashNav=document.querySelector('.nav-item[data-view="dashboard"]');if(dashNav){dashNav.style.opacity=hasManagerAccess()?'1':'.55';dashNav.title=hasManagerAccess()?'':'Dashboard ดูได้เฉพาะ Owner / Manager';}const finNav=document.querySelector('.nav-item[data-view="financial"]');if(finNav){finNav.style.opacity=hasManagerAccess()?'1':'.55';finNav.title=hasManagerAccess()?'':'Financial ดูได้เฉพาะ Owner / Manager';}const finAdd=document.getElementById('finance-add-button');if(finAdd)finAdd.style.display=hasManagerAccess()?'inline-flex':'none';if((currentView==='dashboard'||currentView==='financial')&&!hasManagerAccess())showView('tasks');}
function openAccessModal(){toast('สิทธิ์ถูกกำหนดจาก Email ที่ Login และข้อมูลทีมงาน');}
function closeAccessModal(){document.getElementById('access-modal')?.classList.remove('open');}
function saveAccess(){toast('เวอร์ชันนี้ใช้ Login แทนรหัสสิทธิ์แล้ว');}
function resetAccess(){logoutUser();}

function initials(n){return String(n||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();}
function shortName(n){const p=String(n||'').split(' ');return p.length>1?p[0]+' '+p[1][0]+'.':n;}
function fmtDate(d){if(!d)return'-';return new Date(d+'T00:00:00').toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'2-digit'});}
function dlClass(t){if(t.status==='done')return'ok';const diff=(new Date(t.deadline+'T00:00:00')-new Date())/86400000;return diff<0?'overdue':diff<=3?'soon':'ok';}
function taskRow(t){return `<div class="task-row" onclick="openDetail(${Number(t.id)})"><div><div class="task-name">${esc(t.name)}</div><div class="task-brand-sub">${esc(t.brand)}</div><div class="mini-meta"><span class="badge type">${esc(t.type||'Other')}</span>${linkButtons(t.brief,t.deliver)}</div></div><div>${personHtml(t.assignee)}</div><div>${personHtml(t.assigner)}</div><div class="deadline ${dlClass(t)}">${fmtDate(t.deadline)}</div><div><span class="badge priority-${t.priority||'normal'}">${PL[t.priority]||PL.normal}</span></div><div><span class="badge type">${esc(t.type||'Other')}</span></div><div><span class="badge ${t.status}">${SL[t.status]}</span></div><div><span class="badge ${RC[t.review]}">${RL[t.review]}</span></div><div class="action-btns" onclick="event.stopPropagation()">${canManageAll()?`<button class="icon-btn" title="แก้ไข" onclick="editTask(${Number(t.id)})"><i class="ti ti-edit"></i></button><button class="icon-btn" title="ลบ" onclick="deleteTask(${Number(t.id)})"><i class="ti ti-trash"></i></button>`:`<button class="icon-btn" title="อัปเดตสถานะ/คอมเมนต์" onclick="openDetail(${Number(t.id)})"><i class="ti ti-message-plus"></i></button>`}</div></div>`;}
function personHtml(p){if(!p)return'-';return `<div class="person"><div class="avatar" style="background:${p.color||'#111827'}14;color:${p.color||'#111827'}">${initials(p.name)}</div><span>${esc(shortName(p.name))}</span></div>`;}
function firstUrl(arr){return (arr||[]).find(x=>x.url)?.url||'';}
function linkButtons(brief,deliver){const b=firstUrl(brief),d=firstUrl(deliver);return `${b?`<a class="btn small" href="${esc(b)}" target="_blank" rel="noopener" onclick="event.stopPropagation()"><i class="ti ti-external-link"></i>เปิดบรีฟ</a>`:''}${d?`<a class="btn small" href="${esc(d)}" target="_blank" rel="noopener" onclick="event.stopPropagation()"><i class="ti ti-external-link"></i>เปิดส่งงาน</a>`:''}`;}
function fileListHtml(arr,empty){arr=normLinks(arr);if(!arr.length)return `<div class="field-hint">${empty}</div>`;return arr.map(f=>`<div class="file-item"><i class="ti ti-link"></i>${f.url?`<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.name||f.url)}</a>`:esc(f.name)}</div>`).join('');}
function googleDriveFileId(url){const u=String(url||'').trim();let m=u.match(/drive\.google\.com\/file\/d\/([^/]+)/i);if(m)return m[1];m=u.match(/[?&]id=([^&]+)/i);if(m&&u.includes('drive.google.com'))return m[1];return '';}
function directImageUrl(url){let u=String(url||'').trim();if(!u)return '';if(!/^https?:\/\//i.test(u))u='https://'+u;const driveId=googleDriveFileId(u);if(driveId)return `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveId)}&sz=w1200`;return u;}
function isLikelyImageUrl(url){const u=String(url||'');return /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(u) || u.includes('googleusercontent.com') || u.includes('firebasestorage.googleapis.com') || Boolean(googleDriveFileId(u));}
function brandVisualHtml(b){const logo=brandLogoUrl(b);const imgs=brandImageLinks(b);const first=logo || firstUrl(imgs);if(!first)return `<div class="brand-visual empty"><i class="ti ti-photo"></i></div>`;if(isLikelyImageUrl(first)){const src=directImageUrl(first);return `<a class="brand-visual" href="${esc(first)}" target="_blank" rel="noopener"><img src="${esc(src)}" alt="${esc(brandName(b))}" onerror="this.parentElement.classList.add('empty');this.outerHTML='<i class=&quot;ti ti-photo-share&quot;></i>';"></a>`;}return `<a class="brand-visual empty" href="${esc(first)}" target="_blank" rel="noopener" title="เปิดรูป/โลโก้"><i class="ti ti-photo-share"></i></a>`;}
function imageGalleryHtml(items){items=normLinks(items);if(!items.length)return '<div class="field-hint">ยังไม่มีรูปสินค้า / โลโก้</div>';return `<div class="image-gallery">${items.map(f=>{const src=directImageUrl(f.url);return `<a class="image-thumb" href="${esc(f.url)}" target="_blank" rel="noopener">${isLikelyImageUrl(f.url)?`<img src="${esc(src)}" alt="${esc(f.name||'รูปสินค้า')}" onerror="this.outerHTML='<span>เปิดรูป</span>'">`:`<span>${esc(f.name||'เปิดรูป')}</span>`}</a>`;}).join('')}</div>`;}
function renderLogoPreview(){const el=document.getElementById('brand-logo-preview');if(!el)return;let url=document.getElementById('brand-logo-url')?.value.trim()||'';if(!url){el.innerHTML='';return;}if(!/^https?:\/\//i.test(url))url='https://'+url;const src=directImageUrl(url);el.innerHTML=`<div class="preview-box">${isLikelyImageUrl(url)?`<img src="${esc(src)}" alt="Logo preview" onerror="this.style.display='none'">`:''}<a href="${esc(url)}" target="_blank" rel="noopener">เปิดลิงก์รูป/โลโก้</a></div>`;}
function renderDashboard(){renderUpcoming();renderStatusSummary();renderTeamSummary();renderBrandSummary();}
function renderUpcoming(){const el=document.getElementById('upcoming-list');if(!el)return;const list=tasks.filter(t=>t.status!=='done').sort((a,b)=>String(a.deadline||'9999').localeCompare(String(b.deadline||'9999'))).slice(0,8);el.innerHTML=list.length?list.map(t=>`<div class="summary-item" onclick="openDetail(${Number(t.id)})" style="cursor:pointer"><div><strong>${esc(t.name)}</strong><br><span>${esc(t.brand)} • ${esc(t.assignee?.name||'-')}</span></div><div class="deadline ${dlClass(t)}">${fmtDate(t.deadline)}</div></div>`).join(''):'<div class="no-tasks">ยังไม่มีงานค้าง</div>';}

function money(n){return (Number(n)||0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});}
function round2(n){const x=Number(n);return Number.isFinite(x)?Math.round((x+Number.EPSILON)*100)/100:0;}
const FIN_COST_TYPES=[
  {key:'ads',label:'ค่าแอด'},
  {key:'influencer',label:'ค่าอินฟลู'},
  {key:'fda',label:'ค่าจดอย.'},
  {key:'productreg',label:'ค่าจดทะเบียนผลิตภัณฑ์'},
  {key:'rnd',label:'ค่าพัฒนาสูตร R&D'}
];
function normalizeExpenseList(input=[],legacy={}){
  let list=Array.isArray(input)?input:[];
  if(!list.length){
    if(Number(legacy.adsAmount)>0)list.push({type:'ads',label:'ค่าแอด',amount:Number(legacy.adsAmount)||0});
    if(Number(legacy.influencerAmount)>0)list.push({type:'influencer',label:'ค่าอินฟลู',amount:Number(legacy.influencerAmount)||0});
    if(Number(legacy.fdaAmount)>0)list.push({type:'fda',label:'ค่าจดอย.',amount:Number(legacy.fdaAmount)||0});
    if(Number(legacy.productRegistrationAmount)>0)list.push({type:'productreg',label:'ค่าจดทะเบียนผลิตภัณฑ์',amount:Number(legacy.productRegistrationAmount)||0});
    if(Number(legacy.rndAmount)>0)list.push({type:'rnd',label:'ค่าพัฒนาสูตร R&D',amount:Number(legacy.rndAmount)||0});
  }
  return list.map(x=>{
    const def=FIN_COST_TYPES.find(t=>t.key===x.type)||{};
    return {type:x.type||def.key||'custom',label:x.label||def.label||'ค่าใช้จ่าย',amount:Number(x.amount)||0};
  }).filter(x=>x.amount>0||FIN_COST_TYPES.some(t=>t.key===x.type));
}
function expenseTotal(expenses=[]){return round2(normalizeExpenseList(expenses).reduce((s,x)=>s+(Number(x.amount)||0),0));}
function expenseTaxableTotal(expenses=[]){return round2(normalizeExpenseList(expenses).filter(x=>x.type!=='ads').reduce((s,x)=>s+(Number(x.amount)||0),0));}
function normalizePaidBreakdown(input={},legacy={}){const out={package:0};FIN_COST_TYPES.forEach(t=>out[t.key]=0);if(input&&typeof input==='object'){Object.keys(out).forEach(k=>out[k]=Number(input[k])||0);}else if(Number(legacy.paidAmount)>0){out.package=Number(legacy.paidAmount)||0;}return out;}
function paidBreakdownTotal(paid={}){const p=normalizePaidBreakdown(paid);return round2(Object.values(p).reduce((s,n)=>s+(Number(n)||0),0));}
function paymentBreakdownHtml(f){const p=normalizePaidBreakdown(f.paidBreakdown,f);const lines=[];if(p.package>0)lines.push(['Package',p.package]);FIN_COST_TYPES.forEach(t=>{if(Number(p[t.key])>0)lines.push([t.label,p[t.key]]);});if(!lines.length)return `<span class="finance-cost-empty">-</span>`;return `<div class="finance-costs">${lines.map(([label,amount])=>`<div class="finance-cost-line"><span>${esc(label)}</span><strong>${money(amount)}</strong></div>`).join('')}<div class="finance-paid-line">รวมรับชำระ ${money(paidBreakdownTotal(p))}</div></div>`;}
function financeObj(o={}){const f={id:o.id||Date.now(),date:o.date||today(),product:o.product||'',brand:o.brand||'',owner:o.owner||'',packageName:o.packageName||'',contractMonths:Number(o.contractMonths)||1,packageAmount:Number(o.packageAmount)||0,packageVat:Number(o.packageVat??7)||0,extraVat:Number(o.extraVat??7)||0,installment:o.installment||'',expenses:normalizeExpenseList(o.expenses,o),paidBreakdown:normalizePaidBreakdown(o.paidBreakdown,o),paymentStatus:o.paymentStatus||o.packageStatus||'pending',paidAmount:Number(o.paidAmount)||0,note:o.note||''};return normalizeFinance(f);}
function normalizeFinance(f={}){const out={...f};out.id=out.id||Date.now();out.date=out.date||today();out.brand=out.brand||'';out.product=out.product||'';out.owner=out.owner||'';out.packageName=out.packageName||'';out.contractMonths=Math.min(12,Math.max(1,Number(out.contractMonths)||1));out.packageAmount=Number(out.packageAmount)||0;out.packageVat=Number(out.packageVat);if(!Number.isFinite(out.packageVat))out.packageVat=7;out.extraVat=Number(out.extraVat);if(!Number.isFinite(out.extraVat))out.extraVat=7;out.expenses=normalizeExpenseList(out.expenses,out);out.extraSubtotal=round2(expenseTotal(out.expenses));out.extraTaxableSubtotal=round2(expenseTaxableTotal(out.expenses));out.extraVatAmount=round2(out.extraTaxableSubtotal*out.extraVat/100);out.extraTotal=round2(out.extraSubtotal+out.extraVatAmount);out.packageTotal=round2(out.packageAmount+(out.packageAmount*out.packageVat/100));out.paidBreakdown=normalizePaidBreakdown(out.paidBreakdown,out);const breakdownPaid=paidBreakdownTotal(out.paidBreakdown);out.paidAmount=breakdownPaid>0?breakdownPaid:(Number(out.paidAmount)||0);out.grandTotal=round2(out.packageTotal+out.extraTotal);out.balance=round2(Math.max(0,out.grandTotal-out.paidAmount));out.paymentStatus=autoFinanceStatus(out.paymentStatus||out.packageStatus||out.adsStatus,out.paidAmount,out.grandTotal,out.balance);out.note=out.note||'';return out;}
function financeStatusLabel(s){return {pending:'รอดำเนินการ',partial:'ชำระบางส่วน',paid:'ชำระแล้ว',overdue:'เกินกำหนด',stuck:'Stuck',none:'ไม่มี'}[s]||'-';}
function statusChip(s){return `<span class="status-chip ${esc(s||'none')}">${esc(financeStatusLabel(s))}</span>`;}
function renderFinancial(){if(!hasManagerAccess()){const el=document.getElementById('financial-list');if(el)el.innerHTML='';return;}renderFinanceFilters();renderFinanceSummary();const el=document.getElementById('financial-list');if(!el)return;const list=filteredFinancial().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));el.innerHTML=list.length?list.map(financeRow).join(''):`<tr><td colspan="17" class="no-tasks">ยังไม่มีข้อมูล Financial</td></tr>`;}
function renderFinanceFilters(){const brandSel=document.getElementById('finance-filter-brand');if(brandSel){const v=brandSel.value;brandSel.innerHTML='<option value="">แบรนด์ทั้งหมด</option>'+brands.map(b=>`<option value="${esc(brandName(b))}">${esc(brandName(b))}</option>`).join('');brandSel.value=v;}}
function filteredFinancial(){const q=(document.getElementById('finance-search')?.value||'').toLowerCase().trim();const brand=document.getElementById('finance-filter-brand')?.value||'';const status=document.getElementById('finance-filter-status')?.value||'';const month=document.getElementById('finance-filter-month')?.value||'';return financial.filter(f=>{f=normalizeFinance(f);const hay=[f.brand,f.product,f.owner,f.packageName,f.note,f.installment,...(f.expenses||[]).map(x=>x.label)].join(' ').toLowerCase();const matchQ=!q||hay.includes(q);const matchBrand=!brand||f.brand===brand;const matchStatus=!status||f.paymentStatus===status;const matchMonth=!month||String(f.date||'').startsWith(month);return matchQ&&matchBrand&&matchStatus&&matchMonth;});}
function renderFinanceSummary(){const box=document.getElementById('financial-summary');if(!box)return;const list=filteredFinancial().map(normalizeFinance);const total=list.reduce((s,f)=>s+(Number(f.grandTotal)||0),0);const paid=list.reduce((s,f)=>s+(Number(f.paidAmount)||0),0);const balance=list.reduce((s,f)=>s+Math.max(0,Number(f.balance)||0),0);const overdue=list.filter(f=>f.paymentStatus==='overdue'||f.paymentStatus==='stuck').length;box.innerHTML=`<div class="stat-card"><div class="stat-num">${money(total)}</div><div class="stat-label">รวมที่ต้องชำระ</div></div><div class="stat-card success"><div class="stat-num">${money(paid)}</div><div class="stat-label">รับชำระแล้ว</div></div><div class="stat-card danger"><div class="stat-num">${money(balance)}</div><div class="stat-label">คงค้าง</div></div><div class="stat-card danger"><div class="stat-num">${overdue}</div><div class="stat-label">เกินกำหนด / Stuck</div></div>`;}
function financeCostsHtml(f){f=normalizeFinance(f);const expenses=normalizeExpenseList(f.expenses,f).filter(x=>Number(x.amount)>0);if(!expenses.length)return '<span class="finance-cost-empty">-</span>';const paid=normalizePaidBreakdown(f.paidBreakdown,f);return `<div class="finance-costs">${expenses.map(x=>{const p=Number(paid[x.type])||0;const bal=Math.max(0,(Number(x.amount)||0)-p);return `<div class="finance-cost-line"><span>${esc(x.label)}</span><strong>${money(x.amount)}</strong></div>${p>0?`<div class="finance-paid-line">ชำระแล้ว ${money(p)}</div>`:''}${bal>0&&p>0?`<div class="finance-balance-line">คงค้าง ${money(bal)}</div>`:''}`;}).join('')}${f.extraVatAmount>0?`<div class="finance-cost-line"><span>VAT ค่าใช้จ่ายเสริม ${money(f.extraVat)}% (ยกเว้นค่าแอด)</span><strong>${money(f.extraVatAmount)}</strong></div>`:''}<div class="finance-cost-line"><span><strong>รวมค่าใช้จ่ายเสริม</strong></span><strong>${money(f.extraTotal)}</strong></div></div>`;}
function financeRow(f){f=normalizeFinance(f);return `<tr><td>${fmtDate(f.date)}</td><td><div class="finance-brand">${esc(f.brand||'-')}</div></td><td><div class="finance-sub">${esc(f.product||'-')}</div></td><td>${esc(f.owner||'-')}</td><td>${esc(f.packageName||'-')}</td><td class="num">${money(f.packageAmount)}</td><td class="num">${money(f.packageVat)}%</td><td class="num"><strong>${money(f.packageTotal)}</strong></td><td>${esc(f.contractMonths)} เดือน</td><td>${esc(f.installment||'-')}</td><td>${financeCostsHtml(f)}</td><td class="num"><strong>${money(f.grandTotal)}</strong></td><td>${paymentBreakdownHtml(f)}</td><td class="num"><strong>${money(f.balance)}</strong></td><td>${statusChip(f.paymentStatus)}</td><td><div class="finance-note">${esc(f.note||'')}</div></td><td><div class="finance-actions"><button class="icon-btn" onclick="openFinanceModal(${Number(f.id)})"><i class="ti ti-edit"></i></button><button class="icon-btn" onclick="deleteFinanceRecord(${Number(f.id)})"><i class="ti ti-trash"></i></button></div></td></tr>`;}
function clearFinanceFilters(){['finance-search','finance-filter-brand','finance-filter-status','finance-filter-month'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});renderFinancial();}
function populateFinanceSelects(){const brandSel=document.getElementById('fin-brand');if(brandSel)brandSel.innerHTML='<option value="">-- เลือกแบรนด์ --</option>'+brands.map(b=>`<option value="${esc(brandName(b))}">${esc(brandName(b))}</option>`).join('');const ownerInput=document.getElementById('fin-owner');if(ownerInput)ownerInput.placeholder='พิมพ์ชื่อลูกค้า';const cm=document.getElementById('fin-contract-months');if(cm)cm.innerHTML=Array.from({length:12},(_,i)=>`<option value="${i+1}">${i+1} เดือน</option>`).join('');}

function applyBrandToFinance(){const b=brandByName(val('fin-brand'));if(!b)return;setVal('fin-product',brandProduct(b));setVal('fin-owner',brandCustomer(b));setVal('fin-package-name',brandPackage(b));setVal('fin-contract-months',String(brandContractMonths(b)));if(brandPackageAmount(b)>0)setVal('fin-package-amount',brandPackageAmount(b));updateFinanceTotals();}
function setFinanceCost(type,amount){const c=document.getElementById(`fin-cost-${type}-check`),i=document.getElementById(`fin-cost-${type}`);if(c)c.checked=Number(amount)>0;if(i)i.value=Number(amount)>0?Number(amount):'';}
function collectFinanceExpenses(){return FIN_COST_TYPES.map(t=>{const checked=document.getElementById(`fin-cost-${t.key}-check`)?.checked;const amount=Number(String(document.getElementById(`fin-cost-${t.key}`)?.value||'').replace(/,/g,'').trim())||0;return checked||amount>0?{type:t.key,label:t.label,amount}:null;}).filter(Boolean);}
function openFinanceModal(id=null){try{if(!hasManagerAccess()){toast('Financial ดูได้เฉพาะ Owner / Manager เท่านั้น');return;}editingFinanceId=id;populateFinanceSelects();document.getElementById('finance-modal-title').textContent=id?'แก้ไขรายการชำระเงิน':'เพิ่มรายการชำระเงิน';const f=id?normalizeFinance(financial.find(x=>Number(x.id)===Number(id))||{}):null;document.getElementById('fin-date').value=f?.date||today();document.getElementById('fin-brand').value=f?.brand||'';document.getElementById('fin-product').value=f?.product||'';document.getElementById('fin-owner').value=f?.owner||'';document.getElementById('fin-package-name').value=f?.packageName||'';document.getElementById('fin-contract-months').value=String(f?.contractMonths||1);document.getElementById('fin-package-amount').value=f?.packageAmount||'';document.getElementById('fin-package-vat').value=(f?((Number(f.packageVat)>50)?7:(f.packageVat??7)):7);document.getElementById('fin-installment').value=f?.installment||'';FIN_COST_TYPES.forEach(t=>setFinanceCost(t.key,(f?.expenses||[]).find(x=>x.type===t.key)?.amount||0));document.getElementById('fin-extra-vat').value=f?.extraVat??7;const paid=normalizePaidBreakdown(f?.paidBreakdown,f||{});setVal('fin-paid-package',paid.package||'');FIN_COST_TYPES.forEach(t=>setVal(`fin-paid-${t.key}`,paid[t.key]||''));document.getElementById('fin-payment-status').value=f?.paymentStatus||'pending';document.getElementById('fin-paid-amount').value=f?.paidAmount||'';document.getElementById('fin-note').value=f?.note||'';updateFinanceTotals();document.getElementById('finance-modal').classList.add('open');setTimeout(()=>{bindFinanceAutoCalc();updateFinanceTotals();},50);}catch(e){console.error('openFinanceModal error',e);const modal=document.getElementById('finance-modal');if(modal)modal.classList.add('open');toast('เปิดหน้าต่าง Financial แล้ว แต่บางช่องอาจโหลดไม่ครบ');}}
function closeFinanceModal(){document.getElementById('finance-modal').classList.remove('open');}
function val(id){return document.getElementById(id)?.value??'';}
function setVal(id,value){const el=document.getElementById(id);if(el)el.value=value;}
function autoFinanceStatus(current,paid,total,balance){if(current==='overdue'||current==='stuck')return current;if(total<=0)return 'pending';if(paid<=0)return 'pending';if(balance<=0||paid>=total)return 'paid';return 'partial';}

function bindFinanceAutoCalc(){
  const modal=document.getElementById('finance-modal');
  if(!modal)return;
  const ids=['fin-package-amount','fin-package-vat','fin-paid-amount','fin-payment-status','fin-cost-ads-check','fin-cost-ads','fin-cost-influencer-check','fin-cost-influencer','fin-cost-fda-check','fin-cost-fda','fin-cost-productreg-check','fin-cost-productreg','fin-cost-rnd-check','fin-cost-rnd','fin-extra-vat','fin-paid-package','fin-paid-ads','fin-paid-influencer','fin-paid-fda','fin-paid-productreg','fin-paid-rnd'];
  ids.forEach(id=>{
    const el=document.getElementById(id);
    if(!el||el.dataset.financeAutoCalcBound==='1')return;
    el.dataset.financeAutoCalcBound='1';
    const handler=()=>{try{updateFinanceTotals();}catch(err){console.error('finance auto calc error',err);}};
    el.addEventListener('input',handler);
    el.addEventListener('change',handler);
  });
}
function numVal(id){return Number(String(val(id)).replace(/,/g,'').trim())||0;}
function collectPaidBreakdown(){const out={package:numVal('fin-paid-package')};FIN_COST_TYPES.forEach(t=>out[t.key]=numVal(`fin-paid-${t.key}`));return out;}
function updateFinanceTotals(){try{const pa=numVal('fin-package-amount'),pv=numVal('fin-package-vat'),extraVat=numVal('fin-extra-vat');FIN_COST_TYPES.forEach(t=>{const inp=document.getElementById(`fin-cost-${t.key}`),chk=document.getElementById(`fin-cost-${t.key}-check`);if(inp&&chk&&numVal(`fin-cost-${t.key}`)>0)chk.checked=true;});const expenses=collectFinanceExpenses();const paidBreakdown=collectPaidBreakdown();const paid=paidBreakdownTotal(paidBreakdown);const pt=round2(pa+(pa*pv/100));const extraSub=round2(expenseTotal(expenses));const extraTaxableSub=round2(expenseTaxableTotal(expenses));const extraVatAmount=round2(extraTaxableSub*extraVat/100);const extra=round2(extraSub+extraVatAmount);const gt=round2(pt+extra);const bal=round2(Math.max(0,gt-paid));setVal('fin-package-total',pt.toFixed(2));setVal('fin-extra-subtotal',extraSub.toFixed(2));setVal('fin-extra-total',extra.toFixed(2));setVal('fin-paid-amount',paid.toFixed(2));setVal('fin-grand-total',gt.toFixed(2));setVal('fin-balance',bal.toFixed(2));const statusEl=document.getElementById('fin-payment-status');if(statusEl){const next=autoFinanceStatus(statusEl.value,paid,gt,bal);if(statusEl.value!=='overdue'&&statusEl.value!=='stuck')statusEl.value=next;}return {packageTotal:pt,extraSubtotal:extraSub,extraVatAmount,extraTotal:extra,grandTotal:gt,balance:bal,paidAmount:paid,paidBreakdown,status:document.getElementById('fin-payment-status')?.value||'pending'};}catch(err){console.error('updateFinanceTotals failed',err);return {packageTotal:0,extraTotal:0,grandTotal:0,balance:0,paidAmount:0,paidBreakdown:collectPaidBreakdown(),status:document.getElementById('fin-payment-status')?.value||'pending'};}}
async function saveFinanceRecord(){if(financeSaveInProgress)return;financeSaveInProgress=true;try{if(!hasManagerAccess()){toast('เฉพาะ Owner / Manager เท่านั้นที่จัดการ Financial ได้');return;}const totals=updateFinanceTotals();const brand=val('fin-brand');if(!brand){toast('กรุณาเลือกแบรนด์');return;}const saveBtn=document.getElementById('finance-save-button');if(saveBtn){saveBtn.disabled=true;saveBtn.innerHTML='<i class="ti ti-loader-2"></i>กำลังบันทึก...';}const rec=financeObj({id:editingFinanceId||Date.now(),date:val('fin-date')||today(),brand,product:val('fin-product').trim(),owner:val('fin-owner'),packageName:val('fin-package-name').trim(),contractMonths:val('fin-contract-months'),packageAmount:numVal('fin-package-amount'),packageVat:numVal('fin-package-vat'),extraVat:numVal('fin-extra-vat'),installment:val('fin-installment').trim(),expenses:collectFinanceExpenses(),paidBreakdown:totals.paidBreakdown,paymentStatus:totals.status,paidAmount:totals.paidAmount,note:val('fin-note')});if(editingFinanceId)financial=financial.map(f=>Number(f.id)===Number(editingFinanceId)?rec:f);else financial.unshift(rec);await persistData();closeFinanceModal();renderAll();toast('บันทึกรายการชำระเงินแล้ว');}catch(e){console.error('saveFinanceRecord error',e);toast('บันทึกไม่ได้ กรุณาตรวจข้อมูลแล้วลองใหม่');}finally{financeSaveInProgress=false;const saveBtn=document.getElementById('finance-save-button');if(saveBtn){saveBtn.disabled=false;saveBtn.innerHTML='<i class="ti ti-check"></i>บันทึกข้อมูลชำระเงิน';}}}
async function deleteFinanceRecord(id){if(!hasManagerAccess()){toast('เฉพาะ Owner / Manager เท่านั้นที่จัดการ Financial ได้');return;}if(!await confirmBox('ลบรายการ Financial?','ยืนยันลบรายการชำระเงินนี้'))return;financial=financial.filter(f=>Number(f.id)!==Number(id));await persistData();renderAll();}



function normalizeTracking(x={}){const b=brandByName(x.brand||'');return {id:x.id||Date.now(),project:x.project||'New Product',brand:x.brand||'',product:x.product||brandProduct(b)||'',customer:x.customer||brandCustomer(b)||'',contractMonths:x.contractMonths||brandContractMonths(b)||1,marketingStatus:x.marketingStatus||'run',runDate:x.runDate||'',mediaStatus:x.mediaStatus||'run',contentTotal:x.contentTotal||brandContentTotal(b)||'',imageCount:Number(x.imageCount ?? brandImageCount(b))||0,videoCount:Number(x.videoCount ?? brandVideoCount(b))||0,imageDone:Number(x.imageDone)||0,videoDone:Number(x.videoDone)||0,channels:Object.assign({},brandChannels(b),x.channels||{}),note:x.note||''};}
function trackingStatusLabel(v,type='marketing'){const m={run:'Run Content',plan:'วางแผนงาน',wait:'รอนัดคุยกับลูกค้า',pause:'Pause / Stuck',prep:'จัดเตรียมสื่อ',finish:'Finish'};return m[v]||v||'-';}
function trackingStatusClass(v){return v==='run'?'run':v==='plan'?'plan':v==='wait'||v==='prep'?'wait':v==='pause'?'pause':v==='finish'?'done':'wait';}
function renderTracking(){const listEl=document.getElementById('tracking-list');if(!listEl)return;const brandFilter=document.getElementById('tracking-filter-brand');if(brandFilter){const old=brandFilter.value;brandFilter.innerHTML='<option value="">แบรนด์ทั้งหมด</option>'+brands.map(b=>`<option value="${esc(brandName(b))}">${esc(brandName(b))}</option>`).join('');brandFilter.value=old;}const q=(document.getElementById('tracking-search')?.value||'').toLowerCase().trim();const fb=document.getElementById('tracking-filter-brand')?.value||'';const fm=document.getElementById('tracking-filter-marketing')?.value||'';const fmedia=document.getElementById('tracking-filter-media')?.value||'';const rows=tracking.map(normalizeTracking).filter(r=>{const hay=[r.project,r.brand,r.product,r.customer,r.note,trackingStatusLabel(r.marketingStatus),trackingStatusLabel(r.mediaStatus)].join(' ').toLowerCase();return (!q||hay.includes(q))&&(!fb||r.brand===fb)&&(!fm||r.marketingStatus===fm)&&(!fmedia||r.mediaStatus===fmedia);});listEl.innerHTML=rows.length?rows.map(trackingRow).join(''):'<tr><td colspan="22" style="text-align:center;color:var(--muted);padding:36px">ยังไม่มีข้อมูล Project Tracking</td></tr>';}
function trackingRow(r){r=normalizeTracking(r);const imgRemain=Math.max(0,(Number(r.imageCount)||0)-(Number(r.imageDone)||0));const vidRemain=Math.max(0,(Number(r.videoCount)||0)-(Number(r.videoDone)||0));return `<tr><td><strong>${esc(r.project)}</strong></td><td><span class="chip">${esc(r.contractMonths)} เดือน</span></td><td><strong>${esc(r.brand)}</strong></td><td>${esc(r.product||'-')}</td><td>${esc(r.customer||'-')}</td><td><span class="tracking-status ${trackingStatusClass(r.marketingStatus)}">${esc(trackingStatusLabel(r.marketingStatus))}</span></td><td>${fmtDate(r.runDate)}</td><td><span class="tracking-status ${trackingStatusClass(r.mediaStatus)}">${esc(trackingStatusLabel(r.mediaStatus))}</span></td><td>${esc(r.contentTotal||'-')}</td><td>${esc(r.imageCount||0)}</td><td>${esc(r.videoCount||0)}</td><td>${esc(r.imageDone||0)}/${esc(r.imageCount||0)}</td><td>${esc(r.videoDone||0)}/${esc(r.videoCount||0)}</td>${CHANNELS.map(c=>`<td>${channelDot(r.channels?.[c.key])}</td>`).join('')}<td>${esc(r.note||'')}</td><td><div class="finance-actions"><button class="icon-btn" onclick="openTrackingModal(${Number(r.id)})"><i class="ti ti-edit"></i></button><button class="icon-btn" onclick="deleteTrackingRecord(${Number(r.id)})"><i class="ti ti-trash"></i></button></div></td></tr>`;}
function channelDot(v){const cls=v==='partial'?'partial':v?'on':'off';const txt=v==='partial'?'◐':v?'✓':'-';return `<span class="channel-dot ${cls}">${txt}</span>`;}
function clearTrackingFilters(){['tracking-search','tracking-filter-brand','tracking-filter-marketing','tracking-filter-media'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});renderTracking();}
function renderChannelGrid(id,values={},prefix='channel'){const el=document.getElementById(id);if(!el)return;el.innerHTML=CHANNELS.map(c=>`<label class="channel-check"><input type="checkbox" data-channel="${c.key}" class="${prefix}" ${values?.[c.key]?'checked':''}>${esc(c.label)}</label>`).join('');}
function readChannelGrid(id,prefix='channel'){const out=channelDefaults();document.querySelectorAll(`#${id} input[data-channel]`).forEach(el=>out[el.dataset.channel]=el.checked);return out;}
function populateTrackingSelects(){const sel=document.getElementById('track-brand');if(sel)sel.innerHTML='<option value="">-- เลือกแบรนด์ --</option>'+brands.map(b=>`<option value="${esc(brandName(b))}">${esc(brandName(b))}</option>`).join('');}
function applyBrandToTracking(){const b=brandByName(val('track-brand'));if(!b)return;setVal('track-product',brandProduct(b));setVal('track-customer',brandCustomer(b));setVal('track-contract',brandContractMonths(b)+' เดือน');setVal('track-content-total',brandContentTotal(b));setVal('track-image-count',brandImageCount(b));setVal('track-video-count',brandVideoCount(b));renderChannelGrid('tracking-channel-grid',brandChannels(b),'tracking-channel');}
function openTrackingModal(id=null){if(!canManageAll()){toast('เฉพาะ Owner / Manager เท่านั้นที่จัดการ Project Tracking ได้');return;}editingTrackingId=id;populateTrackingSelects();const r=id?normalizeTracking(tracking.find(x=>Number(x.id)===Number(id))||{}):null;document.getElementById('tracking-modal-title').textContent=id?'แก้ไขโปรเจกต์':'เพิ่มโปรเจกต์';setVal('track-project',r?.project||'New Product');setVal('track-brand',r?.brand||'');if(r){setVal('track-product',r.product);setVal('track-customer',r.customer);setVal('track-contract',r.contractMonths+' เดือน');setVal('track-marketing-status',r.marketingStatus);setVal('track-run-date',r.runDate);setVal('track-media-status',r.mediaStatus);setVal('track-content-total',r.contentTotal);setVal('track-image-count',r.imageCount);setVal('track-video-count',r.videoCount);setVal('track-image-done',r.imageDone);setVal('track-video-done',r.videoDone);setVal('track-note',r.note);renderChannelGrid('tracking-channel-grid',r.channels,'tracking-channel');}else{setVal('track-run-date',today());setVal('track-image-done',0);setVal('track-video-done',0);setVal('track-note','');renderChannelGrid('tracking-channel-grid',channelDefaults(),'tracking-channel');applyBrandToTracking();}document.getElementById('tracking-modal').classList.add('open');}
function closeTrackingModal(){document.getElementById('tracking-modal').classList.remove('open');}
async function saveTrackingRecord(){if(!canManageAll()){toast('เฉพาะ Owner / Manager เท่านั้นที่บันทึก Project Tracking ได้');return;}const brand=val('track-brand');if(!brand){toast('กรุณาเลือกแบรนด์');return;}const rec=normalizeTracking({id:editingTrackingId||Date.now(),project:val('track-project'),brand,product:val('track-product').trim(),customer:val('track-customer').trim(),contractMonths:Number(String(val('track-contract')).replace(/\D/g,''))||brandContractMonths(brandByName(brand)),marketingStatus:val('track-marketing-status'),runDate:val('track-run-date'),mediaStatus:val('track-media-status'),contentTotal:val('track-content-total').trim(),imageCount:numVal('track-image-count'),videoCount:numVal('track-video-count'),imageDone:numVal('track-image-done'),videoDone:numVal('track-video-done'),channels:readChannelGrid('tracking-channel-grid','tracking-channel'),note:val('track-note').trim()});if(editingTrackingId)tracking=tracking.map(x=>Number(x.id)===Number(editingTrackingId)?rec:x);else tracking.unshift(rec);await persistData();closeTrackingModal();renderAll();toast('บันทึก Project Tracking แล้ว');}
async function deleteTrackingRecord(id){if(!canManageAll()){toast('เฉพาะ Owner / Manager เท่านั้นที่ลบ Project Tracking ได้');return;}if(!await confirmBox('ลบโปรเจกต์?', 'ยืนยันลบ Project Tracking นี้'))return;tracking=tracking.filter(x=>Number(x.id)!==Number(id));await persistData();renderAll();}

function renderStatusSummary(){const data=Object.keys(SL).map(k=>[SL[k],tasks.filter(t=>t.status===k).length]);document.getElementById('status-summary').innerHTML=barHtml(data,tasks.length||1);}
function renderTeamSummary(){const data=team.map(m=>[m.name,tasks.filter(t=>t.assignee?.name===m.name&&t.status!=='done').length]).sort((a,b)=>b[1]-a[1]);document.getElementById('team-summary').innerHTML=barHtml(data,Math.max(1,...data.map(x=>x[1])));}
function renderBrandSummary(){const data=brands.map(b=>[brandName(b),tasks.filter(t=>t.brand===brandName(b)).length]).sort((a,b)=>b[1]-a[1]);document.getElementById('brand-summary').innerHTML=barHtml(data,Math.max(1,...data.map(x=>x[1])));}
function barHtml(data,max){return data.map(([label,n])=>`<div class="bar-row"><div style="font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(label)}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.round((n/max)*100)}%"></div></div><div style="font-weight:800;text-align:right">${n}</div></div>`).join('');}
function openTaskModal(){if(!canManageAll()){toast('เฉพาะ Owner / Manager เท่านั้นที่เพิ่มงานใหม่ได้');return;}editingTaskId=null;tempFiles={brief:[],deliver:[]};document.getElementById('task-modal-title').textContent='จ่ายงานใหม่';populateTaskSelects();['f-name','f-note','brief-link-name','brief-link-url','deliver-link-name','deliver-link-url'].forEach(id=>document.getElementById(id).value='');document.getElementById('f-startdate').value=today();document.getElementById('f-deadline').value='';document.getElementById('f-priority').value='normal';document.getElementById('f-status').value='todo';document.getElementById('f-review').value='-';renderFileList('brief');renderFileList('deliver');document.getElementById('task-modal').classList.add('open');}
function populateTaskSelects(){document.getElementById('f-brand').innerHTML='<option value="">-- เลือกแบรนด์ --</option>'+brands.map(b=>`<option value="${esc(brandName(b))}">${esc(brandName(b))}</option>`).join('');document.getElementById('f-assigner').innerHTML='<option value="">-- เลือก --</option>'+team.map(m=>`<option value="${esc(m.name)}">${esc(m.name)}</option>`).join('');document.getElementById('f-assignee').innerHTML='<option value="">-- เลือก --</option>'+team.map(m=>`<option value="${esc(m.name)}">${esc(m.name)}</option>`).join('');renderFilters();}
function editTask(id){if(!canManageAll()){toast('ตำแหน่งนี้แก้ไขรายละเอียดงานไม่ได้ ทำได้เฉพาะเปลี่ยนสถานะและเพิ่มคอมเมนต์');return;}const t=tasks.find(x=>Number(x.id)===Number(id));if(!t)return;openTaskModal();editingTaskId=t.id;tempFiles={brief:normLinks(t.brief),deliver:normLinks(t.deliver)};document.getElementById('task-modal-title').textContent='แก้ไขงาน';document.getElementById('f-name').value=t.name;document.getElementById('f-brand').value=t.brand;document.getElementById('f-type').value=t.type||'Other';document.getElementById('f-assigner').value=t.assigner?.name||'';document.getElementById('f-assignee').value=t.assignee?.name||'';document.getElementById('f-startdate').value=t.startDate||'';document.getElementById('f-deadline').value=t.deadline||'';document.getElementById('f-priority').value=t.priority||'normal';document.getElementById('f-status').value=t.status||'todo';document.getElementById('f-review').value=t.review||'-';document.getElementById('f-note').value=t.note||'';renderFileList('brief');renderFileList('deliver');}
function closeTaskModal(){document.getElementById('task-modal').classList.remove('open');}
async function saveTask(){if(!canManageAll()){toast('เฉพาะ Owner / Manager เท่านั้นที่บันทึกรายละเอียดงานได้');return;}const name=document.getElementById('f-name').value.trim(),brand=document.getElementById('f-brand').value,type=document.getElementById('f-type').value,an=document.getElementById('f-assigner').value,en=document.getElementById('f-assignee').value;if(!name||!brand||!an||!en){toast('กรุณากรอกข้อมูลหลักให้ครบ');return;}const old=tasks.find(t=>Number(t.id)===Number(editingTaskId));const task={id:editingTaskId||Date.now(),name,brand,type,assigner:team.find(m=>m.name===an)||{name:an},assignee:team.find(m=>m.name===en)||{name:en},startDate:document.getElementById('f-startdate').value,deadline:document.getElementById('f-deadline').value,priority:document.getElementById('f-priority').value,status:document.getElementById('f-status').value,review:document.getElementById('f-review').value,brief:normLinks(tempFiles.brief),deliver:normLinks(tempFiles.deliver),note:document.getElementById('f-note').value,history:old?.history||[],comments:old?.comments||[]};const changes=buildHistory(old,task);if(changes)task.history=[{at:new Date().toISOString(),by:'ทีมบริหาร',text:changes},...task.history].slice(0,60);if(old)tasks=tasks.map(t=>Number(t.id)===Number(editingTaskId)?task:t);else tasks.unshift(task);closeTaskModal();await persistData();renderAll();}
function buildHistory(old,task){if(!old)return 'สร้างงานใหม่';const fields=[['name','ชื่องาน'],['brand','แบรนด์'],['type','ประเภท'],['deadline','Deadline'],['priority','Priority'],['status','สถานะงาน'],['review','สถานะตรวจงาน'],['note','หมายเหตุ']];const out=[];for(const [k,l] of fields){if(String(old[k]||'')!==String(task[k]||''))out.push(`${l}: ${displayVal(k,old[k])} → ${displayVal(k,task[k])}`);}if(old.assignee?.name!==task.assignee?.name)out.push(`ผู้รับงาน: ${old.assignee?.name||'-'} → ${task.assignee?.name||'-'}`);if(old.assigner?.name!==task.assigner?.name)out.push(`ผู้จ่ายงาน: ${old.assigner?.name||'-'} → ${task.assigner?.name||'-'}`);if(JSON.stringify(normLinks(old.brief))!==JSON.stringify(normLinks(task.brief)))out.push('แก้ไขลิงก์ไฟล์บรีฟ');if(JSON.stringify(normLinks(old.deliver))!==JSON.stringify(normLinks(task.deliver)))out.push('แก้ไขลิงก์ไฟล์ส่งงาน');return out.join('\n');}
function displayVal(k,v){if(k==='status')return SL[v]||v||'-';if(k==='review')return RL[v]||v||'-';if(k==='priority')return PL[v]||v||'-';return v||'-';}
async function deleteTask(id){if(!canManageAll()){toast('เฉพาะ Owner / Manager เท่านั้นที่ลบงานได้');return;}if(!await confirmBox('ลบงานนี้?','เมื่อลบแล้ว งานนี้จะหายจากระบบของทุกคน'))return;tasks=tasks.filter(t=>Number(t.id)!==Number(id));await persistData();renderAll();}
function addLink(type){const n=document.getElementById(type+'-link-name'),u=document.getElementById(type+'-link-url');let url=(u.value||'').trim();const name=(n.value||'').trim();if(!url){toast('กรุณาใส่ลิงก์ก่อน');return;}if(!/^https?:\/\//i.test(url))url='https://'+url;tempFiles[type].push(fileObj(name||url,url));n.value='';u.value='';renderFileList(type);}
function renderFileList(type){const el=document.getElementById(type+'-files');if(!el)return;el.innerHTML=normLinks(tempFiles[type]).map((f,i)=>`<div class="file-item"><i class="ti ti-link"></i>${f.url?`<a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.name||f.url)}</a>`:esc(f.name)}<button class="icon-btn" style="margin-left:auto;width:30px;height:30px" onclick="removeFile('${type}',${i})"><i class="ti ti-x"></i></button></div>`).join('');}
function removeFile(type,i){tempFiles[type].splice(i,1);renderFileList(type);}
function openDetail(id){const t=tasks.find(x=>Number(x.id)===Number(id));if(!t)return;const manageActions=canManageAll()?`<button class="btn primary" style="width:100%" onclick="editTask(${Number(t.id)});closeDetail()"><i class="ti ti-edit"></i>แก้ไขรายละเอียดงาน</button>`:`<div class="field-hint">สิทธิ์ของคุณสามารถเปลี่ยนสถานะงานและเพิ่มคอมเมนต์ได้เท่านั้น</div>`;document.getElementById('detail-panel').innerHTML=`<div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start"><div><div style="font-size:22px;font-weight:800;line-height:1.25">${esc(t.name)}</div><div style="color:var(--muted);font-weight:700;margin-top:5px">${esc(t.brand)} • ${esc(t.type||'Other')}</div></div><button class="icon-btn" onclick="closeDetail()"><i class="ti ti-x"></i></button></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px"><span class="badge ${t.status}">${SL[t.status]}</span><span class="badge ${RC[t.review]}">${RL[t.review]}</span><span class="badge priority-${t.priority}">${PL[t.priority]||PL.normal}</span></div><div class="section-lbl">อัปเดตงาน</div><div class="field"><label>เปลี่ยนสถานะงาน</label><div style="display:flex;gap:8px;align-items:center"><select id="detail-status" class="filter-select" style="flex:1">${Object.keys(SL).map(k=>`<option value="${k}" ${t.status===k?'selected':''}>${SL[k]}</option>`).join('')}</select><button class="btn primary" onclick="updateTaskStatus(${Number(t.id)})"><i class="ti ti-refresh"></i>บันทึกสถานะ</button></div></div><div class="field" style="margin-top:10px"><label>เพิ่มคอมเมนต์</label><textarea id="detail-comment" placeholder="พิมพ์คอมเมนต์ / รายละเอียดการอัปเดตงาน"></textarea><button class="btn" style="margin-top:8px;width:100%;justify-content:center" onclick="addTaskComment(${Number(t.id)})"><i class="ti ti-message-plus"></i>เพิ่มคอมเมนต์</button></div><div class="section-lbl">ข้อมูลการมอบหมาย</div><div class="info-row"><div class="info-label">ผู้จ่ายงาน</div><div class="info-value">${esc(t.assigner?.name||'-')}</div></div><div class="info-row"><div class="info-label">ผู้รับงาน</div><div class="info-value">${esc(t.assignee?.name||'-')}</div></div><div class="info-row"><div class="info-label">วันที่จ่ายงาน</div><div class="info-value">${fmtDate(t.startDate)}</div></div><div class="info-row"><div class="info-label">Deadline</div><div class="info-value deadline ${dlClass(t)}">${fmtDate(t.deadline)}</div></div>${t.note?`<div class="section-lbl">หมายเหตุ</div><div class="history-item">${esc(t.note)}</div>`:''}<div class="section-lbl">ไฟล์บรีฟ</div>${fileListHtml(t.brief,'ยังไม่มีลิงก์')}<div class="section-lbl">ไฟล์ส่งงาน</div>${fileListHtml(t.deliver,'ยังไม่มีลิงก์')}<div class="section-lbl">คอมเมนต์</div><div class="history-list">${(t.comments||[]).length?t.comments.map(c=>`<div class="history-item"><div class="history-time">${fmtDateTime(c.at)} • ${esc(c.by||'-')}</div><div style="white-space:pre-line">${esc(c.text)}</div></div>`).join(''):'<div class="field-hint">ยังไม่มีคอมเมนต์</div>'}</div><div class="section-lbl">ประวัติการแก้ไข</div><div class="history-list">${(t.history||[]).length?t.history.map(h=>`<div class="history-item"><div class="history-time">${fmtDateTime(h.at)} • ${esc(h.by||'-')}</div><div style="white-space:pre-line">${esc(h.text)}</div></div>`).join(''):'<div class="field-hint">ยังไม่มีประวัติ</div>'}</div><div style="margin-top:18px">${manageActions}</div>`;document.getElementById('detail-overlay').classList.add('open');}

async function updateTaskStatus(id){if(!canLimitedUpdate()){toast('กรุณา Login ก่อน');return;}const t=tasks.find(x=>Number(x.id)===Number(id));if(!t)return;const newStatus=document.getElementById('detail-status')?.value||t.status;if(newStatus===t.status){toast('สถานะยังเหมือนเดิม');return;}const oldLabel=SL[t.status]||t.status;const newLabel=SL[newStatus]||newStatus;t.status=newStatus;t.history=[{at:new Date().toISOString(),by:currentActorName(),text:`เปลี่ยนสถานะงาน: ${oldLabel} → ${newLabel}`},...(t.history||[])].slice(0,60);await persistData();renderAll();openDetail(id);toast('บันทึกสถานะแล้ว');}

async function addTaskComment(id){if(!canLimitedUpdate()){toast('กรุณา Login ก่อน');return;}const t=tasks.find(x=>Number(x.id)===Number(id));if(!t)return;const text=document.getElementById('detail-comment')?.value.trim();if(!text){toast('กรุณาพิมพ์คอมเมนต์');return;}t.comments=[{at:new Date().toISOString(),by:currentActorName(),text},...(t.comments||[])].slice(0,80);await persistData();renderAll();openDetail(id);toast('เพิ่มคอมเมนต์แล้ว');}
function closeDetail(e){if(!e||e.target===document.getElementById('detail-overlay'))document.getElementById('detail-overlay').classList.remove('open');}
function fmtDateTime(x){if(!x)return'-';try{return new Date(x).toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'});}catch{return x;}}
function renderBrands(){const el=document.getElementById('brand-grid');if(!el)return;el.innerHTML=brands.length?brands.map((b,i)=>{const name=brandName(b);const pkg=brandPackage(b)||'ยังไม่ระบุ Package';const months=brandContractMonths(b);const links=brandInfoLinks(b);const images=brandImageLinks(b);return `<div class="brand-card">${brandVisualHtml(b)}<div class="brand-title">${esc(name)}</div><div class="brand-sub">${tasks.filter(t=>t.brand===name).length} งาน</div><div class="brand-meta"><span class="chip"><i class="ti ti-package"></i>${esc(pkg)}</span><span class="chip"><i class="ti ti-calendar-time"></i>สัญญา ${months} เดือน</span><span class="chip"><i class="ti ti-user"></i>${esc(brandCustomer(b)||'ไม่ระบุลูกค้า')}</span><span class="chip"><i class="ti ti-box"></i>${esc(brandProduct(b)||'ไม่ระบุสินค้า')}</span><span class="chip"><i class="ti ti-photo"></i>${(brandLogoUrl(b)?1:0)+images.length} รูป/โลโก้</span><span class="chip"><i class="ti ti-link"></i>${links.length} ลิงก์ข้อมูล</span></div><div class="card-actions"><button class="btn small" onclick="showView('brand-info')"><i class="ti ti-photo-share"></i>ดูข้อมูล</button>${canManageAll()?`<button class="btn small" onclick='openBrandModal(${JSON.stringify(name)})'><i class="ti ti-edit"></i>แก้ไข</button><button class="btn small danger" onclick='removeBrand(${JSON.stringify(name)})'><i class="ti ti-trash"></i>ลบ</button>`:''}</div></div>`}).join(''):'<div class="no-tasks" style="grid-column:1/-1">ยังไม่มีแบรนด์</div>';}
function renderBrandInfo(){const el=document.getElementById('brand-info-grid');if(!el)return;el.innerHTML=brands.length?brands.map(b=>{const name=brandName(b);const links=brandInfoLinks(b);const images=brandImageLinks(b);const logo=brandLogoUrl(b);return `<div class="brand-card">${brandVisualHtml(b)}<div class="brand-title">${esc(name)}</div><div class="brand-sub">${esc(brandPackage(b)||'ยังไม่ระบุ Package')} • สัญญา ${brandContractMonths(b)} เดือน</div><div class="section-lbl" style="margin-top:12px">Logo / รูปหลัก</div>${logo?fileListHtml([fileObj('เปิด Logo / รูปหลัก',logo)],''): '<div class="field-hint">ยังไม่มี Logo / รูปหลัก</div>'}<div class="section-lbl" style="margin-top:12px">รูปสินค้า / รูปประกอบ</div>${imageGalleryHtml(images)}<div class="section-lbl" style="margin-top:12px">ลิงก์ข้อมูลสำหรับกราฟิก</div>${links.length?fileListHtml(links,''): '<div class="field-hint">ยังไม่มีลิงก์ข้อมูลแบรนด์</div>'}${canManageAll()?`<div class="card-actions" style="margin-top:14px"><button class="btn small" onclick='openBrandModal(${JSON.stringify(name)})'><i class="ti ti-edit"></i>แก้ไขข้อมูลแบรนด์</button></div>`:''}</div>`}).join(''):'<div class="no-tasks" style="grid-column:1/-1">ยังไม่มีแบรนด์</div>';}
function openBrandModal(name=null){if(!canManageAll()){toast('เฉพาะ Owner / Manager เท่านั้นที่จัดการแบรนด์ได้');return;}editingBrandName=name;const b=name?brandByName(name):null;tempBrandInfoLinks=b?brandInfoLinks(b):[];tempBrandImages=b?brandImageLinks(b):[];document.getElementById('brand-modal-title').textContent=name?'แก้ไขแบรนด์':'เพิ่มแบรนด์';document.getElementById('brand-name').value=name||'';document.getElementById('brand-customer').value=b?brandCustomer(b):'';document.getElementById('brand-product').value=b?brandProduct(b):'';document.getElementById('brand-package').value=b?brandPackage(b):'';document.getElementById('brand-package-amount').value=b?brandPackageAmount(b)||'':'';document.getElementById('brand-content-total').value=b?brandContentTotal(b):'';document.getElementById('brand-image-count').value=b?brandImageCount(b)||'':'';document.getElementById('brand-video-count').value=b?brandVideoCount(b)||'':'';renderChannelGrid('brand-channel-grid',b?brandChannels(b):channelDefaults(),'brand-channel');document.getElementById('brand-logo-url').value=b?brandLogoUrl(b):'';const sel=document.getElementById('brand-contract');sel.innerHTML=Array.from({length:12},(_,i)=>`<option value="${i+1}">${i+1} เดือน</option>`).join('');sel.value=b?String(brandContractMonths(b)):'1';document.getElementById('brand-info-link-name').value='';document.getElementById('brand-info-link-url').value='';document.getElementById('brand-image-link-name').value='';document.getElementById('brand-image-link-url').value='';renderLogoPreview();renderBrandInfoLinkList();renderBrandImageLinkList();document.getElementById('brand-modal').classList.add('open');setTimeout(()=>document.getElementById('brand-name').focus(),80);}
function closeBrandModal(){document.getElementById('brand-modal').classList.remove('open');}
function addBrandImageLink(){const name=document.getElementById('brand-image-link-name').value.trim()||'รูปสินค้า';let url=document.getElementById('brand-image-link-url').value.trim();if(!url){toast('กรุณาใส่ลิงก์รูปสินค้า / Logo');return;}if(!/^https?:\/\//i.test(url))url='https://'+url;tempBrandImages.push(fileObj(name,url));document.getElementById('brand-image-link-name').value='';document.getElementById('brand-image-link-url').value='';renderBrandImageLinkList();}
function removeBrandImageLink(i){tempBrandImages.splice(i,1);renderBrandImageLinkList();}
function renderBrandImageLinkList(){const el=document.getElementById('brand-image-links');if(!el)return;el.innerHTML=tempBrandImages.map((f,i)=>`<div class="file-item"><i class="ti ti-photo"></i><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.name)}</a><button class="icon-btn" type="button" onclick="removeBrandImageLink(${i})"><i class="ti ti-x"></i></button></div>`).join('');}
function addBrandInfoLink(){const name=document.getElementById('brand-info-link-name').value.trim()||'ข้อมูลแบรนด์';let url=document.getElementById('brand-info-link-url').value.trim();if(!url){toast('กรุณาใส่ลิงก์ข้อมูลแบรนด์');return;}if(!/^https?:\/\//i.test(url))url='https://'+url;tempBrandInfoLinks.push(fileObj(name,url));document.getElementById('brand-info-link-name').value='';document.getElementById('brand-info-link-url').value='';renderBrandInfoLinkList();}
function removeBrandInfoLink(i){tempBrandInfoLinks.splice(i,1);renderBrandInfoLinkList();}
function renderBrandInfoLinkList(){const el=document.getElementById('brand-info-links');if(!el)return;el.innerHTML=tempBrandInfoLinks.map((f,i)=>`<div class="file-item"><i class="ti ti-link"></i><a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.name)}</a><button class="icon-btn" type="button" onclick="removeBrandInfoLink(${i})"><i class="ti ti-x"></i></button></div>`).join('');}
async function saveBrand(){if(!canManageAll()){toast('เฉพาะ Owner / Manager เท่านั้นที่บันทึกแบรนด์ได้');return;}const name=document.getElementById('brand-name').value.trim();const customer=document.getElementById('brand-customer').value.trim();const product=document.getElementById('brand-product').value.trim();const packageName=document.getElementById('brand-package').value.trim();const packageAmount=Number(document.getElementById('brand-package-amount').value)||0;const contentTotal=document.getElementById('brand-content-total').value.trim();const imageCount=Number(document.getElementById('brand-image-count').value)||0;const videoCount=Number(document.getElementById('brand-video-count').value)||0;const channels=readChannelGrid('brand-channel-grid','brand-channel');const contractMonths=Number(document.getElementById('brand-contract').value)||1;let logoUrl=document.getElementById('brand-logo-url').value.trim();if(logoUrl&&!/^https?:\/\//i.test(logoUrl))logoUrl='https://'+logoUrl;if(!name){toast('กรุณาใส่ชื่อแบรนด์');return;}if(name!==editingBrandName&&brands.some(b=>brandName(b)===name)){toast('มีแบรนด์นี้แล้ว');return;}const nextBrand=brandObj(name,packageName,contractMonths,tempBrandInfoLinks,logoUrl,tempBrandImages,{customer,product,packageAmount,contentTotal,imageCount,videoCount,channels});if(editingBrandName){const oldBrand=brandByName(editingBrandName);brands=brands.map(b=>brandName(b)===editingBrandName?nextBrand:b);const changes=[];if(name!==editingBrandName)changes.push(`แบรนด์: ${editingBrandName} → ${name}`);if((brandPackage(oldBrand)||'')!==packageName)changes.push(`Package: ${brandPackage(oldBrand)||'-'} → ${packageName||'-'}`);if(brandContractMonths(oldBrand)!==contractMonths)changes.push(`สัญญา: ${brandContractMonths(oldBrand)} เดือน → ${contractMonths} เดือน`);if((brandLogoUrl(oldBrand)||'')!==logoUrl)changes.push('แก้ไข Logo / รูปหลัก');if(JSON.stringify(brandImageLinks(oldBrand))!==JSON.stringify(tempBrandImages))changes.push('แก้ไขรูปสินค้า / รูปประกอบ');if(JSON.stringify(brandInfoLinks(oldBrand))!==JSON.stringify(tempBrandInfoLinks))changes.push('แก้ไขลิงก์ข้อมูลแบรนด์');if(name!==editingBrandName){tasks=tasks.map(t=>t.brand===editingBrandName?{...t,brand:name,history:[{at:new Date().toISOString(),by:'ทีมบริหาร',text:changes.join('\n')||`แบรนด์: ${editingBrandName} → ${name}`},...(t.history||[])]}:t);}}else brands.push(nextBrand);closeBrandModal();await persistData();renderAll();}
async function removeBrand(b){if(!canManageAll()){toast('เฉพาะ Owner / Manager เท่านั้นที่ลบแบรนด์ได้');return;}if(tasks.some(t=>t.brand===b)){toast('ไม่สามารถลบแบรนด์ที่มีงานอยู่');return;}if(!await confirmBox('ลบแบรนด์?',`ยืนยันลบแบรนด์ ${b}?`))return;brands=brands.filter(x=>brandName(x)!==b);await persistData();renderAll();}
function renderTeam(){const el=document.getElementById('team-grid');if(!el)return;el.innerHTML=team.length?team.map(m=>`<div class="brand-card"><div style="display:flex;gap:12px;align-items:center;margin-bottom:13px"><div class="avatar" style="width:48px;height:48px;font-size:16px;background:${m.color||'#111827'}14;color:${m.color||'#111827'}">${initials(m.name)}</div><div><div class="brand-title" style="margin-bottom:0">${esc(m.name)}</div><div class="brand-sub" style="margin-bottom:0">${roleLabel(m.role)}</div></div></div><div class="brand-sub">${m.email?esc(m.email)+'<br>':''}${tasks.filter(t=>t.assignee?.name===m.name&&t.status!=='done').length} งานที่ดำเนินอยู่</div>${canManageAll()?`<div class="card-actions"><button class="btn small" onclick='openTeamModal(${JSON.stringify(m.name)})'><i class="ti ti-edit"></i>แก้ไข</button><button class="btn small danger" onclick='deleteTeamMember(${JSON.stringify(m.name)})'><i class="ti ti-trash"></i>ลบ</button></div>`:`<div class="field-hint">การแก้ไขชื่อและตำแหน่งทำได้เฉพาะ Owner / Manager</div>`}</div>`).join(''):'<div class="no-tasks" style="grid-column:1/-1">ยังไม่มีรายชื่อทีมงาน</div>';}
function roleLabel(r){return {manager:'Management',graphic:'Graphic',content:'Content',ads:'Ads',developer:'Developer'}[r]||r||'Team';}
function openTeamModal(name=null){if(!canManageAll()){toast('แก้ไขทีมงานได้เฉพาะ Owner / Manager เท่านั้น');return;}editingTeamName=name;const m=team.find(x=>x.name===name);document.getElementById('team-modal-title').textContent=name?'แก้ไขทีมงาน':'เพิ่มทีมงาน';document.getElementById('team-name').value=m?.name||'';document.getElementById('team-email').value=m?.email||'';document.getElementById('team-role').value=m?.role||'graphic';document.getElementById('team-modal').classList.add('open');setTimeout(()=>document.getElementById('team-name').focus(),80);}
function closeTeamModal(){document.getElementById('team-modal').classList.remove('open');}
async function saveTeamMember(){if(!canManageAll()){toast('แก้ไขทีมงานได้เฉพาะ Owner / Manager เท่านั้น');return;}const name=document.getElementById('team-name').value.trim();const email=document.getElementById('team-email').value.trim().toLowerCase();const role=document.getElementById('team-role').value;if(!name){toast('กรุณาใส่ชื่อทีมงาน');return;}if(email&&team.some(m=>m.name!==editingTeamName&&String(m.email||'').toLowerCase()===email)){toast('Email นี้ถูกใช้กับสมาชิกคนอื่นแล้ว');return;}if(name!==editingTeamName&&team.some(m=>m.name===name)){toast('มีชื่อนี้ในทีมแล้ว');return;}if(editingTeamName){const old=team.find(m=>m.name===editingTeamName);const color=old?.color||COLORS[team.length%COLORS.length];team=team.map(m=>m.name===editingTeamName?{...m,name,email,role,color}:m);tasks=tasks.map(t=>{const nt={...t};if(nt.assigner?.name===editingTeamName)nt.assigner={...nt.assigner,name,email,role,color};if(nt.assignee?.name===editingTeamName)nt.assignee={...nt.assignee,name,email,role,color};return nt;});}else team.push({name,email,role,color:COLORS[team.length%COLORS.length]});closeTeamModal();await persistData();renderAll();}
async function deleteTeamMember(name){if(!canManageAll()){toast('ลบทีมงานได้เฉพาะ Owner / Manager เท่านั้น');return;}const active=tasks.filter(t=>(t.assigner?.name===name||t.assignee?.name===name)&&t.status!=='done').length;const msg=active?`สมาชิกคนนี้มีงานที่ยังไม่เสร็จ ${active} งาน\nถ้าลบ รายชื่อนี้จะหายจากตัวเลือกงานใหม่ แต่งานเดิมยังแสดงชื่อเดิมอยู่`:`ยืนยันลบทีมงาน ${name}?`;if(!await confirmBox('ลบทีมงาน?',msg))return;team=team.filter(m=>m.name!==name);await persistData();renderAll();}
function toast(msg){const w=document.getElementById('toast-wrap');const el=document.createElement('div');el.className='toast';el.textContent=msg;w.appendChild(el);setTimeout(()=>{el.style.opacity='0';el.style.transform='translateY(8px)';setTimeout(()=>el.remove(),250)},2600);}
function confirmBox(title,text){document.getElementById('confirm-title').textContent=title;document.getElementById('confirm-text').textContent=text;document.getElementById('confirm-modal').classList.add('open');return new Promise(res=>confirmResolver=res);}
function closeConfirm(v){document.getElementById('confirm-modal').classList.remove('open');if(confirmResolver){confirmResolver(v);confirmResolver=null;}}
window.loginUser=loginUser;window.loginWithGoogle=loginWithGoogle;window.logoutUser=logoutUser;window.showView=showView;window.openTrackingModal=openTrackingModal;window.closeTrackingModal=closeTrackingModal;window.saveTrackingRecord=saveTrackingRecord;window.deleteTrackingRecord=deleteTrackingRecord;window.renderTracking=renderTracking;window.applyBrandToTracking=applyBrandToTracking;window.clearTrackingFilters=clearTrackingFilters;window.applyBrandToFinance=applyBrandToFinance;
window.safeRun=safeRun;window.renderAll=renderAll;window.hasManagerAccess=hasManagerAccess;window.canManageAll=canManageAll;window.openAccessModal=openAccessModal;window.closeAccessModal=closeAccessModal;window.saveAccess=saveAccess;window.resetAccess=resetAccess;window.openTaskModal=openTaskModal;window.closeTaskModal=closeTaskModal;window.saveTask=saveTask;window.editTask=editTask;window.deleteTask=deleteTask;window.addLink=addLink;window.removeFile=removeFile;window.openDetail=openDetail;window.closeDetail=closeDetail;window.openBrandModal=openBrandModal;window.closeBrandModal=closeBrandModal;window.saveBrand=saveBrand;window.removeBrand=removeBrand;window.addBrandInfoLink=addBrandInfoLink;window.renderChannelGrid=renderChannelGrid;window.removeBrandInfoLink=removeBrandInfoLink;window.addBrandImageLink=addBrandImageLink;window.removeBrandImageLink=removeBrandImageLink;window.openTeamModal=openTeamModal;window.closeTeamModal=closeTeamModal;window.saveTeamMember=saveTeamMember;window.deleteTeamMember=deleteTeamMember;window.renderTasks=renderTasks;window.filteredTasks=filteredTasks;window.clearFilters=clearFilters;window.renderFinancial=renderFinancial;window.openFinanceModal=openFinanceModal;window.closeFinanceModal=closeFinanceModal;window.saveFinanceRecord=saveFinanceRecord;window.deleteFinanceRecord=deleteFinanceRecord;window.clearFinanceFilters=clearFinanceFilters;window.updateFinanceTotals=updateFinanceTotals;window.bindFinanceAutoCalc=bindFinanceAutoCalc;window.closeConfirm=closeConfirm;window.updateTaskStatus=updateTaskStatus;window.addTaskComment=addTaskComment;

function bindBrandImageControls(){
  const logoInput=document.getElementById('brand-logo-url');
  if(logoInput&&logoInput.dataset.previewBound!=='1'){
    logoInput.dataset.previewBound='1';
    logoInput.addEventListener('input',renderLogoPreview);
    logoInput.addEventListener('change',renderLogoPreview);
  }
}
function bindFilterControls(){
  ['search-input','filter-status','filter-brand','filter-assignee','filter-priority','filter-type','filter-from','filter-to'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el||el.dataset.filterBound==='1')return;
    el.dataset.filterBound='1';
    el.addEventListener(id==='search-input'?'input':'change',()=>renderTasks());
  });
  const clearBtn=document.getElementById('clear-filters-button');
  if(clearBtn&&clearBtn.dataset.filterBound!=='1'){clearBtn.dataset.filterBound='1';clearBtn.addEventListener('click',clearFilters);}
}

document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.querySelectorAll('.modal-overlay.open,.detail-overlay.open').forEach(x=>x.classList.remove('open'));}});
// Safety fallback: rebind common buttons after every render so controls remain clickable after dynamic updates.
function bindActionButtons(){
  const bind=(id,fn)=>{
    const el=document.getElementById(id);
    if(!el)return;
    el.type='button';
    el.onclick=(ev)=>{ev.preventDefault();ev.stopPropagation();try{fn(ev);}catch(e){console.error('Button action failed:',id,e);toast('เกิดข้อผิดพลาด กรุณารีเฟรชหน้าแล้วลองใหม่');}return false;};
  };
  bind('task-add-button',()=>openTaskModal());
  bind('finance-add-button',()=>openFinanceModal());
  bind('finance-save-button',()=>saveFinanceRecord());
  bind('brand-add-button',()=>openBrandModal());
  bind('team-add-button',()=>openTeamModal());
}
const previousRenderAll=renderAll;
renderAll=function(){previousRenderAll();bindActionButtons();bindFilterControls();bindBrandImageControls();};
window.renderAll=renderAll;
bindActionButtons();



// Financial modal fallback: keep totals live even when inline handlers are delayed.
document.addEventListener('input',e=>{
  if(e.target && e.target.closest && e.target.closest('#finance-modal')){
    try{updateFinanceTotals();}catch(err){console.error('finance input fallback',err);}
  }
},true);
document.addEventListener('change',e=>{
  if(e.target && e.target.closest && e.target.closest('#finance-modal')){
    try{updateFinanceTotals();}catch(err){console.error('finance change fallback',err);}
  }
},true);

// Extra safety net for Financial save button.
document.addEventListener('click',e=>{
  const btn=e.target.closest?.('#finance-save-button');
  if(!btn)return;
  e.preventDefault();
  e.stopPropagation();
  saveFinanceRecord();
},true);

// Extra safety net for Financial add button: works even if inline handlers are blocked or re-rendered.
document.addEventListener('click',e=>{
  const btn=e.target.closest?.('#finance-add-button,[data-action="add-finance"]');
  if(!btn)return;
  e.preventDefault();
  e.stopPropagation();
  try{openFinanceModal();}
  catch(err){console.error('openFinanceModal fallback error',err);const modal=document.getElementById('finance-modal');if(modal)modal.classList.add('open');toast('เปิดหน้าต่างเพิ่มรายการแล้ว');}
},true);

/* ================= CRM / Admin-Sales Lead Tracking Patch ================= */
DEFAULT_DATA.leads = DEFAULT_DATA.leads || [];
let leads = [];
let editingLeadId = null;

const CRM_STATUSES = [
  ['new','Lead ใหม่'],
  ['contacted','ติดต่อแล้ว'],
  ['appointed','นัดหมายแล้ว'],
  ['followup','รอ Follow up'],
  ['proposal','เสนอข้อมูลแล้ว'],
  ['closed','ปิดการขายแล้ว'],
  ['not_interested','ไม่สนใจ'],
  ['paused','พักไว้']
];
const CRM_SOURCES = ['Facebook','LINE OA','Instagram','TikTok','Website','Referral','Ads','โทรเข้า','อื่น ๆ'];

function normalizeRole(r){
  r=String(r||'graphic').toLowerCase().trim();
  if(r==='management')return 'manager';
  if(r==='admin_staff')return 'admin';
  return r||'graphic';
}
function isOwnerRole(){return accessRole==='owner';}
function isManagerRole(){return accessRole==='manager';}
function isAdminRole(){return accessRole==='admin';}
function isSalesRole(){return accessRole==='sales';}
function hasCRMAccess(){return ['owner','manager','admin','sales'].includes(accessRole);}
function canManageCRM(){return ['owner','manager','admin'].includes(accessRole);}
function canDeleteCRM(){return ['owner','manager'].includes(accessRole);}
function canViewTeam(){return ['owner','manager','admin'].includes(accessRole);}

function leadObj(o={}){
  return {
    id:o.id||Date.now(),
    status:o.status||'new',
    receivedDate:o.receivedDate||o.date||today(),
    appointmentDate:o.appointmentDate||'',
    appointmentTime:o.appointmentTime||'',
    followupDate:o.followupDate||'',
    accountName:o.accountName||o.customerName||o.name||'',
    phone:o.phone||'',
    lineId:o.lineId||o.line||'',
    business:o.business||'',
    source:o.source||'',
    otherContact:o.otherContact||'',
    admin:o.admin||'',
    sales:o.sales||'',
    serviceInterest:o.serviceInterest||'',
    note:o.note||'',
    createdAt:o.createdAt||new Date().toISOString(),
    updatedAt:o.updatedAt||new Date().toISOString()
  };
}
function normalizeLead(o){return leadObj(o||{});}

const __oldNormalizeData = normalizeData;
normalizeData = function(data){
  __oldNormalizeData(data);
  const d=data||clone(DEFAULT_DATA);
  team = team.map(m=>({...m,role:normalizeRole(m.role)}));
  leads = (Array.isArray(d.leads)?d.leads:clone(DEFAULT_DATA.leads||[])).map(normalizeLead);
};

persistData = async function(){
  isSaving=true;
  try{
    if(docRef){
      await setDoc(docRef,{brands,team,tasks,financial,tracking,leads,updatedAt:serverTimestamp()});
      setStatus(true);
    }
    toast('บันทึกแล้ว');
  }catch(e){console.error(e);toast('บันทึกไม่สำเร็จ');setStatus(false);}finally{setTimeout(()=>{isSaving=false},250);}
};

roleFromSignedInUser = function(){
  const email=currentEmail();
  if(OWNER_EMAILS.map(x=>x.toLowerCase()).includes(email))return 'owner';
  const member=team.find(m=>String(m.email||'').toLowerCase().trim()===email);
  return normalizeRole(member?.role||'graphic');
};
roleLabel = function(r){return {owner:'Owner',manager:'Management',admin:'Admin',sales:'Sales',graphic:'Graphic',content:'Content',ads:'Ads',developer:'Developer'}[normalizeRole(r)]||r||'Team';};

function injectCRMStyles(){
  if(document.getElementById('crm-style'))return;
  const style=document.createElement('style');
  style.id='crm-style';
  style.textContent=`
  .crm-summary{display:grid;grid-template-columns:repeat(6,minmax(150px,1fr));gap:12px;margin-bottom:18px}
  .crm-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:18px;box-shadow:var(--shadow)}
  .crm-card .num{font-size:30px;font-weight:800;color:var(--ink);line-height:1}
  .crm-card .label{font-size:13px;color:var(--muted);margin-top:8px;font-weight:700}
  .crm-table-wrap{overflow-x:auto;border-radius:18px}
  .crm-table{width:max-content;min-width:100%;border-collapse:separate;border-spacing:0;font-size:14px;background:#fff}
  .crm-table th,.crm-table td{white-space:nowrap;padding:12px 14px;border-bottom:1px solid var(--line);vertical-align:middle}
  .crm-table th{background:#b9342e;color:#fff;font-weight:800;position:sticky;top:0;z-index:1}
  .crm-table tr:hover td{background:#fafafa}
  .crm-status{display:inline-flex;align-items:center;border-radius:999px;padding:5px 10px;font-weight:800;font-size:12px}
  .crm-status.new{background:#f3e8ff;color:#7e22ce}.crm-status.contacted{background:#dbeafe;color:#1d4ed8}.crm-status.appointed{background:#dcfce7;color:#15803d}.crm-status.followup{background:#fef3c7;color:#b45309}.crm-status.proposal{background:#e0f2fe;color:#0369a1}.crm-status.closed{background:#d1fae5;color:#047857}.crm-status.not_interested{background:#fee2e2;color:#b91c1c}.crm-status.paused{background:#f1f5f9;color:#475569}
  .crm-mini-actions{display:flex;gap:6px;justify-content:flex-end}.crm-note-cell{max-width:260px;overflow:hidden;text-overflow:ellipsis}
  @media(max-width:1100px){.crm-summary{grid-template-columns:repeat(2,1fr)}}`;
  document.head.appendChild(style);
}

function ensureCRMUI(){
  injectCRMStyles();
  const trackingNav=document.querySelector('.nav-item[data-view="tracking"]');
  if(trackingNav&&!document.querySelector('.nav-item[data-view="crm"]')){
    const nav=document.createElement('div');
    nav.className='nav-item'; nav.dataset.view='crm'; nav.onclick=()=>showView('crm');
    nav.innerHTML='<i class="ti ti-address-book"></i><span>CRM / ข้อมูลลูกค้า</span>';
    trackingNav.insertAdjacentElement('afterend',nav);
  }
  const trackingSection=document.getElementById('view-tracking') || document.getElementById('view-team');
  if(trackingSection&&!document.getElementById('view-crm')){
    const sec=document.createElement('section');
    sec.id='view-crm'; sec.className='view';
    sec.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px;flex-wrap:wrap">
        <div><div class="section-title">CRM / ข้อมูลลูกค้า</div><div class="section-sub">สำหรับ Admin และ Sales ติดตาม Lead, นัดหมาย และ Follow up โดยไม่แสดงข้อมูลการเงิน</div></div>
        <button class="btn primary" id="crm-add-button" type="button" onclick="openLeadModal()"><i class="ti ti-plus"></i>เพิ่มลูกค้าใหม่</button>
      </div>
      <div class="crm-summary" id="crm-summary"></div>
      <div class="panel panel-pad" style="margin-bottom:14px">
        <div class="filters" style="grid-template-columns:2fr repeat(4,minmax(150px,1fr)) auto;margin-bottom:0">
          <input class="search-input" id="crm-search" placeholder="ค้นหาชื่อ เบอร์ LINE ธุรกิจ หมายเหตุ" oninput="renderCRM()">
          <select class="filter-select" id="crm-filter-status" onchange="renderCRM()"><option value="">สถานะทั้งหมด</option>${CRM_STATUSES.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select>
          <select class="filter-select" id="crm-filter-admin" onchange="renderCRM()"><option value="">Admin ทั้งหมด</option></select>
          <select class="filter-select" id="crm-filter-sales" onchange="renderCRM()"><option value="">Sales ทั้งหมด</option></select>
          <select class="filter-select" id="crm-filter-source" onchange="renderCRM()"><option value="">แหล่งที่มาทั้งหมด</option></select>
          <button class="btn" type="button" onclick="clearCRMFilters()"><i class="ti ti-eraser"></i>ล้าง</button>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin:8px 0 12px;gap:10px;flex-wrap:wrap">
        <div class="section-sub">แสดงเฉพาะข้อมูลลูกค้าและการติดต่อ ไม่มีตัวเลขทางการเงิน</div>
        <div class="btn small" type="button"><i class="ti ti-calendar"></i>นัดหมาย / Follow up</div>
      </div>
      <div class="panel crm-table-wrap"><table class="crm-table"><thead><tr>
        <th>สถานะ</th><th>วันที่รับข้อมูล</th><th>วันที่นัดหมาย</th><th>วันที่ Follow up</th><th>ชื่อบัญชี / ชื่อลูกค้า</th><th>เบอร์โทร</th><th>ID LINE</th><th>ธุรกิจลูกค้า</th><th>แหล่งที่มา</th><th>ช่องทางติดต่ออื่น</th><th>Admin</th><th>Sales</th><th>บริการที่สนใจ</th><th>หมายเหตุ</th><th></th>
      </tr></thead><tbody id="crm-list"></tbody></table></div>`;
    trackingSection.insertAdjacentElement('beforebegin',sec);
  }
  if(!document.getElementById('lead-modal')){
    const modal=document.createElement('div');
    modal.className='modal-overlay'; modal.id='lead-modal';
    modal.setAttribute('onclick','if(event.target===this)closeLeadModal()');
    modal.innerHTML=`<div class="modal" onclick="event.stopPropagation()">
      <div class="modal-head"><h2 id="lead-modal-title">เพิ่มลูกค้าใหม่</h2><button class="icon-btn" onclick="closeLeadModal()"><i class="ti ti-x"></i></button></div>
      <div class="modal-body">
        <div class="field"><label>สถานะ</label><select id="lead-status">${CRM_STATUSES.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></div>
        <div class="field"><label>วันที่รับข้อมูล</label><input id="lead-received-date" type="date"></div>
        <div class="field"><label>วันที่นัดหมาย</label><input id="lead-appointment-date" type="date"></div>
        <div class="field"><label>เวลานัดหมาย</label><input id="lead-appointment-time" type="time"></div>
        <div class="field"><label>วันที่ Follow up</label><input id="lead-followup-date" type="date"></div>
        <div class="field"><label>ชื่อบัญชี / ชื่อลูกค้า</label><input id="lead-account-name" type="text" placeholder="เช่น Benz Kun / คุณหนู"></div>
        <div class="field"><label>เบอร์โทร</label><input id="lead-phone" type="tel" placeholder="เช่น 081-xxx-xxxx"></div>
        <div class="field"><label>ID LINE</label><input id="lead-line-id" type="text" placeholder="เช่น @lineid หรือ line id"></div>
        <div class="field"><label>ธุรกิจลูกค้า</label><input id="lead-business" type="text" placeholder="เช่น ร้านอาหาร / สกินแคร์ / อสังหา"></div>
        <div class="field"><label>แหล่งที่มา Lead</label><select id="lead-source"><option value="">-- เลือก --</option>${CRM_SOURCES.map(x=>`<option value="${x}">${x}</option>`).join('')}</select></div>
        <div class="field"><label>ช่องทางติดต่ออื่น ๆ</label><input id="lead-other-contact" type="text" placeholder="เช่น FB, IG, Website"></div>
        <div class="field"><label>Admin ผู้รับข้อมูล</label><select id="lead-admin"><option value="">-- เลือก --</option></select></div>
        <div class="field"><label>Sales ผู้ติดต่อ</label><select id="lead-sales"><option value="">-- เลือก --</option></select></div>
        <div class="field"><label>บริการที่สนใจ</label><input id="lead-service-interest" type="text" placeholder="เช่น ทำคอนเทนต์ / ยิงแอด / ดูแลเพจ"></div>
        <div class="field full"><label>หมายเหตุ</label><textarea id="lead-note" placeholder="รายละเอียดการติดต่อ / สิ่งที่ต้อง Follow up"></textarea></div>
      </div>
      <div class="modal-foot"><button class="btn" onclick="closeLeadModal()">ยกเลิก</button><button class="btn primary" id="lead-save-button" onclick="saveLead()"><i class="ti ti-check"></i>บันทึกข้อมูลลูกค้า</button></div>
    </div>`;
    document.body.appendChild(modal);
  }
}

function crmStatusLabel(v){return Object.fromEntries(CRM_STATUSES)[v]||v||'-';}
function crmStatusBadge(v){return `<span class="crm-status ${esc(v||'new')}">${esc(crmStatusLabel(v||'new'))}</span>`;}
function crmTeamNames(role){
  const roles = role==='admin' ? ['admin','manager'] : role==='sales' ? ['sales'] : [];
  const list=team.filter(m=>roles.includes(normalizeRole(m.role))).map(m=>m.name);
  return list.length?list:team.map(m=>m.name);
}
function fillLeadSelect(id,items,all){const el=document.getElementById(id);if(!el)return;const old=el.value;el.innerHTML=`<option value="">${all}</option>`+items.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');el.value=old;}
function renderCRMFilters(){fillLeadSelect('crm-filter-admin',[...new Set(leads.map(l=>l.admin).filter(Boolean).concat(crmTeamNames('admin')))],'Admin ทั้งหมด');fillLeadSelect('crm-filter-sales',[...new Set(leads.map(l=>l.sales).filter(Boolean).concat(crmTeamNames('sales')))],'Sales ทั้งหมด');fillLeadSelect('crm-filter-source',[...new Set(CRM_SOURCES.concat(leads.map(l=>l.source).filter(Boolean)))],'แหล่งที่มาทั้งหมด');}
function filteredCRM(){
  const q=(document.getElementById('crm-search')?.value||'').toLowerCase().trim();
  const st=document.getElementById('crm-filter-status')?.value||'';
  const ad=document.getElementById('crm-filter-admin')?.value||'';
  const sa=document.getElementById('crm-filter-sales')?.value||'';
  const so=document.getElementById('crm-filter-source')?.value||'';
  const mine=currentActorName();
  return leads.map(normalizeLead).filter(l=>{
    const hay=[l.status,l.receivedDate,l.appointmentDate,l.followupDate,l.accountName,l.phone,l.lineId,l.business,l.source,l.otherContact,l.admin,l.sales,l.serviceInterest,l.note].join(' ').toLowerCase();
    const salesAllowed = !isSalesRole() || l.sales===mine || !l.sales;
    return salesAllowed && (!q||hay.includes(q)) && (!st||l.status===st) && (!ad||l.admin===ad) && (!sa||l.sales===sa) && (!so||l.source===so);
  });
}
function renderCRMSummary(){
  const el=document.getElementById('crm-summary'); if(!el)return;
  const list=filteredCRM(); const todayStr=today();
  const newCount=list.filter(l=>l.status==='new').length;
  const apptToday=list.filter(l=>l.appointmentDate===todayStr).length;
  const follow=list.filter(l=>['followup','contacted','proposal'].includes(l.status)||l.followupDate).length;
  const contacted=list.filter(l=>l.status==='contacted').length;
  const closed=list.filter(l=>l.status==='closed').length;
  el.innerHTML=[['Lead ใหม่',newCount,'ยังไม่ได้ติดต่อ'],['นัดหมายวันนี้',apptToday,'มีนัดหมายวันนี้'],['ต้อง Follow up',follow,'กำลังติดตาม'],['ติดต่อแล้ว',contacted,'อยู่ระหว่างการพูดคุย'],['ปิดการขายแล้ว',closed,'เป็นลูกค้าจริง'],['รวมลูกค้าทั้งหมด',list.length,'ทั้งหมด']].map(x=>`<div class="crm-card"><div class="num">${x[1]}</div><div class="label">${x[0]}</div><div class="section-sub" style="margin-top:6px">${x[2]}</div></div>`).join('');
}
function renderCRM(){
  ensureCRMUI();
  if(!hasCRMAccess()){const el=document.getElementById('crm-list');if(el)el.innerHTML='';return;}
  renderCRMFilters(); renderCRMSummary();
  const el=document.getElementById('crm-list'); if(!el)return;
  const list=filteredCRM().sort((a,b)=>String(b.receivedDate||'').localeCompare(String(a.receivedDate||'')));
  el.innerHTML=list.length?list.map(leadRow).join(''):`<tr><td colspan="15" style="text-align:center;color:var(--muted);padding:34px">ยังไม่มีข้อมูลลูกค้า</td></tr>`;
}
function leadRow(l){l=normalizeLead(l);return `<tr><td>${crmStatusBadge(l.status)}</td><td>${fmtDate(l.receivedDate)}</td><td>${l.appointmentDate?fmtDate(l.appointmentDate)+(l.appointmentTime?' '+esc(l.appointmentTime):''):'-'}</td><td>${l.followupDate?fmtDate(l.followupDate):'-'}</td><td><strong>${esc(l.accountName||'-')}</strong></td><td>${esc(l.phone||'-')}</td><td>${esc(l.lineId||'-')}</td><td>${esc(l.business||'-')}</td><td>${esc(l.source||'-')}</td><td>${esc(l.otherContact||'-')}</td><td>${esc(l.admin||'-')}</td><td>${esc(l.sales||'-')}</td><td>${esc(l.serviceInterest||'-')}</td><td class="crm-note-cell" title="${esc(l.note)}">${esc(l.note||'-')}</td><td><div class="crm-mini-actions"><button class="icon-btn" title="ดู/แก้ไข" onclick="openLeadModal(${Number(l.id)})"><i class="ti ti-edit"></i></button>${canDeleteCRM()?`<button class="icon-btn" title="ลบ" onclick="deleteLead(${Number(l.id)})"><i class="ti ti-trash"></i></button>`:''}</div></td></tr>`;}
function clearCRMFilters(){['crm-search','crm-filter-status','crm-filter-admin','crm-filter-sales','crm-filter-source'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});renderCRM();}
function populateLeadSelects(){fillLeadSelect('lead-admin',crmTeamNames('admin'),'-- เลือก --');fillLeadSelect('lead-sales',crmTeamNames('sales'),'-- เลือก --');}
function openLeadModal(id=null){
  if(!hasCRMAccess()){toast('CRM ดูได้เฉพาะ Owner / Manager / Admin / Sales');return;}
  ensureCRMUI(); editingLeadId=id; populateLeadSelects();
  const l=id?normalizeLead(leads.find(x=>Number(x.id)===Number(id))||{}):null;
  document.getElementById('lead-modal-title').textContent=id?'แก้ไขข้อมูลลูกค้า':'เพิ่มลูกค้าใหม่';
  setVal('lead-status',l?.status||'new'); setVal('lead-received-date',l?.receivedDate||today()); setVal('lead-appointment-date',l?.appointmentDate||''); setVal('lead-appointment-time',l?.appointmentTime||''); setVal('lead-followup-date',l?.followupDate||'');
  setVal('lead-account-name',l?.accountName||''); setVal('lead-phone',l?.phone||''); setVal('lead-line-id',l?.lineId||''); setVal('lead-business',l?.business||''); setVal('lead-source',l?.source||''); setVal('lead-other-contact',l?.otherContact||''); setVal('lead-admin',l?.admin|| (isAdminRole()?currentActorName():'')); setVal('lead-sales',l?.sales|| (isSalesRole()?currentActorName():'')); setVal('lead-service-interest',l?.serviceInterest||''); setVal('lead-note',l?.note||'');
  document.getElementById('lead-modal').classList.add('open'); setTimeout(()=>document.getElementById('lead-account-name')?.focus(),80);
}
function closeLeadModal(){document.getElementById('lead-modal')?.classList.remove('open');}
async function saveLead(){
  if(!hasCRMAccess()){toast('ไม่มีสิทธิ์บันทึก CRM');return;}
  const name=val('lead-account-name').trim();
  if(!name){toast('กรุณาใส่ชื่อบัญชี / ชื่อลูกค้า');return;}
  const rec=leadObj({id:editingLeadId||Date.now(),status:val('lead-status'),receivedDate:val('lead-received-date')||today(),appointmentDate:val('lead-appointment-date'),appointmentTime:val('lead-appointment-time'),followupDate:val('lead-followup-date'),accountName:name,phone:val('lead-phone').trim(),lineId:val('lead-line-id').trim(),business:val('lead-business').trim(),source:val('lead-source'),otherContact:val('lead-other-contact').trim(),admin:val('lead-admin')||currentActorName(),sales:val('lead-sales'),serviceInterest:val('lead-service-interest').trim(),note:val('lead-note').trim(),createdAt:(leads.find(x=>Number(x.id)===Number(editingLeadId))||{}).createdAt});
  if(isSalesRole() && rec.sales && rec.sales!==currentActorName()){toast('Sales แก้ไขได้เฉพาะ Lead ของตัวเอง');return;}
  if(editingLeadId)leads=leads.map(x=>Number(x.id)===Number(editingLeadId)?rec:x); else leads.unshift(rec);
  await persistData(); closeLeadModal(); renderAll(); toast('บันทึกข้อมูลลูกค้าแล้ว');
}
async function deleteLead(id){if(!canDeleteCRM()){toast('ลบ CRM ได้เฉพาะ Owner / Manager');return;}if(!await confirmBox('ลบข้อมูลลูกค้า?','ยืนยันลบ Lead นี้'))return;leads=leads.filter(x=>Number(x.id)!==Number(id));await persistData();renderAll();}

const __oldRenderAllCRM = renderAll;
renderAll = function(){ensureCRMUI();__oldRenderAllCRM();safeRun('crm',renderCRM);updateAccessUI();};

const __oldShowViewCRM = showView;
showView = function(v){
  ensureCRMUI(); refreshAccessFromUser();
  if(isAdminRole() && !['crm','team'].includes(v)){toast('Admin ดูได้เฉพาะ CRM และทีมงาน');v='crm';}
  if(isSalesRole() && v!=='crm'){toast('Sales ดูได้เฉพาะ CRM / ข้อมูลลูกค้า');v='crm';}
  if(v==='crm'&&!hasCRMAccess()){toast('CRM ดูได้เฉพาะ Owner / Manager / Admin / Sales');return;}
  if(v==='team'&&!canViewTeam()){toast('ทีมงานดูได้เฉพาะ Owner / Manager / Admin');return;}
  return __oldShowViewCRM(v);
};

const __oldUpdateAccessUICRM = updateAccessUI;
updateAccessUI = function(){
  refreshAccessFromUser();
  const label=roleLabel(accessRole);
  const el=document.getElementById('access-status');if(el){el.className='access-status '+(accessRole==='owner'?'owner':accessRole==='manager'?'manager':'');el.innerHTML=`<i class="ti ti-user-shield"></i> ${label}`;}
  __oldUpdateAccessUICRM();
  document.querySelectorAll('.nav-item').forEach(nav=>{
    const v=nav.dataset.view;
    if(!v)return;
    let show=true;
    if(isAdminRole())show=['crm','team'].includes(v);
    else if(isSalesRole())show=(v==='crm');
    else if(v==='crm')show=hasCRMAccess();
    nav.style.display=show?'flex':'none';
  });
  const crmAdd=document.getElementById('crm-add-button'); if(crmAdd)crmAdd.style.display=hasCRMAccess()?'inline-flex':'none';
  const teamAdd=document.getElementById('team-add-button'); if(teamAdd)teamAdd.style.display=canManageAll()?'inline-flex':'none';
  if(isAdminRole()&&!['crm','team'].includes(currentView))showView('crm');
  if(isSalesRole()&&currentView!=='crm')showView('crm');
};

const __oldRenderTeamCRM = renderTeam;
renderTeam = function(){__oldRenderTeamCRM();};

function patchTeamRoleOptions(){
  const sel=document.getElementById('team-role'); if(!sel)return;
  const opts=[['manager','Management'],['admin','Admin'],['sales','Sales'],['graphic','Graphic'],['content','Content'],['ads','Ads'],['developer','Developer']];
  const old=sel.value;
  sel.innerHTML=opts.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
  sel.value=old||'graphic';
}
const __oldOpenTeamModalCRM = openTeamModal;
openTeamModal = function(name=null){__oldOpenTeamModalCRM(name);patchTeamRoleOptions();};

const __oldBindActionButtonsCRM = bindActionButtons;
bindActionButtons = function(){__oldBindActionButtonsCRM();const btn=document.getElementById('crm-add-button');if(btn){btn.type='button';btn.onclick=(e)=>{e.preventDefault();openLeadModal();return false;};}};

window.showView=showView;window.renderAll=renderAll;window.updateAccessUI=updateAccessUI;window.renderCRM=renderCRM;window.openLeadModal=openLeadModal;window.closeLeadModal=closeLeadModal;window.saveLead=saveLead;window.deleteLead=deleteLead;window.clearCRMFilters=clearCRMFilters;window.openTeamModal=openTeamModal;window.roleLabel=roleLabel;
ensureCRMUI();
/* ================= End CRM Patch ================= */

/* ================= Content Schedule Patch ================= */
let contentSchedule = [];
let editingContentId = null;
const CONTENT_CHANNELS = [
  ['facebook','Facebook'],['instagram','Instagram'],['tiktok','TikTok'],['lineoa','LINE OA'],['youtube','YouTube'],['shopee','Shopee'],['lazada','Lazada'],['website','Website']
];
const CONTENT_TYPES = [
  ['image','ภาพเดี่ยว'],['album','อัลบั้ม'],['reel','Reels / Short Video'],['video','วิดีโอ'],['story','Story'],['article','บทความ'],['other','อื่น ๆ']
];
const CONTENT_STATUSES = [
  ['draft','ร่าง'],['review','รอตรวจ'],['approved','อนุมัติแล้ว'],['ready','พร้อมลง'],['posted','ลงแล้ว'],['revise','แก้ไข']
];
function hasContentScheduleAccess(){return ['owner','manager','graphic','content'].includes(accessRole);}
function canDeleteContentSchedule(){return ['owner','manager'].includes(accessRole);}
function normalizeContentChannels(o={}){
  const valid=new Set(CONTENT_CHANNELS.map(([v])=>v));
  let arr=[];
  if(Array.isArray(o.channels))arr=o.channels;
  else if(Array.isArray(o.channel))arr=o.channel;
  else if(typeof o.channels==='string')arr=o.channels.split(',');
  else if(o.channel)arr=[o.channel];
  arr=arr.map(x=>String(x||'').trim()).filter(x=>valid.has(x));
  return arr.length?[...new Set(arr)]:['facebook'];
}
function normalizeContentRecord(o={}){
  const channels=normalizeContentChannels(o);
  return {
    id:o.id||Date.now(),
    postDate:o.postDate||o.date||today(),
    brand:o.brand||'',
    channels,
    channel:channels[0]||'facebook',
    contentType:o.contentType||o.type||'image',
    title:o.title||o.postTitle||'',
    assetLink:o.assetLink||o.imageLink||o.fileLink||'',
    caption:o.caption||'',
    status:o.status||'draft',
    assignee:o.assignee||o.owner||'',
    note:o.note||'',
    createdAt:o.createdAt||new Date().toISOString(),
    updatedAt:o.updatedAt||''
  };
}
function contentChannelLabels(channels){
  return normalizeContentChannels({channels}).map(v=>contentLabel(CONTENT_CHANNELS,v));
}
function contentChannelChips(channels){
  return `<div class="content-channel-chips">${contentChannelLabels(channels).map(l=>`<span class="content-channel-chip">${esc(l)}</span>`).join('')}</div>`;
}
function renderContentChannelGrid(selected=[]){
  const el=document.getElementById('content-channel-grid'); if(!el)return;
  const set=new Set(normalizeContentChannels({channels:selected}));
  el.innerHTML=CONTENT_CHANNELS.map(([v,l])=>`<label class="content-channel-option"><input type="checkbox" class="content-channel-check" value="${esc(v)}" ${set.has(v)?'checked':''}> <span>${esc(l)}</span></label>`).join('');
}
function readContentChannelGrid(){
  return [...document.querySelectorAll('#content-channel-grid .content-channel-check:checked')].map(x=>x.value);
}
const __oldNormalizeDataContent = normalizeData;
normalizeData = function(data){
  __oldNormalizeDataContent(data);
  contentSchedule = Array.isArray(data?.contentSchedule) ? data.contentSchedule.map(normalizeContentRecord) : [];
};
persistData = async function(){
  isSaving=true;
  try{
    if(docRef){
      await setDoc(docRef,{brands,team,tasks,financial,tracking,leads,contentSchedule,updatedAt:serverTimestamp()});
      setStatus(true);
    }
    toast('บันทึกแล้ว');
  }catch(e){console.error(e);toast('บันทึกไม่สำเร็จ');setStatus(false);}finally{setTimeout(()=>{isSaving=false},250);}
};
function contentLabel(arr,val){return Object.fromEntries(arr)[val]||val||'-';}
function contentStatusBadge(v){return `<span class="content-status ${esc(v||'draft')}">${esc(contentLabel(CONTENT_STATUSES,v||'draft'))}</span>`;}
function contentTeamNames(){
  const allowed=['graphic','content','manager'];
  const list=team.filter(m=>allowed.includes(normalizeRole(m.role))).map(m=>m.name);
  return list.length?list:team.map(m=>m.name);
}
function injectContentScheduleStyles(){
  if(document.getElementById('content-schedule-style'))return;
  const style=document.createElement('style');
  style.id='content-schedule-style';
  style.textContent=`
  .content-summary{display:grid;grid-template-columns:repeat(4,minmax(180px,1fr));gap:14px;margin-bottom:18px}
  .content-card{background:#fff;border:1px solid var(--line);border-radius:20px;padding:18px;box-shadow:var(--shadow)}
  .content-card .num{font-size:30px;font-weight:900;color:var(--ink);line-height:1}.content-card .label{font-size:13px;color:var(--muted);font-weight:800;margin-top:8px}
  .content-table-wrap{overflow-x:auto;border-radius:18px}.content-table{width:max-content;min-width:100%;border-collapse:separate;border-spacing:0;background:#fff;font-size:14px}
  .content-table th,.content-table td{white-space:nowrap;padding:12px 14px;border-bottom:1px solid var(--line);vertical-align:middle}.content-table th{background:#0b2c63;color:#fff;font-weight:900;position:sticky;top:0;z-index:1}.content-table tr:hover td{background:#f8fafc}
  .content-status{display:inline-flex;align-items:center;border-radius:999px;padding:5px 10px;font-size:12px;font-weight:900}.content-status.draft{background:#eff6ff;color:#1d4ed8}.content-status.review{background:#fef3c7;color:#b45309}.content-status.approved{background:#e0f2fe;color:#0369a1}.content-status.ready{background:#dcfce7;color:#15803d}.content-status.posted{background:#d1fae5;color:#047857}.content-status.revise{background:#fee2e2;color:#b91c1c}
  .content-caption-cell{max-width:320px;overflow:hidden;text-overflow:ellipsis}.content-actions{display:flex;gap:6px;justify-content:flex-end}.content-link{font-weight:800;color:#1d4ed8;text-decoration:none}.content-link:hover{text-decoration:underline}
  .content-channel-chips{display:flex;gap:6px;flex-wrap:wrap;min-width:190px}.content-channel-chip{display:inline-flex;align-items:center;border-radius:999px;background:#eef2ff;color:#3730a3;border:1px solid #c7d2fe;padding:4px 8px;font-size:12px;font-weight:900}
  .content-channel-picker{display:grid;grid-template-columns:repeat(2,minmax(130px,1fr));gap:8px;margin-top:6px}.content-channel-option{display:flex;align-items:center;gap:8px;border:1px solid var(--line);background:#fff;border-radius:12px;padding:10px 12px;font-weight:800;color:var(--text)}.content-channel-option input{width:16px;height:16px;accent-color:#111827}
  @media(max-width:1100px){.content-summary{grid-template-columns:repeat(2,1fr)}}`;
  document.head.appendChild(style);
}
function ensureContentScheduleUI(){
  injectContentScheduleStyles();
  const trackingNav=document.querySelector('.nav-item[data-view="tracking"]');
  if(trackingNav&&!document.querySelector('.nav-item[data-view="content-schedule"]')){
    const nav=document.createElement('div');
    nav.className='nav-item'; nav.dataset.view='content-schedule'; nav.onclick=()=>showView('content-schedule');
    nav.innerHTML='<i class="ti ti-calendar-event"></i><span>Content Schedule</span>';
    trackingNav.insertAdjacentElement('beforebegin',nav);
  }
  const trackingSection=document.getElementById('view-tracking') || document.getElementById('view-team');
  if(trackingSection&&!document.getElementById('view-content-schedule')){
    const sec=document.createElement('section');
    sec.id='view-content-schedule'; sec.className='view';
    sec.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px;flex-wrap:wrap">
        <div><div class="section-title">Content Schedule</div><div class="section-sub">จัดตารางคอนเทนต์สำหรับหลายแบรนด์ เก็บลิงก์ภาพ/ไฟล์ และ Caption สำหรับลงช่องทางโซเชียล</div></div>
        <button class="btn primary" id="content-add-button" type="button" onclick="openContentModal()"><i class="ti ti-plus"></i>เพิ่มคอนเทนต์</button>
      </div>
      <div class="content-summary" id="content-summary"></div>
      <div class="panel panel-pad" style="margin-bottom:14px">
        <div class="filters" style="grid-template-columns:2fr repeat(4,minmax(150px,1fr)) auto;margin-bottom:0">
          <input class="search-input" id="content-search" placeholder="ค้นหาแบรนด์ ชื่อโพสต์ Caption ช่องทาง ผู้รับผิดชอบ" oninput="renderContentSchedule()">
          <select class="filter-select" id="content-filter-brand" onchange="renderContentSchedule()"><option value="">แบรนด์ทั้งหมด</option></select>
          <select class="filter-select" id="content-filter-channel" onchange="renderContentSchedule()"><option value="">ช่องทางทั้งหมด</option>${CONTENT_CHANNELS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select>
          <select class="filter-select" id="content-filter-status" onchange="renderContentSchedule()"><option value="">สถานะทั้งหมด</option>${CONTENT_STATUSES.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select>
          <input class="filter-select" id="content-filter-month" type="month" onchange="renderContentSchedule()">
          <button class="btn" type="button" onclick="clearContentFilters()"><i class="ti ti-eraser"></i>ล้าง</button>
        </div>
      </div>
      <div class="panel content-table-wrap"><table class="content-table"><thead><tr>
        <th>วันที่ลง</th><th>แบรนด์</th><th>ช่องทาง</th><th>ประเภท</th><th>ชื่อโพสต์ / หัวข้อ</th><th>ลิงก์รูป / ไฟล์</th><th>Preview Caption</th><th>สถานะ</th><th>ผู้รับผิดชอบ</th><th>หมายเหตุ</th><th></th>
      </tr></thead><tbody id="content-list"></tbody></table></div>`;
    trackingSection.insertAdjacentElement('beforebegin',sec);
  }
  if(!document.getElementById('content-modal')){
    const modal=document.createElement('div');
    modal.className='modal-overlay'; modal.id='content-modal';
    modal.setAttribute('onclick','if(event.target===this)closeContentModal()');
    modal.innerHTML=`<div class="modal" onclick="event.stopPropagation()">
      <div class="modal-head"><h2 id="content-modal-title">เพิ่มคอนเทนต์</h2><button class="icon-btn" onclick="closeContentModal()"><i class="ti ti-x"></i></button></div>
      <div class="modal-body">
        <div class="field"><label>วันที่ลง</label><input id="content-post-date" type="date"></div>
        <div class="field"><label>แบรนด์</label><select id="content-brand"></select></div>
        <div class="field full"><label>ช่องทางที่จะลงโพสต์</label><div class="field-hint">เลือกได้หลายช่องทางใน 1 โพสต์ เช่น Facebook + Instagram + TikTok เพื่อไม่ต้องสร้างรายการซ้ำ</div><div id="content-channel-grid" class="content-channel-picker"></div></div>
        <div class="field"><label>ประเภทคอนเทนต์</label><select id="content-type">${CONTENT_TYPES.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></div>
        <div class="field full"><label>ชื่อโพสต์ / หัวข้อ</label><input id="content-title" type="text" placeholder="เช่น HOB Serum Benefits"></div>
        <div class="field full"><label>ลิงก์รูป / ไฟล์คอนเทนต์</label><input id="content-asset-link" type="url" placeholder="วางลิงก์ Google Drive / Canva / Meta / รูปภาพ"></div>
        <div class="field full"><label>Caption</label><textarea id="content-caption" placeholder="ข้อความ Caption สำหรับโพสต์"></textarea></div>
        <div class="field"><label>สถานะ</label><select id="content-status">${CONTENT_STATUSES.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></div>
        <div class="field"><label>ผู้รับผิดชอบ</label><select id="content-assignee"></select></div>
        <div class="field full"><label>หมายเหตุ</label><textarea id="content-note" placeholder="เช่น รอลูกค้าอนุมัติ / ต้องแก้ภาพ / รอ caption"></textarea></div>
      </div>
      <div class="modal-foot"><button class="btn" onclick="closeContentModal()">ยกเลิก</button><button class="btn primary" id="content-save-button" onclick="saveContentRecord()"><i class="ti ti-check"></i>บันทึกคอนเทนต์</button></div>
    </div>`;
    document.body.appendChild(modal);
  }
}
function renderContentFilters(){
  const sel=document.getElementById('content-filter-brand'); if(sel){const old=sel.value;sel.innerHTML='<option value="">แบรนด์ทั้งหมด</option>'+brands.map(b=>`<option value="${esc(brandName(b))}">${esc(brandName(b))}</option>`).join('');sel.value=old;}
}
function filteredContentSchedule(){
  const q=(document.getElementById('content-search')?.value||'').toLowerCase().trim();
  const b=document.getElementById('content-filter-brand')?.value||'';
  const c=document.getElementById('content-filter-channel')?.value||'';
  const s=document.getElementById('content-filter-status')?.value||'';
  const m=document.getElementById('content-filter-month')?.value||'';
  return contentSchedule.map(normalizeContentRecord).filter(x=>{
    const hay=[x.postDate,x.brand,...contentChannelLabels(x.channels),x.contentType,x.title,x.assetLink,x.caption,x.status,x.assignee,x.note].join(' ').toLowerCase();
    return (!q||hay.includes(q))&&(!b||x.brand===b)&&(!c||normalizeContentChannels(x).includes(c))&&(!s||x.status===s)&&(!m||String(x.postDate||'').startsWith(m));
  });
}
function renderContentSummary(){
  const el=document.getElementById('content-summary'); if(!el)return;
  const list=filteredContentSchedule(); const t=today();
  const todayCount=list.filter(x=>x.postDate===t).length;
  const review=list.filter(x=>x.status==='review').length;
  const ready=list.filter(x=>x.status==='ready').length;
  const brandCount=new Set(list.map(x=>x.brand).filter(Boolean)).size;
  el.innerHTML=[['โพสต์วันนี้',todayCount,'รายการ'],['รอตรวจ',review,'รายการ'],['พร้อมลง',ready,'รายการ'],['แบรนด์ทั้งหมด',brandCount,'แบรนด์']].map(x=>`<div class="content-card"><div class="num">${x[1]}</div><div class="label">${x[0]}</div><div class="section-sub" style="margin-top:6px">${x[2]}</div></div>`).join('');
}
function renderContentSchedule(){
  ensureContentScheduleUI();
  if(!hasContentScheduleAccess()){const el=document.getElementById('content-list');if(el)el.innerHTML='';return;}
  renderContentFilters(); renderContentSummary();
  const el=document.getElementById('content-list'); if(!el)return;
  const list=filteredContentSchedule().sort((a,b)=>String(a.postDate||'9999').localeCompare(String(b.postDate||'9999')) || String(a.brand||'').localeCompare(String(b.brand||'')));
  el.innerHTML=list.length?list.map(contentRow).join(''):`<tr><td colspan="11" style="text-align:center;color:var(--muted);padding:34px">ยังไม่มีรายการ Content Schedule</td></tr>`;
}
function contentRow(x){x=normalizeContentRecord(x);const link=x.assetLink?`<a class="content-link" href="${esc(x.assetLink)}" target="_blank" rel="noopener"><i class="ti ti-link"></i> เปิดไฟล์</a>`:'-';return `<tr><td>${fmtDate(x.postDate)}</td><td><strong>${esc(x.brand||'-')}</strong></td><td>${contentChannelChips(x.channels)}</td><td>${esc(contentLabel(CONTENT_TYPES,x.contentType))}</td><td>${esc(x.title||'-')}</td><td>${link}</td><td class="content-caption-cell" title="${esc(x.caption)}">${esc(x.caption||'-')}</td><td>${contentStatusBadge(x.status)}</td><td>${esc(x.assignee||'-')}</td><td class="content-caption-cell" title="${esc(x.note)}">${esc(x.note||'-')}</td><td><div class="content-actions"><button class="icon-btn" title="แก้ไข" onclick="openContentModal(${Number(x.id)})"><i class="ti ti-edit"></i></button>${canDeleteContentSchedule()?`<button class="icon-btn" title="ลบ" onclick="deleteContentRecord(${Number(x.id)})"><i class="ti ti-trash"></i></button>`:''}</div></td></tr>`;}
function populateContentSelects(){
  const b=document.getElementById('content-brand'); if(b){b.innerHTML='<option value="">-- เลือกแบรนด์ --</option>'+brands.map(x=>`<option value="${esc(brandName(x))}">${esc(brandName(x))}</option>`).join('');}
  const a=document.getElementById('content-assignee'); if(a){const names=contentTeamNames();a.innerHTML='<option value="">-- เลือก --</option>'+names.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');}
}
function openContentModal(id=null){
  if(!hasContentScheduleAccess()){toast('Content Schedule ดูได้เฉพาะ Owner / Manager / Graphic / Content');return;}
  ensureContentScheduleUI(); editingContentId=id; populateContentSelects();
  const r=id?normalizeContentRecord(contentSchedule.find(x=>Number(x.id)===Number(id))||{}):null;
  document.getElementById('content-modal-title').textContent=id?'แก้ไขคอนเทนต์':'เพิ่มคอนเทนต์';
  setVal('content-post-date',r?.postDate||today()); setVal('content-brand',r?.brand||''); renderContentChannelGrid(r?.channels||['facebook']); setVal('content-type',r?.contentType||'image'); setVal('content-title',r?.title||''); setVal('content-asset-link',r?.assetLink||''); setVal('content-caption',r?.caption||''); setVal('content-status',r?.status||'draft'); setVal('content-assignee',r?.assignee||currentActorName()); setVal('content-note',r?.note||'');
  document.getElementById('content-modal').classList.add('open'); setTimeout(()=>document.getElementById('content-title')?.focus(),80);
}
function closeContentModal(){document.getElementById('content-modal')?.classList.remove('open');}
async function saveContentRecord(){
  if(!hasContentScheduleAccess()){toast('ไม่มีสิทธิ์บันทึก Content Schedule');return;}
  const brand=val('content-brand'); const title=val('content-title').trim();
  if(!brand){toast('กรุณาเลือกแบรนด์');return;} if(!title){toast('กรุณาใส่ชื่อโพสต์ / หัวข้อ');return;}
  let link=val('content-asset-link').trim(); if(link&&!/^https?:\/\//i.test(link))link='https://'+link;
  const channels=readContentChannelGrid();
  if(!channels.length){toast('กรุณาเลือกช่องทางอย่างน้อย 1 ช่องทาง');return;}
  const old=contentSchedule.find(x=>Number(x.id)===Number(editingContentId));
  const rec=normalizeContentRecord({id:editingContentId||Date.now(),postDate:val('content-post-date')||today(),brand,channels,contentType:val('content-type'),title,assetLink:link,caption:val('content-caption').trim(),status:val('content-status'),assignee:val('content-assignee')||currentActorName(),note:val('content-note').trim(),createdAt:old?.createdAt,updatedAt:new Date().toISOString()});
  if(editingContentId)contentSchedule=contentSchedule.map(x=>Number(x.id)===Number(editingContentId)?rec:x);else contentSchedule.unshift(rec);
  closeContentModal(); await persistData(); renderContentSchedule();
}
async function deleteContentRecord(id){
  if(!canDeleteContentSchedule()){toast('ลบ Content Schedule ได้เฉพาะ Owner / Manager');return;}
  if(!await confirmBox('ลบรายการคอนเทนต์?','ยืนยันลบรายการนี้ออกจาก Content Schedule?'))return;
  contentSchedule=contentSchedule.filter(x=>Number(x.id)!==Number(id)); await persistData(); renderContentSchedule();
}
function clearContentFilters(){['content-search','content-filter-brand','content-filter-channel','content-filter-status','content-filter-month'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});renderContentSchedule();}
const __oldShowViewContent = showView;
showView = function(v){
  if(v==='content-schedule'&&!hasContentScheduleAccess()){toast('Content Schedule ดูได้เฉพาะ Owner / Manager / Graphic / Content');return;}
  __oldShowViewContent(v);
  if(v==='content-schedule'){
    const titleEl=document.getElementById('view-title'); if(titleEl)titleEl.innerHTML='Content <span>Schedule</span>';
    renderContentSchedule();
  }
};
const __oldRenderAllContent = renderAll;
renderAll = function(){__oldRenderAllContent();safeRun('content-schedule',renderContentSchedule);};
const __oldUpdateAccessUIContent = updateAccessUI;
updateAccessUI = function(){
  __oldUpdateAccessUIContent();
  const nav=document.querySelector('.nav-item[data-view="content-schedule"]'); if(nav)nav.style.display=hasContentScheduleAccess()?'flex':'none';
  const add=document.getElementById('content-add-button'); if(add)add.style.display=hasContentScheduleAccess()?'inline-flex':'none';
  if(currentView==='content-schedule'&&!hasContentScheduleAccess()){
    if(hasCRMAccess())showView('crm'); else showView('tasks');
  }
};
const __oldBindActionButtonsContent = bindActionButtons;
bindActionButtons = function(){__oldBindActionButtonsContent();const btn=document.getElementById('content-add-button');if(btn){btn.type='button';btn.onclick=(e)=>{e.preventDefault();openContentModal();return false;};}};
window.renderContentSchedule=renderContentSchedule;window.renderContentChannelGrid=renderContentChannelGrid;window.openContentModal=openContentModal;window.closeContentModal=closeContentModal;window.saveContentRecord=saveContentRecord;window.deleteContentRecord=deleteContentRecord;window.clearContentFilters=clearContentFilters;window.showView=showView;window.renderAll=renderAll;window.updateAccessUI=updateAccessUI;
ensureContentScheduleUI();
/* ================= End Content Schedule Patch ================= */


/* ================= Sticky horizontal scrollbar patch ================= */
let stickyScrollSyncing=false;
const WIDE_SCROLL_SELECTORS='.finance-table-wrap,.tracking-table-wrap,.crm-table-wrap,.content-table-wrap';
function getActiveWideTableWrap(){
  const view=document.querySelector('.view.active');
  if(!view)return null;
  return view.querySelector(WIDE_SCROLL_SELECTORS);
}
function ensureStickyHorizontalScroll(){
  let bar=document.getElementById('sticky-h-scroll');
  if(!bar){
    bar=document.createElement('div');
    bar.id='sticky-h-scroll';
    bar.className='sticky-h-scroll';
    bar.innerHTML='<div class="sticky-h-scroll-inner"></div>';
    document.body.appendChild(bar);
    bar.addEventListener('scroll',()=>{
      if(stickyScrollSyncing)return;
      const wrap=getActiveWideTableWrap();
      if(!wrap)return;
      stickyScrollSyncing=true;
      wrap.scrollLeft=bar.scrollLeft;
      stickyScrollSyncing=false;
    },{passive:true});
  }
  return bar;
}
function setupWideTableScrollbars(){
  document.querySelectorAll('.table-scroll-top').forEach(el=>el.remove());
  document.querySelectorAll(WIDE_SCROLL_SELECTORS).forEach(w=>{
    if(!w.nextElementSibling||!w.nextElementSibling.classList?.contains('sticky-scroll-spacer')){
      const sp=document.createElement('div');
      sp.className='sticky-scroll-spacer';
      w.insertAdjacentElement('afterend',sp);
    }
  });
  const bar=ensureStickyHorizontalScroll();
  const inner=bar.querySelector('.sticky-h-scroll-inner');
  const wrap=getActiveWideTableWrap();
  document.body.classList.remove('has-sticky-scroll');
  if(!wrap || wrap.scrollWidth<=wrap.clientWidth+4){bar.style.display='none';return;}
  inner.style.width=wrap.scrollWidth+'px';
  if(!wrap.dataset.stickyScrollBound){
    wrap.dataset.stickyScrollBound='1';
    wrap.addEventListener('scroll',()=>{
      if(stickyScrollSyncing)return;
      const active=getActiveWideTableWrap();
      if(active!==wrap)return;
      const b=ensureStickyHorizontalScroll();
      stickyScrollSyncing=true;
      b.scrollLeft=wrap.scrollLeft;
      stickyScrollSyncing=false;
    },{passive:true});
  }
  stickyScrollSyncing=true;
  bar.scrollLeft=wrap.scrollLeft;
  stickyScrollSyncing=false;
  bar.style.display='block';
  document.body.classList.add('has-sticky-scroll');
}
function refreshWideTableScrollbars(){setTimeout(setupWideTableScrollbars,80);setTimeout(setupWideTableScrollbars,350);setTimeout(setupWideTableScrollbars,900);}
window.addEventListener('resize',refreshWideTableScrollbars);
window.addEventListener('scroll',refreshWideTableScrollbars,{passive:true});
const __oldShowViewSticky = showView;
showView = function(v){__oldShowViewSticky(v);refreshWideTableScrollbars();};
const __oldRenderAllSticky = renderAll;
renderAll = function(){__oldRenderAllSticky();safeRun('sticky-scrollbar',refreshWideTableScrollbars);};
window.showView=showView;window.renderAll=renderAll;window.refreshWideTableScrollbars=refreshWideTableScrollbars;
/* ================= End sticky horizontal scrollbar patch ================= */

init();
