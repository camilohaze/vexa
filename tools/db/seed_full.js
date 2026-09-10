/**
 * Comprehensive dev-data seed: adds companies, couriers, jobs (every status),
 * payments, payouts, disputes, support tickets, notifications, and payment
 * methods on top of whatever already exists (idempotent-ish: re-running adds
 * a fresh batch rather than erroring, except for the fixed demo accounts
 * which are skipped if already present).
 *
 * Usage: DATABASE_URL=postgresql://... node tools/db/seed_full.js
 */
const { Client } = require('pg');
const crypto = require('crypto');

const uuid = () => crypto.randomUUID();
const PASSWORD_HASH = '$2b$10$aLC6W2j3ZUznT9YIs7YdB.ClCaOHfN3nPB2hkjqeyEH9T6jG1Hp3O'; // Vexa1234!

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rand = (min, max) => Math.round(min + Math.random() * (max - min));
const daysAgo = (d) => new Date(Date.now() - d * 86400000);

const BOGOTA_POINTS = [
  { label: 'Chapinero', line1: 'Calle 63 #11-45', city: 'Bogotá', lat: 4.6486, lng: -74.0631 },
  { label: 'Usaquén', line1: 'Calle 116 #7-20', city: 'Bogotá', lat: 4.7018, lng: -74.0345 },
  { label: 'Zona Rosa', line1: 'Carrera 13 #85-32', city: 'Bogotá', lat: 4.6668, lng: -74.0543 },
  { label: 'Centro', line1: 'Carrera 7 #24-89', city: 'Bogotá', lat: 4.6079, lng: -74.0709 },
  { label: 'Kennedy', line1: 'Avenida Primero de Mayo #78-12', city: 'Bogotá', lat: 4.6280, lng: -74.1568 },
  { label: 'Suba', line1: 'Calle 145 #91-20', city: 'Bogotá', lat: 4.7455, lng: -74.0937 },
  { label: 'Engativá', line1: 'Avenida Boyacá #72-10', city: 'Bogotá', lat: 4.7027, lng: -74.1123 },
  { label: 'Fontibón', line1: 'Calle 22 #100-15', city: 'Bogotá', lat: 4.6740, lng: -74.1462 },
  { label: 'Teusaquillo', line1: 'Carrera 24 #39-40', city: 'Bogotá', lat: 4.6339, lng: -74.0847 },
  { label: 'La Candelaria', line1: 'Calle 10 #3-15', city: 'Bogotá', lat: 4.5975, lng: -74.0743 },
];

const PACKAGE_TYPES = ['document', 'small', 'large', 'pallet'];
const PRIORITIES = ['standard', 'express', 'same_day'];

function point(p) {
  return { line1: p.line1, city: p.city, lat: p.lat, lng: p.lng, reference: `Cerca a ${p.label}` };
}

