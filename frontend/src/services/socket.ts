import io from 'socket.io-client';

const socket = io('http://localhost:4331');

export default socket;
