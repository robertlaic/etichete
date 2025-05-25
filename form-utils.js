// Variabile globale pentru dimensiuni adiționale
let additionalDimensions = [];

// Actualizează opțiunile pentru nume în funcție de tipul selectat
function updateNumeOptions() {
    const tipSelect = document.getElementById('tip');
    const numeSelect = document.getElementById('nume');
    
    if (!tipSelect || !numeSelect) return;
    
    const selectedTip = tipSelect.value;
    const currentSelection = numeSelect.value;
    
    numeSelect.innerHTML = '<option value="">Selectează...</option>';
    
    if (selectedTip === 'DIM' || selectedTip === 'DIV') {
        numeSelect.innerHTML += '<option value="C24">C24</option>';
    } else if (selectedTip === 'SF') {
        const sfOptions = [
            'KVH_C24', 'DUO_C24', 'BSH_GL24h', 'DK', 'ARC', 
            'Lam_NF', 'Lam_NFA', 'Lam_NFC', 'Lam_NFD', 'Lam_NFF', 
            'Lam_NFS', 'Lam_D', 'Lam_P', 'PL', 'FRIZ_C24', 'Lam_Duo'
        ];
        
        sfOptions.forEach(option => {
            numeSelect.innerHTML += `<option value="${option}">${option}</option>`;
        });
    } else {
        const allOptions = [
            'C24', 'KVH_C24', 'DUO_C24', 'BSH_GL24h', 'DK', 'ARC',
            'Lam_NF', 'Lam_NFA', 'Lam_NFC', 'Lam_NFD', 'Lam_NFF',
            'Lam_NFS', 'Lam_D', 'Lam_P', 'PL', 'FRIZ_C24', 'Lam_Duo'
        ];
        
        allOptions.forEach(option => {
            numeSelect.innerHTML += `<option value="${option}">${option}</option>`;
        });
    }
    
    if (currentSelection && numeSelect.querySelector(`option[value="${currentSelection}"]`)) {
        numeSelect.value = currentSelection;
    }
}

// Adaugă o dimensiune adițională
function addDimension() {
    if (additionalDimensions.length >= 3) {
        showNotification('Maxim 3 dimensiuni adiționale!', 'error');
        return;
    }
    
    const id = Date.now();
    additionalDimensions.push({
        id: id,
        L: '',
        l: '',
        G: '',
        bucati: ''
    });
    
    renderDimensionsList();
}

// Șterge o dimensiune adițională
function removeDimension(id) {
    additionalDimensions = additionalDimensions.filter(d => d.id !== id);
    renderDimensionsList();
}

// Actualizează o dimensiune adițională
function updateDimension(id, field, value) {
    const dim = additionalDimensions.find(d => d.id === id);
    if (dim) {
        dim[field] = value;
    }
}

// Afișează lista de dimensiuni adiționale
function renderDimensionsList() {
    const container = document.getElementById('dimensions-list');
    container.innerHTML = '';
    
    additionalDimensions.forEach(dim => {
        const item = document.createElement('div');
        item.className = 'dimension-item';
        item.innerHTML = `
            <input type="number" placeholder="L" value="${dim.L}" onchange="updateDimension(${dim.id}, 'L', this.value)">
            <span>x</span>
            <input type="number" placeholder="l" value="${dim.l}" onchange="updateDimension(${dim.id}, 'l', this.value)">
            <span>x</span>
            <input type="number" placeholder="G" value="${dim.G}" onchange="updateDimension(${dim.id}, 'G', this.value)">
            <span style="margin: 0 10px;">-</span>
            <input type="number" placeholder="Bucăți" value="${dim.bucati}" onchange="updateDimension(${dim.id}, 'bucati', this.value)" style="width: 100px;">
            <button class="btn-remove" onclick="removeDimension(${dim.id})">Șterge</button>
        `;
        container.appendChild(item);
    });
}

