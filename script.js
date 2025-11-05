// script.js

// Google Sheets Configuration
const SPREADSHEET_ID = '1vXAzjiTpVuwTtDe5OoI0cpeKeNnt66dI7Q7zNi7CxnA';
const SHEET_NAME = 'TELEX_DATA';
const CLIENT_ID = '662343193745-2tmbckp2m9je14fces0vulo849tfijmt.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAOimw4XGpxDu5kUMPQ4C0R_CzhI-0-SoE';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

// Global Variables
let telexData = [];
let filteredData = [];
let currentFilter = 'all';
let currentUser = null;

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
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
const googleSignInBtn = document.getElementById('googleSignInBtn');

// Dashboard Elements
const totalCount = document.getElementById('totalCount');
const pendingCount = document.getElementById('pendingCount');
const doneCount = document.getElementById('doneCount');
const progressPercent = document.getElementById('progressPercent');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM siap. Memasang event listener.");
    // Event Listeners
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleGoogleSignOut);
    takeNumberBtn.addEventListener('click', showTelexForm);
    telexInputForm.addEventListener('submit', saveTelex);
    searchInput.addEventListener('input', handleSearch);
    clearSearchBtn.addEventListener('click', clearSearch);
    exportBtn.addEventListener('click', exportToCSV);
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            filterData();
        });
    });
    
    editForm.addEventListener('submit', saveEdit);
    closeBtn.addEventListener('click', closeModal);
    btnCancel.addEventListener('click', closeModal);
    window.addEventListener('click', function(e) {
        if (e.target === editModal) { closeModal(); }
    });

    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    } else {
        console.error("Tombol Google Sign-In tidak ditemukan!");
    }
});

// --- AUTHENTICATION FUNCTIONS ---
function handleLogin(e) {
    e.preventDefault();
    alert('Silakan gunakan tombol "Masuk dengan Google" untuk masuk.');
}

function handleGoogleSignIn() {
    console.log("Tombol login diklik. Memulai proses signIn...");
    gapi.auth2.getAuthInstance().signIn().then(function() {
        console.log('Login berhasil!');
        showMainApp(); 
    }).catch(function(error) {
        console.error('Error saat login:', error);
        alert('Gagal masuk dengan Google. Periksa konsol (F12) untuk detail error.');
    });
}

function handleGoogleSignOut() {
    gapi.auth2.getAuthInstance().signOut().then(function() {
        console.log('Logout berhasil.');
        loginScreen.style.display = 'block';
        mainApp.style.display = 'none';
    });
}

// --- UI & NAVIGATION FUNCTIONS ---
function showMainApp() {
    loginScreen.style.display = 'none';
    mainApp.style.display = 'block';
    const googleUser = gapi.auth2.getAuthInstance().currentUser.get();
    const profile = googleUser.getBasicProfile();
    userInitials.textContent = profile.getEmail();
    loadTelexData();
}

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

// --- GOOGLE SHEETS API FUNCTIONS ---
function loadTelexData() {
    showLoadingIndicator();
    console.log(`Mencoba memuat data dari Spreadsheet ID: ${SPREADSHEET_ID}, Sheet: ${SHEET_NAME}`);
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID, range: `${SHEET_NAME}!A2:F`
    }).then(function(response) {
        console.log('Data berhasil dimuat dari Google Sheets:', response);
        const rows = response.result.values;
        if (rows && rows.length > 0) {
            telexData = rows.map(function(row) {
                return { nomorTelex: row[0] || '', picWidebody: row[1] || '', picNarrowbody: row[2] || '', remark: row[3] || '', tanggalDibuat: row[4] || new Date().toISOString(), status: row[5] || 'pending' };
            });
        } else { telexData = []; }
        filteredData = [...telexData];
        renderTable();
        updateDashboard();
        hideLoadingIndicator();
    }, function(error) {
        console.error('Error loading data:', error);
        hideLoadingIndicator();
        let errorMessage = 'Gagal memuat data dari Google Sheets.';
        if (error.status === 403) {
            errorMessage += ' Error 403: Akses Dilarang. Pastikan Google Sheet Anda sudah dibagikan dengan "Anyone with the link" dan memiliki izin "Viewer".';
        } else if (error.status === 404) {
            errorMessage += ` Error 404: Tidak Ditemukan. Pastikan Spreadsheet ID dan Nama Sheet ('${SHEET_NAME}') sudah benar.`;
        } else {
            errorMessage += ` Error ${error.status}: ${error.result.error.message}. Lihat konsol untuk detail lebih lanjut.`;
        }
        alert(errorMessage);
    });
}

