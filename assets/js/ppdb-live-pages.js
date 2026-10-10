(function() {
  const store = window.PPDBData;
  if (!store) return;

  const pathwayLabels = {
    zonasi: 'Zonasi Reguler',
    prestasi: 'Prestasi',
    mutasi: 'Perpindahan Tugas'
  };
  const statusLabels = {
    terverifikasi: 'Terverifikasi',
    pending: 'Menunggu Verifikasi',
    belum_lengkap: 'Perlu Revisi',
    ditolak: 'Ditolak'
  };
  const resultLabels = {
    belum_diseleksi: 'Belum Diseleksi',
    lulus: 'Lulus',
    cadangan: 'Cadangan',
    tidak_lulus: 'Tidak Lulus'
  };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const formatNumber = value => Number(value || 0).toLocaleString('id-ID');
  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };

  function initVerification() {
    const body = document.getElementById('verificationApplicantsBody');
    if (!body) return;

    let selectedId = null;
    let documentUrls = [];
    let page = 1;
    const pageSize = 10;

    function filteredApplicants() {
      const pathway = document.getElementById('verificationPathFilter')?.value || '';
      const wave = document.getElementById('verificationWaveFilter')?.value || 'semua';
      const tab = document.querySelector('.tab-btn[data-active="true"]')?.dataset.filter || 'all';
      return store.getApplicants().filter(applicant => {
        const matchesStatus = tab === 'all'
          || (tab === 'pending' && applicant.status === 'pending')
          || (tab === 'revision' && ['belum_lengkap', 'ditolak'].includes(applicant.status))
          || (tab === 'done' && applicant.status === 'terverifikasi');
        return matchesStatus && (!pathway || applicant.pathway === pathway)
          && (wave === 'semua' || applicant.wave === wave);
      });
    }

    async function renderConsole(applicant) {
      const consolePanel = document.getElementById('verificationConsole');
      if (!consolePanel) return;
      documentUrls.forEach(url => URL.revokeObjectURL(url));
      documentUrls = [];
      if (!applicant) {
        consolePanel.innerHTML = '<h2 class="text-lg font-semibold">Tidak ada pendaftar pada antrean ini</h2><p class="text-sm text-slate-600">Ubah filter untuk melihat record pendaftar lain.</p>';
        return;
      }
      const applicantId = applicant.id;
      let documents = [];
      try { documents = await store.getApplicantDocuments(applicantId); }
      catch (error) { documents = []; }
      if (selectedId !== applicantId) return;
      const requiredDocuments = [['kk', 'Kartu Keluarga'], ['ijazah', 'Ijazah / SKL'], ['rapor', 'Rapor']];
      const complete = requiredDocuments.every(([type]) => documents.some(document => document.type === type));
      const documentRows = requiredDocuments.map(([type, label]) => {
        const document = documents.find(item => item.type === type);
        if (!document) return `<li class="flex items-center justify-between border-b border-slate-100 py-2"><span>${label}</span><span class="text-amber-700">Belum diunggah</span></li>`;
        const url = URL.createObjectURL(document.blob);
        documentUrls.push(url);
        return `<li class="flex items-center justify-between gap-3 border-b border-slate-100 py-2"><span class="min-w-0 truncate">${label}: ${escapeHtml(document.name)}</span><a class="shrink-0 text-blue-700 hover:underline" href="${url}" target="_blank" rel="noopener">Buka</a></li>`;
      }).join('');
      const statusTone = applicant.status === 'terverifikasi' ? 'text-green-800 bg-green-100'
        : applicant.status === 'ditolak' ? 'text-red-800 bg-red-100' : 'text-amber-800 bg-amber-100';
      consolePanel.innerHTML = `
        <div class="flex items-start justify-between gap-3">
          <div><span class="text-xs uppercase text-slate-500">Record Pendaftar</span><h2 class="mt-1 text-lg font-bold">${escapeHtml(applicant.name)}</h2></div>
          <span class="rounded-full px-2 py-1 text-xs font-semibold ${statusTone}">${escapeHtml(statusLabels[applicant.status] || applicant.status)}</span>
        </div>
        <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div><dt class="text-slate-500">No. pendaftaran</dt><dd class="font-medium">${escapeHtml(applicant.registrationNo)}</dd></div>
          <div><dt class="text-slate-500">NISN</dt><dd class="font-medium">${escapeHtml(applicant.nisn)}</dd></div>
          <div><dt class="text-slate-500">Asal sekolah</dt><dd class="font-medium">${escapeHtml(applicant.school)}</dd></div>
          <div><dt class="text-slate-500">Kota/Kabupaten</dt><dd class="font-medium">${escapeHtml(applicant.city)}</dd></div>
          <div><dt class="text-slate-500">Jalur</dt><dd class="font-medium">${escapeHtml(pathwayLabels[applicant.pathway] || applicant.pathway)}</dd></div>
          <div><dt class="text-slate-500">Gelombang</dt><dd class="font-medium">${escapeHtml(applicant.wave)}</dd></div>
          <div><dt class="text-slate-500">Nilai rapor</dt><dd class="font-medium">${Number(applicant.score || 0).toFixed(2)}</dd></div>
        </dl>
        <section class="mt-4 rounded-lg border border-slate-200 p-3"><div class="flex items-center justify-between"><h3 class="font-semibold">Dokumen Persyaratan</h3><span class="text-xs ${complete ? 'text-green-700' : 'text-amber-700'}">${documents.filter(item => requiredDocuments.some(([type]) => type === item.type)).length} / 3 lengkap</span></div><ul class="mt-2 text-sm">${documentRows}</ul></section>
        <label class="mt-4 block text-sm font-semibold" for="verifierNote">Catatan verifikator <span class="font-normal text-slate-500">(opsional)</span></label>
        <textarea class="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm" id="verifierNote" rows="3" placeholder="Tambahkan alasan revisi atau penolakan bila diperlukan">${escapeHtml(applicant.verifierNote || '')}</textarea>
        <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button class="rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" data-verification-action="terverifikasi" type="button" ${complete ? '' : 'disabled'}>Terverifikasi</button>
          <button class="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white" data-verification-action="belum_lengkap" type="button">Minta Revisi</button>
          <button class="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white" data-verification-action="ditolak" type="button">Tolak</button>
        </div>`;
    }

    async function render() {
      const applicants = store.getApplicants();
      const pending = applicants.filter(item => item.status === 'pending').length;
      const verified = applicants.filter(item => item.status === 'terverifikasi').length;
      const revision = applicants.filter(item => ['belum_lengkap', 'ditolak'].includes(item.status)).length;
      const metrics = document.getElementById('verificationMetrics');
      if (metrics) {
        metrics.innerHTML = [
          ['Total Pendaftar', applicants.length, 'Semua record pendaftar tersimpan'],
          ['Menunggu Verifikasi', pending, 'Status berkas: pending'],
          ['Diverifikasi Valid', verified, 'Status berkas: terverifikasi'],
          ['Perlu Revisi / Tolak', revision, 'Belum lengkap atau ditolak']
        ].map(([label, value, detail]) => `<article class="rounded-lg bg-white p-4 shadow-sm"><p class="text-sm text-slate-500">${label}</p><p class="mt-1 text-3xl font-bold">${formatNumber(value)}</p><p class="mt-1 text-xs text-slate-500">${detail}</p></article>`).join('');
      }
      setText('verificationQueueCount', `${formatNumber(pending)} Antrean`);
      setText('verificationQueueMessage', `${formatNumber(pending)} pendaftar berstatus menunggu verifikasi.`);
      document.querySelectorAll('.tab-btn').forEach(button => {
        const count = button.dataset.filter === 'pending' ? pending
          : button.dataset.filter === 'revision' ? revision
            : button.dataset.filter === 'done' ? verified : applicants.length;
        const label = { all: 'Semua', pending: 'Menunggu', revision: 'Perlu Revisi', done: 'Sudah Verifikasi' }[button.dataset.filter];
        if (label) button.textContent = `${label} (${formatNumber(count)})`;
      });

      const filtered = filteredApplicants().sort((left, right) => new Date(left.appliedAt) - new Date(right.appliedAt));
      const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
      page = Math.min(page, pages);
      const start = (page - 1) * pageSize;
      const records = filtered.slice(start, start + pageSize);
      const documentsByApplicant = new Map(await Promise.all(records.map(async applicant => {
        try { return [applicant.id, await store.getApplicantDocuments(applicant.id)]; }
        catch (error) { return [applicant.id, []]; }
      })));
      if (!records.some(item => item.id === selectedId)) selectedId = records[0]?.id || null;
      body.innerHTML = records.map(applicant => {
        const isSelected = applicant.id === selectedId;
        const applicantDocuments = documentsByApplicant.get(applicant.id) || [];
        const documentNames = applicantDocuments.map(document => document.name).join(', ') || 'Belum ada lampiran';
        return `<tr class="border-t border-slate-100 ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}" data-verification-row="${escapeHtml(applicant.id)}">
          <td class="px-3 py-3"><div class="font-semibold">${escapeHtml(applicant.name)}</div><div class="text-xs text-slate-500">${escapeHtml(applicant.registrationNo)} · NISN ${escapeHtml(applicant.nisn)}</div><div class="text-xs text-slate-500">${escapeHtml(applicant.school)} · ${escapeHtml(applicant.city)}</div><div class="mt-1 max-w-[24rem] truncate text-xs text-blue-700" title="${escapeHtml(documentNames)}">${escapeHtml(applicantDocuments.length)}/3 berkas · ${escapeHtml(documentNames)}</div></td>
          <td class="px-2 py-3 text-sm">${escapeHtml(pathwayLabels[applicant.pathway] || applicant.pathway)}</td>
          <td class="px-2 py-3 text-center text-sm">Gelombang ${escapeHtml(applicant.wave)}</td>
          <td class="px-2 py-3 text-center"><span class="rounded-full px-2 py-1 text-xs font-semibold ${applicant.status === 'terverifikasi' ? 'bg-green-100 text-green-800' : applicant.status === 'ditolak' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}">${escapeHtml(statusLabels[applicant.status] || applicant.status)}</span></td>
          <td class="px-3 py-3 text-right"><button class="rounded-lg px-3 py-1.5 text-sm ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-100'}" data-select-verification="${escapeHtml(applicant.id)}" type="button">${isSelected ? 'Dipilih' : 'Tinjau'}</button></td>
        </tr>`;
      }).join('') || '<tr><td class="px-4 py-8 text-center text-sm text-slate-500" colspan="5">Tidak ada record sesuai filter.</td></tr>';
      setText('verificationPageSummary', filtered.length ? `Menampilkan ${start + 1}-${start + records.length} dari ${filtered.length} record` : 'Menampilkan 0 record');
      setText('verificationPaginationSummary', `${page} / ${pages}`);
      renderConsole(applicants.find(item => item.id === selectedId));
    }

    body.addEventListener('click', event => {
      const button = event.target.closest('[data-select-verification]');
      if (!button) return;
      selectedId = button.dataset.selectVerification;
      render();
    });
    document.getElementById('verificationConsole')?.addEventListener('click', event => {
      const button = event.target.closest('[data-verification-action]');
      if (!button || !selectedId) return;
      const status = button.dataset.verificationAction;
      const note = document.getElementById('verifierNote')?.value.trim() || '';
      if (status === 'terverifikasi') {
        store.getApplicantDocuments(selectedId).then(documents => {
          const hasRequiredDocuments = ['kk', 'ijazah', 'rapor'].every(type => documents.some(document => document.type === type));
          if (!hasRequiredDocuments) return window.alert('KK, ijazah/SKL, dan rapor harus tersedia sebelum status dapat diubah ke Terverifikasi.');
          if (!store.updateApplicant(selectedId, { status, verifierNote: note })) window.alert('Data pendaftar tidak ditemukan. Muat ulang halaman.');
        }).catch(error => window.alert(`Dokumen tidak dapat dibaca: ${error.message}`));
        return;
      }
      if (!store.updateApplicant(selectedId, { status, verifierNote: note })) window.alert('Data pendaftar tidak ditemukan. Muat ulang halaman.');
    });
    document.querySelectorAll('.tab-btn').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('bg-surface-card', 'text-primary', 'font-bold', 'shadow-sm');
        tab.classList.add('text-text-secondary');
        tab.dataset.active = 'false';
      });
      button.classList.remove('text-text-secondary');
      button.classList.add('bg-surface-card', 'text-primary', 'font-bold', 'shadow-sm');
      button.dataset.active = 'true';
      page = 1;
      render();
    }));
    ['verificationPathFilter', 'verificationWaveFilter'].forEach(id => document.getElementById(id)?.addEventListener('change', () => { page = 1; render(); }));
    document.getElementById('verificationPagination')?.addEventListener('click', event => {
      const button = event.target.closest('[data-page]');
      if (!button || button.disabled) return;
      page = Number(button.dataset.page);
      render();
    });
    window.addEventListener('ppdb-data-updated', render);
    window.addEventListener('storage', event => { if (event.key === 'ppdb_applicants') render(); });
    window.addEventListener('beforeunload', () => documentUrls.forEach(url => URL.revokeObjectURL(url)));
    return render();
  }

  function initSelection() {
    const body = document.getElementById('selectionApplicantsBody');
    if (!body) return;
    let page = 1;
    const pageSize = 10;

    function filteredApplicants() {
      const pathway = document.getElementById('filterJalur')?.value || 'all';
      const status = document.getElementById('filterStatus')?.value || 'all';
      const wave = document.getElementById('selectionWaveFilter')?.value || 'semua';
      return store.getApplicants().filter(item => item.status === 'terverifikasi' && (wave === 'semua' || item.wave === wave)
        && (pathway === 'all' || item.pathway === pathway)
        && (status === 'all' || item.selectionStatus === status));
    }

    function compareRanking(left, right) {
      const pathwayOrder = { zonasi: 0, prestasi: 1, mutasi: 2 };
      const pathwayDifference = (pathwayOrder[left.pathway] ?? 3) - (pathwayOrder[right.pathway] ?? 3);
      if (pathwayDifference) return pathwayDifference;
      if (left.pathway === 'zonasi') {
        return Number(left.distanceKm || 0) - Number(right.distanceKm || 0)
          || Number(right.score || 0) - Number(left.score || 0);
      }
      return Number(right.score || 0) - Number(left.score || 0)
        || Number(left.distanceKm || 0) - Number(right.distanceKm || 0);
    }

    function render() {
      const applicants = store.getApplicants();
      const settings = store.getSettings();
      const quota = Object.values(settings.quotas || {}).reduce((sum, value) => sum + Number(value || 0), 0);
      const eligibleApplicants = applicants.filter(item => item.status === 'terverifikasi');
      const passed = eligibleApplicants.filter(item => item.selectionStatus === 'lulus').length;
      const scores = eligibleApplicants.map(item => Number(item.score)).filter(Number.isFinite);
      const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
      const lowest = scores.length ? Math.min(...scores) : 0;
      const summary = document.getElementById('selectionSummaryCards');
      if (summary) {
        summary.innerHTML = `<article class="rounded-xl bg-white p-5 shadow-sm"><p class="text-xs font-semibold uppercase text-slate-500">Total Pagu</p><p class="mt-2 text-3xl font-bold">${formatNumber(quota)} <span class="text-sm font-medium text-slate-500">kursi</span></p><p class="mt-2 text-xs text-slate-500">Berdasarkan pengaturan kuota tersimpan</p></article>
          <article class="rounded-xl bg-white p-5 shadow-sm"><p class="text-xs font-semibold uppercase text-slate-500">Pendaftar Berstatus Lulus</p><p class="mt-2 text-3xl font-bold text-green-700">${formatNumber(passed)}</p><p class="mt-2 text-xs text-slate-500">Jumlah menurut hasil tersimpan per pendaftar</p><div class="mt-3 flex h-10 items-end gap-2" id="selectionResultBars" aria-label="Grafik hasil seleksi tersimpan"></div><div class="mt-1 flex justify-between text-[10px] text-slate-500"><span>Belum</span><span>Lulus</span><span>Cadangan</span><span>Tidak lulus</span></div></article>
          <article class="rounded-xl bg-white p-5 shadow-sm"><p class="text-xs font-semibold uppercase text-slate-500">Rata-rata Nilai Pendaftar</p><p class="mt-2 text-3xl font-bold">${average.toFixed(2)}</p><p class="mt-2 text-xs text-slate-500">Nilai terendah: ${lowest.toFixed(2)} · ${scores.length} record bernilai</p></article>`;
      }
      const pathwayCards = document.getElementById('selectionPathCards');
      if (pathwayCards) {
        const total = eligibleApplicants.length;
        pathwayCards.innerHTML = Object.entries(pathwayLabels).map(([pathway, label]) => {
          const records = eligibleApplicants.filter(item => item.pathway === pathway);
          const admitted = records.filter(item => item.selectionStatus === 'lulus').length;
          const percent = total ? Math.round(records.length / total * 100) : 0;
          const admittedPercent = records.length ? Math.round(admitted / records.length * 100) : 0;
          return `<article class="rounded-xl bg-white p-4 shadow-sm"><div class="flex items-center justify-between"><h3 class="font-semibold">${label}</h3><span class="text-xs text-slate-500">${percent}% dari semua pendaftar</span></div><p class="mt-3 text-2xl font-bold">${formatNumber(records.length)} <span class="text-sm font-medium text-slate-500">pendaftar</span></p><div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div class="h-full bg-blue-700" style="width:${percent}%"></div></div><p class="mt-2 text-xs text-slate-600">${formatNumber(admitted)} lulus · ${admittedPercent}% pada jalur ini</p><div class="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div class="h-full bg-green-600" style="width:${admittedPercent}%"></div></div></article>`;
        }).join('');
      }

      const records = filteredApplicants().sort(compareRanking);
      const pages = Math.max(1, Math.ceil(records.length / pageSize));
      page = Math.min(page, pages);
      const start = (page - 1) * pageSize;
      const shown = records.slice(start, start + pageSize);
      body.innerHTML = shown.map((item, index) => {
        const result = item.selectionStatus || 'belum_diseleksi';
        const resultTone = result === 'lulus' ? 'bg-green-100 text-green-800'
          : result === 'cadangan' ? 'bg-amber-100 text-amber-800'
            : result === 'tidak_lulus' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700';
        return `<tr class="border-t border-slate-100 hover:bg-slate-50">
          <td class="px-3 py-3 text-center font-semibold">${start + index + 1}</td>
          <td class="px-3 py-3 font-medium">${escapeHtml(item.registrationNo)}<span class="block text-xs text-slate-500">Gelombang ${escapeHtml(item.wave)}</span></td>
          <td class="px-3 py-3"><span class="font-semibold">${escapeHtml(item.name)}</span><span class="block text-xs text-slate-500">NISN: ${escapeHtml(item.nisn)}</span></td>
          <td class="px-3 py-3 text-sm">${escapeHtml(item.school)}<span class="block text-xs text-slate-500">${escapeHtml(item.city)}</span></td>
          <td class="px-3 py-3 text-right">${Number(item.score || 0).toFixed(2)}</td>
          <td class="px-3 py-3 text-right">${Number(item.distanceKm || 0).toFixed(2)} km</td>
          <td class="px-3 py-3 text-center">${escapeHtml(pathwayLabels[item.pathway] || item.pathway)}</td>
          <td class="px-3 py-3 text-center"><span class="rounded-full px-2 py-1 text-xs ${resultTone}">${escapeHtml(resultLabels[result] || result)}</span></td>
          <td class="px-3 py-3 text-center"><select class="rounded border border-slate-300 p-1 text-xs" data-selection-status="${escapeHtml(item.id)}" aria-label="Hasil seleksi ${escapeHtml(item.name)}"><option value="belum_diseleksi" ${result === 'belum_diseleksi' ? 'selected' : ''}>Belum diseleksi</option><option value="lulus" ${result === 'lulus' ? 'selected' : ''}>Lulus</option><option value="cadangan" ${result === 'cadangan' ? 'selected' : ''}>Cadangan</option><option value="tidak_lulus" ${result === 'tidak_lulus' ? 'selected' : ''}>Tidak lulus</option></select></td>
        </tr>`;
      }).join('') || '<tr><td class="px-4 py-8 text-center text-sm text-slate-500" colspan="9">Tidak ada record sesuai filter.</td></tr>';
      setText('selectionResultCount', `${formatNumber(records.length)} record`);
      setText('selectionPageSummary', records.length ? `Menampilkan ${start + 1}-${start + shown.length} dari ${records.length} pendaftar` : 'Menampilkan 0 pendaftar');
      setText('selectionPaginationSummary', `${page} / ${pages}`);
      setText('selectionPublishCount', `${formatNumber(passed)} siswa`);
      setText('selectionPassRate', `${quota ? (passed / quota * 100).toFixed(1) : '0.0'}% dari pagu`);
      const chart = document.getElementById('selectionResultBars');
      if (chart) {
        const maximum = Math.max(1, ...Object.keys(resultLabels).map(key => eligibleApplicants.filter(item => item.selectionStatus === key).length));
        chart.innerHTML = Object.entries(resultLabels).map(([key, label]) => {
          const count = eligibleApplicants.filter(item => item.selectionStatus === key).length;
          return `<div class="flex min-w-0 flex-1 flex-col items-center justify-end gap-1" title="${label}: ${count}"><div class="w-full rounded-t bg-blue-700" style="height:${Math.max(count ? 8 : 2, count / maximum * 100)}%"></div><span class="text-[10px] text-slate-500">${formatNumber(count)}</span></div>`;
        }).join('');
      }
      const pagination = document.getElementById('selectionPagination');
      if (pagination) pagination.innerHTML = `<button class="rounded px-3 py-2 text-sm disabled:opacity-50" type="button" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>Sebelumnya</button><span class="px-2 text-sm">${page} / ${pages}</span><button class="rounded px-3 py-2 text-sm disabled:opacity-50" type="button" data-page="${page + 1}" ${page === pages ? 'disabled' : ''}>Selanjutnya</button>`;
    }

    body.addEventListener('change', event => {
      const select = event.target.closest('[data-selection-status]');
      if (select) store.updateApplicant(select.dataset.selectionStatus, { selectionStatus: select.value });
    });
    ['filterJalur', 'filterStatus', 'selectionWaveFilter'].forEach(id => document.getElementById(id)?.addEventListener('change', () => { page = 1; render(); }));
    document.getElementById('selectionPagination')?.addEventListener('click', event => {
      const button = event.target.closest('[data-page]');
      if (!button || button.disabled) return;
      page = Number(button.dataset.page);
      render();
    });
    document.getElementById('btnRecalculate')?.addEventListener('click', () => render());
    window.addEventListener('ppdb-data-updated', render);
    window.addEventListener('storage', event => { if (['ppdb_applicants', 'ppdb_settings'].includes(event.key)) render(); });
    render();
  }

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await initVerification();
      initSelection();
    } finally {
      document.documentElement.dataset.ppdbReady = 'true';
    }
  }, { once: true });
})();