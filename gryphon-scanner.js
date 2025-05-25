// Variabile globale pentru scanner Gryphon
let gryphonActive = false;
let gryphonListeners = [];

// Pornește scannerul Gryphon
function startGryphonScanner() {
    if (gryphonActive) return;
    
    // Facem curățare completă înainte de a porni scannerul
    cleanupGryphonListeners();
    
    gryphonActive = true;
    const gryphonContainer = document.getElementById('gryphon-container');
    const scannerInput = document.getElementById('scanner-input');
    
    gryphonContainer.style.display = 'block';
    
    // IMPORTANT: Adaugă un handler global pentru a preveni comportamentele implicite ale browserului
    const globalKeyHandler = function(e) {
        if (gryphonActive) {
            // Previne toate shortcut-urile browserului când scannerul este activ
            e.stopPropagation();
            
            // Permite doar tastele normale și Enter, blocând combinații precum Ctrl+J
            if (e.ctrlKey || e.altKey || e.metaKey) {
                e.preventDefault();
                return false;
            }
            
            // Permite ESC pentru a închide modalul
            if (e.key === 'Escape') {
                e.preventDefault();
                stopGryphonScanner();
                return false;
            }
        }
    };
    
    // Adaugă handler-ul global cu capturing phase pentru a intercepta înainte de orice alt handler
    document.addEventListener('keydown', globalKeyHandler, true);
    gryphonListeners.push({ element: document, event: 'keydown', handler: globalKeyHandler, options: true });
    
    // Previne pierderea focusului folosind un interval mai agresiv
    window.gryphonFocusInterval = setInterval(() => {
        if (gryphonActive && document.activeElement !== scannerInput) {
            scannerInput.focus();
            
            // Golește valoarea când se reprimește focusul
            if (scannerInput.value.length > 0) {
                const savedValue = scannerInput.value;
                // Verifică dacă valoarea pare un cod QR complet
                if (savedValue.length > 20) {
                    processScannedData(savedValue);
                }
                scannerInput.value = '';
            }
        }
    }, 5); // Mai rapid pentru a preveni pierderea datelor
    
    // Focus pe input pentru a primi datele de la scanner
    setTimeout(() => {
        scannerInput.focus();
        scannerInput.value = '';
    }, 100);
    
    // Event listener pentru input de la scanner
    const inputHandler = function(event) {
        if (!gryphonActive) return;
        
        // Opriți propagarea evenimentului pentru a preveni browserul să intercepteze
        event.stopPropagation();
        event.preventDefault();
        
        const scannedData = event.target.value.trim();
        
        if (scannedData.length > 10) {
            document.getElementById('gryphon-status').textContent = 'Date primite... Procesare...';
            
            // Procesează automat după o pauză scurtă
            clearTimeout(window.gryphonTimeout);
            window.gryphonTimeout = setTimeout(() => {
                if (scannedData.length > 0 && gryphonActive) {
                    processScannedData(scannedData);
                    scannerInput.value = '';
                }
            }, 200);
        }
    };
    
    // Event listener pentru Enter (sfârșitul scanării)
    const keydownHandler = function(event) {
        if (!gryphonActive) return;
        
        // Previne comportamentul implicit al browserului
        event.stopPropagation();
        
        if (event.key === 'Enter') {
            event.preventDefault();
            
            const scannedData = scannerInput.value.trim();
            
            if (scannedData) {
                processScannedData(scannedData);
            } else {
                showNotification('Nu s-au detectat date. Încearcă din nou.', 'error');
            }
            
            scannerInput.value = '';
            return false;
        }
    };
    
    // Adaugă event listener-ii și salvează referințele pentru cleanup
    scannerInput.addEventListener('input', inputHandler);
    scannerInput.addEventListener('keydown', keydownHandler);
    
    gryphonListeners.push(
        { element: scannerInput, event: 'input', handler: inputHandler },
        { element: scannerInput, event: 'keydown', handler: keydownHandler }
    );
    
    // IMPORTANT: Previne focusul pe alte elemente în timpul scanării
    const focusHandler = function(e) {
        if (gryphonActive && e.target !== scannerInput) {
            e.preventDefault();
            e.stopPropagation();
            scannerInput.focus();
            return false;
        }
    };
    
    document.addEventListener('focus', focusHandler, true);
    gryphonListeners.push({ element: document, event: 'focus', handler: focusHandler, options: true });
    
    // IMPORTANT: Previne click-urile în timpul scanării pentru a menține focusul
    const clickHandler = function(e) {
        if (gryphonActive && e.target !== scannerInput && !e.target.closest('.btn-secondary')) {
            e.preventDefault();
            e.stopPropagation();
            scannerInput.focus();
            return false;
        }
    };
    
    document.addEventListener('click', clickHandler, true);
    gryphonListeners.push({ element: document, event: 'click', handler: clickHandler, options: true });
    
    document.getElementById('gryphon-status').textContent = 'Scanner activ - Scanează QR-ul acum!';
    showNotification('Scanner Gryphon activat! Scanează un cod QR.', 'warning');
}

