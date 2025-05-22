// const { ipcRenderer } = require('electron');

// // Get DOM elements
// const userNameElement = document.getElementById('user-name');
// const logoutButton = document.getElementById('logout-btn');
// const claudeButton = document.getElementById('claude-btn');
// const gptButton = document.getElementById('gpt-btn');
// const aiWebview = document.getElementById('ai-webview');

// // Get current user info when page loads
// document.addEventListener('DOMContentLoaded', async () => {
//     try {
//         const userData = await ipcRenderer.invoke('get-current-user');
//         if (userData) {
//             userNameElement.textContent = userData.name;
//         } else {
//             // If no user data, redirect back to login
//             ipcRenderer.send('logout');
//         }
//     } catch (error) {
//         console.error('Error loading user data:', error);
//         ipcRenderer.send('logout');
//     }
// });

// // Handle logout button click
// logoutButton.addEventListener('click', () => {
//     ipcRenderer.send('logout');
// });

// // Handle Claude button click
// claudeButton.addEventListener('click', () => {
//     setActiveAI('claude');
//     aiWebview.src = 'https://claude.ai';
// });

// // Handle ChatGPT button click
// gptButton.addEventListener('click', () => {
//     setActiveAI('gpt');
//     aiWebview.src = 'https://chat.openai.com';
// });

// // Set active AI button
// function setActiveAI(ai) {
//     if (ai === 'claude') {
//         claudeButton.classList.add('active');
//         gptButton.classList.remove('active');
//     } else {
//         gptButton.classList.add('active');
//         claudeButton.classList.remove('active');
//     }
// }

// // Listen for webview load events
// aiWebview.addEventListener('did-start-loading', () => {
//     console.log('Webview started loading');
// });

// aiWebview.addEventListener('did-finish-load', () => {
//     console.log('Webview finished loading');
// });

// aiWebview.addEventListener('did-fail-load', (event) => {
//     console.error('Webview failed to load:', event);
// });

// // Listen for console messages from webview
// aiWebview.addEventListener('console-message', (event) => {
//     console.log('Webview console:', event.message);
// });

const { ipcRenderer } = require('electron');

// Get DOM elements
const userNameElement = document.getElementById('user-name');
const userAvatarElement = document.querySelector('.user-avatar');
const logoutButton = document.getElementById('logout-btn');
const claudeButton = document.getElementById('claude-btn');
const gptButton = document.getElementById('gpt-btn');
const aiWebview = document.getElementById('ai-webview');
const themeToggle = document.getElementById('theme-toggle');
const statusText = document.querySelector('.status-left span:last-child');
const sidebarMenuItems = document.querySelectorAll('.sidebar-menu a');

// Get current user info when page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const userData = await ipcRenderer.invoke('get-current-user');
        if (userData) {
            // Update user name
            userNameElement.textContent = userData.name;

            // Set avatar initial
            if (userData.name && userData.name.length > 0) {
                userAvatarElement.textContent = userData.name.charAt(0).toUpperCase();
            }

            // Restore user preferences if available
            if (userData.preferences) {
                // Restore theme preference
                if (userData.preferences.darkMode) {
                    toggleDarkMode(true);
                }

                // Restore last used AI
                if (userData.preferences.lastUsedAI) {
                    setActiveAI(userData.preferences.lastUsedAI);
                    loadAIWebview(userData.preferences.lastUsedAI);
                }
            }
        } else {
            // If no user data, redirect back to login
            ipcRenderer.send('logout');
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        ipcRenderer.send('logout');
    }
});

// Handle logout button click
logoutButton.addEventListener('click', () => {
    // Save user preferences before logout
    saveUserPreferences();
    ipcRenderer.send('logout');
});

// Handle Claude button click
claudeButton.addEventListener('click', () => {
    setActiveAI('claude');
    loadAIWebview('claude');
    updateStatusBar('Connected to Claude AI');
    saveUserPreferences();
});

