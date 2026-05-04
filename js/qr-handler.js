// QR код функціональність

// Генерація QR коду для студента
function generateStudentQR() {
  if (!currentUser) {
    showAlert('Спочатку увійди до системи!', 'error');
    return;
  }

  const qrData = {
    userId: currentUser.uid,
    timestamp: Date.now(),
    action: 'entry'
  };

  const qrText = JSON.stringify(qrData);
  const qrContainer = document.getElementById('qr-code');
  qrContainer.innerHTML = '';

  new QRCode(qrContainer, {
    text: qrText,
    width: 300,
    height: 300,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });

  showAlert('QR код згенерований! Покажи його на вході.', 'success');
}

// Сканування QR коду для входу
function startQRScanner() {
  const reader = document.getElementById('reader');
  
  if (!reader) {
    showAlert('Елемент сканера не знайдено!', 'error');
    return;
  }

  reader.innerHTML = '';

  const html5QrcodeScanner = new Html5QrcodeScanner(
    'reader',
    { fps: 10, qrbox: { width: 250, height: 250 } },
    false
  );

  html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

// Успішне сканування
function onScanSuccess(decodedText) {
  try {
    const qrData = JSON.parse(decodedText);
    processQREntry(qrData);
  } catch (e) {
    showAlert('Неправильний QR код!', 'error');
  }
}

// Помилка сканування
function onScanFailure(error) {
  console.log('Помилка сканування: ' + error);
}

// Обробка входу за QR кодом
function processQREntry(qrData) {
  if (!qrData.userId) {
    showAlert('Неправильний QR код!', 'error');
    return;
  }

  // Отримуємо дані студента
  db.collection('users').doc(qrData.userId).get().then(doc => {
    if (doc.exists) {
      const userData = doc.data();
      
      // Записуємо вхід
      db.collection('access_log').add({
        userId: qrData.userId,
        studentName: userData.name,
        room: userData.room,
        timestamp: new Date(),
        accessType: 'qr'
      });

      // Оновлюємо lastAccess
      db.collection('users').doc(qrData.userId).update({
        lastAccess: new Date()
      });

      showAlert(`✓ Вхід успішний! ${userData.name} (кімната ${userData.room})`, 'success');
      
      // Додаємо до таблиці
      addAccessLogEntry(userData.name, userData.room, new Date());
    } else {
      showAlert('Студента не знайдено!', 'error');
    }
  }).catch(error => {
    showAlert('Помилка: ' + error.message, 'error');
  });
}

// Додавання запису до таблиці
function addAccessLogEntry(name, room, timestamp) {
  const table = document.getElementById('access-log-table');
  if (table) {
    const row = table.insertRow(1);
    row.innerHTML = `
      <td>${new Date(timestamp).toLocaleString('uk-UA')}</td>
      <td>${name}</td>
      <td>${room}</td>
      <td><span class="badge badge-success">Дозволено</span></td>
    `;
  }
}

// Завантаження всіх входів
function loadAccessLogs() {
  db.collection('access_log')
    .orderBy('timestamp', 'desc')
    .limit(50)
    .onSnapshot(snapshot => {
      const table = document.getElementById('access-log-table');
      if (table) {
        table.innerHTML = `
          <tr>
            <th>Час</th>
            <th>Ім'я</th>
            <th>Кімната</th>
            <th>Статус</th>
          </tr>
        `;
        
        snapshot.forEach(doc => {
          const data = doc.data();
          const row = table.insertRow();
          row.innerHTML = `
            <td>${new Date(data.timestamp.toDate()).toLocaleString('uk-UA')}</td>
            <td>${data.studentName}</td>
            <td>${data.room}</td>
            <td><span class="badge badge-success">Дозволено</span></td>
          `;
        });
      }
    });
}

// Скачування QR як зображення
function downloadQR() {
  const canvas = document.querySelector('#qr-code canvas');
  if (canvas) {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'smartdorm-qr.png';
    link.click();
  }
}

// Функція для друку QR коду
function printQR() {
  const printWindow = window.open('', '', 'width=500,height=500');
  const canvas = document.querySelector('#qr-code canvas');
  if (canvas) {
    printWindow.document.write('<img src="' + canvas.toDataURL() + '">');
    printWindow.document.close();
    printWindow.print();
  }
}
