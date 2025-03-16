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
        const token = localStorage.getItem("token")
        if (!token) {
            Swal.fire({
                title: 'Authentication Required',
                text: 'Please log in to add items to your cart',
                icon: 'info',
                confirmButtonText: 'Go to Login'
            }).then((result) => {
                if (result.isConfirmed) {
                    
                    window.location.href = "login.html"
                }
            })
            return
        }

        // Get book details
        const response = await fetch(`/api/books/${bookId}`)
        if (!response.ok) throw new Error("Failed to fetch book details")

        const book = await response.json()

        // Check stock
        if (book.stockQuantity < quantity) {
            Swal.fire({
                title: 'Limited Stock',
                text: `Sorry, only ${book.stockQuantity} items available in stock`,
                icon: 'warning',
                confirmButtonText: 'OK'
            })
            return
        }

        // Add to cart
        cart.addItem(book, quantity)

        // Show success message
        Swal.fire({
            title: 'Added to Cart',
            text: `Added ${quantity} copy/copies of "${book.title}" to your cart!`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        })
    } catch (error) {
        console.error("Error adding to cart:", error)
        Swal.fire({
            title: 'Error',
            text: "Error adding to cart: " + error.message,
            icon: 'error',
            confirmButtonText: 'OK'
        })
    }
}

// Show toast notification
function showToast(title, message, type = "info") {
    Swal.fire({
        title: title,
        text: message,
        icon: type === "error" ? "error" : "success",
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    })
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

// Process order function
// Process order function with stock reduction
async function processOrder() {
    try {
        const token = localStorage.getItem("authToken");
        if (!token) {
            Swal.fire({
                title: 'Authentication Required',
                text: 'Please log in to proceed with the checkout',
                icon: 'info',
                confirmButtonText: 'Go to Login'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = "login.html";
                }
            });
            return;
        }

        // Validate cart
        if (cart.items.length === 0) {
            Swal.fire({
                title: 'Empty Cart',
                text: 'Your cart is empty. Add some books before checking out!',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        // Show loading state
        Swal.fire({
            title: 'Processing Order',
            text: 'Please wait while we process your order...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Prepare order data with Status
        const orderData = {
            status: "Success", 
            orderDetails: cart.items.map((item) => ({
                bookId: item.bookId,
                quantity: item.quantity,
                unitPrice: item.price,
            })),
        };

        // Send order to server
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(orderData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => {
                throw new Error("Failed to process order");
            });
            throw new Error(errorData.message || "Failed to process order");
        }

        const orderResult = await response.json();

        // Clear cart after successful order
        cart.clear();

        // Show success message
        Swal.fire({
            title: 'Order Placed Successfully!',
            text: 'Your order has been placed and is being processed.',
            icon: 'success',
            confirmButtonText: 'View My Orders'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = "orders.html";
            } else {
                window.location.href = "orders.html";
            }
        });
    } catch (error) {
        console.error("Error processing order:", error);
        Swal.fire({
            title: 'Error',
            text: error.message || "Failed to process your order. Please try again.",
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}
