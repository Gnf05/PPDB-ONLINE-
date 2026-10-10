(function() {
  function initializeNavigation() {
    const routes = {
      dashboard: 'index.html',
      'data-pendaftar': 'datapendaftar.html',
      'verifikasi-berkas': 'verifikasi_berkas.html',
      'seleksi-dan-kelulusan': 'seleksi_kelulusan.html',
      'master-gelombang': 'mastergelombang.html',
      laporan: 'Laporan.html'
    };

    let session = null;
    try {
      session = JSON.parse(localStorage.getItem('ppdb_logged_in') || 'null');
    } catch (error) {
      session = null;
    }

    if (!session || !session.identifier || !['admin', 'kepsek'].includes(session.role)) {
      window.location.replace('login.html');
      return;
    }

    const user = window.PPDBAuth.getUser(session.role);
    if (!user || user.identifier.toLowerCase() !== session.identifier.toLowerCase()) {
      localStorage.removeItem('ppdb_logged_in');
      window.location.replace('login.html');
      return;
    }
    let currentUser = user;

    const currentFile = window.location.pathname.split('/').pop();
    const kepsekPages = ['index.html', 'dashboard2.html', 'Laporan.html'];
    if (session.role === 'kepsek' && !kepsekPages.includes(currentFile)) {
      window.location.replace('index.html');
      return;
    }

    document.querySelectorAll('[data-path]').forEach(link => {
      const route = link.dataset.path;
      const destination = routes[route];
      if (session.role === 'kepsek' && !['dashboard', 'laporan'].includes(route)) {
        link.style.display = 'none';
        return;
      }
      if (destination) {
        link.setAttribute('href', destination);
      }
    });

    if (session.role === 'kepsek') {
      document.querySelectorAll('[data-admin-only]').forEach(element => {
        element.style.display = 'none';
      });
    }

    const profile = document.querySelector('header img[alt="Profile"]')?.parentElement;
    const profileLabels = profile?.querySelectorAll('span');
    if (profileLabels?.length >= 2) {
      profileLabels[0].textContent = currentUser.displayName;
      profileLabels[1].textContent = session.role === 'kepsek' ? 'Approval' : 'Administrator';
    }

    if (profile && !document.getElementById('profileMenu')) {
      const profileHost = profile.parentElement;
      profileHost.classList.add('relative');
      profile.classList.add('cursor-pointer', 'rounded-lg', 'p-1', 'hover:bg-surface-container-low');
      profile.setAttribute('role', 'button');
      profile.setAttribute('tabindex', '0');
      profile.setAttribute('aria-haspopup', 'menu');
      profile.setAttribute('aria-expanded', 'false');
      profile.setAttribute('aria-label', 'Menu profil');

      const menu = document.createElement('div');
      menu.id = 'profileMenu';
      menu.className = 'absolute right-0 top-full z-[65] mt-2 hidden w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl';
      menu.setAttribute('role', 'menu');
      menu.innerHTML = `
        <div class="border-b border-slate-100 px-4 py-3">
          <p class="text-sm font-semibold text-slate-900" id="profileMenuName">${currentUser.displayName}</p>
          <p class="mt-0.5 truncate text-xs text-slate-500">${user.identifier}</p>
        </div>
        <button class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50" id="openProfileModal" role="menuitem" type="button"><span class="material-symbols-outlined text-[18px]">manage_accounts</span>Edit Profil</button>
        <button class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50" id="openPasswordModal" role="menuitem" type="button"><span class="material-symbols-outlined text-[18px]">key</span>Ubah Kata Sandi</button>
        <button class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-red-700 hover:bg-red-50" id="logoutButton" role="menuitem" type="button"><span class="material-symbols-outlined text-[18px]">logout</span>Keluar</button>`;
      profileHost.appendChild(menu);

      const passwordModal = document.createElement('div');
      passwordModal.id = 'passwordChangeModal';
      passwordModal.className = 'fixed inset-0 z-[80] hidden items-center justify-center bg-slate-950/50 p-4';
      passwordModal.innerHTML = `
        <section class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="passwordModalTitle">
          <div class="mb-5 flex items-start justify-between">
            <div><p class="text-xs font-semibold uppercase text-blue-700">Keamanan Akun</p><h2 class="mt-1 text-lg font-bold text-slate-900" id="passwordModalTitle">Ubah Kata Sandi</h2></div>
            <button class="rounded-lg p-2 text-slate-500 hover:bg-slate-100" type="button" data-close-password aria-label="Tutup"><span class="material-symbols-outlined">close</span></button>
          </div>
          <form class="space-y-4" id="passwordChangeForm">
            <label class="block text-sm font-medium text-slate-700">Password saat ini<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="currentPassword" type="password" autocomplete="current-password" required></label>
            <label class="block text-sm font-medium text-slate-700">Password baru<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="newPassword" type="password" autocomplete="new-password" minlength="6" required></label>
            <label class="block text-sm font-medium text-slate-700">Konfirmasi password baru<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="confirmPassword" type="password" autocomplete="new-password" minlength="6" required></label>
            <p class="hidden rounded-lg px-3 py-2 text-sm" id="passwordChangeMessage" role="status" aria-live="polite"></p>
            <div class="flex justify-end gap-2 pt-2"><button class="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100" type="button" data-close-password>Batal</button><button class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" type="submit">Simpan Password</button></div>
          </form>
        </section>`;
      document.body.appendChild(passwordModal);

      const profileModal = document.createElement('div');
      profileModal.id = 'profileEditModal';
      profileModal.className = 'fixed inset-0 z-[80] hidden items-center justify-center bg-slate-950/50 p-4';
      profileModal.innerHTML = `
        <section class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="profileEditTitle">
          <div class="mb-5 flex items-start justify-between"><div><p class="text-xs font-semibold uppercase text-blue-700">Akun ${session.role === 'kepsek' ? 'Kepala Sekolah' : 'Admin'}</p><h2 class="mt-1 text-lg font-bold text-slate-900" id="profileEditTitle">Edit Profil</h2></div><button class="rounded-lg p-2 text-slate-500 hover:bg-slate-100" type="button" data-close-profile aria-label="Tutup"><span class="material-symbols-outlined">close</span></button></div>
          <form class="space-y-4" id="profileEditForm">
            <label class="block text-sm font-medium text-slate-700">Nama tampilan<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="displayName" maxlength="80" required></label>
            <label class="block text-sm font-medium text-slate-700">Foto profil<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="photo" type="file" accept="image/png,image/jpeg,image/webp"></label>
            <p class="text-xs text-slate-500">Foto maksimal 3 MB. JPG, PNG, atau WebP.</p>
            <p class="hidden rounded-lg px-3 py-2 text-sm" id="profileEditMessage" role="status" aria-live="polite"></p>
            <div class="flex justify-end gap-2 pt-2"><button class="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100" type="button" data-close-profile>Batal</button><button class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" type="submit">Simpan Profil</button></div>
          </form>
        </section>`;
      document.body.appendChild(profileModal);

      const closeMenu = () => {
        menu.classList.add('hidden');
        profile.setAttribute('aria-expanded', 'false');
      };
      const toggleMenu = () => {
        const willOpen = menu.classList.contains('hidden');
        menu.classList.toggle('hidden', !willOpen);
        profile.setAttribute('aria-expanded', String(willOpen));
      };
      profile.addEventListener('click', toggleMenu);
      profile.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleMenu();
        }
      });
      document.addEventListener('click', event => {
        if (!profileHost.contains(event.target)) closeMenu();
      });

      const closePasswordModal = () => {
        passwordModal.classList.add('hidden');
        passwordModal.classList.remove('flex');
        document.getElementById('passwordChangeForm').reset();
        const message = document.getElementById('passwordChangeMessage');
        message.className = 'hidden rounded-lg px-3 py-2 text-sm';
      };
      const closeProfileModal = () => {
        profileModal.classList.add('hidden');
        profileModal.classList.remove('flex');
        document.getElementById('profileEditForm').reset();
        document.getElementById('profileEditMessage').className = 'hidden rounded-lg px-3 py-2 text-sm';
      };
      const profileImage = profile.querySelector('img');
      let photoUrl = null;
      const refreshProfilePhoto = async () => {
        if (!window.PPDBData?.getProfilePhoto || !profileImage) return;
        try {
          const storedPhoto = await window.PPDBData.getProfilePhoto(session.role);
          if (!storedPhoto) return;
          if (photoUrl) URL.revokeObjectURL(photoUrl);
          photoUrl = URL.createObjectURL(storedPhoto.blob);
          profileImage.src = photoUrl;
        } catch (error) {
          profileImage.removeAttribute('data-profile-photo-error');
        }
      };
      refreshProfilePhoto();
      menu.querySelector('#openProfileModal').addEventListener('click', () => {
        closeMenu();
        const form = document.getElementById('profileEditForm');
        form.elements.displayName.value = currentUser.displayName;
        profileModal.classList.remove('hidden');
        profileModal.classList.add('flex');
        form.elements.displayName.focus();
      });
      profileModal.querySelectorAll('[data-close-profile]').forEach(button => button.addEventListener('click', closeProfileModal));
      profileModal.addEventListener('click', event => { if (event.target === profileModal) closeProfileModal(); });
      document.getElementById('profileEditForm').addEventListener('submit', async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const message = document.getElementById('profileEditMessage');
        const result = window.PPDBAuth.updateProfile(session.role, form.elements.displayName.value);
        if (!result.ok) {
          message.textContent = result.error;
          message.className = 'rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700';
          return;
        }
        currentUser = result.user;
        if (profileLabels?.length >= 2) profileLabels[0].textContent = currentUser.displayName;
        document.getElementById('profileMenuName').textContent = currentUser.displayName;
        const photo = form.elements.photo.files[0];
        if (photo) {
          try {
            await window.PPDBData.saveProfilePhoto(session.role, photo);
            await refreshProfilePhoto();
          } catch (error) {
            message.textContent = `Nama tersimpan, tetapi foto gagal disimpan: ${error.message}`;
            message.className = 'rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800';
            return;
          }
        }
        message.textContent = 'Profil berhasil diperbarui.';
        message.className = 'rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700';
      });
      window.addEventListener('beforeunload', () => { if (photoUrl) URL.revokeObjectURL(photoUrl); });
      menu.querySelector('#openPasswordModal').addEventListener('click', () => {
        closeMenu();
        passwordModal.classList.remove('hidden');
        passwordModal.classList.add('flex');
        passwordModal.querySelector('[name="currentPassword"]').focus();
      });
      passwordModal.querySelectorAll('[data-close-password]').forEach(button => button.addEventListener('click', closePasswordModal));
      passwordModal.addEventListener('click', event => { if (event.target === passwordModal) closePasswordModal(); });
      document.getElementById('passwordChangeForm').addEventListener('submit', event => {
        event.preventDefault();
        const form = event.currentTarget;
        const values = Object.fromEntries(new FormData(form).entries());
        const message = document.getElementById('passwordChangeMessage');
        if (values.newPassword !== values.confirmPassword) {
          message.textContent = 'Konfirmasi tidak sama dengan password baru.';
          message.className = 'rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700';
          return;
        }
        const result = window.PPDBAuth.changePassword(session.role, session.identifier, values.currentPassword, values.newPassword);
        message.textContent = result.ok ? 'Password berhasil diperbarui. Gunakan password baru pada login berikutnya.' : result.error;
        message.className = `rounded-lg px-3 py-2 text-sm ${result.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`;
        if (result.ok) form.reset();
      });

      menu.querySelector('#logoutButton').addEventListener('click', () => {
        localStorage.removeItem('ppdb_logged_in');
        window.location.assign('login.html');
      });
    }
  }

  function bootNavigation() {
    if (window.PPDBAuth) {
      initializeNavigation();
      return;
    }
    const authScript = document.createElement('script');
    authScript.src = '../assets/js/ppdb-auth.js';
    authScript.onload = initializeNavigation;
    authScript.onerror = () => window.location.replace('login.html');
    document.head.appendChild(authScript);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootNavigation, { once: true });
  } else {
    bootNavigation();
  }
})();
