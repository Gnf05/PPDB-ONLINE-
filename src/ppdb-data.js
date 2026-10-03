(function() {
  const APPLICANTS_KEY = 'ppdb_applicants';
  const ACTIVITY_KEY = 'ppdb_admin_activity';
  const SETTINGS_KEY = 'ppdb_settings';
  const DATA_VERSION_KEY = 'ppdb_data_version';
  const FILES_DB = 'ppdb-files';
  const seededRegistrationNumbers = new Set(['PPDB-2026-0001', 'PPDB-2026-0002', 'PPDB-2026-0003', 'PPDB-2026-0004', 'PPDB-2026-0005', 'PPDB-2026-0006', 'PPDB-2026-0007']);
  const defaultSettings = {
    activeWave: '1',
    academicCalendar: { startDate: '2026-05-01', endDate: '2027-06-30' },
    report: { heading: '', schoolName: '', schoolAddress: '' },
    quotas: { '1': 800, '2': 200, khusus: 50 },
    waves: {
      '1': { startDate: '2026-05-01', endDate: '2026-05-20', open: true, title: 'Gelombang I - Jalur Reguler & Prestasi', pathways: ['zonasi', 'prestasi'] },
      '2': { startDate: '2026-06-15', endDate: '2026-06-28', open: false, title: 'Gelombang II - Pemenuhan Pagu', pathways: ['prestasi', 'mutasi'] },
      khusus: { startDate: '', endDate: '', open: false, title: 'Gelombang Khusus - Kerjasama & Inklusi', pathways: ['mutasi'] }
    }
  };

  const starterApplicants = [];
  const seededApplicantIds = new Set(['app-0001', 'app-0002', 'app-0003', 'app-0004', 'app-0005', 'app-0006', 'app-0007']);

  function read(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function getApplicants() {
    let applicants = read(APPLICANTS_KEY, null);
    if (!applicants) {
      applicants = starterApplicants.slice();
      localStorage.setItem(APPLICANTS_KEY, JSON.stringify(applicants));
    }
    if (localStorage.getItem(DATA_VERSION_KEY) !== '4') {
      applicants = applicants.filter(applicant => applicant.pathway !== 'afirmasi' && !seededApplicantIds.has(applicant.id));
      localStorage.setItem(APPLICANTS_KEY, JSON.stringify(applicants));
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(getActivity().filter(item => !seededRegistrationNumbers.has(item.registrationNo))));
      localStorage.setItem(DATA_VERSION_KEY, '4');
    }
    return applicants;
  }

  function getActivity() {
    return read(ACTIVITY_KEY, []);
  }

  function getNotifications(role) {
    return getActivity().filter(item => {
      if (Array.isArray(item.audienceRoles)) return item.audienceRoles.includes(role);
      if (role === 'kepsek') return item.role === 'admin' || !item.role;
      return item.role === 'kepsek';
    });
  }

  function getUnreadNotifications(role) {
    let readIds = [];
    try { readIds = JSON.parse(localStorage.getItem(`ppdb_notification_reads_${role}`) || '[]'); }
    catch (error) { readIds = []; }
    const readSet = new Set(Array.isArray(readIds) ? readIds : []);
    return getNotifications(role).filter(item => !readSet.has(item.id));
  }

  function markNotificationsRead(role) {
    const currentRead = getNotifications(role).map(item => item.id);
    localStorage.setItem(`ppdb_notification_reads_${role}`, JSON.stringify(currentRead.slice(0, 200)));
    window.dispatchEvent(new Event('ppdb-notifications-updated'));
  }

  function getSettings() {
    let settings = {};
    try {
      settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    } catch (error) {
      settings = {};
    }
    return {
      ...defaultSettings,
      ...settings,
      academicCalendar: { ...defaultSettings.academicCalendar, ...(settings.academicCalendar || {}) },
      report: { ...defaultSettings.report, ...(settings.report || {}) },
      quotas: { ...defaultSettings.quotas, ...(settings.quotas || {}) },
      waves: Object.fromEntries(Object.entries(defaultSettings.waves).map(([wave, defaults]) => [
        wave,
        { ...defaults, ...(settings.waves?.[wave] || {}) }
      ]))
    };
  }

  function recordActivity(action, applicant) {
    const activity = getActivity();
    let session = null;
    try { session = JSON.parse(localStorage.getItem('ppdb_logged_in') || 'null'); }
    catch (error) { session = null; }
    const audienceRoles = action === 'ditambahkan'
      ? ['admin', 'kepsek']
      : session?.role === 'admin' ? ['kepsek']
        : session?.role === 'kepsek' ? ['admin'] : ['admin', 'kepsek'];
    activity.unshift({
      id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      action,
      applicantName: applicant.name,
      registrationNo: applicant.registrationNo,
      actor: session?.displayName || '',
      role: session?.role || '',
      audienceRoles,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity.slice(0, 50)));
    window.dispatchEvent(new Event('ppdb-data-updated'));
  }

  function commit(applicants) {
    localStorage.setItem(APPLICANTS_KEY, JSON.stringify(applicants));
    window.dispatchEvent(new Event('ppdb-data-updated'));
  }

  function openFilesDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) return reject(new Error('Penyimpanan file tidak tersedia di browser ini.'));
      const request = window.indexedDB.open(FILES_DB, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains('files')) {
          const files = database.createObjectStore('files', { keyPath: 'key' });
          files.createIndex('applicantId', 'applicantId', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Database file gagal dibuka.'));
    });
  }

  function saveStoredFile(record) {
    return openFilesDb().then(database => new Promise((resolve, reject) => {
      const transaction = database.transaction('files', 'readwrite');
      transaction.objectStore('files').put(record);
      transaction.oncomplete = () => {
        database.close();
        window.dispatchEvent(new Event('ppdb-data-updated'));
        resolve(record);
      };
      transaction.onerror = () => { database.close(); reject(transaction.error); };
      transaction.onabort = () => { database.close(); reject(transaction.error); };
    }));
  }

  function getStoredFiles(query) {
    return openFilesDb().then(database => new Promise((resolve, reject) => {
      const transaction = database.transaction('files', 'readonly');
      const request = query.applicantId
        ? transaction.objectStore('files').index('applicantId').getAll(query.applicantId)
        : transaction.objectStore('files').getAll();
      request.onsuccess = () => {
        const records = request.result.filter(record => !query.type || record.type === query.type);
        database.close();
        resolve(records);
      };
      request.onerror = () => { database.close(); reject(request.error); };
    }));
  }

  function deleteStoredFiles(applicantId) {
    return openFilesDb().then(database => new Promise((resolve, reject) => {
      const transaction = database.transaction('files', 'readwrite');
      const store = transaction.objectStore('files');
      const request = store.index('applicantId').getAllKeys(applicantId);
      request.onsuccess = () => request.result.forEach(key => store.delete(key));
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => { database.close(); reject(transaction.error); };
      transaction.onabort = () => { database.close(); reject(transaction.error); };
    }));
  }

  function saveApplicantDocument(applicantId, type, file) {
    if (!(file instanceof Blob)) return Promise.reject(new Error('Pilih file dokumen yang valid.'));
    const allowedTypes = ['kk', 'ijazah', 'rapor', 'pendukung'];
    if (!allowedTypes.includes(type)) return Promise.reject(new Error('Jenis dokumen tidak dikenal.'));
    if (file.size > 10 * 1024 * 1024) return Promise.reject(new Error('Ukuran setiap file maksimal 10 MB.'));
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      return Promise.reject(new Error('Format file harus PDF, JPG, atau PNG.'));
    }
    return saveStoredFile({
      key: `applicant:${applicantId}:${type}`,
      applicantId,
      type,
      name: file.name,
      mimeType: file.type,
      size: file.size,
      blob: file,
      updatedAt: new Date().toISOString()
    });
  }

  function getApplicantDocuments(applicantId) {
    return getStoredFiles({ applicantId });
  }

  function deleteApplicantDocuments(applicantId) {
    return deleteStoredFiles(applicantId);
  }

  function saveProfilePhoto(role, file) {
    if (!(file instanceof Blob) || !file.type.startsWith('image/')) return Promise.reject(new Error('Pilih file gambar.'));
    if (file.size > 3 * 1024 * 1024) return Promise.reject(new Error('Ukuran foto maksimal 3 MB.'));
    return saveStoredFile({
      key: `profile:${role}`,
      applicantId: `profile:${role}`,
      type: 'profile_photo',
      name: file.name,
      mimeType: file.type,
      size: file.size,
      blob: file,
      updatedAt: new Date().toISOString()
    });
  }

  function getProfilePhoto(role) {
    return getStoredFiles({ applicantId: `profile:${role}`, type: 'profile_photo' }).then(records => records[0] || null);
  }

  function addApplicant(applicant) {
    const applicants = getApplicants();
    const settings = getSettings();
    const wave = String(applicant.wave || settings.activeWave || '1');
    if (!settings.waves[wave]?.open) throw new Error('Gelombang pendaftaran sedang ditutup.');
    const nextNumber = applicants.reduce((max, item) => {
      const number = Number(item.registrationNo.split('-').pop());
      return Number.isFinite(number) ? Math.max(max, number) : max;
    }, 0) + 1;
    const record = {
      ...applicant,
      id: `app-${Date.now()}`,
      registrationNo: `PPDB-2026-${String(nextNumber).padStart(4, '0')}`,
      appliedAt: new Date().toISOString(),
      status: 'pending',
      selectionStatus: 'belum_diseleksi',
      wave
    };
    applicants.unshift(record);
    commit(applicants);
    recordActivity('ditambahkan', record);
    return record;
  }

  function updateApplicant(id, changes) {
    const applicants = getApplicants();
    const index = applicants.findIndex(applicant => applicant.id === id);
    if (index < 0) return null;
    applicants[index] = { ...applicants[index], ...changes };
    commit(applicants);
    recordActivity('diperbarui', applicants[index]);
    return applicants[index];
  }

  function deleteApplicant(id) {
    const applicants = getApplicants();
    const removed = applicants.find(applicant => applicant.id === id);
    if (!removed) return false;
    commit(applicants.filter(applicant => applicant.id !== id));
    recordActivity('dihapus', removed);
    deleteApplicantDocuments(id).catch(() => {});
    return true;
  }

  function setQuotas(quotas) {
    const settings = getSettings();
    settings.quotas = { ...settings.quotas, ...quotas };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('ppdb-data-updated'));
    recordActivity('memperbarui kuota', { name: 'Kuota gelombang', registrationNo: 'Pengaturan Admin' });
    return settings;
  }

  function setWaveSettings(wave, changes) {
    const settings = getSettings();
    if (!settings.waves[wave]) throw new Error('Gelombang tidak dikenal.');
    settings.waves[wave] = { ...settings.waves[wave], ...changes };
    if (changes.open === true) settings.activeWave = wave;
    if (changes.open === false && String(settings.activeWave) === String(wave)) {
      settings.activeWave = Object.entries(settings.waves).find(([key, value]) => key !== wave && value.open)?.[0] || '';
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('ppdb-data-updated'));
    recordActivity('memperbarui pengaturan gelombang', { name: settings.waves[wave].title, registrationNo: `Gelombang ${wave}` });
    return settings;
  }

  function setAcademicCalendar(academicCalendar) {
    const settings = getSettings();
    settings.academicCalendar = { ...settings.academicCalendar, ...academicCalendar };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('ppdb-data-updated'));
    recordActivity('memperbarui kalender akademik', { name: 'Kalender akademik', registrationNo: 'Pengaturan Admin' });
    return settings;
  }

  function setReportSettings(report) {
    const settings = getSettings();
    settings.report = { ...settings.report, ...report };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('ppdb-data-updated'));
    recordActivity('memperbarui template laporan', { name: 'Template laporan', registrationNo: 'Pengaturan Admin' });
    return settings;
  }

  window.PPDBData = {
    getApplicants,
    getActivity,
    getNotifications,
    getUnreadNotifications,
    markNotificationsRead,
    getSettings,
    setQuotas,
    setWaveSettings,
    setAcademicCalendar,
    setReportSettings,
    addApplicant,
    updateApplicant,
    deleteApplicant,
    saveApplicantDocument,
    getApplicantDocuments,
    deleteApplicantDocuments,
    saveProfilePhoto,
    getProfilePhoto
  };
})();