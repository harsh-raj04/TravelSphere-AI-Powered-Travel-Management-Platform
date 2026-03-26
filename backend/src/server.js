const { env } = require("./config/env");
const { app } = require("./app");

app.listen(env.PORT, () => {
  console.log(`TravelSphere backend running on port ${env.PORT}`);
});
