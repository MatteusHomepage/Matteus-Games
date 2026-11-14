(() => {
  const base = document.currentScript.src.replace(/theme\.js.*$/, "");
  window.MG_BASE = base;
  document.write(
    `<script src="${base}themes.js"><\/script><script src="${base}engine.js"><\/script>`,
  );
})();
