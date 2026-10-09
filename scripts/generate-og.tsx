/**
 * Build-time Open Graph image generator.
 *
 * Runs on the build machine before every web build. Satori lays the card out
 * as SVG and sharp rasterizes it. Emits one PNG per locale to public/og/,
 * which the root layout references. Inter comes from the bundled résumé
 * fonts, which carry Latin Extended and Cyrillic for every locale.
 *   pnpm generate:og
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import satori from "satori";
import sharp from "sharp";
import { routing } from "../src/i18n/routing";
import { BRAND, MARK_SVG } from "./build-brand";

interface Messages {
  hero: {
    headingLine1: string;
    headingLine2: string;
    badge: string;
  };
  platform: { sidebar: { tagline: string } };
  features: { languagesTitle: string };
}

const ROOT = process.cwd();
const SIZE = { width: 1200, height: 630 };
const MUTED = "#B9B7D9";

const MARK_SRC = `data:image/svg+xml;base64,${Buffer.from(MARK_SVG).toString("base64")}`;

const interBold = readFileSync(join(ROOT, "public/fonts/Inter-Bold.ttf"));
const interRegular = readFileSync(join(ROOT, "public/fonts/Inter-Regular.ttf"));

function readMessages(locale: string): Messages {
  return JSON.parse(
    readFileSync(join(ROOT, "messages", `${locale}.json`), "utf8"),
  );
}

function OgImage(props: { messages: Messages }) {
  const { hero, platform, features } = props.messages;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "80px",
        background: BRAND.indigo,
        color: BRAND.white,
        fontFamily: "Inter",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <div
          style={{
            display: "flex",
            borderRadius: "26px",
            border: "3px solid rgba(255,255,255,0.22)",
          }}
        >
          <img src={MARK_SRC} width={96} height={96} alt="" />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{ fontSize: 72, fontWeight: 700, letterSpacing: "-2px" }}
          >
            Kast
          </span>
          <span style={{ fontSize: 26, color: MUTED }}>
            {platform.sidebar.tagline}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <span
          style={{
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.08,
            maxWidth: "980px",
            letterSpacing: "-1px",
          }}
        >
          {hero.headingLine1} {hero.headingLine2}
        </span>
        <div
          style={{
            width: "96px",
            height: "6px",
            marginTop: "32px",
            marginBottom: "24px",
            borderRadius: "3px",
            background: BRAND.amber,
          }}
        />
        <span style={{ fontSize: 26, color: MUTED }}>
          {`${hero.badge} · ${features.languagesTitle}`}
        </span>
      </div>
    </div>
  );
}

async function main() {
  const outDir = join(ROOT, "public", "og");
  mkdirSync(outDir, { recursive: true });

  for (const locale of routing.locales) {
    const messages = readMessages(locale);
    const svg = await satori(<OgImage messages={messages} />, {
      ...SIZE,
      fonts: [
        { name: "Inter", data: interRegular, weight: 400, style: "normal" },
        { name: "Inter", data: interBold, weight: 700, style: "normal" },
      ],
    });
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    writeFileSync(join(outDir, `${locale}.png`), png);
    console.log(
      `  ✓ public/og/${locale}.png (${(png.length / 1024).toFixed(1)} KiB)`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
