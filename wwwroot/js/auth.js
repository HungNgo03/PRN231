// Authentication UI management
function checkAuthStatus() {
    const authButtons = document.querySelector("#auth-buttons")
    const userInfo = document.querySelector("#user-info")
    const adminLinks = document.querySelectorAll(".admin-only")
    const usernameDisplay = document.querySelector("#username-display")

    // Get authentication data from localStorage
    const token = localStorage.getItem("authToken")
    const username = localStorage.getItem("username")
    const userRole = localStorage.getItem("userRole")

    if (token && username) {
        // User is logged in
        if (authButtons) authButtons.style.display = "none"
        if (userInfo) {
            userInfo.style.display = "flex"
            if (usernameDisplay) usernameDisplay.textContent = username
        }

        // Show admin links only if user is admin
        if (userRole === "Admin") {
            adminLinks.forEach((link) => (link.style.display = "block"))
        } else {
            adminLinks.forEach((link) => (link.style.display = "none"))
        }
    } else {
        // User is not logged in
        if (authButtons) authButtons.style.display = "flex"
        if (userInfo) userInfo.style.display = "none"
        adminLinks.forEach((link) => (link.style.display = "none"))

        // If on admin page, redirect to home
        if (window.location.pathname.includes("admin")) {
            window.location.href = "index.html"
        }
    }

    // Add logout event listener
    const logoutBtn = document.querySelector("#logout-btn")
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("authToken")
            localStorage.removeItem("username")
            localStorage.removeItem("userRole")
            window.location.href = "index.html"
        })
    }
}

// Function to handle successful login
function handleLoginSuccess(token, username, role) {
    localStorage.setItem("authToken", token)
    localStorage.setItem("username", username)
    localStorage.setItem("userRole", role)
    checkAuthStatus()
    console.log("Login successful: " + token)
    // Redirect to home page
    window.location.href = "index.html"
}

// Call checkAuthStatus when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    checkAuthStatus()
})

// Add cart count to navbar
function updateAuthUI() {
    const isLoggedIn = localStorage.getItem("authToken") && localStorage.getItem("username")
    const username = localStorage.getItem("username") || ""
    const isAdmin = localStorage.getItem("userRole") === "Admin"

    const navbarRight = document.querySelector(".navbar-right")
    if (navbarRight) {
        navbarRight.innerHTML = isLoggedIn
            ? `<div class="d-flex align-items-center" id="user-info">
                 <a href="cart.html" class="btn btn-outline-light me-3 position-relative">
                   <i class="fas fa-shopping-cart"></i>
                   <span id="cart-count" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                         style="display: none;">0</span>
                 </a>
                 <div class="d-flex align-items-center me-3 px-3 py-1 bg-white bg-opacity-10 rounded">
                   <i class="fas fa-user-circle me-2"></i>
                   <span class="navbar-text fw-semibold" id="username-display">${username}</span>
                   ${isAdmin ? '<span class="badge bg-warning text-dark ms-2">Admin</span>' : ""}
                 </div>
                 <button class="btn btn-outline-light" id="logout-btn">
                   <i class="fas fa-sign-out-alt me-1"></i>
                   Logout
                 </button>
               </div>`
            : `<div class="d-flex" id="auth-buttons">
                 <a href="login.html" class="btn btn-light me-2">
                   <i class="fas fa-sign-in-alt me-1"></i>
                   Login
                 </a>
                 <a href="register.html" class="btn btn-outline-light">
                   <i class="fas fa-user-plus me-1"></i>
                   Register
                 </a>
               </div>`
    }

    // Update cart count if cart exists
    try {
        if (typeof cart !== "undefined") {
            cart.updateCartUI()
        }
    } catch (e) {
        console.warn("Cart is not defined or an error occurred:", e)
    }

    // Xử lý admin link
    const adminLinks = document.querySelectorAll(".admin-only")
    adminLinks.forEach((link) => {
        link.style.display = isLoggedIn && isAdmin ? "block" : "none"
    })

    // Thêm event listener cho logout
    const logoutBtn = document.querySelector("#logout-btn")
    if (logoutBtn) {
        logoutBtn.addEventListener("click", handleLogout)
    }
}

function handleLogout() {
    localStorage.removeItem("authToken")
    localStorage.removeItem("username")
    localStorage.removeItem("userRole")
    window.location.href = "index.html"
}

// Override checkAuthStatus to use updateAuthUI
checkAuthStatus = updateAuthUI

// Call checkAuthStatus when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    checkAuthStatus()
})

