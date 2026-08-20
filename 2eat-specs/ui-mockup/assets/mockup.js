(function () {
  var STORAGE = window.EAT_I18N_STORAGE;
  var CATALOGS = window.EAT_I18N;
  var LANG = window.EAT_LOCALE_LANG;
  var LOCALES = window.EAT_LOCALES;

  function currentLocale() {
    var stored = localStorage.getItem(STORAGE);
    if (LOCALES.indexOf(stored) !== -1) return stored;
    return "EN";
  }

  function t(key, vars) {
    var loc = currentLocale();
    var catalog = CATALOGS[loc] || {};
    var en = CATALOGS.EN || {};
    var value = catalog[key];
    if (value == null || value === "") value = en[key];
    if (value == null || value === "") value = key;
    if (vars) {
      Object.keys(vars).forEach(function (name) {
        value = value.replace(new RegExp("\\{" + name + "\\}", "g"), vars[name]);
      });
    }
    return value;
  }

  function parseVars(el) {
    var raw = el.getAttribute("data-i18n-vars");
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }

  function applyI18n() {
    var loc = currentLocale();
    document.documentElement.lang = LANG[loc] || "en";
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var value = t(key, parseVars(el));
      if (el.dataset.i18nAttr) {
        el.setAttribute(el.dataset.i18nAttr, value);
      } else if (el.tagName !== "META") {
        el.textContent = value;
      }
    });
    document.querySelectorAll("[data-i18n-href]").forEach(function (el) {
      el.setAttribute("href", t(el.getAttribute("data-i18n-href")));
    });
    document.querySelectorAll("[data-i18n-value]").forEach(function (el) {
      el.value = t(el.getAttribute("data-i18n-value"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
    });
    var desc = document.querySelector('meta[name="description"]');
    if (desc && desc.hasAttribute("data-i18n")) {
      desc.setAttribute("content", t(desc.getAttribute("data-i18n")));
    }
    var titleKey = document.body.getAttribute("data-title-key");
    if (titleKey) {
      document.title = t(titleKey) + " — what2eat.food";
    }
    document.querySelectorAll(".locale-switch button").forEach(function (btn) {
      var on = btn.getAttribute("data-locale") === loc;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function bindLocale() {
    document.querySelectorAll(".locale-switch button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        localStorage.setItem(STORAGE, btn.getAttribute("data-locale"));
        applyI18n();
        populateLocationSuggestions();
        populateMealContexts();
      });
    });
  }

  function bindPassword() {
    document.querySelectorAll(".password-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var input = document.getElementById(btn.getAttribute("data-for"));
        if (!input) return;
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.classList.toggle("is-revealed", show);
        btn.setAttribute("aria-pressed", show ? "true" : "false");
        btn.setAttribute("data-i18n", show ? "eat.login.hide_password" : "eat.login.show_password");
        applyI18n();
      });
    });
  }

  function bindPhotoPicker() {
    var input = document.getElementById("photo");
    if (!input) return;
    var trigger = document.querySelector("[data-photo-trigger]");
    var frame = document.querySelector("[data-photo-frame]");
    var img = document.querySelector("[data-photo-img]");
    var nameEl = document.querySelector("[data-photo-name]");
    if (trigger) {
      trigger.addEventListener("click", function () {
        input.click();
      });
    }
    input.addEventListener("change", function () {
      var file = input.files && input.files[0];
      input.blur();
      if (!file) {
        if (frame) frame.classList.remove("has-photo");
        if (img) img.hidden = true;
        if (nameEl) {
          nameEl.setAttribute("data-i18n", "eat.register.photo_none");
          applyI18n();
        }
        return;
      }
      if (nameEl) {
        nameEl.removeAttribute("data-i18n");
        nameEl.textContent = file.name;
      }
      if (frame && img && file.type.indexOf("image/") === 0) {
        img.src = URL.createObjectURL(file);
        img.hidden = false;
        frame.classList.add("has-photo");
      }
    });
  }

  function bindGenderGroup() {
    var group = document.querySelector("[data-gender-group]");
    var hidden = document.getElementById("gender");
    if (!group || !hidden) return;
    group.querySelectorAll("[data-gender]").forEach(function (btn) {
      var selected = btn.getAttribute("aria-checked") === "true";
      btn.setAttribute("aria-pressed", selected ? "true" : "false");
      btn.addEventListener("click", function () {
        group.querySelectorAll("[data-gender]").forEach(function (peer) {
          peer.setAttribute("aria-checked", "false");
          peer.setAttribute("aria-pressed", "false");
        });
        btn.setAttribute("aria-checked", "true");
        btn.setAttribute("aria-pressed", "true");
        hidden.value = btn.getAttribute("data-gender") || "";
      });
    });
  }

  function populateLocationSuggestions() {
    var list = document.getElementById("location-suggestions");
    if (!list) return;
    var raw = t("eat.register.location_suggestions");
    list.innerHTML = "";
    raw.split("|").forEach(function (item) {
      var value = item.trim();
      if (!value) return;
      var opt = document.createElement("option");
      opt.value = value;
      list.appendChild(opt);
    });
  }

  function setLocationStatus(state) {
    var status = document.querySelector("[data-location-status]");
    var failed = document.querySelector("[data-location-failed]");
    if (!status) return;
    status.classList.remove("is-ok", "is-warn");
    if (state === "detecting") {
      status.hidden = false;
      status.setAttribute("data-i18n", "eat.register.location_detecting");
      if (failed) failed.hidden = true;
    } else if (state === "ok") {
      status.hidden = false;
      status.classList.add("is-ok");
      status.setAttribute("data-i18n", "eat.register.location_detected");
      if (failed) failed.hidden = true;
    } else if (state === "fail") {
      status.hidden = true;
      if (failed) failed.hidden = false;
    } else {
      status.hidden = true;
      if (failed) failed.hidden = true;
    }
    applyI18n();
  }

  function detectLocation() {
    var input = document.getElementById("location");
    var btn = document.querySelector("[data-location-retry]");
    if (!input) return;
    if (!navigator.geolocation) {
      setLocationStatus("fail");
      return;
    }
    setLocationStatus("detecting");
    if (btn) btn.classList.add("is-loading");
    navigator.geolocation.getCurrentPosition(
      function () {
        input.value = t("eat.sample.area");
        setLocationStatus("ok");
        if (btn) btn.classList.remove("is-loading");
      },
      function () {
        input.value = "";
        setLocationStatus("fail");
        if (btn) btn.classList.remove("is-loading");
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  }

  function bindLocation() {
    var field = document.querySelector("[data-location-field]");
    if (!field) return;
    populateLocationSuggestions();
    var input = document.getElementById("location");
    if (input && input.value.trim()) {
      setLocationStatus("ok");
    } else {
      detectLocation();
    }
    var retry = field.querySelector("[data-location-retry]");
    if (retry) {
      retry.addEventListener("click", function () {
        detectLocation();
      });
    }
  }

  function bindRegisterForm() {
    var form = document.querySelector("[data-register-form]");
    if (!form) return;
    var err = document.querySelector("[data-register-password-error]");
    var confirmField = document.querySelector('[data-field="password_confirm"]');
    var pw = document.getElementById("password");
    var confirm = document.getElementById("password_confirm");
    function clearMismatch() {
      if (err) err.hidden = true;
      if (confirmField) confirmField.classList.remove("is-invalid");
      if (confirm) confirm.removeAttribute("aria-invalid");
    }
    if (pw) pw.addEventListener("input", clearMismatch);
    if (confirm) confirm.addEventListener("input", clearMismatch);
    form.addEventListener("submit", function (e) {
      if (!pw || !confirm) return;
      if (pw.value !== confirm.value) {
        e.preventDefault();
        if (err) err.hidden = false;
        if (confirmField) confirmField.classList.add("is-invalid");
        if (confirm) {
          confirm.setAttribute("aria-invalid", "true");
          confirm.setAttribute("aria-describedby", "password-confirm-error");
          confirm.focus();
        }
      }
    });
  }

  function showRegisterFieldError(fieldName, errorKey) {
    var field = document.querySelector('[data-field="' + fieldName + '"]');
    var message = document.querySelector('[data-field-error="' + fieldName + '"]');
    if (!field || !message) return;
    field.classList.add("is-invalid");
    message.hidden = false;
    if (errorKey) message.setAttribute("data-i18n", errorKey);
    var control = field.querySelector("input, select, textarea");
    if (control) {
      control.setAttribute("aria-invalid", "true");
      if (message.id) control.setAttribute("aria-describedby", message.id);
    }
  }

  function bindMenu() {
    var toggle = document.querySelector(".menu-toggle");
    var header = document.querySelector(".app-header");
    if (!toggle || !header) return;
    toggle.addEventListener("click", function () {
      header.classList.toggle("is-nav-open");
    });
  }

  function bindDialogs() {
    document.querySelectorAll("[data-open-dialog]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var dlg = document.getElementById(btn.getAttribute("data-open-dialog"));
        if (dlg) {
          dlg.classList.add("is-open");
          applyI18n();
          var close = dlg.querySelector("[data-close-dialog]");
          if (close) close.focus();
        }
      });
    });
    document.querySelectorAll("[data-close-dialog]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dlg = btn.closest(".dialog-backdrop");
        if (dlg) dlg.classList.remove("is-open");
      });
    });
    document.querySelectorAll(".dialog-backdrop").forEach(function (dlg) {
      dlg.addEventListener("click", function (e) {
        if (e.target === dlg) dlg.classList.remove("is-open");
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      document.querySelectorAll(".dialog-backdrop.is-open").forEach(function (dlg) {
        dlg.classList.remove("is-open");
      });
    });
  }

  function bindChips() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("button.chip-toggle");
      if (!btn || btn.closest("[data-gender-group]")) return;
      var on = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", on ? "false" : "true");
    });
  }

  function bindChipAdd() {
    document.querySelectorAll("[data-chip-add]").forEach(function (wrap) {
      var list = wrap.querySelector("[data-chip-list]");
      var input = wrap.querySelector("[data-chip-input]");
      var btn = wrap.querySelector("[data-chip-add-btn]");
      if (!list || !input || !btn) return;

      function addChip() {
        var text = input.value.trim();
        if (!text) return;
        var lower = text.toLowerCase();
        var exists = false;
        list.querySelectorAll(".chip-toggle").forEach(function (chip) {
          if (chip.textContent.trim().toLowerCase() === lower) exists = true;
        });
        if (exists) {
          input.value = "";
          input.focus();
          return;
        }
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip chip-toggle is-custom";
        var kind = wrap.getAttribute("data-chip-add");
        if (kind === "likes") chip.classList.add("chip-like");
        if (kind === "dislikes") chip.classList.add("chip-dislike");
        chip.setAttribute("aria-pressed", "true");
        chip.textContent = text;
        list.appendChild(chip);
        input.value = "";
        input.focus();
      }

      btn.addEventListener("click", addChip);
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          addChip();
        }
      });
    });
  }

  function bindProfileSave() {
    var form = document.querySelector("[data-profile-form]");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var note = form.querySelector("[data-profile-saved]");
        if (note) {
          note.hidden = false;
          note.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    }
    var personal = document.querySelector("[data-personal-form]");
    if (personal) {
      personal.addEventListener("submit", function (e) {
        e.preventDefault();
        var note = personal.querySelector("[data-personal-saved]");
        if (note) {
          note.hidden = false;
          note.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      });
    }
  }

  function buildRichReplyArticle(options) {
    var leadKey = options.leadKey || "eat.decide.chat_rich_lead";
    var picks = options.picks || [
      {
        name: "Ichijuissai",
        metaKey: "eat.decide.chat_rich_pick_1",
        href: "https://www.google.com/maps/search/?api=1&query=Ichijuissai+Hong+Kong",
        img: "https://images.unsplash.com/photo-1579584425555-c3ce17fd1871?w=160&h=120&fit=crop",
      },
      {
        name: "Yakiniku Kagura",
        metaKey: "eat.decide.chat_rich_pick_2",
        href: "https://www.google.com/maps/search/?api=1&query=Yakiniku+Kagura+Hong+Kong",
        img: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=160&h=120&fit=crop",
      },
    ];
    var compact = options.compact ? " chat-rich--compact" : "";
    var article = document.createElement("article");
    article.className = "bubble bubble--rich chat-rich" + compact;
    article.setAttribute("data-testid", "chat-agent-msg");
    var label = document.createElement("p");
    label.className = "chat-rich__label kind";
    label.setAttribute("data-i18n", "eat.why.kind_model");
    label.textContent = t("eat.why.kind_model");
    article.appendChild(label);
    var lead = document.createElement("p");
    lead.className = "chat-rich__lead";
    lead.setAttribute("data-i18n", leadKey);
    lead.textContent = t(leadKey);
    article.appendChild(lead);
    var list = document.createElement("ul");
    list.className = "chat-rich__cards";
    picks.forEach(function (pick) {
      var li = document.createElement("li");
      li.className = "chat-pick-card";
      li.setAttribute("data-testid", "chat-pick-card");
      li.innerHTML =
        '<a class="chat-pick-card__media" href="' +
        pick.href +
        '" target="_blank" rel="noopener noreferrer">' +
        '<img src="' +
        pick.img +
        '" alt="" width="80" height="60" loading="lazy" />' +
        "</a>" +
        '<div class="chat-pick-card__body">' +
        '<h3 class="chat-pick-card__name">' +
        pick.name +
        "</h3>" +
        '<p class="chat-pick-card__meta" data-i18n="' +
        pick.metaKey +
        '">' +
        t(pick.metaKey) +
        "</p>" +
        '<a class="chat-pick-card__link" href="' +
        pick.href +
        '" target="_blank" rel="noopener noreferrer" data-i18n="eat.chat.open_maps">' +
        t("eat.chat.open_maps") +
        "</a>" +
        "</div>";
      list.appendChild(li);
    });
    article.appendChild(list);
    return article;
  }

  function bindChat() {
    document.querySelectorAll("[data-chat-root]").forEach(function (root) {
      var form = root.querySelector("[data-chat-form]");
      var input = root.querySelector("[data-chat-input]");
      var log = root.querySelector("[data-transcript]");
      if (!form || !input || !log) return;
      var isRich = root.getAttribute("data-chat-rich") === "1";
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var text = input.value.trim();
        if (!text) return;
        var user = document.createElement("p");
        user.className = "bubble is-user";
        user.textContent = text;
        log.appendChild(user);
        if (isRich) {
          var compact = root.classList.contains("place-why-chat");
          var reply = buildRichReplyArticle({
            compact: compact,
            leadKey: compact ? "eat.chat.sample_rich_lead" : "eat.decide.chat_rich_lead",
            picks: compact
              ? [
                  {
                    name: "The Wolseley",
                    metaKey: "eat.chat.sample_rich_pick",
                    href: "https://www.google.com/maps/search/?api=1&query=The+Wolseley+London",
                    img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=160&h=120&fit=crop",
                  },
                ]
              : undefined,
          });
          log.appendChild(reply);
        } else {
          var replyPlain = document.createElement("p");
          replyPlain.className = "bubble";
          var replyKey = root.getAttribute("data-chat-reply-key") || "eat.chat.sample_agent";
          replyPlain.innerHTML =
            '<span class="kind" data-i18n="eat.why.kind_model"></span><br />' + t(replyKey);
          log.appendChild(replyPlain);
        }
        applyI18n();
        input.value = "";
        log.scrollTop = log.scrollHeight;
      });
    });
  }

  function agentChatSetOpen(open) {
    var panel = document.querySelector("[data-agent-chat]");
    var openBtn = document.querySelector("[data-agent-chat-open]");
    if (!panel || !openBtn) return;
    panel.classList.toggle("is-open", open);
    panel.setAttribute("aria-hidden", open ? "false" : "true");
    openBtn.classList.toggle("is-hidden", open);
    openBtn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      var input = panel.querySelector("[data-chat-input]");
      if (input) input.focus();
    } else {
      openBtn.focus();
    }
  }

  function bindAgentChat() {
    var panel = document.querySelector("[data-agent-chat]");
    var openBtn = document.querySelector("[data-agent-chat-open]");
    var closeBtn = document.querySelector("[data-agent-chat-close]");
    if (!panel || !openBtn) return;
    openBtn.addEventListener("click", function () {
      agentChatSetOpen(true);
    });
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        agentChatSetOpen(false);
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (panel.classList.contains("is-open")) agentChatSetOpen(false);
    });

    var grip = panel.querySelector("[data-agent-chat-resize]");
    var panelInner = panel.querySelector(".agent-chat__panel");
    if (grip && panelInner) {
      var drag = null;
      var minW = 360;
      var minH = 448;
      grip.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        drag = {
          x: e.clientX,
          y: e.clientY,
          w: panel.getBoundingClientRect().width,
          h: panel.getBoundingClientRect().height,
        };
        grip.setPointerCapture(e.pointerId);
      });
      grip.addEventListener("pointermove", function (e) {
        if (!drag) return;
        var maxW = Math.min(36 * 16, window.innerWidth - 32);
        var maxH = Math.min(42 * 16, window.innerHeight - 32);
        var dw = drag.x - e.clientX;
        var dh = drag.y - e.clientY;
        var nextW = Math.min(maxW, Math.max(minW, drag.w + dw));
        var nextH = Math.min(maxH, Math.max(minH, drag.h + dh));
        panel.style.width = nextW + "px";
        panel.style.height = nextH + "px";
      });
      grip.addEventListener("pointerup", function () {
        drag = null;
      });
    }
  }

  function applyQueryState() {
    var params = new URLSearchParams(location.search);
    if (params.get("error") === "1") {
      var err = document.querySelector("[data-error]");
      if (err) err.hidden = false;
    }
    if (params.get("error") === "email_taken") {
      var emailInput = document.getElementById("email");
      if (emailInput) emailInput.value = "test@example.com";
      showRegisterFieldError("email", "eat.errors.email_taken");
    }
    if (params.get("error") === "password_short") {
      showRegisterFieldError("password", "eat.errors.password_too_short");
    }
    if (params.get("error") === "password_mismatch") {
      showRegisterFieldError("password_confirm", "eat.errors.password_mismatch");
    }
    if (params.get("sent") === "1") {
      var sent = document.querySelector("[data-sent]");
      var lead = document.querySelector("[data-reset-lead]");
      var form = document.querySelector("[data-reset-form]");
      if (sent) sent.hidden = false;
      if (lead) lead.hidden = true;
      if (form) form.hidden = true;
    }
    if (params.get("done") === "1") {
      var done = document.querySelector("[data-set-done]");
      var formBlock = document.querySelector("[data-set-form]");
      if (done) done.hidden = false;
      if (formBlock) formBlock.hidden = true;
    } else {
      var doneDefault = document.querySelector("[data-set-done]");
      if (doneDefault) doneDefault.hidden = true;
    }
    var mode = params.get("mode");
    if (mode === "reset") {
      var emptyLead = document.querySelector("[data-set-empty-lead]");
      var resetLead = document.querySelector("[data-set-reset-lead]");
      if (emptyLead) emptyLead.hidden = true;
      if (resetLead) resetLead.hidden = false;
    }
    if (params.get("error") === "session") {
      var sessionCallout = document.querySelector("[data-set-error-session]");
      var fields = document.querySelector("[data-set-fields]");
      var formBlock2 = document.querySelector("[data-set-form]");
      if (sessionCallout) sessionCallout.hidden = false;
      if (fields) fields.hidden = true;
      if (formBlock2) formBlock2.hidden = false;
    }
    if (params.get("empty") === "1") {
      var grid = document.querySelector("[data-results]");
      var empty = document.querySelector("[data-empty]");
      var toolbar = document.querySelector("[data-toolbar]");
      if (grid) grid.hidden = true;
      if (empty) empty.hidden = false;
      if (toolbar) toolbar.hidden = true;
    }
    if (params.get("partial") === "1") {
      var banner = document.querySelector("[data-partial]");
      var far = document.querySelector("[data-card-far]");
      var closed = document.querySelector("[data-card-closed]");
      if (banner) banner.hidden = false;
      if (far) far.hidden = true;
      if (closed) closed.hidden = true;
    }
    if (params.get("open") === "details") {
      var dlg = document.getElementById("dialog-details");
      if (dlg) {
        dlg.classList.add("is-open");
        applyI18n();
      }
      if (params.get("pending") === "1") {
        var pending = document.querySelector("[data-pending-demo]");
        if (pending) pending.hidden = false;
      }
    }
    if (params.get("open") === "chat") {
      agentChatSetOpen(true);
      if (params.get("tall") === "1") {
        var agentChat = document.querySelector("[data-agent-chat]");
        if (agentChat) agentChat.classList.add("is-tall");
      }
      if (params.get("pending") === "1") {
        var listPending = document.querySelector("[data-list-pending-demo]");
        if (listPending) listPending.hidden = false;
      }
      if (params.get("plain") === "1") {
        var chatRoot = document.querySelector("[data-agent-chat] [data-chat-root]");
        if (chatRoot) {
          chatRoot.setAttribute("data-chat-rich", "0");
          var transcript = chatRoot.querySelector("[data-transcript]");
          if (transcript) {
            transcript.innerHTML =
              '<p class="bubble is-user" data-i18n="eat.decide.chat_sample_user"></p>' +
              '<p class="bubble"><span class="kind" data-i18n="eat.why.kind_model"></span><br /><span data-i18n="eat.decide.chat_sample_agent"></span></p>';
            applyI18n();
          }
        }
      }
    }
  }

  var MEAL_CONTEXT_KEYS = [
    "eat.meal.weekend_dinner",
    "eat.meal.weekday_lunch",
    "eat.meal.quick",
    "eat.meal.celebration",
    "eat.meal.family_dinner",
    "eat.meal.dating",
    "eat.meal.friends",
    "eat.meal.business",
    "eat.meal.solo",
    "eat.meal.brunch",
    "eat.meal.late_night",
  ];

  function populateMealContexts() {
    var list = document.getElementById("meal-contexts");
    if (!list) return;
    list.innerHTML = "";
    MEAL_CONTEXT_KEYS.forEach(function (key) {
      var opt = document.createElement("option");
      opt.value = t(key);
      list.appendChild(opt);
    });
  }

  function showDecidePage(page, onPagePick) {
    var grid = document.querySelector("[data-decide-pages]");
    if (!grid) return;
    var cards = grid.querySelectorAll(".pick-card");
    var perPage = 4;
    var totalPages = Math.max(1, Math.ceil(cards.length / perPage));
    var safePage = Math.min(Math.max(page, 1), totalPages);
    cards.forEach(function (card, index) {
      var cardPage = Math.floor(index / perPage) + 1;
      card.hidden = cardPage !== safePage;
    });
    var prev = document.querySelector("[data-page-prev]");
    var next = document.querySelector("[data-page-next]");
    var pagesRoot = document.querySelector("[data-page-numbers]");
    var summary = document.querySelector("[data-results-summary]");
    if (prev) prev.disabled = safePage <= 1;
    if (next) next.disabled = safePage >= totalPages;
    if (pagesRoot) {
      pagesRoot.innerHTML = "";
      for (var p = 1; p <= totalPages; p += 1) {
        (function (pageNum) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "decide-pagination__num" + (pageNum === safePage ? " is-active" : "");
          btn.textContent = String(pageNum);
          btn.setAttribute("aria-current", pageNum === safePage ? "page" : "false");
          btn.setAttribute("aria-label", t("eat.pagination.page_num", { page: String(pageNum) }));
          btn.addEventListener("click", function () {
            if (onPagePick) onPagePick(pageNum);
          });
          pagesRoot.appendChild(btn);
        })(p);
      }
    }
    if (summary && cards.length) {
      var shown = String((safePage - 1) * perPage + 1);
      var end = String(Math.min(safePage * perPage, cards.length));
      summary.setAttribute("data-i18n-vars", JSON.stringify({ shown: shown, end: end, total: String(cards.length) }));
    }
    applyI18n();
    return safePage;
  }

  function bindDecidePagination() {
    var root = document.querySelector("[data-decide-pagination]");
    if (!root) return;
    var prev = root.querySelector("[data-page-prev]");
    var next = root.querySelector("[data-page-next]");
    var current = 1;
    var params = new URLSearchParams(location.search);
    var pageParam = Number(params.get("page"));
    if (pageParam > 1) current = pageParam;

    function goToPage(page) {
      current = showDecidePage(page, goToPage);
    }

    goToPage(current);
    if (prev) {
      prev.addEventListener("click", function () {
        if (current <= 1) return;
        goToPage(current - 1);
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        goToPage(current + 1);
      });
    }
  }

  function bindSteam() {
    var svg =
      '<svg class="mark-steam" viewBox="0 0 64 64" fill="none" aria-hidden="true">' +
      '<path d="M24 20q-4-10 2-20"/>' +
      '<path d="M33 17q4-11-1-22"/>' +
      '<path d="M42 20q4-10-2-20"/>' +
      "</svg>";
    document.querySelectorAll(".mark-host").forEach(function (host) {
      if (!host.querySelector(".mark-steam")) host.insertAdjacentHTML("beforeend", svg);
    });
  }

  function bindUnsave() {
    document.querySelectorAll("[data-unsave]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var card = btn.closest(".pick-card");
        if (card) card.remove();
        var dlg = btn.closest(".dialog-backdrop");
        if (dlg) dlg.classList.remove("is-open");
        var list = document.querySelector("[data-saved-list]");
        var empty = document.querySelector("[data-empty]");
        if (list && empty && !list.querySelector(".pick-card")) {
          list.hidden = true;
          empty.hidden = false;
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    bindSteam();
    bindLocale();
    bindPassword();
    bindPhotoPicker();
    bindLocation();
    bindRegisterForm();
    bindDecidePagination();
    populateMealContexts();
    bindMenu();
    bindDialogs();
    bindChips();
    bindChipAdd();
    bindProfileSave();
    bindUnsave();
    bindAgentChat();
    bindChat();
    applyQueryState();
    applyI18n();
  });

  window.eatT = t;
})();
