import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgrPlugin from "vite-plugin-svgr";
import checker from "vite-plugin-checker";
import {VitePWA} from "vite-plugin-pwa";

const manifestForPlugIn = {
  registerType:"prompt",
  manifest:{
    name:"FKMTime",
    short_name:"FKMTime",
    description:"I am a simple vite app",
    theme_color:'#2D3748',
    background_color:'#2D3748',
    display:"standalone",
    scope:'/',
    start_url:"/",
    orientation:'portrait'
  }
};

export default defineConfig({
  plugins: [
    react(),
    checker({
      overlay: { initialIsOpen: false },
      typescript: true,
      eslint: {
        lintCommand: "eslint --ext .js,.jsx,.ts,.tsx src",
      },
    }),
    viteTsconfigPaths(),
    svgrPlugin(),
    //eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    VitePWA(manifestForPlugIn),
  ],
});
