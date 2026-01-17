const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));

const usersRoutes = require("./routes/users.routes");
const productsRoutes = require("./routes/products.routes");

app.use("/api/users", usersRoutes);
app.use("/api/products", productsRoutes);

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});