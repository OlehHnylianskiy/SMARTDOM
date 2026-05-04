// Admin функціональність - розширені можливості

// Функція для блокування користувача (адмін)
function blockUser(userId, reason = '') {
  if (confirm('Ти впевнений, що хочеш заблокувати користувача?')) {
    db.collection('users').doc(userId).update({
      blocked: true,
      blockedReason: reason,
      blockedAt: new Date()
    }).then(() => {
      showAlert('Користувача заблоковано!', 'success');
      loadAllUsers();
    }).catch(error => {
      showAlert('Помилка: ' + error.message, 'error');
    });
  }
}

// Функція для розблокування користувача
function unblockUser(userId) {
  db.collection('users').doc(userId).update({
    blocked: false,
    blockedAt: null
  }).then(() => {
    showAlert('Користувача розблоковано!', 'success');
    loadAllUsers();
  });
}

// Експорт даних для звіту
function exportAccessLogsToCSV() {
  db.collection('access_log').get().then(snapshot => {
    let csv = 'Час входу,Ім\'я студента,Кімната,Статус\n';
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const date = new Date(data.timestamp.toDate()).toLocaleString('uk-UA');
      csv += `"${date}","${data.studentName}","${data.room}","Дозволено"\n`;
    });
    
    downloadCSV(csv, 'access_logs.csv');
  });
}

// Експорт платежів до CSV
function exportPaymentsToCSV() {
  db.collection('payments').get().then(snapshot => {
    let csv = 'Дата,Студент,Тип,Сума,Статус\n';
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const date = new Date(data.createdAt.toDate()).toLocaleDateString('uk-UA');
      
      // Отримуємо ім'я студента
      db.collection('users').doc(data.userId).get().then(userDoc => {
        if (userDoc.exists) {
          const userName = userDoc.data().name;
          csv += `"${date}","${userName}","${data.type}","${data.amount}","${data.status}"\n`;
        }
      });
    });
    
    setTimeout(() => {
      downloadCSV(csv, 'payments_report.csv');
    }, 2000);
  });
}

// Допоміжна функція для завантаження CSV
function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Статистика входів за період
function getAccessStatsByDateRange(startDate, endDate) {
  db.collection('access_log')
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .get()
    .then(snapshot => {
      const stats = {};
      snapshot.forEach(doc => {
        const data = doc.data();
        const room = data.room;
        stats[room] = (stats[room] || 0) + 1;
      });
      
      console.log('Статистика входів по кімнатах:', stats);
      displayAccessStats(stats);
    });
}

// Показування статистики
function displayAccessStats(stats) {
  let html = '<h3>Статистика входів по кімнатах:</h3><table class="table"><tr><th>Кімната</th><th>Входів</th></tr>';
  
  Object.entries(stats).forEach(([room, count]) => {
    html += `<tr><td>${room}</td><td>${count}</td></tr>`;
  });
  
  html += '</table>';
  document.getElementById('access-stats-container').innerHTML = html;
}

// Сповіщення про нові заявки (real-time)
function setupRepairNotifications() {
  if (userRole !== 'admin') return;
  
  db.collection('repair_requests')
    .where('status', '==', 'new')
    .onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          showAlert(`⚠️ Нова заявка на ремонт: ${data.type}`, 'info');
        }
      });
    });
}

// Генерація звіту про стан гуртожитку
function generateDormReport() {
  Promise.all([
    db.collection('users').where('role', '==', 'student').get(),
    db.collection('access_log').get(),
    db.collection('repair_requests').get(),
    db.collection('payments').get()
  ]).then(([usersSnap, accessSnap, repairSnap, paymentsSnap]) => {
    const report = {
      generatedAt: new Date().toLocaleString('uk-UA'),
      totalStudents: usersSnap.size,
      totalAccess: accessSnap.size,
      pendingRepairs: repairSnap.docs.filter(d => d.data().status === 'new').length,
      completedRepairs: repairSnap.docs.filter(d => d.data().status === 'completed').length,
      totalPayments: paymentsSnap.docs.reduce((sum, d) => sum + d.data().amount, 0),
      averageBalance: Array.from(usersSnap.docs).reduce((sum, d) => sum + (d.data().balance || 0), 0) / usersSnap.size
    };
    
    console.log('ЗВІТ ПРО СТАН ГУРТОЖИТКУ:', report);
    displayReport(report);
  });
}

