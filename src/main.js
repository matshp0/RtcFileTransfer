import path from 'path';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';
import serveStatic from './plugins/frontend.js';
import fastifyWebsocket from '@fastify/websocket';
import AutoLoad from '@fastify/autoload';
import { join } from 'desm';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: join(import.meta.url, '..', '.env') });

const fastify = Fastify({
  logger: true,
});

fastify.register(fastifyWebsocket);
fastify.register(serveStatic);


console.log(import.meta.url);
fastify.register(AutoLoad, {
  dir: join(import.meta.url, 'routes'),
  dirNameRoutePrefix: false
});

fastify.listen(
  { port: process.env.PORT || 8000, host: '0.0.0.0' },
  (err, address) => {
    if (err) {
      throw err;
    }
    console.log(`Server is running on ${address}`);
  }
);
