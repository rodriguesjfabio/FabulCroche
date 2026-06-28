const loginForm = document.getElementById("loginForm");
const feedback = document.getElementById("feedback");
const submitBtn = loginForm.querySelector("button[type=submit]");
const WEBHOOK = window.FABUL_WEBHOOK;
const AUTH_ENDPOINT = window.FABUL_AUTH_ENDPOINT || null;
const VALIDATE_ENDPOINT = window.FABUL_VALIDATE_ENDPOINT || null;
const AUTH_CHECK_ENDPOINT = window.FABUL_AUTH_CHECK_ENDPOINT || "https://n8n.fabulcroche.com/webhook/HuQzWFcAeLgEYKMlishMIdArkRaXdebg";
let _sessionValidationInterval = null;

const loginMessage = document.getElementById("loginMessage");
const authStatus = document.getElementById("authStatus");

function showInlineMessage(success, message) {
  if (!loginMessage) return;
  loginMessage.textContent = message;
  loginMessage.className = `login-message ${success ? "success" : "error"}`;
}

function clearInlineMessage() {
  if (!loginMessage) return;
  loginMessage.textContent = "";
  loginMessage.className = "login-message";
}

function updateAuthStatusText(isConnected) {
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
  if (!token) {
    updateAuthStatusText(false);
    return;
  }

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
  }
}

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
    const rawData = await res.json().catch(() => null);
    if (!rawData) return false;
    const data = Array.isArray(rawData) ? rawData[0] : rawData;
    return !!(
      data &&
      (data.authenticated === true ||
       data.success === true ||
       data.valid === true ||
       data.ok === true ||
       data.status === "authenticated")
    );
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
  clearInlineMessage();
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
    } else if (data && data.token) {
      success = true;
      tokenValue = data.token;
      expires = data.expiresAt || null;
      if (data.user) sessionStorage.setItem("fabul_auth_user", JSON.stringify({ username: data.user }));
    }

    if (success) {
      if (tokenValue) sessionStorage.setItem("fabul_auth_token", tokenValue);
      if (expires) sessionStorage.setItem("fabul_auth_expiresAt", String(expires));

      const token = tokenValue || sessionStorage.getItem("fabul_auth_token");
      updateAuthStatusText(!!token);
      if (token) {
        checkAuthStatus();
      }
      if (token && VALIDATE_ENDPOINT) startSessionValidationPoll(token);

      feedback.textContent = "";
      showInlineMessage(true, "Login realizado com sucesso");
    } else {
      feedback.textContent = "";
      showInlineMessage(false, "Não foi possível realizar o login");
    }
  } catch (err) {
    console.error(err);
    feedback.textContent = "";
    showInlineMessage(false, "Não foi possível realizar o login");
  } finally {
    submitBtn.disabled = false;
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

      const feedback = document.getElementById("feedback");
      const loginMessage = document.getElementById("loginMessage");
      if (feedback) feedback.textContent = "";
      if (loginMessage) {
        loginMessage.textContent = "";
        loginMessage.className = "login-message";
      }
    }
  });
}

// On script load: if token exists, start validation poll (so pages that include this script will validate)
(function autoStartValidationIfNeeded() {
  const token = sessionStorage.getItem("fabul_auth_token");
  initLogoutListener();
  if (token) {
    updateAuthStatusText(true);
    checkAuthStatus();
  }

  if (token && VALIDATE_ENDPOINT) {
    // validate immediately and start polling
    startSessionValidationPoll(token);
  }
})();
