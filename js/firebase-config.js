// Firebase конфігурація ✅
const firebaseConfig = {
  apiKey: "AIzaSyAE7FbP474RA5sVH-C6STRCPmWbDhOlqnI",
  authDomain: "smartdorm-306b0.firebaseapp.com",
  projectId: "smartdorm-306b0",
  storageBucket: "smartdorm-306b0.firebasestorage.app",
  messagingSenderId: "523148758412",
  appId: "1:523148758412:web:749c338d1b2fc596e09aa9"
};

// Глобальні змінні
let auth, db, currentUser = null, userRole = null;

// Ініціалізація Firebase
firebase.initializeApp(firebaseConfig);
auth = firebase.auth();
db = firebase.firestore();

// Автоматична ініціалізація бази даних
function initializeDatabase() {
  console.log('🔧 Перевіряю Firestore...');
  
  // Перевіряємо чи існує колекція users
  db.collection('users').limit(1).get().then(snapshot => {
    if (snapshot.empty) {
      console.log('📝 Створюю колекції...');
      
      // Створюємо тестового адміна
      db.collection('users').doc('admin-default').set({
        email: 'admin@smartdorm.com',
        name: 'Адміністратор',
        studentId: 'ADMIN-001',
        room: 'Admin Panel',
        role: 'admin',
        createdAt: new Date(),
        balance: 0,
        lastAccess: null
      }).catch(err => console.log('Admin створений або вже існує'));
      
      // Створюємо пусту колекцію access_log
      db.collection('access_log').doc('_init').set({
        initialized: true,
        createdAt: new Date()
      }).then(() => {
        db.collection('access_log').doc('_init').delete();
        console.log('✅ access_log готова');
      });
      
      // Створюємо пусту колекцію repair_requests
      db.collection('repair_requests').doc('_init').set({
        initialized: true,
        createdAt: new Date()
      }).then(() => {
        db.collection('repair_requests').doc('_init').delete();
        console.log('✅ repair_requests готова');
      });
      
      // Створюємо пусту колекцію payments
      db.collection('payments').doc('_init').set({
        initialized: true,
        createdAt: new Date()
      }).then(() => {
        db.collection('payments').doc('_init').delete();
        console.log('✅ payments готова');
      });
      
      console.log('✅ Усі колекції створені!');
    } else {
      console.log('✅ База вже ініціалізована');
    }
  }).catch(err => {
    console.error('❌ Помилка при ініціалізації:', err);
  });
}

// Запускаємо ініціалізацію при завантаженні
setTimeout(() => {
  initializeDatabase();
}, 1000);

// Слухаємо зміни стану автентифікації
auth.onAuthStateChanged(user => {
  currentUser = user;
  console.log('Auth state changed:', user ? user.email : 'Not logged in');
  
  if (user) {
    db.collection('users').doc(user.uid).get().then(doc => {
      if (doc.exists) {
        userRole = doc.data().role;
        console.log('User role:', userRole);
        
        // Завантажуємо дані
        loadUserDashboard();
        
        // Встановлюємо реал-тайм слухач
        if (typeof setupUserListener === 'function') {
          setupUserListener();
        }
        
        if (typeof loadUserDashboard === 'function') {
          loadUserDashboard();
        }
      }
    }).catch(err => console.error('Помилка:', err));
  } else {
    if (window.location.pathname.includes('dashboard')) {
      window.location.href = 'index.html';
    }
  }
});

// Регістрація
function registerUser() {
  if (!auth) {
    showAlert('Firebase не завантажився. Спробуй перезавантажити сторінку.', 'error');
    return;
  }

  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const name = document.getElementById('register-name').value;
  const studentId = document.getElementById('register-studentId').value;
  const room = document.getElementById('register-room').value;

  if (!email || !password || !name || !studentId || !room) {
    showAlert('Заповни усі поля!', 'error');
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      
      // Явно створюємо документ користувача
      const userData = {
        email: email,
        name: name,
        studentId: studentId,
        room: room,
        role: 'student',
        createdAt: firebase.firestore.Timestamp.now(),
        balance: 0,
        lastAccess: null
      };
      
      db.collection('users').doc(user.uid).set(userData).then(() => {
        console.log('✅ Користувач збережений:', user.uid);
        showAlert('✅ Реєстрація успішна! Перенаправляю...', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      }).catch(err => {
        console.error('❌ Помилка при збереженні:', err);
        showAlert('❌ Помилка при збереженні даних: ' + err.message, 'error');
        user.delete();
      });
    })
    .catch(error => {
      console.error('❌ Помилка реєстрації:', error);
      showAlert('❌ Помилка: ' + error.message, 'error');
    });
}

// Логін
function loginUser() {
  if (!auth) {
    showAlert('Firebase не завантажився. Спробуй перезавантажити сторінку.', 'error');
    return;
  }

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showAlert('Заповни email та пароль!', 'error');
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      showAlert('✅ Успішний вхід!', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    })
    .catch(error => {
      showAlert('❌ Помилка: ' + error.message, 'error');
    });
}

// Вихід
function logoutUser() {
  if (auth) {
    auth.signOut().then(() => {
      window.location.href = 'index.html';
    });
  }
}

// Функція для показування алертів
function showAlert(message, type = 'info') {
  const alertDiv = document.getElementById('alert');
  if (alertDiv) {
    alertDiv.textContent = message;
    alertDiv.className = `alert alert-${type} show`;
    setTimeout(() => {
      alertDiv.classList.remove('show');
    }, 4000);
  }
}

// Завантаження даних користувача
function loadUserDashboard() {
  if (!currentUser || !db) {
    console.log('currentUser або db не готові');
    return;
  }

  db.collection('users').doc(currentUser.uid).get().then(doc => {
    if (doc.exists) {
      const userData = doc.data();
      console.log('Дані користувача:', userData);
      
      // Оновлюємо всі елементи
      const nameElem = document.getElementById('user-name');
      const emailElem = document.getElementById('user-email');
      const roomElem = document.getElementById('user-room');
      const balanceElem = document.getElementById('user-balance');
      
      if (nameElem) nameElem.textContent = userData.name || 'Невідомо';
      if (emailElem) emailElem.textContent = userData.email || 'Невідомо';
      if (roomElem) roomElem.textContent = userData.room || 'Невідомо';
      if (balanceElem) balanceElem.textContent = (userData.balance || 0) + ' грн';
      
      console.log('✅ Дані оновлені на сторінці');
    } else {
      console.log('Документ користувача не знайдений');
    }
  }).catch(err => {
    console.error('❌ Помилка при завантаженні даних:', err);
  });
}

// Встановлюємо реал-тайм слухач для оновлення даних
function setupUserListener() {
  if (!currentUser || !db) return;
  
  db.collection('users').doc(currentUser.uid).onSnapshot(doc => {
    if (doc.exists) {
      const userData = doc.data();
      const nameElem = document.getElementById('user-name');
      const emailElem = document.getElementById('user-email');
      const roomElem = document.getElementById('user-room');
      const balanceElem = document.getElementById('user-balance');
      
      if (nameElem) nameElem.textContent = userData.name || 'Невідомо';
      if (emailElem) emailElem.textContent = userData.email || 'Невідомо';
      if (roomElem) roomElem.textContent = userData.room || 'Невідомо';
      if (balanceElem) balanceElem.textContent = (userData.balance || 0) + ' грн';
    }
  });
}

// Явно експортуємо функцію в глобальну область для inline-викликів з dashboard.html
window.setupUserListener = setupUserListener;
