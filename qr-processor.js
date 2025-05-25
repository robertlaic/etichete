// Funcție pentru popularea formularului din datele QR
function populateFormFromQR(qrData) {
    console.log('QR Data primit:', qrData);
    
    // Curăță datele - înlocuiește diverse separatoare cu |
    let cleanedData = qrData
        .replace(/Â/g, '|')
        .replace(/\s+\|\s+/g, '|')
        .replace(/\s+\|\s*/g, '|')
        .replace(/\s*\|\s+/g, '|')
        .trim();
    
    console.log('Date curățate:', cleanedData);
    
    // Împarte în linii și filtrează liniile goale
    const lines = cleanedData.split('\n').filter(line => line.trim() !== '');
    console.log('Linii filtrate:', lines);
    
    clearForm();
    
    if (lines.length === 0) {
        throw new Error('Date QR goale după curățare');
    }
    
    // Procesăm linia principală - presupunem că toate datele sunt pe o singură linie
    const mainLine = lines[0];
    
    // ===== DETECTARE VECHI FORMAT =====
    // Verificăm dacă este formatul vechi (pentru compatibilitate)
    const isOldFormat = !mainLine.match(/^[A-Z]_.*\|\d+x\d+x\d+\|\d+/);
    
    if (isOldFormat) {
        console.log('Detectat format vechi QR, încercăm să procesăm compatibil...');
        return processOldFormatQR(qrData);
    }
    
    // ===== PROCESARE FORMAT NOU =====
    console.log('Procesare format nou standardizat:', mainLine);
    
    // Împărțim linia pe separatorul |
    const parts = mainLine.split('|');
    console.log('Părți separate:', parts);
    
    if (parts.length < 3) {
        throw new Error('Format QR invalid: sunt necesare minim cod produs, dimensiune și bucăți');
    }
    
    // Extragem informațiile de bază
    const productCode = parts[0].trim();      // Cod produs (R_DIM_C24_PL)
    const mainDimension = parts[1].trim();    // Dimensiune principală (50000x600x80)
    const mainQuantity = parts[2].trim();     // Bucăți pentru dimensiunea principală
    
    console.log('Cod produs:', productCode);
    console.log('Dimensiune principală:', mainDimension);
    console.log('Bucăți principale:', mainQuantity);
    
    // Parsăm codul produsului
    const productParts = productCode.split('_').filter(p => p.length > 0);
    if (productParts.length < 3) {
        throw new Error(`Format cod produs insuficient: găsite ${productParts.length} părți, trebuie minim 3`);
    }
    
    // Extragem componentele produsului
    const specia = productParts[0];
    const tip = productParts[1];
    const calitate = productParts[productParts.length - 1];
    const numeParts = productParts.slice(2, -1);
    const nume = numeParts.length > 0 ? numeParts.join('_') : productParts[2];
    
    console.log('Componente produs:', { specia, tip, nume, calitate });
    
    // Parsăm dimensiunea principală
    const dimensionMatch = mainDimension.match(/(\d+)x(\d+)x(\d+)$/);
    if (!dimensionMatch) {
        throw new Error('Format dimensiune invalid: trebuie să fie în formatul LxlxG');
    }
    
    const [, lungime, latime, grosime] = dimensionMatch;
    console.log('Dimensiuni extrase:', { lungime, latime, grosime });
    
    // Extragem dimensiunile adiționale
    const additionalDims = [];
    
    // Parcurgem părțile rămase pentru a extrage dimensiunile adiționale și locația
    // Începem de la index 3 (după cod produs, dimensiune principală și bucăți)
    let locationFound = false;
    let perete = '', coloana = '', rand = '';
    
    for (let i = 3; i < parts.length; i += 2) {
        // Verificăm dacă am ajuns la ultima parte și dacă pare a fi o locație
        if (i === parts.length - 1) {
            const locationMatch = parts[i].match(/^([A-G])-(\d+)-(\d+)$/);
            if (locationMatch) {
                [, perete, coloana, rand] = locationMatch;
                locationFound = true;
                console.log('Locație găsită:', { perete, coloana, rand });
                break;
            }
        }
        
        // Verificăm dacă avem atât dimensiunea cât și bucățile
        if (i + 1 < parts.length) {
            const dimPart = parts[i].trim();
            const qtyPart = parts[i + 1].trim();
            
            // Verificăm dacă dimensiunea este validă
            const addDimMatch = dimPart.match(/(\d+)x(\d+)x(\d+)$/);
            if (addDimMatch && !isNaN(qtyPart)) {
                const [, L, l, G] = addDimMatch;
                additionalDims.push({
                    id: Date.now() + i,
                    L: L,
                    l: l,
                    G: G,
                    bucati: qtyPart
                });
                
                console.log(`Dimensiune adițională ${additionalDims.length} detectată:`, { 
                    L, l, G, bucati: qtyPart 
                });
            }
        }
    }
    
    console.log('Dimensiuni adiționale detectate:', additionalDims);
    console.log('Locație finală detectată:', { perete, coloana, rand, locationFound });
    
    // ===== POPULARE FORMULAR =====
    // Completăm formularul cu datele extrase
    document.getElementById('specia').value = specia;
    document.getElementById('tip').value = tip;
    
    // Actualizează opțiunile pentru nume
    updateNumeOptions();
    
    setTimeout(() => {
        const numeSelect = document.getElementById('nume');
        const numeOption = numeSelect.querySelector(`option[value="${nume}"]`);
        if (numeOption) {
            numeSelect.value = nume;
        } else if (nume) {
            // Adaugă opțiunea dacă nu există
            const newOption = document.createElement('option');
            newOption.value = nume;
            newOption.textContent = nume;
            numeSelect.appendChild(newOption);
            numeSelect.value = nume;
        }
    }, 50);
    
    document.getElementById('calitate').value = calitate;
    document.getElementById('lungime').value = lungime;
    document.getElementById('latime').value = latime;
    document.getElementById('grosime').value = grosime;
    
    // Setează bucățile principale
    if (mainQuantity && !isNaN(mainQuantity)) {
        document.getElementById('bucati').value = mainQuantity;
    }
    
    // Setăm dimensiunile adiționale
    additionalDimensions = additionalDims;
    renderDimensionsList();
    
    // Setează locația dacă există
    if (perete && coloana && rand) {
        console.log('Setăm locația în formular:', { perete, coloana, rand });
        
        setTimeout(() => {
            try {
                const pereteSelect = document.getElementById('perete');
                const coloanaSelect = document.getElementById('coloana');
                const randSelect = document.getElementById('rand');
                
                // Verifică dacă valorile există în liste
                const pereteExists = Array.from(pereteSelect.options).some(opt => opt.value === perete);
                const coloanaExists = Array.from(coloanaSelect.options).some(opt => opt.value === coloana);
                const randExists = Array.from(randSelect.options).some(opt => opt.value === rand);
                
                console.log('Valori existente în select-uri:', { pereteExists, coloanaExists, randExists });
                
                // Setează valorile sau adaugă opțiuni noi
                if (pereteExists) {
                    pereteSelect.value = perete;
                } else {
                    const newOption = document.createElement('option');
                    newOption.value = perete;
                    newOption.textContent = perete;
                    pereteSelect.appendChild(newOption);
                    pereteSelect.value = perete;
                }
                
                if (coloanaExists) {
                    coloanaSelect.value = coloana;
                } else {
                    const newOption = document.createElement('option');
                    newOption.value = coloana;
                    newOption.textContent = coloana;
                    coloanaSelect.appendChild(newOption);
                    coloanaSelect.value = coloana;
                }
                
                if (randExists) {
                    randSelect.value = rand;
                } else {
                    const newOption = document.createElement('option');
                    newOption.value = rand;
                    newOption.textContent = rand;
                    randSelect.appendChild(newOption);
                    randSelect.value = rand;
                }
                
                console.log('Valori după setare:', {
                    perete: pereteSelect.value,
                    coloana: coloanaSelect.value,
                    rand: randSelect.value
                });
            } catch (err) {
                console.error('Eroare la setarea locației:', err);
            }
        }, 100);
    }
    
    // Generăm previzualizarea
    setTimeout(generatePreview, 300);
}