function saveTelex(e) {
    e.preventDefault();
    const newTelex = { nomorTelex: generatedNomorTelex.value, picWidebody: '', picNarrowbody: '', remark: telexBody.value, tanggalDibuat: new Date().toISOString(), status: 'pending' };
    saveToGoogleSheets(newTelex);
    telexInputForm.style.display = 'none'; telexBody.value = '';
}

function saveToGoogleSheets(data) {
    showLoadingIndicator();
    const values = [[data.nomorTelex, data.picWidebody, data.picNarrowbody, data.remark, data.tanggalDibuat, data.status]];
    gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID, range: `${SHEET_NAME}!A:F`, valueInputOption: 'USER_ENTERED', resource: { values: values }
    }).then(function(response) { console.log('Data saved successfully'); hideLoadingIndicator(); showNotification('Data berhasil disimpan!', 'success'); loadTelexData(); }, function(error) { console.error('Error saving data:', error); alert('Gagal menyimpan data. Periksa konsol.'); hideLoadingIndicator(); });
}

function updateInGoogleSheets(data) {
    showLoadingIndicator();
    const rowIndex = telexData.findIndex(item => item.nomorTelex === data.nomorTelex) + 2;
    const values = [[data.nomorTelex, data.picWidebody, data.picNarrowbody, data.remark, data.tanggalDibuat, data.status]];
    gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID, range: `${SHEET_NAME}!A${rowIndex}:F${rowIndex}`, valueInputOption: 'USER_ENTERED', resource: { values: values }
    }).then(function(response) { console.log('Data updated successfully'); hideLoadingIndicator(); showNotification('Data berhasil diperbarui!', 'success'); loadTelexData(); }, function(error) { console.error('Error updating data:', error); alert('Gagal memperbarui data.'); hideLoadingIndicator(); });
}

function deleteFromGoogleSheets(nomorTelex) {
    showLoadingIndicator();
    const rowIndex = telexData.findIndex(item => item.nomorTelex === nomorTelex) + 2;
    gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID, range: `${SHEET_NAME}!A${rowIndex}:F${rowIndex}`
    }).then(function(response) { console.log('Data deleted successfully'); hideLoadingIndicator(); showNotification('Data berhasil dihapus!', 'success'); loadTelexData(); }, function(error) { console.error('Error deleting data:', error); alert('Gagal menghapus data.'); hideLoadingIndicator(); });
}

