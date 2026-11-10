// ClientDesk support widget loader.
//
// Drop this on any page with:
//   <script src="https://YOUR-APP-URL/widget.js" data-base="https://YOUR-APP-URL"></script>
// It adds a floating "Support" button that opens the chat in an
// iframe. No build step, no framework — plain script on purpose, so
// it works on any page, including the ClientDesk site.
(function () {
  var script = document.currentScript;
  var base = (script && script.getAttribute("data-base")) || "";
  var open = false;
  var frame = null;

  // On narrow screens the host page shows a fixed bottom nav that is
  // 64px tall. The button and the chat panel sit above it with a
  // 12px gap, so they never cover a nav item. The gap also grows
  // with the phone's safe area, so the button clears the home
  // indicator on notched phones. Desktop keeps the old offsets.
  var narrow = window.matchMedia("(max-width: 760px)");

  function place() {
    var safe = "env(safe-area-inset-bottom, 0px)";
    button.style.bottom = narrow.matches
      ? "calc(76px + " + safe + ")"
      : "16px";
    if (frame) {
      frame.style.bottom = narrow.matches
        ? "calc(132px + " + safe + ")"
        : "72px";
      // The panel must also fit above the nav: on a short phone the
      // old 560px height would poke past the top of the screen.
      frame.style.height = narrow.matches
        ? "min(560px, calc(100vh - 156px))"
        : "min(560px, calc(100vh - 96px))";
    }
  }

  var button = document.createElement("button");
  button.textContent = "Support";
  button.setAttribute("aria-label", "Open ClientDesk support chat");
  button.style.cssText =
    "position:fixed;right:16px;bottom:16px;z-index:9999;" +
    "background:#18181b;color:#fff;border:0;border-radius:999px;" +
    "padding:10px 18px;font-size:14px;font-family:sans-serif;cursor:pointer;" +
    "box-shadow:0 4px 16px rgba(0,0,0,0.25);";

  button.addEventListener("click", function () {
    open = !open;
    button.textContent = open ? "Close" : "Support";
    if (open) {
      frame = document.createElement("iframe");
      frame.src = base + "/chat?embed=1";
      frame.title = "ClientDesk support chat";
      frame.style.cssText =
        "position:fixed;right:16px;bottom:72px;z-index:9999;" +
        "width:min(380px,calc(100vw - 32px));height:min(560px,calc(100vh - 96px));" +
        "border:1px solid #e4e4e7;border-radius:16px;background:#fff;" +
        "box-shadow:0 8px 32px rgba(0,0,0,0.2);";
      document.body.appendChild(frame);
      place();
    } else if (frame) {
      frame.remove();
      frame = null;
    }
  });

  // Keep the offsets right if the window is resized across the
  // breakpoint (phone rotated, desktop window narrowed).
  if (narrow.addEventListener) {
    narrow.addEventListener("change", place);
  } else if (narrow.addListener) {
    narrow.addListener(place);
  }

  document.body.appendChild(button);
  place();
})();
