// Adăugăm un event listener pentru taste la nivel de document
document.addEventListener('keydown', function(event) {
    // Ignoră scurtăturile dacă un input are focus
    if (document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.isContentEditable) {
        return;
    }
    
    // F8 pentru activarea scannerului Gryphon
    if (event.key === 'F8') {
        event.preventDefault();
        startGryphonScanner();
    }
    
    // Ctrl+G pentru activarea scannerului Gryphon (alternativă)
    if (event.ctrlKey && event.key.toLowerCase() === 'g') {
        event.preventDefault();
        startGryphonScanner();
    }
});

// Adăugăm informații despre scurtătura de tastatură lângă butonul Gryphon
document.addEventListener('DOMContentLoaded', function() {
    const gryphonButton = document.querySelector('.btn-gryphon');
    
    if (gryphonButton) {
        // Adăugăm un mic indicator de scurtătură
        const shortcutLabel = document.createElement('span');
        shortcutLabel.className = 'shortcut-label';
        shortcutLabel.textContent = '[F8]';
        shortcutLabel.style.fontSize = '12px';
        shortcutLabel.style.marginLeft = '5px';
        shortcutLabel.style.opacity = '0.7';
        
        gryphonButton.appendChild(shortcutLabel);
    }
});