import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'vexa-public-layout',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="navbar">
      <a class="navbar__logo" routerLink="/">
        <img src="/logo-mark.svg" alt="" class="navbar__logo-mark" />
        <span class="navbar__logo-text">Vexa</span>
      </a>
      <nav class="navbar__links">
        <a routerLink="/products" routerLinkActive="navbar__link--active">Products</a>
        <a routerLink="/how-it-works" routerLinkActive="navbar__link--active">How It Works</a>
        <a routerLink="/resources" routerLinkActive="navbar__link--active">Resources</a>
      </nav>
      <div class="navbar__actions">
        <a class="navbar__signin" routerLink="/auth/login">Sign In</a>
        <a class="navbar__cta" routerLink="/auth/register">Join Waitlist</a>
      </div>
    </header>
    <main>
      <ng-content></ng-content>
    </main>
    <footer class="footer">
      <div class="footer__top">
        <div class="footer__brand">
          <div class="footer__logo">
            <img src="/logo-mark-footer.svg" alt="" class="footer__logo-mark" />
            <span class="footer__logo-text">Vexa</span>
          </div>
          <p class="footer__tagline">
            The next-generation, subscription-free logistics marketplace routing cargo and local
            parcels with complete visual confidence.
          </p>
        </div>
        <div class="footer__links-group">
          <div class="footer__col">
            <p class="footer__col-title">Product</p>
            <a routerLink="/products">Features</a>
            <a routerLink="/products">Integrations</a>
            <a routerLink="/how-it-works">How It Works</a>
            <a routerLink="/products">Changelog</a>
          </div>
          <div class="footer__col">
            <p class="footer__col-title">Company</p>
            <a routerLink="/how-it-works">About Us</a>
            <a routerLink="/resources">Careers</a>
            <a routerLink="/auth/register">Waitlist</a>
            <a routerLink="/resources">Contact</a>
          </div>
          <div class="footer__col">
            <p class="footer__col-title">Resources</p>
            <a routerLink="/resources">Help Center</a>
            <a routerLink="/resources">FAQ Center</a>
            <a routerLink="/resources">Blog</a>
            <a routerLink="/resources">Status</a>
          </div>
        </div>
      </div>
      <div class="footer__bottom">
        <p>© 2026 Vexa Admin Inc. All rights reserved.</p>
        <div class="footer__legal">
          <a routerLink="/resources">Privacy Policy</a>
          <a routerLink="/resources">Terms of Service</a>
        </div>
      </div>
    </footer>
  `,
  styles: `
    :host { display: block; font-family: 'Inter', sans-serif; background: #fff; }
    a { text-decoration: none; }

    .navbar { display: flex; align-items: center; justify-content: space-between; padding: 24px 80px; border-bottom: 1px solid #e2e8f0; background: #fff; }
    .navbar__logo { display: flex; align-items: center; gap: 12px; }
    .navbar__logo-mark { width: 38px; height: 36px; display: block; }
    .navbar__logo-text { font-size: 22px; font-weight: 400; color: #111827; line-height: normal; }
    .navbar__links { display: none; gap: 36px; }
    .navbar__links a { font-size: 14px; font-weight: 600; color: #4b5563; line-height: normal; white-space: nowrap; }
    .navbar__links a:hover, .navbar__link--active { color: #2563eb; }
    .navbar__actions { display: flex; align-items: center; gap: 24px; }
    .navbar__signin { font-size: 14px; font-weight: 700; color: #111827; line-height: normal; white-space: nowrap; }
    .navbar__cta { display: inline-flex; align-items: center; justify-content: center; padding: 12px 20px; border-radius: 12px; background: #2563eb; color: #fff; font-size: 14px; font-weight: 700; line-height: normal; white-space: nowrap; }
    .navbar__cta:hover { background: #1d4ed8; }
    @media (min-width: 960px) { .navbar__links { display: flex; } }
    @media (max-width: 960px) { .navbar { padding: 20px 24px; } }

    .footer { display: flex; flex-direction: column; gap: 64px; padding: 80px 80px 64px; border-top: 1px solid #e2e8f0; background: #fff; }
    .footer__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 48px; flex-wrap: wrap; }
    .footer__brand { display: flex; flex-direction: column; gap: 16px; width: 320px; }
    .footer__logo { display: flex; align-items: center; gap: 10px; }
    .footer__logo-mark { width: 36px; height: 36px; display: block; }
    .footer__logo-text { font-size: 22px; font-weight: 400; color: #111827; line-height: normal; }
    .footer__tagline { margin: 0; font-size: 14px; font-weight: 400; color: #4b5563; line-height: 22px; }
    .footer__links-group { display: flex; gap: 64px; flex-wrap: wrap; }
    .footer__col { display: flex; flex-direction: column; gap: 16px; }
    .footer__col-title { margin: 0; font-size: 14px; font-weight: 800; color: #111827; line-height: normal; }
    .footer__col a { font-size: 13px; font-weight: 400; color: #4b5563; line-height: normal; white-space: nowrap; }
    .footer__col a:hover { color: #2563eb; }
    .footer__bottom { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; font-size: 13px; font-weight: 400; color: #9ca3af; line-height: normal; }
    .footer__bottom p { margin: 0; }
    .footer__legal { display: flex; gap: 24px; }
    .footer__legal a { color: #9ca3af; }
    .footer__legal a:hover { color: #2563eb; }
    @media (max-width: 960px) { .footer { padding: 56px 24px 40px; } }
  `,
})
export class PublicLayout {}
