//alert("Hello MOFOS");
//localStorage.clear(); //**************TOGLIERE!!! SOLO PER DEBUG */
const loader = document.getElementById("loaderOverlay");

let tabRows = getCachedTabRows();
console.log(tabRows);
let index = getCachedIndex();
console.log(index);

drawRowsOnBoot();

let btnInsert = document.getElementById("insertBtn");
let btnClear = document.getElementById("clearBtn");

btnInsert.addEventListener("click", main);
btnClear.addEventListener("click", clearAll);

async function main() {

    const nameInputTag = document.getElementById("name");
    const kmInputTag = document.getElementById("km");

    const name = nameInputTag.value;

    const km = kmInputTag.value;

    if (name === "" || km === "") {
        alert("Per piacere, non lasciare campi vuoti");
        return;
    }


    const dateObj = new Date();

    const date = dateObj.toLocaleDateString("it-IT");

    const time = new Intl.DateTimeFormat('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(new Date());

    const position = await startGeoLocalization();

    //const position = getPosition();
    cacheTabRow(date, time, km, name, position, index);
    //console.log(getCachedTabRows());
    //console.log(tabRows);
    addRow();
    index++;
    cacheIndex();
    //startGeoLocalization();
    console.log(tabRows);
    console.log(index);

}

function cacheTabRow(dateData, timeData, kmData, nameData, positionData, indexData) {

    let newRowObjt = {
        date: dateData,
        time: timeData,
        km: kmData,
        name: nameData,
        position: positionData,
        index: indexData
    }

    tabRows.push(newRowObjt);
    localStorage.setItem("myTabValues", JSON.stringify(tabRows));
    //console.log(JSON.stringify(tabRows));

}

function getCachedTabRows() {

    const stringChachedRows = localStorage.getItem("myTabValues");
    return stringChachedRows === null ? [] : JSON.parse(stringChachedRows);
    //return [JSON.parse(localStorage.getItem("myTabValues"))] || [];

}

function cacheIndex() {

    localStorage.setItem("myIndex", index);
    console.log("Index: " + index);

}

function getCachedIndex() {
    const cachedIndex = localStorage.getItem("myIndex");
    return cachedIndex === null ? 0 : cachedIndex;
};

function addRow() {
    //const tabRows = getCachedTabRows();
    /*
    const nameData = tabRows[index].name;
    const kmData = tabRows[index].km;
    const date = new Date();
    const todayDate = date.toLocaleDateString("it-IT");
    const time = date.getHours() + ":" + date.getMinutes();
*/
    //console.log(tabRows[index].time);
    const newRow =
        `<tr id=row-${index}>
                        <td>${tabRows[index].date}</td>
                        <td>${tabRows[index].time}</td>
                        <td>${tabRows[index].km}</td>
                        <td>${tabRows[index].name}</td>
                        <td>${tabRows[index].position}</td>
                        <td><button data-id="${index}">-</button></td>        
                    </tr>`;

    const tbodyTag = document.getElementById("tbody");
    tbodyTag.insertAdjacentHTML("beforeend", newRow);
    

    deleteInputValues();
}

function addRow2() {
    const tbodyTag = document.getElementById("tbody");
    let newRow = document.createElement("tr");

    for (element in tabRows) {

        let i = 0;

        for (let j = 0; j <= tabRows[i]; j++) {

            let data = document.createElement("td");
            data.textContent = element;
            newRow.appendChild(data);

        }

        i++;
    }

    tbodyTag.appendChild(newRow);

}


function deleteInputValues() {
    const nameInputLabel = document.getElementById("name");
    const kmInputLabel = document.getElementById("km");
    const rememberNameCheckbox = document.getElementById("rememberName");
    const rememberKmCheckbox = document.getElementById("rememberKm");
    if (!rememberNameCheckbox.checked) {
        nameInputLabel.value = "";
    }
    if (!rememberKmCheckbox.checked) {
        kmInputLabel.value = "";
    }

}

function clearAll() {
    index = 0;
    cacheIndex();
    tabRows = [];
    //tabRows = tabRows.filter((element) => element === null);
    cacheEmptyTabRow();

    console.log(tabRows);
    console.log(index);

    const tbodyTag = document.querySelector("tbody");
    const rows = tbodyTag.children;

    for (let i = rows.length - 1; i >= 0; i--) {
        rows[i].remove();
    }

}

function cacheEmptyTabRow() {
    localStorage.setItem("myTabValues", JSON.stringify(tabRows));
}

function drawRowsOnBoot() {
    //console.log(tabRows);
    tabRows.forEach(element => {

        const newRow =
            `<tr id="row-${element.index}">
                        <td>${element.date}</td>
                        <td>${element.time}</td>
                        <td>${element.km}</td>
                        <td>${element.name}</td>
                        <td>${element.position}</td>
                        <td><button data-id="${element.index}">-</button></td>        
                    </tr>`;

        const tbodyTag = document.getElementById("tbody");
        tbodyTag.insertAdjacentHTML("beforeend", newRow);

    });
}

const getCoordinate = () => {

    document.getElementById("loadingString").textContent = "Recupero posizione...";

    return new Promise((resolve, reject) => { //promise per gestire meglio async/await
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos.coords), // Success
            (err) => reject(err),         // Error
            {
                enableHighAccuracy: true,
                timeout: 10000,             // 10 seconds time limit
                maximumAge: 0
            }
        );
    });
};


