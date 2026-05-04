import Fastify from "fastify";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true, service: "dexdraw-vnext" }));

app.listen({ port: Number(process.env.PORT ?? 3000), host: "0.0.0.0" }).catch((error) => {
  app.log.error(error);
  process.exit(1);
});
