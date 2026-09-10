import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PublicLayout } from './public-layout';

interface ResourceCard {
  icon: string;
  title: string;
  text: string;
  links: string[];
}

interface Article {
  image: string;
  tag: string;
  title: string;
  text: string;
}

@Component({
  selector: 'vexa-support',
  imports: [FormsModule, RouterLink, PublicLayout],
  template: `
    <vexa-public-layout>
      <section class="hero">
        <div class="hero__text">
          <span class="pill">Vexa Help Center</span>
          <h1 class="hero__title">Need help? We got you.</h1>
          <p class="hero__subtitle">
            Find step-by-step guides, marketplace rules, and support articles built to get your
            courier dispatch and shipments running smoothly.
          </p>
        </div>
        <form class="search" (ngSubmit)="search()">
          <img src="/resources/search.svg" alt="" class="search__icon" />
          <input
            class="search__input"
            type="search"
            name="q"
            [(ngModel)]="query"
            placeholder="Search help articles, guides, and FAQ..."
            autocomplete="off"
          />
          <button type="submit" class="search__button">Search</button>
        </form>
      </section>

      <section class="resources">
        <div class="resources__header">
          <span class="eyebrow">Explore Directories</span>
          <h2 class="resources__title">Knowledge base at your fingertips</h2>
        </div>
        <div class="resources__grid">
          @for (card of resourceCards; track card.title) {
            <article class="resource">
              <div class="resource__icon"><img [src]="card.icon" alt="" /></div>
              <div class="resource__body">
                <h3>{{ card.title }}</h3>
                <p>{{ card.text }}</p>
              </div>
              <div class="resource__links">
                @for (link of card.links; track link) {
                  <a routerLink="/resources" [fragment]="slug(link)">
                    <span>{{ link }}</span>
                    <img src="/resources/arrow-right-14.svg" alt="" />
                  </a>
                }
              </div>
            </article>
          }
        </div>
      </section>

      <section class="news">
        <div class="news__header">
          <div class="news__heading">
            <span class="eyebrow">What's New at Vexa</span>
            <h2 class="news__title">Latest news &amp; expert articles</h2>
          </div>
          <a routerLink="/resources" fragment="articles" class="news__all">
            <span>View All Articles</span>
            <img src="/resources/arrow-right-16.svg" alt="" />
          </a>
        </div>
        <div class="news__grid" id="articles">
          @for (article of articles; track article.title) {
            <article class="article">
              <div class="article__image"><img [src]="article.image" alt="" /></div>
              <div class="article__body">
                <span class="article__tag">{{ article.tag }}</span>
                <div class="article__text">
                  <h3>{{ article.title }}</h3>
                  <p>{{ article.text }}</p>
                </div>
                <a routerLink="/resources" [fragment]="slug(article.title)" class="article__link">
                  <span>Read Article</span>
                  <img src="/resources/arrow-up-right.svg" alt="" />
                </a>
              </div>
            </article>
          }
        </div>
      </section>

      <section class="help">
        <div class="support">
          <div class="support__text">
            <span class="pill pill--green">ONLINE NOW</span>
            <h2>Talk to a real human</h2>
            <p>Have an urgent issue with a delivery in progress? Our live operations support team is available 24/7.</p>
          </div>
          <div class="support__actions">
            <a href="mailto:support@vexa.local?subject=Live%20support" class="support__btn support__btn--primary">
              <img src="/resources/message-circle.svg" alt="" />
              <span>Chat with Support</span>
            </a>
            <a href="mailto:support@vexa.local" class="support__btn support__btn--outline">
              <img src="/resources/mail-question.svg" alt="" />
              <span>Email Helpdesk</span>
            </a>
          </div>
        </div>
        <div class="download">
          <div class="download__content">
            <div class="download__text">
              <h2>Take Vexa on the road</h2>
              <p>Real-time routing, push notification assignments, and secure photo proofs of delivery — right inside our courier app.</p>
            </div>
            <div class="download__badges">
              <a routerLink="/auth/register" class="store-badge">
                <img src="/resources/apple.svg" alt="" />
                <span class="store-badge__text">
                  <small>Download on the</small>
                  <strong>App Store</strong>
                </span>
              </a>
              <a routerLink="/auth/register" class="store-badge">
                <img src="/resources/google-play.svg" alt="" />
                <span class="store-badge__text">
                  <small>Get it on</small>
                  <strong>Google Play</strong>
                </span>
              </a>
            </div>
          </div>
          <div class="phone">
            <div class="phone__screen"><img src="/resources/phone-screen.png" alt="" /></div>
          </div>
        </div>
      </section>
    </vexa-public-layout>
  `,
  styles: `
    :host { display: block; font-family: 'Inter', sans-serif; background: #f8fafc; }
    a { text-decoration: none; }
    h1, h2, h3, p { margin: 0; }

    .pill { display: inline-flex; padding: 6px 16px; border-radius: 99px; background: #eff6ff; font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase; line-height: normal; white-space: nowrap; }
    .pill--green { padding: 6px 12px; background: #f0fdf4; color: #16a34a; }
    .eyebrow { font-size: 12px; font-weight: 800; color: #2563eb; text-transform: uppercase; line-height: normal; }

    .hero { display: flex; flex-direction: column; gap: 40px; align-items: center; padding: 96px 80px; background: #fff; border-bottom: 1px solid #e2e8f0; }
    .hero__text { display: flex; flex-direction: column; gap: 16px; align-items: center; width: 100%; text-align: center; }
    .hero__title { font-size: 56px; font-weight: 900; color: #111827; line-height: normal; }
    .hero__subtitle { width: 100%; max-width: 680px; font-size: 18px; font-weight: 400; color: #4b5563; line-height: 1.5; }
    .search { display: flex; align-items: center; gap: 16px; width: 100%; max-width: 640px; padding: 12px 16px 12px 24px; border-radius: 16px; background: #f8fafc; border: 1.5px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04); }
    .search__icon { width: 24px; height: 24px; flex-shrink: 0; display: block; }
    .search__input { flex: 1 0 0; min-width: 1px; border: 0; outline: 0; background: transparent; font-family: inherit; font-size: 16px; font-weight: 400; color: #111827; line-height: normal; }
    .search__input::placeholder { color: #4b5563; }
    .search__button { padding: 10px 20px; border: 0; border-radius: 10px; background: #2563eb; color: #fff; font-family: inherit; font-size: 14px; font-weight: 700; line-height: normal; white-space: nowrap; cursor: pointer; }
    .search__button:hover { background: #1d4ed8; }

    .resources { display: flex; flex-direction: column; gap: 48px; align-items: flex-start; padding: 96px 80px; }
    .resources__header { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .resources__title { font-size: 32px; font-weight: 800; color: #111827; line-height: normal; }
    .resources__grid { display: flex; gap: 32px; align-items: stretch; width: 100%; }
    .resource { flex: 1 0 0; min-width: 1px; display: flex; flex-direction: column; gap: 24px; align-items: flex-start; padding: 32px; border-radius: 16px; background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 8px 12px rgba(0, 0, 0, 0.04); }
    .resource__icon { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: #eff6ff; }
    .resource__icon img { width: 28px; height: 28px; display: block; }
    .resource__body { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .resource h3 { font-size: 20px; font-weight: 800; color: #111827; line-height: normal; }
    .resource p { font-size: 15px; font-weight: 400; color: #4b5563; line-height: 1.5; }
    .resource__links { display: flex; flex-direction: column; gap: 12px; width: 100%; }
    .resource__links a { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #2563eb; line-height: normal; white-space: nowrap; }
    .resource__links img { width: 14px; height: 14px; display: block; }

    .news { display: flex; flex-direction: column; gap: 48px; align-items: flex-start; padding: 96px 80px; background: #fff; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
    .news__header { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; width: 100%; flex-wrap: wrap; }
    .news__heading { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 600px; }
    .news__title { font-size: 32px; font-weight: 800; color: #111827; line-height: normal; }
    .news__all { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; color: #2563eb; line-height: normal; white-space: nowrap; }
    .news__all img { width: 16px; height: 16px; display: block; }
    .news__grid { display: flex; gap: 32px; align-items: stretch; width: 100%; }
    .article { flex: 1 0 0; min-width: 1px; display: flex; flex-direction: column; border-radius: 16px; background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04); overflow: hidden; }
    .article__image { height: 200px; width: 100%; position: relative; }
    .article__image img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
    .article__body { display: flex; flex-direction: column; gap: 16px; align-items: flex-start; padding: 24px; width: 100%; }
    .article__tag { display: inline-flex; padding: 4px 10px; border-radius: 99px; background: #eff6ff; font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase; line-height: normal; white-space: nowrap; }
    .article__text { display: flex; flex-direction: column; gap: 8px; width: 100%; }
    .article h3 { font-size: 18px; font-weight: 800; color: #111827; line-height: 1.4; }
    .article p { font-size: 14px; font-weight: 400; color: #4b5563; line-height: 1.5; }
    .article__link { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; color: #2563eb; line-height: normal; white-space: nowrap; }
    .article__link img { width: 14px; height: 14px; display: block; }

    .help { display: flex; gap: 32px; align-items: stretch; padding: 96px 80px 120px; }
    .support { flex: 1 0 0; min-width: 1px; display: flex; flex-direction: column; gap: 36px; align-items: flex-start; padding: 48px; border-radius: 16px; background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 8px 12px rgba(0, 0, 0, 0.04); }
    .support__text { display: flex; flex-direction: column; gap: 16px; align-items: flex-start; width: 100%; }
    .support h2 { font-size: 32px; font-weight: 800; color: #111827; line-height: normal; }
    .support p { font-size: 16px; font-weight: 400; color: #4b5563; line-height: 1.5; }
    .support__actions { display: flex; gap: 16px; align-items: flex-start; width: 100%; flex-wrap: wrap; }
    .support__btn { display: inline-flex; align-items: center; gap: 10px; padding: 16px 28px; border-radius: 12px; font-size: 15px; font-weight: 700; line-height: normal; white-space: nowrap; }
    .support__btn img { width: 20px; height: 20px; display: block; }
    .support__btn--primary { background: #2563eb; color: #fff; }
    .support__btn--primary:hover { background: #1d4ed8; }
    .support__btn--outline { color: #111827; border: 1.5px solid #e2e8f0; }
    .download { flex: 1 0 0; min-width: 1px; display: flex; gap: 24px; align-items: flex-start; padding: 48px; border-radius: 16px; background: #111827; overflow: hidden; }
    .download__content { flex: 1 0 0; min-width: 1px; display: flex; flex-direction: column; gap: 36px; align-items: flex-start; }
    .download__text { display: flex; flex-direction: column; gap: 16px; width: 100%; }
    .download h2 { font-size: 32px; font-weight: 800; color: #fff; line-height: normal; }
    .download p { font-size: 16px; font-weight: 400; color: #9ca3af; line-height: 1.5; }
    .download__badges { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
    .store-badge { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 8px; background: #111827; border: 1px solid #374151; }
    .store-badge img { width: 20px; height: 20px; display: block; }
    .store-badge__text { display: flex; flex-direction: column; gap: 2px; line-height: normal; white-space: nowrap; }
    .store-badge small { font-size: 10px; font-weight: 500; color: #9ca3af; text-transform: uppercase; }
    .store-badge strong { font-size: 14px; font-weight: 700; color: #fff; }
    .phone { width: 160px; height: 260px; flex-shrink: 0; display: flex; flex-direction: column; padding: 8px; border-radius: 24px; background: #374151; border: 4px solid #4b5563; }
    .phone__screen { flex: 1 0 0; min-height: 1px; width: 100%; position: relative; border-radius: 18px; overflow: hidden; }
    .phone__screen img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }

    @media (max-width: 1100px) {
      .hero, .resources, .news, .help { padding-left: 24px; padding-right: 24px; }
      .hero { padding-top: 72px; padding-bottom: 72px; }
      .hero__title { font-size: 40px; }
      .resources__grid, .news__grid, .help { flex-direction: column; }
      .download { flex-direction: column-reverse; align-items: center; }
      .phone { align-self: center; }
    }
  `,
})
export class Support {
  query = '';
  readonly lastQuery = signal('');

