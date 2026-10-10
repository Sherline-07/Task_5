
import { products } from "./products.js";

// Select HTML elements
const productGrid = document.querySelector("#productGrid");
const categoryList = document.querySelector("#categoryList");
const searchInput = document.querySelector("#searchInput");
const sortSelect = document.querySelector("#sortSelect");

const resultCount = document.querySelector("#resultCount");
const emptyState = document.querySelector("#emptyState");

const productDialog = document.querySelector("#productDialog");
const cartDialog = document.querySelector("#cartDialog");

const toast = document.querySelector("#toast");

// Store the current application data
const state = {
    category: "All",
    search: "",
    sort: "featured",
    cart: loadCart()
};


// Load saved shopping bag
function loadCart() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("nova-cart") || "[]"
        );

        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}


// Save shopping bag
function saveCart() {
    localStorage.setItem(
        "nova-cart",
        JSON.stringify(state.cart)
    );

    updateCartCount();
}


// Format prices in Indian rupees
function formatPrice(price) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(price);
}


// Create an image element as HTML
function imageMarkup(product, className = "") {
    return `
        <img
            class="${className}"
            src="${product.image}"
            alt="${product.name}"
            loading="lazy"
            decoding="async"
        >
    `;
}


// Display category filter buttons
function renderCategories() {
    const categories = [
        "All",
        ...new Set(products.map(product => product.category))
    ];

    categoryList.innerHTML = categories.map(category => `
        <button
            class="category-chip ${
                state.category === category ? "active" : ""
            }"
            data-category="${category}"
            aria-pressed="${state.category === category}"
        >
            ${category}
        </button>
    `).join("");
}