// Generează previzualizarea etichetei
// Modificare funcția generatePreview pentru a crea coduri QR optimizate
function generatePreview() {
    const specia = document.getElementById('specia').value;
    const tip = document.getElementById('tip').value;
    const nume = document.getElementById('nume').value;
    const calitate = document.getElementById('calitate').value;
    const lungime = document.getElementById('lungime').value;
    const latime = document.getElementById('latime').value;
    const grosime = document.getElementById('grosime').value;
    const bucati = document.getElementById('bucati').value;
    const perete = document.getElementById('perete').value;
    const coloana = document.getElementById('coloana').value;
    const rand = document.getElementById('rand').value;
    
    if (!specia || !tip || !nume || !calitate || !lungime || !latime || !grosime || !bucati) {
        showNotification('Vă rugăm completați toate câmpurile obligatorii!', 'error');
        return;
    }
    
    const mainLabel = `${specia}_${tip}_${nume}_${calitate}`;
    const mainDimension = `${lungime}x${latime}x${grosime}`;
    
    const labelContent = document.getElementById('label-content');
    labelContent.textContent = mainLabel;
    
    const dimensionsContent = document.getElementById('label-dimensions');
    let dimensionsHTML = `${mainDimension} - ${bucati} BUC`;
    
    additionalDimensions.forEach(dim => {
        if (dim.L && dim.l && dim.G && dim.bucati) {
            dimensionsHTML += `<br>${dim.L}x${dim.l}x${dim.G} - ${dim.bucati} BUC`;
        }
    });
    
    dimensionsContent.innerHTML = dimensionsHTML;
    
    const qrContainer = document.getElementById('qr-container');
    qrContainer.innerHTML = '';
    
    // Format QR optimizat: COD|DIMENSIUNE|BUCATI|DIMENSIUNE2|BUCATI2|...|LOCATIE
    let qrParts = [
        mainLabel,                  // COD
        mainDimension,              // DIMENSIUNE
        bucati                      // BUCATI
    ];
    
    // Adăugăm dimensiunile adiționale
    additionalDimensions.forEach(dim => {
        if (dim.L && dim.l && dim.G && dim.bucati) {
            qrParts.push(`${dim.L}x${dim.l}x${dim.G}`);  // DIMENSIUNE ADITIONALA
            qrParts.push(dim.bucati);                    // BUCATI ADITIONALA
        }
    });
    
    // Adăugăm locația la sfârșit dacă există
    if (perete && coloana && rand) {
        qrParts.push(`${perete}-${coloana}-${rand}`);    // LOCATIE
    }
    
    // Construim codul QR cu separatorul |
    const qrData = qrParts.join('|');
    console.log('Cod QR optimizat generat:', qrData);
    
    new QRCode(qrContainer, {
        text: qrData,
        width: 150,
        height: 150,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    
    const locationLabel = document.getElementById('location-label');
    if (perete && coloana && rand) {
        locationLabel.textContent = `Locație etichetă: ${perete}-${coloana}-${rand}`;
        locationLabel.style.display = 'block';
    } else {
        locationLabel.style.display = 'none';
    }
    
    document.getElementById('preview-container').style.display = 'block';
    showNotification('Previzualizare generată cu succes!');
}

// Resetează toate câmpurile formularului
function clearForm() {
    document.getElementById('specia').value = '';
    document.getElementById('tip').value = '';
    document.getElementById('nume').value = '';
    document.getElementById('calitate').value = '';
    document.getElementById('lungime').value = '';
    document.getElementById('latime').value = '';
    document.getElementById('grosime').value = '';
    document.getElementById('bucati').value = '';
    document.getElementById('perete').value = '';
    document.getElementById('coloana').value = '';
    document.getElementById('rand').value = '';
    additionalDimensions = [];
    renderDimensionsList();
    document.getElementById('preview-container').style.display = 'none';
    document.getElementById('debug-info').classList.remove('show');
    showNotification('Formularul a fost resetat!');
}

// Tipărește eticheta
function printLabel() {
    const previewContainer = document.getElementById('preview-container');
    const labelPreview = document.getElementById('label-preview');
    
    if (!labelPreview || previewContainer.style.display === 'none') {
        showNotification('Vă rugăm să generați mai întâi previzualizarea!', 'error');
        return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Etichetă</title>
            <style>
                @page { size: A4 landscape; margin: 0; }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { width: 297mm; height: 210mm; margin: 0; padding: 0; background: white; font-family: Arial, sans-serif; overflow: hidden; }
                .print-label { width: 297mm; height: 210mm; padding: 40px; position: relative; background: white; }
                .label-content { font-family: Arial, sans-serif; font-size: 96px; font-weight: bold; line-height: 1.3; }
                .label-dimensions { margin-top: 40px; font-size: 72px; line-height: 1.5; }
                .qr-container { position: absolute; bottom: 100px; right: 40px; border: 2px solid #333; padding: 8px; background: white; }
                .location-label { position: absolute; bottom: 40px; right: 40px; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; color: #333; background: white; padding: 10px; border: 2px solid #333; min-width: 200px; }
            </style>
        </head>
        <body>
            <div class="print-label">${labelPreview.innerHTML}</div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 100);
    };
}

// Afișează o notificare
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}