async function startGeoLocalization() { //async-await poiché il dato può non essere ricevuto subito

    showLoadingScreen()

    let position = "";

    try {
        console.log("Richiesta posizione in corso...");
        const coords = await getCoordinate();
        console.log("Posizione ottenuta:");
        console.log(`Lat: ${coords.latitude}, Lon: ${coords.longitude}`);
        position = await reverseGeocodingFromAPI(coords.latitude, coords.longitude);
        //reverseGeocodingFromAPI(coords.latitude, coords.longitude);
    } catch (errore) {

        console.error("Errore nel recupero posizione:", errore.message);
        position = "--";

    } finally {

        hideLoadingScreen();
        document.getElementById("loadingString").textContent = "";

    }

    return position;
}

async function reverseGeocodingFromAPI(lat, lon) {

    document.getElementById("loadingString").textContent = "Conversione coordinate...";

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    let location = "";
    let provincia = "";

    try {
        const dataFetched = await fetch(url);
        const data = await dataFetched.json();
        console.log(data);
        location = data.address.village || data.address.town || data.address.city;
        provincia = data.address[`ISO3166-2-lvl6`].slice(3) || "--";
    } catch (e) {
        console.log(e);
        //location = "--";
        //provincia = "--";
    }

    /*
        fetch(url)
            .then(response => response.json()) // Convertiamo la risposta in JSON
            .then(data => {
                // 4. Qui abbiamo i dati!
                console.log(data);
    
                // OpenStreetMap a volte usa chiavi diverse (city, town, village)
                // Questo trucco cerca la prima disponibile:
                const location = data.address.city || data.address.town || data.address.village;
                const provincia = data.address[`ISO3166-2-lvl6`].slice(3);
                console.log(`Ti trovi a: ${location} (${provincia})`);
                //gPosition = `${location} (${provincia.slice(3)})`;
            })
            .catch(error => {
                console.error("Qualcosa è andato storto:", error);
            });
    */
    return `${location} (${provincia})`;

}

function showLoadingScreen() {
    loader.classList.remove("hidden");
}

function hideLoadingScreen() {
    loader.classList.add("hidden");
}

