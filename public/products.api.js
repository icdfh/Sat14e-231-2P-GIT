async function getProducts() {
  const res = await fetch(`${window.API}/products`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
}

async function createProduct(title, description, price) {
  const res = await fetch(`${window.API}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ title, description, price }),
  });
  return res.json();
}

async function updateProduct(id, title, description, price) {
  const res = await fetch(`${window.API}/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ title, description, price }),
  });
  return res.json();
}

async function deleteProduct(id) {
  const res = await fetch(`${window.API}/products/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
}
