import Ajv from 'ajv';

const ajv = new Ajv();

export default class WSController {
  constructor(opt) {
    this.events = new Map();
    this.opt = opt;
    this.set = new Set();
  }

  listen(socket) {
    this.set.add(socket);
    const { onClose, onError } = this.opt;
    !onClose || socket.on('close', onClose);
    !onError || socket.on('error', onError);
    const onMessage = this.onMessage.bind(this, socket);
    socket.on('message', onMessage);
  }

  addEvent(event, opts, handler) {
    if (typeof opts === 'function') {
      handler = opts;
      opts = {};
    }
    const { schema } = opts;
    let validate = null;
    if (schema) {
      validate = ajv.compile(schema);
    }
    this.events.set(event, { handler, validate });
  }

  onMessage(socket, data) {
    try {
      const message = JSON.parse(data);
      const { event, payload } = message;
      const { handler, validate } = this.events.get(event) ?? {};
      console.log('event:', event);
      if (!handler) {
        throw new Error('Event not found');
      }
      if (validate && validate(payload) === false) {
        throw new Error(ajv.errorsText(validate.errors));
      }
      handler(socket, payload);
    } catch (err) {
      console.log(err);
      console.log('ERROR:', err.message);
      socket.send(
        JSON.stringify({ event: 'ERROR', payload: { msg: err.message } })
      );
    }
  }
}
