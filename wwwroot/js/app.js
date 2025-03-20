// Import Bootstrap (if not already included in your HTML)
// import * as bootstrap from 'bootstrap';

// API base URL
const apiBaseUrl = "/api"

// API request helper with improved error handling
async function apiRequest(endpoint, method = "GET", data = null) {
    const headers = {
        "Content-Type": "application/json",
    }

    // Get token from localStorage (managed by auth.js)
    const token = localStorage.getItem("authToken")
    if (token) {
        headers["Authorization"] = `Bearer ${token}`
    }

    const options = {
        method,
        headers,
    }

    if (data && (method === "POST" || method === "PUT")) {
        options.body = JSON.stringify(data)
    }

    try {
        const response = await fetch(`${apiBaseUrl}/${endpoint}`, options)

        // If unauthorized, let auth.js handle the logout
        if (response.status === 401) {
            // Clear auth data and redirect to login
            localStorage.removeItem("authToken")
            localStorage.removeItem("username")
            localStorage.removeItem("userRole")
            window.location.href = "login.html"
            throw new Error("Unauthorized. Please log in again.")
        }

        const contentType = response.headers.get("content-type")
        const responseData = contentType?.includes("application/json") ? await response.json() : null

        if (!response.ok) {
            throw new Error(responseData?.message || `API request failed: ${response.status}`)
        }

        return response.status === 204 ? true : responseData
    } catch (error) {
        console.error(`API request error at ${endpoint}:`, error)
        throw error
    }
}

// Load featured books for homepage
async function loadFeaturedBooks() {
    try {
        const books = await apiRequest("books?$top=4")
        const featuredBooksContainer = document.getElementById("featured-books")

        if (!books || !featuredBooksContainer) return

        featuredBooksContainer.innerHTML = ""

        books.forEach((book) => {
            const bookCard = document.createElement("div")
            bookCard.className = "col-md-3"
            bookCard.innerHTML = `
                <div class="card book-card h-100 shadow-sm">
                    <img src="${book.imageUrl || "/placeholder.svg?height=200&width=200"}" 
                         class="card-img-top" 
                         alt="${book.title}" 
                         style="height: 200px; object-fit: cover;"
                         onerror="this.onerror=null; this.src='/placeholder.svg?height=200&width=200';">
                    <div class="card-body">
                        <h5 class="card-title">${book.title}</h5>
                        <p class="card-text text-truncate">${book.description || "No description available"}</p>
                        <p class="card-text"><strong>$${book.price.toFixed(2)}</strong></p>
                    </div>
                    <div class="card-footer bg-white border-top-0">
                        <a href="book-details.html?id=${book.bookId}" class="btn btn-primary btn-sm w-100">View Details</a>
                    </div>
                </div>
            `
            featuredBooksContainer.appendChild(bookCard)
        })
    } catch (error) {
        console.error("Error loading featured books:", error)
        const featuredBooksContainer = document.getElementById("featured-books")
        if (featuredBooksContainer) {
            featuredBooksContainer.innerHTML =
                '<div class="col-12 text-center"><p>Error loading featured books. Please try again later.</p></div>'
        }
    }
}

