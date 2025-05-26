let signalingChannel = null;

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun3.l.google.com:19302'],
    },
  ],
};

function displayTextOnScreen(text) {
  const textElement = document.createElement('div');
  textElement.textContent = text;

  // Style the text element
  textElement.style.position = 'absolute';
  textElement.style.color = 'black';
  textElement.style.fontSize = '16px';
  textElement.style.fontFamily = 'Arial, sans-serif';

  document.body.appendChild(textElement);
}

const main = async () => {
  const configuration = { servers };
  const peerConnection = new RTCPeerConnection(configuration);
  const dataChannel = peerConnection.createDataChannel('myDataChannel', {
    negotiated: true,
    id: 0,
  });

  dataChannel.onmessage = (event) => {
    console.log('123');
    const receivedData = event.data;
    console.log('Received data:', receivedData);

    if (typeof receivedData === 'string') {
      displayTextOnScreen(receivedData);
    } else if (receivedData instanceof ArrayBuffer) {
      console.log('Received binary data:', receivedData);
    }
  };
  peerConnection.addEventListener('icecandidate', async (event) => {
    signalingChannel.send(JSON.stringify({ candidate: event.candidate }));
  });
  peerConnection.addEventListener('connectionstatechange', (event) => {
    console.log('Connection state change:', peerConnection.connectionState);
  });

  function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value;

    if (dataChannel && dataChannel.readyState === 'open') {
      console.log('Data channel created with label:', dataChannel);
      dataChannel.send(message);
      console.log('Sent message:', message);

      input.value = '';
    } else {
      console.error('DataChannel is not open');
    }
  }

  const messageHandler = async (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.answer) {
        const remoteDesc = new RTCSessionDescription(message.answer);
        await peerConnection.setRemoteDescription(remoteDesc);
      }
      if (message.offer) {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(message.offer)
        );
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        signalingChannel.send(JSON.stringify({ answer }));
      }
      if (message.candidate) {
        console.log(message);
        try {
          await peerConnection.addIceCandidate(message.candidate);
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      }
    } catch (err) {
      console.log(event.data);
      console.error(err);
    }
  };

  const connect = () => {
    const id = document.getElementById('my-id-input').value;
    signalingChannel = new WebSocket(
      `ws://${window.location.host}/signaling/${id}`
    );
    signalingChannel.onopen = () => {
      signalingChannel.onmessage = async (event) => {
        await messageHandler(event);
      };
    };
  };

  const sendOffer = async () => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    const receiverId = document.getElementById('host-id-input').value;
    console.log({ offer, receiverId });
    signalingChannel.send(JSON.stringify({ offer, receiverId }));
  };

  document.addEventListener('DOMContentLoaded', () => {
    document
      .getElementById('connect-button')
      .addEventListener('click', connect);
    document
      .getElementById('send-offer-button')
      .addEventListener('click', sendOffer);
    document
      .getElementById('send-message')
      .addEventListener('click', sendMessage);
  });
};

main();
