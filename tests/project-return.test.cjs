const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const dist = path.join(__dirname, "../dist");
const script = fs.readFileSync(path.join(dist, "assets/js/site.js"), "utf8");
const carouselScript = script.slice(script.indexOf("const projectPositionKey"), script.indexOf("function setupGalleryCarousel"));
const key = "portfolio-selected-project";

function page({ saved, blocked = false, detail = false } = {}) {
  const storage = new Map(saved ? [[key, saved]] : []);
  const events = {};
  const cards = ["auw-cloud-mist", "mengniu-breakfast-zoo", "sanx-popup"].map((slug, index) => ({
    href: `https://portfolio.test/work/${slug}/index.html`,
    offsetLeft: index * 100, offsetWidth: 80,
    classList: { toggle() {} },
    setAttribute(name, value) { this[name] = value; },
    removeAttribute(name) { delete this[name]; },
    addEventListener(name, callback) { this[name] = callback; },
  }));
  const track = {
    clientWidth: 100,
    querySelectorAll: () => cards,
    scrollTo(options) { this.lastScroll = options; },
    addEventListener() {},
  };
  const control = { addEventListener() {} };
  const carousel = {
    querySelector: (selector) => selector === "[data-project-track]" ? track : control,
    querySelectorAll: () => [], addEventListener() {}, contains: () => false,
  };
  const document = {
    hidden: false, addEventListener() {},
    querySelector: (selector) => selector === ".case-back-button" ? detail : detail ? null : carousel,
  };
  const window = {
    location: { pathname: "/work/sanx-popup/index.html" },
    sessionStorage: {
      getItem(name) { if (blocked) throw Error("blocked"); return storage.get(name) ?? null; },
      setItem(name, value) { if (blocked) throw Error("blocked"); storage.set(name, value); },
    },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    setTimeout() {}, clearTimeout() {}, cancelAnimationFrame() {},
    requestAnimationFrame(callback) { callback(); },
    addEventListener(name, callback) { events[name] = callback; },
  };
  vm.runInNewContext(carouselScript, { document, window, URL });
  return { storage, cards, track, events };
}

const restored = page({ saved: "/work/mengniu-breakfast-zoo/index.html" });
assert.equal(restored.cards[1]["aria-current"], "true");
assert.equal(restored.track.lastScroll.left, 90);
assert.equal(restored.track.lastScroll.behavior, "instant");
let prevented = false;
restored.cards[2].click({ preventDefault() { prevented = true; } });
assert.equal(prevented, true, "Clicking a side card still selects it first");
restored.cards[2].click({ preventDefault() { throw Error("Active card must navigate"); } });
assert.equal(restored.storage.get(key), "/work/sanx-popup/index.html");
restored.storage.set(key, "/work/auw-cloud-mist/index.html");
restored.events.pageshow({ persisted: true });
assert.equal(restored.cards[0]["aria-current"], "true");
restored.storage.set(key, "/work/sanx-popup/index.html");
restored.events.pageshow({ persisted: false });
assert.equal(restored.cards[2]["aria-current"], "true");
for (const options of [{}, { saved: "/not-a-project" }, { blocked: true }]) {
  assert.equal(page(options).cards[0]["aria-current"], "true");
}
assert.equal(page({ detail: true }).storage.get(key), "/work/sanx-popup/index.html");
assert.doesNotThrow(() => page({ detail: true, blocked: true }));
assert.match(fs.readFileSync(path.join(dist, "about/index.html"), "utf8"), /role="status" aria-live="polite" data-toast/);

async function checkCopy({ clipboardBlocked = false, fallback = true } = {}) {
  let click;
  let copied;
  let removed = false;
  const toast = { classList: { add() {}, remove() {} } };
  const button = { dataset: { copy: "double_teeee" }, addEventListener(name, callback) { click = callback; } };
  const document = {
    querySelector: () => toast,
    querySelectorAll: () => [button],
    body: { append() {} },
    createElement: () => ({ setAttribute() {}, select() {}, remove() { removed = true; } }),
    execCommand: () => { if (fallback === "throws") throw Error("denied"); return fallback; },
  };
  vm.runInNewContext(script.slice(script.indexOf("const toast ="), script.indexOf("const lightbox =")), {
    document,
    window: { clearTimeout() {}, setTimeout() {} },
    navigator: { clipboard: { async writeText(value) { if (clipboardBlocked) throw Error("denied"); copied = value; } } },
  });
  await click();
  assert.equal(toast.textContent, !clipboardBlocked || fallback === true ? "微信号已复制" : "复制失败，请手动复制微信号");
  if (!clipboardBlocked) assert.equal(copied, "double_teeee");
  else assert.equal(removed, true);
}

(async () => {
  await checkCopy();
  for (const fallback of [true, false, "throws"]) await checkCopy({ clipboardBlocked: true, fallback });
  console.log("PASS: carousel restore, side-card selection, active-card navigation, back cache, blocked storage, and copy success/failure feedback");
})().catch((error) => { console.error(error); process.exitCode = 1; });