// Load books with error handling for images
async function loadBooks(categoryId = null, searchTerm = null, page = 1, pageSize = 8) {
    try {
        let url = `books?$skip=${(page - 1) * pageSize}&$top=${pageSize}&$count=true`

        if (categoryId) {
            url += `&$filter=categoryId eq ${categoryId}`
        }

        if (searchTerm) {
            const searchFilter = `contains(tolower(title), '${searchTerm.toLowerCase()}')`
            url += categoryId ? ` and ${searchFilter}` : `&$filter=${searchFilter}`
        }

        const data = await apiRequest(url)
        const books = data.value || data
        const totalBooks = data["@odata.count"] || books.length

        const booksContainer = document.getElementById("books-container")

        if (!books || !booksContainer) return { books: [], total: 0 }

        booksContainer.innerHTML = ""

        if (books.length === 0) {
            booksContainer.innerHTML =
                '<div class="col-12 text-center py-5"><p>No books found matching your criteria.</p></div>'
            return { books: [], total: 0 }
        }

        books.forEach((book) => {
            const bookCard = document.createElement("div")
            bookCard.className = "col-md-3 mb-4"
            bookCard.innerHTML = `
                <div class="card book-card h-100 shadow-sm">
                    <img src="${book.imageUrl || "/placeholder.svg?height=200&width=200"}" 
                         class="card-img-top" 
                         alt="${book.title}" 
                         style="height: 200px; object-fit: cover;"
                         onerror="this.onerror=null; this.src='/placeholder.svg?height=200&width=200';">
                    <div class="card-body">
                        <h5 class="card-title">${book.title}</h5>
                        <p class="card-text text-truncate">${book.description || "No description available"}</p>
                        <p class="card-text"><strong>$${book.price.toFixed(2)}</strong></p>
                    </div>
                    <div class="card-footer bg-white border-top-0">
                        <button class="btn btn-primary btn-sm w-100 view-book" data-id="${book.bookId}">View Details</button>
                    </div>
                </div>
            `
            booksContainer.appendChild(bookCard)
        })

        // Add event listeners to view buttons
        document.querySelectorAll(".view-book").forEach((button) => {
            button.addEventListener("click", () => {
                const bookId = button.getAttribute("data-id")
                viewBookDetails(bookId)
            })
        })

        return { books, total: totalBooks }
    } catch (error) {
        console.error("Error loading books:", error)
        const booksContainer = document.getElementById("books-container")
        if (booksContainer) {
            booksContainer.innerHTML =
                '<div class="col-12 text-center py-5"><p>Error loading books. Please try again later.</p></div>'
        }
        return { books: [], total: 0 }
    }
}

// Generate pagination
function generatePagination(currentPage, totalItems, pageSize, onPageChange) {
    const totalPages = Math.ceil(totalItems / pageSize)
    const pagination = document.getElementById("pagination")

    if (!pagination) return

    pagination.innerHTML = ""

    if (totalPages <= 1) return

    // Previous button
    const prevLi = document.createElement("li")
    prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`
    prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`
    prevLi.addEventListener("click", (e) => {
        e.preventDefault()
        if (currentPage > 1) {
            onPageChange(currentPage - 1)
        }
    })
    pagination.appendChild(prevLi)

    // Page numbers
    const startPage = Math.max(1, currentPage - 2)
    const endPage = Math.min(totalPages, startPage + 4)

    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement("li")
        pageLi.className = `page-item ${i === currentPage ? "active" : ""}`
        pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`
        pageLi.addEventListener("click", (e) => {
            e.preventDefault()
            onPageChange(i)
        })
        pagination.appendChild(pageLi)
    }

    // Next button
    const nextLi = document.createElement("li")
    nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`
    nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&laquo;</span></a>`
    nextLi.addEventListener("click", (e) => {
        e.preventDefault()
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1)
        }
    })
    pagination.appendChild(nextLi)
}

// Load categories
async function loadCategories() {
    try {
        const categories = await apiRequest("categories")
        const categoriesContainer = document.getElementById("categories-container")

        if (!categories || !categoriesContainer) return []

        categoriesContainer.innerHTML = ""

        if (categories.length === 0) {
            categoriesContainer.innerHTML = '<div class="col-12 text-center py-5"><p>No categories found.</p></div>'
            return []
        }

        categories.forEach((category) => {
            const categoryCard = document.createElement("div")
            categoryCard.className = "col-md-4 mb-4"
            categoryCard.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <div class="card-body">
                        <h3 class="card-title">${category.name}</h3>
                        <p class="card-text">${category.description || "No description available"}</p>
                    </div>
                    <div class="card-footer bg-white border-top-0">
                        <a href="books.html?category=${category.categoryId}" class="btn btn-primary w-100">View Books</a>
                    </div>
                </div>
            `
            categoriesContainer.appendChild(categoryCard)
        })

        return categories
    } catch (error) {
        console.error("Error loading categories:", error)
        const categoriesContainer = document.getElementById("categories-container")
        if (categoriesContainer) {
            categoriesContainer.innerHTML =
                '<div class="col-12 text-center py-5"><p>Error loading categories. Please try again later.</p></div>'
        }
        return []
    }
}

