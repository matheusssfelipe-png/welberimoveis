/* =========================================================
   Welber Imóveis — Landing Page
   ========================================================= */

// ---- CONFIGURAÇÃO ----
// Número do WhatsApp do cliente: DDI + DDD + número, só dígitos.
const WHATSAPP_NUMBER = "5513996584785"; // Welber Tavares

const IMOVEIS = {
  "WI-01": "Residência Jardim das Águas",
  "WI-02": "Cobertura Horizonte",
  "WI-03": "Villa Serena",
  "WI-04": "Residência Mirante",
};

const pad = (n) => String(n).padStart(2, "0");
const isTouch = window.matchMedia("(hover: none)").matches;

// ---- Trava de rolagem ----
// Fixar o body (em vez de só overflow: hidden) evita que o iOS role a página
// por trás e que a posição "pule" ao fechar.
let lockedY = 0;
const lockScroll = () => {
  lockedY = window.scrollY;
  Object.assign(document.body.style, { position: "fixed", top: `-${lockedY}px`, left: "0", right: "0" });
};
const unlockScroll = () => {
  Object.assign(document.body.style, { position: "", top: "", left: "", right: "" });
  window.scrollTo({ top: lockedY, behavior: "instant" });
};

// ---- Janelas sobrepostas (galeria, interesse) ----
// Cada abertura cria uma entrada no histórico: o botão "voltar" do celular
// fecha a janela em vez de sair do site.
let overlay = null; // { el, onClose }

const showOverlay = (el, onClose) => {
  const switching = Boolean(overlay);
  if (switching) {
    overlay.el.classList.remove("open");
    overlay.el.hidden = true;
    overlay.onClose?.();
  } else {
    lockScroll();
    history.pushState({ overlay: true }, "");
  }
  overlay = { el, onClose, lastFocus: switching ? overlay.lastFocus : document.activeElement };
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add("open"));
};

const finishClose = () => {
  if (!overlay) return;
  const { el, onClose, lastFocus } = overlay;
  overlay = null;
  el.classList.remove("open");
  setTimeout(() => { el.hidden = true; onClose?.(); }, 350);
  unlockScroll();
  lastFocus?.focus({ preventScroll: true });
};

const closeOverlay = () => {
  if (history.state?.overlay) history.back(); // dispara o popstate abaixo
  else finishClose();
};

window.addEventListener("popstate", finishClose);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && overlay) closeOverlay();
});
document.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeOverlay));

// ---- Cabeçalho ----
const header = document.querySelector(".site-header");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ---- Menu mobile ----
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");

const setMenu = (open) => {
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  nav.classList.toggle("open", open);
  header.classList.toggle("menu-open", open);
  document.body.style.overflow = open ? "hidden" : "";
};
toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

// ---- Animações de entrada ----
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// ---- Galeria em tela cheia ----
// Cada galeria com data-pasta/data-total abre as fotos 01.jpg … NN.jpg da pasta.
const lightbox = document.getElementById("lightbox");
const track = lightbox.querySelector(".lb-track");
const lbTitle = lightbox.querySelector(".lb-title");
const lbCounter = lightbox.querySelector(".lb-counter");
const lbPrev = lightbox.querySelector(".lb-prev");
const lbNext = lightbox.querySelector(".lb-next");
let lb = { total: 0, index: 1, codigo: "" };

const updateCounter = () => {
  lbCounter.textContent = `${pad(lb.index)} / ${pad(lb.total)}`;
  lbPrev.disabled = lb.index === 1;
  lbNext.disabled = lb.index === lb.total;
};

const goTo = (i, smooth = true) => {
  const index = Math.min(Math.max(i, 1), lb.total);
  track.scrollTo({ left: (index - 1) * track.clientWidth, behavior: smooth ? "smooth" : "instant" });
};

const openLightbox = (gallery, index) => {
  const article = gallery.closest(".imovel");
  const nome = article.querySelector("h2").textContent.trim();
  lb = { total: Number(gallery.dataset.total), index, codigo: article.dataset.codigo };

  track.innerHTML = Array.from({ length: lb.total }, (_, k) => {
    const n = k + 1;
    const loading = Math.abs(n - index) <= 1 ? "eager" : "lazy";
    return `<figure class="lb-slide"><img src="${gallery.dataset.pasta}/${pad(n)}.jpg" alt="${nome} — foto ${n} de ${lb.total}" loading="${loading}" decoding="async"></figure>`;
  }).join("");
  lbTitle.textContent = nome;

  showOverlay(lightbox, () => { track.innerHTML = ""; });
  goTo(index, false);
  updateCounter();
  if (!isTouch) lightbox.querySelector(".back-btn").focus({ preventScroll: true });
};

track.addEventListener("scroll", () => {
  const i = Math.round(track.scrollLeft / track.clientWidth) + 1;
  if (i !== lb.index) { lb.index = i; updateCounter(); }
}, { passive: true });

window.addEventListener("resize", () => {
  if (overlay?.el === lightbox) goTo(lb.index, false);
});

