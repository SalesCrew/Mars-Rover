import { readFile } from 'node:fs/promises';
import { createQuarterPricingHarnessBase, testId } from './quarter-pricing-harness-base.mjs';
export { testId };
export const actor=testId(99);
export async function createQuarterPricingHarness(options = {}) {
  return createQuarterPricingHarnessBase({
    prepareData:async(db)=>{
      await db.exec(`
        create role anon;create role authenticated;create role service_role bypassrls;
        alter table wellen_submissions add column created_at timestamptz default now();
        alter table wellen_submissions add column submission_batch_id uuid;
        alter table wellen_submissions add column photo_url text;
        alter table wellen_submissions add column delivery_photo_url text;
        alter table wellen_submissions add column parent_palette_id uuid;
        alter table markets add column name text default 'Synthetic Market';
        alter table markets add column chain text default 'BILLA';
        alter table markets add column address text default 'Synthetic Street 1';
        alter table markets add column city text default 'Synthetic City';
        alter table markets add column postal_code text default '1000';
        alter table markets add column internal_id text default 'SYNTHETIC-MARKET';
        alter table markets add column mars_fil_nr text;
        alter table markets add column last_visit_date date;
        alter table markets add column current_visits int default 0;
        alter table markets add column frequency int default 1;
        alter table markets add column gebietsleiter_name text default 'Synthetic GL';
        alter table markets add column gebietsleiter_email text;
        create table market_visits(id uuid default gen_random_uuid(),market_id text,gebietsleiter_id uuid,visit_date date,source text,unique(market_id,visit_date));
        create table gebietsleiter(id uuid primary key,name text,is_active bool default true,is_test bool default false,email text,address text,postal_code text,city text);
        create table products(id text primary key,name text,department text,product_type text,price numeric,content text,pallet_size int,artikel_nr text,is_deleted bool default false,is_active bool default true);
      `);
      await db.query("insert into gebietsleiter(id,name,email) values($1,'Synthetic GL','synthetic@example.invalid')",[actor]);
      await db.query("update wellen_submissions set delivery_photo_url='data:image/png;base64,aA=='");
      await db.exec('create unique index synthetic_submission_batch on wellen_submissions(welle_id,gebietsleiter_id,submission_batch_id,item_type,item_id) where submission_batch_id is not null');
      await db.exec(await readFile(new URL('../../backend/supabase/migrations/20261112132449_wave_quarter_catalog.sql',import.meta.url),'utf8'));
      await db.exec(await readFile(new URL('../../backend/supabase/migrations/20261112152854_wave_catalog_validity_and_exact_legacy_matches.sql',import.meta.url),'utf8'));
      await db.exec(await readFile(new URL('../../backend/supabase/migrations/20261113091431_wave_single_products_always_ve.sql',import.meta.url),'utf8'));
      const {year,quarter}=(await db.query("select extract(year from now() at time zone 'Europe/Vienna')::int as year,extract(quarter from now() at time zone 'Europe/Vienna')::int as quarter")).rows[0];
      const entries=[
        {department:'food',item_type:'display',artikel_nr:'900001',name:'Synthetic Display',units_per_ve:1,price_per_order:120,source_cell:'Synthetic!E5:H5'},
        {department:'food',item_type:'kartonware',artikel_nr:'900002',name:'Synthetic Megapack',units_per_ve:1,price_per_order:24,source_cell:'Synthetic!H6:K6'},
        {department:'food',item_type:'einzelprodukt',artikel_nr:'900003',name:'Synthetic Single Product',units_per_ve:6,price_per_order:18,source_cell:'Synthetic!H7:K7'},
      ];
      if(options.seedCatalog !== false) await db.query('select import_quarter_prices($1,$2,$3,$4,$5,$6)',[year,quarter,'synthetic-current.xlsx','b'.repeat(64),JSON.stringify(entries),actor]);
      await options.prepareData?.(db);
    },
    configureApp:async(app,db)=>{
      app.get('/api/markets',async(_req,res)=>res.json((await db.query('select *,gebietsleiter_id as gebietsleiter from markets')).rows.map(r=>({...r,isActive:r.is_active,postalCode:r.postal_code,internalId:r.internal_id}))));
      app.get('/api/gebietsleiter',async(_req,res)=>res.json((await db.query('select * from gebietsleiter')).rows));
      app.get('/__test__/health',(_req,res)=>res.json({isolated:true,synthetic:true,productionConnections:false}));
      const {default:exports}=await import('../../backend/src/routes/export.ts');
      const {requireAdmin}=await import('../../backend/src/middleware/auth.ts');
      app.use('/api/export',requireAdmin,exports);
      await options.configureApp?.(app,db);
    },
  });
}
