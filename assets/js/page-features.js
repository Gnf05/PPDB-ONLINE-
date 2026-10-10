(function() {
  const store = window.PPDBData;
  if (!store) return;

  const pathwayLabels = {
    zonasi: 'Zonasi Reguler',
    prestasi: 'Prestasi Akademik/Non',
    mutasi: 'Mutasi / Pindahan Tugas'
  };
  const statusLabels = {
    terverifikasi: 'Terverifikasi',
    pending: 'Pengajuan',
    belum_lengkap: 'Belum Lengkap',
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
  const getRole = () => {
    try { return JSON.parse(localStorage.getItem('ppdb_logged_in') || 'null')?.role || ''; }
    catch (error) { return ''; }
  };
  const dateText = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const localDateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };
  const statusTone = status => ({
    terverifikasi: 'bg-status-success-bg text-status-success-text',
    pending: 'bg-status-warning-bg text-status-warning-text',
    belum_lengkap: 'bg-status-warning-bg text-status-warning-text',
    ditolak: 'bg-status-danger-bg text-status-danger-text'
  })[status] || 'bg-surface-container text-text-secondary';

  function ensureScript(src, ready) {
    if (ready()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Pustaka ekspor gagal dimuat.'));
      document.head.appendChild(script);
    });
  }

  function csvDownload(rows, filename) {
    const columns = [...new Set(rows.flatMap(row => Object.keys(row || {})))];
    const csv = [columns, ...rows.map(row => columns.map(column => row[column] ?? ''))]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    downloadBlob(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }), filename.replace(/\.xlsx$/, '.csv'));
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function reportRows(applicants) {
    return applicants.map(applicant => ({
      'No. Pendaftaran': applicant.registrationNo,
      NISN: applicant.nisn,
      'Nama Siswa': applicant.name,
      'Asal Sekolah': applicant.school,
      Kota: applicant.city,
      Jalur: pathwayLabels[applicant.pathway] || applicant.pathway,
      'Status Berkas': statusLabels[applicant.status] || applicant.status,
      'Hasil Seleksi': resultLabels[applicant.selectionStatus] || 'Belum Diseleksi',
      'Nilai Rapor': applicant.score,
      Gelombang: applicant.wave,
      'Tanggal Daftar': dateText(applicant.appliedAt)
    }));
  }

  function feederRows(applicants) {
    const schools = new Map();
    applicants.forEach(applicant => {
      const school = applicant.school || 'Tidak diketahui';
      const current = schools.get(school) || { 'Asal Sekolah': school, Kota: applicant.city || '-', Pendaftar: 0, Terverifikasi: 0 };
      current.Pendaftar += 1;
      if (applicant.status === 'terverifikasi') current.Terverifikasi += 1;
      schools.set(school, current);
    });
    return [...schools.values()].sort((left, right) => right.Pendaftar - left.Pendaftar);
  }

  function buildPdf(title, subtitle, summaryRows, detailRows, filename, landscape) {
    return ensureScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', () => Boolean(window.jspdf))
      .then(() => ensureScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.4/jspdf.plugin.autotable.min.js', () => Boolean(window.jspdf?.jsPDF && window.jspdf.jsPDF.API.autoTable)))
      .then(() => {
        const Pdf = window.jspdf.jsPDF;
        const documentPdf = new Pdf({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
        const width = documentPdf.internal.pageSize.getWidth();
        documentPdf.setFillColor(15, 59, 87);
        documentPdf.rect(0, 0, width, 34, 'F');
        documentPdf.setTextColor(255, 255, 255);
        documentPdf.setFont('helvetica', 'bold');
        documentPdf.setFontSize(17);
        documentPdf.text('PPDB ONLINE | LAPORAN', 14, 15);
        documentPdf.setFont('helvetica', 'normal');
        documentPdf.setFontSize(9);
        documentPdf.text(title, 14, 23);
        documentPdf.text(subtitle, 14, 29);
        const summaryColumns = Object.keys(summaryRows[0] || { Ringkasan: '', Jumlah: '' });
        const summaryBody = summaryRows.length ? summaryRows.map(row => summaryColumns.map(key => String(row[key] ?? '-'))) : [['Tidak ada data untuk filter ini', '0']];
        documentPdf.autoTable({
          head: [summaryColumns],
          body: summaryBody,
          startY: 40,
          margin: { left: 14, right: 14 },
          styles: { font: 'helvetica', fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
          headStyles: { fillColor: [31, 91, 126], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [241, 246, 249] },
          didDrawPage: () => {
            const pageHeight = documentPdf.internal.pageSize.getHeight();
            documentPdf.setFontSize(8);
            documentPdf.setTextColor(100, 116, 139);
            documentPdf.text('Dokumen dibuat dari data PPDB yang tersimpan.', 14, pageHeight - 8);
            documentPdf.text(`Halaman ${documentPdf.internal.getNumberOfPages()}`, width - 34, pageHeight - 8);
          }
        });
        const detailColumns = Object.keys(detailRows[0] || { Informasi: '' });
        const detailBody = detailRows.length ? detailRows.map(row => detailColumns.map(key => String(row[key] ?? '-'))) : [['Tidak ada data siswa sesuai filter']];
        const detailStartY = documentPdf.lastAutoTable.finalY + 12;
        documentPdf.setFont('helvetica', 'bold');
        documentPdf.setFontSize(11);
        documentPdf.setTextColor(31, 41, 55);
        documentPdf.text('DATA SISWA SESUAI FILTER', 14, detailStartY - 4);
        documentPdf.autoTable({
          head: [detailColumns],
          body: detailBody,
          startY: detailStartY,
          margin: { left: 14, right: 14 },
          styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
          headStyles: { fillColor: [31, 91, 126], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [241, 246, 249] },
          didDrawPage: () => {
            const pageHeight = documentPdf.internal.pageSize.getHeight();
            documentPdf.setFont('helvetica', 'normal');
            documentPdf.setFontSize(8);
            documentPdf.setTextColor(100, 116, 139);
            documentPdf.text('Pratinjau dibuat dari data PPDB tersimpan.', 14, pageHeight - 8);
            documentPdf.text(`Halaman ${documentPdf.internal.getNumberOfPages()}`, width - 34, pageHeight - 8);
          }
        });
        const pdfBlob = documentPdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = filename;
        downloadLink.hidden = true;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      });
  }

  function exportExcel(summaryRows, detailRows, filename, metadata = {}) {
    return ensureScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', () => Boolean(window.XLSX))
      .then(() => {
        const summaryColumns = Object.keys(summaryRows[0] || { Ringkasan: '', Jumlah: '' });
        const summarySheet = window.XLSX.utils.aoa_to_sheet([
          [metadata.schoolName || 'Laporan PPDB'],
          [metadata.title || 'Rekapitulasi PPDB'],
          [`Periode: ${metadata.period || 'Semua gelombang'}`],
          [`Jenis laporan: ${metadata.reportType || 'Semua'}`],
          [`Operator: ${metadata.operator || 'Operator PPDB'}`],
          [],
          summaryColumns,
          ...(summaryRows.length ? summaryRows.map(row => summaryColumns.map(column => row[column] ?? '')) : [['Tidak ada data untuk filter ini', 0]])
        ]);
        summarySheet['!cols'] = summaryColumns.map(column => ({ wch: Math.min(42, Math.max(18, column.length + 4)) }));
        summarySheet['!merges'] = [0, 1, 2, 3, 4].map(row => ({ s: { r: row, c: 0 }, e: { r: row, c: 1 } }));
        const detailColumns = Object.keys(detailRows[0] || { Informasi: '' });
        const detailSheet = window.XLSX.utils.aoa_to_sheet([
          [`Data Siswa · ${metadata.period || 'Semua gelombang'}`],
          detailColumns,
          ...(detailRows.length ? detailRows.map(row => detailColumns.map(column => row[column] ?? '')) : [['Tidak ada siswa sesuai filter']])
        ]);
        detailSheet['!cols'] = detailColumns.map(column => ({ wch: Math.min(42, Math.max(16, column.length + 4)) }));
        detailSheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(0, detailColumns.length - 1) } }];
        const workbook = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');
        window.XLSX.utils.book_append_sheet(workbook, detailSheet, 'Data Siswa');
        const bytes = window.XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        downloadBlob(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
      });
  }

  function setupApplicantModal() {
    let modal = document.getElementById('applicantModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'applicantModal';
    modal.className = 'fixed inset-0 z-[70] hidden items-center justify-center bg-slate-950/50 p-4';
    modal.innerHTML = `
      <section class="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="applicantModalTitle">
        <header class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div><p class="text-xs font-semibold uppercase text-blue-700">Data Pendaftar</p><h2 class="mt-1 text-lg font-bold text-slate-900" id="applicantModalTitle">Tambah Pendaftar</h2></div>
          <button class="rounded-lg p-2 text-slate-500 hover:bg-slate-100" type="button" data-close-modal aria-label="Tutup"><span class="material-symbols-outlined">close</span></button>
        </header>
        <form class="grid max-h-[75vh] grid-cols-1 gap-4 overflow-y-auto p-6 sm:grid-cols-2" id="applicantForm">
          <input type="hidden" name="id">
          <label class="text-sm font-medium text-slate-700">Nama lengkap<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="name" autocomplete="name" required></label>
          <label class="text-sm font-medium text-slate-700">NISN<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="nisn" inputmode="numeric" pattern="[0-9]{10}" maxlength="10" required></label>
          <label class="text-sm font-medium text-slate-700">NIK<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="nik" inputmode="numeric" pattern="[0-9]{16}" maxlength="16" required></label>
          <label class="text-sm font-medium text-slate-700">Jenis kelamin<select class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="gender" required><option value="">Pilih jenis kelamin</option><option>Laki-laki</option><option>Perempuan</option></select></label>
          <label class="text-sm font-medium text-slate-700">Tempat lahir<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="birthPlace" required></label>
          <label class="text-sm font-medium text-slate-700">Tanggal lahir<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="birthDate" type="date" required></label>
          <label class="text-sm font-medium text-slate-700">Asal sekolah<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="school" required></label>
          <label class="text-sm font-medium text-slate-700">Kota/Kabupaten<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="city" required></label>
          <label class="text-sm font-medium text-slate-700 sm:col-span-2">Alamat sesuai KK<textarea class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="address" rows="2" required></textarea></label>
          <label class="text-sm font-medium text-slate-700">Nama orang tua/wali<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="guardianName" required></label>
          <label class="text-sm font-medium text-slate-700">Telepon orang tua/wali<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="guardianPhone" type="tel" autocomplete="tel" required></label>
          <label class="text-sm font-medium text-slate-700">Jalur pendaftaran<select class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="pathway" required><option value="">Pilih jalur</option><option value="zonasi">Zonasi Reguler</option><option value="prestasi">Prestasi Akademik/Non</option><option value="mutasi">Perpindahan Tugas</option></select></label>
          <label class="text-sm font-medium text-slate-700">Nilai rata-rata rapor<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="score" type="number" min="0" max="100" step="0.01" required></label>
          <label class="text-sm font-medium text-slate-700">Jarak domisili (km)<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="distanceKm" type="number" min="0" step="0.01" value="0" required></label>
          <label class="text-sm font-medium text-slate-700">Kartu Keluarga (PDF/JPG/PNG)<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="document_kk" type="file" accept="application/pdf,image/jpeg,image/png" required><span class="mt-1 block text-xs text-slate-500" data-document-name="kk">Wajib · Maksimal 10 MB</span></label>
          <label class="text-sm font-medium text-slate-700">Ijazah / SKL (PDF/JPG/PNG)<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="document_ijazah" type="file" accept="application/pdf,image/jpeg,image/png" required><span class="mt-1 block text-xs text-slate-500" data-document-name="ijazah">Wajib · Maksimal 10 MB</span></label>
          <label class="text-sm font-medium text-slate-700 sm:col-span-2">Rapor (PDF/JPG/PNG)<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="document_rapor" type="file" accept="application/pdf,image/jpeg,image/png" required><span class="mt-1 block text-xs text-slate-500" data-document-name="rapor">Wajib · Maksimal 10 MB</span></label>
          <p class="hidden text-sm text-red-700 sm:col-span-2" id="applicantFormError" role="alert"></p>
          <footer class="flex justify-end gap-2 border-t border-slate-100 pt-4 sm:col-span-2">
            <button class="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100" type="button" data-close-modal>Batal</button>
            <button class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" type="submit">Simpan Pendaftar</button>
          </footer>
        </form>
      </section>`;
    document.body.appendChild(modal);
    return modal;
  }

  function initAdminApplicants() {
    const body = document.getElementById('applicantsTableBody');
    if (!body) return;
    const isAdmin = getRole() === 'admin';
    const modal = setupApplicantModal();
    const form = document.getElementById('applicantForm');
    let currentPage = 1;
    const pageSize = 5;

    function getFiltered() {
      const query = document.getElementById('searchInput').value.trim().toLowerCase();
      const pathway = document.getElementById('jalurFilter').value;
      const status = document.getElementById('statusFilter').value;
      const wave = document.getElementById('gelombangFilter').value;
      return store.getApplicants().filter(applicant => {
        const matchesQuery = !query || [applicant.registrationNo, applicant.name, applicant.nisn].some(value => String(value || '').toLowerCase().includes(query));
        return matchesQuery && (!pathway || applicant.pathway === pathway) && (!status || applicant.status === status) && (wave === 'semua' || applicant.wave === wave);
      });
    }

    function render() {
      const all = store.getApplicants();
      const filtered = getFiltered();
      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      currentPage = Math.min(currentPage, totalPages);
      const startIndex = (currentPage - 1) * pageSize;
      const pageItems = filtered.slice(startIndex, startIndex + pageSize);
      setText('adminTotalCount', all.length);
      setText('adminVerifiedCount', all.filter(item => item.status === 'terverifikasi').length);
      setText('adminPendingCount', all.filter(item => item.status === 'pending').length);
      setText('adminNeedsRevisionCount', all.filter(item => ['belum_lengkap', 'ditolak'].includes(item.status)).length);
      const quotaSettings = store.getSettings().quotas;
      const totalQuota = Object.values(quotaSettings).reduce((sum, value) => sum + Number(value || 0), 0);
      const passedApplicants = all.filter(item => item.selectionStatus === 'lulus').length;
      const passedPercent = totalQuota ? Math.round(passedApplicants / totalQuota * 100) : 0;
      setText('applicantQuotaTarget', totalQuota.toLocaleString('id-ID'));
      setText('applicantQuotaPassed', `${passedApplicants} / ${totalQuota.toLocaleString('id-ID')} (${passedPercent}%)`);
      setText('applicantQuotaRemaining', `${Math.max(0, totalQuota - passedApplicants).toLocaleString('id-ID')} Kursi`);
      const quotaPathBars = document.getElementById('applicantQuotaPathBars');
      const quotaPathLegend = document.getElementById('applicantQuotaPathLegend');
      const quotaPaths = [
        ['zonasi', 'Zonasi', 'bg-primary'],
        ['prestasi', 'Prestasi', 'bg-secondary'],
        ['mutasi', 'Mutasi', 'bg-status-danger']
      ];
      if (quotaPathBars) {
        quotaPathBars.innerHTML = quotaPaths.map(([pathway, label, tone]) => {
          const count = all.filter(item => item.pathway === pathway).length;
          const share = all.length ? count / all.length * 100 : 0;
          return `<div class="h-full ${tone}" style="width:${share}%" title="${label}: ${count} pendaftar"></div>`;
        }).join('');
      }
      if (quotaPathLegend) {
        quotaPathLegend.innerHTML = quotaPaths.map(([pathway, label, tone]) => {
          const count = all.filter(item => item.pathway === pathway).length;
          return `<span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full ${tone}"></span>${label} (${count})</span>`;
        }).join('');
      }
      setText('applicantPageSummary', filtered.length ? `${startIndex + 1} - ${startIndex + pageItems.length} dari ${filtered.length}` : '0 dari 0');
      const activeWave = document.getElementById('activeWaveFilter');
      if (activeWave) activeWave.innerHTML = `Gelombang ${document.getElementById('gelombangFilter').value === 'semua' ? 'Semua' : document.getElementById('gelombangFilter').value}<span class="material-symbols-outlined text-[12px]">close</span>`;
      setText('filteredApplicantCount', `Total Filter: ${filtered.length} Calon Siswa`);

      body.innerHTML = pageItems.map(applicant => `
        <tr class="border-t border-slate-100 hover:bg-slate-50/70">
          <td class="px-space-md py-3.5"><input class="row-checkbox h-4 w-4 cursor-pointer accent-blue-700" type="checkbox" value="${escapeHtml(applicant.id)}" aria-label="Pilih ${escapeHtml(applicant.name)}"></td>
          <td class="px-space-md py-3.5"><span class="font-semibold text-blue-800">${escapeHtml(applicant.registrationNo)}</span><span class="block text-xs text-slate-500">Gelombang ${escapeHtml(applicant.wave)}</span></td>
          <td class="px-space-md py-3.5"><div class="font-semibold text-slate-900">${escapeHtml(applicant.name)}</div><div class="text-xs text-slate-500">${escapeHtml(applicant.nisn)} · ${escapeHtml(applicant.gender)}</div></td>
          <td class="px-space-md py-3.5"><span class="text-slate-800">${escapeHtml(applicant.school)}</span><span class="block text-xs text-slate-500">${escapeHtml(applicant.city)}</span></td>
          <td class="px-space-md py-3.5"><span class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">${escapeHtml(pathwayLabels[applicant.pathway] || applicant.pathway)}</span></td>
          <td class="px-space-md py-3.5 text-right"><span class="font-semibold">${Number(applicant.score || 0).toFixed(2)}</span><span class="block text-xs text-slate-500">${Number(applicant.distanceKm || 0).toFixed(2)} km</span></td>
          <td class="px-space-md py-3.5"><span class="rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(applicant.status)}">${escapeHtml(statusLabels[applicant.status] || applicant.status)}</span><span class="mt-1 block text-xs text-slate-500">Seleksi: ${escapeHtml(resultLabels[applicant.selectionStatus] || resultLabels.belum_diseleksi)}</span></td>
          <td class="whitespace-nowrap px-space-md py-3.5 text-xs text-slate-500">${escapeHtml(dateText(applicant.appliedAt))}</td>
          ${isAdmin ? `<td class="px-space-md py-3.5 text-center"><div class="inline-flex gap-1"><button class="rounded p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700" type="button" title="Edit Pendaftar" data-edit-applicant="${escapeHtml(applicant.id)}"><span class="material-symbols-outlined text-[18px]">edit</span></button><button class="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700" type="button" title="Hapus Pendaftar" data-delete-applicant="${escapeHtml(applicant.id)}"><span class="material-symbols-outlined text-[18px]">delete</span></button></div></td>` : ''}
        </tr>`).join('') || `<tr><td colspan="${isAdmin ? 9 : 8}" class="px-4 py-10 text-center text-sm text-slate-500">Tidak ada pendaftar yang sesuai filter.</td></tr>`;

      const pagination = document.getElementById('applicantPagination');
      pagination.innerHTML = `<button class="rounded-lg px-3 py-2 text-sm ${currentPage === 1 ? 'cursor-not-allowed text-slate-400' : 'text-slate-700 hover:bg-slate-100'}" type="button" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>Sebelumnya</button><span class="px-2 text-sm font-semibold text-slate-700">${currentPage} / ${totalPages}</span><button class="rounded-lg px-3 py-2 text-sm ${currentPage === totalPages ? 'cursor-not-allowed text-slate-400' : 'text-slate-700 hover:bg-slate-100'}" type="button" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>Selanjutnya</button>`;
      const checkAll = document.getElementById('checkAll');
      if (checkAll) checkAll.checked = false;
    }

    function openModal(applicant) {
      form.reset();
      form.elements.id.value = applicant?.id || '';
      document.getElementById('applicantModalTitle').textContent = applicant ? 'Edit Data Pendaftar' : 'Tambah Pendaftar';
      if (applicant) Object.keys(applicant).forEach(key => { if (form.elements[key]) form.elements[key].value = applicant[key] ?? ''; });
      ['kk', 'ijazah', 'rapor'].forEach(type => {
        const input = form.elements[`document_${type}`];
        const name = form.querySelector(`[data-document-name="${type}"]`);
        input.required = !applicant;
        if (applicant) {
          store.getApplicantDocuments(applicant.id).then(documents => {
            const document = documents.find(item => item.type === type);
            name.textContent = document ? `Tersimpan: ${document.name} · Pilih file baru untuk mengganti` : 'Belum diunggah';
          }).catch(() => { name.textContent = 'Tidak dapat membaca lampiran'; });
        } else {
          name.textContent = 'Wajib · Maksimal 10 MB';
        }
      });
      document.getElementById('applicantFormError').classList.add('hidden');
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      form.elements.name.focus();
    }

    function closeModal() {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }

    document.getElementById('addApplicantBtn')?.addEventListener('click', () => openModal(null));
    modal.querySelectorAll('[data-close-modal]').forEach(button => button.addEventListener('click', closeModal));
    modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      const existingId = values.id;
      const duplicate = store.getApplicants().some(item => item.nisn === values.nisn && item.id !== existingId);
      const error = document.getElementById('applicantFormError');
      if (duplicate) {
        error.textContent = 'NISN sudah digunakan oleh pendaftar lain.';
        error.classList.remove('hidden');
        return;
      }
      const changes = {
        name: values.name.trim(), nisn: values.nisn.trim(), nik: values.nik.trim(), gender: values.gender,
        birthPlace: values.birthPlace.trim(), birthDate: values.birthDate,
        school: values.school.trim(), city: values.city.trim(), address: values.address.trim(),
        guardianName: values.guardianName.trim(), guardianPhone: values.guardianPhone.trim(), pathway: values.pathway,
        score: Number(values.score) || 0, distanceKm: Number(values.distanceKm) || 0
      };
      let applicant;
      try {
        if (existingId) applicant = store.updateApplicant(existingId, changes);
        else applicant = store.addApplicant(changes);
      } catch (saveError) {
        error.textContent = saveError.message;
        error.classList.remove('hidden');
        return;
      }
      const documentTypes = ['kk', 'ijazah', 'rapor'];
      try {
        await Promise.all(documentTypes.map(type => {
          const file = form.elements[`document_${type}`].files[0];
          return file ? store.saveApplicantDocument(applicant.id, type, file) : Promise.resolve();
        }));
      } catch (uploadError) {
        form.elements.id.value = applicant.id;
        error.textContent = `Data pendaftar tersimpan dengan status Pengajuan, tetapi lampiran gagal disimpan: ${uploadError.message}`;
        error.classList.remove('hidden');
        return;
      }
      closeModal();
      render();
    });

    body.addEventListener('click', event => {
      const editButton = event.target.closest('[data-edit-applicant]');
      const deleteButton = event.target.closest('[data-delete-applicant]');
      if (editButton) openModal(store.getApplicants().find(item => item.id === editButton.dataset.editApplicant));
      if (deleteButton && window.confirm('Hapus data pendaftar ini?')) {
        store.deleteApplicant(deleteButton.dataset.deleteApplicant);
        render();
      }
    });
    document.getElementById('applicantPagination').addEventListener('click', event => {
      const button = event.target.closest('[data-page]');
      if (!button || button.disabled) return;
      currentPage = Number(button.dataset.page);
      render();
    });
    ['searchInput', 'jalurFilter', 'statusFilter', 'gelombangFilter'].forEach(id => {
      const element = document.getElementById(id);
      element.addEventListener(id === 'searchInput' ? 'input' : 'change', () => { currentPage = 1; render(); });
    });
    document.getElementById('checkAll').addEventListener('change', event => {
      body.querySelectorAll('.row-checkbox').forEach(checkbox => { checkbox.checked = event.target.checked; });
    });
    document.getElementById('applyBulkAction').addEventListener('click', async () => {
      const action = document.getElementById('bulkAction').value;
      const selected = [...body.querySelectorAll('.row-checkbox:checked')].map(input => input.value);
      if (!selected.length) return window.alert('Pilih minimal satu pendaftar terlebih dahulu.');
      if (action === 'verify') {
        const incomplete = [];
        for (const id of selected) {
          const documents = await store.getApplicantDocuments(id).catch(() => []);
          if (!['kk', 'ijazah', 'rapor'].every(type => documents.some(document => document.type === type))) {
            incomplete.push(store.getApplicants().find(item => item.id === id)?.name || id);
          }
        }
        if (incomplete.length) return window.alert(`Lengkapi KK, ijazah/SKL, dan rapor sebelum verifikasi: ${incomplete.join(', ')}`);
        selected.forEach(id => store.updateApplicant(id, { status: 'terverifikasi' }));
      } else if (action === 'reject') {
        selected.forEach(id => store.updateApplicant(id, { status: 'ditolak' }));
      } else if (action === 'print') {
        window.print();
      } else if (action === 'export') {
        csvDownload(reportRows(store.getApplicants().filter(item => selected.includes(item.id))), 'pendaftar-terpilih.xlsx');
      } else {
        return window.alert('Pilih aksi massal terlebih dahulu.');
      }
      render();
    });
    window.addEventListener('ppdb-data-updated', render);
    window.addEventListener('storage', event => { if (event.key === 'ppdb_applicants') render(); });
    const editId = new URLSearchParams(window.location.search).get('edit');
    render();
    if (editId) openModal(store.getApplicants().find(item => item.id === editId));
  }

  function initDashboard() {
    const chart = document.getElementById('registrationTrendChart');
    const tableBody = document.getElementById('dashboardApplicantsBody');
    if (!chart || !tableBody) return;
    const isAdmin = getRole() === 'admin';
    let currentPage = 1;
    const pageSize = 6;

    function render() {
      const applicants = store.getApplicants();
      const verified = applicants.filter(item => item.status === 'terverifikasi').length;
      const pending = applicants.filter(item => item.status === 'pending').length;
      const needsRevision = applicants.filter(item => ['belum_lengkap', 'ditolak'].includes(item.status)).length;
      const passed = applicants.filter(item => item.selectionStatus === 'lulus').length;
      const quotaSettings = store.getSettings();
      const activeWave = String(quotaSettings.activeWave || '1');
      const activeQuota = Number(quotaSettings.quotas[activeWave] || 0);
      const activeVerified = applicants.filter(item => item.wave === activeWave && item.status === 'terverifikasi').length;
      const activePercent = activeQuota ? Math.round(activeVerified / activeQuota * 100) : 0;
      setText('dashboardTotalCount', applicants.length);
      setText('dashboardVerifiedCount', verified);
      setText('dashboardPassedCount', passed);
      setText('dashboardNeedsRevisionCount', needsRevision);
      setText('dashboardPendingCount', pending);
      setText('dashboardNeedsRevisionBadge', needsRevision);
      setText('dashboardVerifiedRatio', `${applicants.length ? Math.round(verified / applicants.length * 100) : 0}%`);
      setText('dashboardPassedRatio', `${applicants.length ? Math.round(passed / applicants.length * 100) : 0}%`);
      setText('dashboardTotalQuota', `Pagu: ${Object.values(quotaSettings.quotas).reduce((total, quota) => total + Number(quota || 0), 0).toLocaleString('id-ID')} siswa`);
      setText('dashboardWaveCapacityPercent', `Kapasitas Terisi (${activePercent}%)`);
      setText('dashboardWaveCapacityCount', `${activeVerified} / ${activeQuota} Kuota`);
      setText('dashboardWaveRemaining', `Sisa: ${Math.max(0, activeQuota - activeVerified)} kursi`);
      setText('dashboardWave2Quota', `${Number(quotaSettings.quotas['2'] || 0).toLocaleString('id-ID')} kursi`);
      const capacityProgress = document.getElementById('dashboardWaveCapacityProgress');
      if (capacityProgress) capacityProgress.style.width = `${Math.min(activePercent, 100)}%`;

      const distribution = document.getElementById('dashboardPathDistribution');
      if (distribution) {
        const paths = [
          ['zonasi', 'Zonasi Reguler', 'bg-primary'],
          ['prestasi', 'Prestasi Akademik/Non', 'bg-secondary-container'],
          ['mutasi', 'Perpindahan Tugas Orang Tua', 'bg-outline']
        ];
        distribution.innerHTML = paths.map(([key, label, tone]) => {
          const count = applicants.filter(item => item.pathway === key).length;
          const percent = applicants.length ? Math.round(count / applicants.length * 100) : 0;
          return `<div><div class="mb-1 flex justify-between text-xs"><span class="font-medium">${label}</span><span class="font-bold">${percent}% (${count} pendaftar)</span></div><div class="h-1.5 overflow-hidden rounded-full bg-slate-200"><div class="h-full ${tone}" style="width:${percent}%"></div></div></div>`;
        }).join('');
      }

      const dates = applicants.map(item => new Date(item.appliedAt)).filter(date => !Number.isNaN(date.getTime()));
      const lastDate = dates.length ? new Date(Math.max(...dates.map(date => date.getTime()))) : new Date();
      lastDate.setHours(0, 0, 0, 0);
      const daily = [];
      for (let offset = 9; offset >= 0; offset -= 1) {
        const date = new Date(lastDate);
        date.setDate(lastDate.getDate() - offset);
        const key = localDateKey(date);
        daily.push({ key, date, count: applicants.filter(item => String(item.appliedAt).slice(0, 10) === key).length });
      }
      const maxDaily = Math.max(1, ...daily.map(item => item.count));
      chart.innerHTML = daily.map(item => `<div class="group relative flex h-full flex-1 flex-col items-center justify-end"><span class="pointer-events-none absolute -top-7 rounded bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 group-hover:opacity-100">${item.count} pendaftar</span><div class="w-full max-w-[32px] rounded-t bg-gradient-to-t from-blue-800 to-cyan-500" style="height:${Math.max(item.count ? 10 : 2, item.count / maxDaily * 92)}%" title="${item.count} pendaftar"></div><span class="absolute -bottom-5 whitespace-nowrap text-[10px] text-slate-500">${item.date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span></div>`).join('');
      const dailyTotal = daily.reduce((sum, item) => sum + item.count, 0);
      setText('dashboardTrendAverage', `Rerata: ${(dailyTotal / 10).toFixed(1)} siswa/hari`);
      setText('dashboardQueueCount', pending);

      const query = (document.getElementById('kepsekSearch')?.value || '').trim().toLowerCase();
      const pathway = document.getElementById('kepsekPathFilter')?.value || '';
      const filtered = applicants.filter(item => {
        const matchesQuery = !query || [item.name, item.nisn, item.registrationNo].some(value => String(value || '').toLowerCase().includes(query));
        return matchesQuery && (!pathway || item.pathway === pathway);
      }).sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
      const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
      currentPage = Math.min(currentPage, pages);
      const start = (currentPage - 1) * pageSize;
      const records = filtered.slice(start, start + pageSize);
      const actionHeader = [...document.querySelectorAll('thead th')].find(header => header.textContent.includes('Aksi Cepat'));
      if (actionHeader) actionHeader.style.display = isAdmin ? '' : 'none';
      tableBody.innerHTML = records.map(item => `
        <tr class="border-t border-slate-100 hover:bg-slate-50/70">
          <td class="whitespace-nowrap px-4 py-3.5 font-mono text-xs font-semibold text-blue-800">${escapeHtml(item.registrationNo)}</td>
          <td class="px-4 py-3.5"><span class="font-semibold text-slate-900">${escapeHtml(item.name)}</span><span class="block text-xs text-slate-500">NISN: ${escapeHtml(item.nisn)}</span></td>
          <td class="px-4 py-3.5 text-sm text-slate-600">${escapeHtml(item.school)}</td>
          <td class="px-4 py-3.5"><span class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800">${escapeHtml(pathwayLabels[item.pathway] || item.pathway)}</span></td>
          <td class="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500">${escapeHtml(dateText(item.appliedAt))}</td>
          <td class="px-4 py-3.5"><span class="rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(item.status)}">${escapeHtml(statusLabels[item.status] || item.status)}</span></td>
          ${isAdmin ? `<td class="px-4 py-3.5 text-center"><button class="rounded p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700" title="Edit di Data Pendaftar" data-dashboard-edit="${escapeHtml(item.id)}"><span class="material-symbols-outlined">edit</span></button><button class="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700" title="Hapus Pendaftar" data-dashboard-delete="${escapeHtml(item.id)}"><span class="material-symbols-outlined">delete</span></button></td>` : ''}
        </tr>`).join('') || `<tr><td colspan="${isAdmin ? 7 : 6}" class="px-4 py-10 text-center text-sm text-slate-500">Tidak ada pendaftar yang cocok.</td></tr>`;
      setText('dashboardTableSummary', filtered.length ? `${start + 1} - ${start + records.length} dari ${filtered.length} pendaftar` : '0 pendaftar');
      const pagination = document.getElementById('dashboardPagination');
      if (pagination) pagination.innerHTML = `<button class="rounded-lg px-3 py-2 text-sm text-slate-700 disabled:text-slate-400" data-dashboard-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>Sebelumnya</button><span class="px-2 text-sm font-semibold">${currentPage} / ${pages}</span><button class="rounded-lg px-3 py-2 text-sm text-slate-700 disabled:text-slate-400" data-dashboard-page="${currentPage + 1}" ${currentPage === pages ? 'disabled' : ''}>Selanjutnya</button>`;

    }

    document.getElementById('kepsekSearch')?.addEventListener('input', () => { currentPage = 1; render(); });
    document.getElementById('kepsekPathFilter')?.addEventListener('change', () => { currentPage = 1; render(); });
    document.getElementById('dashboardPagination')?.addEventListener('click', event => {
      const button = event.target.closest('[data-dashboard-page]');
      if (!button || button.disabled) return;
      currentPage = Number(button.dataset.dashboardPage);
      render();
    });
    tableBody.addEventListener('click', event => {
      const edit = event.target.closest('[data-dashboard-edit]');
      const remove = event.target.closest('[data-dashboard-delete]');
      if (edit) window.location.assign(`datapendaftar.html?edit=${encodeURIComponent(edit.dataset.dashboardEdit)}`);
      if (remove && window.confirm('Hapus data pendaftar ini?')) {
        store.deleteApplicant(remove.dataset.dashboardDelete);
        render();
      }
    });
    document.getElementById('downloadTrendPdf')?.addEventListener('click', event => {
      const button = event.currentTarget;
      button.disabled = true;
      const applicants = store.getApplicants();
      const dates = applicants.map(item => new Date(item.appliedAt)).filter(date => !Number.isNaN(date.getTime()));
      const lastDate = dates.length ? new Date(Math.max(...dates.map(date => date.getTime()))) : new Date();
      lastDate.setHours(0, 0, 0, 0);
      const trendRows = [];
      for (let offset = 9; offset >= 0; offset -= 1) {
        const date = new Date(lastDate);
        date.setDate(lastDate.getDate() - offset);
        const key = localDateKey(date);
        const dayApplicants = applicants.filter(item => String(item.appliedAt).slice(0, 10) === key);
        trendRows.push({
          Tanggal: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
          'Total Pendaftar': dayApplicants.length,
          Zonasi: dayApplicants.filter(item => item.pathway === 'zonasi').length,
          Prestasi: dayApplicants.filter(item => item.pathway === 'prestasi').length,
          Mutasi: dayApplicants.filter(item => item.pathway === 'mutasi').length
        });
      }
      buildPdf('Tren Pendaftaran Harian', `Berdasarkan ${applicants.length} data tersimpan · Rata-rata ${(applicants.length / 10).toFixed(1)} pendaftar/hari`, [{ Ringkasan: 'Total pendaftar', Jumlah: applicants.length }, { Ringkasan: 'Rata-rata harian', Jumlah: (applicants.length / 10).toFixed(1) }], trendRows, `tren-ppdb-${new Date().toISOString().slice(0, 10)}.pdf`, true)
        .catch(error => window.alert(error.message))
        .finally(() => { button.disabled = false; });
    });
    window.addEventListener('ppdb-data-updated', render);
    window.addEventListener('ppdb-notifications-updated', render);
    window.addEventListener('storage', event => { if ([ 'ppdb_applicants', 'ppdb_admin_activity' ].includes(event.key)) render(); });
    render();
  }

  function initReport() {
    const previewButton = document.getElementById('btnPreviewFilter');
    const tableBody = document.getElementById('reportApplicantsBody');
    if (!previewButton || !tableBody) return;
    let reportApplicants = [];
    let reportSummaryRows = [];
    let reportOutputRows = [];
    let reportTitle = '';
    let reportDisplayHeading = '';
    const templateModal = document.createElement('div');
    templateModal.id = 'reportTemplateModal';
    templateModal.className = 'fixed inset-0 z-[75] hidden items-center justify-center bg-slate-950/50 p-4';
    templateModal.innerHTML = `<section class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"><div class="mb-5 flex items-center justify-between"><h2 class="text-lg font-bold">Template Laporan Sekolah</h2><button class="rounded p-2 hover:bg-slate-100" type="button" data-close-report-template aria-label="Tutup">×</button></div><form class="space-y-4" id="reportTemplateForm"><label class="block text-sm font-medium">Judul tambahan<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="heading" maxlength="120" placeholder="Kosongkan untuk mengikuti jenis laporan"></label><label class="block text-sm font-medium">Nama sekolah<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="schoolName" maxlength="120" required></label><label class="block text-sm font-medium">Alamat sekolah<textarea class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="schoolAddress" rows="2" maxlength="240"></textarea></label><p class="text-xs text-slate-500">Nama operator dan kepala sekolah mengikuti profil akun tersimpan.</p><p class="hidden rounded-lg px-3 py-2 text-sm" id="reportTemplateMessage" role="status"></p><div class="flex justify-end gap-2"><button class="rounded-lg px-4 py-2 text-sm hover:bg-slate-100" type="button" data-close-report-template>Batal</button><button class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white" type="submit">Simpan Template</button></div></form></section>`;
    document.body.appendChild(templateModal);
    const reportTemplateForm = document.getElementById('reportTemplateForm');
    const closeTemplate = () => { templateModal.classList.add('hidden'); templateModal.classList.remove('flex'); };
    document.querySelectorAll('[data-close-report-template]').forEach(button => button.addEventListener('click', closeTemplate));
    templateModal.addEventListener('click', event => { if (event.target === templateModal) closeTemplate(); });
    document.getElementById('btnEditReportTemplate')?.addEventListener('click', () => {
      const settings = store.getSettings().report;
      reportTemplateForm.elements.heading.value = settings.heading || '';
      reportTemplateForm.elements.schoolName.value = settings.schoolName || '';
      reportTemplateForm.elements.schoolAddress.value = settings.schoolAddress || '';
      document.getElementById('reportTemplateMessage').className = 'hidden rounded-lg px-3 py-2 text-sm';
      templateModal.classList.remove('hidden');
      templateModal.classList.add('flex');
    });
    reportTemplateForm.addEventListener('submit', event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(reportTemplateForm).entries());
      store.setReportSettings({ heading: values.heading.trim(), schoolName: values.schoolName.trim(), schoolAddress: values.schoolAddress.trim() });
      document.getElementById('reportTemplateMessage').textContent = 'Template laporan tersimpan.';
      document.getElementById('reportTemplateMessage').className = 'rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700';
      closeTemplate();
    });

    function filteredApplicants() {
      const wave = document.getElementById('reportWaveFilter').value;
      const type = document.getElementById('reportTypeSelector').value;
      return store.getApplicants().filter(item => {
        if (wave !== 'semua' && item.wave !== wave) return false;
        return true;
      });
    }

    async function renderReport() {
      reportApplicants = filteredApplicants();
      const type = document.getElementById('reportTypeSelector').value;
      reportTitle = {
        kelulusan: 'Rekapitulasi Kelulusan & Daya Tampung',
        feeder: 'Statistik Distribusi Asal Sekolah',
        berkas: 'Status Berkas & Kelengkapan Dokumen'
      }[type] || 'Rekapitulasi PPDB';
      const template = store.getSettings().report;
      reportDisplayHeading = template.heading || reportTitle;
      const verified = reportApplicants.filter(item => item.status === 'terverifikasi').length;
      const passed = reportApplicants.filter(item => item.selectionStatus === 'lulus').length;
      const average = reportApplicants.length ? reportApplicants.reduce((sum, item) => sum + (Number(item.score) || 0), 0) / reportApplicants.length : 0;
      const schools = new Set(reportApplicants.map(item => item.school)).size;
      const settings = store.getSettings();
      const selectedWave = document.getElementById('reportWaveFilter').value;
      const selectedQuota = selectedWave === 'semua'
        ? Object.values(settings.quotas).reduce((sum, value) => sum + Number(value || 0), 0)
        : Number(settings.quotas[selectedWave] || 0);
      const pending = reportApplicants.filter(item => item.status === 'pending').length;
      const revisions = reportApplicants.filter(item => ['belum_lengkap', 'ditolak'].includes(item.status)).length;
      setText('reportMetricTotal', reportApplicants.length);
      setText('reportMetricPassed', passed);
      setText('reportMetricPassedRate', `${reportApplicants.length ? Math.round(passed / reportApplicants.length * 100) : 0}% dari pendaftar`);
      setText('reportMetricPassedBadge', `${reportApplicants.length ? Math.round(passed / reportApplicants.length * 100) : 0}% dinyatakan lulus`);
      setText('reportMetricAverage', average.toFixed(2));
      setText('reportMetricAverageLabel', 'Rata-rata berdasarkan hasil filter');
      setText('reportMetricSchools', schools);
      setText('reportMetricSchoolDetail', `${verified} pendaftar terverifikasi`);
      setText('reportPreviewHeading', reportDisplayHeading);
      setText('reportPreviewCount', `${reportApplicants.length} data sesuai parameter`);
      setText('reportStudentCount', `${reportApplicants.length} siswa`);
      setText('reportPreviewWave', document.getElementById('reportWaveFilter').selectedOptions[0].textContent);
      setText('reportPreviewFormat', document.getElementById('reportFormatFilter').value.toUpperCase());
      setText('reportSchoolName', template.schoolName || 'Nama Sekolah');
      setText('reportSchoolAddress', template.schoolAddress || '');
      setText('reportGeneratedAt', new Date().toLocaleString('id-ID'));
      setText('reportIssueDate', new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }));
      setText('reportDocumentNumber', `Pratinjau ${new Date().toISOString().slice(0, 10)}`);
      let session = null;
      try { session = JSON.parse(localStorage.getItem('ppdb_logged_in') || 'null'); } catch (error) { session = null; }
      const operator = session?.displayName || 'Operator PPDB';
      setText('reportOperatorName', operator);
      setText('reportSignatureOperator', operator);
      setText('reportHeadmasterName', window.PPDBAuth?.getUser('kepsek')?.displayName || 'Kepala Sekolah');

      reportSummaryRows = [
        { Ringkasan: 'Total pendaftar', Jumlah: reportApplicants.length },
        { Ringkasan: 'Terverifikasi', Jumlah: verified },
        { Ringkasan: 'Pengajuan menunggu', Jumlah: pending },
        { Ringkasan: 'Perlu revisi / ditolak', Jumlah: revisions },
        { Ringkasan: 'Lulus seleksi', Jumlah: passed },
        { Ringkasan: 'Rata-rata nilai rapor', Jumlah: average.toFixed(2) },
        { Ringkasan: 'Asal sekolah', Jumlah: schools },
        { Ringkasan: 'Kuota periode terpilih', Jumlah: selectedQuota }
      ];
      if (type === 'kelulusan') {
        [['zonasi', 'Zonasi'], ['prestasi', 'Prestasi'], ['mutasi', 'Perpindahan Tugas']].forEach(([key, label]) => {
          const pathApplicants = reportApplicants.filter(item => item.pathway === key);
          reportSummaryRows.push({ Ringkasan: `${label} · pendaftar`, Jumlah: pathApplicants.length });
          reportSummaryRows.push({ Ringkasan: `${label} · lulus`, Jumlah: pathApplicants.filter(item => item.selectionStatus === 'lulus').length });
        });
      } else if (type === 'feeder') {
        feederRows(reportApplicants).slice(0, 5).forEach((feeder, index) => {
          reportSummaryRows.push({ Ringkasan: `Asal sekolah #${index + 1}: ${feeder['Asal Sekolah']}`, Jumlah: feeder.Pendaftar });
        });
      }

      const feederList = document.getElementById('reportFeederList');
      if (feederList) {
        const feeders = feederRows(reportApplicants).slice(0, 5);
        const maximum = Math.max(1, ...feeders.map(item => item.Pendaftar));
        feederList.innerHTML = feeders.map((feeder, index) => {
          const percent = reportApplicants.length ? (feeder.Pendaftar / reportApplicants.length * 100).toFixed(1) : '0.0';
          return `<div class="flex flex-col gap-1"><div class="flex items-center justify-between text-sm"><div class="flex min-w-0 items-center gap-2"><span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">${index + 1}</span><span class="truncate font-medium">${escapeHtml(feeder['Asal Sekolah'])}</span></div><div class="ml-2 flex shrink-0 items-center gap-2"><span class="font-bold">${feeder.Pendaftar}</span><span class="text-xs text-slate-500">(${percent}%)</span></div></div><div class="h-2 w-full overflow-hidden rounded-full bg-slate-200"><div class="h-full bg-blue-700" style="width:${feeder.Pendaftar / maximum * 100}%"></div></div></div>`;
        }).join('') || '<p class="py-6 text-center text-sm text-slate-500">Belum ada data asal sekolah.</p>';
      }

      const passedApplicants = reportApplicants.filter(item => item.selectionStatus === 'lulus');
      const donut = document.getElementById('reportPassedDonut');
      const legend = document.getElementById('reportPathLegend');
      const donutTotal = document.getElementById('reportPassedDonutTotal');
      if (donut && legend) {
        const paths = [
          ['zonasi', 'Zonasi', '#004ac6'],
          ['prestasi', 'Prestasi', '#2563eb'],
          ['mutasi', 'Mutasi', '#f59e0b']
        ];
        let offset = 0;
        const counts = paths.map(([key, label, color]) => ({
          key, label, color, count: passedApplicants.filter(item => item.pathway === key).length
        }));
        donut.innerHTML = '<circle cx="18" cy="18" fill="none" r="15.9155" stroke="#E2E8F0" stroke-width="3.8"></circle>' + counts.map(item => {
          const percent = passedApplicants.length ? item.count / passedApplicants.length * 100 : 0;
          const circle = `<circle cx="18" cy="18" fill="none" r="15.9155" stroke="${item.color}" stroke-dasharray="${percent} ${100 - percent}" stroke-dashoffset="-${offset}" stroke-width="4.2"></circle>`;
          offset += percent;
          return circle;
        }).join('');
        legend.innerHTML = counts.map(item => {
          const percent = passedApplicants.length ? Math.round(item.count / passedApplicants.length * 100) : 0;
          return `<div class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm" style="background:${item.color}"></span><span>${item.label} (${percent}%, ${item.count})</span></div>`;
        }).join('');
      }
      if (donutTotal) donutTotal.textContent = passedApplicants.length.toLocaleString('id-ID');
      setText('reportPassedDonutSubtitle', `${passedApplicants.length} pendaftar dengan hasil lulus`);
      const activityBody = document.getElementById('reportActivityBody');
      if (activityBody) {
        const activities = store.getActivity().slice(0, 10);
        activityBody.innerHTML = activities.length ? activities.map(item => `<tr class="border-t border-slate-100"><td class="px-4 py-3 text-xs text-slate-500">${escapeHtml(new Date(item.timestamp).toLocaleString('id-ID'))}</td><td class="px-4 py-3 font-medium">${escapeHtml(item.action)}</td><td class="px-4 py-3">${escapeHtml(item.applicantName || item.registrationNo || 'Data PPDB')}</td><td class="px-4 py-3 text-sm">${escapeHtml(item.actor || 'Tidak tercatat')}${item.role ? ` (${escapeHtml(item.role)})` : ''}</td></tr>`).join('') : '<tr><td class="px-4 py-6 text-center text-sm text-slate-500" colspan="4">Belum ada aktivitas tersimpan.</td></tr>';
      }

      reportOutputRows = reportRows(reportApplicants);
      if (type === 'berkas') {
        reportOutputRows = await Promise.all(reportApplicants.map(async applicant => {
          let documents = [];
          try { documents = await store.getApplicantDocuments(applicant.id); } catch (error) { documents = []; }
          return {
            ...reportRows([applicant])[0],
            'Dokumen Terunggah': documents.map(item => item.type).join(', ') || 'Belum ada',
            'Kelengkapan Wajib': ['kk', 'ijazah', 'rapor'].every(required => documents.some(item => item.type === required)) ? 'Lengkap' : 'Belum Lengkap'
          };
        }));
        reportSummaryRows.push({ Ringkasan: 'Dokumen wajib lengkap', Jumlah: reportOutputRows.filter(row => row['Kelengkapan Wajib'] === 'Lengkap').length });
        reportSummaryRows.push({ Ringkasan: 'Dokumen perlu dilengkapi', Jumlah: reportOutputRows.filter(row => row['Kelengkapan Wajib'] === 'Belum Lengkap').length });
      }
      tableBody.innerHTML = reportSummaryRows.map(row => `<tr class="border-t border-slate-200"><td class="px-4 py-2 text-sm font-medium text-slate-700">${escapeHtml(row.Ringkasan)}</td><td class="px-4 py-2 text-right text-sm font-semibold text-slate-900">${escapeHtml(row.Jumlah)}</td></tr>`).join('') || '<tr><td class="px-4 py-6 text-center text-sm text-slate-500" colspan="2">Tidak ada ringkasan untuk filter ini.</td></tr>';
      const detailBody = document.getElementById('reportStudentBody');
      const detailHead = document.getElementById('reportStudentHead');
      const detailColumns = Object.keys(reportOutputRows[0] || { 'No. Pendaftaran': '', NISN: '', 'Nama Siswa': '', 'Asal Sekolah': '', Jalur: '', 'Status Berkas': '', 'Hasil Seleksi': '', 'Nilai Rapor': '' });
      if (detailHead) detailHead.innerHTML = `<tr class="bg-surface-container-low text-text-secondary text-xs uppercase">${detailColumns.map(column => `<th class="px-3 py-2 text-left">${escapeHtml(column)}</th>`).join('')}</tr>`;
      if (detailBody) detailBody.innerHTML = reportOutputRows.length ? reportOutputRows.map(row => `<tr class="border-t border-slate-200">${detailColumns.map(column => `<td class="px-3 py-2 text-sm text-slate-700">${escapeHtml(row[column] ?? '-')}</td>`).join('')}</tr>`).join('') : `<tr><td class="px-3 py-8 text-center text-sm text-slate-500" colspan="${detailColumns.length}">Tidak ada siswa sesuai filter.</td></tr>`;
      const selectedFormat = document.getElementById('reportFormatFilter').value;
      setText('reportPreviewFormat', selectedFormat === 'xlsx' ? 'Excel (.xlsx)' : 'PDF');
      document.getElementById('btnExportXls').disabled = selectedFormat === 'pdf';
      document.getElementById('btnDownloadPdf').disabled = selectedFormat === 'xlsx';
      document.getElementById('btnExportXls').classList.toggle('opacity-50', selectedFormat === 'pdf');
      document.getElementById('btnDownloadPdf').classList.toggle('opacity-50', selectedFormat === 'xlsx');
    }

    previewButton.addEventListener('click', renderReport);
    document.getElementById('reportFormatFilter').addEventListener('change', renderReport);
    document.getElementById('reportWaveFilter').addEventListener('change', renderReport);
    document.getElementById('reportTypeSelector').addEventListener('change', renderReport);
    window.addEventListener('ppdb-data-updated', renderReport);
    window.addEventListener('storage', event => { if (event.key === 'ppdb_applicants') renderReport(); });
    document.getElementById('btnExportXls').addEventListener('click', event => {
      const button = event.currentTarget;
      button.disabled = true;
      const summaryRows = reportSummaryRows.map(row => ({ ...row }));
      const detailRows = reportOutputRows.map(row => ({ ...row }));
      const settings = store.getSettings();
      exportExcel(summaryRows, detailRows, `laporan-ppdb-${new Date().toISOString().slice(0, 10)}.xlsx`, {
        title: reportDisplayHeading,
        schoolName: settings.report.schoolName,
        period: document.getElementById('reportPreviewWave').textContent,
        reportType: document.getElementById('reportTypeSelector').selectedOptions[0].textContent,
        operator: JSON.parse(localStorage.getItem('ppdb_logged_in') || 'null')?.displayName
      })
        .catch(() => csvDownload([...summaryRows.map(row => ({ Bagian: 'Ringkasan', ...row })), ...detailRows.map(row => ({ Bagian: 'Data Siswa', ...row }))], 'laporan-ppdb.csv'))
        .finally(() => { button.disabled = false; });
    });
    document.getElementById('btnDownloadPdf').addEventListener('click', event => {
      const button = event.currentTarget;
      button.disabled = true;
      const settings = store.getSettings();
      const session = JSON.parse(localStorage.getItem('ppdb_logged_in') || 'null');
      buildPdf(reportDisplayHeading, `${settings.report.schoolName || 'Nama Sekolah'} · ${document.getElementById('reportPreviewWave').textContent} · ${reportApplicants.length} pendaftar · Operator: ${session?.displayName || 'Operator PPDB'}`, reportSummaryRows, reportOutputRows, `rekap-ppdb-${new Date().toISOString().slice(0, 10)}.pdf`, true)
        .catch(error => window.alert(error.message))
        .finally(() => { button.disabled = false; });
    });
    renderReport();
  }

  function initWaveQuotaSettings() {
    const totalInput = document.getElementById('quotaTotal');
    if (!totalInput) return;
    const waveOneInput = document.getElementById('quotaWave1');
    const waveTwoInput = document.getElementById('quotaWave2');
    const specialInput = document.getElementById('quotaWaveSpecial');
    const modal = document.getElementById('quick-quota-modal');
    const saveButton = document.getElementById('saveQuotaSettings');
    let editingWave = '1';
    let waveModal = document.getElementById('waveEditModal');
    if (!waveModal) {
      waveModal = document.createElement('div');
      waveModal.id = 'waveEditModal';
      waveModal.className = 'fixed inset-0 z-[75] hidden items-center justify-center bg-slate-950/50 p-4';
      waveModal.innerHTML = `<section class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl"><div class="mb-5 flex items-center justify-between"><h2 class="text-lg font-bold" id="waveEditTitle">Edit Gelombang</h2><button class="rounded p-2 hover:bg-slate-100" type="button" data-close-wave-edit aria-label="Tutup">×</button></div><form class="space-y-4" id="waveEditForm"><label class="block text-sm font-medium">Nama gelombang<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="title" maxlength="100" required></label><div class="grid grid-cols-2 gap-3"><label class="block text-sm font-medium">Tanggal mulai<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="startDate" type="date"></label><label class="block text-sm font-medium">Tanggal tutup<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="endDate" type="date"></label></div><fieldset><legend class="text-sm font-medium">Jalur dibuka</legend><div class="mt-2 grid grid-cols-2 gap-2 text-sm"><label><input type="checkbox" name="pathways" value="zonasi"> Zonasi</label><label><input type="checkbox" name="pathways" value="prestasi"> Prestasi</label><label><input type="checkbox" name="pathways" value="mutasi"> Perpindahan tugas</label></div></fieldset><label class="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="open"> Buka pendaftaran</label><p class="hidden rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" id="waveEditError" role="alert"></p><div class="flex justify-end gap-2"><button class="rounded-lg px-4 py-2 text-sm hover:bg-slate-100" type="button" data-close-wave-edit>Batal</button><button class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white" type="submit">Simpan Gelombang</button></div></form></section>`;
      document.body.appendChild(waveModal);
    }
    let calendarModal = document.getElementById('academicCalendarModal');
    if (!calendarModal) {
      calendarModal = document.createElement('div');
      calendarModal.id = 'academicCalendarModal';
      calendarModal.className = 'fixed inset-0 z-[75] hidden items-center justify-center bg-slate-950/50 p-4';
      calendarModal.innerHTML = `<section class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"><div class="mb-5 flex items-center justify-between"><h2 class="text-lg font-bold">Kalender Akademik</h2><button class="rounded p-2 hover:bg-slate-100" type="button" data-close-calendar aria-label="Tutup">×</button></div><form class="space-y-4" id="academicCalendarForm"><label class="block text-sm font-medium">Tahun ajaran dimulai<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="startDate" type="date" required></label><label class="block text-sm font-medium">Tahun ajaran berakhir<input class="mt-1 w-full rounded-lg border-slate-300 text-sm" name="endDate" type="date" required></label><p class="hidden rounded-lg px-3 py-2 text-sm" id="calendarSaveMessage" role="status"></p><div class="flex justify-end gap-2"><button class="rounded-lg px-4 py-2 text-sm hover:bg-slate-100" type="button" data-close-calendar>Batal</button><button class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white" type="submit">Simpan Kalender</button></div></form></section>`;
      document.body.appendChild(calendarModal);
    }

    const closeModal = target => { target.classList.add('hidden'); target.classList.remove('flex'); };
    const openModal = target => { target.classList.remove('hidden'); target.classList.add('flex'); };
    const dateRange = wave => {
      if (!wave.startDate || !wave.endDate) return 'Belum dijadwalkan';
      const format = value => new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      return `${format(wave.startDate)} - ${format(wave.endDate)}`;
    };

    document.querySelectorAll('[data-close-wave-edit]').forEach(button => button.addEventListener('click', () => closeModal(waveModal)));
    waveModal.addEventListener('click', event => { if (event.target === waveModal) closeModal(waveModal); });
    document.querySelectorAll('[data-close-calendar]').forEach(button => button.addEventListener('click', () => closeModal(calendarModal)));
    calendarModal.addEventListener('click', event => { if (event.target === calendarModal) closeModal(calendarModal); });

    document.getElementById('btn-kalender')?.addEventListener('click', () => {
      const form = document.getElementById('academicCalendarForm');
      const calendar = store.getSettings().academicCalendar;
      form.elements.startDate.value = calendar.startDate || '';
      form.elements.endDate.value = calendar.endDate || '';
      openModal(calendarModal);
    });
    document.getElementById('academicCalendarForm').addEventListener('submit', event => {
      event.preventDefault();
      const form = event.currentTarget;
      if (form.elements.endDate.value < form.elements.startDate.value) {
        const message = document.getElementById('calendarSaveMessage');
        message.textContent = 'Tanggal akhir harus sama atau setelah tanggal mulai.';
        message.className = 'rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700';
        return;
      }
      store.setAcademicCalendar({ startDate: form.elements.startDate.value, endDate: form.elements.endDate.value });
      closeModal(calendarModal);
    });

    document.querySelectorAll('[data-edit-wave]').forEach(button => button.addEventListener('click', () => {
      editingWave = button.dataset.editWave;
      const settings = store.getSettings().waves[editingWave];
      const form = document.getElementById('waveEditForm');
      document.getElementById('waveEditTitle').textContent = `Edit ${settings.title}`;
      form.elements.title.value = settings.title;
      form.elements.startDate.value = settings.startDate || '';
      form.elements.endDate.value = settings.endDate || '';
      form.elements.open.checked = Boolean(settings.open);
      form.querySelectorAll('[name="pathways"]').forEach(input => { input.checked = settings.pathways.includes(input.value); });
      document.getElementById('waveEditError').classList.add('hidden');
      openModal(waveModal);
    }));
    document.getElementById('waveEditForm').addEventListener('submit', event => {
      event.preventDefault();
      const form = event.currentTarget;
      const pathways = [...form.querySelectorAll('[name="pathways"]:checked')].map(input => input.value);
      const error = document.getElementById('waveEditError');
      if (form.elements.startDate.value && form.elements.endDate.value && form.elements.endDate.value < form.elements.startDate.value) {
        error.textContent = 'Tanggal tutup harus sama atau setelah tanggal mulai.';
        error.classList.remove('hidden');
        return;
      }
      if (!pathways.length) {
        error.textContent = 'Pilih minimal satu jalur pendaftaran.';
        error.classList.remove('hidden');
        return;
      }
      store.setWaveSettings(editingWave, {
        title: form.elements.title.value.trim(),
        startDate: form.elements.startDate.value,
        endDate: form.elements.endDate.value,
        pathways,
        open: form.elements.open.checked
      });
      closeModal(waveModal);
    });
    document.querySelectorAll('[data-toggle-wave]').forEach(button => button.addEventListener('click', () => {
      const wave = button.dataset.toggleWave;
      const settings = store.getSettings();
      const nextOpen = !settings.waves[wave].open;
      if (nextOpen && !window.confirm('Buka pendaftaran untuk gelombang ini? Gelombang aktif sebelumnya akan ditutup.')) return;
      if (!nextOpen && !window.confirm('Tutup pendaftaran untuk gelombang ini?')) return;
      if (nextOpen) {
        Object.entries(settings.waves).forEach(([key, value]) => {
          if (key !== wave && value.open) store.setWaveSettings(key, { open: false });
        });
      }
      store.setWaveSettings(wave, { open: nextOpen });
    }));

    function render() {
      const settings = store.getSettings();
      const waveOne = settings.waves['1'];
      const waveTwo = settings.waves['2'];
      const waveSpecial = settings.waves.khusus;
      waveOneInput.value = Number(settings.quotas['1'] || 0);
      waveTwoInput.value = Number(settings.quotas['2'] || 0);
      specialInput.value = Number(settings.quotas.khusus || 0);
      const total = Number(waveOneInput.value) + Number(waveTwoInput.value) + Number(specialInput.value);
      totalInput.value = total;

      const applicants = store.getApplicants();
      const verifiedWaveOne = applicants.filter(item => item.wave === '1' && item.status === 'terverifikasi').length;
      const waveTwoApplicants = applicants.filter(item => item.wave === '2').length;
      const verifiedWaveTwo = applicants.filter(item => item.wave === '2' && item.status === 'terverifikasi').length;
      const verifiedTotal = applicants.filter(item => item.status === 'terverifikasi').length;
      const quotaOne = Number(settings.quotas['1'] || 0);
      const quotaTwo = Number(settings.quotas['2'] || 0);
      const quotaSpecial = Number(settings.quotas.khusus || 0);
      const specialApplicants = applicants.filter(item => item.wave === 'khusus');
      const overallQuota = total;
      const percent = overallQuota ? Math.round(verifiedTotal / overallQuota * 100) : 0;
      setText('waveTotalApplicants', applicants.length.toLocaleString('id-ID'));
      setText('waveOccupancyPercent', `${percent}%`);
      setText('waveOccupancySummary', `${verifiedTotal} terverifikasi dari ${overallQuota.toLocaleString('id-ID')} kuota total`);
      setText('wave2CardQuota', `${quotaTwo.toLocaleString('id-ID')} Siswa`);
      setText('waveSpecialCardQuota', `${quotaSpecial.toLocaleString('id-ID')} Siswa`);
      setText('wave2CardApplicantCount', `${waveTwoApplicants} pendaftar`);
      setText('wave2CardVerifiedCount', `${verifiedWaveTwo} terverifikasi`);
      setText('waveSpecialApplicantCount', `${specialApplicants.length} pendaftar`);
      setText('wave1Schedule', dateRange(waveOne));
      setText('wave2Schedule', dateRange(waveTwo));
      setText('waveSpecialSchedule', dateRange(waveSpecial));
      setText('wave1Title', waveOne.title);
      setText('wave2Title', waveTwo.title);
      setText('waveSpecialTitle', waveSpecial.title);
      const pathwayNames = { zonasi: 'Zonasi Reguler', prestasi: 'Prestasi Akademik', mutasi: 'Perpindahan Tugas' };
      [['wave1Pathways', waveOne], ['wave2Pathways', waveTwo], ['waveSpecialPathways', waveSpecial]].forEach(([id, wave]) => {
        const container = document.getElementById(id);
        if (container) container.innerHTML = wave.pathways.map(pathway => `<span class="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-blue-800">${pathwayNames[pathway] || pathway}</span>`).join('');
      });
      setText('wave1StatusLabel', waveOne.open ? 'AKTIF / BUKA' : 'DITUTUP');
      setText('wave2StatusLabel', waveTwo.open ? 'AKTIF / BUKA' : 'SEGERA DIBUKA');
      setText('waveSpecialStatusLabel', waveSpecial.open ? 'AKTIF / BUKA' : 'DRAFT / NON-AKTIF');
      setText('wave1ApplicantCount', applicants.filter(item => item.wave === '1').length);
      setText('activeWaveBanner', `GELOMBANG ${settings.activeWave === 'khusus' ? 'KHUSUS' : settings.activeWave || 'BELUM AKTIF'} ${settings.activeWave && settings.waves[settings.activeWave]?.open ? 'SEDANG BERJALAN' : 'DITUTUP'}`);
      const activeWave = settings.waves[settings.activeWave];
      setText('activeWaveDateRange', activeWave ? `Periode pendaftaran: ${dateRange(activeWave)}` : 'Belum ada gelombang aktif');
      const daysLeft = activeWave?.endDate ? Math.ceil((new Date(`${activeWave.endDate}T23:59:59`) - new Date()) / 86400000) : null;
      setText('activeWaveDaysLeft', activeWave?.open && daysLeft !== null ? (daysLeft > 0 ? `Tersisa ${daysLeft} hari` : 'Jadwal telah lewat') : 'Pendaftaran ditutup');
      setText('activeWaveDescription', activeWave?.open ? 'Pendaftaran menerima record pada gelombang aktif.' : 'Pendaftaran baru tidak diterima pada gelombang yang ditutup.');
      document.querySelectorAll('[data-toggle-wave]').forEach(button => {
        const open = settings.waves[button.dataset.toggleWave]?.open;
        button.classList.toggle('bg-status-success', !open);
        button.classList.toggle('bg-status-danger-bg', Boolean(open));
        const icon = button.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = open ? 'lock_clock' : 'play_arrow';
        const label = [...button.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        if (label) label.textContent = open ? 'Tutup Pendaftaran' : 'Buka Pendaftaran';
      });
      setText('overallQuotaDisplay', overallQuota.toLocaleString('id-ID'));
      setText('overallQuotaDonutLabel', overallQuota.toLocaleString('id-ID'));
      setText('quotaLegendWave1', `${quotaOne.toLocaleString('id-ID')} (${overallQuota ? Math.round(quotaOne / overallQuota * 100) : 0}%)`);
      setText('quotaLegendWave2', `${quotaTwo.toLocaleString('id-ID')} (${overallQuota ? Math.round(quotaTwo / overallQuota * 100) : 0}%)`);
      setText('quotaLegendSpecial', `${quotaSpecial.toLocaleString('id-ID')} (${overallQuota ? Math.round(quotaSpecial / overallQuota * 100) : 0}%)`);
      setText('waveApplicantQuotaRatio', `${overallQuota ? (applicants.length / overallQuota).toFixed(2) : '0.00'}x dari pagu`);
      const progress = document.getElementById('waveOccupancyProgress');
      if (progress) progress.style.width = `${Math.min(percent, 100)}%`;

      const percentOne = quotaOne ? Math.round(verifiedWaveOne / quotaOne * 100) : 0;
      setText('wave1CardCount', `${verifiedWaveOne} / ${quotaOne.toLocaleString('id-ID')}`);
      setText('wave1CardPercent', `${percentOne}% Terisi`);
      setText('wave1CardRemaining', `Sisa ${Math.max(0, quotaOne - verifiedWaveOne).toLocaleString('id-ID')} Kursi`);
      const waveOneProgress = document.getElementById('wave1CardProgress');
      if (waveOneProgress) waveOneProgress.style.width = `${Math.min(percentOne, 100)}%`;

      const waveTwoPercent = quotaTwo ? Math.round(verifiedWaveTwo / quotaTwo * 100) : 0;
      const waveTwoProgress = document.querySelector('#wave2CardQuota')?.closest('.mb-space-md')?.querySelector('.h-2 > div');
      if (waveTwoProgress) waveTwoProgress.style.width = `${Math.min(waveTwoPercent, 100)}%`;

      const quotaArcs = document.querySelectorAll('#quotaBreakdownDonut path');
      if (quotaArcs.length >= 4) {
        const quotas = [quotaOne, quotaTwo, quotaSpecial];
        let offset = 0;
        quotas.forEach((quota, index) => {
          const share = overallQuota ? quota / overallQuota * 100 : 0;
          quotaArcs[index + 1].setAttribute('stroke-dasharray', `${share}, 100`);
          quotaArcs[index + 1].setAttribute('stroke-dashoffset', `${-offset}`);
          offset += share;
        });
      }

      const pathwayBody = document.getElementById('quotaPathwayTableBody');
      if (pathwayBody) {
        const pathways = [
          ['zonasi', 'Zonasi Reguler', 'bg-primary'],
          ['prestasi', 'Prestasi Akademik/Non', 'bg-secondary-container'],
          ['mutasi', 'Perpindahan Tugas', 'bg-outline']
        ];
        pathwayBody.innerHTML = pathways.map(([key, label, tone]) => {
          const records = applicants.filter(item => item.pathway === key);
          const verified = records.filter(item => item.status === 'terverifikasi').length;
          const proportion = applicants.length ? Math.round(records.length / applicants.length * 100) : 0;
          return `<tr class="border-t border-slate-100"><td class="px-4 py-3 font-medium">${label}</td><td class="px-4 py-3">${records.length}</td><td class="px-4 py-3">${verified}</td><td class="px-4 py-3"><div class="flex items-center gap-2"><div class="h-2 w-20 overflow-hidden rounded-full bg-slate-200"><div class="h-full ${tone}" style="width:${proportion}%"></div></div><span class="text-xs font-semibold">${proportion}%</span></div></td><td class="px-4 py-3 text-right text-xs text-slate-500">${applicants.length ? `${records.length} dari ${applicants.length}` : '0 pendaftar'}</td></tr>`;
        }).join('') || '<tr><td class="px-4 py-6 text-center text-sm text-slate-500" colspan="5">Belum ada data pendaftar.</td></tr>';
        setText('quotaPathwaySummary', `Menampilkan ${pathways.length} jalur · ${applicants.length} pendaftar tersimpan`);
      }
    }

    [waveOneInput, waveTwoInput, specialInput].forEach(input => input.addEventListener('input', () => {
      totalInput.value = [waveOneInput, waveTwoInput, specialInput].reduce((total, field) => total + (Number(field.value) || 0), 0);
    }));
    saveButton?.addEventListener('click', () => {
      const fields = [waveOneInput, waveTwoInput, specialInput];
      const invalid = fields.find(input => !input.value || Number(input.value) < 0 || !Number.isInteger(Number(input.value)));
      if (invalid) {
        invalid.setCustomValidity('Masukkan kuota berupa bilangan bulat nol atau lebih.');
        invalid.reportValidity();
        invalid.setCustomValidity('');
        return;
      }
      store.setQuotas({ '1': Number(waveOneInput.value), '2': Number(waveTwoInput.value), khusus: Number(specialInput.value) });
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
      render();
    });
    window.addEventListener('ppdb-data-updated', render);
    window.addEventListener('storage', event => { if (['ppdb_applicants', 'ppdb_settings'].includes(event.key)) render(); });
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initAdminApplicants();
    initDashboard();
    initReport();
    initWaveQuotaSettings();
    document.documentElement.dataset.ppdbReady = 'true';
  }, { once: true });
})();