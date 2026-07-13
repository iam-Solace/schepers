/* ============================================================
   Springstall Schepers, classic static build
   Requires (loaded via CDN in the HTML, before this file):
   gsap, ScrollTrigger, Lenis
   ============================================================ */
(function () {
  "use strict";
  var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var map = function (v, a, b, c, d) { return c + (clamp(v, a, b) - a) * (d - c) / (b - a); };

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null;
  if (!REDUCE && window.Lenis) {
    lenis = new Lenis({ duration: 1.1, easing: function (t) { return 1 - Math.pow(1 - t, 3); } });
    if (window.gsap && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- reveal on scroll ---------- */
  (function () {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.25 });
    els.forEach(function (e) { io.observe(e); });
  })();

  /* ---------- NAV: scroll state + scroll-spy ---------- */
  (function () {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var onScroll = function () {
      var past = window.scrollY > window.innerHeight * 0.7;
      header.classList.toggle("scrolled", past);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var ids = ["stallungen", "leistungen", "geschichte", "gut", "kontakt"];
    var links = document.querySelectorAll("[data-nav]");
    var setActive = function (id) {
      links.forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("data-nav") === "#" + id);
      });
    };
    var secs = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
      }, { rootMargin: "-50% 0px -50% 0px" });
      secs.forEach(function (s) { io.observe(s); });
    }
  })();

  /* ---------- mobile menu + accordion ---------- */
  (function () {
    var menu = document.getElementById("menu");
    var open = document.getElementById("menu-open");
    var close = document.getElementById("menu-close");
    if (!menu || !open) return;
    var setOpen = function (v) {
      menu.classList.toggle("open", v);
      document.documentElement.style.overflow = v ? "hidden" : "";
      if (lenis) { v ? lenis.stop() : lenis.start(); }
    };
    open.addEventListener("click", function () { setOpen(true); });
    if (close) close.addEventListener("click", function () { setOpen(false); });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    menu.querySelectorAll(".menu-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var row = btn.closest(".menu-row");
        if (row) row.classList.toggle("open");
      });
    });
  })();

  /* ---------- HERO: soft load + two-state + WebGL depth ---------- */
  (function () {
    var hero = document.querySelector(".hero");
    if (!hero) return;

    // soft load sequence
    var bg = hero.querySelector(".hero-bg");
    if (bg) requestAnimationFrame(function () { bg.classList.add("in"); });
    setTimeout(function () {
      hero.querySelectorAll(".brand .word").forEach(function (w, i) {
        setTimeout(function () { w.classList.add("in"); }, i * 500);
      });
      var hint = hero.querySelector(".brand-hint");
      if (hint) setTimeout(function () { hint.classList.add("in"); }, 1100);
      var est = hero.querySelector(".hero-est");
      if (est) est.classList.add("in");
    }, REDUCE ? 0 : 1000);

    // two-state crossfade on scroll
    var a = hero.querySelector(".hero-a");
    var b = hero.querySelector(".hero-b");
    var left = hero.querySelector(".brand-left");
    var right = hero.querySelector(".brand-right");
    var apply = function (p) {
      if (a) { a.style.opacity = map(p, 0, 0.22, 1, 0); a.style.transform = "translateY(" + map(p, 0, 0.22, 0, -40) + "px)"; }
      if (left) left.style.transform = "translateX(" + map(p, 0, 0.28, 0, -22) + "vw)";
      if (right) right.style.transform = "translateX(" + map(p, 0, 0.28, 0, 22) + "vw)";
      if (b) {
        b.style.opacity = map(p, 0.16, 0.42, 0, 1);
        b.style.transform = "translateY(" + map(p, 0.16, 0.42, 40, 0) + "px)";
        b.style.pointerEvents = p > 0.32 ? "auto" : "none";
      }
    };
    apply(0);
    if (window.ScrollTrigger) {
      ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom bottom", scrub: true, onUpdate: function (s) { apply(s.progress); } });
    }

    // WebGL depth parallax
    var canvas = hero.querySelector("canvas.depth");
    if (!REDUCE && canvas) initDepth(canvas, canvas.dataset.image, canvas.dataset.depth, 0.014);
  })();

  function initDepth(canvas, imageUrl, depthUrl, strength) {
    var gl = canvas.getContext("webgl", { antialias: true });
    if (!gl) return;
    var VERT = "attribute vec2 aPos;varying vec2 vUv;void main(){vUv=aPos*0.5+0.5;gl_Position=vec4(aPos,0.0,1.0);}";
    var FRAG = "precision highp float;varying vec2 vUv;uniform sampler2D uImage;uniform sampler2D uDepth;uniform vec2 uMouse;uniform float uCA;uniform float uIA;uniform float uS;void main(){vec2 cover=uCA>uIA?vec2(1.0,uIA/uCA):vec2(uCA/uIA,1.0);vec2 uv=(vUv-0.5)*cover*0.92+0.5;float d=texture2D(uDepth,uv).r;vec2 off=uMouse*d*uS;gl_FragColor=vec4(texture2D(uImage,uv+off).rgb,1.0);}";
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    var uMouse = gl.getUniformLocation(prog, "uMouse");
    var uCA = gl.getUniformLocation(prog, "uCA");
    var uIA = gl.getUniformLocation(prog, "uIA");
    gl.uniform1f(gl.getUniformLocation(prog, "uS"), strength);
    var imgAspect = 1, target = { x: 0, y: 0 }, cur = { x: 0, y: 0 }, raf = 0;
    function tex(img, unit) {
      var t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform1f(uCA, canvas.clientWidth / canvas.clientHeight);
    }
    function move(e) {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = -((e.clientY / window.innerHeight) * 2 - 1);
    }
    function render() {
      cur.x += (target.x - cur.x) * 0.06; cur.y += (target.y - cur.y) * 0.06;
      gl.uniform2f(uMouse, cur.x, cur.y); gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(render);
    }
    function load(url) { return new Promise(function (res, rej) { var i = new Image(); i.crossOrigin = "anonymous"; i.onload = function () { res(i); }; i.onerror = rej; i.src = url; }); }
    Promise.all([load(imageUrl), load(depthUrl)]).then(function (r) {
      imgAspect = r[0].naturalWidth / r[0].naturalHeight;
      tex(r[0], 0); tex(r[1], 1);
      gl.uniform1i(gl.getUniformLocation(prog, "uImage"), 0);
      gl.uniform1i(gl.getUniformLocation(prog, "uDepth"), 1);
      gl.uniform1f(uIA, imgAspect);
      resize();
      window.addEventListener("resize", resize);
      window.addEventListener("pointermove", move);
      canvas.classList.add("ready");
      render();
    }).catch(function () {});
  }

  /* ---------- GESCHICHTE ---------- */
  (function () {
    var sec = document.getElementById("geschichte");
    if (!sec) return;
    var imgs = sec.querySelectorAll(".gesch-image-frame img");
    var bigYear = sec.querySelector(".gesch-year-big");
    var years = sec.querySelectorAll(".gesch-year");
    var chapters = sec.querySelectorAll(".gesch-chapter");
    var setActive = function (i) {
      imgs.forEach(function (im, k) { im.classList.toggle("active", k === i); });
      years.forEach(function (y, k) { y.classList.toggle("active", k === i); });
      chapters.forEach(function (c, k) { c.classList.toggle("active", k === i); });
      if (bigYear && years[i]) bigYear.textContent = years[i].textContent;
    };
    setActive(0);
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) setActive(+e.target.getAttribute("data-index"));
        });
      }, { rootMargin: "-45% 0px -45% 0px" });
      chapters.forEach(function (c) { io.observe(c); });
    }
    // fade years out near the end so they do not bunch
    if (window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: sec, start: "top top", end: "bottom bottom", scrub: true,
        onUpdate: function (s) {
          var o = map(s.progress, 0.93, 0.995, 1, 0);
          years.forEach(function (y) { y.style.opacity = o; });
        }
      });
    }
  })();

  /* ---------- GALLERY horizontal pan ---------- */
  (function () {
    var pin = document.querySelector(".gallery-pin");
    if (!pin) return;
    var track = pin.querySelector(".gallery-track");
    if (!track) return;
    var distance = 0;
    var measure = function () {
      distance = Math.max(0, track.scrollWidth - window.innerWidth);
      pin.style.height = "calc(100dvh + " + distance + "px)";
    };
    measure();
    window.addEventListener("resize", function () { measure(); if (window.ScrollTrigger) ScrollTrigger.refresh(); });
    track.querySelectorAll("img").forEach(function (im) { if (!im.complete) im.addEventListener("load", function () { measure(); if (window.ScrollTrigger) ScrollTrigger.refresh(); }, { once: true }); });
    if (REDUCE) return;
    if (window.gsap && window.ScrollTrigger) {
      gsap.to(track, {
        x: function () { return -distance; }, ease: "none",
        scrollTrigger: { trigger: pin, start: "top top", end: "bottom bottom", scrub: 0.4, invalidateOnRefresh: true }
      });
    }
  })();

  /* ---------- subtle scroll parallax for marked images ---------- */
  (function () {
    if (REDUCE || !window.gsap || !window.ScrollTrigger) return;
    document.querySelectorAll("[data-parallax] img").forEach(function (img) {
      gsap.fromTo(img, { yPercent: -8, scale: 1.16 }, {
        yPercent: 8, scale: 1.16, ease: "none",
        scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true }
      });
    });
  })();

  /* ---------- custom cursor (desktop / fine-pointer only) ---------- */
  (function () {
    if (!window.matchMedia || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var dot = document.createElement("div"); dot.className = "cursor-dot cursor-hidden";
    var ring = document.createElement("div"); ring.className = "cursor-ring cursor-hidden";
    document.body.appendChild(dot); document.body.appendChild(ring);
    document.documentElement.classList.add("has-cursor");

    var mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
    var INTERACTIVE = "a,button,input,textarea,select,label,[data-cursor],.kurs-row,.gallery-card,.other-card";
    var hide = function () { dot.classList.add("cursor-hidden"); ring.classList.add("cursor-hidden"); };
    var show = function () { dot.classList.remove("cursor-hidden"); ring.classList.remove("cursor-hidden"); };

    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
      show();
    }, { passive: true });

    document.addEventListener("mouseover", function (e) {
      ring.classList.toggle("hover", !!(e.target.closest && e.target.closest(INTERACTIVE)));
    });
    // hide whenever the pointer leaves the viewport / window loses focus
    document.addEventListener("mouseout", function (e) { if (!e.relatedTarget) hide(); });
    window.addEventListener("blur", hide);
    if (document.documentElement) document.documentElement.addEventListener("mouseleave", hide);

    (function raf() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(raf);
    })();
  })();
})();


