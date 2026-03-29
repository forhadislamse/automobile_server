import { Server } from "http";
import config from "./config";
import os from "os"; // ✅ add this
import app from "./app";
import { initiateSuperAdmin } from "./app/db/db";

// helper function to get local network IP (LAN/Public IP)
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address; // e.g. 192.168.x.x or your ISP public IP
      }
    }
  }
  return "127.0.0.1";
}

let server: Server;

async function startServer() {
  const localIp = getLocalIp();

  server = app.listen(config.port, () => {
    console.log(
      `Server is listening on port  http://localhost:${config.port}/api/v1`
    );
    console.log(
      `Server is listening on port  http://${localIp}:${config.port}/api/v1`
    );
    
  });

}


async function main() {
  await startServer();
  initiateSuperAdmin();
  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.info("Server closed!");
        restartServer();
      });
    } else {
      process.exit(1);
    }
  };

  const restartServer = () => {
    console.info("Restarting server...");
    main();
    initiateSuperAdmin();
  };

  process.on("uncaughtException", (error) => {
    console.log("Uncaught Exception: ", error);
    exitHandler();
  });

  process.on("unhandledRejection", (error) => {
    console.log("Unhandled Rejection: ", error);
    exitHandler();
  });

  // Handling the server shutdown with SIGTERM and SIGINT
  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received. Shutting down gracefully...");
    exitHandler();
  });

  process.on("SIGINT", () => {
    console.log("SIGINT signal received. Shutting down gracefully...");
    exitHandler();
  });
}

main();
