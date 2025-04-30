let base64billede;
let patientid;

function FåPassword() {
    localStorage.setItem("password", prompt("Indtast Password"));
}

function VisBillede(e) {
    const billede = e.target.files[0];

    if (billede) {
        const reader = new FileReader();

        reader.onload = function(e) {
            base64billede = e.target.result;

            document.getElementById("billedevis").src = base64billede;
            document.getElementById("billedevis").style.display = 'block';
        }

        reader.readAsDataURL(billede);
    }

}

function FåPatientInfo() {

    let password = localStorage.getItem("password");
    if (!password) {
        password = prompt("Indtast Password");
        localStorage.setItem("password", password);
    }
    
    const url = `https://api.stigh.net:8000/patienter/${patientid}/${password}`;

    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Netværksrespons var ikke ok: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log(data);
        document.getElementById("navn").value = data.navn;
        document.getElementById("alder").value = data.alder;
        document.getElementById("sygdomsinformation").value = data.sygdomsinformation;
        document.getElementById("patientjournal").value = data.patientjournal;
        document.getElementById("cprnummer").value = data.cprnummer;
        document.getElementById("pille1").textContent = data.pille1;
        document.getElementById("pille2").textContent = data.pille2;
        document.getElementById("pille3").textContent = data.pille3;
        if (data.patientbillede && !data.patientbillede.startsWith('data:image')) {
            data.patientbillede = 'data:image/jpeg;base64,' + data.patientbillede;
        }
        document.getElementById("billedevis").src = data.patientbillede;
        document.getElementById("billedevis").style.display = 'block';
    })

}


function UploadPatientInfo() {

    let password = localStorage.getItem("password");
    if (!password) {
        password = prompt("Indtast Password");
        localStorage.setItem("password", password);
    }

    const url = `https://api.stigh.net:8000/patienter/${patientid}/${password}`;

    base64billede = document.getElementById("billedevis").src;

    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            navn: String(document.getElementById("navn").value),
            alder: parseInt(document.getElementById("alder").value),
            sygdomsinformation: String(document.getElementById("sygdomsinformation").value),
            patientjournal: String(document.getElementById("patientjournal").value),
            patientbillede: String(base64billede),
            cprnummer: String(document.getElementById("cprnummer").value),
            pille1: parseInt(document.getElementById("pille1").textContent),
            pille2: parseInt(document.getElementById("pille2").textContent),
            pille3: parseInt(document.getElementById("pille3").textContent),
        }),
    })
}

function ændreAntal(knap, antal) {
    const antalVis = knap.parentElement.querySelector('.pillcount');
    let antalVærdi = parseInt(antalVis.innerText);
    antalVærdi += antal;
    if (antalVærdi < 0) {
        antalVærdi = 0;
    }
    antalVis.innerText = antalVærdi;
}

function tilfældigStreng() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({length: 12}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

async function startNfcLoop() {
    if (!('NDEFReader' in window)) {
        alert('Web NFC fungerer ikke på denne enhed. Prøv en anden enhed.');
        return;
      }
    if ('NDEFReader' in window) {
      try {
        const ndef = new NDEFReader();
        await ndef.scan();

        ndef.onreading = async (event) => {
        
          const decoder = new TextDecoder();
          let text = '';
          for (const record of event.message.records) {
            if (record.recordType === 'text') {
              text = decoder.decode(record.data);
            }
          }

          if (text.length !== 12) {
            const newString = tilfældigStreng();
            patientid = newString;

            await ndef.write({
              records: [{ recordType: "text", data: newString }]
            });
            FåPatientInfo();
          } else {
            patientid = text;
            FåPatientInfo();
          }
          

        };
      } catch (error) {
        alert("NFC fejl: " + error.message);
        console.error("Fejl:", error);
      }
    }
  };

let nfcStart = false;

function berøringStart() {
    if (!nfcStart) {
        nfcStart = true;
        startNfcLoop();
        console.log("Startede NFC loop");
    }
}

document.addEventListener('touchstart', berøringStart, { once: true });