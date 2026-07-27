(function () {
  var canvas = document.querySelector(".digital-wave");
  if (!canvas || !canvas.getContext) return;

  var context = canvas.getContext("2d", {
    alpha: true,
    desynchronized: true
  });
  var darkMode = window.matchMedia("(prefers-color-scheme: dark)");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var width = 0;
  var height = 0;
  var pixelRatio = 1;
  var animationFrame = null;
  var lastFrame = 0;
  var startTime = performance.now();
  var frameInterval = 1000 / 24;

  function palette() {
    return darkMode.matches
      ? {
          primary: "222, 226, 231",
          secondary: "155, 162, 171"
        }
      : {
          primary: "45, 52, 61",
          secondary: "91, 99, 110"
        };
  }

  function compactViewport() {
    return width < 720 || height < 560;
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    pixelRatio = Math.min(
      window.devicePixelRatio || 1,
      compactViewport() ? 1.1 : 1.25
    );
    frameInterval = 1000 / (compactViewport() ? 20 : 24);

    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    if (reducedMotion.matches || document.hidden) draw(0);
  }

  function waveY(bundle, strand, progress, elapsed) {
    var mobile = compactViewport();
    var motion = reducedMotion.matches ? 0 : elapsed;
    var strandOffset = strand - (bundle.strands - 1) * 0.5;
    var base = height * (mobile ? bundle.mobileY : bundle.desktopY);
    var envelope = 0.38 + Math.sin(progress * Math.PI) * 0.62;
    var primary =
      Math.sin(
        progress * Math.PI * 2 * bundle.cycles +
          motion * bundle.speed +
          bundle.phase +
          strandOffset * bundle.phaseSpacing
      ) *
      bundle.amplitude *
      envelope;
    var secondary =
      Math.sin(
        progress * Math.PI * 2 * bundle.secondaryCycles -
          motion * bundle.speed * 0.46 +
          bundle.phase * 1.7
      ) *
      bundle.secondaryAmplitude;
    var ribbon =
      strandOffset *
      bundle.spacing *
      Math.cos(
        progress * Math.PI * 2 * bundle.ribbonCycles +
          motion * bundle.speed * 0.28 +
          bundle.phase
      );

    return base + primary + secondary + ribbon;
  }

  function drawBundle(bundle, colors, elapsed) {
    var segments = compactViewport()
      ? 30
      : Math.min(58, Math.max(42, Math.round(width / 28)));

    for (var strand = 0; strand < bundle.strands; strand += 1) {
      var strandProgress = strand / Math.max(1, bundle.strands - 1);
      var alpha =
        bundle.alpha *
        (0.58 + Math.sin(strandProgress * Math.PI) * 0.42);
      var color = bundle.secondary ? colors.secondary : colors.primary;

      context.beginPath();

      for (var segment = 0; segment <= segments; segment += 1) {
        var progress = segment / segments;
        var x = progress * (width + 40) - 20;
        var y = waveY(bundle, strand, progress, elapsed);

        if (segment === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }

      context.strokeStyle = "rgba(" + color + ", " + alpha + ")";
      context.lineWidth =
        bundle.lineWidth +
        Math.sin(strandProgress * Math.PI) * bundle.lineWidthVariation;
      context.stroke();
    }
  }

  function draw(elapsed) {
    var colors = palette();
    var mobile = compactViewport();
    var bundles = [
      {
        desktopY: 0.76,
        mobileY: 0.83,
        strands: mobile ? 10 : 16,
        amplitude: mobile ? 46 : 82,
        secondaryAmplitude: mobile ? 12 : 22,
        cycles: 1.32,
        secondaryCycles: 2.25,
        ribbonCycles: 1.08,
        speed: 0.00046,
        phase: 0.2,
        phaseSpacing: 0.055,
        spacing: mobile ? 2.6 : 3.8,
        alpha: 0.3,
        lineWidth: 0.6,
        lineWidthVariation: 0.35,
        secondary: false
      },
      {
        desktopY: 0.82,
        mobileY: 0.88,
        strands: mobile ? 8 : 12,
        amplitude: mobile ? 34 : 62,
        secondaryAmplitude: mobile ? 15 : 27,
        cycles: 1.72,
        secondaryCycles: 1.18,
        ribbonCycles: 1.45,
        speed: -0.00036,
        phase: 2.25,
        phaseSpacing: 0.07,
        spacing: mobile ? 2.2 : 3.2,
        alpha: 0.18,
        lineWidth: 0.5,
        lineWidthVariation: 0.25,
        secondary: true
      },
      {
        desktopY: 0.9,
        mobileY: 0.95,
        strands: mobile ? 6 : 9,
        amplitude: mobile ? 26 : 44,
        secondaryAmplitude: mobile ? 8 : 16,
        cycles: 1.1,
        secondaryCycles: 1.86,
        ribbonCycles: 0.82,
        speed: 0.0003,
        phase: 4.1,
        phaseSpacing: 0.08,
        spacing: mobile ? 2.5 : 3.5,
        alpha: 0.1,
        lineWidth: 0.45,
        lineWidthVariation: 0.2,
        secondary: true
      }
    ];

    context.clearRect(0, 0, width, height);
    context.lineCap = "round";
    context.lineJoin = "round";

    for (var bundle = 0; bundle < bundles.length; bundle += 1) {
      drawBundle(bundles[bundle], colors, elapsed);
    }
  }

  function animate(timestamp) {
    animationFrame = requestAnimationFrame(animate);

    if (timestamp - lastFrame < frameInterval) return;
    lastFrame = timestamp;
    draw(timestamp - startTime);
  }

  function updateAnimation() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    if (reducedMotion.matches || document.hidden) {
      draw(0);
    } else {
      startTime = performance.now();
      animationFrame = requestAnimationFrame(animate);
    }
  }

  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", updateAnimation);
  darkMode.addEventListener("change", function () {
    if (reducedMotion.matches || document.hidden) draw(0);
  });
  reducedMotion.addEventListener("change", updateAnimation);
  window.addEventListener("beforeunload", function () {
    if (animationFrame) cancelAnimationFrame(animationFrame);
  });

  resize();
  updateAnimation();
})();
