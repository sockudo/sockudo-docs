import DefaultTheme from "vitepress/theme";
import { onMounted } from "vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  setup() {
    onMounted(() => {
      // Google Tag Manager (noscript)
      const noscript = document.createElement("noscript");
      const iframe = document.createElement("iframe");
      iframe.src = "https://www.googletagmanager.com/ns.html?id=GTM-TKXKMXDD";
      iframe.height = "0";
      iframe.width = "0";
      iframe.style.display = "none";
      iframe.style.visibility = "hidden";
      noscript.appendChild(iframe);
      document.body.insertBefore(noscript, document.body.firstChild);
    });
  },
};
