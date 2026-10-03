(function() {
  const USERS_KEY = 'ppdb_users';
  const AUTH_VERSION_KEY = 'ppdb_auth_version';
  const defaultUsers = [
    { id: 'user-admin', role: 'admin', displayName: 'Admin PPDB', identifier: 'operator.surabaya01@ppdb.jatimprov.go.id', password: 'admin123' },
    { id: 'user-kepsek', role: 'kepsek', displayName: 'Kepala Sekolah', identifier: '197508122002121003@dinas.go.id', password: 'kepsek123' }
  ];

  function getUsers() {
    if (localStorage.getItem(AUTH_VERSION_KEY) !== '1') {
      localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
      localStorage.setItem(AUTH_VERSION_KEY, '1');
    }
    try {
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      return Array.isArray(users) ? users : [];
    } catch (error) {
      return [];
    }
  }

  function getUser(role) {
    return getUsers().find(user => user.role === role) || null;
  }

  function authenticate(identifier, password, role) {
    const user = getUsers().find(account => account.role === role && account.identifier.toLowerCase() === identifier.trim().toLowerCase() && account.password === password);
    return user ? { id: user.id, role: user.role, displayName: user.displayName, identifier: user.identifier } : null;
  }

  function changePassword(role, identifier, currentPassword, newPassword) {
    const users = getUsers();
    const user = users.find(account => account.role === role && account.identifier.toLowerCase() === identifier.toLowerCase());
    if (!user || user.password !== currentPassword) return { ok: false, error: 'Password saat ini tidak sesuai.' };
    if (newPassword.length < 6) return { ok: false, error: 'Password baru minimal 6 karakter.' };
    user.password = newPassword;
    user.passwordUpdatedAt = new Date().toISOString();
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return { ok: true };
  }

  function updateProfile(role, displayName) {
    const name = String(displayName || '').trim();
    if (!name) return { ok: false, error: 'Nama profil wajib diisi.' };
    if (name.length > 80) return { ok: false, error: 'Nama profil maksimal 80 karakter.' };
    const users = getUsers();
    const user = users.find(account => account.role === role);
    if (!user) return { ok: false, error: 'Akun tidak ditemukan.' };
    user.displayName = name;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    try {
      const session = JSON.parse(localStorage.getItem('ppdb_logged_in') || 'null');
      if (session?.role === role) {
        session.displayName = name;
        localStorage.setItem('ppdb_logged_in', JSON.stringify(session));
      }
    } catch (error) {
      return { ok: false, error: 'Sesi tidak dapat diperbarui.' };
    }
    return { ok: true, user };
  }

  window.PPDBAuth = { getUsers, getUser, authenticate, changePassword, updateProfile };
})();