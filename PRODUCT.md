# Product

## Register

product

## Users

Moviegoers in Vietnam (VN-first UI, bilingual titles) booking cinema tickets online: browsing what's showing, picking showtimes/seats, paying (VNPAY), and getting AI-personalized movie recommendations. Secondary users: cinema staff (check-in) and admins (catalog/cinema/system management) working in dedicated dashboard layouts.

## Product Purpose

CinePremier (SBA301 CinemaMS) is a full-stack cinema management & booking platform: React (Vite) frontend, Spring Boot backend, Python FastAPI AI recommendation service. Success = a smooth browse → detail → book → pay flow, with recommendations that show real, trustworthy match percentages (user explicitly rejected decorative/fake numbers).

## Brand Personality

Sang trọng — điện ảnh — tối giản (luxurious, cinematic, minimal). A boutique premium cinema feel: black canvas, thin 1px white/10 borders, sharp corners (no rounded cards), serif italics for titles against tracked-uppercase Inter labels, ambient gold/purple radial glows on pure black.

## Anti-references

- Generic multiplex booking sites (CGV-style dense promo grids, loud red/yellow).
- Default third-party widget styling breaking the theme (e.g. stock white Google button in the dark auth modal).
- Fake credibility numbers ("99% match" hardcoded) — every displayed score must come from real data.

## Design Principles

1. **Editorial darkness**: pure black surfaces, hairline borders, generous spacing; light is the accent, not the base.
2. **Typography does the luxury**: serif italic display + uppercase tracked micro-labels (text-[9px]–[11px], tracking 0.15–0.25em); no gradient text, no decorative effects on copy.
3. **Evidence over decoration**: numbers shown to users (ratings, match %) are computed, and their basis is stated in a caption.
4. **Square and sharp**: rectangular buttons/cards, 1px borders (white/10 idle → white/40 hover), solid purple-600 or white fills for primary actions.
5. **Third-party elements adopt the house style** — never the other way around.

## Accessibility & Inclusion

No formal WCAG target set (university project), but keep: body text ≥ 4.5:1 on black (neutral-200 or lighter for prose; neutral-500 only for de-emphasized captions on black), focus states on interactive elements, `prefers-reduced-motion` respected for nonessential animation.
