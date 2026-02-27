import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/test",
  method: "GET",
  handler: httpAction(async () => {
    return new Response("OK");
  }),
});

export default http;
