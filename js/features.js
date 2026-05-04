// Функціональність для заявок на ремонт та платежів

// Створення заявки на ремонт
function submitRepairRequest() {
  if (!currentUser) {
    showAlert('Увійди до системи!', 'error');
    return;
  }

  const requestType = document.getElementById('repair-type').value;
  const description = document.getElementById('repair-description').value;

  if (!requestType || !description) {
    showAlert('Заповни усі поля!', 'error');
    return;
  }

  db.collection('repair_requests').add({
    userId: currentUser.uid,
    type: requestType,
    description: description,
    status: 'new',
    createdAt: new Date(),
    updatedAt: new Date()
  }).then(() => {
    showAlert('Заявка надіслана! Адміністратор розглянути її найскоріше.', 'success');
    document.getElementById('repair-type').value = '';
    document.getElementById('repair-description').value = '';
    loadRepairRequests();
  }).catch(error => {
    showAlert('Помилка: ' + error.message, 'error');
  });
}

// Завантаження заявок на ремонт
function loadRepairRequests() {
  if (!currentUser) return;

  db.collection('repair_requests')
    .where('userId', '==', currentUser.uid)
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      const table = document.getElementById('repair-requests-table');
      if (table) {
        table.innerHTML = `
          <tr>
            <th>Тип</th>
            <th>Опис</th>
            <th>Статус</th>
            <th>Дата</th>
            <th>Дія</th>
          </tr>
        `;
        
        snapshot.forEach(doc => {
          const data = doc.data();
          const date = new Date(data.createdAt.toDate()).toLocaleDateString('uk-UA');
          const statusBadge = getStatusBadge(data.status);
          const row = table.insertRow();
          row.innerHTML = `
            <td>${data.type}</td>
            <td>${data.description}</td>
            <td>${statusBadge}</td>
            <td>${date}</td>
            <td>
              ${data.status === 'new' ? `<button class="btn btn-secondary" onclick="cancelRepairRequest('${doc.id}')">Скасувати</button>` : '-'}
            </td>
          `;
        });
      }
    });
}

// Завантаження ВСЇ заявок для адміністратора
function loadAllRepairRequests() {
  db.collection('repair_requests')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      const table = document.getElementById('all-repair-requests-table');
      if (table) {
        table.innerHTML = `
          <tr>
            <th>Студент</th>
            <th>Кімната</th>
            <th>Тип</th>
            <th>Опис</th>
            <th>Статус</th>
            <th>Дата</th>
            <th>Дія</th>
          </tr>
        `;
        
        snapshot.forEach(doc => {
          const data = doc.data();
          const date = new Date(data.createdAt.toDate()).toLocaleDateString('uk-UA');
          const statusBadge = getStatusBadge(data.status);
          
          // Отримуємо дані студента
          db.collection('users').doc(data.userId).get().then(userDoc => {
            if (userDoc.exists) {
              const userData = userDoc.data();
              const row = table.insertRow();
              row.innerHTML = `
                <td>${userData.name}</td>
                <td>${userData.room}</td>
                <td>${data.type}</td>
                <td>${data.description}</td>
                <td>${statusBadge}</td>
                <td>${date}</td>
                <td>
                  <select onchange="updateRepairStatus('${doc.id}', this.value)">
                    <option value="new" ${data.status === 'new' ? 'selected' : ''}>Нова</option>
                    <option value="in_progress" ${data.status === 'in_progress' ? 'selected' : ''}>В роботі</option>
                    <option value="completed" ${data.status === 'completed' ? 'selected' : ''}>Завершена</option>
                    <option value="cancelled" ${data.status === 'cancelled' ? 'selected' : ''}>Скасована</option>
                  </select>
                </td>
              `;
            }
          });
        });
      }
    });
}

// Оновлення статусу заявки
function updateRepairStatus(requestId, newStatus) {
  db.collection('repair_requests').doc(requestId).update({
    status: newStatus,
    updatedAt: new Date()
  }).then(() => {
    showAlert('Статус оновлено!', 'success');
  }).catch(error => {
    showAlert('Помилка: ' + error.message, 'error');
  });
}

// Скасування заявки
function cancelRepairRequest(requestId) {
  if (confirm('Ти впевнений/впевнена?')) {
    db.collection('repair_requests').doc(requestId).update({
      status: 'cancelled',
      updatedAt: new Date()
    }).then(() => {
      showAlert('Заявку скасовано!', 'success');
      loadRepairRequests();
    });
  }
}

