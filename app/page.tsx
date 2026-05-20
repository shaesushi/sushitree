import "./landing.css";
import { createClient } from "@/lib/supabase/server";
import { PageViewTracker } from "@/components/landing/PageViewTracker";
import { TrackedLink } from "@/components/landing/TrackedLink";
import { LandingScripts } from "@/components/landing/LandingScripts";
import { VideoScrollSection } from "@/components/landing/VideoScrollSection";
import { Property360Section } from "@/components/landing/Property360Section";

async function getContent() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("page_content").select("section, key, value");
    const map: Record<string, string> = {};
    data?.forEach((row) => { map[`${row.section}.${row.key}`] = row.value ?? ""; });
    return map;
  } catch { return {} as Record<string, string>; }
}

async function getProperties360() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("properties_360")
      .select("id, title, show_title, thumbnail_url, external_url, property_360_images(id, image_url, label, position)")
      .eq("active", true)
      .order("position");
    return data ?? [];
  } catch { return []; }
}

async function getVideos() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("videos")
      .select("id, title, platform, show_title, mp4_url, external_url, youtube_url")
      .eq("active", true)
      .order("position");
    return data ?? [];
  } catch { return []; }
}

async function getIntegrations() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("integrations").select("name, value, enabled").eq("enabled", true);
    const map: Record<string, string> = {};
    data?.forEach((row) => { map[row.name] = row.value ?? ""; });
    return map;
  } catch { return {} as Record<string, string>; }
}

function c(content: Record<string, string>, key: string, fallback: string) {
  return content[key] || fallback;
}

type Video = {
  id: string; title: string; platform: string; show_title: boolean;
  mp4_url?: string | null; external_url?: string | null; youtube_url?: string | null;
};

const PLATFORM_BADGE: Record<string, { label: string; cta: string; color: string; icon: string }> = {
  youtube: {
    label: "YOUTUBE",
    cta: "Assista no YouTube",
    color: "#FF4444",
    icon: `<svg viewBox="0 0 24 24" fill="#FF4444" style="width:12px;height:12px"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
  },
  reels: {
    label: "INSTAGRAM",
    cta: "Assista no Instagram",
    color: "#E1306C",
    icon: `<svg viewBox="0 0 24 24" fill="#E1306C" style="width:12px;height:12px"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`,
  },
  tiktok: {
    label: "TIKTOK",
    cta: "Assista no TikTok",
    color: "#ffffff",
    icon: `<svg viewBox="0 0 24 24" fill="white" style="width:12px;height:12px"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.83 1.55V6.79a4.85 4.85 0 0 1-1.06-.1z"/></svg>`,
  },
};

