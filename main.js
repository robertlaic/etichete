// Event listeners pentru aplicație

// Ascultător pentru tasta Escape pentru a închide modalele
document.addEventListener('keydown', function(e) {
    // Doar ESC pentru închiderea modalelor - fără alte shortcut-uri
    if (e.key === 'Escape') {
        stopCameraScanner();
        stopGryphonScanner();
    }
});

// Inițializare la încărcarea documentului
document.addEventListener('DOMContentLoaded', function() {
    showNotification('Aplicația s-a încărcat cu succes! 🚀');
    
    const tipSelect = document.getElementById('tip');
    if (tipSelect) {
        tipSelect.addEventListener('change', updateNumeOptions);
    }
    
    // Test scannerul
    setTimeout(() => {
        showNotification('Scanner Gryphon gata de utilizare!', 'warning');
    }, 1000);
});

// Expune funcțiile pentru onClick events în window
window.updateNumeOptions = updateNumeOptions;
window.generatePreview = generatePreview;
window.startGryphonScanner = startGryphonScanner;
window.startCameraScanner = startCameraScanner;
window.addDimension = addDimension;
window.removeDimension = removeDimension;
window.updateDimension = updateDimension;
window.clearForm = clearForm;
window.stopGryphonScanner = stopGryphonScanner;
window.stopCameraScanner = stopCameraScanner;
window.switchCamera = switchCamera;
window.simulateQRScan = simulateQRScan;
window.simulateComplexQRScan=simulateComplexQRScan;
window.printLabel = printLabel;