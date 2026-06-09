(function () {
  var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(){}[]<>.,;:";
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var targets = document.querySelectorAll(".scramble-text");

  if (!targets.length) return;

  targets.forEach(function (target) {
    var phrases = [];

    try {
      phrases = target.dataset.texts ? JSON.parse(target.dataset.texts) : [];
    } catch (error) {
      phrases = [];
    }

    if (!phrases.length) phrases = [target.dataset.text || target.textContent || ""];
    phrases = phrases.map(function (phrase) {
      return String(phrase);
    });

    if (prefersReducedMotion) {
      target.textContent = phrases[0];
      return;
    }

    var frameId = null;
    var restartId = null;
    var phraseIndex = 0;

    function randomChar() {
      return alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    function run() {
      var finalText = phrases[phraseIndex];
      var progress = 0;
      target.classList.remove("is-glitch");
      target.classList.add("is-scrambling");

      function tick() {
        var resolved = Math.floor(progress);

        target.textContent = Array.from(finalText, function (char, index) {
          if (char === " ") return " ";
          return index < resolved ? char : randomChar();
        }).join("");

        progress += 0.55;

        if (progress <= finalText.length) {
          frameId = requestAnimationFrame(tick);
          return;
        }

        cancelAnimationFrame(frameId);
        frameId = null;
        target.textContent = finalText;
        target.classList.remove("is-scrambling");
        target.classList.add("is-glitch");
        window.setTimeout(function () {
          target.classList.remove("is-glitch");
        }, 620);
        phraseIndex = (phraseIndex + 1) % phrases.length;
        restartId = window.setTimeout(run, 2200);
      }

      frameId = requestAnimationFrame(tick);
    }

    run();

    window.addEventListener("beforeunload", function () {
      if (frameId) cancelAnimationFrame(frameId);
      if (restartId) window.clearTimeout(restartId);
    });
  });
})();