// Find products matching the current filters
function getVisibleProducts() {
    let visible = products.filter(product => {

        const matchesCategory =
            state.category === "All" ||
            product.category === state.category;

        const text = `
            ${product.name}
            ${product.category}
            ${product.description}
        `.toLowerCase();

        const matchesSearch =
            text.includes(state.search.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    // Sort the products
    if (state.sort === "price-low") {
        visible.sort((a, b) => a.price - b.price);
    }

    if (state.sort === "price-high") {
        visible.sort((a, b) => b.price - a.price);
    }

    if (state.sort === "name") {
        visible.sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }

    return visible;
}


// Display product cards
function renderProducts() {
    const visible = getVisibleProducts();

    resultCount.textContent =
        `${visible.length} ${
            visible.length === 1 ? "item" : "items"
        }`;

    productGrid.innerHTML = visible.map(product => `
        <article class="product-card">

            <button
                class="product-image-button"
                data-product="${product.id}"
                aria-label="View ${product.name}"
            >
                ${imageMarkup(product, "product-image")}

                ${
                    product.badge
                        ? `<span class="product-badge">
                               ${product.badge}
                           </span>`
                        : ""
                }
            </button>

            <div class="product-info">

                <div>
                    <p class="product-category">
                        ${product.category}
                    </p>

                    <h3>
                        <button
                            class="product-title"
                            data-product="${product.id}"
                        >
                            ${product.name}
                        </button>
                    </h3>
                </div>

                <div class="product-bottom">

                    <strong>
                        ${formatPrice(product.price)}
                    </strong>

                    <button
                        class="add-button"
                        data-add="${product.id}"
                        aria-label="Add ${product.name} to bag"
                    >
                        +
                    </button>

                </div>

            </div>
        </article>
    `).join("");

    emptyState.classList.toggle(
        "hidden",
        visible.length !== 0
    );

    productGrid.classList.toggle(
        "hidden",
        visible.length === 0
    );
}


// Open product details
function showProduct(id) {
    const product = products.find(
        item => item.id === Number(id)
    );

    if (!product) return;

    document.querySelector("#productDetail").innerHTML = `
        <div class="detail-layout">

            ${imageMarkup(product, "detail-image")}

            <div class="detail-copy">

                <p class="eyebrow">
                    ${product.category.toUpperCase()}
                </p>

                <h2>${product.name}</h2>

                <p class="detail-price">
                    ${formatPrice(product.price)}
                </p>

                <p class="muted detail-description">
                    ${product.description}
                </p>

                <button
                    class="primary-button full-button"
                    data-add="${product.id}"
                >
                    Add to bag <span>→</span>
                </button>

                <p class="small-note">
                    A thoughtful pick for everyday living.
                </p>

            </div>

        </div>
    `;

    productDialog.showModal();
}


// Update the shopping bag counter
function updateCartCount() {
    const count = state.cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    document.querySelector("#cartCount").textContent = count;
}


// Add a product to the shopping bag
function addToCart(id) {
    const product = products.find(
        item => item.id === Number(id)
    );

    if (!product) return;

    const existing = state.cart.find(
        item => item.id === product.id
    );

    if (existing) {
        existing.quantity++;
    } else {
        state.cart.push({
            id: product.id,
            quantity: 1
        });
    }

    saveCart();
    renderCart();

    showToast(`${product.name} added to your bag`);

    if (productDialog.open) {
        productDialog.close();
    }
}


// Display a temporary notification
function showToast(message) {
    toast.textContent = message;
    toast.classList.add("visible");

    clearTimeout(showToast.timeout);

    showToast.timeout = setTimeout(() => {
        toast.classList.remove("visible");
    }, 2200);
}


// Display shopping bag contents
function renderCart() {
    const cartItems = document.querySelector("#cartItems");

    const detailedItems = state.cart.map(item => ({
        ...item,
        product: products.find(
            product => product.id === item.id
        )
    })).filter(item => item.product);

    if (detailedItems.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">

                <span>♡</span>

                <h3>Your bag is taking a break</h3>

                <p>
                    Add something you love and it will appear here.
                </p>

                <a
                    class="text-button"
                    href="#/shop"
                    id="continueShopping"
                >
                    Explore the collection →
                </a>

            </div>
        `;
    } else {
        cartItems.innerHTML = detailedItems.map(item => `
            <div class="cart-item">

                ${imageMarkup(item.product, "cart-item-image")}

                <div class="cart-item-copy">

                    <strong>${item.product.name}</strong>

                    <span>
                        ${formatPrice(item.product.price)}
                    </span>

                    <div class="quantity-controls">

                        <button
                            data-quantity="${item.id}"
                            data-change="-1"
                            aria-label="Decrease quantity"
                        >
                            −
                        </button>

                        <span>${item.quantity}</span>

                        <button
                            data-quantity="${item.id}"
                            data-change="1"
                            aria-label="Increase quantity"
                        >
                            +
                        </button>

                        <button
                            class="remove-button"
                            data-remove="${item.id}"
                        >
                            Remove
                        </button>

                    </div>

                </div>

                <strong>
                    ${formatPrice(
                        item.product.price * item.quantity
                    )}
                </strong>

            </div>
        `).join("");
    }

    const subtotal = detailedItems.reduce(
        (sum, item) =>
            sum + item.product.price * item.quantity,
        0
    );

    document.querySelector("#cartSubtotal").textContent =
        formatPrice(subtotal);

    document.querySelector("#checkoutButton").disabled =
        detailedItems.length === 0;

    document.querySelector("#checkoutMessage").textContent = "";
}


// Increase or decrease item quantity
function changeQuantity(id, amount) {
    const item = state.cart.find(
        entry => entry.id === Number(id)
    );

    if (!item) return;

    item.quantity += amount;

    if (item.quantity <= 0) {
        state.cart = state.cart.filter(
            entry => entry.id !== Number(id)
        );
    }

    saveCart();
    renderCart();
}


// Simple client-side page navigation
function renderRoute() {
    const route = location.hash.replace(/^#/, "") || "/";

    document.querySelectorAll("[data-nav]").forEach(link => {
        link.classList.toggle(
            "selected",
            (route === "/" || route === "/shop") &&
            link.dataset.nav === "home"
        );

        link.classList.toggle(
            "selected",
            route === "/about" &&
            link.dataset.nav === "about"
        );
    });

    let aboutPage = document.querySelector("#aboutPage");

    if (route === "/about") {

        if (!aboutPage) {
            aboutPage = document.createElement("section");

            aboutPage.id = "aboutPage";
            aboutPage.className = "about-page";

            aboutPage.innerHTML = `
                <p class="eyebrow">A NOTE ABOUT NOVA</p>

                <h1>
                    Less noise.<br>
                    <em>More meaning.</em>
                </h1>

                <p>
                    Nova is a demo storefront built around a simple idea:
                    useful everyday objects can be thoughtfully chosen,
                    easy to explore, and enjoyable to shop for.
                </p>

                <a href="#/shop" class="primary-button">
                    Browse the collection <span>→</span>
                </a>
            `;

            document.querySelector("#app").prepend(aboutPage);
        }

        document.querySelector("#catalog").classList.add("hidden");
        document.querySelector(".hero").classList.add("hidden");
        document.querySelector(".newsletter").classList.add("hidden");

    } else {

        aboutPage?.remove();

        document.querySelector("#catalog").classList.remove("hidden");
        document.querySelector(".hero").classList.remove("hidden");
        document.querySelector(".newsletter").classList.remove("hidden");

        if (route === "/shop") {
            document.querySelector("#catalog").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }
}


// Handle category selection
categoryList.addEventListener("click", event => {
    const button = event.target.closest("[data-category]");

    if (!button) return;

    state.category = button.dataset.category;

    renderCategories();
    renderProducts();
});


// Handle product selection and adding products
productGrid.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add]");

    if (addButton) {
        addToCart(addButton.dataset.add);
        return;
    }

    const productButton = event.target.closest("[data-product]");

    if (productButton) {
        showProduct(productButton.dataset.product);
    }
});


// Add product from the details dialog
document.querySelector("#productDetail").addEventListener(
    "click",
    event => {
        const button = event.target.closest("[data-add]");

        if (button) {
            addToCart(button.dataset.add);
        }
    }
);


// Search products
searchInput.addEventListener("input", () => {
    state.search = searchInput.value.trim();
    renderProducts();
});


// Sort products
sortSelect.addEventListener("change", () => {
    state.sort = sortSelect.value;
    renderProducts();
});


// Reset search, category and sorting
document.querySelector("#clearFilters").addEventListener(
    "click",
    () => {
        state.category = "All";
        state.search = "";
        state.sort = "featured";

        searchInput.value = "";
        sortSelect.value = "featured";

        renderCategories();
        renderProducts();
    }
);


// Open shopping bag
document.querySelector("#cartButton").addEventListener(
    "click",
    () => {
        renderCart();
        cartDialog.showModal();
    }
);


// Close dialogs
document.querySelector("#closeProductDialog").addEventListener(
    "click",
    () => productDialog.close()
);

document.querySelector("#closeCartDialog").addEventListener(
    "click",
    () => cartDialog.close()
);


// Handle quantity changes and product removal
document.querySelector("#cartItems").addEventListener(
    "click",
    event => {
        const quantityButton = event.target.closest("[data-quantity]");
        const removeButton = event.target.closest("[data-remove]");

        if (quantityButton) {
            changeQuantity(
                quantityButton.dataset.quantity,
                Number(quantityButton.dataset.change)
            );
        }

        if (removeButton) {
            state.cart = state.cart.filter(
                item => item.id !== Number(removeButton.dataset.remove)
            );

            saveCart();
            renderCart();
        }

        if (event.target.closest("#continueShopping")) {
            cartDialog.close();
        }
    }
);


// Demo checkout
document.querySelector("#checkoutButton").addEventListener(
    "click",
    () => {
        document.querySelector("#checkoutMessage").textContent =
            "Demo checkout: connect a payment provider to accept real orders.";
    }
);


// Newsletter demo form
document.querySelector("#newsletterForm").addEventListener(
    "submit",
    event => {
        event.preventDefault();

        document.querySelector("#newsletterMessage").textContent =
            "Thanks for joining! This demo does not store email addresses.";

        event.currentTarget.reset();
    }
);


// Respond to navigation changes
window.addEventListener("hashchange", renderRoute);


// Initial setup
renderCategories();
renderProducts();
updateCartCount();
renderCart();
renderRoute();
