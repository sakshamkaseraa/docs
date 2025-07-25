import dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
import cors = require('cors');
import { Server } from 'socket.io';
import jwt, { VerifyErrors } from 'jsonwebtoken';
import http from 'http';
import env from './config/env.config';
import app from './app';
import documentService from './services/document.service';
import SocketEvent from './types/enums/socket-events-enum';

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: env.FRONT_END_URL,
    methods: '*',
  },
});

server.listen(env.PORT, () => {
  console.log(`Server listening on port ${env.PORT}...`);
});

io.on('connection', (socket) => {
  const accessToken = socket.handshake.query.accessToken as string | undefined;
  const documentId = socket.handshake.query.documentId as string | undefined;

  if (!accessToken || !documentId) return socket.disconnect();
  else {
    jwt.verify(
      accessToken,
      env.ACCESS_TOKEN_SECRET,
      (err: VerifyErrors | null, decoded: unknown) => {
        const { id, email } = decoded as RequestUser;
        (socket as any).username = email;

        documentService
          .findDocumentById(parseInt(documentId), parseInt(id))
          .then(async (document) => {
            if (document === null) return socket.disconnect();

            socket.join(documentId);
            io.in(documentId)
              .fetchSockets()
              .then((clients) => {
                io.sockets.in(documentId).emit(
                  SocketEvent.CURRENT_USERS_UPDATE,
                  clients.map((client) => (client as any).username)
                );
              });

            socket.on(SocketEvent.SEND_CHANGES, (rawDraftContentState) => {
              socket.broadcast
                .to(documentId)
                .emit(SocketEvent.RECEIVE_CHANGES, rawDraftContentState);
            });

            socket.on('disconnect', async () => {
              socket.leave(documentId);
              socket.disconnect();
              io.in(documentId)
                .fetchSockets()
                .then((clients) => {
                  io.sockets.in(documentId).emit(
                    SocketEvent.CURRENT_USERS_UPDATE,
                    clients.map((client) => (client as any).username)
                  );
                });
            });
          })
          .catch((error) => {
            console.log(error);
            return socket.disconnect();
          });
      }
    );
  }
});
