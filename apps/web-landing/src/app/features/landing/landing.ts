import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicLayout } from '../public/public-layout';

@Component({
  selector: 'vexa-landing',
  imports: [RouterLink, PublicLayout],
  template: `
    <vexa-public-layout>
      <section class="hero">
        <div class="hero__left">
          <div class="hero__headlines">
            <div class="hero__badge">
              <span class="hero__badge-tag">VEXA v2.0</span>
              <span class="hero__badge-text">Local shipping has never been easier</span>
            </div>
            <h1 class="hero__title">Your deliveries,<br />handled.</h1>
            <p class="hero__text">
              No subscription tiers. No tricky contracts. Vexa matches businesses directly with
              vetted local independent couriers for instant, stress-free dispatch.
            </p>
          </div>
          <div class="hero__cta">
            <a routerLink="/auth/register" class="btn btn--primary">Start Shipping Free</a>
            <a routerLink="/auth/register" class="btn btn--outline">Join as Courier</a>
          </div>
          <div class="hero__social">
            <div class="hero__avatars">
              <img src="/avatar-1.png" alt="" />
              <img src="/avatar-2.png" alt="" />
              <img src="/avatar-3.png" alt="" />
            </div>
            <p>Join <strong>500+ active businesses</strong> and couriers scaling routes today.</p>
          </div>
        </div>
        <div class="hero__right">
          <div class="hero__chrome">
            <div class="hero__chrome-route">
              <img src="/dot-green.svg" alt="" class="hero__chrome-dot" />
              <span class="hero__chrome-title">Active Dispatch — Route #994A</span>
            </div>
            <span class="hero__chrome-time">12 min to drop-off</span>
          </div>
          <div class="hero__map">
            <img src="/hero-map.png" alt="Vexa route map" />
          </div>
        </div>
      </section>

      <section class="trusted">
        <p class="trusted__label">Powering deliveries for high-growth logistics leaders</p>
        <div class="trusted__strip">
          <span>FedEx</span>
          <span>DHL</span>
          <span>ShipBob</span>
          <span>Enterprise Labs</span>
          <span>NextDay</span>
        </div>
      </section>

      <section id="how-it-works" class="how">
        <div class="section-header section-header--center">
          <span class="pill pill--blue">SUPER SIMPLE STEPS</span>
          <h2 class="section-title">How Vexa Works</h2>
          <p class="section-subtitle">
            Your end-to-end local delivery cycle is fully configured and dispatched in under 5 minutes.
          </p>
        </div>
        <div class="how__grid">
          <article class="step-card">
            <span class="step-card__number">01</span>
            <div class="step-card__body">
              <h3>Post a Delivery Job</h3>
              <p>Quickly drop in package size, pickup address, and timeline. Get instant transparent pricing calculation immediately.</p>
            </div>
          </article>
          <article class="step-card">
            <span class="step-card__number">02</span>
            <div class="step-card__body">
              <h3>Couriers Accept</h3>
              <p>Your post is instantly broadcasted to trusted independent local courier partners who match your delivery criteria.</p>
            </div>
          </article>
          <article class="step-card">
            <span class="step-card__number">03</span>
            <div class="step-card__body">
              <h3>Track &amp; Confirm</h3>
              <p>Watch the GPS progress real-time on your dashboard. Deliveries are finalized with reliable photo-proof verification.</p>
            </div>
          </article>
        </div>
      </section>

      <section id="features" class="features">
        <div class="section-header">
          <h2 class="section-title">Engineered for high performance</h2>
          <p class="section-subtitle">
            Powerful real-time dashboard tracking features offering complete visibility and control over local parcel routing.
          </p>
        </div>
        <div class="features__grid">
          <article class="feat-card">
            <img src="/icon-tracking.svg" alt="" class="feat-card__icon" />
            <div class="feat-card__body">
              <h3>Real-Time Tracking</h3>
              <p>High-frequency live GPS map pings. Keep your clients in the loop with white-labeled shareable delivery progress screens.</p>
            </div>
          </article>
          <article class="feat-card">
            <img src="/icon-payouts.svg" alt="" class="feat-card__icon" />
            <div class="feat-card__body">
              <h3>Instant Payouts &amp; Low Fees</h3>
              <p>Escrow pipelines dispatch courier payments immediately. Motorized drivers pay a tiny fixed flat fee per accepted job.</p>
            </div>
          </article>
          <article class="feat-card">
            <img src="/icon-couriers.svg" alt="" class="feat-card__icon" />
            <div class="feat-card__body">
              <h3>Fully Verified Couriers</h3>
              <p>Safe deliveries require verified handlers. All couriers complete background checks, local vehicle screening, and rank evaluations.</p>
            </div>
          </article>
          <article class="feat-card">
            <img src="/icon-dashboard.svg" alt="" class="feat-card__icon" />
            <div class="feat-card__body">
              <h3>Analytics Dashboard</h3>
              <p>Optimize routing patterns, monitor couriers' average dispatch timings, log success SLA rates, and reduce logistical drag.</p>
            </div>
          </article>
        </div>
      </section>

      <section class="stats">
        <div class="stat"><span class="stat__number">10K+</span><span class="stat__label">Deliveries Completed</span></div>
        <div class="stat"><span class="stat__number">500+</span><span class="stat__label">Active Companies</span></div>
        <div class="stat"><span class="stat__number">2,000+</span><span class="stat__label">Vetted Couriers</span></div>
        <div class="stat"><span class="stat__number">99.5%</span><span class="stat__label">Success SLA Rate</span></div>
      </section>

      <section id="why" class="why">
        <div class="section-header section-header--center">
          <span class="pill pill--amber">THE VEXA DIFFERENCE</span>
          <h2 class="section-title">Why Choose Vexa?</h2>
          <p class="section-subtitle">
            Fair, direct logistics built specifically for modern companies and independent local couriers.
          </p>
        </div>
        <div class="why__grid">
          <article class="why-card">
            <img src="/icon-payouts.svg" alt="" class="why-card__icon" />
            <div class="why-card__body">
              <h3>Who We Are</h3>
              <p>A pure logistics peer-to-peer marketplace. We bring local businesses and independent couriers into one room. Zero middlemen means zero hidden markup.</p>
            </div>
          </article>
          <article class="why-card">
            <img src="/icon-route.svg" alt="" class="why-card__icon" />
            <div class="why-card__body">
              <h3>How We Work</h3>
              <p>Companies post delivery jobs. Nearby couriers pick up shifts on demand. Live tracking updates keep both ends transparent from warehouse to front porch.</p>
            </div>
          </article>
          <article class="why-card">
            <img src="/icon-couriers.svg" alt="" class="why-card__icon" />
            <div class="why-card__body">
              <h3>Completely Subscription Free</h3>
              <p>Free for all businesses, bicycle couriers, and clients. Motorized courier partners pay a tiny, flat per-job transaction fee only when completing a route.</p>
            </div>
          </article>
        </div>
      </section>

      <section class="cta">
        <div class="cta__text">
          <h2>Ready to simplify your local logistics?</h2>
          <p>Join hundreds of companies and independent couriers maximizing their weekly logistics throughput. Start completely free today.</p>
        </div>
        <div class="cta__buttons">
          <a routerLink="/auth/register" class="btn btn--white">Get Started Free</a>
          <a routerLink="/resources" class="btn btn--ghost">Talk to Us</a>
        </div>
      </section>
    </vexa-public-layout>
  `,
  styles: `
    :host { display: block; font-family: 'Inter', sans-serif; }
    a { text-decoration: none; }
    h1, h2, h3, p { margin: 0; }

    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 14px 28px; border-radius: 16px; font-size: 14px; font-weight: 700; line-height: normal; white-space: nowrap; }
    .btn--primary { background: #2563eb; color: #fff; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.13); }
    .btn--primary:hover { background: #1d4ed8; }
    .btn--outline { background: transparent; color: #111827; border: 1.5px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02); }
    .btn--outline:hover { border-color: #cbd5e1; }
    .btn--white { background: #fff; color: #2563eb; }
    .btn--ghost { color: #fff; border: 1.5px solid rgba(255, 255, 255, 0.3); }

    .pill { display: inline-flex; padding: 6px 16px; border-radius: 99px; font-size: 11px; font-weight: 800; line-height: normal; white-space: nowrap; }
    .pill--blue { background: #eff6ff; color: #2563eb; }
    .pill--amber { background: #fef3c7; color: #f59e0b; }

    .section-header { display: flex; flex-direction: column; gap: 16px; align-items: flex-start; width: 100%; max-width: 640px; }
    .section-header--center { align-items: center; text-align: center; margin: 0 auto; }
    .section-title { font-size: 38px; font-weight: 400; color: #111827; line-height: normal; }
    .section-subtitle { font-size: 16px; font-weight: 400; color: #4b5563; line-height: 26px; }

    .hero { display: flex; align-items: center; gap: 80px; padding: 112px 80px; }
    .hero__left { flex: 1 0 0; min-width: 1px; display: flex; flex-direction: column; gap: 40px; align-items: flex-start; }
    .hero__headlines { display: flex; flex-direction: column; gap: 24px; align-items: flex-start; width: 100%; }
    .hero__badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 99px; background: #eff6ff; border: 1px solid #dce9fe; white-space: nowrap; }
    .hero__badge-tag { font-size: 11px; font-weight: 800; color: #2563eb; line-height: normal; }
    .hero__badge-text { font-size: 13px; font-weight: 600; color: #4b5563; line-height: normal; }
    .hero__title { font-size: 58px; font-weight: 400; color: #111827; line-height: 66px; }
    .hero__text { font-size: 18px; font-weight: 400; color: #4b5563; line-height: 28px; }
    .hero__cta { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
    .hero__social { display: flex; align-items: center; gap: 16px; width: 100%; }
    .hero__avatars { display: flex; align-items: flex-start; }
    .hero__avatars img { width: 40px; height: 40px; border-radius: 50%; display: block; }
    .hero__avatars img:not(:last-child) { margin-right: -12px; }
    .hero__social p { flex: 1 0 0; min-width: 1px; font-size: 14px; font-weight: 600; color: #4b5563; line-height: normal; }
    .hero__social strong { font-weight: 800; color: #2563eb; }
    .hero__right { display: flex; flex-direction: column; gap: 16px; align-items: flex-start; width: 580px; height: 480px; flex-shrink: 0; padding: 24px; border-radius: 24px; background: #f8fafc; border: 1px solid #e2e8f0; box-shadow: 0 16px 32px rgba(0, 0, 0, 0.04); overflow: hidden; }
    .hero__chrome { display: flex; align-items: flex-start; justify-content: space-between; width: 100%; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
    .hero__chrome-route { display: flex; align-items: center; gap: 8px; }
    .hero__chrome-dot { width: 8px; height: 8px; display: block; }
    .hero__chrome-title { font-size: 12px; font-weight: 700; color: #111827; line-height: normal; white-space: nowrap; }
    .hero__chrome-time { font-size: 12px; font-weight: 700; color: #2563eb; line-height: normal; white-space: nowrap; }
    .hero__map { flex: 1 0 0; min-height: 1px; width: 100%; position: relative; border-radius: 16px; overflow: hidden; }
    .hero__map img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 16px; display: block; }

    .trusted { display: flex; flex-direction: column; gap: 28px; align-items: center; padding: 56px 80px; background: #f8fafc; }
    .trusted__label { font-size: 12px; font-weight: 800; color: #9ca3af; text-transform: uppercase; line-height: normal; white-space: nowrap; }
    .trusted__strip { display: flex; align-items: center; justify-content: center; gap: 72px; width: 100%; flex-wrap: wrap; font-size: 20px; font-weight: 800; color: #bcc5d1; line-height: normal; white-space: nowrap; }

    .how { display: flex; flex-direction: column; gap: 64px; align-items: center; padding: 120px 80px; background: #fff; }
    .how__grid { display: flex; gap: 24px; align-items: flex-start; width: 100%; }
    .step-card { flex: 1 0 0; min-width: 1px; display: flex; flex-direction: column; gap: 24px; align-items: flex-start; padding: 36px; border-radius: 24px; background: #f8fafc; border: 1px solid #e2e8f0; }
    .step-card__number { font-size: 48px; font-weight: 900; color: #2563eb; line-height: normal; white-space: nowrap; }
    .step-card__body { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .step-card h3 { font-size: 20px; font-weight: 800; color: #111827; line-height: normal; }
    .step-card p { font-size: 14px; font-weight: 400; color: #4b5563; line-height: 22px; }

    .features { display: flex; flex-direction: column; gap: 64px; align-items: flex-start; padding: 120px 80px; background: #f8fafc; }
    .features__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; width: 100%; }
    .feat-card { display: flex; gap: 24px; align-items: flex-start; padding: 32px; border-radius: 20px; background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.01); }
    .feat-card__icon { width: 48px; height: 48px; flex-shrink: 0; display: block; }
    .feat-card__body { flex: 1 0 0; min-width: 1px; display: flex; flex-direction: column; gap: 8px; }
    .feat-card h3 { font-size: 18px; font-weight: 800; color: #111827; line-height: normal; }
    .feat-card p { font-size: 14px; font-weight: 400; color: #4b5563; line-height: 22px; }

    .stats { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; padding: 72px 80px; background: #2563eb; flex-wrap: wrap; }
    .stat { display: flex; flex-direction: column; gap: 8px; align-items: center; white-space: nowrap; }
    .stat__number { font-size: 42px; font-weight: 900; color: #fff; line-height: normal; }
    .stat__label { font-size: 14px; font-weight: 600; color: #dbeafe; line-height: normal; }

    .why { display: flex; flex-direction: column; gap: 64px; align-items: center; padding: 120px 80px; background: #fff; }
    .why__grid { display: flex; gap: 24px; align-items: flex-start; width: 100%; }
    .why-card { flex: 1 0 0; min-width: 1px; display: flex; flex-direction: column; gap: 24px; align-items: flex-start; padding: 36px; border-radius: 24px; background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 8px 12px rgba(0, 0, 0, 0.02); }
    .why-card__icon { width: 48px; height: 48px; display: block; }
    .why-card__body { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .why-card h3 { font-size: 18px; font-weight: 800; color: #111827; line-height: normal; }
    .why-card p { font-size: 14px; font-weight: 400; color: #4b5563; line-height: 22px; }

    .cta { display: flex; flex-direction: column; gap: 32px; align-items: center; padding: 96px 80px; background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%); }
    .cta__text { display: flex; flex-direction: column; gap: 16px; align-items: center; text-align: center; width: 100%; max-width: 720px; }
    .cta h2 { font-size: 36px; font-weight: 400; color: #fff; line-height: normal; }
    .cta p { font-size: 16px; font-weight: 400; color: #dbeafe; line-height: 26px; }
    .cta__buttons { display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap; justify-content: center; }

    @media (max-width: 1100px) {
      .hero { flex-direction: column; gap: 48px; padding: 64px 24px; }
      .hero__right { width: 100%; height: auto; min-height: 420px; }
      .trusted, .how, .features, .stats, .why, .cta { padding-left: 24px; padding-right: 24px; }
      .how, .features, .why { padding-top: 80px; padding-bottom: 80px; }
      .how__grid, .why__grid { flex-direction: column; }
      .step-card, .why-card { width: 100%; }
      .features__grid { grid-template-columns: 1fr; }
      .stats { justify-content: center; gap: 40px; }
      .hero__title { font-size: 44px; line-height: 52px; }
      .section-title { font-size: 32px; }
    }
  `,
})
export class Landing {}
