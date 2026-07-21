import { portfolioItems } from "../data/portfolio.js";

const portfolioGrid = document.querySelector("#portfolioGrid");
const modalOverlay = document.querySelector("#modalOverlay");
const modalCard = document.querySelector(".modal-card");
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
const adminViewControls = document.querySelector("#adminViewControls");
const editMarkdownBtn = document.querySelector("#editMarkdownBtn");
const cancelMarkdownBtn = document.querySelector("#cancelMarkdownBtn");
const adminOnlySection = document.querySelector("#adminOnlySection");
const lightboxOverlay = document.querySelector("#lightboxOverlay");
const lightboxImage = document.querySelector("#lightboxImage");
const lightboxClose = document.querySelector("#lightboxClose");

const AUTH_CHECK_ENDPOINT = window.FABUL_AUTH_CHECK_ENDPOINT || "https://n8n.fabulcroche.com/webhook/HuQzWFcAeLgEYKMlishMIdArkRaXdebg";
const contactEndpoint = "https://n8n.fabulcroche.com/webhook/NDjNtJQSzQjDKtdoubnINaFDYJIPKVro";
const contactToken = "r6BVpJjNx3GN8N1R3Xgz3t7L3HzaTuRA";
const allowedEmailDomains = ["gmail.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com", "icloud.com", "mail.com", "protonmail.com", "aol.com"];

// Markdown Webhooks
const GET_MARKDOWN_ENDPOINT = "https://n8n.fabulcroche.com/webhook/CGHSEVHHlnQOMSRDCTzIQjVeMYPijsiu";
const POST_MARKDOWN_ENDPOINT = "https://n8n.fabulcroche.com/webhook/nUTEPpUaIXoqyPBrVmUBazUJZHzOuhgo";

const ITEMS_PER_PAGE = 3;
const AUTH_CHECK_COOLDOWN_MS = 5 * 60 * 1000;
let currentPage = 1;
let authCheckInFlight = false;
let currentItemInModal = null;
let originalMarkdownContent = "";
let lastAuthCheckAt = 0;
let authCheckTimer = null;

function renderPlainText(content = "") {
  if (!content) return "";

  return String(content)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r?\n/g, "<br>");
}

function isUserLoggedIn() {
  const token = sessionStorage.getItem("fabul_auth_token");
  return !!token && token !== "undefined" && token !== "null";
}

function getVisiblePortfolioItems() {
  return portfolioItems.filter((item) => !item.isAdminOnly || isUserLoggedIn());
}

function refreshPortfolioView() {
  renderPortfolioPage(currentPage);
  renderPagination();
}

function renderPortfolioPage(page = currentPage) {
  const visibleItems = getVisiblePortfolioItems();
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  currentPage = safePage;

  portfolioGrid.innerHTML = "";
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageItems = visibleItems.slice(startIndex, endIndex);

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
  const visibleItems = getVisiblePortfolioItems();
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / ITEMS_PER_PAGE));

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

  if (modalDescription) {
    modalDescription.innerHTML = renderPlainText(item.description || "");
  }

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
  originalMarkdownContent = "";
  if (adminFeedback) {
    adminFeedback.textContent = "";
    adminFeedback.className = "admin-feedback";
  }

  // Check login token
  const token = sessionStorage.getItem("fabul_auth_token");
  const isLoggedIn = token && token !== "undefined" && token !== "null";

  if (modalAdminPanel) {
    modalAdminPanel.classList.add("hidden");
  }
  if (adminOnlySection) {
    adminOnlySection.classList.toggle("hidden", !isLoggedIn);
  }

  if (modalOverlay) {
    modalOverlay.classList.toggle("admin-mode", isLoggedIn);
  }
  if (modalCard) {
    modalCard.classList.toggle("admin-mode", isLoggedIn);
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
      
      originalMarkdownContent = content;

      if (modalMarkdownContent) {
        if (content) {
          modalMarkdownContent.innerHTML = renderPlainText(content);

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

async function checkAuthStatus(force = false) {
  const token = sessionStorage.getItem("fabul_auth_token");
  if (!token || token === "undefined" || token === "null") {
    updateAuthStatusText(false);
    refreshPortfolioView();
    return;
  }

  const now = Date.now();
  if (!force && (now - lastAuthCheckAt) < AUTH_CHECK_COOLDOWN_MS) {
    return;
  }

  if (authCheckInFlight) return;

  authCheckInFlight = true;
  lastAuthCheckAt = now;
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
    refreshPortfolioView();
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
      checkAuthStatus(true);
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

function closeLightbox() {
  if (lightboxOverlay) {
    lightboxOverlay.classList.add("hidden");
    lightboxOverlay.setAttribute("aria-hidden", "true");
  }
  if (lightboxImage) {
    lightboxImage.src = "";
  }
}

function initModalListeners() {
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (event) => {
      if (event.target === modalOverlay) closeModal();
    });
  }

  // Click on modal main image to open lightbox
  if (modalImage) {
    modalImage.addEventListener("click", () => {
      if (lightboxImage && lightboxOverlay) {
        lightboxImage.src = modalImage.src;
        lightboxOverlay.classList.remove("hidden");
        lightboxOverlay.setAttribute("aria-hidden", "false");
      }
    });
  }

  // Close lightbox on button click or clicking background
  if (lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
  }
  if (lightboxOverlay) {
    lightboxOverlay.addEventListener("click", (e) => {
      if (e.target === lightboxOverlay) {
        closeLightbox();
      }
    });
  }

  // Close with Escape key
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" || e.key === "Esc") {
      if (lightboxOverlay && !lightboxOverlay.classList.contains("hidden")) {
        closeLightbox();
      } else {
        closeModal();
      }
    }
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
      refreshPortfolioView();
    }
  });
}

