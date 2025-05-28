import { fastify } from './src/app.js';


fastify.listen(
  { port: process.env.PORT || 8000, host: '0.0.0.0' },
  (err, address) => {
    if (err) {
      throw err;
    }
    console.log(`Server is running on ${address}`);
  }
);
