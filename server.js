import express from "express";
import { Server } from "socket.io";
import { v4 } from "uuid";
import { createServer } from "http";
import { ExpressPeerServer } from "peer";

const app = express();
const port = process.env.PORT || 8000;
const server = createServer(app);
const io = new Server(server);
const peerServer = ExpressPeerServer(server, {
    debug: true,
});

app.use("/peerjs", peerServer);
app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.redirect(`/${v4()}`);
});
app.get("/:room", (req, res) => {
    res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).volatile.emit("user-connected", userId);
        socket.on("message", (message) => {
            io.to(roomId).emit("createMessage", message);
        });
        socket.on("disconnect", () => {
            socket.to(roomId).emit("user-disconnected", userId);
        });
    });
});

server.listen(port, () => console.log(`Listening on localhost:${port}`));
