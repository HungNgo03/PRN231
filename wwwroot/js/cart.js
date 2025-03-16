// Cart management
class Cart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem("cart")) || []
    }

    // Save cart to localStorage
    save() {
        localStorage.setItem("cart", JSON.stringify(this.items))
        this.updateCartUI()
    }

    // Add item to cart
    addItem(book, quantity = 1) {
        const existingItem = this.items.find((item) => item.bookId === book.bookId)

        if (existingItem) {
            // Check stock
            if (existingItem.quantity + quantity > book.stockQuantity) {
                throw new Error("Not enough stock available")
            }
            existingItem.quantity += quantity
        } else {
            // Check stock
            if (quantity > book.stockQuantity) {
                throw new Error("Not enough stock available")
            }
            this.items.push({
                bookId: book.bookId,
                title: book.title,
                price: book.price,
                quantity: quantity,
                imageUrl: book.imageUrl,
            })
        }

        this.save()
    }

    // Remove item from cart
    removeItem(bookId) {
        this.items = this.items.filter((item) => item.bookId !== bookId)
        this.save()
    }

    // Update item quantity
    updateQuantity(bookId, quantity) {
        const item = this.items.find((item) => item.bookId === bookId)
        if (item) {
            item.quantity = quantity
            this.save()
        }
    }

    // Clear cart
    clear() {
        this.items = []
        this.save()
    }

    // Get cart total
    getTotal() {
        return this.items.reduce((total, item) => total + item.price * item.quantity, 0)
    }

    // Get number of items in cart
    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0)
    }

    // Update cart UI
    updateCartUI() {
        const cartCount = document.getElementById("cart-count")
        if (cartCount) {
            const count = this.getItemCount()
            cartCount.textContent = count
            cartCount.style.display = count > 0 ? "inline" : "none"
        }
    }
}

// Initialize cart
const cart = new Cart()

// Add to cart function
async function addToCart(bookId, quantity = 1) {
    try {
        // Check if user is logged in
        const token = localStorage.getItem("authToken")
        if (!token) {
            alert("Please log in to add items to your cart")
            window.location.href = "login.html"
            return
        }

        // Get book details
        const response = await fetch(`/api/books/${bookId}`)
        if (!response.ok) throw new Error("Failed to fetch book details")

        const book = await response.json()

        // Check stock
        if (book.stockQuantity < quantity) {
            alert(`Sorry, only ${book.stockQuantity} items available in stock`)
            return
        }

        // Add to cart
        cart.addItem(book, quantity)

        // Show success message
        alert(`Added ${quantity} copy/copies of "${book.title}" to your cart!`)
    } catch (error) {
        console.error("Error adding to cart:", error)
        alert("Error adding to cart: " + error.message)
    }
}

// Show toast notification
function showToast(title, message, type = "info") {
    const toastContainer = document.getElementById("toast-container") || createToastContainer()

    const toast = document.createElement("div")
    toast.className = `toast show bg-${type === "error" ? "danger" : "success"} text-white`
    toast.setAttribute("role", "alert")
    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${title}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">${message}</div>
    `

    toastContainer.appendChild(toast)

    setTimeout(() => {
        toast.remove()
    }, 3000)
}

// Create toast container if it doesn't exist
function createToastContainer() {
    const container = document.createElement("div")
    container.id = "toast-container"
    container.className = "position-fixed bottom-0 end-0 p-3"
    container.style.zIndex = "1050"
    document.body.appendChild(container)
    return container
}

// Add a new function to validate stock before checkout
async function validateStockBeforeCheckout() {
    try {
        // Check if cart is empty
        if (cart.items.length === 0) {
            return { success: false, message: "Your cart is empty" }
        }

        // Validate each item's stock
        for (const item of cart.items) {
            const response = await fetch(`/api/books/${item.bookId}`)
            if (!response.ok) {
                return {
                    success: false,
                    message: `Failed to verify stock for "${item.title}"`,
                }
            }

            const book = await response.json()

            if (book.stockQuantity < item.quantity) {
                return {
                    success: false,
                    message: `Only ${book.stockQuantity} copies of "${item.title}" are available`,
                }
            }
        }

        return { success: true }
    } catch (error) {
        console.error("Error validating stock:", error)
        return { success: false, message: "Failed to validate stock availability" }
    }
}

// Update the processOrder function to include stock validation before checkout
async function processOrder() {
    try {
        const token = localStorage.getItem("authToken")
        if (!token) {
            window.location.href = "login.html"
            return
        }

        // First, validate stock availability before proceeding
        const stockValidationResults = await validateStockBeforeCheckout()
        if (!stockValidationResults.success) {
            showToast("Error", stockValidationResults.message, "error")
            return
        }

        const orderData = {
            orderDetails: cart.items.map((item) => ({
                bookId: item.bookId,
                quantity: item.quantity,
                unitPrice: item.price,
            })),
        }

        const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(orderData),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || "Failed to process order")
        }

        const orderResult = await response.json()

        // Clear cart after successful order
        cart.clear()

        // Show success message
        showToast("Success", "Order placed successfully!", "success")

        // Redirect to orders page
        setTimeout(() => {
            window.location.href = "orders.html"
        }, 2000)
    } catch (error) {
        console.error("Error processing order:", error)
        showToast("Error", error.message, "error")
    }
}

