/**
 * Actualitza el feed públic de la portada a partir del compte PROFESSIONAL
 * @viajaconcabeza amb la Instagram API oficial. Executar només al servidor.
 *
 * Requereix: INSTAGRAM_ACCESS_TOKEN (Instagram Login, instagram_business_basic).
 * No escriu el token al repositori, als logs, ni al JSON.
 */
import { readFile, writeFile } from "node:fs/promises";

const file = new URL("../datos/instagram-ultimo.json", import.meta.url);
const expectedAccount = "viajaconcabeza";
const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
const host = "https://graph.instagram.com/v26.0/";

if (!token) {
  console.log("Instagram: no hi ha token autoritzat. Feed editorial conservat.");
  process.exit(0);
}

async function instagram(path, params) {
  const url = new URL(path, host);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`Instagram API ${path}: HTTP ${response.status}`);
  return response.json();
}

function instagramPostLink(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !["instagram.com", "www.instagram.com"].includes(url.hostname)) return null;
    if (!/^\/(p|reel|tv)\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname)) return null;
    return url.origin + url.pathname;
  } catch { return null; }
}

function imageLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !!url.hostname && !url.username && !url.password
      ? value : null;
  } catch { return null; }
}

function imageOf(media) {
  if (media.media_type === "VIDEO") return imageLink(media.thumbnail_url);
  if (media.media_type === "IMAGE") return imageLink(media.media_url);
  if (media.media_type === "CAROUSEL_ALBUM") {
    const firstImage = media.children?.data?.find(child => child.media_type === "IMAGE" && child.media_url);
    const firstVideoCover = media.children?.data?.find(child => child.media_type === "VIDEO" && child.thumbnail_url);
    return imageLink(firstImage?.media_url || firstVideoCover?.thumbnail_url || media.media_url);
  }
  return null;
}

async function update() {
  const identity = await instagram("me", { fields: "id,username" });
  if (String(identity.username || "").toLowerCase() !== expectedAccount) {
    throw new Error("El token no pertany a @viajaconcabeza. No es modificarà el feed.");
  }

  // Meta pot restringir alguns camps segons el tipus d'autorització.
  let page;
  const fields = "id,media_type,media_url,thumbnail_url,permalink,timestamp,caption,children{media_type,media_url,thumbnail_url}";
  try {
    page = await instagram("me/media", { fields, limit: "12" });
  } catch {
    page = await instagram("me/media", {
      fields: "id,media_type,media_url,thumbnail_url,permalink,timestamp", limit: "12"
    });
  }

  const posts = (Array.isArray(page.data) ? page.data : [])
    .sort((a, b) => Date.parse(b.timestamp || 0) - Date.parse(a.timestamp || 0))
    .map(media => {
      const permalink = instagramPostLink(media.permalink);
      const thumbnail_url = imageOf(media);
      if (!permalink || !thumbnail_url) return null;
      return {
        permalink,
        thumbnail_url,
        caption: String(media.caption || "").replace(/\s+/g, " ").trim().slice(0, 240),
        alt: `Publicación de @${expectedAccount} en Instagram`,
        type: media.media_type === "VIDEO" ? "reel" : "post"
      };
    })
    .filter(Boolean).slice(0, 5);

  if (!posts.length) throw new Error("La API no ha retornat publicacions amb imatge vàlida.");
  let old = {};
  try { old = JSON.parse(await readFile(file, "utf8")); } catch { /* primer ús */ }
  const updated = {
    connected: true,
    account: expectedAccount,
    posts,
    post: posts[0],
    updated_at: old.updated_at || new Date().toISOString()
  };
  if (old.connected === true && JSON.stringify(old.posts) === JSON.stringify(posts)) {
    console.log("Instagram: feed vigent, cap canvi necessari.");
    return;
  }
  updated.updated_at = new Date().toISOString();
  await writeFile(file, JSON.stringify(updated, null, 2) + "\n", "utf8");
  console.log(`Instagram: ${posts.length} publicacions reals actualitzades.`);
}

await update();