export default async function LandingPage() {
  const [content, videos, properties360, integrations] = await Promise.all([
    getContent(), getVideos(), getProperties360(), getIntegrations()
  ]);

  const whatsapp = c(content, "links.whatsapp_number", "5545999731581");
  const instagram = c(content, "links.instagram_url", "https://www.instagram.com/claudineiacalegari/");
  const youtube   = c(content, "links.youtube_url",   "https://www.youtube.com/@claudineiacalegari");
  const email     = c(content, "links.email",          "contato@claudineiacalegari.com.br");

  const imgCard = (key: string, fallback: string) =>
    c(content, `cards.${key}`, `/img/${fallback}`);

  return (
    <>
      <LandingScripts integrations={integrations} />
      <PageViewTracker />

      <div className="lp" style={{ width: "100%" }}>
        <div className="page">

          {/* ── HERO ── */}
          <section className="hero">
            <div className="hero-img-wrap">
              <img src={c(content, "hero.image_url", "/img/hero.jpg")} alt="Claudinéia Calegari" />
            </div>
            <div className="hero-text">
              <span className="hero-eyebrow">{c(content, "hero.eyebrow", "muito prazer, sou a")}</span>
              <span className="hero-name">{c(content, "hero.name", "Claudinéia Calegari")}</span>
              <span className="hero-sub">{c(content, "hero.subtitle", "Corretora de Imóveis · Foz do Iguaçu & Região")}</span>
            </div>
          </section>

          {/* ── INTRO ── */}
          <section className="intro">
            <h1>
              {c(content, "intro.headline", "MEU TRABALHO É REALIZAR")}
              <em>{c(content, "intro.subheadline", "o seu sonho de morar bem.")}</em>
            </h1>
            <p>{c(content, "intro.description", "Role para baixo e acesse meus links importantes!")}</p>
          </section>

          {/* ── HINT ── */}
          <div className="hint">
            <div className="hint-line" />
            <span className="hint-label">links importantes</span>
            <div className="hint-line" />
          </div>

          {/* ── CARDS ── */}
          <div className="cards">

            {/* WhatsApp */}
            <TrackedLink id="whatsapp-geral" label="WhatsApp — Fale Comigo"
              href={`https://wa.me/${whatsapp}`} className="card-photo tall"
              style={{ "--accent": "#25D366", "--card-bg": "#0F1F14", background: "#0F1F14", borderColor: "rgba(37,211,102,0.18)" } as React.CSSProperties}>
              <div className="cp-text">
                <span className="cp-eyebrow" style={{ color: "#25D366" }}>contato direto</span>
                <span className="cp-headline">FALE COMIGO NO WHATSAPP</span>
                <span className="cp-desc">Atendimento rápido<br />e personalizado.</span>
                <span className="cp-cta" style={{ borderColor: "rgba(37,211,102,0.32)", color: "#25D366" }}>
                  <svg viewBox="0 0 24 24" fill="#25D366" style={{ width: 14, height: 14 }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                  Enviar mensagem
                </span>
              </div>
              <div className="cp-img">
                <img src={imgCard("img_whatsapp", "card-whatsapp.jpg")} alt="" />
              </div>
            </TrackedLink>

            {/* Imóveis disponíveis */}
            <TrackedLink id="whatsapp-imoveis" label="WhatsApp — Imóveis Disponíveis"
              href={`https://wa.me/${whatsapp}?text=Ol%C3%A1%2C%20gostaria%20de%20ver%20os%20im%C3%B3veis%20dispon%C3%ADveis!`}
              className="card-photo tall"
              style={{ "--accent": "#B8966E", "--card-bg": "#181816" } as React.CSSProperties}>
              <div className="cp-text">
                <span className="cp-eyebrow">portfólio</span>
                <span className="cp-headline">IMÓVEIS DISPONÍVEIS</span>
                <span className="cp-desc">Casas, aptos e terrenos<br />em Foz do Iguaçu.</span>
                <span className="cp-cta">
                  Ver imóveis
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}><path d="M6 3l5 5-5 5" /></svg>
                </span>
              </div>
              <div className="cp-img">
                <img src={imgCard("img_imoveis", "card-imoveis.jpg")} alt="" />
              </div>
            </TrackedLink>

            {/* Comprar */}
            <TrackedLink id="whatsapp-comprar" label="WhatsApp — Quero Comprar"
              href={`https://wa.me/${whatsapp}?text=Ol%C3%A1%2C%20quero%20comprar%20um%20im%C3%B3vel!`}
              className="card-photo tall"
              style={{ "--accent": "#B8966E", "--card-bg": "#181816" } as React.CSSProperties}>
              <div className="cp-text">
                <span className="cp-eyebrow">compra</span>
                <span className="cp-headline">QUERO COMPRAR UM IMÓVEL</span>
                <span className="cp-desc">Indicação gratuita<br />e personalizada.</span>
                <span className="cp-cta">
                  Quero comprar
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}><path d="M6 3l5 5-5 5" /></svg>
                </span>
              </div>
              <div className="cp-img">
                <img src={imgCard("img_comprar", "card-comprar.jpg")} alt="" />
              </div>
            </TrackedLink>

            {/* Vender */}
            <TrackedLink id="whatsapp-vender" label="WhatsApp — Quero Vender"
              href={`https://wa.me/${whatsapp}?text=Ol%C3%A1%2C%20quero%20vender%20meu%20im%C3%B3vel!`}
              className="card-photo tall"
              style={{ "--accent": "#B8966E", "--card-bg": "#181816" } as React.CSSProperties}>
              <div className="cp-text">
                <span className="cp-eyebrow">venda</span>
                <span className="cp-headline">QUERO VENDER MEU IMÓVEL</span>
                <span className="cp-desc">Avaliação e divulgação<br />especializada.</span>
                <span className="cp-cta">
                  Quero vender
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}><path d="M6 3l5 5-5 5" /></svg>
                </span>
              </div>
              <div className="cp-img">
                <img src={imgCard("img_vender", "card-vender.jpg")} alt="" />
              </div>
            </TrackedLink>

            {/* Instagram */}
            <TrackedLink id="instagram" label="Instagram"
              href={instagram} className="card-photo"
              style={{ "--accent": "#E1306C", "--card-bg": "#1A1016", background: "#1A1016", borderColor: "rgba(225,48,108,0.15)" } as React.CSSProperties}>
              <div className="cp-text">
                <span className="cp-eyebrow" style={{ color: "#E1306C" }}>instagram</span>
                <span className="cp-headline">ME SIGA NO INSTAGRAM</span>
                <span className="cp-desc">Conteúdo diário<br />sobre imóveis.</span>
                <span className="cp-cta" style={{ borderColor: "rgba(225,48,108,0.32)", color: "#E1306C" }}>
                  Seguir agora
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}><path d="M6 3l5 5-5 5" /></svg>
                </span>
              </div>
              <div className="cp-img">
                <img src={imgCard("img_instagram", "card-instagram.jpg")} alt="" />
              </div>
            </TrackedLink>

            {/* YouTube */}
            <TrackedLink id="youtube-canal" label="YouTube — Canal"
              href={youtube} className="card-photo"
              style={{ "--accent": "#FF4444", "--card-bg": "#1A1110", background: "#1A1110", borderColor: "rgba(255,68,68,0.15)" } as React.CSSProperties}>
              <div className="cp-text">
                <span className="cp-eyebrow" style={{ color: "#FF4444" }}>youtube</span>
                <span className="cp-headline">CANAL NO YOUTUBE</span>
                <span className="cp-desc">Vídeos completos<br />sobre imóveis.</span>
                <span className="cp-cta" style={{ borderColor: "rgba(255,68,68,0.32)", color: "#FF6666" }}>
                  Assistir agora
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}><path d="M6 3l5 5-5 5" /></svg>
                </span>
              </div>
              <div className="cp-img">
                <img src={imgCard("img_youtube", "card-youtube.jpg")} alt="" />
              </div>
            </TrackedLink>
          </div>

          {/* ── DIVISOR ── */}
          <div className="divider" style={{ marginTop: 20, marginBottom: 4 }}>
            <div className="divider-line" />
            <div className="divider-gem" />
            <div className="divider-line" />
          </div>

          {/* ── VÍDEOS EM DESTAQUE ── */}
          <section className="section-videos" style={{ marginTop: 16 }}>
            <div className="section-header">
              <div className="section-header-line" />
              <div className="section-header-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" style={{ width: 14, height: 14 }}>
                  <path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                <span className="section-title">vídeos em destaque</span>
              </div>
              <div className="section-header-line" />
            </div>

            <VideoScrollSection>
            <div className="video-grid">
              {(videos as Video[]).map((video) => {
                const badge = PLATFORM_BADGE[video.platform] ?? PLATFORM_BADGE.youtube;
                const mp4   = video.mp4_url || null;
                const link  = video.external_url || video.youtube_url || "#";
                return (
                  <TrackedLink key={video.id}
                    id={`video-${video.platform}-${video.id}`}
                    label={`${badge.label} — ${video.title}`}
                    href={link}
                    className="video-card">
                    {mp4 && (
                      <video autoPlay muted loop playsInline preload="auto">
                        <source src={mp4} type="video/mp4" />
                      </video>
                    )}
                    <div className="video-card-overlay" />
                    <div className="video-badge">
                      <span dangerouslySetInnerHTML={{ __html: badge.icon }} />
                      <span>{badge.label}</span>
                    </div>
                    <div className="video-play-btn">
                      <svg viewBox="0 0 16 16" fill="white" style={{ width: 14, height: 14, marginLeft: 2 }}>
                        <path d="M6 4l6 4-6 4V4z" />
                      </svg>
                    </div>
                    <div className="video-info">
                      {video.show_title !== false && (
                        <span className="video-info-title">{video.title}</span>
                      )}

                      <span className="video-info-cta">
                        VER VÍDEO COMPLETO
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 9, height: 9 }}><path d="M6 3l5 5-5 5" /></svg>
                      </span>
                    </div>
                  </TrackedLink>
                );
              })}

              {/* Placeholders — sempre 3 para garantir overflow visível */}
              {[1,2,3].map((i) => (
                <div key={i} className="video-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" />
                  </svg>
                  <span>Próximo vídeo em breve</span>
                </div>
              ))}
            </div>{/* video-grid */}
            </VideoScrollSection>
          </section>

          {/* ── IMÓVEIS 360° ── */}
          {properties360.length > 0 && (
            <section className="section-360" style={{ marginTop: 8 }}>
              <div className="section-header">
                <div className="section-header-line" />
                <div className="section-header-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" style={{ width: 14, height: 14 }}>
                    <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="section-title">imóveis em 360°</span>
                </div>
                <div className="section-header-line" />
              </div>
              <Property360Section properties={properties360} />
            </section>
          )}

          {/* ── E-MAIL ── */}
          <div style={{ width: "100%", padding: "0 16px 0" }}>
            <TrackedLink id="email" label="E-mail" href={`mailto:${email}`} className="card-plain">
              <span className="cp2-eyebrow">e-mail</span>
              <span className="cp2-headline">ENVIAR E-MAIL</span>
              <span className="cp2-desc">{email}</span>
              <span className="cp2-cta">
                Enviar mensagem
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 11, height: 11 }}><path d="M6 3l5 5-5 5" /></svg>
              </span>
            </TrackedLink>
          </div>

          {/* ── RODAPÉ ── */}
          <footer className="footer">
            <div className="footer-logo">{c(content, "hero.name", "CLAUDINÉIA CALEGARI")}</div>
            <div className="footer-creci">{c(content, "footer.creci", "CRECI-PR 43.743")}</div>
            <div className="footer-copy">{c(content, "footer.copyright", "© 2026 · Todos os direitos reservados")}</div>
          </footer>

        </div>
      </div>
    </>
  );
}
