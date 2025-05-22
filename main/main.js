const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const db = require('./database');
const bcrypt = require('bcrypt');
const fs = require('fs');

let mainWindow;
let currentUser = null;
const userSessionPath = path.join(app.getPath('userData'), 'user-session.json');

// Modify existing createWindow function
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true
        },
        icon: path.join(__dirname, '../assets/icon.png'),
        autoHideMenuBar: true,
    });

    mainWindow.maximize();

    // Check for saved session
    const hasValidSession = loadSavedSession();

    // Load appropriate page based on session status
    if (hasValidSession) {
        mainWindow.loadFile(path.join(__dirname, '../renderer/home.html'));
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
}


app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

//if needed in future
// app.on('before-quit', () => {
//     // This will clear ALL stored data including cookies, local storage, etc.
//     session.defaultSession.clearStorageData({
//       storages: ['cookies', 'localstorage', 'caches', 'indexdb', 'websql', 'serviceworkers']
//     }).then(() => {
//       console.log('All webview data cleared before quitting');
//     }).catch(err => {
//       console.error('Error clearing webview data:', err);
//     });
//   });

// Hash password
async function hashPassword(password) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
}

// Compare password
async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

function loadSavedSession() {
    try {
        if (fs.existsSync(userSessionPath)) {
            const sessionData = JSON.parse(fs.readFileSync(userSessionPath, 'utf8'));
            // Check if session is still valid (you might want to add expiration logic)
            if (sessionData && sessionData.user) {
                currentUser = sessionData.user;
                return true;
            }
        }
    } catch (error) {
        console.error('Error loading saved session:', error);
    }
    return false;
}
function saveSession(userData) {
    try {
        const sessionData = {
            user: userData,
            timestamp: Date.now()
        };
        fs.writeFileSync(userSessionPath, JSON.stringify(sessionData));
    } catch (error) {
        console.error('Error saving session:', error);
    }
}

// Clear session data
function clearSession() {
    try {
        if (fs.existsSync(userSessionPath)) {
            fs.unlinkSync(userSessionPath);
        }
    } catch (error) {
        console.error('Error clearing session:', error);
    }
}

// Register new user
ipcMain.handle('register-user', async (event, userData) => {
    try {
        // Check if email already exists
        const existingUser = await getUserByEmail(userData.email);
        if (existingUser) {
            return { success: false, message: 'Email already registered' };
        }

        // Hash the password
        const hashedPassword = await hashPassword(userData.password);

        // Save user to database
        const userId = await saveUserToDB({
            name: userData.name,
            email: userData.email,
            password: hashedPassword
        });

        return { success: true, userId };
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: error.message };
    }
});

ipcMain.handle('login-user', async (event, loginData) => {
    try {
        const user = await getUserByEmail(loginData.email);

        if (!user) {
            return { success: false, message: 'User not found' };
        }

        const passwordMatch = await comparePassword(loginData.password, user.password);

        if (!passwordMatch) {
            return { success: false, message: 'Invalid password' };
        }

        // Set current user
        currentUser = {
            id: user.id,
            name: user.name,
            email: user.email
        };

        // Save session
        saveSession(currentUser);

        return {
            success: true,
            user: currentUser
        };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: error.message };
    }
});



// Get current user
ipcMain.handle('get-current-user', (event) => {
    return currentUser;
});

// Navigate to home page
ipcMain.on('navigate-to-home', (event) => {
    if (!currentUser) {
        return;
    }

    mainWindow.loadFile(path.join(__dirname, '../renderer/home.html'));
});

// Update logout handler
ipcMain.on('logout', (event) => {
    currentUser = null;

    // Clear session data
    clearSession();

    // Clear session data
    session.defaultSession.clearStorageData()
        .then(() => {
            console.log('All cookies cleared');
            mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
        })
        .catch(error => {
            console.error('Failed to clear cookies:', error);
        });
});

// Database helper functions
async function getUserByEmail(email) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM user WHERE email = ?", [email], (err, row) => {
            if (err) reject(err);
            resolve(row);
        });
    });
}

async function getUserById(id) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM user WHERE id = ?", [id], (err, row) => {
            if (err) reject(err);
            resolve(row);
        });
    });
}

async function saveUserToDB(userData) {
    return new Promise((resolve, reject) => {
        const { name, email, password } = userData;
        db.run(
            "INSERT INTO user (name, email, password) VALUES (?, ?, ?)",
            [name, email, password],
            function (err) {
                if (err) reject(err);
                resolve(this.lastID);
            }
        );
    });
}