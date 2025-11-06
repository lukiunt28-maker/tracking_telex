// script.js - VERSIINI MENGGUNAKAN SHEETY

// --- KONFIGURASI SHEETY ---
// Ganti dengan API Endpoint dan API Key dari Sheety Anda
const SHEETY_API_URL = 'https://api.sheety.co/YOUR_SHEETY_ID/telexData'; // GANTI INI
const SHEETY_API_KEY = 'YOUR_SHEETY_API_KEY'; // GANTI INI

// Global Variables
let telexData = [];
let filteredData = [];
let currentFilter = 'all';
let currentUser = null; // Tidak digunakan lagi, tapi dibiarkan

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const logoutBtn = document.getElementById('logoutBtn');
const userInitials = document.getElementById('userInitials');
const takeNumberBtn = document.getElementById('takeNumberBtn');
const telexInputForm = document.getElementById('telexInputForm');
const generatedNomorTelex = document.getElementById('generatedNomorTelex');
const telexBody = document.getElementById('telexBody');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const exportBtn = document.getElementById('exportBtn');
const filterButtons = document.querySelectorAll('.filter-btn');
const telexTableBody = document.getElementById('telexTableBody');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const closeBtn = document.querySelector('.close-btn');
const btnCancel = document.querySelector('.btn-cancel');

// Dashboard Elements
const totalCount = document.getElementById('totalCount');
const pendingCount = document.getElementById('pendingCount');
const doneCount = document.getElementById('doneCount');
const progressPercent = document.getElementById('progressPercent');

// --- FUNGSI UTAMA APLIKASI ---

// Langsung tampilkan aplikasi utama, tidak perlu login lagi
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM siap. Memulai aplikasi.");
    showMainApp();
    setupAppEventListeners();
});

function showMainApp() {
    loginScreen.style.display = 'none';
    mainApp.style.display = 'block';
    userInitials.textContent = 'Pengguna'; // Bisa diganti dengan nama tetap
    loadTelexData();
}

function setupAppEventListeners() {
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (takeNumberBtn) takeNumberBtn.addEventListener('click', showTelexForm);
    if (telexInputForm) telexInputForm.addEventListener('submit', saveTelex);
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    if (clearSearchBtn) clearSearchBtn.addEventListener('click', clearSearch);
    if (exportBtn) exportBtn.addEventListener('click', exportToCSV);
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            filterData();
        });
    });
    
    if (editForm) editForm.addEventListener('submit', saveEdit);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
    window.addEventListener('click', function(e) {
        if (e.target === editModal) { closeModal(); }
    });
}

function handleLogout() {
    // Tidak ada proses logout, cukup refresh halaman atau sembunyikan aplikasi
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        location.reload();
    }
}

// --- FUNGSI CRUD DENGAN SHEETY API ---

// Fungsi untuk memuat data
async function loadTelexData() {
    showLoadingIndicator();
    try {
        const response = await fetch(`${SHEETY_API_URL}?access_token=${SHEETY_API_KEY}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        telexData = data.telexData || [];
        filteredData = [...telexData];
        renderTable();
        updateDashboard();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Gagal memuat data. Periksa konsol dan pengaturan Sheety Anda.');
    } finally {
        hideLoadingIndicator();
    }
}

// Fungsi untuk menyimpan data baru
async function saveTelex(e) {
    e.preventDefault();
    const newTelex = {
        nomorTelex: generatedNomorTelex.value,
        picWidebody: '',
        picNarrowbody: '',
        remark: telexBody.value,
        tanggalDibuat: new Date().toISOString(),
        status: 'pending'
    };
    
    showLoadingIndicator();
    try {
        const response = await fetch(`${SHEETY_API_URL}?access_token=${SHEETY_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telexData: newTelex })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        telexInputForm.style.display = 'none';
        telexBody.value = '';
        showNotification('Data berhasil disimpan!', 'success');
        loadTelexData(); // Muat ulang data
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Gagal menyimpan data. Periksa konsol.');
    } finally {
        hideLoadingIndicator();
    }
}

