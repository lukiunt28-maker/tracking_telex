// script.js
// Google Sheets Configuration
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // Ganti dengan ID Spreadsheet Anda
const SHEET_NAME = 'TelexData'; // Nama sheet yang akan digunakan
const CLIENT_ID = 'YOUR_CLIENT_ID'; // Ganti dengan Client ID dari Google Cloud Console
const API_KEY = 'YOUR_API_KEY'; // Ganti dengan API Key dari Google Cloud Console
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

// Dashboard Elements
const totalCount = document.getElementById('totalCount');
const pendingCount = document.getElementById('pendingCount');
const doneCount = document.getElementById('doneCount');
const progressPercent = document.getElementById('progressPercent');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
    }
    
    // Event Listeners
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
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
        if (e.target === editModal) {
            closeModal();
        }
    });
    
    // Initialize Google API
    gapiLoaded();
});

// Login Function
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    // Simple authentication (in real app, this should be validated against a backend)
    if (username && password) {
        currentUser = {
            username: username,
            initials: username.substring(0, 2).toUpperCase()
        };
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showMainApp();
    } else {
        alert('Username dan password harus diisi!');
    }
}

// Logout Function
function handleLogout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    loginScreen.style.display = 'block';
    mainApp.style.display = 'none';
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

// Show Main App
function showMainApp() {
    loginScreen.style.display = 'none';
    mainApp.style.display = 'block';
    userInitials.textContent = currentUser.initials;
    
    // Load data from Google Sheets
    loadTelexData();
}

