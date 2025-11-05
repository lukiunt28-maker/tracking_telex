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
