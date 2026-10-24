import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vervue AI — Better interviews. Clearer insights.",
    short_name: "Vervue AI",
    description:
      "Conduct structured video interviews and review AI-assisted insights in one clear workspace.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f8fc",
    theme_color: "#5b4cf4",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