// Fungsi untuk memperbarui data
async function updateInGoogleSheets(data) {
    showLoadingIndicator();
    try {
        const response = await fetch(`${SHEETY_API_URL}/${data.id}?access_token=${SHEETY_API_KEY}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telexData: data })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        closeModal();
        showNotification('Data berhasil diperbarui!', 'success');
        loadTelexData();
    } catch (error) {
        console.error('Error updating data:', error);
        alert('Gagal memperbarui data. Periksa konsol.');
    } finally {
        hideLoadingIndicator();
    }
}

// Fungsi untuk menghapus data
async function deleteFromGoogleSheets(id) {
    showLoadingIndicator();
    try {
        const response = await fetch(`${SHEETY_API_URL}/${id}?access_token=${SHEETY_API_KEY}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        showNotification('Data berhasil dihapus!', 'success');
        loadTelexData();
    } catch (error) {
        console.error('Error deleting data:', error);
        alert('Gagal menghapus data. Periksa konsol.');
    } finally {
        hideLoadingIndicator();
    }
}

// --- FUNGSI UI & LAINNYA (TIDAK PERLU DIUBAH) ---
function showTelexForm() {
    const today = new Date();
    const dateStr = today.getFullYear().toString() + (today.getMonth() + 1).toString().padStart(2, '0') + today.getDate().toString().padStart(2, '0');
    let lastNumber = 0;
    if (telexData.length > 0) {
        const todayNumbers = telexData.filter(item => item.nomorTelex && item.nomorTelex.startsWith(dateStr));
        if (todayNumbers.length > 0) {
            const lastTelex = todayNumbers.reduce((prev, current) => (prev.nomorTelex > current.nomorTelex) ? prev : current);
            const lastNumStr = lastTelex.nomorTelex.split('-')[1];
            lastNumber = parseInt(lastNumStr);
        }
    }
    const newNumber = (lastNumber + 1).toString().padStart(3, '0');
    const newNomorTelex = `TLX-${dateStr}-${newNumber}`;
    generatedNomorTelex.value = newNomorTelex;
    telexInputForm.style.display = 'block';
    telexBody.focus();
}

function renderTable() {
    telexTableBody.innerHTML = ''; if (filteredData.length === 0) { const row = document.createElement('tr'); row.innerHTML = '<td colspan="8" style="text-align: center;">Tidak ada data telex</td>'; telexTableBody.appendChild(row); return; }
    filteredData.forEach((telex, index) => {
        const row = document.createElement('tr'); const statusClass = telex.status === 'done' ? 'status-done' : 'status-pending'; const statusText = telex.status === 'done' ? 'Sudah Dikerjakan' : 'Belum Dikerjakan'; const formattedDate = new Date(telex.tanggalDibuat).toLocaleDateString('id-ID');
        row.innerHTML = `<td>${index + 1}</td><td>${telex.nomorTelex}</td><td>${telex.picWidebody || '-'}</td><td>${telex.picNarrowbody || '-'}</td><td>${telex.remark}</td><td>${formattedDate}</td><td><span class="status-badge ${statusClass}">${statusText}</span></td><td><div class="action-buttons"><button class="btn-edit" onclick="editTelex('${telex.id}')">Edit</button><button class="btn-delete" onclick="deleteTelex('${telex.id}')">Hapus</button><button class="btn-status" onclick="toggleStatus('${telex.id}')">${telex.status === 'done' ? 'Batal' : 'Selesai'}</button></div></td>`;
        telexTableBody.appendChild(row);
    });
}
function updateDashboard() {
    const total = telexData.length; const pending = telexData.filter(item => item.status === 'pending').length; const done = telexData.filter(item => item.status === 'done').length; const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    totalCount.textContent = total; pendingCount.textContent = pending; doneCount.textContent = done; progressPercent.textContent = `${progress}%`;
}
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase(); if (searchTerm === '') { filteredData = [...telexData]; } else { filteredData = telexData.filter(telex => telex.nomorTelex.toLowerCase().includes(searchTerm) || (telex.picWidebody && telex.picWidebody.toLowerCase().includes(searchTerm)) || (telex.picNarrowbody && telex.picNarrowbody.toLowerCase().includes(searchTerm)) || telex.remark.toLowerCase().includes(searchTerm)); } filterData();
}
function clearSearch() { searchInput.value = ''; filteredData = [...telexData]; filterData(); }
function filterData() {
    let tempData = [...filteredData]; if (currentFilter !== 'all') { tempData = tempData.filter(telex => telex.status === currentFilter); }
    telexTableBody.innerHTML = ''; if (tempData.length === 0) { const row = document.createElement('tr'); row.innerHTML = '<td colspan="8" style="text-align: center;">Tidak ada data telex</td>'; telexTableBody.appendChild(row); return; }
    tempData.forEach((telex, index) => {
        const row = document.createElement('tr'); const statusClass = telex.status === 'done' ? 'status-done' : 'status-pending'; const statusText = telex.status === 'done' ? 'Sudah Dikerjakan' : 'Belum Dikerjakan'; const formattedDate = new Date(telex.tanggalDibuat).toLocaleDateString('id-ID');
        row.innerHTML = `<td>${index + 1}</td><td>${telex.nomorTelex}</td><td>${telex.picWidebody || '-'}</td><td>${telex.picNarrowbody || '-'}</td><td>${telex.remark}</td><td>${formattedDate}</td><td><span class="status-badge ${statusClass}">${statusText}</span></td><td><div class="action-buttons"><button class="btn-edit" onclick="editTelex('${telex.id}')">Edit</button><button class="btn-delete" onclick="deleteTelex('${telex.id}')">Hapus</button><button class="btn-status" onclick="toggleStatus('${telex.id}')">${telex.status === 'done' ? 'Batal' : 'Selesai'}</button></div></td>`;
        telexTableBody.appendChild(row);
    });
}
function editTelex(id) {
    const telex = telexData.find(item => item.id === id); if (telex) { document.getElementById('editNomorTelex').value = telex.nomorTelex; document.getElementById('editPicWidebody').value = telex.picWidebody || ''; document.getElementById('editPicNarrowbody').value = telex.picNarrowbody || ''; document.getElementById('editRemark').value = telex.remark; editModal.dataset.telexId = id; editModal.style.display = 'block'; }
}
function saveEdit(e) {
    e.preventDefault();
    const telexId = editModal.dataset.telexId;
    const telexIndex = telexData.findIndex(item => item.id === telexId);
    if (telexIndex !== -1) {
        telexData[telexIndex].picWidebody = document.getElementById('editPicWidebody').value;
        telexData[telexIndex].picNarrowbody = document.getElementById('editPicNarrowbody').value;
        telexData[telexIndex].remark = document.getElementById('editRemark').value;
        updateInGoogleSheets(telexData[telexIndex]);
    }
}
function deleteTelex(id) {
    if (confirm(`Apakah Anda yakin ingin menghapus data ini?`)) { deleteFromGoogleSheets(id); }
}
function toggleStatus(id) {
    const telexIndex = telexData.findIndex(item => item.id === id); if (telexIndex !== -1) { telexData[telexIndex].status = telexData[telexIndex].status === 'done' ? 'pending' : 'done'; updateInGoogleSheets(telexData[telexIndex]); } }
