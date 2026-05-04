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

// Слухаємо зміни стану автентифікації
auth.onAuthStateChanged(user => {
  currentUser = user;
  console.log('Auth state changed:', user ? user.email : 'Not logged in');
  
  if (user) {
    db.collection('users').doc(user.uid).get().then(doc => {
      if (doc.exists) {
        userRole = doc.data().role;
        console.log('User role:', userRole);
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
      db.collection('users').doc(user.uid).set({
        email: email,
        name: name,
        studentId: studentId,
        room: room,
        role: 'student',
        createdAt: new Date(),
        balance: 0,
        lastAccess: null
      });
      showAlert('✅ Реєстрація успішна! Перенаправляю...', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    })
    .catch(error => {
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
  if (!currentUser || !db) return;

  db.collection('users').doc(currentUser.uid).get().then(doc => {
    if (doc.exists) {
      const userData = doc.data();
      const elem1 = document.getElementById('user-name');
      const elem2 = document.getElementById('user-email');
      const elem3 = document.getElementById('user-room');
      const elem4 = document.getElementById('user-balance');
      
      if (elem1) elem1.textContent = userData.name;
      if (elem2) elem2.textContent = userData.email;
      if (elem3) elem3.textContent = userData.room;
      if (elem4) elem4.textContent = (userData.balance || 0) + ' грн';
    }
  }).catch(err => console.error('Помилка при завантаженні даних:', err));
}