function displayReport(report) {
  const reportHTML = `
    <div class="card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin-top: 20px;">
      <h2>📊 Звіт про стан гуртожитку</h2>
      <p style="opacity: 0.9; margin-top: 10px;">Створено: ${report.generatedAt}</p>
      
      <div class="stats-container" style="margin-top: 20px;">
        <div class="stat-card" style="background: rgba(0,0,0,0.2); color: white;">
          <h3>${report.totalStudents}</h3>
          <p>Всього студентів</p>
        </div>
        <div class="stat-card" style="background: rgba(0,0,0,0.2); color: white;">
          <h3>${report.totalAccess}</h3>
          <p>Входів всього</p>
        </div>
        <div class="stat-card" style="background: rgba(0,0,0,0.2); color: white;">
          <h3>${report.pendingRepairs}</h3>
          <p>Очікуючих заявок</p>
        </div>
        <div class="stat-card" style="background: rgba(0,0,0,0.2); color: white;">
          <h3>${report.completedRepairs}</h3>
          <p>Завершених заявок</p>
        </div>
        <div class="stat-card" style="background: rgba(0,0,0,0.2); color: white;">
          <h3>${report.totalPayments} грн</h3>
          <p>Всього зібрано</p>
        </div>
        <div class="stat-card" style="background: rgba(0,0,0,0.2); color: white;">
          <h3>${report.averageBalance.toFixed(2)} грн</h3>
          <p>Середній баланс</p>
        </div>
      </div>
    </div>
  `;
  
  const container = document.getElementById('report-container');
  if (container) {
    container.innerHTML = reportHTML;
  }
}

// QR код з часовою міткою (для посиленої безпеки)
function generateSecureQRWithTimestamp() {
  if (!currentUser) {
    showAlert('Увійди до системи!', 'error');
    return;
  }

  const now = Date.now();
  const expireTime = now + (5 * 60 * 1000); // QR код дійсний 5 хвилин
  
  const qrData = {
    userId: currentUser.uid,
    timestamp: now,
    expiresAt: expireTime,
    type: 'entry'
  };

  const qrText = JSON.stringify(qrData);
  const qrContainer = document.getElementById('secure-qr-code');
  
  if (qrContainer) {
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
      text: qrText,
      width: 300,
      height: 300,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });

    showAlert('Безпечний QR код дійсний 5 хвилин!', 'success');
  }
}

// Перевірка терміну дійсності QR кода
function validateQRTimestamp(qrData) {
  const now = Date.now();
  
  if (qrData.expiresAt && qrData.expiresAt < now) {
    showAlert('❌ QR код застарілий! Згенеруй новий.', 'error');
    return false;
  }
  
  return true;
}

// Аналітика входів в реальному часі
function setupRealTimeAnalytics() {
  db.collection('access_log')
    .orderBy('timestamp', 'desc')
    .limit(10)
    .onSnapshot(snapshot => {
      const recentAccess = snapshot.docs.map(doc => doc.data());
      updateAnalyticsDashboard(recentAccess);
    });
}

function updateAnalyticsDashboard(accessData) {
  // Графіки, статистика тощо
  const lastHourCount = accessData.filter(a => {
    const diff = Date.now() - a.timestamp.toDate().getTime();
    return diff < 60 * 60 * 1000; // За останню годину
  }).length;

  const analyticsHTML = `
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
      <p>🟢 <strong>Входів за останню годину:</strong> ${lastHourCount}</p>
    </div>
  `;
  
  const container = document.getElementById('analytics-container');
  if (container) {
    container.innerHTML = analyticsHTML;
  }
}