/*
Esempio con: AZZANO X

https://nominatim.openstreetmap.org/reverse?format=json&lat=45.877055&lon=12.722950

{
  "place_id": 71340969,
  "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
  "osm_type": "node",
  "osm_id": 3785952315,
  "lat": "45.8771504",
  "lon": "12.7230520",
  "class": "place",
  "type": "house",
  "place_rank": 30,
  "importance": 0.000056016632333821,
  "addresstype": "place",
  "name": "",
  "display_name": "6, Borgo Colle, Azzano Decimo, Comunità Sile, Pordenone, Friuli-Venezia Giulia, 33082, Italia",
  "address": {
    "house_number": "6",
    "road": "Borgo Colle",
    "hamlet": "Borgo Colle",
    "town": "Azzano Decimo",
    "city": "Azzano Decimo",
    "municipality": "Comunità Sile",
    "county": "Pordenone",
    "ISO3166-2-lvl6": "IT-PN",
    "state": "Friuli-Venezia Giulia",
    "ISO3166-2-lvl4": "IT-36",
    "postcode": "33082",
    "country": "Italia",
    "country_code": "it"
  },
  "boundingbox": [
    "45.8771004",
    "45.8772004",
    "12.7230020",
    "12.7231020"
  ]
}
45.594348

13.786792
***ESEMPIO: Farnei

https://nominatim.openstreetmap.org/reverse?format=json&lat=45.594348&lon=13.786792

{
  "place_id": 72381269,
  "licence": "Data © OpenStreetMap contributors, ODbL 1.0. http://osm.org/copyright",
  "osm_type": "node",
  "osm_id": 3635928523,
  "lat": "45.5944088",
  "lon": "13.7867949",
  "class": "place",
  "type": "house",
  "place_rank": 30,
  "importance": 0.000052864118409964,
  "addresstype": "place",
  "name": "",
  "display_name": "9, Via del Serbatoio, Sant'Andrea, Farnei, Muggia, Trieste, Friuli-Venezia Giulia, 34015, Italia",
  "address": {
    "house_number": "9",
    "road": "Via del Serbatoio",
    "hamlet": "Sant'Andrea",
    "village": "Farnei",
    "town": "Muggia",
    "county": "Trieste",
    "ISO3166-2-lvl6": "IT-TS",
    "state": "Friuli-Venezia Giulia",
    "ISO3166-2-lvl4": "IT-36",
    "postcode": "34015",
    "country": "Italia",
    "country_code": "it"
  },
  "boundingbox": [
    "45.5943588",
    "45.5944588",
    "13.7867449",
    "13.7868449"
  ]
}

*/

/* Snippet di codice Gemini

// Immaginiamo che il tuo array abbia questa struttura (con un ID univoco)
let tabRows = [
    { id: 101, date: '2023-10-01', time: '10:00', km: 50, name: 'Test', position: 'A' },
    { id: 102, date: '2023-10-02', time: '11:00', km: 30, name: 'Test', position: 'B' }
];

// Riferimento al corpo della tabella (assicurati di avere un <tbody> nel tuo HTML)
const tableBody = document.querySelector('#miatabella tbody');

// 1. Funzione per disegnare una riga (simile al tuo codice)
function addRowToDom(item) {
    const newRow = `
        <tr id="row-${item.id}">
             <td>${item.date}</td>
             <td>${item.time}</td>
             <td>${item.km}</td>
             <td>${item.name}</td>
             <td>${item.position}</td>
             <td>
                 <button class="delete-btn" data-id="${item.id}">-</button>
             </td>
        </tr>`;
    
    // Aggiunge la riga alla fine della tabella
    tableBody.insertAdjacentHTML('beforeend', newRow);
}

// Carichiamo le righe iniziali (esempio)
tabRows.forEach(item => addRowToDom(item));

// ---------------------------------------------------------
// 2. L'EVENT LISTENER "MAGICO" (Event Delegation)
// ---------------------------------------------------------
tableBody.addEventListener('click', function(event) {
    
    // Controlliamo se l'elemento cliccato ha la classe "delete-btn"
    if (event.target.classList.contains('delete-btn')) {
        
        // A. Recuperiamo l'ID dal bottone
        const idToDelete = parseInt(event.target.getAttribute('data-id'));
        
        // B. ELIMINIAMO DALL'ARRAY
        // Usiamo filter per creare un nuovo array senza quell'elemento
        tabRows = tabRows.filter(item => item.id !== idToDelete);
        
        // C. ELIMINIAMO DALL'HTML
        // Troviamo la riga intera (il genitore del bottone, o cercandola per ID)
        const rowToRemove = document.getElementById(`row-${idToDelete}`);
        if (rowToRemove) {
            rowToRemove.remove();
        }

        console.log("Array aggiornato:", tabRows);
    }
});
 
 */