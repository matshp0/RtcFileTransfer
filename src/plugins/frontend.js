import fastifyStatic from '@fastify/static';
import { join } from 'desm';

export default async function serveStatic(fastify) {
  fastify.register(fastifyStatic, {
    root: join(import.meta.url, '..', '..', 'public'),
    prefix: '/public',
  });

  fastify.get('/', async (request, reply) =>
    reply.sendFile('index.html', join(import.meta.url, '..', '..', 'public'))
  );
}