function closeModal() { editModal.style.display = 'none'; }
function exportToCSV() {
    let csv = 'No,Nomor Telex,PIC Widebody,PIC Narrowbody,Remark,Tanggal Dibuat,Status\n'; telexData.forEach((telex, index) => { const statusText = telex.status === 'done' ? 'Sudah Dikerjakan' : 'Belum Dikerjakan'; const formattedDate = new Date(telex.tanggalDibuat).toLocaleDateString('id-ID'); csv += `${index + 1},"${telex.nomorTelex}","${telex.picWidebody || ''}","${telex.picNarrowbody || ''}","${telex.remark}","${formattedDate}","${statusText}"\n`; });
    const blob = new Blob([csv], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.setAttribute('hidden', ''); a.setAttribute('href', url); a.setAttribute('download', `telex_data_${new Date().toISOString().split('T')[0]}.csv`); document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// --- HELPER FUNCTIONS ---
function showLoadingIndicator() { if (document.getElementById('loadingIndicator')) return; const loadingElement = document.createElement('div'); loadingElement.id = 'loadingIndicator'; loadingElement.className = 'loading-indicator'; loadingElement.innerHTML = '<div class="spinner"></div><p>Memuat data...</p>'; document.body.appendChild(loadingElement); }
function hideLoadingIndicator() { const loadingElement = document.getElementById('loadingIndicator'); if (loadingElement) { loadingElement.remove(); } }
function showNotification(message, type) { const notification = document.createElement('div'); notification.className = `notification ${type}`; notification.textContent = message; document.body.appendChild(notification); setTimeout(function() { notification.remove(); }, 3000); }
