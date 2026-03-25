const { PORT } = require("./src/config/env");
const { createApp } = require("./src/app");

const app = createApp();

app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});
