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

// Markdown Modal Elements
const modalMarkdownContent = document.querySelector("#modalMarkdownContent");
const modalAdminPanel = document.querySelector("#modalAdminPanel");
const markdownEditor = document.querySelector("#markdownEditor");
const saveMarkdownBtn = document.querySelector("#saveMarkdownBtn");
const clearMarkdownBtn = document.querySelector("#clearMarkdownBtn");
const adminFeedback = document.querySelector("#adminFeedback");
const modalGallery = document.querySelector("#modalGallery");

const AUTH_CHECK_ENDPOINT = window.FABUL_AUTH_CHECK_ENDPOINT || "https://n8n.fabulcroche.com/webhook/HuQzWFcAeLgEYKMlishMIdArkRaXdebg";
const contactEndpoint = "https://n8n.fabulcroche.com/webhook/NDjNtJQSzQjDKtdoubnINaFDYJIPKVro";
const contactToken = "r6BVpJjNx3GN8N1R3Xgz3t7L3HzaTuRA";
const allowedEmailDomains = ["gmail.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com", "icloud.com", "mail.com", "protonmail.com", "aol.com"];

// Markdown Webhooks
const GET_MARKDOWN_ENDPOINT = "https://n8n.fabulcroche.com/webhook/CGHSEVHHlnQOMSRDCTzIQjVeMYPijsiu";
const POST_MARKDOWN_ENDPOINT = "https://n8n.fabulcroche.com/webhook/nUTEPpUaIXoqyPBrVmUBazUJZHzOuhgo";

const ITEMS_PER_PAGE = 6;
let currentPage = 1;
let authCheckInFlight = false;
let currentItemInModal = null;

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
        <img src="${(item.images && item.images.length > 0) ? item.images[0] : ''}" alt="${item.title}" />
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

async function openModal(item) {
  currentItemInModal = item;
  const mainImg = (item.images && item.images.length > 0) ? item.images[0] : "";
  modalImage.src = mainImg;
  modalImage.alt = item.title;
  modalTitle.textContent = item.title;
  modalDescription.textContent = item.description;

  // Render multiple images if available
  if (modalGallery) {
    modalGallery.innerHTML = "";
    if (item.images && item.images.length > 1) {
      item.images.forEach((imgUrl, index) => {
        const thumb = document.createElement("img");
        thumb.src = imgUrl;
        thumb.alt = `${item.title} - Foto ${index + 1}`;
        thumb.className = index === 0 ? "thumb-img active" : "thumb-img";
        thumb.addEventListener("click", () => {
          modalImage.src = imgUrl;
          modalGallery.querySelectorAll(".thumb-img").forEach(t => t.classList.remove("active"));
          thumb.classList.add("active");
        });
        modalGallery.appendChild(thumb);
      });
    }
  }

  // Clear modal markdown view and editor
  if (modalMarkdownContent) modalMarkdownContent.innerHTML = "";
  if (markdownEditor) markdownEditor.value = "";
  if (adminFeedback) {
    adminFeedback.textContent = "";
    adminFeedback.className = "admin-feedback";
  }

  // Check login token
  const token = sessionStorage.getItem("fabul_auth_token");
  const isLoggedIn = token && token !== "undefined" && token !== "null";

  if (modalAdminPanel) {
    modalAdminPanel.classList.toggle("hidden", !isLoggedIn);
  }

  modalOverlay.classList.remove("hidden");

  // Load existing Markdown content only if user is logged in
  if (isLoggedIn) {
    if (modalMarkdownContent) {
      modalMarkdownContent.style.display = "block";
      modalMarkdownContent.innerHTML = "<p class='admin-feedback loading'>Carregando descrição detalhada...</p>";
    }
    
    try {
      const response = await fetch(`${GET_MARKDOWN_ENDPOINT}?id=${item.id}`, {
        method: "GET"
      });

      if (!response.ok) {
        throw new Error(`Status HTTP ${response.status}`);
      }

      const rawData = await response.json().catch(() => null);
      const data = Array.isArray(rawData) ? rawData[0] : rawData;
      const content = (data && data.content) ? data.content.trim() : "";

      if (modalMarkdownContent) {
        if (content) {
          // Use marked library to parse markdown to HTML safely
          if (typeof marked !== "undefined") {
            modalMarkdownContent.innerHTML = marked.parse(content);
          } else {
            modalMarkdownContent.innerHTML = `<p style="white-space: pre-wrap;">${content}</p>`;
          }

          if (markdownEditor) {
            markdownEditor.value = content;
          }
        } else {
          modalMarkdownContent.innerHTML = "";
        }
      }
    } catch (error) {
      console.error("Failed to load markdown content", error);
      if (modalMarkdownContent) {
        modalMarkdownContent.innerHTML = "<p class='admin-feedback error'>Não foi possível carregar a descrição detalhada.</p>";
      }
    }
  } else {
    if (modalMarkdownContent) {
      modalMarkdownContent.style.display = "none";
      modalMarkdownContent.innerHTML = "";
    }
  }
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  currentItemInModal = null;
}