  readonly resourceCards: ResourceCard[] = [
    { icon: '/resources/circle-help.svg', title: 'Help Center', text: 'Quick answers about dispatching local routes, updating account settings, and getting verified.', links: ['Browse Delivery FAQs', 'Courier Payout Rules', 'Account Verification'] },
    { icon: '/resources/chart-gantt.svg', title: 'Getting Started', text: 'Step-by-step onboarding walkthroughs customized for both dispatch companies and couriers.', links: ['Company Setup Guide', 'First Delivery Walkthrough', 'Vexa App Basics'] },
    { icon: '/resources/message-square.svg', title: 'Community Forum', text: 'Connect directly with thousands of independent local couriers and active logistics managers.', links: ['Join the Discussion', 'Route Optimization Tips', 'Courier Success Stories'] },
  ];

  readonly articles: Article[] = [
    { image: '/resources/article-1.png', tag: 'Industry Trends', title: 'How to Maximize Delivery SLAs in Urban Hubs', text: 'Discover the routing parameters, predictive patterns, and courier habits that push success rates over 99%.' },
    { image: '/resources/article-2.png', tag: 'Platform Updates', title: 'Introducing Advanced Route Optimization Features', text: 'A detailed overview of the core algorithm upgrades rolling out to help businesses stack drop-offs.' },
    { image: '/resources/article-3.png', tag: 'Courier Guides', title: 'Safety & Efficiency Best Practices for Riders', text: 'Vetted independent couriers share their secrets on handling fragile parcels, bad weather, and tight drops.' },
  ];

  slug(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  search(): void {
    this.lastQuery.set(this.query.trim());
  }
}
