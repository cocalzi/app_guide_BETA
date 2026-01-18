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
    cacheTabRow(date, time, km, name, position);
    //console.log(getCachedTabRows());
    //console.log(tabRows);
    addRow();
    index++;
    cacheIndex();
    //startGeoLocalization();

}

function cacheTabRow(dateData, timeData, kmData, nameData, positionData) {

    let newRowObjt = {
        date: dateData,
        time: timeData,
        km: kmData,
        name: nameData,
        position: positionData
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
    console.log(tabRows[index].time);
    const newRow =
        `<tr>
                        <td scope="row">${tabRows[index].date}</td>
                        <td scope="row">${tabRows[index].time}</td>
                        <td scope="row">${tabRows[index].km}</td>
                        <td scope="row">${tabRows[index].name}</td>
                        <td scope="row">${tabRows[index].position}</td>
                        <td scope = "row"><button>-</button></td>        
                    </tr>`;

    const tbodyTag = document.getElementById("tbody");
    tbodyTag.insertAdjacentHTML("beforeend", newRow);

    deleteInputValues();
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
    console.log(tabRows);
    tabRows.forEach(element => {

        const newRow =
            `<tr>
                        <td scope="row">${element.date}</td>
                        <td scope="row">${element.time}</td>
                        <td scope="row">${element.km}</td>
                        <td scope="row">${element.name}</td>
                        <td scope="row">${element.position}</td>
                        <td scope = "row"><button>-</button></td>        
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
        location = data.address.city || data.address.town || data.address.village;
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