function insertFormatting(textarea, formatType) {
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selectedText = text.substring(start, end);
  let replacement = "";
  let selectionOffsetStart = 0;
  let selectionOffsetEnd = 0;

  switch (formatType) {
    case "bold":
      replacement = `**${selectedText || "negrito"}**`;
      selectionOffsetStart = selectedText ? 0 : 2;
      selectionOffsetEnd = selectedText ? 0 : -2;
      break;
    case "italic":
      replacement = `*${selectedText || "itálico"}*`;
      selectionOffsetStart = selectedText ? 0 : 1;
      selectionOffsetEnd = selectedText ? 0 : -1;
      break;
    case "h1":
      const prefixH1 = (start === 0 || text.charAt(start - 1) === "\n") ? "" : "\n";
      replacement = `${prefixH1}# ${selectedText || "Título 1"}\n`;
      selectionOffsetStart = selectedText ? 0 : prefixH1.length + 2;
      selectionOffsetEnd = selectedText ? 0 : -1;
      break;
    case "h2":
      const prefixH2 = (start === 0 || text.charAt(start - 1) === "\n") ? "" : "\n";
      replacement = `${prefixH2}## ${selectedText || "Título 2"}\n`;
      selectionOffsetStart = selectedText ? 0 : prefixH2.length + 3;
      selectionOffsetEnd = selectedText ? 0 : -1;
      break;
    case "list":
      const prefixList = (start === 0 || text.charAt(start - 1) === "\n") ? "" : "\n";
      replacement = `${prefixList}- ${selectedText || "Item"}\n`;
      selectionOffsetStart = selectedText ? 0 : prefixList.length + 2;
      selectionOffsetEnd = selectedText ? 0 : -1;
      break;
    case "link":
      replacement = `[${selectedText || "Link"}](https://)`;
      selectionOffsetStart = selectedText ? 0 : 1;
      selectionOffsetEnd = selectedText ? 0 : -11;
      break;
  }

  textarea.value = text.substring(0, start) + replacement + text.substring(end);
  textarea.focus();
  
  const newStart = start + selectionOffsetStart;
  const newEnd = start + replacement.length + selectionOffsetEnd;
  textarea.setSelectionRange(newStart, newEnd);
}

