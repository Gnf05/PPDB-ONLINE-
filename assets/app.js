/* Central client-side app script: auth, sidebar, users CRUD, reports */
(function(){
  const LS_LOGIN_KEY='ppdb_logged_in';
  const LS_USERS_KEY='ppdb_users';

  function isLogged(){return !!localStorage.getItem(LS_LOGIN_KEY)}
  function requireAuth(){ if(!isLogged()){ location.href='login.html'; } }

  function handleLoginPage(){
    const form=document.getElementById('loginForm');
    // jika sudah login, langsung ke dashboard
    if(!form){
      if(isLogged()){ location.href='index.html'; }
      return;
    }
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const email=document.getElementById('email').value;
      const pw=document.getElementById('password').value;
      if(email && pw){
        localStorage.setItem(LS_LOGIN_KEY, JSON.stringify({email}));
        location.href='index.html';
      } else alert('Masukkan kredensial valid.');
    });
  }

  function attachCommon(){
    // Logout buttons
    document.querySelectorAll('#logoutBtn').forEach(b=>b.addEventListener('click',()=>{ localStorage.removeItem(LS_LOGIN_KEY); location.href='login.html'; }));
    // Sidebar active state
    const page=document.body.dataset.page;
    document.querySelectorAll('[data-link]').forEach(a=>{
      if(a.dataset.link===page) a.classList.add('bg-primary','text-white');
    });
    // Sidebar toggle for mobile
    document.querySelectorAll('#sidebarToggle').forEach(btn=>btn.addEventListener('click',()=>{
      const sb=document.getElementById('sidebar'); if(!sb) return; sb.classList.toggle('hidden');
    }));
    // user display
    const user=JSON.parse(localStorage.getItem(LS_LOGIN_KEY)||'null');
    document.querySelectorAll('#userDisplay').forEach(el=>{ if(user) el.textContent=user.email; });
  }

  /* Users CRUD */
  function uid(){return 'u_'+Math.random().toString(36).slice(2,9)}
  function seedUsers(){
    const s=[{id:uid(),name:'Admin',email:'admin@example.com',role:'admin'},{id:uid(),name:'Verifier A',email:'verifier@example.com',role:'verifier'}];
    localStorage.setItem(LS_USERS_KEY,JSON.stringify(s));
    return s;
  }
  function getUsers(){
    try{return JSON.parse(localStorage.getItem(LS_USERS_KEY))||seedUsers()}catch(e){return seedUsers();}
  }
  function saveUsers(u){ localStorage.setItem(LS_USERS_KEY,JSON.stringify(u)); }

  function handleUsersPage(){
    const table=document.querySelector('#usersTable tbody');
    if(!table) return;
    let users=getUsers();
    const search=document.getElementById('searchUser');
    const modal=document.getElementById('modal');
    const form=document.getElementById('userForm');

    function render(list){
      table.innerHTML='';
      list.forEach(u=>{
        const tr=document.createElement('tr');
        tr.innerHTML=`<td class="p-3">${u.id}</td><td class="p-3">${u.name}</td><td class="p-3">${u.email}</td><td class="p-3">${u.role}</td><td class="p-3"><button data-id="${u.id}" class="editBtn px-2 py-1 border rounded mr-2">Edit</button><button data-id="${u.id}" class="delBtn px-2 py-1 border rounded text-red-600">Hapus</button></td>`;
        table.appendChild(tr);
      });
      // attach handlers
      table.querySelectorAll('.delBtn').forEach(b=>b.addEventListener('click',ev=>{
        const id=ev.target.dataset.id; if(!confirm('Hapus user ini?')) return; users=users.filter(x=>x.id!==id); saveUsers(users); render(users);
      }));
      table.querySelectorAll('.editBtn').forEach(b=>b.addEventListener('click',ev=>{
        const id=ev.target.dataset.id; const u=users.find(x=>x.id===id); if(!u) return; document.getElementById('uid').value=u.id; document.getElementById('name').value=u.name; document.getElementById('emailInput').value=u.email; document.getElementById('role').value=u.role; openModal('Edit User');
      }));
    }

    function openModal(title){ document.getElementById('modalTitle').textContent=title; modal.classList.remove('hidden'); modal.classList.add('flex'); }
    function closeModal(){ modal.classList.add('hidden'); modal.classList.remove('flex'); form.reset(); }

    document.getElementById('addUserBtn').addEventListener('click',()=>{ document.getElementById('uid').value=''; openModal('Tambah User'); });
    document.getElementById('cancelModal').addEventListener('click',closeModal);

    form.addEventListener('submit',e=>{
      e.preventDefault(); const id=document.getElementById('uid').value; const name=document.getElementById('name').value; const email=document.getElementById('emailInput').value; const role=document.getElementById('role').value;
      if(id){ users=users.map(u=>u.id===id?{...u,name,email,role}:u);} else { users.push({id:uid(),name,email,role}); }
      saveUsers(users); render(users); closeModal();
    });

    search && search.addEventListener('input',()=>{
      const q=(search.value||'').toLowerCase(); render(users.filter(u=>u.name.toLowerCase().includes(q)||u.email.toLowerCase().includes(q)));
    });

    render(users);
  }

  /* Reports page */
  function handleReportsPage(){
    const area=document.getElementById('reportContent'); if(!area) return;
    const apply=document.getElementById('applyFilter'); const printBtn=document.getElementById('printBtn');
    apply.addEventListener('click',()=>{
      const from=document.getElementById('fromDate').value; const to=document.getElementById('toDate').value; const cat=document.getElementById('reportCategory').value;
      area.textContent=`Filter: ${from||'-'} → ${to||'-'} | Kategori: ${cat}`;
    });
    printBtn.addEventListener('click',()=>window.print());
  }

  /* Settings page */
  function handleSettingsPage(){
    const el=document.getElementById('adminName'); if(!el) return; const user=JSON.parse(localStorage.getItem(LS_LOGIN_KEY)||'null'); if(user) el.textContent=user.email; 
  }

  /* Combined single-page handlers */
  function handleCombinedPage(){
    // scroll-to for sidebar links
    document.querySelectorAll('[data-scroll]').forEach(a=>{
      a.addEventListener('click',ev=>{
        ev.preventDefault(); const href=a.getAttribute('href'); const el=document.querySelector(href); if(el) el.scrollIntoView({behavior:'smooth'});
      });
    });

    // Open queue button -> scroll to table
    const btnOpen=document.getElementById('btnOpenQueue'); if(btnOpen) btnOpen.addEventListener('click',()=>{ document.getElementById('table').scrollIntoView({behavior:'smooth'}); });
    const btnSeeAll=document.getElementById('btnSeeAll'); if(btnSeeAll) btnSeeAll.addEventListener('click',()=>{ document.getElementById('stats').scrollIntoView({behavior:'smooth'}); });

    // Export table to CSV
    function tableToCSV(table){
      const rows=[]; table.querySelectorAll('tr').forEach(tr=>{
        const cols=[]; tr.querySelectorAll('th,td').forEach(td=>{ cols.push('"'+td.innerText.replace(/"/g,'""')+'"'); }); rows.push(cols.join(','));
      });
      return rows.join('\n');
    }
    const btnExportTable=document.getElementById('btnExportTable'); if(btnExportTable){
      btnExportTable.addEventListener('click',()=>{
        const tbl=document.getElementById('pendaftarTable'); const csv=tableToCSV(tbl); const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='pendaftar.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      });
    }

    // Export XLS (CSV) and PDF handlers on combined
    const btnExportXls=document.getElementById('btnExportXls'); if(btnExportXls) btnExportXls.addEventListener('click',()=>{
      const tbl=document.getElementById('pendaftarTable'); const csv=tableToCSV(tbl); const blob=new Blob([csv],{type:'application/vnd.ms-excel'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='rekap_ppdb.xls'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    });
    const btnDownloadPdf=document.getElementById('btnDownloadPdf'); if(btnDownloadPdf) btnDownloadPdf.addEventListener('click',()=>{
      // simple: trigger print; user can save as PDF from browser
      window.print();
    });

    // Export chart as PNG - render simple bars to canvas
    const btnChartPNG=document.getElementById('downloadChartAsPNG'); if(btnChartPNG){
      btnChartPNG.addEventListener('click',()=>{
        const bars=document.getElementById('bars');
        if(!bars) return alert('Tidak ada chart ditemukan.');
        const w=800, h=400; const c=document.createElement('canvas'); c.width=w; c.height=h; const ctx=c.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,w,h);
        // draw simple bars
        const nodes=bars.children; const gap=12; const bw=(w - (nodes.length+1)*gap)/nodes.length; for(let i=0;i<nodes.length;i++){ const ph=parseFloat(nodes[i].title||0); const bh=ph/200*h*0.7; ctx.fillStyle='#2563eb'; ctx.fillRect(gap+(bw+gap)*i, h-80-bh, bw, bh); }
        const url=c.toDataURL('image/png'); const a=document.createElement('a'); a.href=url; a.download='chart.png'; a.click();
      });
    }
  }

  // Init
  document.addEventListener('DOMContentLoaded',()=>{
    attachCommon();
    // protect pages other than login
    const currentFile = location.pathname.split('/').pop();
    if(currentFile !== 'login.html'){
      requireAuth();
    }
    // handle pages
    handleLoginPage();
    handleUsersPage();
    handleReportsPage();
    handleSettingsPage();
    handleCombinedPage();
  });
})();