// Show Telex Form
function showTelexForm() {
    // Generate new telex number
    const today = new Date();
    const dateStr = today.getFullYear().toString() + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    
    // Get the last number from the data
    let lastNumber = 0;
    if (telexData.length > 0) {
        const todayNumbers = telexData.filter(item => 
            item.nomorTelex && item.nomorTelex.startsWith(dateStr)
        );
        
        if (todayNumbers.length > 0) {
            const lastTelex = todayNumbers.reduce((prev, current) => 
                (prev.nomorTelex > current.nomorTelex) ? prev : current
            );
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

// Save Telex
function saveTelex(e) {
    e.preventDefault();
    
    const newTelex = {
        nomorTelex: generatedNomorTelex.value,
        picWidebody: '',
        picNarrowbody: '',
        remark: telexBody.value,
        tanggalDibuat: new Date().toISOString(),
        status: 'pending'
    };
    
    // Add to data array
    telexData.push(newTelex);
    
    // Save to Google Sheets
    saveToGoogleSheets(newTelex);
    
    // Reset form
    telexInputForm.style.display = 'none';
    telexBody.value = '';
    
    // Refresh table
    renderTable();
    updateDashboard();
}

// Load Telex Data from Google Sheets
function loadTelexData() {
    // In a real implementation, this would fetch data from Google Sheets
    // For now, we'll use mock data
    telexData = [
        {
            nomorTelex: 'TLX-20230501-001',
            picWidebody: 'John Doe',
            picNarrowbody: 'Jane Smith',
            remark: 'Sample telex message for testing purposes',
            tanggalDibuat: '2023-05-01T10:30:00.000Z',
            status: 'done'
        },
        {
            nomorTelex: 'TLX-20230501-002',
            picWidebody: 'Alice Johnson',
            picNarrowbody: '',
            remark: 'Another sample telex message',
            tanggalDibuat: '2023-05-01T14:15:00.000Z',
            status: 'pending'
        }
    ];
    
    filteredData = [...telexData];
    renderTable();
    updateDashboard();
}

// Save to Google Sheets
function saveToGoogleSheets(data) {
    // In a real implementation, this would save data to Google Sheets
    console.log('Saving to Google Sheets:', data);
}

// Render Table
function renderTable() {
    telexTableBody.innerHTML = '';
    
    if (filteredData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="8" style="text-align: center;">Tidak ada data telex</td>';
        telexTableBody.appendChild(row);
        return;
    }
    
    filteredData.forEach((telex, index) => {
        const row = document.createElement('tr');
        
        const statusClass = telex.status === 'done' ? 'status-done' : 'status-pending';
        const statusText = telex.status === 'done' ? 'Sudah Dikerjakan' : 'Belum Dikerjakan';
        
        const formattedDate = new Date(telex.tanggalDibuat).toLocaleDateString('id-ID');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${telex.nomorTelex}</td>
            <td>${telex.picWidebody || '-'}</td>
            <td>${telex.picNarrowbody || '-'}</td>
            <td>${telex.remark}</td>
            <td>${formattedDate}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editTelex('${telex.nomorTelex}')">Edit</button>
                    <button class="btn-delete" onclick="deleteTelex('${telex.nomorTelex}')">Hapus</button>
                    <button class="btn-status" onclick="toggleStatus('${telex.nomorTelex}')">
                        ${telex.status === 'done' ? 'Batal' : 'Selesai'}
                    </button>
                </div>
            </td>
        `;
        
        telexTableBody.appendChild(row);
    });
}

// Update Dashboard
function updateDashboard() {
    const total = telexData.length;
    const pending = telexData.filter(item => item.status === 'pending').length;
    const done = telexData.filter(item => item.status === 'done').length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    
    totalCount.textContent = total;
    pendingCount.textContent = pending;
    doneCount.textContent = done;
    progressPercent.textContent = `${progress}%`;
}

// Search Function
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase();
    
    if (searchTerm === '') {
        filteredData = [...telexData];
    } else {
        filteredData = telexData.filter(telex => 
            telex.nomorTelex.toLowerCase().includes(searchTerm) ||
            (telex.picWidebody && telex.picWidebody.toLowerCase().includes(searchTerm)) ||
            (telex.picNarrowbody && telex.picNarrowbody.toLowerCase().includes(searchTerm)) ||
            telex.remark.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply current filter
    filterData();
}

// Clear Search
function clearSearch() {
    searchInput.value = '';
    filteredData = [...telexData];
    filterData();
}

// Filter Data
function filterData() {
    let tempData = [...filteredData];
    
    if (currentFilter !== 'all') {
        tempData = tempData.filter(telex => telex.status === currentFilter);
    }
    
    // Re-render table with filtered data
    telexTableBody.innerHTML = '';
    
    if (tempData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="8" style="text-align: center;">Tidak ada data telex</td>';
        telexTableBody.appendChild(row);
        return;
    }
    
    tempData.forEach((telex, index) => {
        const row = document.createElement('tr');
        
        const statusClass = telex.status === 'done' ? 'status-done' : 'status-pending';
        const statusText = telex.status === 'done' ? 'Sudah Dikerjakan' : 'Belum Dikerjakan';
        
        const formattedDate = new Date(telex.tanggalDibuat).toLocaleDateString('id-ID');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${telex.nomorTelex}</td>
            <td>${telex.picWidebody || '-'}</td>
            <td>${telex.picNarrowbody || '-'}</td>
            <td>${telex.remark}</td>
            <td>${formattedDate}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editTelex('${telex.nomorTelex}')">Edit</button>
                    <button class="btn-delete" onclick="deleteTelex('${telex.nomorTelex}')">Hapus</button>
                    <button class="btn-status" onclick="toggleStatus('${telex.nomorTelex}')">
                        ${telex.status === 'done' ? 'Batal' : 'Selesai'}
                    </button>
                </div>
            </td>
        `;
        
        telexTableBody.appendChild(row);
    });
}

// Edit Telex
function editTelex(nomorTelex) {
    const telex = telexData.find(item => item.nomorTelex === nomorTelex);
    
    if (telex) {
        document.getElementById('editNomorTelex').value = telex.nomorTelex;
        document.getElementById('editPicWidebody').value = telex.picWidebody || '';
        document.getElementById('editPicNarrowbody').value = telex.picNarrowbody || '';
        document.getElementById('editRemark').value = telex.remark;
        
        editModal.style.display = 'block';
    }
}

// Save Edit
function saveEdit(e) {
    e.preventDefault();
    
    const nomorTelex = document.getElementById('editNomorTelex').value;
    const telexIndex = telexData.findIndex(item => item.nomorTelex === nomorTelex);
    
    if (telexIndex !== -1) {
        telexData[telexIndex].picWidebody = document.getElementById('editPicWidebody').value;
        telexData[telexIndex].picNarrowbody = document.getElementById('editPicNarrowbody').value;
        telexData[telexIndex].remark = document.getElementById('editRemark').value;
        
        // Update in Google Sheets
        updateInGoogleSheets(telexData[telexIndex]);
        
        // Refresh table
        renderTable();
        
        // Close modal
        closeModal();
    }
}

// Delete Telex
function deleteTelex(nomorTelex) {
    if (confirm(`Apakah Anda yakin ingin menghapus telex ${nomorTelex}?`)) {
        const telexIndex = telexData.findIndex(item => item.nomorTelex === nomorTelex);
        
        if (telexIndex !== -1) {
            // Delete from Google Sheets
            deleteFromGoogleSheets(nomorTelex);
            
            // Remove from array
            telexData.splice(telexIndex, 1);
            
            // Refresh table
            filteredData = [...telexData];
            filterData();
            updateDashboard();
        }
    }
}

// Toggle Status
function toggleStatus(nomorTelex) {
    const telexIndex = telexData.findIndex(item => item.nomorTelex === nomorTelex);
    
    if (telexIndex !== -1) {
        telexData[telexIndex].status = telexData[telexIndex].status === 'done' ? 'pending' : 'done';
        
        // Update in Google Sheets
        updateInGoogleSheets(telexData[telexIndex]);
        
        // Refresh table
        renderTable();
        updateDashboard();
    }
}

// Close Modal
function closeModal() {
    editModal.style.display = 'none';
}

// Export to CSV
function exportToCSV() {
    let csv = 'No,Nomor Telex,PIC Widebody,PIC Narrowbody,Remark,Tanggal Dibuat,Status\n';
    
    telexData.forEach((telex, index) => {
        const statusText = telex.status === 'done' ? 'Sudah Dikerjakan' : 'Belum Dikerjakan';
        const formattedDate = new Date(telex.tanggalDibuat).toLocaleDateString('id-ID');
        
        csv += `${index + 1},"${telex.nomorTelex}","${telex.picWidebody || ''}","${telex.picNarrowbody || ''}","${telex.remark}","${formattedDate}","${statusText}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `telex_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Google Sheets API Functions
function gapiLoaded() {
    gapi.load('client:auth2', initGapiClient);
}

function initGapiClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        scope: SCOPES
    }).then(function() {
        // In a real implementation, you would handle authentication here
        console.log('Google API initialized');
    }, function(error) {
        console.error('Error initializing Google API:', error);
    });
}

// In a real implementation, these functions would interact with Google Sheets
function updateInGoogleSheets(data) {
    console.log('Updating in Google Sheets:', data);
}

function deleteFromGoogleSheets(nomorTelex) {
    console.log('Deleting from Google Sheets:', nomorTelex);
}

