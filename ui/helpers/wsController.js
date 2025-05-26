export default class WSController {
  constructor(opt) {
    this.events = new Map();
    this.opt = opt;
  }

  listen(socket) {
    const { onClose, onError } = this.opt || {};
    !onClose || socket.on('close', onClose);
    !onError || socket.on('error', onError);
    socket.onmessage = this.onMessage.bind(this, socket);
  }

  addEvent(event, handler) {
    this.events.set(event, { handler });
  }

  onMessage(socket, incomingEvent) {
    try {
      const { data } = incomingEvent;
      const message = JSON.parse(data);
      const { event, payload } = message;
      const { handler } = this.events.get(event) ?? {};
      console.log('EVENT:', event);
      if (!handler) {
        throw new Error('Event not found');
      }
      handler(socket, payload);
    } catch (err) {
      console.log(err);
      console.error('ERROR:', err.message);
    }
  }
}