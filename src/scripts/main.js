import { portfolioItems } from "../data/portfolio.js";

const portfolioGrid = document.querySelector("#portfolioGrid");
const modalOverlay = document.querySelector("#modalOverlay");
const modalClose = document.querySelector("#modalClose");
const modalImage = document.querySelector("#modalImage");
const modalTitle = document.querySelector("#modalTitle");
const modalDescription = document.querySelector("#modalDescription");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const contactForm = document.querySelector("#contactForm");
const emailInput = contactForm.querySelector("input[name='email']");
const messageInput = contactForm.querySelector("textarea[name='message']");
const formFeedback = document.querySelector("#formFeedback");
const paginationElement = document.querySelector("#pagination");

const contactEndpoint = "https://n8n.fabulcroche.com/webhook/NDjNtJQSzQjDKtdoubnINaFDYJIPKVro";
const contactToken = "r6BVpJjNx3GN8N1R3Xgz3t7L3HzaTuRA";
const allowedEmailDomains = ["gmail.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com", "icloud.com", "mail.com", "protonmail.com", "aol.com"];

const ITEMS_PER_PAGE = 6;
let currentPage = 1;

function renderPortfolioPage(page) {
  portfolioGrid.innerHTML = "";
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageItems = portfolioItems.slice(startIndex, endIndex);

  pageItems.forEach((item) => {
    const card = document.createElement("article");
    card.className = "portfolio-card";
    card.innerHTML = `
      <div class="card-image">
        <img src="${item.image}" alt="${item.title}" />
      </div>
      <div class="card-copy">
        <h3>${item.title}</h3>
        <button class="btn btn-secondary" type="button" data-id="${item.id}">Ver detalhes</button>
      </div>
    `;
    portfolioGrid.appendChild(card);
  });
}

function renderPagination() {
  const totalPages = Math.ceil(portfolioItems.length / ITEMS_PER_PAGE);

  if (totalPages <= 1) {
    paginationElement.style.display = "none";
    return;
  }

  paginationElement.style.display = "flex";
  paginationElement.innerHTML = "";

  if (currentPage > 1) {
    const prevBtn = document.createElement("button");
    prevBtn.className = "pagination-btn";
    prevBtn.textContent = "← Anterior";
    prevBtn.addEventListener("click", () => {
      currentPage--;
      renderPortfolioPage(currentPage);
      renderPagination();
    });
    paginationElement.appendChild(prevBtn);
  }

  const pageNumbers = document.createElement("div");
  pageNumbers.className = "page-numbers";
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.className = i === currentPage ? "page-btn active" : "page-btn";
    pageBtn.textContent = i;
    pageBtn.addEventListener("click", () => {
      currentPage = i;
      renderPortfolioPage(currentPage);
      renderPagination();
    });
    pageNumbers.appendChild(pageBtn);
  }
  paginationElement.appendChild(pageNumbers);

  if (currentPage < totalPages) {
    const nextBtn = document.createElement("button");
    nextBtn.className = "pagination-btn";
    nextBtn.textContent = "Próxima →";
    nextBtn.addEventListener("click", () => {
      currentPage++;
      renderPortfolioPage(currentPage);
      renderPagination();
    });
    paginationElement.appendChild(nextBtn);
  }
}

function openModal(item) {
  modalImage.src = item.image;
  modalImage.alt = item.title;
  modalTitle.textContent = item.title;
  modalDescription.textContent = item.description;
  modalOverlay.classList.remove("hidden");
}

function closeModal() {
  modalOverlay.classList.add("hidden");
}

function initNavigation() {
  menuToggle.addEventListener("click", () => {
    siteNav.classList.toggle("open");
  });

  document.querySelectorAll(".site-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("open");
    });
  });
}

function initPortfolioListeners() {
  portfolioGrid.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;
    const itemId = button.dataset.id;
    const item = portfolioItems.find((work) => work.id === itemId);
    if (item) openModal(item);
  });
}

function autosizeMessage() {
  if (!messageInput) return;
  messageInput.style.height = "auto";
  messageInput.style.height = `${messageInput.scrollHeight}px`;
}

function initModalListeners() {
  modalClose.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) closeModal();
  });
}

function isValidEmail(email) {
  const normalizedEmail = email.toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(normalizedEmail)) return false;

  const [, domain] = normalizedEmail.split("@");
  return allowedEmailDomains.includes(domain) || allowedEmailDomains.some((allowedDomain) => domain.endsWith(`.${allowedDomain}`));
}

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(contactForm);
  const name = formData.get("name").trim();
  const email = formData.get("email").trim();
  const message = formData.get("message").trim();

  if (!name || !email || !message) {
    formFeedback.textContent = "Preencha todos os campos para enviar.";
    return;
  }

  if (!isValidEmail(email)) {
    formFeedback.textContent = "Informe um e-mail válido com domínio como Gmail, Outlook, Hotmail, Yahoo ou similar.";
    emailInput?.focus();
    return;
  }

  formFeedback.textContent = "Enviando mensagem...";

  try {
    const payload = {
      name,
      email,
      message,
    };

    const response = await fetch(contactEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: contactToken,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Falha no envio");
    }

    formFeedback.textContent = "Mensagem enviada com sucesso! Obrigado.";
    contactForm.reset();
  } catch (error) {
    console.error(error);
    formFeedback.textContent = "Erro ao enviar. Verifique o endpoint ou tente novamente.";
  }
});

function init() {
  renderPortfolioPage(currentPage);
  renderPagination();
  initNavigation();
  initPortfolioListeners();
  initModalListeners();
  autosizeMessage();
  messageInput.addEventListener("input", autosizeMessage);
}

init();
