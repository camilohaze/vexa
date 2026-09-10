import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicLayout } from './public-layout';

interface FeatureCard {
  icon: string;
  wrapped: boolean;
  title: string;
  text: string;
}

interface FeatureSection {
  badge: string;
  title: string;
  subtitle: string;
  alt: boolean;
  rows: FeatureCard[][];
}

@Component({
  selector: 'vexa-features',
  imports: [RouterLink, PublicLayout],
  template: `
    <vexa-public-layout>
      <section class="hero">
        <span class="pill">THE VEXA SUITE</span>
        <h1 class="hero__title">Everything you need to move things fast</h1>
        <p class="hero__text">
          A single subscription-free logistics marketplace connecting local shippers, professional
          independent couriers, and dispatch managers on one clean dashboard.
        </p>
        <div class="hero__ctas">
          <a routerLink="/auth/register" class="btn btn--primary">Join Waitlist</a>
          <a routerLink="/how-it-works" class="btn btn--outline">How It Works</a>
        </div>
      </section>

      @for (section of sections; track section.title) {
        <section class="section" [class.section--alt]="section.alt">
          <div class="section__header">
            <span class="pill">{{ section.badge }}</span>
            <h2 class="section__title">{{ section.title }}</h2>
            <p class="section__subtitle">{{ section.subtitle }}</p>
          </div>
          <div class="grid">
            @for (row of section.rows; track $index) {
              <div class="grid__row">
                @for (card of row; track card.title) {
                  <article class="card">
                    @if (card.wrapped) {
                      <div class="card__icon-wrap"><img [src]="card.icon" alt="" /></div>
                    } @else {
                      <img [src]="card.icon" alt="" class="card__icon" />
                    }
                    <div class="card__content">
                      <h3>{{ card.title }}</h3>
                      <p>{{ card.text }}</p>
                    </div>
                  </article>
                }
              </div>
            }
          </div>
        </section>
      }

      <section class="cta">
        <div class="cta__text">
          <h2>Logistics built for modern marketplaces</h2>
          <p>Vexa is completely free for all companies, independent bicycle couriers, and clients. Discover stress-free routing dispatch operations today.</p>
        </div>
        <div class="cta__buttons">
          <a routerLink="/auth/register" class="btn btn--white">Get Started Free</a>
          <a routerLink="/resources" class="btn btn--ghost">Talk to Operations</a>
        </div>
      </section>
    </vexa-public-layout>
  `,
  styles: `
    :host { display: block; font-family: 'Inter', sans-serif; }
    a { text-decoration: none; }
    h1, h2, h3, p { margin: 0; }

    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 14px 28px; border-radius: 16px; font-size: 14px; font-weight: 700; line-height: normal; white-space: nowrap; }
    .btn--primary { background: #2563eb; color: #fff; }
    .btn--primary:hover { background: #1d4ed8; }
    .btn--outline { color: #111827; border: 1.5px solid #e2e8f0; }
    .btn--white { background: #fff; color: #2563eb; }
    .btn--ghost { color: #fff; border: 1.5px solid rgba(255, 255, 255, 0.3); }

    .pill { display: inline-flex; padding: 6px 16px; border-radius: 99px; background: #eff6ff; border: 1px solid #dce9fe; font-size: 11px; font-weight: 800; color: #2563eb; line-height: normal; white-space: nowrap; }

    .hero { display: flex; flex-direction: column; gap: 24px; align-items: center; padding: 112px 80px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: center; }
    .hero__title { font-size: 48px; font-weight: 800; color: #111827; line-height: 56px; }
    .hero__text { width: 100%; max-width: 760px; font-size: 16px; font-weight: 400; color: #4b5563; line-height: 26px; }
    .hero__ctas { display: flex; gap: 16px; padding-top: 12px; flex-wrap: wrap; justify-content: center; }

    .section { display: flex; flex-direction: column; gap: 64px; align-items: flex-start; padding: 112px 80px; background: #fff; }
    .section--alt { background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
    .section__header { display: flex; flex-direction: column; gap: 16px; align-items: center; width: 100%; text-align: center; }
    .section__title { font-size: 32px; font-weight: 800; color: #111827; line-height: 40px; }
    .section__subtitle { width: 100%; max-width: 680px; font-size: 16px; font-weight: 400; color: #4b5563; line-height: 26px; }

    .grid { display: flex; flex-direction: column; gap: 24px; width: 100%; }
    .grid__row { display: flex; gap: 24px; align-items: stretch; width: 100%; }
    .card { flex: 1 0 0; min-width: 1px; display: flex; flex-direction: column; gap: 20px; align-items: flex-start; padding: 32px; border-radius: 16px; background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.01); }
    .card__icon { width: 48px; height: 48px; display: block; }
    .card__icon-wrap { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: #eff6ff; }
    .card__icon-wrap img { width: 24px; height: 24px; display: block; }
    .card__content { display: flex; flex-direction: column; gap: 8px; width: 100%; }
    .card h3 { font-size: 18px; font-weight: 700; color: #111827; line-height: 24px; }
    .card p { font-size: 14px; font-weight: 400; color: #4b5563; line-height: 22px; }

    .cta { display: flex; flex-direction: column; gap: 32px; align-items: center; padding: 96px 80px; background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%); }
    .cta__text { display: flex; flex-direction: column; gap: 16px; align-items: center; text-align: center; width: 100%; max-width: 720px; }
    .cta h2 { font-size: 36px; font-weight: 800; color: #fff; line-height: normal; }
    .cta p { font-size: 16px; font-weight: 400; color: #eff6ff; line-height: 26px; }
    .cta__buttons { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }

    @media (max-width: 1100px) {
      .hero, .section, .cta { padding-left: 24px; padding-right: 24px; }
      .hero { padding-top: 72px; padding-bottom: 72px; }
      .section { padding-top: 80px; padding-bottom: 80px; }
      .hero__title { font-size: 36px; line-height: 44px; }
      .grid__row { flex-direction: column; }
    }
  `,
})
export class Features {
  readonly sections: FeatureSection[] = [
    {
      badge: 'FOR COMPANIES',
      title: 'Scale your deliveries without the overhead',
      subtitle: 'Coordinate instant dispatches, track precious cargo globally, and eliminate expensive delivery contract models completely.',
      alt: false,
      rows: [
        [
          { icon: '/products/send.svg', wrapped: true, title: 'Post Deliveries in Seconds', text: 'Quickly declare cargo dimensions, route destinations, and pick timelines with zero subscription gating.' },
          { icon: '/products/wrap-gps.svg', wrapped: false, title: 'Real-Time GPS Tracking', text: 'Get real-time tracking logs. Share white-labeled progress maps seamlessly with your clients.' },
          { icon: '/products/wrap-verified.svg', wrapped: false, title: 'Verified Courier Network', text: 'Match routes directly with vetted independent local partners who complete background screenings.' },
        ],
        [
          { icon: '/products/wrap-analytics.svg', wrapped: false, title: 'Analytics & Reporting', text: 'Observe delivery performance trends, monitor courier feedback ratings, and optimize regional costs.' },
          { icon: '/products/file-text.svg', wrapped: true, title: 'Automated Invoicing', text: 'Generate crisp structural digital invoices instantly after delivery verification photographs.' },
        ],
      ],
    },
    {
      badge: 'FOR INDEPENDENT COURIERS',
      title: 'Deliver on your own terms',
      subtitle: 'Keep 100% of your earnings. Motorized partners pay a tiny flat transaction fee only when completing a job. Zero subscription overhead.',
      alt: true,
      rows: [
        [
          { icon: '/products/wrap-browse.svg', wrapped: false, title: 'Browse Available Jobs', text: 'Filter nearby local delivery bids matching your current vehicle category on demand.' },
          { icon: '/products/calendar.svg', wrapped: true, title: 'Flexible Schedule', text: 'Accept delivery runs when you want, where you want. You are your own dispatch operations coordinator.' },
          { icon: '/products/wrap-earnings.svg', wrapped: false, title: 'Instant Earnings', text: 'Vexa disperses completed route payouts immediately straight to your secure digital wallet.' },
        ],
        [
          { icon: '/products/award.svg', wrapped: true, title: 'Performance Tracking', text: 'Watch your client rating ladder climb, unlock high-priority routing slots, and expand operations.' },
          { icon: '/products/compass.svg', wrapped: true, title: 'Route Optimization', text: 'Let our structural maps stack multiple drops logically to maximize your hourly earnings yield.' },
        ],
      ],
    },
    {
      badge: 'FOR MANAGERS & ADMINS',
      title: 'Full control, zero headaches',
      subtitle: 'Administer courier onboarding flows, monitor system health SLAs, audit escrow releases, and resolve customer support queries instantly.',
      alt: false,
      rows: [
        [
          { icon: '/products/users.svg', wrapped: true, title: 'Platform Oversight', text: 'Keep complete operational confidence over dispatcher registrations, ratings, and driver onboarding pipelines.' },
          { icon: '/products/package.svg', wrapped: true, title: 'User & Delivery Management', text: 'Intervene to adjust routing conflicts, re-assign stranded parcels, or resolve active claims instantly.' },
          { icon: '/products/shield.svg', wrapped: true, title: 'Financial Controls', text: 'Oversee marketplace transaction pipelines, motorized flat-fee margins, and payout disbursements.' },
        ],
        [
          { icon: '/products/alert-triangle.svg', wrapped: true, title: 'Fraud Detection', text: 'Our security models verify location data and photo receipts continuously to detect discrepancies.' },
          { icon: '/products/help-circle.svg', wrapped: true, title: 'Support Tools', text: 'Equip your operations leads with complete system oversight logs and real-time chat terminals.' },
        ],
      ],
    },
  ];
}
