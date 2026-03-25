import { createApp } from "./app";
import { env } from "./lib/env";

const app = createApp();

app.listen({ host: env.HOST, port: env.PORT }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