function updateAuthStatusText(isConnected) {
  const authStatus = document.getElementById("authStatus");
  const logoutBtn = document.getElementById("logoutBtn");
  if (authStatus) {
    authStatus.textContent = "";
    authStatus.classList.toggle("visible", isConnected);
    authStatus.classList.toggle("connected", isConnected);
    authStatus.classList.toggle("disconnected", !isConnected);
    if (isConnected) {
      authStatus.setAttribute("aria-label", "Conectado");
    } else {
      authStatus.removeAttribute("aria-label");
    }
  }
  if (logoutBtn) {
    logoutBtn.classList.toggle("hidden", !isConnected);
  }
}

async function checkAuthStatus() {
  const token = sessionStorage.getItem("fabul_auth_token");
  if (!token || token === "undefined" || token === "null") {
    updateAuthStatusText(false);
    return;
  }

  if (authCheckInFlight) return;

  authCheckInFlight = true;
  updateAuthStatusText(true);

  try {
    const response = await fetch(AUTH_CHECK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token, sentAt: new Date().toISOString() }),
    });

    const rawData = await response.json().catch(() => null);
    const data = Array.isArray(rawData) ? rawData[0] : rawData;
    const isConnected = !!(
      response.ok &&
      data &&
      (data.authenticated === true || data.success === true || data.valid === true || data.ok === true || data.status === "authenticated")
    );

    if (!isConnected) {
      sessionStorage.removeItem("fabul_auth_token");
      sessionStorage.removeItem("fabul_auth_expiresAt");
      sessionStorage.removeItem("fabul_auth_user");
    }
    updateAuthStatusText(isConnected);
  } catch (error) {
    console.error("Auth status check failed", error);
    updateAuthStatusText(true);
  } finally {
    authCheckInFlight = false;
  }
}

function initNavigation() {
  menuToggle.addEventListener("click", () => {
    siteNav.classList.toggle("open");
  });

  document.querySelectorAll(".site-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("open");
      checkAuthStatus();
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

function initLogoutListener() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;
  logoutBtn.addEventListener("click", async () => {
    const token = sessionStorage.getItem("fabul_auth_token");
    logoutBtn.disabled = true;
    logoutBtn.textContent = "Saindo...";

    try {
      if (token) {
        await fetch("https://n8n.fabulcroche.com/webhook/KSCCaiuejVoPmrNdQOJPUtLNybqNLFto", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ token, action: "logout", sentAt: new Date().toISOString() })
        });
      }
    } catch (err) {
      console.error("Logout request failed", err);
    } finally {
      sessionStorage.removeItem("fabul_auth_token");
      sessionStorage.removeItem("fabul_auth_expiresAt");
      sessionStorage.removeItem("fabul_auth_user");
      
      logoutBtn.disabled = false;
      logoutBtn.textContent = "Sair";
      updateAuthStatusText(false);
    }
  });
}

