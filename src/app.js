import Fastify from 'fastify';
import serveStatic from './plugins/frontend.js';
import fastifyWebsocket from '@fastify/websocket';
import AutoLoad from '@fastify/autoload';
import { join } from 'desm';
import dotenv from 'dotenv';

dotenv.config({ path: join(import.meta.url, '..', '.env') });

export function makeApp(fastify) {
  fastify.register(fastifyWebsocket);
  fastify.register(serveStatic);

  fastify.register(AutoLoad, {
    dir: join(import.meta.url, 'routes'),
    dirNameRoutePrefix: false,
  });
  return fastify;
}

export const app = makeApp(Fastify());
