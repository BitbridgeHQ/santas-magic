/* =========================================================
   SANTA 2026 - WEBSITE JAVASCRIPT
   File: script.js
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =====================================================
       CONFIGURATION
       Replace these details with your real business details.
       ===================================================== */

    const CONFIG = {
    adminEmail: "bookingsantamagic@gmail.com",

    paymentAccounts: {
        PayPal: "Manual payments currently available. Email bookingsantamagic@gmail.com to request payment details. Include your booking reference.",

        Venmo: "Manual payments currently available. Email bookingsantamagic@gmail.com for payment instructions. Include your booking reference.",

        "Cash App": "Manual payments currently available. Contact bookingsantamagic@gmail.com for payment details. Include your booking reference.",

        Zelle: "Manual payments currently available. Email bookingsantamagic@gmail.com for payment instructions. Include your booking reference.",

        "Apple Pay": "Manual payment arrangements are available. Email bookingsantamagic@gmail.com for details. Include your booking reference.",

        "Google Pay": "Manual payment arrangements are available. Email bookingsantamagic@gmail.com for details. Include your booking reference."
    }
};

    /* =====================================================
       HELPERS
       ===================================================== */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        [...parent.querySelectorAll(selector)];

    const getElement = (...selectors) => {
        for (const selector of selectors) {
            const element = $(selector);
            if (element) return element;
        }
        return null;
    };

    const formatMoney = amount =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
        }).format(amount);

    const generateReference = () =>
        "SANTA-" + Date.now().toString(36).toUpperCase();

    const escapeHTML = value =>
        String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);

    /* =====================================================
       ELEMENT REFERENCES
       ===================================================== */

    const cartSidebar = getElement("#cartSidebar", ".cart-sidebar");
    const cartOverlay = getElement("#cartOverlay", ".cart-overlay", ".modal-overlay");
    const cartItemsContainer = getElement("#cartItems", "#cartItemsContainer", ".cart-body");
    const cartTotalElement = getElement("#cartTotal", "#cartSubtotal", ".cart-total");
    const cartCountElement = getElement("#cartCount", ".cart-count");

    const checkoutModal = getElement("#checkoutModal", ".checkout-modal");
    const checkoutForm = getElement("#checkoutForm");

    const paymentModal = getElement("#paymentModal", ".payment-modal");
    const paymentDetailsModal = getElement(
        "#paymentDetailsModal",
        ".payment-details-modal"
    );

    const processingModal = getElement("#processingModal", ".processing-modal");

    const toastContainer = getElement("#toastContainer", ".toast-container");

    /* =====================================================
       TOAST NOTIFICATIONS
       ===================================================== */

    function showToast(message, type = "success") {
        let container = toastContainer;

        if (!container) {
            container = document.createElement("div");
            container.className = "toast-container";
            container.id = "toastContainer";
            document.body.appendChild(container);
        }

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add("show"));

        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    /* =====================================================
       DARK / LIGHT MODE
       ===================================================== */

    const themeToggle = getElement(
        "#themeToggle",
        "#darkModeToggle",
        ".theme-toggle"
    );

    const savedTheme = localStorage.getItem("santa-theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    }

    function updateThemeButton() {
        if (!themeToggle) return;

        const darkMode = document.body.classList.contains("dark-mode");

        themeToggle.setAttribute(
            "aria-label",
            darkMode ? "Switch to light mode" : "Switch to dark mode"
        );

        themeToggle.innerHTML = darkMode
            ? '<i class="fas fa-sun"></i>'
            : '<i class="fas fa-moon"></i>';
    }

    updateThemeButton();

    themeToggle?.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");

        const theme = document.body.classList.contains("dark-mode")
            ? "dark"
            : "light";

        localStorage.setItem("santa-theme", theme);
        updateThemeButton();
    });

    /* =====================================================
       MOBILE NAVIGATION
       ===================================================== */

    const menuToggle = getElement(
        "#menuToggle",
        "#hamburger",
        ".menu-toggle"
    );

    const navLinks = getElement("#navLinks", ".nav-links");

    menuToggle?.addEventListener("click", () => {
        navLinks?.classList.toggle("active");

        const expanded = navLinks?.classList.contains("active");

        menuToggle.setAttribute("aria-expanded", String(!!expanded));
        menuToggle.innerHTML = expanded
            ? '<i class="fas fa-times"></i>'
            : '<i class="fas fa-bars"></i>';
    });

    $$(".nav-links a").forEach(link => {
        link.addEventListener("click", () => {
            navLinks?.classList.remove("active");

            if (menuToggle) {
                menuToggle.setAttribute("aria-expanded", "false");
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    });

    /* =====================================================
       SHOPPING CART
       ===================================================== */

    let cart = JSON.parse(localStorage.getItem("santa-cart") || "[]");

    function saveCart() {
        localStorage.setItem("santa-cart", JSON.stringify(cart));
    }

    function updateCart() {
        const totalQuantity = cart.reduce(
            (total, item) => total + item.quantity,
            0
        );

        const totalPrice = cart.reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );

        if (cartCountElement) {
            cartCountElement.textContent = totalQuantity;
            cartCountElement.style.display = totalQuantity ? "flex" : "none";
        }

        if (cartTotalElement) {
            cartTotalElement.textContent = formatMoney(totalPrice);
        }

        if (!cartItemsContainer) return;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-basket"></i>
                    <h3>Your cart is empty</h3>
                    <p>Add a Santa experience to get started.</p>
                </div>
            `;
            saveCart();
            return;
        }

        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item" data-id="${escapeHTML(item.id)}">
                <div class="cart-item-info">
                    <h4>${escapeHTML(item.name)}</h4>
                    <p>${formatMoney(item.price)}</p>

                    <div class="cart-quantity">
                        <button
                            type="button"
                            data-cart-action="decrease"
                            data-id="${escapeHTML(item.id)}"
                            aria-label="Decrease quantity"
                        >−</button>

                        <span>${item.quantity}</span>

                        <button
                            type="button"
                            data-cart-action="increase"
                            data-id="${escapeHTML(item.id)}"
                            aria-label="Increase quantity"
                        >+</button>
                    </div>
                </div>

                <button
                    type="button"
                    class="remove-cart-item"
                    data-cart-action="remove"
                    data-id="${escapeHTML(item.id)}"
                    aria-label="Remove item"
                >
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join("");

        saveCart();
    }

    function addToCart(id, name, price) {
        const existingItem = cart.find(item => item.id === id);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({
                id,
                name,
                price: Number(price),
                quantity: 1
            });
        }

        updateCart();
        openCart();
        showToast(`${name} added to your cart!`);
    }

    function openCart() {
        cartSidebar?.classList.add("active");
        cartOverlay?.classList.add("active");
        document.body.classList.add("modal-open");
    }

    function closeCart() {
        cartSidebar?.classList.remove("active");
        cartOverlay?.classList.remove("active");
        document.body.classList.remove("modal-open");
    }

    const cartButton = getElement("#cartButton", ".cart-button");
    const closeCartButton = getElement("#closeCart", ".close-cart");

    cartButton?.addEventListener("click", openCart);
    closeCartButton?.addEventListener("click", closeCart);
    cartOverlay?.addEventListener("click", closeCart);

    document.addEventListener("click", event => {
        const addButton = event.target.closest(
            "[data-add-to-cart], .add-to-cart, .order-button"
        );

        if (addButton) {
            const id =
                addButton.dataset.id ||
                addButton.dataset.serviceId ||
                addButton.dataset.addToCart ||
                String(Date.now());

            const name =
                addButton.dataset.name ||
                addButton.dataset.serviceName ||
                addButton.dataset.service ||
                addButton.closest(".service-card, .pricing-card, .package-card")
                    ?.querySelector("h3")?.textContent?.trim() ||
                "Santa Experience";

            const price = Number(
                addButton.dataset.price ||
                addButton.dataset.servicePrice ||
                addButton.closest(".service-card, .pricing-card, .package-card")
                    ?.querySelector("[data-price]")?.dataset.price ||
                0
            );

            if (!price || price < 0) {
                showToast("Please check the service price.", "error");
                return;
            }

            addToCart(id, name, price);
        }

        const cartAction = event.target.closest("[data-cart-action]");

        if (cartAction) {
            const id = cartAction.dataset.id;
            const action = cartAction.dataset.cartAction;
            const item = cart.find(product => product.id === id);

            if (!item) return;

            if (action === "increase") item.quantity++;
            if (action === "decrease") item.quantity--;

            if (action === "remove" || item.quantity <= 0) {
                cart = cart.filter(product => product.id !== id);
            }

            updateCart();
        }
    });

    updateCart();

    /* =====================================================
       CHECKOUT
       ===================================================== */

    const checkoutButton = getElement(
        "#checkoutButton",
        "#proceedCheckout",
        ".checkout-button"
    );

    const closeCheckoutButton = getElement("#closeCheckout");

    function openCheckout() {
        if (cart.length === 0) {
            showToast("Your cart is empty. Add a service first.", "error");
            return;
        }

        closeCart();
        checkoutModal?.classList.add("active");
        document.body.classList.add("modal-open");

        updateCheckoutSummary();
    }

    function closeCheckout() {
        checkoutModal?.classList.remove("active");
        document.body.classList.remove("modal-open");
    }

    function updateCheckoutSummary() {
        const summary = getElement(
            "#checkoutItems",
            ".checkout-items"
        );

        const total = getElement(
            "#checkoutTotal",
            ".checkout-total"
        );

        if (summary) {
            summary.innerHTML = cart.map(item => `
                <div class="checkout-item">
                    <span>${escapeHTML(item.name)} × ${item.quantity}</span>
                    <strong>${formatMoney(item.price * item.quantity)}</strong>
                </div>
            `).join("");
        }

        if (total) {
            total.textContent = formatMoney(
                cart.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                )
            );
        }
    }

    checkoutButton?.addEventListener("click", openCheckout);
    closeCheckoutButton?.addEventListener("click", closeCheckout);

    checkoutModal?.addEventListener("click", event => {
        if (event.target === checkoutModal) closeCheckout();
    });

    /* =====================================================
       PAYMENT METHODS
       ===================================================== */

    const paymentMethods = [
        {
            name: "PayPal",
            logo: "https://cdn.simpleicons.org/paypal/003087"
        },
        {
            name: "Venmo",
            logo: "https://cdn.simpleicons.org/venmo/008CFF"
        },
        {
            name: "Cash App",
            logo: "https://cdn.simpleicons.org/cashapp/00D632"
        },
        {
            name: "Zelle",
            logo: "https://cdn.simpleicons.org/zelle/6D1ED4"
        },
        {
            name: "Apple Pay",
            logo: "https://cdn.simpleicons.org/applepay/000000"
        },
        {
            name: "Google Pay",
            logo: "https://cdn.simpleicons.org/googlepay/4285F4"
        }
    ];

    let selectedPaymentMethod = null;
    let currentBooking = null;

    const paymentMethodsContainer = getElement(
        "#paymentMethods",
        ".payment-methods"
    );

    function renderPaymentMethods() {
        if (!paymentMethodsContainer) return;

        paymentMethodsContainer.innerHTML = paymentMethods.map(method => `
            <button
                type="button"
                class="payment-method"
                data-payment-method="${escapeHTML(method.name)}"
            >
                <img
                    src="${method.logo}"
                    alt="${escapeHTML(method.name)}"
                    onerror="this.style.display='none'"
                >
                <span>${escapeHTML(method.name)}</span>
            </button>
        `).join("");
    }

    renderPaymentMethods();

    function openPaymentSelection(booking) {
        currentBooking = booking;
        closeCheckout();

        paymentModal?.classList.add("active");
        document.body.classList.add("modal-open");
    }

    function closePaymentSelection() {
        paymentModal?.classList.remove("active");
        document.body.classList.remove("modal-open");
    }

    paymentModal?.addEventListener("click", event => {
        if (event.target === paymentModal) {
            closePaymentSelection();
        }
    });

    /* =====================================================
       CHECKOUT FORM SUBMISSION
       ===================================================== */

    checkoutForm?.addEventListener("submit", event => {
        event.preventDefault();

        if (cart.length === 0) {
            showToast("Your cart is empty.", "error");
            return;
        }

        if (!checkoutForm.reportValidity()) return;

        const formData = new FormData(checkoutForm);

// Find form fields using their names, IDs, types or placeholders.
function getCheckoutValue(patterns, fallbackSelector) {
    for (const pattern of patterns) {
        const field = checkoutForm.querySelector(
            `[name*="${pattern}" i], [id*="${pattern}" i]`
        );

        if (field && field.value.trim()) {
            return field.value.trim();
        }
    }

    const fallback = checkoutForm.querySelector(fallbackSelector);

    return fallback?.value?.trim() || "";
}

const customer = {
    name: getCheckoutValue(
        ["fullname", "name"],
        'input[autocomplete="name"], input[type="text"]'
    ),

    email: getCheckoutValue(
        ["email"],
        'input[type="email"]'
    ),

    phone: getCheckoutValue(
        ["phone", "mobile", "tel"],
        'input[type="tel"]'
    ),

    address: getCheckoutValue(
        ["address", "location"],
        'textarea'
    ),

    eventDate: getCheckoutValue(
        ["eventdate", "date"],
        'input[type="date"]'
    ),

    eventTime: getCheckoutValue(
        ["eventtime", "time"],
        'input[type="time"]'
    ),

    eventType: getCheckoutValue(
        ["eventtype"],
        'select'
    ),

    notes: getCheckoutValue(
        ["notes", "message"],
        'textarea'
    )
};
        if (!customer.name.trim() || !customer.email.trim()) {
            showToast("Please enter your name and email address.", "error");
            return;
        }

        const reference = generateReference();

        const total = cart.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        currentBooking = {
            reference,
            customer,
            items: [...cart],
            total,
            createdAt: new Date().toISOString()
        };

        openPaymentSelection(currentBooking);
    });

    /* =====================================================
       PAYMENT DETAILS MODAL
       ===================================================== */

    function openPaymentDetails(method) {
        selectedPaymentMethod = method;

        const account = CONFIG.paymentAccounts[method];

        if (!account || account.startsWith("your-") ||
            account.startsWith("Your ")) {
            showToast(
                `Please configure your ${method} account in script.js first.`,
                "error"
            );
        }

        const selectedLogo = getElement(
            "#selectedPaymentLogo",
            ".selected-payment-logo"
        );

        const accountInformation = getElement(
            "#paymentAccountInformation",
            ".payment-account-information"
        );

        const bookingReference = currentBooking?.reference || "Not available";

        if (selectedLogo) {
            const payment = paymentMethods.find(item => item.name === method);

            selectedLogo.innerHTML = `
                <img src="${payment?.logo || ""}"
                     alt="${escapeHTML(method)}"
                     onerror="this.style.display='none'">
                <h3>${escapeHTML(method)}</h3>
            `;
        }

        if (accountInformation) {
            accountInformation.innerHTML = `
                <div class="account-detail">
                    <span>Payment account</span>
                    <strong>${escapeHTML(account)}</strong>
                </div>

                <div class="account-detail">
                    <span>Booking reference</span>
                    <strong>${escapeHTML(bookingReference)}</strong>
                </div>

                <div class="account-detail">
                    <span>Amount to pay</span>
                    <strong>${formatMoney(currentBooking?.total || 0)}</strong>
                </div>

                <p class="payment-notice">
                    Send the exact amount to the account shown above.
                    Include your booking reference where supported.
                    Keep your payment confirmation for your records.
                </p>
            `;
        }

        paymentModal?.classList.remove("active");
        paymentDetailsModal?.classList.add("active");
    }

    paymentMethodsContainer?.addEventListener("click", event => {
        const button = event.target.closest("[data-payment-method]");

        if (!button) return;

        openPaymentDetails(button.dataset.paymentMethod);
    });

    const paymentDoneButton = getElement(
        "#paymentDoneButton",
        ".payment-done-button"
    );

    /* =====================================================
       SIMULATED PAYMENT PROCESSING
       ===================================================== */

    function openProcessing() {
        paymentDetailsModal?.classList.remove("active");
        processingModal?.classList.add("active");

        const status = getElement(
            "#processingStatus",
            ".processing-status"
        );

        const progress = getElement(
            "#processingProgress",
            ".processing-progress"
        );

        if (status) status.textContent = "Preparing your booking...";

        if (progress) progress.style.width = "0%";

        let percentage = 0;

        const timer = setInterval(() => {
            percentage += 20;

            if (progress) {
                progress.style.width = `${percentage}%`;
            }

            if (percentage === 40 && status) {
                status.textContent = "Preparing payment instructions...";
            }

            if (percentage === 80 && status) {
                status.textContent = "Almost ready...";
            }

            if (percentage >= 100) {
                clearInterval(timer);

                if (status) {
                    status.textContent =
                        "Ready! Submit your payment proof for review.";
                }

                showPaymentProofSection();
            }
        }, 500);
    }

    function showPaymentProofSection() {
        const proofSection = getElement(
            "#paymentProofSection",
            ".payment-proof-section"
        );

        if (!proofSection) {
            showToast(
                "Processing complete. Please email your payment proof to the admin."
            );
            return;
        }

        proofSection.style.display = "block";
        proofSection.classList.add("active");
    }

    paymentDoneButton?.addEventListener("click", openProcessing);

    /* =====================================================
       EMAIL PAYMENT PROOF
       ===================================================== */

    const submitProofButton = getElement(
        "#submitPaymentProof",
        "#sendPaymentProof",
        ".submit-payment-proof"
    );

    submitProofButton?.addEventListener("click", () => {
        if (!currentBooking) {
            showToast("Booking information is missing.", "error");
            return;
        }

        const booking = currentBooking;

        const subject = encodeURIComponent(
            `Payment Proof - ${booking.reference}`
        );

        const body = encodeURIComponent(`
Hello Santa 2026 Admin,

I have completed the payment for my Santa booking.

BOOKING DETAILS
Reference: ${booking.reference}
Name: ${booking.customer.name}
Email: ${booking.customer.email}
Phone: ${booking.customer.phone}
Payment Method: ${selectedPaymentMethod}
Amount: ${formatMoney(booking.total)}

SERVICES
${booking.items.map(item =>
    `${item.name} x ${item.quantity} - ${formatMoney(item.price * item.quantity)}`
).join("\n")}

EVENT DETAILS
Date: ${booking.customer.eventDate}
Time: ${booking.customer.eventTime}
Event Type: ${booking.customer.eventType}
Address: ${booking.customer.address}

Please find my payment screenshot attached.

Thank you.
        `.trim());

        const mailto =
            `mailto:${CONFIG.adminEmail}` +
            `?subject=${subject}&body=${encodeURIComponent(body)}`;

        window.location.href = mailto;

        showToast(
            "Your email app will open. Remember to attach your payment screenshot."
        );

        /*
         * This only opens the customer's email application.
         * It does not send an email or attach a screenshot automatically.
         */
    });

    /* =====================================================
       CONTACT FORM
       ===================================================== */

    const contactForm = getElement("#contactForm");

    contactForm?.addEventListener("submit", event => {
        event.preventDefault();

        if (!contactForm.reportValidity()) return;

        const formData = new FormData(contactForm);

        const name = formData.get("name") || "";
        const email = formData.get("email") || "";
        const message = formData.get("message") || "";

        const subject = encodeURIComponent(
            "Santa 2026 - Website Inquiry"
        );

        const body = encodeURIComponent(`
Name: ${name}
Email: ${email}

Message:
${message}
        `.trim());

        window.location.href =
            `mailto:${CONFIG.adminEmail}?subject=${subject}&body=${body}`;

        showToast("Your email application is opening.");
        contactForm.reset();
    });

    /* =====================================================
       NEWSLETTER FORM
       ===================================================== */

    const newsletterForm = getElement("#newsletterForm");

    newsletterForm?.addEventListener("submit", event => {
        event.preventDefault();

        if (!newsletterForm.reportValidity()) return;

        showToast("Thank you for your interest!");
        newsletterForm.reset();

        /*
         * Connect this form to a newsletter service or backend
         * before launch. This demo does not store subscribers.
         */
    });

    /* =====================================================
       LANGUAGE SWITCHER
       ===================================================== */

    const translations = {
        en: {
            "nav-home": "Home",
            "nav-services": "Services",
            "nav-about": "About",
            "nav-pricing": "Pricing",
            "nav-blog": "Blog",
            "nav-contact": "Contact",
            "hero-title": "Make This Christmas Magical",
            "hero-description":
                "Bring the magic of Christmas to your home, office, school, or special event.",
            "hero-button": "Book Santa",
            "services-title": "Our Christmas Services",
            "pricing-title": "Choose Your Christmas Experience",
            "about-title": "Meet Your Santa",
            "contact-title": "Get in Touch",
            "cart-empty": "Your cart is empty",
            "checkout": "Proceed to Checkout"
        },

        es: {
            "nav-home": "Inicio",
            "nav-services": "Servicios",
            "nav-about": "Nosotros",
            "nav-pricing": "Precios",
            "nav-blog": "Blog",
            "nav-contact": "Contacto",
            "hero-title": "Haz que esta Navidad sea mágica",
            "hero-description":
                "Lleva la magia de la Navidad a tu hogar, oficina, escuela o evento especial.",
            "hero-button": "Reserva a Santa",
            "services-title": "Nuestros servicios navideños",
            "pricing-title": "Elige tu experiencia navideña",
            "about-title": "Conoce a Santa",
            "contact-title": "Contáctanos",
            "cart-empty": "Tu carrito está vacío",
            "checkout": "Continuar al pago"
        },

        fr: {
            "nav-home": "Accueil",
            "nav-services": "Services",
            "nav-about": "À propos",
            "nav-pricing": "Tarifs",
            "nav-blog": "Blog",
            "nav-contact": "Contact",
            "hero-title": "Rendez ce Noël magique",
            "hero-description":
                "Apportez la magie de Noël chez vous, au bureau, à l'école ou lors de votre événement.",
            "hero-button": "Réserver le Père Noël",
            "services-title": "Nos services de Noël",
            "pricing-title": "Choisissez votre expérience de Noël",
            "about-title": "Rencontrez le Père Noël",
            "contact-title": "Contactez-nous",
            "cart-empty": "Votre panier est vide",
            "checkout": "Passer à la caisse"
        }
    };

    const languageSelector = getElement(
        "#languageSelector",
        "#languageSelect",
        ".language-selector"
    );

    function changeLanguage(language) {
        const dictionary = translations[language];

        if (!dictionary) return;

        $$("[data-translate]").forEach(element => {
            const key = element.dataset.translate;

            if (dictionary[key]) {
                element.textContent = dictionary[key];
            }
        });

        document.documentElement.lang = language;
        localStorage.setItem("santa-language", language);
    }

    const savedLanguage = localStorage.getItem("santa-language") || "en";

    if (languageSelector) {
        languageSelector.value = savedLanguage;
        changeLanguage(savedLanguage);

        languageSelector.addEventListener("change", event => {
            changeLanguage(event.target.value);
        });
    }

    /* =====================================================
       BLOG LINKS
       ===================================================== */

    $$("[data-blog-link], .blog-link").forEach(link => {
        link.addEventListener("click", event => {
            const target = link.getAttribute("href");

            if (!target || target === "#") {
                event.preventDefault();
                showToast("This article will be available soon.");
            }
        });
    });

    /* =====================================================
       BACK TO TOP
       ===================================================== */

    const backToTop = getElement("#backToTop", ".back-to-top");

    window.addEventListener("scroll", () => {
        if (!backToTop) return;

        backToTop.classList.toggle("visible", window.scrollY > 400);
    });

    backToTop?.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });

    /* =====================================================
       CLOSE MODALS WITH ESCAPE
       ===================================================== */

    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;

        closeCart();
        closeCheckout();
        closePaymentSelection();

        paymentDetailsModal?.classList.remove("active");
        processingModal?.classList.remove("active");

        document.body.classList.remove("modal-open");
    });

    /* =====================================================
       SMOOTH SCROLLING
       ===================================================== */

    $$('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", event => {
            const targetId = anchor.getAttribute("href");

            if (!targetId || targetId === "#") return;

            const target = $(targetId);

            if (!target) return;

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });

    /* =====================================================
       INITIALIZATION
       ===================================================== */

    updateCart();

    console.log("🎅 Santa 2026 website initialized successfully!");
});
