/* ==========================================================================
   Miles After Five — pace calculator
   Vanilla JavaScript, no dependencies, works offline.
   Formula: pace per mile = total running time in minutes / distance in miles
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------------
     Pure logic (no DOM) — easy to test and edit
     ---------------------------------------------------------------------- */

  var MIN_REALISTIC_PACE_SECONDS = 60; // anything faster than 1:00/mile is almost surely a typo

  /** Turns a raw input string into a number, or null if blank, or NaN if invalid. */
  function toNumber(raw) {
    if (raw === null || raw === undefined) return null;
    var text = String(raw).trim();
    if (text === "") return null;
    return Number(text);
  }

  function isWholeNumber(n) {
    return typeof n === "number" && isFinite(n) && Math.floor(n) === n;
  }

  /**
   * Validates the three inputs.
   * Returns { valid, errors: [{ field, message }], distance, minutes, seconds }.
   */
  function validateInputs(distanceRaw, minutesRaw, secondsRaw) {
    var errors = [];
    var distance = toNumber(distanceRaw);
    var minutes = toNumber(minutesRaw);
    var seconds = toNumber(secondsRaw);

    // Distance
    if (distance === null) {
      errors.push({ field: "distance", message: "Enter the distance you covered, in miles." });
    } else if (!isFinite(distance)) {
      errors.push({ field: "distance", message: "Distance must be a number, like 3 or 3.1." });
    } else if (distance <= 0) {
      errors.push({ field: "distance", message: "Distance needs to be greater than zero." });
    }

    // Time
    if (minutes === null && seconds === null) {
      errors.push({ field: "minutes", message: "Enter your running time in minutes and seconds." });
    } else {
      if (minutes !== null && (!isWholeNumber(minutes) || minutes < 0)) {
        errors.push({ field: "minutes", message: "Minutes must be a whole number, 0 or higher." });
      }
      if (seconds !== null && (!isWholeNumber(seconds) || seconds < 0 || seconds > 59)) {
        errors.push({ field: "seconds", message: "Seconds must be a whole number from 0 to 59." });
      }
    }

    // Only check the total once each time field is individually fine
    if (errors.length === 0) {
      var totalSeconds = (minutes || 0) * 60 + (seconds || 0);
      if (totalSeconds <= 0) {
        errors.push({ field: "minutes", message: "Your time needs to be greater than zero." });
      } else if (Math.round(totalSeconds / distance) < MIN_REALISTIC_PACE_SECONDS) {
        errors.push({
          field: "distance",
          message: "That pace looks faster than a mile a minute. Double-check your distance and time."
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      distance: distance,
      minutes: minutes || 0,
      seconds: seconds || 0
    };
  }

  /** Returns the pace per mile, rounded to the nearest second. */
  function calculatePace(distance, minutes, seconds) {
    var totalSeconds = minutes * 60 + seconds;
    var paceSeconds = Math.round(totalSeconds / distance); // same as (minutes / distance) * 60
    return {
      totalSeconds: totalSeconds,
      paceSeconds: paceSeconds,
      paceMinutesPart: Math.floor(paceSeconds / 60),
      paceSecondsPart: paceSeconds % 60
    };
  }

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  /** Formats whole seconds as MM:SS. */
  function formatMMSS(totalSeconds) {
    return pad2(Math.floor(totalSeconds / 60)) + ":" + pad2(totalSeconds % 60);
  }

  /** Formats a total time as MM:SS, or H:MM:SS for an hour or more. */
  function formatTotalTime(totalSeconds) {
    if (totalSeconds >= 3600) {
      var h = Math.floor(totalSeconds / 3600);
      var rest = totalSeconds % 3600;
      return h + ":" + formatMMSS(rest);
    }
    return formatMMSS(totalSeconds);
  }

  function formatDistance(distance) {
    var rounded = Number(distance.toFixed(2));
    return rounded + (rounded === 1 ? " mile" : " miles");
  }

  var ENCOURAGEMENTS = [
    "Nice work! Every mile counts.",
    "You showed up, and that is the win.",
    "Great job getting out there. Better evenings start like this.",
    "Consistency beats speed every time. Keep it up!",
    "Love that for you. Clock out, lace up, repeat."
  ];

  // Exposed for testing in Node (ignored in the browser)
  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      validateInputs: validateInputs,
      calculatePace: calculatePace,
      formatMMSS: formatMMSS,
      formatTotalTime: formatTotalTime,
      formatDistance: formatDistance
    };
  }

  /* ------------------------------------------------------------------------
     Page wiring (browser only)
     ---------------------------------------------------------------------- */

  if (typeof document === "undefined") return;

  var form = document.getElementById("pace-form");
  if (!form) return;

  var fields = {
    distance: document.getElementById("distance"),
    minutes: document.getElementById("minutes"),
    seconds: document.getElementById("seconds")
  };
  var errorBox = document.getElementById("error-box");
  var errorList = document.getElementById("error-list");
  var resultBox = document.getElementById("result");
  var resultPace = document.getElementById("result-pace");
  var resultSummary = document.getElementById("result-summary");
  var resultMessage = document.getElementById("result-message");
  var resetBtn = document.getElementById("reset-btn");
  var messageIndex = 0;

  /* ------------------------------------------------------------------------
     Confetti celebration (canvas, no libraries, brand colors only)
     ---------------------------------------------------------------------- */

  var confettiCanvas = document.getElementById("confetti");
  var confettiFrame = null;
  var CONFETTI_COLORS = ["#F4A261", "#A8DADC", "#FFFFFF", "#FAD0A8", "#7FC4C8"];
  var CONFETTI_COUNT = 110;
  var CONFETTI_MS = 2800;

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function stopConfetti() {
    if (confettiFrame !== null) {
      cancelAnimationFrame(confettiFrame);
      confettiFrame = null;
    }
    if (confettiCanvas) {
      var ctx = confettiCanvas.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  function launchConfetti() {
    stopConfetti();
    if (!confettiCanvas || prefersReducedMotion()) return; // respect the visitor's motion setting

    var box = resultBox.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var w = box.width;
    var h = box.height;
    confettiCanvas.width = Math.round(w * dpr);
    confettiCanvas.height = Math.round(h * dpr);
    var ctx = confettiCanvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Burst from the top-middle of the box, fanning out and falling with gravity
    var pieces = [];
    for (var i = 0; i < CONFETTI_COUNT; i++) {
      var angle = Math.PI * (0.15 + Math.random() * 0.7); // downward fan
      var speed = 3 + Math.random() * 6;
      pieces.push({
        x: w / 2 + (Math.random() - 0.5) * w * 0.3,
        y: h * 0.12,
        vx: Math.cos(angle) * speed * (Math.random() < 0.5 ? -1 : 1),
        vy: -2 - Math.random() * 4,
        size: 6 + Math.random() * 6,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.35,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: Math.random() < 0.25
      });
    }

    var start = null;
    function frame(now) {
      if (start === null) start = now;
      var elapsed = now - start;
      var fade = elapsed > CONFETTI_MS * 0.6
        ? Math.max(0, 1 - (elapsed - CONFETTI_MS * 0.6) / (CONFETTI_MS * 0.4))
        : 1;

      ctx.clearRect(0, 0, w, h);
      for (var j = 0; j < pieces.length; j++) {
        var p = pieces[j];
        p.vy += 0.16;   // gravity
        p.vx *= 0.99;   // a little air drag
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;

        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.restore();
      }

      if (elapsed < CONFETTI_MS) {
        confettiFrame = requestAnimationFrame(frame);
      } else {
        stopConfetti();
      }
    }
    confettiFrame = requestAnimationFrame(frame);
  }

  /** Reads an input; a non-numeric entry (which browsers report as empty) becomes "invalid". */
  function readField(input) {
    return input.validity && input.validity.badInput ? "invalid" : input.value;
  }

  function clearErrors() {
    errorList.innerHTML = "";
    errorBox.hidden = true;
    Object.keys(fields).forEach(function (key) {
      fields[key].removeAttribute("aria-invalid");
    });
  }

  function hideResult() {
    stopConfetti();
    resultBox.hidden = true;
    resultPace.textContent = "00:00";
    resultSummary.textContent = "";
    resultMessage.textContent = "";
  }

  function showErrors(errors) {
    clearErrors();
    errors.forEach(function (err) {
      var li = document.createElement("li");
      li.textContent = err.message;
      errorList.appendChild(li);
      fields[err.field].setAttribute("aria-invalid", "true");
    });
    errorBox.hidden = false;
    fields[errors[0].field].focus();
  }

  function showResult(distance, pace) {
    resultPace.textContent = formatMMSS(pace.paceSeconds);
    resultSummary.textContent =
      formatDistance(distance) + " in " + formatTotalTime(pace.totalSeconds);
    resultMessage.textContent = ENCOURAGEMENTS[messageIndex % ENCOURAGEMENTS.length];
    messageIndex += 1;
    resultBox.hidden = false;
    resultBox.focus();
    launchConfetti(); // celebrate once the box is visible so it can be measured
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var check = validateInputs(
      readField(fields.distance),
      readField(fields.minutes),
      readField(fields.seconds)
    );

    if (!check.valid) {
      hideResult(); // never show a result for invalid input
      showErrors(check.errors);
      return;
    }

    clearErrors();
    showResult(check.distance, calculatePace(check.distance, check.minutes, check.seconds));
  });

  resetBtn.addEventListener("click", function () {
    form.reset();
    clearErrors();
    hideResult();
    fields.distance.focus();
  });
})();
