/* ==========================================================
   Sweets Catalog renderer
   Put <div id="catalog"></div> on the page, then load
   references.js followed by this file.
   ========================================================== */
(function () {
  var data = window.CBR_CATALOG;
  var root = document.getElementById("catalog");
  if (!data || !root) return;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var byCode = {};

  function card(item) {
    byCode[item.code] = item;
    return (
      '<article class="cat-card">' +
        '<div class="cat-img-wrap">' +
          '<img src="' + esc(item.image) + '" alt="' + esc(item.title) + '" loading="lazy" ' +
          'onerror="this.parentNode.classList.add(\'cat-noimg\');this.remove();">' +
          (item.limited ? '<span class="cat-badge">Limited time</span>' : "") +
        "</div>" +
        '<div class="cat-body">' +
          "<h4>" + esc(item.title) + "</h4>" +
          '<p class="cat-notes">' + esc(item.notes) + "</p>" +
          '<div class="cat-foot">' +
            '<span class="cat-code">' + esc(item.code) + "</span>" +
            '<button type="button" class="cat-more" data-code="' + esc(item.code) + '">MORE INFO</button>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function grid(items) {
    var visible = (items || []).filter(function (i) { return !i.hidden; });
    if (!visible.length) return '<p class="cat-empty">Nothing this month — check back soon!</p>';
    return '<div class="cat-grid">' + visible.map(card).join("") + "</div>";
  }

  var html =
    '<header class="cat-header">' +
      "<h2>Sweets Catalog</h2>" +
      '<p class="cat-month">' + esc(data.month) + " assortment</p>" +
      "<p>Window shop our assortment, updated monthly with limited-time desserts. " +
      "Click <strong>MORE INFO</strong> on any dessert for size options and ingredients.</p>" +
    "</header>";

  // Category jump links
  html += '<nav class="cat-nav">' + data.categories.map(function (c) {
    return '<a href="#cat-' + esc(c.id) + '">' + esc(c.title) + "</a>";
  }).join("") + "</nav>";

  data.categories.forEach(function (cat) {
    html += '<section class="cat-section" id="cat-' + esc(cat.id) + '"><h3>' + esc(cat.title) + "</h3>";
    if (cat.subsections) {
      cat.subsections.forEach(function (sub) {
        html += '<div class="cat-sub" id="cat-' + esc(cat.id) + "-" + esc(sub.id) + '">' +
                "<h4 class=\"cat-sub-title\">" + esc(sub.title) + "</h4>" + grid(sub.items) + "</div>";
      });
    } else {
      html += grid(cat.items);
    }
    html += "</section>";
  });

  // MORE INFO popup
  html +=
    '<dialog class="cat-dialog" id="cat-dialog">' +
      '<button type="button" class="cat-close" aria-label="Close">&times;</button>' +
      '<div id="cat-dialog-body"></div>' +
    "</dialog>";

  root.innerHTML = html;

  var dialog = document.getElementById("cat-dialog");
  var body = document.getElementById("cat-dialog-body");

  function list(items) {
    return items && items.length
      ? "<ul>" + items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>"
      : "<p>Ask us!</p>";
  }

  function openInfo(code) {
    var item = byCode[code];
    if (!item) return;
    body.innerHTML =
      '<img class="cat-dialog-img" src="' + esc(item.image) + '" alt="' + esc(item.title) + '" onerror="this.remove()">' +
      "<h3>" + esc(item.title) + "</h3>" +
      (item.limited ? '<span class="cat-badge cat-badge-inline">Limited time</span>' : "") +
      '<p class="cat-notes">' + esc(item.notes) + "</p>" +
      "<h4>Size options</h4>" + list(item.sizes) +
      "<h4>Ingredients</h4>" + list(item.ingredients) +
      (item.allergens && item.allergens.length
        ? '<p class="cat-allergens"><strong>Contains:</strong> ' + item.allergens.map(esc).join(", ") + "</p>"
        : "") +
      '<p class="cat-ordercode">Mention code <strong>' + esc(item.code) + "</strong> on your order form.</p>" +
      '<button type="button" class="cat-copy" data-code="' + esc(item.code) + '">Copy code</button>';
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open", "");
  }

  function closeInfo() {
    if (dialog.close) dialog.close(); else dialog.removeAttribute("open");
  }

  root.addEventListener("click", function (e) {
    var more = e.target.closest(".cat-more");
    if (more) return openInfo(more.getAttribute("data-code"));

    if (e.target.closest(".cat-close") || e.target === dialog) return closeInfo();

    var copy = e.target.closest(".cat-copy");
    if (copy) {
      var code = copy.getAttribute("data-code");
      var done = function () { copy.textContent = "Copied!"; };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(done, function () { copy.textContent = code; });
      } else {
        copy.textContent = code;
      }
    }
  });
})();
