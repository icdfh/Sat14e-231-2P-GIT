window.API = window.API || "/api";

function saveToken(token) {
  localStorage.setItem("token", token);
}

function getToken() {
  return localStorage.getItem("token") || "";
}

async function register(email, password, name) {
  const res = await fetch(`${window.API}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  return res.json();
}

async function login(email, password) {
  const res = await fetch(`${window.API}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (res.ok && data.token) saveToken(data.token);
  return data;
}

async function me() {
  const res = await fetch(`${window.API}/users/me`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
}
