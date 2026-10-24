(() => {
  "use strict";
  const STORE_KEY = "skillspring.v1";
  // Supabase configuration — publishable (anon) key only. Safe for the frontend.
  // Never place a secret / service_role key here; those belong on a server.
  const SUPABASE_URL = "https://ajqjejpntizfhzhqyqyp.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_pmBXoFkzdESKPAe-PSTp5g_tpReRT0w";
  const supabase = (typeof window !== "undefined" && window.supabase)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;
  let activeStoreKey = STORE_KEY;      // becomes user-namespaced after sign-in
  let currentUser = null;
  let appBound = false;
  const defaultMissions = [
    {id:"m1",title:"Write your 60-second introduction",category:"Communication",time:"15 min",description:"Draft a short introduction covering who you are, what you've learned, and what role you're aiming for.",done:false},
    {id:"m2",title:"Understand one core concept",category:"Core skills",time:"25 min",description:"Choose one topic from your target role and explain it in your own words without looking at notes.",done:false},
    {id:"m3",title:"Practise one interview question",category:"Interview prep",time:"15 min",description:"Answer one question aloud. Focus on a clear point, a real example, and a concise conclusion.",done:false},
    {id:"m4",title:"Explore one job description",category:"Career research",time:"10 min",description:"Find a role you like and note three skills or responsibilities that appear in the description.",done:false},
    {id:"m5",title:"Improve one resume bullet",category:"Project work",time:"20 min",description:"Rewrite a project or experience bullet to explain the action you took and the result or learning.",done:false},
    {id:"m6",title:"Solve five aptitude questions",category:"Core skills",time:"20 min",description:"Work through five questions and review why each answer is correct, not just the final result.",done:false}
  ];
  const rolePlans = {
    "Business Analyst":[
      ["Understand the business problem","Practise identifying the user, problem, impact, and desired outcome.","Problem framing","20 min"],
      ["Build your communication toolkit","Learn requirement gathering, active listening, and clear documentation.","Communication","25 min"],
      ["Get comfortable with data","Practise spreadsheet sorting, filtering, summaries, and basic charts.","Excel & data","30 min"],
      ["Learn process thinking","Map a simple process and identify bottlenecks or improvement opportunities.","Process mapping","25 min"],
      ["Practise case-style questions","Structure a recommendation using evidence, trade-offs, and next steps.","Case practice","30 min"]
    ],
    "Software Developer":[
      ["Strengthen programming fundamentals","Practise variables, functions, arrays, strings, and writing readable code.","Programming","30 min"],
      ["Build a DSA habit","Solve a problem, explain your approach, and check time complexity.","DSA","30 min"],
      ["Revise core CS concepts","Review OOP, operating systems, databases, and networking basics.","Core CS","25 min"],
      ["Ship a small project improvement","Add one useful feature, handle an edge case, and test it.","Project work","30 min"],
      ["Practise explaining your code","Talk through your approach, alternatives, and trade-offs out loud.","Interview practice","20 min"]
    ],
    "Data Analyst":[
      ["Ask better data questions","Define the question, metric, and decision before looking at a dataset.","Analytical thinking","20 min"],
      ["Practise spreadsheet analysis","Use filters, formulas, summaries, and charts on a small dataset.","Excel","30 min"],
      ["Learn SQL foundations","Practise SELECT, WHERE, GROUP BY, and simple joins.","SQL","30 min"],
      ["Tell a story with data","Write three insights and one recommendation from a chart or table.","Data storytelling","25 min"],
      ["Build a mini case study","Document the problem, approach, findings, and limitations.","Portfolio","35 min"]
    ],
    "Product Associate":[
      ["Understand the user problem","Write who the user is, what they struggle with, and why it matters.","User empathy","20 min"],
      ["Learn product metrics","Define a success metric and one guardrail metric for a simple feature.","Metrics","25 min"],
      ["Practise prioritisation","Compare two feature ideas using impact, effort, and user value.","Prioritisation","25 min"],
      ["Map a user journey","Sketch the steps a user takes and note where friction appears.","UX thinking","25 min"],
      ["Pitch a product improvement","Explain the problem, proposed solution, trade-offs, and success measure.","Communication","30 min"]
    ]
  };
  const questions = [
    {category:"BEHAVIOURAL",q:"Tell me about yourself and what brings you to this role.",hint:"Keep it relevant: present, past, and why this opportunity."},
    {category:"MOTIVATION",q:"Why are you interested in this role, specifically?",hint:"Connect the work to your strengths, curiosity, and what you want to learn."},
    {category:"PROBLEM SOLVING",q:"Tell me about a time you had to solve an unfamiliar problem.",hint:"Explain how you broke it down, what you tried, and what happened."},
    {category:"TEAMWORK",q:"Describe a time you worked with others to achieve a goal.",hint:"Use a specific example. Make your own contribution clear."},
    {category:"ROLE KNOWLEDGE",q:"How would you approach a task when the requirements are unclear?",hint:"Talk about clarifying questions, assumptions, stakeholders, and validation."},
    {category:"SELF AWARENESS",q:"What is one skill you are actively trying to improve?",hint:"Be honest, then explain the concrete steps you're taking."},
    {category:"COMMUNICATION",q:"How would you explain a complex idea to a non-technical person?",hint:"Start with their context, use plain language, and check understanding."},
    {category:"GROWTH",q:"What would you like to learn in your first 90 days?",hint:"Choose realistic learning goals that connect to the team's work."}
  ];
  const skillCatalog = [
    {id:"communication",name:"Communication",desc:"Explain your thinking clearly and adapt to your audience."},
    {id:"problemSolving",name:"Problem solving",desc:"Break unfamiliar tasks into smaller, testable steps."},
    {id:"technical",name:"Technical foundations",desc:"Use the core tools and concepts your target role needs."},
    {id:"data",name:"Data & analytical thinking",desc:"Work with evidence, patterns, and basic metrics."},
    {id:"interview",name:"Interview confidence",desc:"Structure answers and give specific examples."}
  ];
  const levelNames = ["Just starting","Learning basics","Getting comfortable","Confident"];
  const levelDescriptions = ["I'm new to this and need a starting point.","I understand some basics but need guidance.","I can do familiar tasks with some independence.","I can apply this skill and explain my approach."];
  const defaults = {
    name:"Sakshi", goal:"Build confidence, skills, and career clarity", role:"Business Analyst",
    skills:{communication:2,problemSolving:1,technical:1,data:1,interview:1},
    missions:defaultMissions.map(x=>({...x})), practices:[], answers:{}, filter:"all"
  };
  let state = structuredCloneSafe(defaults);
  let currentQuestion = 0;
  let toastTimer;
  const $ = id => document.getElementById(id);
  function normalizeState(saved){
    if(saved && typeof saved==="object"){
      return {...defaults,...saved,skills:{...defaults.skills,...(saved.skills||{})},missions:Array.isArray(saved.missions)?saved.missions:defaultMissions.map(x=>({...x})),practices:Array.isArray(saved.practices)?saved.practices:[],answers:saved.answers||{}};
    }
    return structuredCloneSafe(defaults);
  }
  function loadState(){
    try{
      return normalizeState(JSON.parse(localStorage.getItem(activeStoreKey)));
    }catch(e){console.warn("Could not read saved SkillSpring data.",e)}
    return structuredCloneSafe(defaults);
  }
  function structuredCloneSafe(obj){return JSON.parse(JSON.stringify(obj))}
  function saveState(){try{localStorage.setItem(activeStoreKey,JSON.stringify(state));updateTopBits()}catch(e){showToast("Couldn't save locally. Check browser storage settings.")}scheduleCloudSave()}
  function esc(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function completed(){return state.missions.filter(m=>m.done).length}
  function readiness(){const vals=Object.values(state.skills);return Math.round(vals.reduce((a,b)=>a+b,0)/Math.max(vals.length,1)/4*100)}
  function updateTopBits(){
    const name=state.name||"Your workspace", initial=name.trim().charAt(0).toUpperCase()||"S";
    $("profileName").textContent=name;$("avatarInitial").textContent=initial;$("topAvatar").textContent=initial;
    $("navMissionCount").textContent=state.missions.filter(m=>!m.done).length;
    $("breadcrumbPage").textContent=({overview:"Overview",roadmap:"My roadmap",missions:"Daily missions",interview:"Interview studio",skills:"Skill assessment"})[document.querySelector(".view.active-view")?.id?.replace("view-","")]||"Overview";
  }
  function showToast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2500)}
  function goTo(view){
    document.querySelectorAll(".view").forEach(el=>el.classList.toggle("active-view",el.id==="view-"+view));
    document.querySelectorAll(".nav-item").forEach(el=>el.classList.toggle("active",el.dataset.view===view));
    $("sidebar").classList.remove("mobile-open");updateTopBits();window.scrollTo({top:0,behavior:"smooth"});
    if(view==="overview")renderOverview();if(view==="roadmap")renderRoadmap();if(view==="missions")renderMissions();if(view==="skills")renderSkills();
  }
  function renderOverview(){
    const done=completed(), total=state.missions.length, score=readiness(), percent=total?Math.round(done/total*100):0;
    $("readinessScore").textContent=score;$("readinessBar").style.width=score+"%";$("readinessCaption").textContent=score>=70?"A strong base to build on":score>=45?"You're building momentum":"Your baseline is set";
    $("completedCount").textContent=done;$("totalMissionsLabel").textContent="/"+total;$("missionBar").style.width=percent+"%";
    $("practiceCount").textContent=state.practices.length;$("heroCompletion").textContent=percent+"%";
    $("welcomeSubtitle").textContent=state.goal?state.goal+". Keep it manageable, one step at a time.":"A little progress today makes a big difference tomorrow.";
    const first=state.missions.filter(m=>!m.done).slice(0,3);
    $("overviewMissions").innerHTML=first.length?first.map(m=>`<div class="focus-item"><button class="focus-check" data-toggle-mission="${esc(m.id)}" aria-label="Complete ${esc(m.title)}"></button><div class="focus-title-wrap" style="min-width:0;flex:1"><div class="focus-title">${esc(m.title)}</div><div class="focus-meta">${esc(m.category)}</div></div><span class="focus-time">${esc(m.time)}</span></div>`).join(""):`<div class="empty-state">Lovely work — you've completed every mission. Add another when you're ready.</div>`;
    $("pathwaySteps").innerHTML=(rolePlans[state.role]||rolePlans["Business Analyst"]).slice(0,3).map((step,i)=>`<div class="pathway-step"><div class="step-marker ${i===0&&score>=50?"complete":""}">${i===0&&score>=50?"✓":String(i+1).padStart(2,"0")}</div><div class="step-content"><strong>${esc(step[0])}</strong><p>${esc(step[1])}</p></div></div>`).join("");
    $("rolePill").textContent=state.role;
    $("totalMissionsLabel").textContent="/"+total;
  }
  function renderRoadmap(){
    $("targetRole").value=state.role;
    const plan=rolePlans[state.role]||rolePlans["Business Analyst"], done=completed(), total=state.missions.length, pct=total?Math.round(done/total*100):0;
    $("roadmapTitle").textContent=`Your ${state.role.toLowerCase()} pathway`;
    $("roadmapDescription").textContent=`A practical sequence for building ${state.role==="Business Analyst"?"business thinking, communication, and data confidence":state.role==="Software Developer"?"programming fluency, problem solving, and core CS knowledge":state.role==="Data Analyst"?"data fluency, analytical thinking, and insight communication":"user empathy, product thinking, and prioritisation"}. Adapt the steps to your pace.`;
    $("roadmapPercent").textContent=pct+"%";$("roadmapBar").style.width=pct+"%";
    $("roadmapList").innerHTML=plan.map((s,i)=>{const isDone=i<done;return `<article class="roadmap-card ${isDone?"completed":""}"><div class="roadmap-index">${isDone?"✓":String(i+1).padStart(2,"0")}</div><div><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p><div class="roadmap-tags"><span>${esc(s[2])}</span><span>◷ ${esc(s[3])}</span></div></div><button class="roadmap-action" data-roadmap-mission="${i}">${isDone?"Completed ✓":"Add to missions ＋"}</button></article>`}).join("");
  }
  function renderMissions(){
    const filter=state.filter||"all";document.querySelectorAll(".filter-tab").forEach(b=>b.classList.toggle("active",b.dataset.filter===filter));
    const done=completed(),total=state.missions.length,pct=total?Math.round(done/total*100):0;
    $("missionSummaryText").textContent=`${done} of ${total} completed`;$("missionSummaryBar").style.width=pct+"%";
    const list=state.missions.filter(m=>filter==="done"?m.done:filter==="open"?!m.done:true);
    $("missionsGrid").innerHTML=list.length?list.map(m=>`<article class="mission-card ${m.done?"done":""}"><div class="mission-card-top"><span class="mission-category">${esc(m.category)}</span><span class="mission-status">${m.done?"✓ Completed":"● In progress"}</span></div><h3>${esc(m.title)}</h3><p>${esc(m.description||"Make a little progress and record your win.")}</p><div class="mission-card-bottom"><span class="mission-duration">◷ ${esc(m.time)}</span><button class="mission-toggle ${m.done?"done":""}" data-toggle-mission="${esc(m.id)}">${m.done?"✓ Done — undo":"Mark complete"}</button></div></article>`).join(""):`<div class="empty-state">${filter==="done"?"No completed missions yet. Your first win is waiting.":"No missions here right now. Add a small task to get started."}</div>`;
  }
  function renderSkills(){
    $("skillSliders").innerHTML=skillCatalog.map(s=>{const level=Number(state.skills[s.id]||1);return `<div class="skill-row"><div class="skill-row-head"><strong>${esc(s.name)}</strong><span class="skill-level-label">${esc(levelNames[level-1])}</span></div><p>${esc(s.desc)}</p><div class="skill-levels" role="group" aria-label="${esc(s.name)} level">${levelNames.map((n,i)=>`<button type="button" class="skill-level ${level===i+1?"selected":""}" data-skill="${s.id}" data-level="${i+1}" aria-pressed="${level===i+1}">${i+1}. ${esc(n)}</button>`).join("")}</div></div>`}).join("");
    const score=readiness(), ranked=skillCatalog.map(s=>({...s,level:Number(state.skills[s.id]||1)})).sort((a,b)=>b.level-a.level);
    $("skillsReadiness").textContent=score+"/100";$("strongestSkill").textContent=ranked[0]?.name||"Not rated";$("growthSkill").textContent=ranked[ranked.length-1]?.name||"Not rated";
    const lowest=ranked[ranked.length-1];$("insightText").textContent=score>=70?"You have a strong self-rated foundation. Keep practising with realistic tasks and examples.":`Start with ${lowest.name.toLowerCase()}: choose one small exercise, practise for 15–20 minutes, and explain what you learned.`;
  }
  function toggleMission(id){
    const m=state.missions.find(x=>x.id===id);if(!m)return;m.done=!m.done;saveState();renderOverview();renderMissions();renderRoadmap();showToast(m.done?"Mission complete — nice work!":"Mission moved back to your list.");
  }
  function addMission(title,category,time){
    state.missions.push({id:"custom-"+Date.now(),title,category,time,description:"A task you chose for your own career growth. Keep it specific and achievable.",done:false});
    saveState();renderMissions();renderOverview();renderRoadmap();showToast("Mission added to your plan.");
  }
  function updateQuestion(){
    const q=questions[currentQuestion];$("questionCategory").textContent=q.category;$("questionText").textContent=q.q;$("questionHint").textContent=q.hint;
    $("questionCounter").textContent=`QUESTION ${currentQuestion+1} OF ${questions.length}`;$("questionProgressBar").style.width=((currentQuestion+1)/questions.length*100)+"%";
    $("answerInput").value=state.answers[currentQuestion]||"";updateWordCount();$("feedbackBox").classList.add("hidden");$("prevQuestionBtn").disabled=currentQuestion===0;$("nextQuestionBtn").textContent=currentQuestion===questions.length-1?"Start again ↻":"Next question →";
  }
  function updateWordCount(){const words=$("answerInput").value.trim().split(/\s+/).filter(Boolean).length;$("wordCount").textContent=words+" "+(words===1?"word":"words");}
  function reviewAnswer(){
    const answer=$("answerInput").value.trim();state.answers[currentQuestion]=answer;
    if(!answer){showToast("Write a few thoughts first — rough drafts are welcome.");return}
    const words=answer.split(/\s+/).filter(Boolean).length;
    const hasExample=/for example|for instance|when i|during|project|because|result|learned|helped|achieved|improved/i.test(answer);
    const hasStructure=/first|second|finally|because|therefore|so that|as a result|my approach|specifically/i.test(answer);
    const feedback=[];
    if(words<25)feedback.push("Try adding a little more detail. Aim for a specific example and what you learned.");
    else if(words>180)feedback.push("Your answer has substance. Try trimming it to the clearest 2–3 points.");
    else feedback.push("Good start on length. Read it aloud and remove anything that doesn't support your main point.");
    feedback.push(hasExample?"You included a concrete detail or example — keep that specific evidence.":"Make it more memorable with one real example from a class, project, or team experience.");
    feedback.push(hasStructure?"Your answer includes some signposting. Make sure the conclusion connects to the role.":"Try a simple structure: main point → reason → example → what it shows.");
    $("feedbackBox").innerHTML=`<h4>Reflection prompts for your answer</h4><p>This is an offline writing checklist, not an AI evaluation or a judgement of your ability.</p><ul>${feedback.map(f=>`<li>${esc(f)}</li>`).join("")}</ul><p><strong>Next step:</strong> revise one sentence, then practise saying the answer aloud.</p>`;
    $("feedbackBox").classList.remove("hidden");state.practices.push({question:questions[currentQuestion].q,at:new Date().toISOString(),wordCount:words});saveState();$("practiceCount").textContent=state.practices.length;showToast("Reflection checklist ready.");
  }
  function bindEvents(){
    document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>goTo(b.dataset.view)));
    document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>goTo(b.dataset.goto)));
    $("mobileMenu").addEventListener("click",()=>$("sidebar").classList.toggle("mobile-open"));
    $("editProfileBtn").addEventListener("click",openProfile);$("topAvatar").addEventListener("click",openProfile);
    function openProfile(){$("nameInput").value=state.name||"";$("goalInput").value=state.goal||"";$("profileDialog").showModal()}
    $("profileForm").addEventListener("submit",e=>{if(e.submitter?.value==="cancel")return;e.preventDefault();state.name=$("nameInput").value.trim()||"Your workspace";state.goal=$("goalInput").value.trim();saveState();$("profileDialog").close();renderOverview();showToast("Your workspace has been updated.")});
    $("targetRole").addEventListener("change",e=>{state.role=e.target.value;saveState();renderRoadmap();renderOverview();showToast("Roadmap updated for "+state.role+".")});
    document.querySelectorAll(".filter-tab").forEach(b=>b.addEventListener("click",()=>{state.filter=b.dataset.filter;saveState();renderMissions()}));
    document.addEventListener("click",e=>{
      const toggle=e.target.closest("[data-toggle-mission]");if(toggle)toggleMission(toggle.dataset.toggleMission);
      const level=e.target.closest("[data-skill]");if(level){state.skills[level.dataset.skill]=Number(level.dataset.level);saveState();renderSkills()}
      const add=e.target.closest("[data-roadmap-mission]");if(add){const step=(rolePlans[state.role]||rolePlans["Business Analyst"])[Number(add.dataset.roadmapMission)];if(state.missions.some(m=>m.title===step[0])){showToast("That roadmap step is already in your missions.");return}addMission(step[0],step[2],step[3])}
    });
    $("addMissionBtn").addEventListener("click",()=>$("missionDialog").showModal());
    $("missionForm").addEventListener("submit",e=>{if(e.submitter?.value==="cancel")return;e.preventDefault();const title=$("missionTitleInput").value.trim();if(!title)return;addMission(title,$("missionCategoryInput").value,$("missionTimeInput").value);$("missionForm").reset();$("missionDialog").close()});
    $("answerInput").addEventListener("input",()=>{state.answers[currentQuestion]=$("answerInput").value;saveState();updateWordCount()});
    $("clearAnswerBtn").addEventListener("click",()=>{$("answerInput").value="";state.answers[currentQuestion]="";saveState();updateWordCount();$("feedbackBox").classList.add("hidden")});
    $("reviewAnswerBtn").addEventListener("click",reviewAnswer);
    $("prevQuestionBtn").addEventListener("click",()=>{if(currentQuestion>0){currentQuestion--;updateQuestion()}});
    $("nextQuestionBtn").addEventListener("click",()=>{currentQuestion=(currentQuestion+1)%questions.length;updateQuestion()});
    $("skillsForm").addEventListener("submit",e=>{e.preventDefault();saveState();renderSkills();renderOverview();showToast("Assessment saved on this device.")});
    $("resetDataBtn").addEventListener("click",()=>{if(confirm("Reset SkillSpring to its original demo data? This removes saved progress in this browser.")){state=structuredCloneSafe(defaults);saveState();renderAll();showToast("Demo data reset.")}});
  }
  function renderAll(){updateTopBits();renderOverview();renderRoadmap();renderMissions();renderSkills();updateQuestion()}

  // ---- Supabase authentication (magic link) + session gating ----
  const SITE_URL = "https://skillspring-virid.vercel.app/";   // must be listed in Supabase Redirect URLs
  const BTN_IDLE = "Email me a sign-in link";
  function setMessage(text,type){const el=$("authMessage");if(!el)return;if(!text){el.textContent="";el.className="auth-message";return}el.textContent=text;el.className="auth-message show "+(type||"info")}
  function setBusy(on){const b=$("authSubmitBtn");if(b)b.disabled=!!on}
  function setSaveStatus(mode){const el=$("saveStatus");if(!el)return;const map={local:"Progress saved locally",syncing:"Syncing to cloud\u2026",cloud:"Progress synced to cloud",offline:"Saved locally \u2014 cloud unavailable"};el.innerHTML='<span class="live-dot"></span> '+(map[mode]||map.local)}
  function updateAuthChip(){const el=$("userEmail");if(el)el.textContent=currentUser?.email||""}

  function showAuth(){
    currentUser=null;
    $("appShell").classList.add("hidden");
    $("authScreen").classList.remove("hidden");
    setMessage("","clear");setSaveStatus("local");
    setBusy(false);$("authSubmitBtn").textContent=BTN_IDLE;
  }

  // ---- Supabase database (user_data) with localStorage fallback ----
  async function loadRemoteState(userId){
    if(!supabase)return null;
    try{
      const {data,error}=await supabase.from("user_data").select("data").eq("user_id",userId).maybeSingle();
      if(error)throw error;
      return data?.data||null;
    }catch(e){console.warn("Could not load from Supabase; using local data.",e);return null}
  }
  let cloudTimer;
  function scheduleCloudSave(){
    if(!supabase||!currentUser)return;
    setSaveStatus("syncing");
    clearTimeout(cloudTimer);
    cloudTimer=setTimeout(async()=>{
      try{
        const {error}=await supabase.from("user_data").upsert({user_id:currentUser.id,data:state,updated_at:new Date().toISOString()},{onConflict:"user_id"});
        if(error)throw error;
        setSaveStatus("cloud");
      }catch(e){console.warn("Cloud sync failed; progress still saved locally.",e);setSaveStatus("offline")}
    },700);
  }

  async function startApp(user){
    currentUser=user;
    activeStoreKey=STORE_KEY+"."+user.id;      // each account gets its own local cache
    const remote=await loadRemoteState(user.id);
    if(remote){
      state=normalizeState(remote);
      try{localStorage.setItem(activeStoreKey,JSON.stringify(state))}catch(e){}
      setSaveStatus("cloud");
    }else{
      state=loadState();
      if(!localStorage.getItem(activeStoreKey)){  // first sign-in for this account
        const local=(user.email||"").split("@")[0];
        if(local){state.name=local.charAt(0).toUpperCase()+local.slice(1);saveState();}
      }
      setSaveStatus("local");
    }
    if(!appBound){bindEvents();appBound=true;}
    renderAll();updateAuthChip();
    $("authScreen").classList.add("hidden");
    $("appShell").classList.remove("hidden");
  }

  async function sendMagicLink(email){
    const {data,error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:SITE_URL,shouldCreateUser:true}});
    if(error)throw error;
    return data; // data.session is null because the sign-in link was emailed
  }
  async function handleAuthSubmit(e){
    e.preventDefault();
    if(!supabase){setMessage("Supabase is unavailable \u2014 the CDN script did not load.","error");return}
    const email=$("authEmail").value.trim();
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){setMessage("Enter a valid email address.","error");return}
    setBusy(true);$("authSubmitBtn").textContent="Sending link\u2026";
    try{
      const data=await sendMagicLink(email);
      if(data&&data.session){setMessage("","clear");await startApp(data.session.user)}
      else setMessage("Sign-in link sent to "+email+". Open your inbox and click the link to continue.","success")
    }catch(err){
      const m=err&&err.message?err.message:"";
      setMessage(/rate limit/i.test(m)?"Too many sign-in requests \u2014 please wait about a minute and try again.":(m||"Could not send the sign-in link. Please try again."),"error")
    }
    finally{setBusy(false);$("authSubmitBtn").textContent=BTN_IDLE}
  }
  async function handleLogout(){
    if(!supabase)return;
    try{await supabase.auth.signOut()}catch(err){console.warn("Logout failed.",err)}
    showAuth();setMessage("You've been logged out. See you soon.","info");
  }
  function bindAuthControls(){
    $("authForm").addEventListener("submit",handleAuthSubmit);
    $("logoutBtn").addEventListener("click",handleLogout);
  }
  // Remove ?code= / #access_token= from the address bar once handled.
  function cleanRedirectUrl(){try{if(window.location.search||window.location.hash)history.replaceState({},document.title,window.location.pathname)}catch(e){}}
  async function initAuth(){
    if(!supabase){setMessage("Could not reach Supabase. Ensure the supabase-js CDN script loaded and you are online.","error");setBusy(true);return}
    const arriving=/(code=|access_token=)/.test(window.location.search+window.location.hash);
    bindAuthControls();
    if(arriving)setMessage("Confirming your sign-in link\u2026","info");
    const {data}=await supabase.auth.getSession();   // supabase-js exchanges the magic-link token automatically
    cleanRedirectUrl();
    if(data.session){await startApp(data.session.user)}
    else{showAuth();if(arriving)setMessage("That sign-in link didn't work or has expired. Request a new one.","error")}
    supabase.auth.onAuthStateChange((event,session)=>{
      if(event==="SIGNED_OUT"){showAuth()}
      else if(session&&(!currentUser||session.user.id!==currentUser.id)){cleanRedirectUrl();startApp(session.user)}
    });
  }
  initAuth();
})();