lbPrev.addEventListener("click", () => goTo(lb.index - 1));
lbNext.addEventListener("click", () => goTo(lb.index + 1));
document.addEventListener("keydown", (e) => {
  if (overlay?.el !== lightbox) return;
  if (e.key === "ArrowLeft") goTo(lb.index - 1);
  if (e.key === "ArrowRight") goTo(lb.index + 1);
});
lightbox.querySelector(".lb-cta").addEventListener("click", () => openInterest(lb.codigo));

document.querySelectorAll(".imovel-gallery[data-total]").forEach((gallery) => {
  gallery.querySelectorAll(".media[data-index]").forEach((media) => {
    media.addEventListener("click", () => openLightbox(gallery, Number(media.dataset.index)));
  });
  gallery.querySelector(".gallery-all")?.addEventListener("click", (e) => {
    e.stopPropagation();
    openLightbox(gallery, 1);
  });
});

// ---- Janela de interesse ----
// O mesmo formulário da seção de contato é movido para a janela, com o imóvel
// escolhido fixo no topo; ao fechar, ele volta para o lugar de origem.
const form = document.getElementById("lead-form");
const formSlot = document.getElementById("form-slot");
const selectImovel = document.getElementById("imovel");
const interest = document.getElementById("interest");
const interestBody = interest.querySelector(".interest-body");
const interestThumb = interest.querySelector(".interest-thumb");

const openInterest = (codigo) => {
  const article = document.querySelector(`.imovel[data-codigo="${codigo}"]`);
  const foto = article.querySelector(".gallery-main img");

  interest.querySelector("#interest-title").innerHTML = article.querySelector("h2").innerHTML;
  interest.querySelector(".codigo").textContent = `Cód. ${codigo}`;
  interestThumb.innerHTML = foto ? `<img src="${foto.currentSrc || foto.src}" alt="">` : "";

  selectImovel.value = codigo;
  selectImovel.closest(".field").classList.remove("invalid");
  form.classList.add("in");
  interestBody.appendChild(form);
  interest.querySelector(".interest-panel").scrollTop = 0;

  showOverlay(interest, () => formSlot.appendChild(form));
  if (!isTouch) setTimeout(() => form.nome.focus({ preventScroll: true }), 350);
};

document.querySelectorAll("[data-interesse]").forEach((btn) => {
  btn.addEventListener("click", () => openInterest(btn.dataset.interesse));
});

// ---- Máscara de telefone (BR) ----
const tel = document.getElementById("telefone");
tel.addEventListener("input", () => {
  const d = tel.value.replace(/\D/g, "").slice(0, 11);
  let out = d;
  if (d.length > 2) out = `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length > 7) out = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
  tel.value = out;
});

// ---- Validação e envio para o WhatsApp ----
const setInvalid = (el, invalid) => el.closest(".field").classList.toggle("invalid", invalid);

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const nome = form.nome.value.trim();
  const email = form.email.value.trim();
  const telefone = form.telefone.value.trim();
  const imovel = selectImovel.value;
  const prazo = form.querySelector('input[name="prazo"]:checked');
  const consent = document.getElementById("consent").checked;

  const checks = [
    [form.nome, nome.length >= 3],
    [form.email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)],
    [form.telefone, telefone.replace(/\D/g, "").length >= 10],
    [selectImovel, Boolean(imovel)],
    [form.querySelector('input[name="prazo"]'), Boolean(prazo)],
  ];
  let ok = true;
  checks.forEach(([el, valid]) => {
    setInvalid(el, !valid);
    if (!valid) ok = false;
  });
  document.querySelector(".consent-error").classList.toggle("visible", !consent);
  if (!consent) ok = false;

  if (!ok) {
    const first = form.querySelector(".field.invalid input, .field.invalid select");
    first?.scrollIntoView({ block: "center", behavior: "smooth" });
    first?.focus({ preventScroll: true });
    return;
  }

  const mensagem = [
    `*Novo contato pelo site — Welber Imóveis*`,
    ``,
    `*Imóvel:* [${imovel}] ${IMOVEIS[imovel]}`,
    `*Nome:* ${nome}`,
    `*E-mail:* ${email}`,
    `*Telefone:* ${telefone}`,
    `*Prazo para compra:* ${prazo.value}`,
  ].join("\n");

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;
  const win = window.open(url, "_blank");
  if (win) win.opener = null;
  else window.location.href = url;
});

// Remove o estado de erro assim que o campo é corrigido
form.addEventListener("input", (e) => {
  const field = e.target.closest(".field");
  if (field) field.classList.remove("invalid");
  if (e.target.id === "consent") document.querySelector(".consent-error").classList.remove("visible");
});

// ---- Botão flutuante (mobile): aparece após o hero e some na seção de contato ----
const fab = document.querySelector(".fab");
const hero = document.querySelector(".hero");
const contato = document.getElementById("contato");
let heroVisible = true;
let contatoVisible = false;

new IntersectionObserver(([entry]) => {
  heroVisible = entry.isIntersecting;
  fab.classList.toggle("visible", !heroVisible && !contatoVisible);
}).observe(hero);

new IntersectionObserver(([entry]) => {
  contatoVisible = entry.isIntersecting;
  fab.classList.toggle("visible", !heroVisible && !contatoVisible);
}).observe(contato);

// ---- Ano no rodapé ----
document.getElementById("ano").textContent = new Date().getFullYear();