function initMarkdownEditorListeners() {
  if (saveMarkdownBtn) {
    saveMarkdownBtn.addEventListener("click", async () => {
      if (!currentItemInModal) return;
      const token = sessionStorage.getItem("fabul_auth_token");
      if (!token) {
        alert("Sessão expirada. Por favor, realize o login novamente.");
        return;
      }

      const content = markdownEditor.value.trim();
      saveMarkdownBtn.disabled = true;
      saveMarkdownBtn.textContent = "Salvando...";
      if (adminFeedback) {
        adminFeedback.textContent = "Enviando dados...";
        adminFeedback.className = "admin-feedback loading";
      }

      try {
        const response = await fetch(POST_MARKDOWN_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ id: currentItemInModal.id, content })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // Render updated markdown content
        if (modalMarkdownContent) {
          if (content) {
            if (typeof marked !== "undefined") {
              modalMarkdownContent.innerHTML = marked.parse(content);
            } else {
              modalMarkdownContent.innerHTML = `<p style="white-space: pre-wrap;">${content}</p>`;
            }
          } else {
            modalMarkdownContent.innerHTML = "";
          }
        }

        if (adminFeedback) {
          adminFeedback.textContent = "Salvo com sucesso!";
          adminFeedback.className = "admin-feedback success";
        }
      } catch (err) {
        console.error("Failed to save markdown content", err);
        if (adminFeedback) {
          adminFeedback.textContent = "Erro ao salvar o conteúdo.";
          adminFeedback.className = "admin-feedback error";
        }
      } finally {
        saveMarkdownBtn.disabled = false;
        saveMarkdownBtn.textContent = "Salvar";
      }
    });
  }

  if (clearMarkdownBtn) {
    clearMarkdownBtn.addEventListener("click", async () => {
      if (!currentItemInModal) return;
      const token = sessionStorage.getItem("fabul_auth_token");
      if (!token) {
        alert("Sessão expirada. Por favor, realize o login novamente.");
        return;
      }

      const confirmClear = confirm("Tem certeza absoluta que deseja APAGAR todo o conteúdo de descrição detalhada deste item? Essa ação não pode ser desfeita.");
      if (!confirmClear) return;

      clearMarkdownBtn.disabled = true;
      clearMarkdownBtn.textContent = "Apagando...";
      if (adminFeedback) {
        adminFeedback.textContent = "Apagando dados...";
        adminFeedback.className = "admin-feedback loading";
      }

      try {
        const response = await fetch(POST_MARKDOWN_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ id: currentItemInModal.id, content: "" })
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        if (markdownEditor) markdownEditor.value = "";
        if (modalMarkdownContent) modalMarkdownContent.innerHTML = "";

        if (adminFeedback) {
          adminFeedback.textContent = "Conteúdo apagado com sucesso!";
          adminFeedback.className = "admin-feedback success";
        }
      } catch (err) {
        console.error("Failed to clear markdown content", err);
        if (adminFeedback) {
          adminFeedback.textContent = "Erro ao apagar o conteúdo.";
          adminFeedback.className = "admin-feedback error";
        }
      } finally {
        clearMarkdownBtn.disabled = false;
        clearMarkdownBtn.textContent = "Apagar Tudo";
      }
    });
  }
}

function init() {
  renderPortfolioPage(currentPage);
  renderPagination();
  initNavigation();
  initPortfolioListeners();
  initModalListeners();
  autosizeMessage();
  messageInput.addEventListener("input", autosizeMessage);
  initLogoutListener();
  initMarkdownEditorListeners();

  window.addEventListener("hashchange", () => checkAuthStatus());
  window.addEventListener("pageshow", () => checkAuthStatus());
  window.addEventListener("focus", () => checkAuthStatus());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      checkAuthStatus();
    }
  });

  checkAuthStatus();
}

init();
