# Artewu s.r.o. — web

Firemní web Artewu s.r.o. — truhlářství a vývoj software. Postavený na **Astro 6 + React 19 + Tailwind v4 + MDX**.

## 📁 Struktura projektu

```text
/
├── _server/                      # konfigurace webserverů pro deploy
│   ├── nginx/artewu.com.conf
│   └── apache/artewu.com.conf
├── bin/
│   └── deploy.sh                 # deploy skript (nginx/apache detekce)
├── public/                       # statika kopírovaná 1:1 (favicon apod.)
├── src/
│   ├── assets/                   # obrázky importované do .astro/.tsx
│   ├── components/
│   │   ├── BlogCard.astro
│   │   ├── Footer.astro
│   │   └── Header.tsx            # navigace (React, mobile hamburger)
│   ├── content/
│   │   └── blog/                 # 👉 zde se zakládají blog příspěvky (.mdx)
│   ├── content.config.ts         # schema content collections
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── index.astro           # úvodní stránka
│   │   ├── truhlarstvi.astro
│   │   ├── vyvoj-software.astro
│   │   ├── kontakt.astro
│   │   └── blog/
│   │       ├── index.astro       # výpis realizací s filtrem
│   │       └── [...slug].astro   # detail příspěvku
│   └── styles/global.css         # Tailwind v4 + brand theme
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## ✍️ Jak přidat blog příspěvek (realizaci)

Příspěvky leží v **`src/content/blog/`** jako MDX. Schema je v [src/content.config.ts](src/content.config.ts).

Podporujeme dva tvary — funguje obojí, slug v URL je stejný:

**A) Krátký post bez vlastních příloh** — jediný soubor:
```
src/content/blog/nazev-prispevku.mdx
```

**B) Post s vlastními obrázky** — vlastní složka (doporučeno):
```
src/content/blog/nazev-prispevku/
├── index.mdx
├── detail-1.jpg
└── detail-2.jpg
```
V MDX se na lokální obrázky odkážeš relativně:

```mdx
![Detail dvířek](./detail-1.jpg)
```

### Povinné frontmatter pole

```mdx
---
title: "Kuchyňská linka z masivního dubu"
description: "Krátký popis pod nadpis, do náhledové karty i meta description."
date: 2025-09-15
category: "truhlarstvi"        # "truhlarstvi" | "software"
cover: "https://.../foto.jpg"  # nebo cesta k obrázku, volitelné
gallery:                       # volitelné, ukáže se dole jako galerie
  - "https://.../foto-1.jpg"
  - "https://.../foto-2.jpg"
tags: ["kuchyně", "dub"]       # volitelné
---
```

Nový příspěvek se sám objeví na `/blog`, ve filtru podle kategorie a v sekci „Vybrané realizace" na příslušné rozcestníkové stránce (`/truhlarstvi`, `/vyvoj-software`) i na homepage (3 nejnovější).

## 🧞 Příkazy

Vše z rootu projektu:

| Příkaz           | Co dělá                                                  |
| :--------------- | :------------------------------------------------------- |
| `pnpm install`   | Nainstaluje závislosti                                   |
| `pnpm dev`       | Dev server na `localhost:4321` (HMR)                     |
| `pnpm build`     | Produkční build do `./dist/`                             |
| `pnpm preview`   | Lokální preview produkčního buildu                       |
| `pnpm deploy`    | Nasadí konfiguraci webserveru (vyžaduje sudo, viz níže)  |
| `pnpm astro ...` | Astro CLI (`astro add`, `astro check`, …)                |

> **Pozn.:** Když přidáš MDX soubor / upravíš `content.config.ts`, dev server **restartuj** — content collection se inicializuje při startu.

## 🚀 Nasazení na server

Předpokládá se, že na serveru je `nginx` **nebo** `apache2` (skript si detekuje, který) a uživatel má `sudo`.

```bash
# 1. checkout do /srv/www
cd /srv/www
git clone <repo-url> artewu.com
cd artewu.com

# 2. závislosti + build
pnpm install
pnpm build

# 3. nasazení webserver configu (vyžádá si sudo)
pnpm deploy
```

Co skript [bin/deploy.sh](bin/deploy.sh) udělá:

1. Ověří existenci `dist/index.html`.
2. Detekuje webserver podle `/etc/nginx/sites-available` nebo `/etc/apache2/sites-available`.
3. Vezme `_server/<nginx|apache>/artewu.com.conf`, nahradí v něm `__WEBROOT__` skutečnou cestou k `dist/` a zapíše do `sites-available/`.
4. Předchozí verzi zazálohuje jako `*.bak.<timestamp>`.
5. Vytvoří/aktualizuje symlink v `sites-enabled/`.
6. Otestuje syntaxi (`nginx -t` / `apache2ctl configtest`).
7. Reloadne službu (`systemctl reload nginx|apache2`).

### Pro Apache jednorázově povol moduly

```bash
sudo a2enmod rewrite headers expires deflate
sudo systemctl reload apache2
```

### HTTPS přes Let's Encrypt

Po prvním nasazení (config zatím poslouchá jen na portu 80):

```bash
# nginx
sudo certbot --nginx -d artewu.com -d www.artewu.com
# nebo apache
sudo certbot --apache -d artewu.com -d www.artewu.com
```

Certbot si konfigurák sám upraví a obnovu si zařídí systémovým timerem.

### Aktualizace obsahu (běžný redeploy)

```bash
cd /srv/www/artewu
git pull
pnpm install   # jen pokud se měnily závislosti
pnpm build
# pnpm deploy NEPOTŘEBUJEME — webserver servíruje stejný dist/
```

Webserver ukazuje na `dist/`, takže stačí znovu sestavit. `pnpm deploy` voláme jen když se mění **konfigurace webserveru** v `_server/`.

## 🎨 Design tokens

Brand paleta a fonty se ladí v [src/styles/global.css](src/styles/global.css) v bloku `@theme`. Pak jsou dostupné jako `bg-brand-700`, `text-brand-900` apod. v celé aplikaci.