// Load categories for filter dropdown
async function loadCategoriesForFilter(selectElementId = "category-filter") {
    try {
        const categories = await apiRequest("categories")
        const categoryFilter = document.getElementById(selectElementId)

        if (!categories || !categoryFilter) return

        // Keep the "All Categories" option
        categoryFilter.innerHTML = '<option value="">All Categories</option>'

        categories.forEach((category) => {
            const option = document.createElement("option")
            option.value = category.categoryId
            option.textContent = category.name
            categoryFilter.appendChild(option)
        })
    } catch (error) {
        console.error("Error loading categories for filter:", error)
    }
}

// View book details
async function viewBookDetails(bookId) {
    try {
        const book = await apiRequest(`books/${bookId}`)

        if (!book) {
            alert("Book not found.")
            return
        }

        // Populate modal with book details
        document.getElementById("modal-book-title").textContent = book.title
        document.getElementById("modal-book-image").src = book.imageUrl || "/placeholder.svg?height=300&width=200"
        document.getElementById("modal-book-isbn").textContent = book.isbn
        document.getElementById("modal-book-date").textContent = book.publishedDate
            ? new Date(book.publishedDate).toLocaleDateString()
            : "N/A"
        document.getElementById("modal-book-price").textContent = `$${book.price.toFixed(2)}`
        document.getElementById("modal-book-category").textContent = book.category ? book.category.name : "N/A"
        document.getElementById("modal-book-publisher").textContent = book.publisher ? book.publisher.name : "N/A"
        document.getElementById("modal-book-stock").textContent = book.stockQuantity
        document.getElementById("modal-book-description").textContent = book.description || "No description available"

        // Set up view full details button
        document.getElementById("modal-view-details").onclick = () => {
            window.location.href = `book-details.html?id=${book.bookId}`
        }

        // Show the modal
        const bookDetailsModal = new bootstrap.Modal(document.getElementById("bookDetailsModal"))
        bookDetailsModal.show()
    } catch (error) {
        console.error("Error loading book details:", error)
        alert("Error loading book details. Please try again later.")
    }
}

