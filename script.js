document.addEventListener('DOMContentLoaded', () => {
    const telexForm = document.getElementById('telexForm');
    const telexTableBody = document.getElementById('telexTableBody');
    const exportBtn = document.getElementById('exportBtn');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Elemen Modal
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    const closeBtn = document.querySelector('.close-btn');
    const btnCancel = document.querySelector('.btn-cancel');

    // Elemen Pencarian
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    let telexData = JSON.parse(localStorage.getItem('telexData')) || [];
    let currentFilter = 'all';
    let searchTerm = '';

    if (telexData.length > 0 && !telexData[0].nomorTelex) {
        alert('Struktur data lama terdeteksi. Data akan dihapus untuk menghindari error.');
        localStorage.removeItem('telexData');
        telexData = [];
    }

    const updateDashboard = () => {
        const totalCount = telexData.length;
        const pendingCount = telexData.filter(item => !item.isDone).length;
        const doneCount = telexData.filter(item => item.isDone).length;
        const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

        document.getElementById('totalCount').innerText = totalCount;
        document.getElementById('pendingCount').innerText = pendingCount;
        document.getElementById('doneCount').innerText = doneCount;
        document.getElementById('progressPercent').innerText = `${progressPercent}%`;
    };

    const saveData = () => {
        localStorage.setItem('telexData', JSON.stringify(telexData));
    };

    const renderTable = () => {
        telexTableBody.innerHTML = '';

        // 1. Filter berdasarkan status
        let filteredData = telexData.filter(item => {
            if (currentFilter === 'pending') return !item.isDone;
            if (currentFilter === 'done') return item.isDone;
            return true;
        });

        // 2. Filter berdasarkan kata kunci pencarian
        if (searchTerm) {
            filteredData = filteredData.filter(item => {
                const term = searchTerm.toLowerCase();
                return (
                    item.nomorTelex.toLowerCase().includes(term) ||
                    item.picWidebody.toLowerCase().includes(term) ||
                    (item.picNarrowbody && item.picNarrowbody.toLowerCase().includes(term)) ||
                    item.remark.toLowerCase().includes(term)
                );
            });
        }

        if (filteredData.length === 0) {
            const colSpan = 8;
            const message = searchTerm ? `Tidak ada hasil untuk "${searchTerm}".` : 'Tidak ada data untuk ditampilkan.';
            telexTableBody.innerHTML = `<tr><td colspan="${colSpan}" style="text-align:center;">${message}</td></tr>`;
            return;
        }

        filteredData.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.nomorTelex}</td>
                <td>${item.picWidebody}</td>
                <td>${item.picNarrowbody || '-'}</td>
                <td>${item.remark}</td>
                <td>${item.tanggalDiterima}</td>
                <td><span class="status-badge ${item.isDone ? 'status-done' : 'status-pending'}">${item.isDone ? 'Sudah Dikerjakan' : 'Belum Dikerjakan'}</span></td>
                <td>
                    <button class="action-btn btn-edit" onclick="openEditModal('${item.nomorTelex}')">✏️ Edit</button>
                    <button class="action-btn btn-toggle" onclick="toggleStatus('${item.nomorTelex}')">${item.isDone ? 'Batalkan' : 'Selesaikan'}</button>
                    <button class="action-btn btn-delete" onclick="deleteTelex('${item.nomorTelex}')">Hapus</button>
                </td>
            `;
            telexTableBody.appendChild(row);
        });
    };

    // --- FUNGSI MODAL ---
    window.openEditModal = (nomorTelex) => {
        const telexToEdit = telexData.find(t => t.nomorTelex === nomorTelex);
        if (telexToEdit) {
            document.getElementById('editNomorTelex').value = telexToEdit.nomorTelex;
            document.getElementById('editPicWidebody').value = telexToEdit.picWidebody;
            document.getElementById('editPicNarrowbody').value = telexToEdit.picNarrowbody || '';
            document.getElementById('editRemark').value = telexToEdit.remark;
            editModal.style.display = 'flex';
        }
    };

    const closeModal = () => {
        editModal.style.display = 'none';
        editForm.reset();
    };

    closeBtn.onclick = closeModal;
    btnCancel.onclick = closeModal;
    window.onclick = (event) => {
        if (event.target == editModal) {
            closeModal();
        }
    };
    // --- AKHIR FUNGSI MODAL ---

    // --- EVENT LISTENER PENCARIAN ---
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        if (searchTerm) {
            clearSearchBtn.style.display = 'block';
        } else {
            clearSearchBtn.style.display = 'none';
        }
        renderTable();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchTerm = '';
        clearSearchBtn.style.display = 'none';
        renderTable();
    });
    // --- AKHIR EVENT LISTENER PENCARIAN ---

    telexForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newTelex = {
            nomorTelex: document.getElementById('nomorTelex').value,
            picWidebody: document.getElementById('picWidebody').value,
            picNarrowbody: document.getElementById('picNarrowbody').value,
            remark: document.getElementById('remark').value,
            tanggalDiterima: new Date().toLocaleString('id-ID'),
            isDone: false
        };

        if (newTelex.picWidebody.trim() !== '' && newTelex.picNarrowbody.trim() !== '') {
            newTelex.isDone = true;
            newTelex.tanggalSelesai = new Date().toLocaleString('id-ID');
        }

        if (telexData.some(t => t.nomorTelex === newTelex.nomorTelex)) {
            alert('Nomor Telex sudah ada! Gunakan nomor yang unik.');
            return;
        }

        telexData.push(newTelex);
        saveData();
        renderTable();
        updateDashboard();
        telexForm.reset();
    });

    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nomorTelex = document.getElementById('editNomorTelex').value;
        const itemIndex = telexData.findIndex(t => t.nomorTelex === nomorTelex);

        if (itemIndex !== -1) {
            telexData[itemIndex].picWidebody = document.getElementById('editPicWidebody').value;
            telexData[itemIndex].picNarrowbody = document.getElementById('editPicNarrowbody').value;
            telexData[itemIndex].remark = document.getElementById('editRemark').value;

            if (telexData[itemIndex].picWidebody.trim() !== '' && telexData[itemIndex].picNarrowbody.trim() !== '') {
                telexData[itemIndex].isDone = true;
                if(!telexData[itemIndex].tanggalSelesai) {
                    telexData[itemIndex].tanggalSelesai = new Date().toLocaleString('id-ID');
                }
            } else {
                telexData[itemIndex].isDone = false;
                delete telexData[itemIndex].tanggalSelesai;
            }

            saveData();
            renderTable();
            updateDashboard();
            closeModal();
        }
    });

    window.toggleStatus = (nomorTelex) => {
        const item = telexData.find(t => t.nomorTelex === nomorTelex);
        if (item) {
            item.isDone = !item.isDone;
            if(item.isDone) {
                item.tanggalSelesai = new Date().toLocaleString('id-ID');
            } else {
                delete item.tanggalSelesai;
            }
            saveData();
            renderTable();
            updateDashboard();
        }
    };

    window.deleteTelex = (nomorTelex) => {
        if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            telexData = telexData.filter(t => t.nomorTelex !== nomorTelex);
            saveData();
            renderTable();
            updateDashboard();
        }
    };

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTable();
        });
    });

    exportBtn.addEventListener('click', () => {
        let csv = '\ufeffNo,Nomor Telex,PIC Widebody,PIC Narrowbody,Remark,Tanggal Diterima,Tanggal Selesai,Status\n';
        telexData.forEach((item, index) => {
            const status = item.isDone ? 'Sudah Dikerjakan' : 'Belum Dikerjakan';
            const tglSelesai = item.tanggalSelesai || '-';
            csv += `"${index + 1}","${item.nomorTelex}","${item.picWidebody}","${item.picNarrowbody || '-'}","${item.remark}","${item.tanggalDiterima}","${tglSelesai}","${status}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `laporan_telex_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    renderTable();
    updateDashboard();
});