function priceBreakdown(price) {
  const commission = Math.round(price * 0.2);
  const subtotal = price - commission;
  return {
    base: 8000,
    distance: Math.round(subtotal * 0.35),
    time: Math.round(subtotal * 0.2),
    weight: Math.round(subtotal * 0.1),
    priorityMultiplier: 1,
    demandMultiplier: 1,
    subtotal,
    commission,
  };
}

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:aetheria_dev@localhost:5432/vexa',
  });
  await client.connect();

  try {
    await client.query('BEGIN');

    // --- Reuse existing demo accounts ---
    const existingUsers = (await client.query(`SELECT id, email, role FROM users`)).rows;
    const demoCompanyUser = existingUsers.find((u) => u.email === 'company@vexa.local');
    const demoCourierUser = existingUsers.find((u) => u.email === 'courier@vexa.local');
    const demoAdminUser = existingUsers.find((u) => u.email === 'admin@vexa.local');
    const demoCompany = (await client.query(`SELECT id FROM companies WHERE owner_id = $1`, [demoCompanyUser.id])).rows[0];
    const demoCourier = (await client.query(`SELECT id FROM couriers WHERE user_id = $1`, [demoCourierUser.id])).rows[0];

    console.log('Reusing demo company', demoCompany.id, 'and demo courier', demoCourier.id);

    // --- New companies (2) ---
    const companiesSpec = [
      { name: 'Andes Retail SAS', taxId: 'ANDES-556', email: 'owner@andesretail.co', fullName: 'Camila Rojas', currency: 'COP', timezone: 'America/Bogota' },
      { name: 'Global Freight Corp', taxId: 'GFC-2291', email: 'owner@globalfreight.com', fullName: 'Michael Turner', currency: 'USD', timezone: 'America/New_York' },
    ];
    const companies = [{ id: demoCompany.id, name: 'Vexa Demo Company', userId: demoCompanyUser.id }];
    for (const spec of companiesSpec) {
      const userId = uuid();
      await client.query(
        `INSERT INTO users (id, email, full_name, phone, password_hash, email_verified, role, provider, provider_id, is_active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,true,'COMPANY','EMAIL',$2,true,NOW(),NOW())
         ON CONFLICT (email) DO NOTHING`,
        [userId, spec.email, spec.fullName, `+57 300 000 ${rand(1000, 9999)}`, PASSWORD_HASH]
      );
      const userRow = (await client.query(`SELECT id FROM users WHERE email = $1`, [spec.email])).rows[0];
      const companyId = uuid();
      await client.query(
        `INSERT INTO companies (id, name, tax_id, owner_id, is_active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,true,NOW(),NOW())
         ON CONFLICT (tax_id) DO NOTHING`,
        [companyId, spec.name, spec.taxId, userRow.id]
      );
      const compRow = (await client.query(`SELECT id FROM companies WHERE tax_id = $1`, [spec.taxId])).rows[0];
      await client.query(
        `INSERT INTO company_settings (company_id, admin_email, two_factor, language, currency, timezone, address, meta, plan, plan_price, renewal_at)
         VALUES ($1,$2,false,'es',$3,$4,$5,'{}','Profesional',599,NOW() + interval '20 days')
         ON CONFLICT (company_id) DO NOTHING`,
        [compRow.id, spec.email, spec.currency, spec.timezone, pick(BOGOTA_POINTS).line1 + ', Bogotá']
      );
      companies.push({ id: compRow.id, name: spec.name, userId: userRow.id });
    }

    // Payment methods for all companies
    for (const c of companies) {
      await client.query(
        `INSERT INTO company_payment_methods (id, company_id, method_type, label, sub, is_default, last4, brand, created_at, updated_at)
         VALUES ($1,$2,'card','Tarjeta corporativa','Visa terminada en 4242',true,'4242','Visa',NOW(),NOW())`,
        [uuid(), c.id]
      );
      await client.query(
        `INSERT INTO company_payment_methods (id, company_id, method_type, label, sub, is_default, created_at, updated_at)
         VALUES ($1,$2,'bank','Cuenta bancaria','Bancolombia • Ahorros',false,NOW(),NOW())`,
        [uuid(), c.id]
      );
    }

    // --- New couriers (4) ---
    const couriersSpec = [
      { email: 'david.miller@vexa.local', fullName: 'David Miller', vehicle: 'VAN', status: 'AVAILABLE', rating: 4.8, ratingsCount: 214, verified: true, plate: 'VX-CARGO', make: 'Ford Transit', color: 'Blanco', year: 2022 },
      { email: 'laura.gomez@vexa.local', fullName: 'Laura Gómez', vehicle: 'MOTORCYCLE', status: 'BUSY', rating: 4.6, ratingsCount: 132, verified: true, plate: 'MTX-882', make: 'Yamaha FZ', color: 'Negro', year: 2021 },
      { email: 'carlos.perez@vexa.local', fullName: 'Carlos Pérez', vehicle: 'CAR', status: 'OFFLINE', rating: 4.2, ratingsCount: 58, verified: false, plate: 'ABC-123', make: 'Chevrolet Spark', color: 'Rojo', year: 2019 },
      { email: 'ana.torres@vexa.local', fullName: 'Ana Torres', vehicle: 'BICYCLE', status: 'AVAILABLE', rating: 4.95, ratingsCount: 301, verified: true, plate: null, make: null, color: null, year: null },
    ];
    const couriers = [{ id: demoCourier.id, userId: demoCourierUser.id, vehicle: 'VAN' }];
    for (const spec of couriersSpec) {
      const userId = uuid();
      await client.query(
        `INSERT INTO users (id, email, full_name, phone, password_hash, email_verified, role, provider, provider_id, is_active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,true,'COURIER','EMAIL',$2,true,NOW(),NOW())
         ON CONFLICT (email) DO NOTHING`,
        [userId, spec.email, spec.fullName, `+57 301 ${rand(1000000, 9999999)}`, PASSWORD_HASH]
      );
      const userRow = (await client.query(`SELECT id FROM users WHERE email = $1`, [spec.email])).rows[0];
      const courierId = uuid();
      const verification = spec.verified
        ? {
            identity: { status: 'verified', urls: ['https://picsum.photos/seed/id/600/400'] },
            vehicle: { status: 'verified', urls: ['https://picsum.photos/seed/veh/600/400'], meta: { docNumber: spec.plate ?? 'N/A' } },
            insurance: { status: 'verified', urls: ['https://picsum.photos/seed/ins/600/400'], meta: { expiresAt: '2027-01-01' } },
            background: { status: 'verified', urls: ['https://picsum.photos/seed/bg/600/400'] },
          }
        : {
            identity: { status: 'pending', urls: ['https://picsum.photos/seed/id2/600/400'] },
            vehicle: { status: 'required', urls: [] },
            insurance: { status: 'rejected', urls: ['https://picsum.photos/seed/ins2/600/400'] },
            background: { status: 'required', urls: [] },
          };
      await client.query(
        `INSERT INTO couriers (id, user_id, status, vehicle, rating, ratings_count, verification, vehicle_details, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
         ON CONFLICT (user_id) DO NOTHING`,
        [
          courierId,
          userRow.id,
          spec.status,
          spec.vehicle,
          spec.rating,
          spec.ratingsCount,
          JSON.stringify(verification),
          JSON.stringify({ make: spec.make, plate: spec.plate, color: spec.color, year: spec.year }),
        ]
      );
      const courRow = (await client.query(`SELECT id FROM couriers WHERE user_id = $1`, [userRow.id])).rows[0];
      couriers.push({ id: courRow.id, userId: userRow.id, vehicle: spec.vehicle });
    }

    // --- Jobs: cover every status, spread across companies/couriers ---
    const STATUSES = ['PENDING', 'OFFERED', 'ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'DELIVERED', 'DELIVERED', 'CANCELLED'];
    const jobIds = [];
    let jobCount = 0;
    for (const company of companies) {
      for (let i = 0; i < 9; i++) {
        const status = STATUSES[i % STATUSES.length];
        const pickup = pick(BOGOTA_POINTS);
        let dropoff = pick(BOGOTA_POINTS);
        while (dropoff === pickup) dropoff = pick(BOGOTA_POINTS);
        const priority = pick(PRIORITIES);
        const packageType = pick(PACKAGE_TYPES);
        const weight = rand(1, 25);
        const price = rand(12000, 65000);
        const distanceMeters = rand(1500, 18000);
        const durationSeconds = rand(600, 3600);
        const hasCourier = status !== 'PENDING';
        const courier = hasCourier ? pick(couriers) : null;
        const createdDaysAgo = rand(0, 25);
        const jobId = uuid();

        const acceptedAt = ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(status) ? daysAgo(createdDaysAgo - 0.2) : null;
        const pickedUpAt = ['PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(status) ? daysAgo(createdDaysAgo - 0.4) : null;
        const completedAt = status === 'DELIVERED' ? daysAgo(createdDaysAgo - 0.8) : status === 'CANCELLED' ? daysAgo(createdDaysAgo - 0.1) : null;

        await client.query(
          `INSERT INTO jobs (
            id, company_id, courier_id, status, pickup, pickup_point, dropoff, dropoff_point,
            price, distance_meters, duration_seconds, notes, package_type, weight_kg, dimensions,
            declared_value, fragile, refrigerated, priority, price_breakdown,
            proof_of_delivery_url, pod_signed_by, rating_score, rating_comment,
            created_at, accepted_at, picked_up_at, completed_at, updated_at
          ) VALUES (
            $1,$2,$3,$4,$5,ST_SetSRID(ST_MakePoint($6,$7),4326)::geography,$8,ST_SetSRID(ST_MakePoint($9,$10),4326)::geography,
            $11,$12,$13,$14,$15,$16,$17,
            $18,$19,$20,$21,$22,
            $23,$24,$25,$26,
            $27,$28,$29,$30,NOW()
          )`,
          [
            jobId,
            company.id,
            courier?.id ?? null,
            status,
            JSON.stringify(point(pickup)),
            pickup.lng,
            pickup.lat,
            JSON.stringify(point(dropoff)),
            dropoff.lng,
            dropoff.lat,
            price,
            distanceMeters,
            durationSeconds,
            pick(['Entregar en portería', 'Llamar al llegar', 'Dejar con el celador', null]),
            packageType,
            weight,
            JSON.stringify({ l: rand(10, 80), w: rand(10, 60), h: rand(10, 50) }),
            price * rand(2, 8),
            Math.random() < 0.2,
            Math.random() < 0.1,
            priority,
            status === 'DELIVERED' || status === 'CANCELLED' ? JSON.stringify(priceBreakdown(price)) : null,
            status === 'DELIVERED' ? 'https://picsum.photos/seed/pod' + jobCount + '/500/350' : null,
            status === 'DELIVERED' ? pick(['J. Ramírez', 'M. Suárez', 'C. Ortiz', 'L. Vargas']) : null,
            status === 'DELIVERED' ? rand(3, 5) : null,
            status === 'DELIVERED' ? pick(['Excelente servicio, muy puntual.', 'Todo perfecto, paquete en buen estado.', 'Buen tiempo de entrega.', null]) : null,
            daysAgo(createdDaysAgo),
            acceptedAt,
            pickedUpAt,
            completedAt,
          ]
        );
        jobIds.push({ id: jobId, status, courierId: courier?.id ?? null, price });
        jobCount++;
      }
    }
    console.log('Created', jobCount, 'jobs');

    // --- Payments: one per DELIVERED job (approved), a few pending/declined for variety ---
    const providers = ['WOMPI', 'STRIPE_CONNECT', 'MERCADO_PAGO', 'PAYU'];
    let paymentCount = 0;
    for (const job of jobIds) {
      if (job.status === 'DELIVERED') {
        await client.query(
          `INSERT INTO payments (id, job_id, provider, reference, provider_reference, amount, currency, status, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,'COP','APPROVED',NOW(),NOW())`,
          [uuid(), job.id, pick(providers), 'REF-' + uuid().slice(0, 8).toUpperCase(), 'PROV-' + uuid().slice(0, 8), job.price]
        );
        paymentCount++;
      }
    }
    // a couple of edge-case payment states not tied to delivered jobs
    for (const status of ['PENDING', 'DECLINED', 'ERROR', 'REFUNDED']) {
      const job = pick(jobIds);
      await client.query(
        `INSERT INTO payments (id, job_id, provider, reference, provider_reference, amount, currency, status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,'COP',$7,NOW(),NOW())`,
        [uuid(), job.id, pick(providers), 'REF-' + uuid().slice(0, 8).toUpperCase(), 'PROV-' + uuid().slice(0, 8), job.price, status]
      );
      paymentCount++;
    }
    console.log('Created', paymentCount, 'payments');

    // --- Payouts: 2-3 per courier, varied status ---
    const payoutStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
    let payoutCount = 0;
    for (const courier of couriers) {
      const n = rand(2, 3);
      for (let i = 0; i < n; i++) {
        await client.query(
          `INSERT INTO payouts (id, courier_id, amount, method, status, created_at)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [uuid(), courier.id, rand(30000, 250000), pick(['bank_transfer', 'nequi', 'paypal']), pick(payoutStatuses), daysAgo(rand(0, 20))]
        );
        payoutCount++;
      }
    }
    console.log('Created', payoutCount, 'payouts');

    // --- Disputes ---
    const disputeSubjects = [
      'Paquete llegó dañado',
      'Repartidor no se presentó',
      'Cobro duplicado en factura',
      'Dirección de entrega incorrecta',
      'Demora excesiva en la entrega',
      'Producto faltante en el pedido',
    ];
    const disputeStatuses = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'ESCALATED'];
    const disputePriorities = ['LOW', 'MEDIUM', 'HIGH'];
    let disputeCount = 0;
    for (const subject of disputeSubjects) {
      const job = pick(jobIds);
      const status = pick(disputeStatuses);
      await client.query(
        `INSERT INTO disputes (id, job_id, opened_by, subject, detail, status, priority, assigned_to, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
        [
          uuid(),
          job.id,
          pick(['company@vexa.local', 'courier@vexa.local', 'owner@andesretail.co']),
          subject,
          'Detalle reportado por el usuario: ' + subject.toLowerCase() + '.',
          status,
          pick(disputePriorities),
          status === 'IN_REVIEW' || status === 'RESOLVED' ? demoAdminUser.id : null,
          daysAgo(rand(0, 15)),
        ]
      );
      disputeCount++;
    }
    console.log('Created', disputeCount, 'disputes');

    // --- Support tickets ---
    const ticketSubjects = [
      'No puedo actualizar mi método de pago',
      '¿Cómo cambio mi contraseña?',
      'Solicitud de factura electrónica',
      'Problema al subir documentos de verificación',
      'Consulta sobre comisión de la plataforma',
    ];
    const ticketStatuses = ['OPEN', 'IN_PROGRESS', 'ESCALATED', 'CLOSED'];
    let ticketCount = 0;
    for (const subject of ticketSubjects) {
      await client.query(
        `INSERT INTO support_tickets (id, requester_id, subject, "lastMessage", status, sla_hours, assigned_to, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,24,$6,$7,NOW())`,
        [
          uuid(),
          pick([demoCompanyUser.id, demoCourierUser.id]),
          subject,
          'Último mensaje del hilo de soporte sobre: ' + subject.toLowerCase(),
          pick(ticketStatuses),
          Math.random() < 0.5 ? demoAdminUser.id : null,
          daysAgo(rand(0, 10)),
        ]
      );
      ticketCount++;
    }
    console.log('Created', ticketCount, 'support tickets');

    // --- Notifications ---
    let notifCount = 0;
    const notifDefs = [
      { scope: 'global', audience: null, icon: 'campaign', title: 'Mantenimiento programado', body: 'La plataforma tendrá mantenimiento el domingo de 2am a 4am.' },
      { scope: 'global', audience: 'COMPANY', icon: 'local_offer', title: 'Nueva tarifa de comisión', body: 'A partir del próximo mes la comisión estándar cambia a 18%.' },
      { scope: 'global', audience: 'COURIER', icon: 'stars', title: 'Programa de bonos activo', body: 'Completa 20 entregas esta semana y gana un bono.' },
    ];
    for (const def of notifDefs) {
      await client.query(
        `INSERT INTO notifications (id, scope, audience, icon, title, body, is_read, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [uuid(), def.scope, def.audience, def.icon, def.title, def.body, Math.random() < 0.5, daysAgo(rand(0, 7))]
      );
      notifCount++;
    }
    for (const company of companies) {
      for (const [icon, title, body] of [
        ['local_shipping', 'Envío en camino', 'Tu repartidor está en camino al punto de recogida.'],
        ['check_circle', 'Entrega completada', 'Uno de tus envíos fue entregado exitosamente.'],
      ]) {
        await client.query(
          `INSERT INTO notifications (id, scope, company_id, icon, title, body, is_read, created_at)
           VALUES ($1,'company',$2,$3,$4,$5,$6,$7)`,
          [uuid(), company.id, icon, title, body, Math.random() < 0.5, daysAgo(rand(0, 5))]
        );
        notifCount++;
      }
    }
    for (const courier of couriers) {
      for (const [icon, title, body] of [
        ['payments', 'Retiro procesado', 'Tu retiro de fondos fue procesado exitosamente.'],
        ['star', 'Nueva calificación', 'Recibiste una nueva calificación de 5 estrellas.'],
      ]) {
        await client.query(
          `INSERT INTO notifications (id, scope, courier_id, icon, title, body, is_read, created_at)
           VALUES ($1,'courier',$2,$3,$4,$5,$6,$7)`,
          [uuid(), courier.id, icon, title, body, Math.random() < 0.5, daysAgo(rand(0, 5))]
        );
        notifCount++;
      }
    }
    console.log('Created', notifCount, 'notifications');

    await client.query('COMMIT');
    console.log('\nSeed complete.');
    console.log('\nLogin accounts (all use password: Vexa1234!):');
    console.log('  Admin:    admin@vexa.local');
    console.log('  Company:  company@vexa.local (Vexa Demo Company), owner@andesretail.co (Andes Retail SAS), owner@globalfreight.com (Global Freight Corp)');
    console.log('  Courier:  courier@vexa.local, david.miller@vexa.local, laura.gomez@vexa.local, carlos.perez@vexa.local, ana.torres@vexa.local');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed, rolled back:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
