import streamSaver from 'streamsaver';

const CHUNK_SIZE = 262144; //256KB
const EOF = 'EOF'; // End of file
const THRESHOLD = 12 * 1024 * 1024; // 12MB

export default class RtcClient extends EventTarget {
  constructor(socket, socketId) {
    super();
    this.socket = socket;
    this.destination = socketId;
    this.peerConnection = new RTCPeerConnection();
    this.dataChannel = this.peerConnection.createDataChannel('FileTransfer', {
      negotiated: true,
      id: 0,
    });
    this.dataChannel.binaryType = 'arraybuffer';
    this.peerConnection.onicecandidate = this.onCandidateDiscovery.bind(this);
    this.dataChannel.addEventListener(
      'open',
      (event) => {
        const openChannelEvent = new Event('dataChannelOpen');
        this.dispatchEvent(openChannelEvent);
      },
      { once: true }
    );
  }

  async onCandidateDiscovery(event) {
    if (event.candidate) {
      this.socket.send(
        JSON.stringify({
          event: 'ICE_CANDIDATE',
          payload: {
            candidate: event.candidate,
            destination: this.destination,
          },
        })
      );
    }
  }

  async onOffer(socket, data) {
    console.log('RTC OFFER', data);
    const { offer } = data;
    try {
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      socket.send(
        JSON.stringify({
          event: 'RTC_ANSWER',
          payload: { answer, destination: this.destination },
        })
      );
    } catch (e) {
      console.error('Error creating answer', e);
    }
  }

  async onCandidate(socket, data) {
    console.log('ICE CANDIDATE', data);
    const { candidate } = data;
    try {
      await this.peerConnection.addIceCandidate(candidate);
    } catch (e) {
      console.error('Error adding received ice candidate', e);
    }
  }

  async createOffer() {
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    this.socket.send(
      JSON.stringify({
        event: 'RTC_OFFER',
        payload: { offer, destination: this.destination },
      })
    );
  }

  async onAnswer(socket, data) {
    console.log('RTC_ANSWER', data);
    this.socket = socket;
    const { answer } = data;
    try {
      const { answer } = data;
      await this.peerConnection.setRemoteDescription(answer);
    } catch (e) {
      console.error('Error receiving answer', e);
    }
  }

  awaitReadyState() {
    return new Promise((resolve) => {
      this.dataChannel.addEventListener(
        'message',
        (event) => {
          const message = event.data;
          if (message === 'READY') {
            resolve();
          }
        },
        { once: true }
      );
    });
  }
  async sendFiles(files) {
    for (const file of files) {
      const skipController = new AbortController();
      const { signal } = skipController;
      console.log('awaiting ready state');
      await this.awaitReadyState();
      await this.sendFile(file, signal).catch((e) => {
        console.log('Error sending file:', e);
      });
    }
  }

  async sendFile(file, signal) {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      const { size } = file;
      let offset = 0;

      signal.addEventListener('abort', () => {
        reader = null;
        reject('File transfer aborted');
      });

      const readNextChunk = () => {
        if (signal.aborted) return;
        if (offset < size) {
          const slice = file.slice(offset, offset + CHUNK_SIZE);
          reader.readAsArrayBuffer(slice);
        } else {
          this.dataChannel.send(EOF);
          console.log('File transfer complete. EOF sent.');
          resolve();
        }
      };

      const waitForBufferedAmount = () => new Promise((resolve) => {
        if (this.dataChannel.bufferedAmount < THRESHOLD) {
          resolve();
        } else {
          setTimeout(() => waitForBufferedAmount().then(resolve), 10);
        }
      });
      reader.onload = async (event) => {
        if (signal.aborted) return;
        const data = event.target.result;
        console.log(
          `Sending ${data.byteLength} bytes, sent: ${offset / CHUNK_SIZE}`
        );
        await waitForBufferedAmount(this.dataChannel);
        this.dataChannel.send(data);
        offset += data.byteLength;
        readNextChunk();
      };

      reader.onerror = (event) => {
        console.error('FileReader error', event.target.error);
        throw event.target.error;
      };


      readNextChunk();
    });
  }

  async receiveFiles(files, signal) {
    signal.addEventListener('abort', () => {
      this.dataChannel.close();
    });
    for (const file of files) {
      if (signal.aborted) return;
      this.dataChannel.send('READY');
      await this.receiveFile(file, signal);
    }
  }

  async receiveFile(file, signal) {
    return new Promise((resolve, reject) => {
      const { name, size } = file;
      const fileStream = streamSaver.createWriteStream(name, { size });
      const writer = fileStream.getWriter();
      const abortHandler = () => {
        fileStream.abort();
        writer.abort();
        reject();
      };
      signal.addEventListener('abort', abortHandler);
      window.onunload = abortHandler;
      this.dataChannel.onmessage = (event) => {
        console.log(event);
        const message = event.data;
        console.log('Message: ', message);
        console.log('Received chunk', message.length);
        if (message === 'EOF') {
          writer.close();
          resolve();
          return;
        }
        const uint8chunk = new Uint8Array(message);
        console.log(uint8chunk);
        writer.write(uint8chunk);
      };
    });
  }
}