// Curăță event listener-ii pentru scanner Gryphon
function cleanupGryphonListeners() {
    // Setăm întâi flag-ul pentru a preveni orice funcționalitate
    gryphonActive = false;
    
    // Curăță toți event listener-ii Gryphon
    gryphonListeners.forEach(listener => {
        // Verifică dacă avem opțiuni suplimentare (cum ar fi fase de capturing)
        if (listener.options) {
            listener.element.removeEventListener(listener.event, listener.handler, listener.options);
        } else {
            listener.element.removeEventListener(listener.event, listener.handler);
        }
    });
    gryphonListeners = [];
    
    // Oprește intervalul de focus
    if (window.gryphonFocusInterval) {
        clearInterval(window.gryphonFocusInterval);
        window.gryphonFocusInterval = null;
    }
    
    // Curăță timeout-ul
    if (window.gryphonTimeout) {
        clearTimeout(window.gryphonTimeout);
        window.gryphonTimeout = null;
    }
    
    // Resetează input-ul scannerului
    const scannerInput = document.getElementById('scanner-input');
    if (scannerInput) {
        scannerInput.value = '';
    }
}

// Oprește scannerul Gryphon
function stopGryphonScanner() {
    // Setăm flag-ul înainte de orice
    gryphonActive = false;
    
    const gryphonContainer = document.getElementById('gryphon-container');
    
    // Ascundem container-ul
    if (gryphonContainer) {
        gryphonContainer.style.display = 'none';
    }
    
    // Curăță toate listener-urile
    cleanupGryphonListeners();
    
    // Returnează focus la body
    document.body.focus();
}

// Procesează datele scanate
function processScannedData(scannedData) {
    // Asigurăm curățarea completă pentru a preveni interferența cu browserul
    const isAlreadyProcessing = document.getElementById('debug-info').classList.contains('show');
    if (isAlreadyProcessing) {
        // Evităm procesarea multiplă dacă datele sunt deja în procesare
        console.log('Evităm procesarea multiplă a acelorași date');
        return;
    }
    
    // Afișează informațiile de debug
    const debugInfo = document.getElementById('debug-info');
    const debugContent = document.getElementById('debug-content');
    debugContent.innerHTML = `
        <strong>Date scanate brute:</strong><br>
        ${scannedData}<br><br>
        <strong>Lungime:</strong> ${scannedData.length} caractere<br>
        <strong>Tip:</strong> ${typeof scannedData}
    `;
    debugInfo.classList.add('show');
    
    try {
        populateFormFromQR(scannedData);
        stopGryphonScanner();
        showNotification('QR scanat cu succes cu Gryphon! 🎉');
    } catch (error) {
        console.error('Eroare parsare:', error);
        showNotification(`Eroare procesare: ${error.message}`, 'error');
        
        // Menține scannerul activ pentru reîncercare
        document.getElementById('gryphon-status').textContent = 'Eroare parsare - încearcă din nou';
        const scannerInput = document.getElementById('scanner-input');
        if (scannerInput) {
            scannerInput.value = '';
            scannerInput.focus();
        }
    }
}

// Simulează scanarea unui QR (pentru testare)
function simulateQRScan() {
    // Test cu date reale incluzând formatul de locație și bucăți
    const testQRData = `R_DIM_C24_PL_50000x600x80 | 125
A-1-0`;
    
    try {
        populateFormFromQR(testQRData);
        showNotification('QR test scanat cu succes!');
    } catch (error) {
        showNotification(`Eroare test: ${error.message}`, 'error');
    }
}

// Adăugați această funcție pentru a testa formatul complex
function simulateComplexQRScan() {
    // Format complex cu multiple dimensiuni și locație
    const testQRData = `R_SF_BSH_GL24h_PL_10000x250x150 | 444R_SF_BSH_GL24h_PL_10000x250x200 | 555R_SF_BSH_GL24h_PL_15000x250x100 | 333R_SF_BSH_GL24h_PL_15000x150x140 | 222A-1-0`;
    
    try {
        populateFormFromQR(testQRData);
        showNotification('QR complex scanat cu succes! 🎉');
    } catch (error) {
        console.error('Eroare parsare QR complex:', error);
        showNotification(`Eroare test complex: ${error.message}`, 'error');
    }
}