function initMarkdownEditorListeners() {
  // Bind Edit Description button
  if (editMarkdownBtn) {
    editMarkdownBtn.addEventListener("click", () => {
      if (adminFeedback) {
        adminFeedback.textContent = "";
        adminFeedback.className = "admin-feedback";
      }
      if (adminOnlySection) adminOnlySection.classList.add("hidden");
      if (modalAdminPanel) modalAdminPanel.classList.remove("hidden");
      if (markdownEditor) {
        markdownEditor.focus();
      }
    });
  }

  // Bind Cancel button
  if (cancelMarkdownBtn) {
    cancelMarkdownBtn.addEventListener("click", () => {
      // Revert content in textarea to original state
      if (markdownEditor) {
        markdownEditor.value = originalMarkdownContent;
      }
      // Re-render original content in visual preview
      if (modalMarkdownContent) {
        modalMarkdownContent.style.display = "block";
        if (originalMarkdownContent) {
          modalMarkdownContent.innerHTML = renderPlainText(originalMarkdownContent);
        } else {
          modalMarkdownContent.innerHTML = "";
        }
      }
      if (modalAdminPanel) modalAdminPanel.classList.add("hidden");
      if (adminOnlySection) adminOnlySection.classList.remove("hidden");
    });
  }

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

        originalMarkdownContent = content;

        // Render updated markdown content
        if (modalMarkdownContent) {
          if (content) {
            modalMarkdownContent.innerHTML = renderPlainText(content);
          } else {
            modalMarkdownContent.innerHTML = "";
          }
        }

        if (adminFeedback) {
          adminFeedback.textContent = "Salvo com sucesso!";
          adminFeedback.className = "admin-feedback success";
        }

        // Return to visual mode after showing success feedback
        setTimeout(() => {
          if (modalAdminPanel) modalAdminPanel.classList.add("hidden");
          if (adminOnlySection) adminOnlySection.classList.remove("hidden");
          if (modalMarkdownContent) modalMarkdownContent.style.display = "block";
        }, 1000);

      } catch (err) {
        console.error("Failed to load markdown content", err);
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

        originalMarkdownContent = "";
        if (markdownEditor) markdownEditor.value = "";
        if (modalMarkdownContent) modalMarkdownContent.innerHTML = "";

        if (adminFeedback) {
          adminFeedback.textContent = "Conteúdo apagado com sucesso!";
          adminFeedback.className = "admin-feedback success";
        }

        // Return to visual mode after showing success feedback
        setTimeout(() => {
          if (modalAdminPanel) modalAdminPanel.classList.add("hidden");
          if (adminOnlySection) adminOnlySection.classList.remove("hidden");
          if (modalMarkdownContent) modalMarkdownContent.style.display = "block";
        }, 1000);

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

  // Bind formatting toolbar buttons
  const toolbar = document.querySelector("#editorToolbar");
  if (toolbar && markdownEditor) {
    toolbar.addEventListener("click", (e) => {
      const btn = e.target.closest(".toolbar-btn");
      if (!btn) return;
      
      const format = btn.getAttribute("data-format");
      if (format) {
        insertFormatting(markdownEditor, format);
      }
    });
  }
}

function scheduleAuthCheck() {
  if (authCheckTimer) clearTimeout(authCheckTimer);
  authCheckTimer = setTimeout(() => {
    checkAuthStatus(true);
  }, AUTH_CHECK_COOLDOWN_MS);
}

function init() {
  refreshPortfolioView();
  initNavigation();
  initPortfolioListeners();
  initModalListeners();
  autosizeMessage();
  messageInput.addEventListener("input", autosizeMessage);
  initLogoutListener();
  initMarkdownEditorListeners();

  window.addEventListener("hashchange", () => checkAuthStatus(true));
  window.addEventListener("pageshow", () => checkAuthStatus(true));
  window.addEventListener("focus", () => checkAuthStatus(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      checkAuthStatus(true);
    }
  });

  checkAuthStatus(true);
  scheduleAuthCheck();
}

init();

document.getElementById("whatsapp-link").addEventListener("click", (e) => {
    e.preventDefault();
    const text = "Olá! Conheci o trabalho de vocês pelo site e gostaria de saber mais sobre as peças de crochê.";

    window.open(
        `https://wa.me/5547920041823?text=${encodeURIComponent(text)}`,
        "_blank"
    );
});

document.getElementById("whatsapp-link2").addEventListener("click", (e) => {
    e.preventDefault();
    const text = "Olá! Conheci o trabalho de vocês pelo site e gostaria de saber mais sobre as peças de crochê.";

    window.open(
        `https://wa.me/5547920041823?text=${encodeURIComponent(text)}`,
        "_blank"
    );
});