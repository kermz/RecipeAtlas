import { GlobalRegistrator } from "@happy-dom/global-registrator";

GlobalRegistrator.register({
  url: "http://localhost/recipes"
});

process.env.VITE_CONVEX_URL ??= "https://demo.convex.cloud";
