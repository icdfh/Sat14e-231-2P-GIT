    // ===== refs =====
    const authSection = document.getElementById("authSection");
    const appSection = document.getElementById("appSection");

    const registerForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");

    const regMsg = document.getElementById("regMsg");
    const logMsg = document.getElementById("logMsg");

    const userInfo = document.getElementById("userInfo");
    const btnLogout = document.getElementById("btnLogout");
    const btnRefresh = document.getElementById("btnRefresh");

    const productForm = document.getElementById("productForm");
    const pTitle = document.getElementById("pTitle");
    const pDesc = document.getElementById("pDesc");
    const pPrice = document.getElementById("pPrice");
    const appMsg = document.getElementById("appMsg");

    const tbody = document.getElementById("productsTbody");

    // ===== ui helpers =====
    function setMsg(el, text, type = "") {
    el.className = "msg" + (type ? " " + type : "");
    el.textContent = text || "";
    }

    function showAuth() {
    authSection.classList.remove("hidden");
    appSection.classList.add("hidden");
    userInfo.classList.add("hidden");
    btnLogout.classList.add("hidden");
    setMsg(appMsg, "");
    }

    function showApp(user) {
    authSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    userInfo.classList.remove("hidden");
    btnLogout.classList.remove("hidden");
    userInfo.textContent = `Вы вошли: ${user.name} (${user.email})`;
    }

    function money(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return v;
    return n.toFixed(2);
    }

    function escapeHtml(s) {
    return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    // ===== token helpers (есть в auth.js, но logout проще здесь) =====
    function clearToken() {
    localStorage.removeItem("token");
    }

    // ===== products render =====
    function renderProducts(products) {
    tbody.innerHTML = "";

    if (!Array.isArray(products) || products.length === 0) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="5" class="muted">Пока нет продуктов. Добавь первый.</td>`;
        tbody.appendChild(tr);
        return;
    }

    for (const p of products) {
        const tr = document.createElement("tr");
        tr.dataset.id = p.id;

        tr.innerHTML = `
        <td>${p.id}</td>

        <td class="cell-title">${escapeHtml(p.title)}</td>
        <td class="cell-desc">${escapeHtml(p.description || "")}</td>
        <td class="cell-price">${money(p.price)}</td>

        <td>
            <div class="actions">
            <button class="btn small ghost js-edit" type="button">Редактировать</button>
            <button class="btn small danger js-del" type="button">Удалить</button>
            </div>
        </td>
        `;

        tbody.appendChild(tr);
    }
    }

    function rowToEditMode(tr) {
    const title = tr.querySelector(".cell-title").textContent;
    const desc = tr.querySelector(".cell-desc").textContent;
    const price = tr.querySelector(".cell-price").textContent;

    tr.dataset.mode = "edit";

    tr.querySelector(".cell-title").innerHTML = `<input class="in-title" type="text" value="${escapeHtml(title)}" />`;
    tr.querySelector(".cell-desc").innerHTML = `<input class="in-desc" type="text" value="${escapeHtml(desc)}" />`;
    tr.querySelector(".cell-price").innerHTML = `<input class="in-price" type="number" step="0.01" min="0" value="${escapeHtml(price)}" />`;

    tr.querySelector(".actions").innerHTML = `
        <button class="btn small ok js-save" type="button">Сохранить</button>
        <button class="btn small ghost js-cancel" type="button">Отмена</button>
    `;
    }

    async function refreshProducts() {
    setMsg(appMsg, "Загрузка...", "warn");

    const data = await getProducts();
    // твой бек возвращает { products: [...] } или ошибку { message: ... }
    if (data && Array.isArray(data.products)) {
        renderProducts(data.products);
        setMsg(appMsg, "");
        return;
    }

    // если токен битый — выкидываем на логин
    if (data && (data.message === "Токен неверный или истёк" || data.message?.toLowerCase().includes("токен"))) {
        clearToken();
        showAuth();
        setMsg(logMsg, "Сессия закончилась. Войди заново.", "err");
        return;
    }

    setMsg(appMsg, data?.message || "Ошибка загрузки продуктов", "err");
    }

    // ===== auth flow =====
    async function boot() {
    const token = getToken();
    if (!token) {
        showAuth();
        return;
    }

    const data = await me();
    if (data && data.user) {
        showApp(data.user);
        await refreshProducts();
        return;
    }

    // если токен невалиден
    clearToken();
    showAuth();
    }

    // ===== events =====
    registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg(regMsg, "Регистрация...", "warn");

    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value.trim();

    const data = await register(email, password, name);

    if (data && data.user) {
        setMsg(regMsg, "Готово. Теперь войди через форму входа.", "ok");
        registerForm.reset();
    } else {
        setMsg(regMsg, data?.message || "Ошибка регистрации", "err");
    }
    });

    loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg(logMsg, "Вход...", "warn");

    const email = document.getElementById("logEmail").value.trim();
    const password = document.getElementById("logPassword").value.trim();

    const data = await login(email, password);

    if (data && data.token && data.user) {
        setMsg(logMsg, "");
        loginForm.reset();

        showApp(data.user);
        await refreshProducts();
    } else {
        setMsg(logMsg, data?.message || "Ошибка входа", "err");
    }
    });

    btnLogout.addEventListener("click", () => {
    clearToken();
    tbody.innerHTML = "";
    showAuth();
    setMsg(logMsg, "Вы вышли из аккаунта.", "ok");
    });

    btnRefresh.addEventListener("click", async () => {
    await refreshProducts();
    });

    productForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg(appMsg, "Добавление...", "warn");

    const title = pTitle.value.trim();
    const description = pDesc.value.trim();
    const price = Number(pPrice.value);

    if (!title) {
        setMsg(appMsg, "Название обязательно", "err");
        return;
    }
    if (!Number.isFinite(price) || price < 0) {
        setMsg(appMsg, "Цена должна быть числом >= 0", "err");
        return;
    }

    const data = await createProduct(title, description, price);

    if (data && data.product) {
        setMsg(appMsg, "Добавлено!", "ok");
        productForm.reset();
        await refreshProducts();
    } else {
        setMsg(appMsg, data?.message || "Ошибка добавления", "err");
    }
    });

    // делегирование кликов по таблице
    tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const tr = e.target.closest("tr");
    if (!tr) return;

    const id = Number(tr.dataset.id);
    if (!Number.isFinite(id)) return;

    // удалить
    if (btn.classList.contains("js-del")) {
        const ok = confirm(`Удалить продукт #${id}?`);
        if (!ok) return;

        setMsg(appMsg, "Удаление...", "warn");
        const data = await deleteProduct(id);

        if (data && (data.deletedId || data.deletedId === 0)) {
        setMsg(appMsg, "Удалено", "ok");
        await refreshProducts();
        } else {
        setMsg(appMsg, data?.message || "Ошибка удаления", "err");
        }
        return;
    }

    // редактировать
    if (btn.classList.contains("js-edit")) {
        // если уже кто-то редактируется — просто обновим список (чтобы не усложнять)
        // можно и мягче сделать, но для учеников так проще и надежнее
        const editing = tbody.querySelector('tr[data-mode="edit"]');
        if (editing) await refreshProducts();

        rowToEditMode(tr);
        return;
    }

    // отмена
    if (btn.classList.contains("js-cancel")) {
        await refreshProducts();
        return;
    }

    // сохранить
    if (btn.classList.contains("js-save")) {
        const inTitle = tr.querySelector(".in-title");
        const inDesc = tr.querySelector(".in-desc");
        const inPrice = tr.querySelector(".in-price");

        const title = inTitle.value.trim();
        const desc = inDesc.value.trim();
        const price = Number(inPrice.value);

        if (!title) {
        setMsg(appMsg, "Название обязательно", "err");
        return;
        }
        if (!Number.isFinite(price) || price < 0) {
        setMsg(appMsg, "Цена должна быть числом >= 0", "err");
        return;
        }

        setMsg(appMsg, "Сохранение...", "warn");
        const data = await updateProduct(id, title, desc, price);

        if (data && data.product) {
        setMsg(appMsg, "Сохранено", "ok");
        await refreshProducts();
        } else {
        setMsg(appMsg, data?.message || "Ошибка обновления", "err");
        }
        return;
    }
    });

    // старт
    boot();
