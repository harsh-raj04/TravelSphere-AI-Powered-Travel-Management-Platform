const http = require('http');
const { env } = require('./config/env');
const { app } = require('./app');
const { initSocket } = require('./socket');

const server = http.createServer(app);
initSocket(server);

server.listen(env.PORT, () => {
  console.log(`TravelSphere backend running on port ${env.PORT}`);
});
