import Fastify from 'fastify';
import { makeApp } from '../app.js';


const signalingUrl = '/api/signaling';

const receiveMessage = async (ws) => new Promise((res, rej) => {
  ws.on('message', (data) => res(JSON.parse(data)));
  ws.on('error', (err) => rej(err));
});

const connect = async (host, client) => {
  host.send(JSON.stringify({ event: 'GET_SOCKET_ID' }));
  const { id } = (await receiveMessage(host)).payload;
  client.send(JSON.stringify({ event: 'JOIN_REQUEST', payload: { destination: id } }));
  const { origin } = (await receiveMessage(host)).payload;
  return origin;
};

const fastify = Fastify();
makeApp(fastify);
await fastify.ready();
let host = null;
let client = null;

afterAll(() => fastify.close);

describe(`${signalingUrl} ws`, () => {
  beforeEach(async () => {
    host = await fastify.injectWS(signalingUrl);
    client = await fastify.injectWS(signalingUrl);
  });

  afterEach(() => {
    host.terminate();
    client.terminate();
  });

  test('Should return error for non-json', async () => {
    host.send('hi from client');
    const { event } = await receiveMessage(host);
    expect(event).toBe('ERROR');
    host.terminate();
  });

  test('Event GET_SOCKET_ID', async () => {
    host.send(JSON.stringify({ event: 'GET_SOCKET_ID' }));
    const { event, payload } = await receiveMessage(host);
    expect(event).toBe('SOCKET_ID');
    expect(payload.id).not.toBeUndefined();
  });

  test('Event FILE_METADATA', async () => {
    const client = await fastify.injectWS(signalingUrl);
    const files = [
      { name: 'test.txt', size: 70909 },
      { name: 'picture.png', size: 66666 },
      { name: 'program.js', size: 1919191 },
      { name: 'test1.txt', size: 70909 },
      { name: 'pict1ure.png', size: 66666 },
      { name: 'prog3ram.js', size: 1919191 },
    ];
    const origin = await connect(host, client);
    host.send(JSON.stringify({ event: 'FILE_METADATA', payload: { files } }));
    const { event } = await receiveMessage(host);
    expect(event).toBe('ERROR');
    host.send(JSON.stringify({ event: 'FILE_METADATA', payload: { files, destination: origin } }));
    const f = (await receiveMessage(client)).payload.files;
    expect(f).toStrictEqual(files);
  });

  test('Event JOIN_REQUEST', async () => {
    const client = await fastify.injectWS(signalingUrl);
    host.send(JSON.stringify({ event: 'GET_SOCKET_ID' }));
    await receiveMessage(host);
    client.send(JSON.stringify({ event: 'JOIN_REQUEST', payload: { destination: 'test' } }));
    const { event } = await receiveMessage(client);
    expect(event).toBe('ERROR');
    await connect(host, client);
  });

  test('Event RTC_OFFER', async () => {
    let response;
    const offer = { offer: 'test' };
    host.send(JSON.stringify({ event: 'RTC_OFFER', payload: { destination: 'test' } }));
    const { event } = await receiveMessage(host);
    expect(event).toBe('ERROR');
    await connect(host, client);
    client.send(JSON.stringify({ event: 'RTC_OFFER', payload: { offer, destination: 'test' } }));
    response = await receiveMessage(client);
    expect(response.event).toBe('ERROR');
    host.send(JSON.stringify({ event: 'GET_SOCKET_ID' }));
    const { payload } = await receiveMessage(host);
    const destination = payload.id;
    client.send(JSON.stringify({ event: 'RTC_OFFER', payload: { offer, destination } }));
    response = await receiveMessage(host);
    expect(response.payload.offer).toStrictEqual(offer);
  });

  test('Event RTC_ANSWER', async () => {
    let response;
    const answer = { answer: 'test' };
    host.send(JSON.stringify({ event: 'RTC_ANSWER', payload: { destination: 'test' } }));
    const { event } = await receiveMessage(host);
    expect(event).toBe('ERROR');
    await connect(host, client);
    client.send(JSON.stringify({ event: 'RTC_ANSWER', payload: { answer, destination: 'test' } }));
    response = await receiveMessage(client);
    expect(response.event).toBe('ERROR');
    host.send(JSON.stringify({ event: 'GET_SOCKET_ID' }));
    const { payload } = await receiveMessage(host);
    const destination = payload.id;
    client.send(JSON.stringify({ event: 'RTC_ANSWER', payload: { answer, destination } }));
    response = await receiveMessage(host);
    expect(response.payload.answer).toStrictEqual(answer);
  });

  test('Event ICE_CANDIDATE', async () => {
    let response;
    const candidate = { candidate: 'test' };
    host.send(JSON.stringify({ event: 'ICE_CANDIDATE', payload: { destination: 'test' } }));
    const { event } = await receiveMessage(host);
    expect(event).toBe('ERROR');
    await connect(host, client);
    client.send(JSON.stringify({ event: 'ICE_CANDIDATE', payload: { candidate, destination: 'test' } }));
    response = await receiveMessage(client);
    expect(response.event).toBe('ERROR');
    host.send(JSON.stringify({ event: 'GET_SOCKET_ID' }));
    const { payload } = await receiveMessage(host);
    const destination = payload.id;
    client.send(JSON.stringify({ event: 'ICE_CANDIDATE', payload: { candidate, destination } }));
    response = await receiveMessage(host);
    expect(response.payload.candidate).toStrictEqual(candidate);
  });
});
