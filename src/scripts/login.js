const loginForm = document.getElementById("loginForm");
const feedback = document.getElementById("feedback");
const submitBtn = loginForm.querySelector("button[type=submit]");
const WEBHOOK = window.FABUL_WEBHOOK;
const AUTH_ENDPOINT = window.FABUL_AUTH_ENDPOINT || null;
const VALIDATE_ENDPOINT = window.FABUL_VALIDATE_ENDPOINT || null;

let _sessionValidationInterval = null;

// Modal elements
const resultModal = document.getElementById("resultModal");
const resultTitle = document.getElementById("resultTitle");
const resultMessage = document.getElementById("resultMessage");
const resultClose = document.getElementById("resultClose");
const resultContinue = document.getElementById("resultContinue");

function showResultModal(success, message) {
  if (!resultModal) return;
  resultTitle.textContent = success ? "Sucesso" : "Erro";
  resultMessage.textContent = message || (success ? "Operação concluída." : "Ocorreu um erro.");
  resultContinue.style.display = success ? "inline-block" : "none";
  resultClose.style.display = success ? "none" : "inline-block";
  resultModal.classList.remove("hidden");
  resultModal.setAttribute("aria-hidden", "false");
}

function hideResultModal() {
  if (!resultModal) return;
  resultModal.classList.add("hidden");
  resultModal.setAttribute("aria-hidden", "true");
}

resultClose?.addEventListener("click", () => hideResultModal());
resultContinue?.addEventListener("click", () => {
  const HOME = window.FABUL_HOME || (location.protocol && location.protocol.startsWith("http") ? "/" : "index.html");
  window.location.replace(HOME);
});

async function validateSession(token) {
  if (!VALIDATE_ENDPOINT || !token) return false;
  try {
    const res = await fetch(VALIDATE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    return !!(data && data.success && data.authenticated);
  } catch (err) {
    console.error("validateSession error", err);
    return false;
  }
}

function startSessionValidationPoll(token, intervalMs = 5 * 60 * 1000) {
  // clear existing
  if (_sessionValidationInterval) clearInterval(_sessionValidationInterval);
  // do an immediate validation then schedule periodic checks
  (async () => {
    const ok = await validateSession(token);
    if (!ok) {
      sessionStorage.clear();
      window.location.href = "/login.html";
    }
  })();

  _sessionValidationInterval = setInterval(async () => {
    const ok = await validateSession(token);
    if (!ok) {
      clearInterval(_sessionValidationInterval);
      sessionStorage.clear();
      window.location.href = "/login.html";
    }
  }, intervalMs);
}

if (!WEBHOOK && !AUTH_ENDPOINT) console.warn("Nenhum endpoint configurado; abra login.html para definir window.FABUL_WEBHOOK ou window.FABUL_AUTH_ENDPOINT");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  feedback.textContent = "";
  const formData = new FormData(loginForm);
  const username = (formData.get("username") || "").toString().trim();
  const password = (formData.get("password") || "").toString().trim();

  if (!username || !password) {
    feedback.textContent = "Preencha usuário e senha.";
    return;
  }

  submitBtn.disabled = true;
  feedback.textContent = "Enviando...";

  try {
    const payload = { username, password, sentAt: new Date().toISOString() };
    const endpoint = AUTH_ENDPOINT || WEBHOOK;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      // non-2xx from backend
      throw new Error("HTTP " + res.status);
    }

    const data = await res.json().catch(() => null);

    // Clear temporary feedback text after receiving a response.
    feedback.textContent = "";

    // Evaluate the response body for authentication result (supporting both formats):
    // 1) Success: an array with an object containing token, user, expiresAt
    // 2) Success: an object with success/authenticated true
    // 3) Failure: any other format or explicit failure object.
    let success = false;
    let tokenValue = null;
    let expires = null;

    if (Array.isArray(data) && data.length > 0 && data[0] && data[0].token) {
      success = true;
      tokenValue = data[0].token;
      expires = data[0].expiresAt || null;
      if (data[0].user) sessionStorage.setItem("fabul_auth_user", JSON.stringify({ username: data[0].user }));
    } else if (data && (data.success === true || data.authenticated === true)) {
      success = true;
      tokenValue = data.token || null;
      expires = data.expiresAt || null;
      if (data.user) sessionStorage.setItem("fabul_auth_user", JSON.stringify(data.user));
    }

    if (success) {
      if (tokenValue) sessionStorage.setItem("fabul_auth_token", tokenValue);
      if (expires) sessionStorage.setItem("fabul_auth_expiresAt", String(expires));

      const token = tokenValue || sessionStorage.getItem("fabul_auth_token");
      if (token && VALIDATE_ENDPOINT) startSessionValidationPoll(token);

      feedback.textContent = "";
      showResultModal(true, "Login realizado com sucesso");
    } else {
      feedback.textContent = "";
      showResultModal(false, "Não foi possível realizar o login");
    }
  } catch (err) {
    console.error(err);
    feedback.textContent = "";
    showResultModal(false, "Não foi possível realizar o login");
  } finally {
    submitBtn.disabled = false;
  }
});

// On script load: if token exists, start validation poll (so pages that include this script will validate)
(function autoStartValidationIfNeeded() {
  const token = sessionStorage.getItem("fabul_auth_token");
  if (token && VALIDATE_ENDPOINT) {
    // validate immediately and start polling
    startSessionValidationPoll(token);
  }
})();
