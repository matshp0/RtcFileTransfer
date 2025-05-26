import fastifyStatic from '@fastify/static';
import { join } from 'desm';

export default async function serveStatic(fastify, opts) {
  console.log(import.meta.url);

  fastify.register(fastifyStatic, {
    root: join(import.meta.url, '..', '..', 'public'),
    prefix: '/public',
  });

  fastify.get('/', async (request, reply) => {
    return reply.sendFile('index.html', join(import.meta.url, '..', '..', 'public'));
  });
}