// Funcție pentru procesarea formatului vechi (compatibilitate)
function processOldFormatQR(qrData) {
    // Curăță datele - înlocuiește diverse separatoare cu |
    let cleanedData = qrData
        .replace(/Â/g, '|')
        .replace(/\s+\|\s+/g, '|')
        .replace(/\s+\|\s*/g, '|')
        .replace(/\s*\|\s+/g, '|')
        .trim();
    
    // Împarte în linii
    const lines = cleanedData.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
        throw new Error('Date QR goale după curățare');
    }
    
    // ===== PROCESARE LOCAȚIE =====
    // Verifică mai întâi dacă există o linie de locație separată (formatul: A-1-0)
    let perete = '', coloana = '', rand = '';
    let locationFound = false;
    
    // Caută locația în ultimele caractere ale ultimei linii
    const lastLine = lines[lines.length - 1];
    const locationPattern = /([A-G])-(\d+)-(\d+)$/;
    const locationMatch = lastLine.match(locationPattern);
    
    if (locationMatch) {
        [, perete, coloana, rand] = locationMatch;
        locationFound = true;
        console.log('Locație găsită la sfârșitul ultimei linii:', { perete, coloana, rand });
        
        // Curăță ultima linie de pattern-ul locației
        lines[lines.length - 1] = lastLine.replace(locationPattern, '').trim();
        
        // Dacă ultima linie este goală după îndepărtarea locației, o eliminăm
        if (lines[lines.length - 1] === '') {
            lines.pop();
        }
    }
    
    // Verificăm dacă există linii separate pentru locație
    for (let i = 0; i < lines.length; i++) {
        const separateLocationPattern = /^([A-G])-(\d+)-(\d+)$/;
        const separateLocationMatch = lines[i].trim().match(separateLocationPattern);
        
        if (separateLocationMatch) {
            [, perete, coloana, rand] = separateLocationMatch;
            lines.splice(i, 1); // Elimină linia de locație
            locationFound = true;
            console.log('Locație găsită pe linie separată:', { perete, coloana, rand });
            break;
        }
    }
    
    // Verificăm dacă avem o linie complexă cu multiple dimensiuni și produse
    const mainLine = lines[0];
    console.log('Linia principală pentru procesare:', mainLine);
    
    // Împărțim linia principală pe pipe (|) pentru a extrage fiecare pereche produs-bucăți
    const productParts = mainLine.split('|');
    console.log('Părți separate pe pipe:', productParts);
    
    if (productParts.length === 0) {
        throw new Error('Nu s-au găsit părți valide în codul QR');
    }
    
    // Procesăm prima parte pentru dimensiunea principală
    let firstPart = productParts[0].trim();
    let bucatiPart = '';
    
    // Verifică dacă există un număr la sfârșitul primei părți (de ex: "...PL_10000x250x150 444")
    const firstBucatiMatch = firstPart.match(/\s+(\d+)$/);
    if (firstBucatiMatch) {
        bucatiPart = firstBucatiMatch[1];
        firstPart = firstPart.substring(0, firstPart.length - bucatiPart.length).trim();
    } 
    // Dacă nu găsim numărul la sfârșitul primei părți, verificăm dacă este în a doua parte
    else if (productParts.length > 1) {
        const secondPart = productParts[1].trim();
        const secondBucatiMatch = secondPart.match(/^(\d+)/);
        if (secondBucatiMatch && !secondPart.includes('x')) {
            bucatiPart = secondBucatiMatch[1];
            console.log('Bucăți găsite în a doua parte:', bucatiPart);
            
            // Dacă a doua parte conține doar numărul de bucăți, o eliminăm din listă
            if (secondPart === bucatiPart) {
                productParts.splice(1, 1);
            }
        }
    }
    
    console.log('Prima parte:', firstPart);
    console.log('Bucăți pentru prima parte:', bucatiPart);
    
    // Extragem dimensiunea din prima parte
    const dimensionMatch = firstPart.match(/(\d+)x(\d+)x(\d+)$/);
    if (!dimensionMatch) {
        throw new Error('Nu s-au găsit dimensiuni în format valid (LxlxG) în prima parte');
    }
    
    const [, lungime, latime, grosime] = dimensionMatch;
    console.log('Dimensiuni principale:', { lungime, latime, grosime });
    
    // Elimină dimensiunile din firstPart
    const withoutDimensions = firstPart.replace(/_?\d+x\d+x\d+$/, '');
    console.log('Informații etichetă fără dimensiuni:', withoutDimensions);
    
    // Împarte pe underscore pentru a extrage componentele etichetei
    const parts = withoutDimensions.split('_').filter(p => p.length > 0);
    console.log('Componente etichetă:', parts);
    
    if (parts.length < 3) {
        throw new Error(`Format insuficient: găsite ${parts.length} părți, trebuie minim 3`);
    }
    
    // Identifică componentele
    const specia = parts[0];
    const tip = parts[1];
    const calitate = parts[parts.length - 1];
    const numeParts = parts.slice(2, -1);
    const nume = numeParts.length > 0 ? numeParts.join('_') : parts[2];
    
    console.log('Componente finale ale etichetei:', { specia, tip, nume, calitate });
    
    // Validează componentele
    if (!specia || !tip || !calitate) {
        throw new Error(`Componente lipsă: ${JSON.stringify({ specia, tip, calitate })}`);
    }
    
    // Extragem dimensiunile adiționale din celelalte părți
    const additionalDims = [];
    
    // Începem de la index 1 deoarece am procesat deja prima parte
    for (let i = 1; i < productParts.length; i++) {
        const part = productParts[i].trim();
        if (!part) continue;
        
        // Extrage bucățile de la început (de ex: "444R_SF_...")
        let partBucati = '';
        let partProduct = part;
        
        const bucatiMatch = part.match(/^(\d+)/);
        if (bucatiMatch) {
            partBucati = bucatiMatch[1];
            partProduct = part.substring(partBucati.length).trim();
        }
        
        // Verifică dacă este într-adevăr un produs cu dimensiuni
        const partDimMatch = partProduct.match(/(\d+)x(\d+)x(\d+)$/);
        if (partDimMatch) {
            const [, partL, partl, partG] = partDimMatch;
            
            // Verifică dacă locația nu este atașată la sfârșit
            if (!locationFound && i === productParts.length - 1) {
                const lastPartLocationMatch = partProduct.match(/([A-G])-(\d+)-(\d+)$/);
                if (lastPartLocationMatch) {
                    [, perete, coloana, rand] = lastPartLocationMatch;
                    locationFound = true;
                    console.log('Locație găsită la sfârșitul ultimei părți:', { perete, coloana, rand });
                    
                    // Nu adăugăm această parte ca dimensiune adițională
                    continue;
                }
            }
            
            // Adaugă la lista de dimensiuni adiționale
            additionalDims.push({
                id: Date.now() + i, // Generăm un ID unic
                L: partL,
                l: partl,
                G: partG,
                bucati: partBucati
            });
            
            console.log(`Dimensiune adițională ${i} detectată:`, { L: partL, l: partl, G: partG, bucati: partBucati });
        } else if (i === productParts.length - 1 && !locationFound) {
            // Ultima parte ar putea conține doar locația
            const lastPartLocationMatch = part.match(/([A-G])-(\d+)-(\d+)$/);
            if (lastPartLocationMatch) {
                [, perete, coloana, rand] = lastPartLocationMatch;
                locationFound = true;
                console.log('Locație găsită în ultima parte:', { perete, coloana, rand });
            }
        }
    }
    
    console.log('Dimensiuni adiționale detectate:', additionalDims);
    console.log('Locație finală detectată:', { perete, coloana, rand, locationFound });
    
    // Acum completăm formularul cu datele extrase
    // Setăm informațiile principale
    document.getElementById('specia').value = specia;
    document.getElementById('tip').value = tip;
    
    // Actualizează opțiunile pentru nume
    updateNumeOptions();
    
    setTimeout(() => {
        const numeSelect = document.getElementById('nume');
        const numeOption = numeSelect.querySelector(`option[value="${nume}"]`);
        if (numeOption) {
            numeSelect.value = nume;
        } else if (nume) {
            // Adaugă opțiunea dacă nu există
            const newOption = document.createElement('option');
            newOption.value = nume;
            newOption.textContent = nume;
            numeSelect.appendChild(newOption);
            numeSelect.value = nume;
        }
    }, 50);
    
    document.getElementById('calitate').value = calitate;
    document.getElementById('lungime').value = lungime;
    document.getElementById('latime').value = latime;
    document.getElementById('grosime').value = grosime;
    
    // Setează bucățile
    if (bucatiPart && !isNaN(bucatiPart)) {
        document.getElementById('bucati').value = bucatiPart;
    }
    
    // Setăm dimensiunile adiționale
    additionalDimensions = additionalDims;
    renderDimensionsList();
    
    // Setează locația dacă există
    if (perete && coloana && rand) {
        console.log('Setăm locația în formular:', { perete, coloana, rand });
        
        // Pentru a ne asigura că valorile sunt setate corect, folosim setTimeout
        // pentru a permite actualizarea listelor după încărcarea inițială
        setTimeout(() => {
            try {
                const pereteSelect = document.getElementById('perete');
                const coloanaSelect = document.getElementById('coloana');
                const randSelect = document.getElementById('rand');
                
                // Verifică dacă valorile există în liste
                const pereteExists = Array.from(pereteSelect.options).some(opt => opt.value === perete);
                const coloanaExists = Array.from(coloanaSelect.options).some(opt => opt.value === coloana);
                const randExists = Array.from(randSelect.options).some(opt => opt.value === rand);
                
                console.log('Valori existente în select-uri:', { pereteExists, coloanaExists, randExists });
                
                // Setează valorile sau adaugă opțiuni noi dacă nu există
                if (pereteExists) {
                    pereteSelect.value = perete;
                } else {
                    const newOption = document.createElement('option');
                    newOption.value = perete;
                    newOption.textContent = perete;
                    pereteSelect.appendChild(newOption);
                    pereteSelect.value = perete;
                }
                
                if (coloanaExists) {
                    coloanaSelect.value = coloana;
                } else {
                    const newOption = document.createElement('option');
                    newOption.value = coloana;
                    newOption.textContent = coloana;
                    coloanaSelect.appendChild(newOption);
                    coloanaSelect.value = coloana;
                }
                
                if (randExists) {
                    randSelect.value = rand;
                } else {
                    const newOption = document.createElement('option');
                    newOption.value = rand;
                    newOption.textContent = rand;
                    randSelect.appendChild(newOption);
                    randSelect.value = rand;
                }
                
                console.log('Valori după setare:', {
                    perete: pereteSelect.value,
                    coloana: coloanaSelect.value,
                    rand: randSelect.value
                });
            } catch (err) {
                console.error('Eroare la setarea locației:', err);
            }
        }, 100);
    }
    
    // Generăm previzualizarea după un mic delay pentru a permite actualizarea UI-ului
    setTimeout(generatePreview, 300);
}