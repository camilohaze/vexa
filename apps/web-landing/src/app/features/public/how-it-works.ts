import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicLayout } from './public-layout';

interface StepCard {
  number: string;
  tag: string;
  title: string;
  text: string;
}

@Component({
  selector: 'vexa-how-it-works',
  imports: [RouterLink, PublicLayout],
  template: `
    <vexa-public-layout>
      <section class="hero">
        <span class="pill">SIMPLE &amp; TRANSPARENT</span>
        <h1 class="hero__title">Simple steps, fast deliveries</h1>
        <p class="hero__text">
          Vexa is a direct, zero-subscription logistics marketplace. We connect businesses who need
          packages moved with local independent couriers. Fast, reliable, and completely free of hidden markups.
        </p>
      </section>

      <section class="journey">
        <div class="journey__header">
          <span class="pill">FOR BUSINESSES</span>
          <h2 class="journey__title">How companies ship with Vexa</h2>
          <p class="journey__subtitle">
            Streamline your local dispatch. From posting to proof of delivery, manage everything seamlessly with zero monthly platform fees.
          </p>
        </div>
        <div class="steps">
          @for (step of companySteps; track step.number) {
            <article class="step">
              <div class="step__head">
                <span class="step__number">{{ step.number }}</span>
                <span class="step__tag">{{ step.tag }}</span>
              </div>
              <div class="step__body">
                <h3>{{ step.title }}</h3>
                <p>{{ step.text }}</p>
              </div>
            </article>
          }
        </div>
      </section>

      <section class="journey journey--alt">
        <div class="journey__header">
          <span class="pill">FOR COURIERS</span>
          <h2 class="journey__title">How couriers earn with Vexa</h2>
          <p class="journey__subtitle">
            Be your own boss. Access local deliveries instantly, keep 100% of your earnings if you are a non-motorized courier, and get paid immediately.
          </p>
        </div>
        <div class="steps">
          @for (step of courierSteps; track step.number) {
            <article class="step">
              <div class="step__head">
                <span class="step__number">{{ step.number }}</span>
                <span class="step__tag">{{ step.tag }}</span>
              </div>
              <div class="step__body">
                <h3>{{ step.title }}</h3>
                <p>{{ step.text }}</p>
              </div>
            </article>
          }
        </div>
      </section>

      <section class="flow">
        <div class="flow__header">
          <span class="pill">THE PIPELINE</span>
          <h2 class="flow__title">Direct peer-to-peer connection</h2>
          <p class="flow__subtitle">Vexa removes the middleman, routing requests directly to the courier network.</p>
        </div>
        <div class="diagram">
          <div class="diagram__node">
            <span class="diagram__step">STEP 1</span>
            <span class="diagram__title">Company Request</span>
            <p>Business submits route requirements and transparent pricing tier.</p>
          </div>
          <img src="/arrow-right.svg" alt="" class="diagram__arrow" />
          <div class="diagram__node">
            <span class="diagram__step">STEP 2</span>
            <span class="diagram__title">Algorithm Match</span>
            <p>Vexa instantly queries the closest, best-rated local couriers.</p>
          </div>
          <img src="/arrow-right.svg" alt="" class="diagram__arrow" />
          <div class="diagram__node">
            <span class="diagram__step">STEP 3</span>
            <span class="diagram__title">Courier Accept</span>
            <p>Courier picks up the dispatch and starts live GPS routing.</p>
          </div>
          <img src="/arrow-right.svg" alt="" class="diagram__arrow" />
          <div class="diagram__node">
            <span class="diagram__step">STEP 4</span>
            <span class="diagram__title">Delivery Done</span>
            <p>Dropoff confirmed with real photo proof and immediate payout.</p>
          </div>
        </div>
      </section>

      <section class="faq">
        <div class="faq__header">
          <span class="pill">QUESTIONS &amp; ANSWERS</span>
          <h2 class="faq__title">Frequently Asked Questions</h2>
          <p class="faq__subtitle">Got questions? We have got you covered. Here is how Vexa keeps logistics simple.</p>
        </div>
        <div class="faq__grid">
          <article class="faq__card">
            <h3>How long does it take for a courier to accept?</h3>
            <p>Over 95% of active, standard delivery routes are matched and claimed by verified local couriers in under 2 minutes of being posted.</p>
          </article>
          <article class="faq__card">
            <h3>What package sizes can I dispatch?</h3>
            <p>Vexa accommodates everything from small envelopes and food containers to bulk cargo shipments. Specify your packaging type to receive the best vehicle match.</p>
          </article>
          <article class="faq__card">
            <h3>Are my packages insured?</h3>
            <p>Yes. Every delivery completed through the Vexa platform is backed by our standard comprehensive cargo protection plan at no extra cost to you.</p>
          </article>
          <article class="faq__card">
            <h3>How are logistics disputes handled?</h3>
            <p>Our dedicated support desk leverages transparent live GPS tracking logs, timestamped signatures, and photo-proof dropoff uploads to resolve claims quickly.</p>
          </article>
        </div>
      </section>

      <section class="cta">
        <div class="cta__text">
          <h2>Ready to simplify your local logistics?</h2>
          <p>Join hundreds of high-growth companies and independent couriers scaling their local routes today. Sign up free with zero subscription drag.</p>
        </div>
        <div class="cta__buttons">
          <a routerLink="/auth/register" class="btn btn--white">Get Started Free</a>
          <a routerLink="/auth/register" class="btn btn--ghost">Join Waitlist</a>
        </div>
      </section>
    </vexa-public-layout>
  `,
  styles: `
    :host { display: block; font-family: 'Inter', sans-serif; }
    a { text-decoration: none; }
    h1, h2, h3, p { margin: 0; }

    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 14px 28px; border-radius: 16px; font-size: 14px; font-weight: 700; line-height: normal; white-space: nowrap; }
    .btn--white { background: #fff; color: #2563eb; }
    .btn--ghost { color: #fff; border: 1.5px solid rgba(255, 255, 255, 0.3); }

    .pill { display: inline-flex; align-items: center; justify-content: center; padding: 6px 16px; border-radius: 99px; background: #eff6ff; font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase; line-height: normal; white-space: nowrap; }

    .hero { display: flex; flex-direction: column; gap: 24px; align-items: center; padding: 112px 80px 96px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: center; }
    .hero__title { width: 100%; max-width: 800px; font-size: 58px; font-weight: 800; color: #0f172a; line-height: 66px; }
    .hero__text { width: 100%; max-width: 720px; font-size: 18px; font-weight: 400; color: #475569; line-height: 28px; }

    .journey { display: flex; flex-direction: column; gap: 64px; align-items: flex-start; padding: 120px 80px; background: #fff; }
    .journey--alt { background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
    .journey__header { display: flex; flex-direction: column; gap: 16px; align-items: flex-start; width: 100%; max-width: 640px; }
    .journey__title { font-size: 38px; font-weight: 800; color: #0f172a; line-height: normal; }
    .journey__subtitle { font-size: 16px; font-weight: 400; color: #475569; line-height: 26px; }
    .steps { display: flex; gap: 16px; align-items: stretch; width: 100%; }
    .step { flex: 1 0 0; min-width: 1px; display: flex; flex-direction: column; gap: 20px; align-items: flex-start; padding: 32px; border-radius: 16px; background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 8px 12px rgba(15, 23, 42, 0.03); }
    .step__head { display: flex; align-items: center; justify-content: space-between; width: 100%; }
    .step__number { font-size: 40px; font-weight: 900; color: #2563eb; opacity: 0.15; line-height: normal; white-space: nowrap; }
    .step__tag { display: inline-flex; padding: 4px 10px; border-radius: 6px; background: #fef3c7; font-size: 10px; font-weight: 700; color: #d97706; line-height: normal; white-space: nowrap; }
    .step__body { display: flex; flex-direction: column; gap: 8px; width: 100%; }
    .step h3 { font-size: 18px; font-weight: 800; color: #0f172a; line-height: normal; }
    .step p { font-size: 14px; font-weight: 400; color: #475569; line-height: 22px; }

    .flow { display: flex; flex-direction: column; gap: 48px; align-items: center; padding: 120px 80px; background: #fff; }
    .flow__header { display: flex; flex-direction: column; gap: 12px; align-items: center; width: 100%; max-width: 600px; text-align: center; }
    .flow__title { font-size: 32px; font-weight: 800; color: #0f172a; line-height: normal; }
    .flow__subtitle { font-size: 15px; font-weight: 400; color: #475569; line-height: 24px; }
    .diagram { display: flex; gap: 32px; align-items: center; justify-content: center; width: 100%; padding: 48px; border-radius: 24px; background: #eff6ff; }
    .diagram__node { flex: 1 0 0; min-width: 1px; display: flex; flex-direction: column; gap: 12px; align-items: flex-start; padding: 24px; border-radius: 16px; background: #fff; box-shadow: 0 8px 12px rgba(15, 23, 42, 0.03); }
    .diagram__step { font-size: 12px; font-weight: 800; color: #2563eb; line-height: normal; white-space: nowrap; }
    .diagram__title { font-size: 16px; font-weight: 800; color: #0f172a; line-height: normal; white-space: nowrap; }
    .diagram__node p { font-size: 13px; font-weight: 400; color: #475569; line-height: normal; }
    .diagram__arrow { width: 24px; height: 24px; flex-shrink: 0; display: block; }

    .faq { display: flex; flex-direction: column; gap: 64px; align-items: flex-start; padding: 120px 80px; background: #f8fafc; }
    .faq__header { display: flex; flex-direction: column; gap: 12px; align-items: center; width: 100%; text-align: center; }
    .faq__title { font-size: 38px; font-weight: 800; color: #0f172a; line-height: normal; }
    .faq__subtitle { font-size: 16px; font-weight: 400; color: #475569; line-height: 26px; }
    .faq__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; width: 100%; }
    .faq__card { display: flex; flex-direction: column; gap: 16px; align-items: flex-start; padding: 32px; border-radius: 16px; background: #fff; border: 1px solid #e2e8f0; box-shadow: 0 8px 12px rgba(15, 23, 42, 0.03); }
    .faq__card h3 { font-size: 18px; font-weight: 800; color: #0f172a; line-height: normal; }
    .faq__card p { font-size: 14px; font-weight: 400; color: #475569; line-height: 22px; }

    .cta { display: flex; flex-direction: column; gap: 32px; align-items: center; padding: 96px 80px; background: linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%); }
    .cta__text { display: flex; flex-direction: column; gap: 16px; align-items: center; text-align: center; width: 100%; max-width: 720px; }
    .cta h2 { font-size: 38px; font-weight: 800; color: #fff; line-height: normal; }
    .cta p { font-size: 16px; font-weight: 400; color: #eff6ff; line-height: 26px; }
    .cta__buttons { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }

    @media (max-width: 1100px) {
      .hero, .journey, .flow, .faq, .cta { padding-left: 24px; padding-right: 24px; }
      .hero { padding-top: 72px; padding-bottom: 64px; }
      .journey, .flow, .faq { padding-top: 80px; padding-bottom: 80px; }
      .hero__title { font-size: 40px; line-height: 48px; }
      .journey__title, .faq__title, .cta h2 { font-size: 32px; }
      .steps { flex-wrap: wrap; }
      .step { flex: 1 1 calc(50% - 8px); }
      .diagram { flex-direction: column; padding: 24px; }
      .diagram__node { width: 100%; }
      .diagram__arrow { transform: rotate(90deg); }
      .faq__grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) { .step { flex: 1 1 100%; } }
  `,
})
export class HowItWorks {
  readonly companySteps: StepCard[] = [
    { number: '01', tag: '100% FREE', title: 'Create Free Account', text: 'Sign up in seconds. No subscriptions, no hidden setup fees, and no credit card required to browse.' },
    { number: '02', tag: 'YOUR PRICE', title: 'Post Delivery Job', text: 'Enter package dimensions, specify pickup & dropoff coordinates, and set your own guaranteed price.' },
    { number: '03', tag: 'FAST MATCH', title: 'Courier Accepts', text: "Vexa's algorithm instantly broadcasts your job to vetted nearby couriers who match your criteria." },
    { number: '04', tag: 'LIVE MAP', title: 'Track Live', text: 'Watch real-time GPS progress. Send a white-labeled live tracking link to keep your customers informed.' },
    { number: '05', tag: 'SECURE', title: 'Confirm & Rate', text: 'Receive instant photo verification upon drop-off. Rate your courier to maintain high network quality.' },
  ];

  readonly courierSteps: StepCard[] = [
    { number: '01', tag: 'GET VETTED', title: 'Register & Verify', text: 'Upload your credentials, select your vehicle type, and complete our rapid local background screening.' },
    { number: '02', tag: 'FLEXIBLE', title: 'Browse Active Jobs', text: 'Open your dashboard to view nearby delivery requests. Filter by distance, package size, and payouts.' },
    { number: '03', tag: 'SMART ROUTES', title: 'Accept & Navigate', text: "Claim the jobs you want. Use Vexa's built-in optimal routing to find the absolute fastest path." },
    { number: '04', tag: 'PHOTO PROOF', title: 'Deliver Package', text: 'Safely pick up and transport the package. Complete the job by uploading a standard photo drop-off proof.' },
    { number: '05', tag: 'INSTANT', title: 'Get Paid Instantly', text: 'Your earnings are transferred directly to your bank account immediately upon delivery verification.' },
  ];
}