// Handle ChatGPT button click
gptButton.addEventListener('click', () => {
    setActiveAI('gpt');
    loadAIWebview('gpt');
    updateStatusBar('Connected to ChatGPT');
    saveUserPreferences();
});

// Load appropriate webview based on AI selection
function loadAIWebview(ai) {
    if (ai === 'claude') {
        aiWebview.src = 'https://claude.ai';
    } else {
        aiWebview.src = 'https://chat.openai.com';
    }
}

// Update status bar text
function updateStatusBar(message) {
    statusText.textContent = message;
}

// Set active AI button
function setActiveAI(ai) {
    if (ai === 'claude') {
        claudeButton.classList.add('active');
        gptButton.classList.remove('active');
    } else {
        gptButton.classList.add('active');
        claudeButton.classList.remove('active');
    }
}

// Handle theme toggle
themeToggle.addEventListener('click', () => {
    const themeIcon = themeToggle.querySelector('i');
    const isDarkMode = themeIcon.classList.contains('fa-sun');
    toggleDarkMode(!isDarkMode);
    saveUserPreferences();
});

// Toggle between light and dark mode
function toggleDarkMode(enableDark) {
    const themeIcon = themeToggle.querySelector('i');

    if (enableDark) {
        document.documentElement.style.setProperty('--bg-color', '#1a202c');
        document.documentElement.style.setProperty('--card-bg', '#2d3748');
        document.documentElement.style.setProperty('--text-color', '#f7fafc');
        document.documentElement.style.setProperty('--text-secondary', '#a0aec0');
        document.documentElement.style.setProperty('--shadow-color-dark', '#171923');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        document.documentElement.style.setProperty('--bg-color', '#f0f4f8');
        document.documentElement.style.setProperty('--card-bg', '#ffffff');
        document.documentElement.style.setProperty('--text-color', '#2d3748');
        document.documentElement.style.setProperty('--text-secondary', '#718096');
        document.documentElement.style.setProperty('--shadow-color-dark', '#d1d9e6');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
}

// Handle sidebar menu item clicks
sidebarMenuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove active class from all items
        sidebarMenuItems.forEach(menuItem => {
            menuItem.classList.remove('active');
        });

        // Add active class to clicked item
        item.classList.add('active');

        // For demonstration purposes only - showing what would happen when clicking menu items
        const sectionName = item.textContent.trim();
        console.log(`Navigating to: ${sectionName}`);

        // You could add functionality to show different content based on the selection
        // For now, just update the status bar
        updateStatusBar(`Viewing ${sectionName}`);
    });
});

// Save user preferences
function saveUserPreferences() {
    const themeIcon = themeToggle.querySelector('i');
    const isDarkMode = themeIcon.classList.contains('fa-sun');
    const lastUsedAI = claudeButton.classList.contains('active') ? 'claude' : 'gpt';

    const preferences = {
        darkMode: isDarkMode,
        lastUsedAI: lastUsedAI
    };

    // Send preferences to main process
    ipcRenderer.send('save-user-preferences', preferences);
}

// Listen for webview load events
aiWebview.addEventListener('did-start-loading', () => {
    console.log('Webview started loading');
    updateStatusBar('Loading...');
});

aiWebview.addEventListener('did-finish-load', () => {
    console.log('Webview finished loading');
    const currentAI = claudeButton.classList.contains('active') ? 'Claude AI' : 'ChatGPT';
    updateStatusBar(`Connected to ${currentAI}`);
});

aiWebview.addEventListener('did-fail-load', (event) => {
    console.error('Webview failed to load:', event);
    updateStatusBar('Failed to load. Check your connection.');
});

// Listen for console messages from webview
aiWebview.addEventListener('console-message', (event) => {
    console.log('Webview console:', event.message);
});

// Add resize handler for responsive design
window.addEventListener('resize', () => {
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth < 768) {
        sidebar.style.display = 'none';
    } else {
        sidebar.style.display = 'flex';
    }
});

// Initialize the app's responsive state on load
window.dispatchEvent(new Event('resize'));