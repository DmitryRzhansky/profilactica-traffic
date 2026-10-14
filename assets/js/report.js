(function () {
  "use strict";

  var D = window.GSC_REPORT;
  if (!D || typeof Chart === "undefined") return;

  var COLORS = {
    services: "#1a7fc4",
    other: "#7a8792",
    zero: "#5a6570",
    withClicks: "#1a7fc4",
    low: "#9a6b16",
    rest: "#cdd6df",
    line: "#1a7fc4",
    ma: "#0f5f9a",
    grid: "#e3e9ef",
    text: "#5a6570"
  };

  var HOST = "https://profilactica.clinic";

  function fmtInt(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  }

  function fmtDate(iso) {
    var p = iso.split("-");
    return p[2] + "." + p[1];
  }

  Chart.defaults.font.family = "Inter, Arial, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = COLORS.text;
  Chart.defaults.plugins.legend.labels.boxWidth = 12;
  Chart.defaults.plugins.legend.labels.boxHeight = 12;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 4;
  Chart.defaults.plugins.tooltip.titleFont = { weight: "600" };

  function tooltipRu() {
    return {
      callbacks: {
        label: function (ctx) {
          var v = ctx.raw;
          var label = ctx.dataset.label ? ctx.dataset.label + ": " : "";
          if (typeof v === "number") {
            if (ctx.chart.options._isPercent) {
              return label + v.toFixed(1).replace(".", ",") + "%";
            }
            return label + fmtInt(v);
          }
          return label + v;
        }
      }
    };
  }

  /* —— 2. Balance 100% stacked —— */
  (function () {
    var el = document.getElementById("chartBalance");
    if (!el) return;
    var chart = new Chart(el, {
      type: "bar",
      data: {
        labels: ["Доля URL", "Доля кликов"],
        datasets: [
          {
            label: "Страницы услуг",
            data: [D.balance.urlShare.services, D.balance.clickShare.services],
            backgroundColor: COLORS.services,
            borderWidth: 0,
            barThickness: 36
          },
          {
            label: "Остальные страницы",
            data: [D.balance.urlShare.other, D.balance.clickShare.other],
            backgroundColor: COLORS.other,
            borderWidth: 0,
            barThickness: 36
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        _isPercent: true,
        scales: {
          x: {
            stacked: true,
            max: 100,
            ticks: {
              callback: function (v) {
                return v + "%";
              }
            },
            grid: { color: COLORS.grid }
          },
          y: {
            stacked: true,
            grid: { display: false }
          }
        },
        plugins: {
          legend: { position: "bottom" },
          tooltip: tooltipRu(),
          datalabels: false
        }
      },
      plugins: [
        {
          id: "barEndLabels",
          afterDatasetsDraw: function (chart) {
            var ctx = chart.ctx;
            ctx.save();
            ctx.font = "600 12px Inter, Arial, sans-serif";
            ctx.fillStyle = "#fff";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            chart.data.datasets.forEach(function (ds, di) {
              var meta = chart.getDatasetMeta(di);
              meta.data.forEach(function (bar, i) {
                var val = ds.data[i];
                if (val < 8) return;
                var props = bar.getProps(["x", "y", "base"], true);
                var mid = (props.base + props.x) / 2;
                ctx.fillText(val.toFixed(1).replace(".", ",") + "%", mid, props.y);
              });
            });
            ctx.restore();
          }
        }
      ]
    });
    void chart;
  })();

  /* —— 3a. Zero clicks —— */
  (function () {
    var el = document.getElementById("chartZeroClicks");
    if (!el) return;
    new Chart(el, {
      type: "bar",
      data: {
        labels: ["Страницы услуг"],
        datasets: [
          {
            label: "Без кликов",
            data: [D.services.zeroClick],
            backgroundColor: COLORS.zero,
            borderWidth: 0,
            barThickness: 40
          },
          {
            label: "Хотя бы 1 клик",
            data: [D.services.withClicks],
            backgroundColor: COLORS.withClicks,
            borderWidth: 0,
            barThickness: 40
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            max: D.services.pages,
            grid: { color: COLORS.grid },
            ticks: {
              callback: function (v) {
                return fmtInt(v);
              }
            }
          },
          y: { stacked: true, grid: { display: false } }
        },
        plugins: {
          legend: { position: "bottom" },
          tooltip: tooltipRu()
        }
      },
      plugins: [
        {
          id: "zeroLabels",
          afterDatasetsDraw: function (chart) {
            var ctx = chart.ctx;
            ctx.save();
            ctx.font = "600 12px Inter, Arial, sans-serif";
            ctx.textBaseline = "middle";
            chart.data.datasets.forEach(function (ds, di) {
              var meta = chart.getDatasetMeta(di);
              var bar = meta.data[0];
              if (!bar) return;
              var props = bar.getProps(["x", "y", "base"], true);
              var mid = (props.base + props.x) / 2;
              var w = Math.abs(props.x - props.base);
              if (w < 48) return;
              ctx.fillStyle = "#fff";
              ctx.textAlign = "center";
              ctx.fillText(fmtInt(ds.data[0]), mid, props.y);
            });
            ctx.restore();
          }
        }
      ]
    });
  })();

  /* —— 3b. Under 10 impressions —— */
  (function () {
    var el = document.getElementById("chartLowImpr");
    if (!el) return;
    var under = D.services.under10Impr;
    var rest = D.services.pages - under;
    new Chart(el, {
      type: "bar",
      data: {
        labels: ["Страницы услуг"],
        datasets: [
          {
            label: "Меньше 10 показов",
            data: [under],
            backgroundColor: COLORS.low,
            borderWidth: 0,
            barThickness: 40
          },
          {
            label: "10 и более показов",
            data: [rest],
            backgroundColor: COLORS.rest,
            borderWidth: 0,
            barThickness: 40
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            max: D.services.pages,
            grid: { color: COLORS.grid },
            ticks: {
              callback: function (v) {
                return fmtInt(v);
              }
            }
          },
          y: { stacked: true, grid: { display: false } }
        },
        plugins: {
          legend: { position: "bottom" },
          tooltip: tooltipRu()
        }
      },
      plugins: [
        {
          id: "lowLabels",
          afterDatasetsDraw: function (chart) {
            var ctx = chart.ctx;
            ctx.save();
            ctx.font = "600 12px Inter, Arial, sans-serif";
            ctx.textBaseline = "middle";
            chart.data.datasets.forEach(function (ds, di) {
              var meta = chart.getDatasetMeta(di);
              var bar = meta.data[0];
              if (!bar) return;
              var props = bar.getProps(["x", "y", "base"], true);
              var mid = (props.base + props.x) / 2;
              var w = Math.abs(props.x - props.base);
              if (w < 48) return;
              ctx.fillStyle = di === 0 ? "#fff" : "#182028";
              ctx.textAlign = "center";
              ctx.fillText(fmtInt(ds.data[0]), mid, props.y);
            });
            ctx.restore();
          }
        }
      ]
    });
  })();

  /* —— 4. GEO —— */
  function makeGeoChart(canvasId, field, maxHint) {
    var el = document.getElementById(canvasId);
    if (!el) return;
    var labels = D.geo.map(function (g) {
      return g.name;
    });
    var values = D.geo.map(function (g) {
      return g[field];
    });
    var maxVal = Math.max.apply(null, values);
    new Chart(el, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: field === "pages" ? "URL" : "Клики",
            data: values,
            backgroundColor: COLORS.services,
            borderWidth: 0,
            barThickness: 28
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { right: 36 } },
        scales: {
          x: {
            beginAtZero: true,
            suggestedMax: maxHint || Math.ceil(maxVal * 1.15),
            grid: { color: COLORS.grid },
            ticks: {
              callback: function (v) {
                return fmtInt(v);
              }
            }
          },
          y: { grid: { display: false } }
        },
        plugins: {
          legend: { display: false },
          tooltip: tooltipRu()
        }
      },
      plugins: [
        {
          id: "geoLabels",
          afterDatasetsDraw: function (chart) {
            var ctx = chart.ctx;
            var meta = chart.getDatasetMeta(0);
            ctx.save();
            ctx.font = "600 12px Inter, Arial, sans-serif";
            ctx.fillStyle = "#182028";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            meta.data.forEach(function (bar, i) {
              var props = bar.getProps(["x", "y"], true);
              ctx.fillText(fmtInt(values[i]), props.x + 8, props.y);
            });
            ctx.restore();
          }
        }
      ]
    });
  }

  makeGeoChart("chartGeoPages", "pages", 400);
  makeGeoChart("chartGeoClicks", "clicks", 120);

  /* —— 5. Top articles —— */
  (function () {
    var el = document.getElementById("chartArticles");
    if (!el) return;
    var labels = D.topArticles.map(function (a) {
      return a.title;
    });
    var values = D.topArticles.map(function (a) {
      return a.clicks;
    });
    var paths = D.topArticles.map(function (a) {
      return a.path;
    });

    new Chart(el, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Клики",
            data: values,
            backgroundColor: COLORS.services,
            borderWidth: 0,
            barThickness: 26
          }
        ]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { right: 40 } },
        scales: {
          x: {
            beginAtZero: true,
            suggestedMax: 360,
            grid: { color: COLORS.grid },
            ticks: {
              callback: function (v) {
                return fmtInt(v);
              }
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              callback: function (val, idx) {
                var t = labels[idx] || "";
                if (window.innerWidth < 640 && t.length > 28) {
                  return t.slice(0, 26) + "…";
                }
                return t;
              }
            }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: function (items) {
                var i = items[0].dataIndex;
                return labels[i];
              },
              label: function (ctx) {
                return "Клики: " + fmtInt(ctx.raw);
              },
              afterLabel: function (ctx) {
                return HOST + paths[ctx.dataIndex];
              }
            }
          }
        },
        onClick: function (_e, elements) {
          if (!elements.length) return;
          var i = elements[0].index;
          window.open(HOST + paths[i], "_blank", "noopener");
        },
        onHover: function (event, elements) {
          event.native.target.style.cursor = elements.length ? "pointer" : "default";
        }
      },
      plugins: [
        {
          id: "articleLabels",
          afterDatasetsDraw: function (chart) {
            var ctx = chart.ctx;
            var meta = chart.getDatasetMeta(0);
            ctx.save();
            ctx.font = "600 12px Inter, Arial, sans-serif";
            ctx.fillStyle = "#182028";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            meta.data.forEach(function (bar, i) {
              var props = bar.getProps(["x", "y"], true);
              ctx.fillText(fmtInt(values[i]), props.x + 8, props.y);
            });
            ctx.restore();
          }
        }
      ]
    });
  })();

  /* —— Daily line —— */
  (function () {
    var el = document.getElementById("chartDaily");
    if (!el) return;
    var labels = D.daily.map(function (d) {
      return fmtDate(d.date);
    });
    var clicks = D.daily.map(function (d) {
      return d.clicks;
    });
    var ma = D.daily.map(function (d) {
      return d.ma7;
    });

    new Chart(el, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Клики за день",
            data: clicks,
            borderColor: COLORS.line,
            backgroundColor: "rgba(26,127,196,0.12)",
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 4,
            fill: true,
            tension: 0.15
          },
          {
            label: "Скользящая средняя 7 дней",
            data: ma,
            borderColor: COLORS.ma,
            borderWidth: 2,
            borderDash: [5, 4],
            pointRadius: 0,
            pointHoverRadius: 3,
            fill: false,
            tension: 0.2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: window.innerWidth < 640 ? 6 : 12
            }
          },
          y: {
            beginAtZero: true,
            grid: { color: COLORS.grid },
            ticks: {
              callback: function (v) {
                return fmtInt(v);
              }
            }
          }
        },
        plugins: {
          legend: { position: "bottom" },
          tooltip: {
            callbacks: {
              title: function (items) {
                var i = items[0].dataIndex;
                var iso = D.daily[i].date;
                var p = iso.split("-");
                return p[2] + "." + p[1] + "." + p[0];
              },
              label: function (ctx) {
                var v = ctx.raw;
                if (ctx.datasetIndex === 1) {
                  return ctx.dataset.label + ": " + String(v).replace(".", ",");
                }
                return ctx.dataset.label + ": " + fmtInt(v);
              }
            }
          }
        }
      }
    });
  })();

  /* —— Sidebar / mobile nav —— */
  (function () {
    var sidebar = document.getElementById("sidebar");
    var openBtn = document.getElementById("navOpen");
    var backdrop = document.getElementById("navBackdrop");
    var links = document.querySelectorAll("#sidebarNav a");
    var sections = [];

    links.forEach(function (link) {
      var id = link.getAttribute("data-section");
      var el = id ? document.getElementById(id) : null;
      if (el) sections.push({ id: id, el: el, link: link });
    });

    function setOpen(open) {
      if (!sidebar || !openBtn || !backdrop) return;
      sidebar.classList.toggle("is-open", open);
      backdrop.hidden = !open;
      openBtn.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    }

    if (openBtn) {
      openBtn.addEventListener("click", function () {
        setOpen(!sidebar.classList.contains("is-open"));
      });
    }
    if (backdrop) {
      backdrop.addEventListener("click", function () {
        setOpen(false);
      });
    }

    links.forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    function updateActive() {
      if (!sections.length) return;
      var marker = window.scrollY + 96;
      var current = sections[0];
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].el.offsetTop <= marker) current = sections[i];
      }
      links.forEach(function (link) {
        link.classList.toggle("is-active", link === current.link);
      });
    }

    window.addEventListener("scroll", updateActive, { passive: true });
    updateActive();
  })();
})();