// Add cart functionality to book details
async function loadBookDetails(bookId) {
    try {
        const response = await fetch(`${apiBaseUrl}/books/${bookId}`)
        if (response.ok) {
            const book = await response.json()

            // Update page title
            document.title = `${book.title} - Book Store API Client`

            // Update breadcrumb
            const breadcrumb = document.getElementById("book-title-breadcrumb")
            if (breadcrumb) {
                breadcrumb.textContent = book.title
            }

            // Create book details HTML
            const bookDetailsContainer = document.getElementById("book-details-container")
            if (!bookDetailsContainer) return

            bookDetailsContainer.innerHTML = `
                <div class="card shadow-sm border-0">
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4 mb-4 mb-md-0">
                                <img src="${book.imageUrl || "/placeholder.svg?height=400&width=300"}" 
                                     class="img-fluid rounded" 
                                     alt="${book.title}"
                                     onerror="this.onerror=null; this.src='/placeholder.svg?height=400&width=300';">
                            </div>
                            <div class="col-md-8">
                                <h1 class="mb-3">${book.title}</h1>
                                <div class="mb-4">
                                    <span class="badge bg-primary me-2">${book.category ? book.category.name : "Uncategorized"}</span>
                                    <span class="badge bg-secondary">${book.publisher ? book.publisher.name : "Unknown Publisher"}</span>
                                </div>
                                <p class="fs-4 fw-bold text-primary mb-3">$${book.price.toFixed(2)}</p>
                                <div class="mb-3">
                                    <p><strong>ISBN:</strong> ${book.isbn}</p>
                                    <p><strong>Published Date:</strong> ${book.publishedDate ? new Date(book.publishedDate).toLocaleDateString() : "N/A"}</p>
                                    <p><strong>Stock:</strong> <span class="badge bg-${book.stockQuantity > 0 ? "success" : "danger"}">${book.stockQuantity} available</span></p>
                                </div>
                                <div class="mb-4">
                                    <h5>Description</h5>
                                    <p>${book.description || "No description available"}</p>
                                </div>
                                <div class="d-flex align-items-center">
                                    <div class="input-group me-3" style="width: 150px;">
                                        <button class="btn btn-outline-secondary" type="button" onclick="updateQuantityInput(-1)">
                                            <i class="fas fa-minus"></i>
                                        </button>
                                        <input type="number" class="form-control text-center" id="quantity-input" 
                                               value="1" min="1" max="${book.stockQuantity}">
                                        <button class="btn btn-outline-secondary" type="button" onclick="updateQuantityInput(1)">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                    <button class="btn btn-primary btn-lg ${book.stockQuantity === 0 ? "disabled" : ""}"
                                            onclick="addToCartFromDetails(${book.bookId})"
                                            ${book.stockQuantity === 0 ? "disabled" : ""}>
                                        <i class="fas fa-shopping-cart me-2"></i>
                                        ${book.stockQuantity === 0 ? "Out of Stock" : "Add to Cart"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        } else {
            const bookDetailsContainer = document.getElementById("book-details-container")
            if (bookDetailsContainer) {
                bookDetailsContainer.innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        <h4 class="alert-heading">Book Not Found</h4>
                        <p>The book you are looking for does not exist or has been removed.</p>
                        <hr>
                        <p class="mb-0">Please go back to the <a href="books.html" class="alert-link">books page</a> to browse available books.</p>
                    </div>
                `
            }
        }
    } catch (error) {
        console.error("Error loading book details:", error)
        const bookDetailsContainer = document.getElementById("book-details-container")
        if (bookDetailsContainer) {
            bookDetailsContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">Error</h4>
                    <p>An error occurred while loading the book details. Please try again later.</p>
                    <hr>
                    <p class="mb-0">Please go back to the <a href="books.html" class="alert-link">books page</a> to browse available books.</p>
                </div>
            `
        }
    }
}

// Add quantity input handler
function updateQuantityInput(delta) {
    const input = document.getElementById("quantity-input")
    const newValue = Number.parseInt(input.value) + delta
    if (newValue >= 1 && newValue <= Number.parseInt(input.max)) {
        input.value = newValue
    }
}

// Add to cart from details page
function addToCartFromDetails(bookId) {
    const quantity = Number.parseInt(document.getElementById("quantity-input").value)
    addToCart(bookId, quantity)
}

// ==================== ADMIN FUNCTIONS ====================

// Load admin data
async function loadAdminData() {
    // Check if user is admin
    const userRole = localStorage.getItem("userRole")
    if (userRole !== "Admin") {
        Swal.fire('Error', 'You do not have permission to access the admin area.', 'error').then(() => window.location.href = "index.html");
        return;
    }

    // Load books for admin table
    await loadAdminBooks()

    // Load categories for admin table
    await loadAdminCategories()

    // Load publishers for admin table
    await loadAdminPublishers()

    // Load form dropdowns
    await loadFormDropdowns()
}

// Load books for admin table
async function loadAdminBooks() {
    try {
        const books = await apiRequest("books")
        const booksTableBody = document.getElementById("books-table-body")

        if (!books || !booksTableBody) return

        booksTableBody.innerHTML = ""

        if (books.length === 0) {
            booksTableBody.innerHTML = '<tr><td colspan="9" class="text-center">No books found.</td></tr>'
            return
        }

        books.forEach((book) => {
            const row = document.createElement("tr")
            row.innerHTML = `
                <td>${book.bookId}</td>
                <td>
                    <img src="${book.imageUrl || "/placeholder.svg?height=50&width=40"}"
                         alt="${book.title}"
                         class="img-thumbnail"
                         style="height: 50px; width: 40px; object-fit: cover;"
                         onerror="this.onerror=null; this.src='/placeholder.svg?height=50&width=40';">
                    <button class="btn btn-sm btn-info upload-image" data-id="${book.bookId}">
                        <i class="fas fa-upload"></i>
                    </button>
                </td>
                <td>${book.title}</td>
                <td>${book.isbn}</td>
                <td>$${book.price.toFixed(2)}</td>
                <td>${book.category ? book.category.name : "N/A"}</td>
                <td>${book.publisher ? book.publisher.name : "N/A"}</td>
                <td>${book.stockQuantity}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-book" data-id="${book.bookId}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-book" data-id="${book.bookId}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `
            booksTableBody.appendChild(row)
        })

        // Add event listeners to edit and delete buttons
        document.querySelectorAll(".edit-book").forEach((button) => {
            button.addEventListener("click", () => {
                const bookId = button.getAttribute("data-id")
                showEditBookModal(bookId)
            })
        })

        document.querySelectorAll(".delete-book").forEach((button) => {
            button.addEventListener("click", () => {
                const bookId = button.getAttribute("data-id")
                deleteBook(bookId)
            })
        })

        // Add event listeners to upload image buttons
        document.querySelectorAll(".upload-image").forEach((button) => {
            button.addEventListener("click", () => {
                const bookId = button.getAttribute("data-id")
                showImageUploadModal(bookId)
            })
        })
    } catch (error) {
        console.error("Error loading admin books:", error)
        const booksTableBody = document.getElementById("books-table-body")
        if (booksTableBody) {
            booksTableBody.innerHTML =
                '<tr><td colspan="9" class="text-center">Error loading books. Please try again later.</td></tr>'
        }
    }
}

// Load categories for admin table
async function loadAdminCategories() {
    try {
        const categories = await apiRequest("categories")
        const categoriesTableBody = document.getElementById("categories-table-body")

        if (!categories || !categoriesTableBody) return

        categoriesTableBody.innerHTML = ""

        if (categories.length === 0) {
            categoriesTableBody.innerHTML = '<tr><td colspan="4" class="text-center">No categories found.</td></tr>'
            return
        }

        categories.forEach((category) => {
            const row = document.createElement("tr")
            row.innerHTML = `
                <td>${category.categoryId}</td>
                <td>${category.name}</td>
                <td>${category.description || ""}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-category" data-id="${category.categoryId}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-category" data-id="${category.categoryId}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `
            categoriesTableBody.appendChild(row)
        })

        document.querySelectorAll(".edit-category").forEach((button) => {
            button.addEventListener("click", () => {
                const categoryId = button.getAttribute("data-id")
                showEditCategoryModal(categoryId)
            })
        })

        document.querySelectorAll(".delete-category").forEach((button) => {
            button.addEventListener("click", () => {
                const categoryId = button.getAttribute("data-id")
                deleteCategory(categoryId)
            })
        })
    } catch (error) {
        console.error("Error loading admin categories:", error)
        const categoriesTableBody = document.getElementById("categories-table-body")
        if (categoriesTableBody) {
            categoriesTableBody.innerHTML =
                '<tr><td colspan="4" class="text-center">Error loading categories. Please try again later.</td></tr>'
        }
    }
}

// Load publishers for admin table
async function loadAdminPublishers() {
    try {
        const publishers = await apiRequest("publishers")
        const publishersTableBody = document.getElementById("publishers-table-body")

        if (!publishers || !publishersTableBody) return

        publishersTableBody.innerHTML = ""

        if (publishers.length === 0) {
            publishersTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No publishers found.</td></tr>'
            return
        }

        publishers.forEach((publisher) => {
            const row = document.createElement("tr")
            row.innerHTML = `
                <td>${publisher.publisherId}</td>
                <td>${publisher.name}</td>
                <td>${publisher.address || ""}</td>
                <td>${publisher.contact || ""}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-publisher" data-id="${publisher.publisherId}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-publisher" data-id="${publisher.publisherId}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `
            publishersTableBody.appendChild(row)
        })

        document.querySelectorAll(".edit-publisher").forEach((button) => {
            button.addEventListener("click", () => {
                const publisherId = button.getAttribute("data-id")
                showEditPublisherModal(publisherId)
            })
        })

        document.querySelectorAll(".delete-publisher").forEach((button) => {
            button.addEventListener("click", () => {
                const publisherId = button.getAttribute("data-id")
                deletePublisher(publisherId)
            })
        })
    } catch (error) {
        console.error("Error loading admin publishers:", error)
        const publishersTableBody = document.getElementById("publishers-table-body")
        if (publishersTableBody) {
            publishersTableBody.innerHTML =
                '<tr><td colspan="5" class="text-center">Error loading publishers. Please try again later.</td></tr>'
        }
    }
}

// Load form dropdowns for admin forms
async function loadFormDropdowns() {
    try {
        const categories = await apiRequest("categories")
        const publishers = await apiRequest("publishers")

        const categorySelect = document.getElementById("book-category")
        const publisherSelect = document.getElementById("book-publisher")

        if (categories && categorySelect) {
            categorySelect.innerHTML = '<option value="">Select Category</option>'
            categories.forEach((category) => {
                const option = document.createElement("option")
                option.value = category.categoryId
                option.textContent = category.name
                categorySelect.appendChild(option)
            })
        }

        if (publishers && publisherSelect) {
            publisherSelect.innerHTML = '<option value="">Select Publisher</option>'
            publishers.forEach((publisher) => {
                const option = document.createElement("option")
                option.value = publisher.publisherId
                option.textContent = publisher.name
                publisherSelect.appendChild(option)
            })
        }
    } catch (error) {
        console.error("Error loading form dropdowns:", error)
    }
}

// Show add book modal
function showAddBookModal() {
    document.getElementById("bookModalLabel").textContent = "Add New Book"
    document.getElementById("book-id").value = ""
    document.getElementById("book-form").reset()

    // Reset validation state
    const form = document.getElementById("book-form")
    form.classList.remove("was-validated")

    const bookModal = new bootstrap.Modal(document.getElementById("bookModal"))
    bookModal.show()
}

// Show edit book modal
async function showEditBookModal(bookId) {
    try {
        const book = await apiRequest(`books/${bookId}`)
        if (!book) {
            alert("Failed to load book details. Please try again.")
            return
        }

        document.getElementById("bookModalLabel").textContent = "Edit Book"
        document.getElementById("book-id").value = book.bookId
        document.getElementById("book-title").value = book.title || ""
        document.getElementById("book-isbn").value = book.isbn || ""
        document.getElementById("book-published-date").value = book.publishedDate ? book.publishedDate.split("T")[0] : ""
        document.getElementById("book-price").value = book.price || 0
        document.getElementById("book-description").value = book.description || ""
        document.getElementById("book-image-url").value = book.imageUrl || ""
        document.getElementById("book-category").value = book.categoryId || ""
        document.getElementById("book-publisher").value = book.publisherId || ""
        document.getElementById("book-stock").value = book.stockQuantity || 0

        // Reset validation state
        const form = document.getElementById("book-form")
        form.classList.remove("was-validated")

        const bookModal = new bootstrap.Modal(document.getElementById("bookModal"))
        bookModal.show()
    } catch (error) {
        console.error("Error fetching book:", error)
        alert("Failed to load book details. Please try again.")
    }
}

// Save book
async function saveBook() {
    // Validate form
    const form = document.getElementById("book-form")
    if (!form.checkValidity()) {
        form.classList.add("was-validated")
        return
    }

    const bookId = document.getElementById("book-id").value
    const isNewBook = !bookId || bookId === ""

    // Get form values
    const title = document.getElementById("book-title").value.trim()
    const isbn = document.getElementById("book-isbn").value.trim()
    const publishedDate = document.getElementById("book-published-date").value
    const categoryIdValue = document.getElementById("book-category").value
    const publisherIdValue = document.getElementById("book-publisher").value
    const priceValue = document.getElementById("book-price").value
    const stockQuantityValue = document.getElementById("book-stock").value
    const description = document.getElementById("book-description").value.trim()
    const imageUrl = document.getElementById("book-image-url").value.trim()

    // Validate required fields
    if (!title || !isbn || !priceValue) {
        alert("Please fill in all required fields (Title, ISBN, and Price)")
        return
    }

    // Create book data object with proper type conversions
    const bookData = {
        // Only include bookId for updates, not for new books
        ...(isNewBook ? {} : { bookId: Number.parseInt(bookId) }),
        title: title,
        isbn: isbn,
        publishedDate: publishedDate ? new Date(publishedDate).toISOString() : null,
        price: Number.parseFloat(priceValue),
        description: description || null,
        imageUrl: imageUrl || null,
        categoryId: categoryIdValue ? Number.parseInt(categoryIdValue) : null,
        publisherId: publisherIdValue ? Number.parseInt(publisherIdValue) : null,
        stockQuantity: stockQuantityValue ? Number.parseInt(stockQuantityValue) : 0,
    }

    try {
        // Make API request
        let result
        if (isNewBook) {
            result = await apiRequest("books", "POST", bookData)
        } else {
            result = await apiRequest(`books/${bookId}`, "PUT", bookData)
        }

        if (result !== null) {
            // Close modal and reload data
            const bookModalElement = document.getElementById("bookModal")
            const bookModalInstance = bootstrap.Modal.getInstance(bookModalElement)
            if (bookModalInstance) {
                bookModalInstance.hide()
            }
            await loadAdminData()

            // Show success message
            alert(isNewBook ? "Book created successfully!" : "Book updated successfully!")
        }
    } catch (error) {
        console.error("Error saving book:", error)
        alert(`Failed to save book: ${error.message}`)
    }
}

// Delete book
async function deleteBook(bookId) {
    if (!confirm("Are you sure you want to delete this book?")) return

    try {
        const result = await apiRequest(`books/${bookId}`, "DELETE")
        if (result !== null) {
            await loadAdminData()
            alert("Book deleted successfully!")
        }
    } catch (error) {
        console.error("Error deleting book:", error)
        alert(`Failed to delete book: ${error.message}`)
    }
}

// Show image upload modal
function showImageUploadModal(bookId) {
    document.getElementById("image-book-id").value = bookId
    document.getElementById("image-upload-form").reset()
    document.getElementById("image-preview-container").style.display = "none"

    const imageUploadModal = new bootstrap.Modal(document.getElementById("imageUploadModal"))
    imageUploadModal.show()
}

// Upload book image
async function uploadBookImage() {
    const bookId = document.getElementById("image-book-id").value
    const imageFile = document.getElementById("book-image").files[0]

    if (!imageFile) {
        alert("Please select an image file")
        return
    }

    const formData = new FormData()
    formData.append("BookId", bookId)
    formData.append("ImageFile", imageFile)

    try {
        const token = localStorage.getItem("authToken")
        const response = await fetch(`${apiBaseUrl}/books/uploadimage`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        })

        if (response.ok) {
            const result = await response.json()

            // Close modal
            const imageUploadModalElement = document.getElementById("imageUploadModal")
            const imageUploadModal = bootstrap.Modal.getInstance(imageUploadModalElement)
            imageUploadModal.hide()

            // Reload admin data to show updated image
            await loadAdminData()

            alert("Image uploaded successfully")
        } else {
            const error = await response.json()
            alert(`Failed to upload image: ${error.message}`)
        }
    } catch (error) {
        console.error("Error uploading image:", error)
        alert("An error occurred while uploading the image")
    }
}

// Show add category modal
function showAddCategoryModal() {
    document.getElementById("categoryModalLabel").textContent = "Add New Category"
    document.getElementById("category-id").value = ""
    document.getElementById("category-form").reset()

    // Reset validation state
    const form = document.getElementById("category-form")
    form.classList.remove("was-validated")

    const categoryModal = new bootstrap.Modal(document.getElementById("categoryModal"))
    categoryModal.show()
}

// Show edit category modal
async function showEditCategoryModal(categoryId) {
    try {
        const category = await apiRequest(`categories/${categoryId}`)
        if (!category) {
            alert("Failed to load category details. Please try again.")
            return
        }

        document.getElementById("categoryModalLabel").textContent = "Edit Category"
        document.getElementById("category-id").value = category.categoryId
        document.getElementById("category-name").value = category.name || ""
        document.getElementById("category-description").value = category.description || ""

        // Reset validation state
        const form = document.getElementById("category-form")
        form.classList.remove("was-validated")

        const categoryModal = new bootstrap.Modal(document.getElementById("categoryModal"))
        categoryModal.show()
    } catch (error) {
        console.error("Error fetching category:", error)
        alert("Failed to load category details. Please try again.")
    }
}

// Save category
async function saveCategory() {
    // Validate form
    const form = document.getElementById("category-form")
    if (!form.checkValidity()) {
        form.classList.add("was-validated")
        return
    }

    const categoryId = document.getElementById("category-id").value
    const isNewCategory = !categoryId || categoryId === ""
    const name = document.getElementById("category-name").value.trim()
    const description = document.getElementById("category-description").value.trim()

    // Validate required fields
    if (!name) {
        alert("Please provide a category name")
        return
    }

    const categoryData = {
        // Only include categoryId for updates, not for new categories
        ...(isNewCategory ? {} : { categoryId: Number.parseInt(categoryId) }),
        name: name,
        description: description || null,
    }

    try {
        let result
        if (isNewCategory) {
            result = await apiRequest("categories", "POST", categoryData)
        } else {
            result = await apiRequest(`categories/${categoryId}`, "PUT", categoryData)
        }

        if (result !== null) {
            const categoryModalElement = document.getElementById("categoryModal")
            const categoryModalInstance = bootstrap.Modal.getInstance(categoryModalElement)
            if (categoryModalInstance) {
                categoryModalInstance.hide()
            }
            await loadAdminData()

            // Show success message
            alert(isNewCategory ? "Category created successfully!" : "Category updated successfully!")
        }
    } catch (error) {
        console.error("Error saving category:", error)
        alert(`Failed to save category: ${error.message}`)
    }
}

// Delete category
async function deleteCategory(categoryId) {
    if (!confirm("Are you sure you want to delete this category?")) return

    try {
        const result = await apiRequest(`categories/${categoryId}`, "DELETE")
        if (result !== null) {
            await loadAdminData()
            alert("Category deleted successfully!")
        }
    } catch (error) {
        console.error("Error deleting category:", error)
        alert(`Failed to delete category: ${error.message}`)
    }
}

// Show add publisher modal
function showAddPublisherModal() {
    document.getElementById("publisherModalLabel").textContent = "Add New Publisher"
    document.getElementById("publisher-id").value = ""
    document.getElementById("publisher-form").reset()

    // Reset validation state
    const form = document.getElementById("publisher-form")
    form.classList.remove("was-validated")

    const publisherModal = new bootstrap.Modal(document.getElementById("publisherModal"))
    publisherModal.show()
}

// Show edit publisher modal
async function showEditPublisherModal(publisherId) {
    try {
        const publisher = await apiRequest(`publishers/${publisherId}`)
        if (!publisher) {
            alert("Failed to load publisher details. Please try again.")
            return
        }

        document.getElementById("publisherModalLabel").textContent = "Edit Publisher"
        document.getElementById("publisher-id").value = publisher.publisherId
        document.getElementById("publisher-name").value = publisher.name || ""
        document.getElementById("publisher-address").value = publisher.address || ""
        document.getElementById("publisher-contact").value = publisher.contact || ""

        // Reset validation state
        const form = document.getElementById("publisher-form")
        form.classList.remove("was-validated")

        const publisherModal = new bootstrap.Modal(document.getElementById("publisherModal"))
        publisherModal.show()
    } catch (error) {
        console.error("Error fetching publisher:", error)
        alert("Failed to load publisher details. Please try again.")
    }
}

// Save publisher
async function savePublisher() {
    // Validate form
    const form = document.getElementById("publisher-form")
    if (!form.checkValidity()) {
        form.classList.add("was-validated")
        return
    }

    const publisherId = document.getElementById("publisher-id").value
    const isNewPublisher = !publisherId || publisherId === ""
    const name = document.getElementById("publisher-name").value.trim()
    const address = document.getElementById("publisher-address").value.trim()
    const contact = document.getElementById("publisher-contact").value.trim()

    // Validate required fields
    if (!name) {
        alert("Please provide a publisher name")
        return
    }

    const publisherData = {
        // Only include publisherId for updates, not for new publishers
        ...(isNewPublisher ? {} : { publisherId: Number.parseInt(publisherId) }),
        name: name,
        address: address || null,
        contact: contact || null,
    }

    try {
        let result
        if (isNewPublisher) {
            result = await apiRequest("publishers", "POST", publisherData)
        } else {
            result = await apiRequest(`publishers/${publisherId}`, "PUT", publisherData)
        }

        if (result !== null) {
            const publisherModalElement = document.getElementById("publisherModal")
            const publisherModalInstance = bootstrap.Modal.getInstance(publisherModalElement)
            if (publisherModalInstance) {
                publisherModalInstance.hide()
            }
            await loadAdminData()

            // Show success message
            alert(isNewPublisher ? "Publisher created successfully!" : "Publisher updated successfully!")
        }
    } catch (error) {
        console.error("Error saving publisher:", error)
        alert(`Failed to save publisher: ${error.message}`)
    }
}

// Delete publisher
async function deletePublisher(publisherId) {
    if (!confirm("Are you sure you want to delete this publisher?")) return

    try {
        const result = await apiRequest(`publishers/${publisherId}`, "DELETE")
        if (result !== null) {
            await loadAdminData()
            alert("Publisher deleted successfully!")
        }
    } catch (error) {
        console.error("Error deleting publisher:", error)
        alert(`Failed to delete publisher: ${error.message}`)
    }
}

// Mock addToCart function (replace with your actual implementation)
// Initialize cart


