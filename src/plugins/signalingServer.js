import fp from 'fastify-plugin';
import BiMap from 'bidirectional-map';
import WSController from '../scripts/wsController.js';
import S from 'fluent-json-schema';
import generateKey from '../scripts/generateKey.js';


const DESTINATION_NOT_FOUND = 'destination not found';

const signalingServer = async (fastify) => {
  const clients = new BiMap();

  const onClose = (socket) => {
    clients.delete(socket);
  };
  const wsConnection = new WSController({ onClose });

  wsConnection.addEvent(
    'RTC_OFFER',
    {
      schema: S.object()
        .prop('offer', S.object())
        .prop('destination', S.string())
        .required(['offer', 'destination'])
        .valueOf(),
    },
    (socket, data) => {
      const { offer, destination } = data;
      const origin = clients.get(socket);
      const toSocket = clients.getKey(destination);
      if (!toSocket) {
        socket.send(
          JSON.stringify({ event: 'ERROR', payload: { msg: DESTINATION_NOT_FOUND } })
        );
      }
      toSocket.send(
        JSON.stringify({ event: 'RTC_OFFER', payload: { offer, origin } })
      );
    }
  ); // sent by the client to initiate a rtc connection

  wsConnection.addEvent(
    'RTC_ANSWER',
    {
      schema: S.object()
        .prop('answer', S.object())
        .prop('destination', S.string())
        .required(['answer', 'destination'])
        .valueOf(),
    },
    (socket, data) => {
      const { answer, destination } = data;
      const toSocket = clients.getKey(destination);
      if (!toSocket) {
        socket.send(
          JSON.stringify({ event: 'ERROR', payload: { msg: DESTINATION_NOT_FOUND } })
        );
      }
      toSocket.send(
        JSON.stringify({ event: 'RTC_ANSWER', payload: { answer } }));
    }
  ); // sent by the host to the client in answer to RTC OFFER

  wsConnection.addEvent(
    'ICE_CANDIDATE',
    {
      schema: S.object()
        .prop('candidate', S.object())
        .prop('destination', S.string())
        .required(['candidate', 'destination'])
        .valueOf(),
    },
    (socket, data) => {
      const { candidate, destination } = data;
      const toSocket = clients.getKey(destination);
      const origin = clients.get(socket);
      if (!toSocket) {
        socket.send(
          JSON.stringify({ event: 'ERROR', payload: { msg: DESTINATION_NOT_FOUND } })
        );
      }
      toSocket.send(
        JSON.stringify({
          event: 'ICE_CANDIDATE',
          payload: { candidate, origin }
        }));
    }
  ); // sent by both the client and the host to exchange ice candidates

  wsConnection.addEvent(
    'JOIN_REQUEST',
    {
      schema: S.object()
        .prop('destination', S.string())
        .required(['destination'])
        .valueOf(),
    },
    (socket, data) => {
      const { destination } = data;
      const origin = clients.get(socket);
      const hostSocket = clients.getKey(destination);
      if (!hostSocket) {
        socket.send(
          JSON.stringify({
            event: 'ERROR',
            payload: { msg: 'Key not found' },
          })
        );
        return;
      }
      hostSocket.send(
        JSON.stringify({ event: 'JOIN_REQUEST', payload: { origin } })
      );
    }
  ); //sent by the client to initiate a connection

  wsConnection.addEvent(
    'FILE_METADATA',
    {
      schema: S.object()
        .prop(
          'files',
          S.array().items(
            S.object()
              .prop('name', S.string())
              .prop('size', S.number())
              .required(['name', 'size'])
          )
        )
        .prop('destination', S.string())
        .required(['files', 'destination'])
        .valueOf(),
    },
    (socket, data) => {
      const { destination, files } = data;
      const clientSocket = clients.getKey(destination);
      if (!clientSocket) {
        socket.send(
          JSON.stringify({
            event: 'ERROR',
            payload: { msg: DESTINATION_NOT_FOUND },
          })
        );
        return;
      }
      clientSocket.send(
        JSON.stringify({ event: 'FILE_METADATA', payload: { files } })
      );
    }
  ); //sent by the host to the client in answer to JOIN REQUEST

  wsConnection.addEvent('GET_SOCKET_ID', (socket) => {
    socket.send(
      JSON.stringify({
        event: 'SOCKET_ID',
        payload: { id: clients.get(socket) },
      })
    );
  });

  fastify.get('/signaling', { websocket: true }, (socket) => {
    const socketId = generateKey(12);
    clients.set(socket, socketId);
    wsConnection.listen(socket);
  });
};

export default fp(signalingServer);

/*
DOWNLOADER(host) <-> UPLOADER(client)

<- JOIN REQUEST
-> FILE METADATA
<- RTC OFFER
-> RTC ANSWER
<-> ICE CANDIDATE

<- [rtc]READY
-> [rtc]data
-> [rtc]EOF
<- [rtc]READY
...
 */