// --- DATA MANIPULATION & UI RENDER FUNCTIONS ---
function renderTable() {
    telexTableBody.innerHTML = ''; if (filteredData.length === 0) { const row = document.createElement('tr'); row.innerHTML = '<td colspan="8" style="text-align: center;">Tidak ada data telex</td>'; telexTableBody.appendChild(row); return; }
    filteredData.forEach((telex, index) => {
        const row = document.createElement('tr'); const statusClass = telex.status === 'done' ? 'status-done' : 'status-pending'; const statusText = telex.status === 'done' ? 'Sudah Dikerjakan' : 'Belum Dikerjakan'; const formattedDate = new Date(telex.tanggalDibuat).toLocaleDateString('id-ID');
        row.innerHTML = `<td>${index + 1}</td><td>${telex.nomorTelex}</td><td>${telex.picWidebody || '-'}</td><td>${telex.picNarrowbody || '-'}</td><td>${telex.remark}</td><td>${formattedDate}</td><td><span class="status-badge ${statusClass}">${statusText}</span></td><td><div class="action-buttons"><button class="btn-edit" onclick="editTelex('${telex.nomorTelex}')">Edit</button><button class="btn-delete" onclick="deleteTelex('${telex.nomorTelex}')">Hapus</button><button class="btn-status" onclick="toggleStatus('${telex.nomorTelex}')">${telex.status === 'done' ? 'Batal' : 'Selesai'}</button></div></td>`;
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
        row.innerHTML = `<td>${index + 1}</td><td>${telex.nomorTelex}</td><td>${telex.picWidebody || '-'}</td><td>${telex.picNarrowbody || '-'}</td><td>${telex.remark}</td><td>${formattedDate}</td><td><span class="status-badge ${statusClass}">${statusText}</span></td><td><div class="action-buttons"><button class="btn-edit" onclick="editTelex('${telex.nomorTelex}')">Edit</button><button class="btn-delete" onclick="deleteTelex('${telex.nomorTelex}')">Hapus</button><button class="btn-status" onclick="toggleStatus('${telex.nomorTelex}')">${telex.status === 'done' ? 'Batal' : 'Selesai'}</button></div></td>`;
        telexTableBody.appendChild(row);
    });
}
function editTelex(nomorTelex) {
    const telex = telexData.find(item => item.nomorTelex === nomorTelex); if (telex) { document.getElementById('editNomorTelex').value = telex.nomorTelex; document.getElementById('editPicWidebody').value = telex.picWidebody || ''; document.getElementById('editPicNarrowbody').value = telex.picNarrowbody || ''; document.getElementById('editRemark').value = telex.remark; editModal.style.display = 'block'; }
}
function saveEdit(e) {
    e.preventDefault(); const nomorTelex = document.getElementById('editNomorTelex').value; const telexIndex = telexData.findIndex(item => item.nomorTelex === nomorTelex); if (telexIndex !== -1) { telexData[telexIndex].picWidebody = document.getElementById('editPicWidebody').value; telexData[telexIndex].picNarrowbody = document.getElementById('editPicNarrowbody').value; telexData[telexIndex].remark = document.getElementById('editRemark').value; updateInGoogleSheets(telexData[telexIndex]); closeModal(); }
}
function deleteTelex(nomorTelex) {
    if (confirm(`Apakah Anda yakin ingin menghapus telex ${nomorTelex}?`)) { deleteFromGoogleSheets(nomorTelex); }
}
function toggleStatus(nomorTelex) {
    const telexIndex = telexData.findIndex(item => item.nomorTelex === nomorTelex); if (telexIndex !== -1) { telexData[telexIndex].status = telexData[telexIndex].status === 'done' ? 'pending' : 'done'; updateInGoogleSheets(telexData[telexIndex]); }
}
function closeModal() { editModal.style.display = 'none'; }
function exportToCSV() {
    let csv = 'No,Nomor Telex,PIC Widebody,PIC Narrowbody,Remark,Tanggal Dibuat,Status\n'; telexData.forEach((telex, index) => { const statusText = telex.status === 'done' ? 'Sudah Dikerjakan' : 'Belum Dikerjakan'; const formattedDate = new Date(telex.tanggalDibuat).toLocaleDateString('id-ID'); csv += `${index + 1},"${telex.nomorTelex}","${telex.picWidebody || ''}","${telex.picNarrowbody || ''}","${telex.remark}","${formattedDate}","${statusText}"\n`; });
    const blob = new Blob([csv], { type: 'text/csv' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.setAttribute('hidden', ''); a.setAttribute('href', url); a.setAttribute('download', `telex_data_${new Date().toISOString().split('T')[0]}.csv`); document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// --- HELPER FUNCTIONS ---
function showLoadingIndicator() { if (document.getElementById('loadingIndicator')) return; const loadingElement = document.createElement('div'); loadingElement.id = 'loadingIndicator'; loadingElement.className = 'loading-indicator'; loadingElement.innerHTML = '<div class="spinner"></div><p>Memuat data...</p>'; document.body.appendChild(loadingElement); }
function hideLoadingIndicator() { const loadingElement = document.getElementById('loadingIndicator'); if (loadingElement) { loadingElement.remove(); } }
function showNotification(message, type) { const notification = document.createElement('div'); notification.className = `notification ${type}`; notification.textContent = message; document.body.appendChild(notification); setTimeout(function() { notification.remove(); }, 3000); }

// --- GOOGLE API INITIALIZATION (Versi Stabil) ---
function gapiLoaded() {
    console.log("Google API script berhasil dimuat. Memulai inisialisasi client...");
    gapi.load('client:auth2', initGapiClient);
}

function initGapiClient() {
    console.log("gapi.load selesai. Memulai inisialisasi client...");
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        scope: SCOPES
    }).then(function () {
        console.log("gapi.client.init BERHASIL! Google API siap digunakan.");
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
        console.log("Status login awal:", isSignedIn);
        updateSigninStatus(isSignedIn);
    }, function(error) {
        console.error('GAGAL saat menginisialisasi GAPI client. Detail error:', error);
        alert(`Gagal memuat Google API. Error: ${error.error || 'Tidak diketahui'}. Periksa konsol (F12) dan pengaturan Google Cloud Console Anda.`);
    });
}

function updateSigninStatus(isSignedIn) {
    console.log("Status login berubah. Sekarang:", isSignedIn);
    if (isSignedIn) {
        showMainApp();
    } else {
        loginScreen.style.display = 'block';
        mainApp.style.display = 'none';
    }
}