// Отримання бейджу статусу
function getStatusBadge(status) {
  const statusMap = {
    'new': '<span class="badge badge-warning">Нова</span>',
    'in_progress': '<span class="badge badge-warning">В роботі</span>',
    'completed': '<span class="badge badge-success">Завершена</span>',
    'cancelled': '<span class="badge badge-danger">Скасована</span>'
  };
  return statusMap[status] || status;
}

// ===== ПЛАТЕЖІ =====

// Додавання платежу (поповнення балансу)
function submitPayment() {
  if (!currentUser) {
    showAlert('Увійди до системи!', 'error');
    return;
  }

  const amount = parseFloat(document.getElementById('payment-amount').value);
  const paymentType = document.getElementById('payment-type').value;

  if (!amount || amount <= 0 || !paymentType) {
    showAlert('Заповни усі поля правильно!', 'error');
    return;
  }

  // Додаємо платіж
  db.collection('payments').add({
    userId: currentUser.uid,
    amount: amount,
    type: paymentType,
    status: 'completed',
    createdAt: new Date(),
    description: `Оплата за ${paymentType}`
  }).then(() => {
    // Оновлюємо баланс
    db.collection('users').doc(currentUser.uid).get().then(doc => {
      const currentBalance = doc.data().balance || 0;
      db.collection('users').doc(currentUser.uid).update({
        balance: currentBalance + amount
      });
    });

    showAlert(`Платіж на ${amount} грн успішно виконаний!`, 'success');
    document.getElementById('payment-amount').value = '';
    loadPayments();
    loadUserDashboard();
  }).catch(error => {
    showAlert('Помилка: ' + error.message, 'error');
  });
}

// Завантаження платежів
function loadPayments() {
  if (!currentUser) return;

  db.collection('payments')
    .where('userId', '==', currentUser.uid)
    .orderBy('createdAt', 'desc')
    .limit(20)
    .onSnapshot(snapshot => {
      const table = document.getElementById('payment-history-table');
      if (table) {
        table.innerHTML = `
          <tr>
            <th>Дата</th>
            <th>Тип</th>
            <th>Сума</th>
            <th>Статус</th>
          </tr>
        `;
        
        let totalSpent = 0;
        snapshot.forEach(doc => {
          const data = doc.data();
          const date = new Date(data.createdAt.toDate()).toLocaleString('uk-UA');
          totalSpent += data.amount;
          const row = table.insertRow();
          row.innerHTML = `
            <td>${date}</td>
            <td>${data.type}</td>
            <td>${data.amount} грн</td>
            <td><span class="badge badge-success">${data.status}</span></td>
          `;
        });

        // Показуємо статистику
        const statsDiv = document.getElementById('payment-stats');
        if (statsDiv) {
          statsDiv.innerHTML = `
            <div class="stat-card">
              <h3>${totalSpent}</h3>
              <p>Всього витрачено (грн)</p>
            </div>
          `;
        }
      }
    });
}

// Завантаження всіх платежів для адміністратора
function loadAllPayments() {
  db.collection('payments')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      const table = document.getElementById('all-payments-table');
      if (table) {
        table.innerHTML = `
          <tr>
            <th>Студент</th>
            <th>Дата</th>
            <th>Тип</th>
            <th>Сума</th>
            <th>Статус</th>
          </tr>
        `;
        
        let totalAmount = 0;
        snapshot.forEach(doc => {
          const data = doc.data();
          const date = new Date(data.createdAt.toDate()).toLocaleString('uk-UA');
          totalAmount += data.amount;
          
          db.collection('users').doc(data.userId).get().then(userDoc => {
            if (userDoc.exists) {
              const userData = userDoc.data();
              const row = table.insertRow();
              row.innerHTML = `
                <td>${userData.name}</td>
                <td>${date}</td>
                <td>${data.type}</td>
                <td>${data.amount} грн</td>
                <td><span class="badge badge-success">${data.status}</span></td>
              `;
            }
          });
        });

        const statsDiv = document.getElementById('admin-payment-stats');
        if (statsDiv) {
          statsDiv.innerHTML = `
            <div class="stat-card">
              <h3>${totalAmount}</h3>
              <p>Всього зібрано (грн)</p>
            </div>
          `;
        }
      }
    });
}

// Видалення платежу (тільки для адміна)
function deletePayment(paymentId) {
  if (confirm('Ви впевнені?')) {
    db.collection('payments').doc(paymentId).delete().then(() => {
      showAlert('Платіж видалено!', 'success');
      loadAllPayments();
    });
  }
}
