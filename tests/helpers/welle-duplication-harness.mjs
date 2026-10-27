import { createRequire } from 'node:module';
const require = createRequire(new URL('../../backend/package.json', import.meta.url));
const express = require('express');
const cors = require('cors');
const { PGlite } = require('@electric-sql/pglite');

export const testId = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
export const sourceId = testId(1);
export const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
const listen = async app => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
};
const ident = name => {
  if (!/^[a-z_]+$/.test(name)) throw new Error(`Invalid fixture identifier: ${name}`);
  return `"${name}"`;
};

// The actual application router and supabase-js write to an in-memory PostgreSQL
// through this loopback-only PostgREST adapter. The production server is never started.
export async function createWelleDuplicationHarness() {
  const db = new PGlite();
  await db.exec(`
    create table wellen(id uuid primary key default gen_random_uuid(),name text not null,
      image_url text,description text,start_date date not null,end_date date not null,
      status text not null,types text[],goal_type text not null,goal_percentage numeric,
      goal_value numeric,foto_enabled bool default false,foto_only bool default false,
      foto_header text,foto_description text,no_limit_welle bool default false,
      is_deleted bool default false,created_at timestamptz default now(),updated_at timestamptz default now());
    create table markets(id text primary key,gebietsleiter_id uuid,is_active bool default true);
    create table wellen_markets(welle_id uuid references wellen(id),market_id text references markets(id),
      unique(welle_id,market_id));
    create table wellen_photo_tags(id uuid primary key default gen_random_uuid(),
      welle_id uuid references wellen(id),tag_name text,tag_type text,tag_order int,created_at timestamptz default now());
    create table wellen_kw_days(id uuid primary key default gen_random_uuid(),welle_id uuid references wellen(id),
      kw text,days text[],kw_order int);
    create table wellen_submissions(id uuid primary key default gen_random_uuid(),welle_id uuid references wellen(id),
      gebietsleiter_id uuid,market_id text,item_type text,item_id uuid,quantity int,value_per_unit numeric);
    create table wellen_photos(id uuid primary key default gen_random_uuid(),welle_id uuid references wellen(id),photo_url text);
  `);
  for (const [table,order] of [['wellen_displays','display_order'],['wellen_kartonware','kartonware_order'],['wellen_einzelprodukte','einzelprodukt_order']]) {
    await db.exec(`create table ${table}(id uuid primary key default gen_random_uuid(),welle_id uuid references wellen(id),
      name text,target_number int check(target_number>0),item_value numeric,description text,image_url text,picture_url text,
      artikel_nr text,ve int,ve_size int,vpe int,${order} int);`);
  }
  for (const [table,parent,order] of [['wellen_paletten','palette_id','palette_order'],['wellen_schuetten','schuette_id','schuette_order']]) {
    await db.exec(`create table ${table}(id uuid primary key default gen_random_uuid(),welle_id uuid references wellen(id),
      name text,description text,image_url text,picture_url text,size text,${order} int);
      create table ${table}_products(id uuid primary key default gen_random_uuid(),${parent} uuid references ${table}(id),
      name text,value_per_ve numeric,ve int,ean text,product_order int);`);
  }
  await db.query(`insert into wellen(id,name,image_url,start_date,end_date,status,types,goal_type,goal_value,
    foto_enabled,foto_header,foto_description) values($1,'Hagebau Testwelle',$2,'2026-10-01','2026-12-11','active',
    '{display,kartonware,palette,schuette,einzelprodukt}','value',25000,true,'Aufbau-Fotos','Bitte den Aufbau fotografieren')`, [sourceId,image]);
  for (let i=0;i<42;i++) {
    await db.query('insert into markets(id,gebietsleiter_id) values($1,$2)', [`test-market-${i}`,testId(99)]);
    await db.query('insert into wellen_markets values($1,$2)',[sourceId,`test-market-${i}`]);
  }
  for (const [table,order] of [['wellen_displays','display_order'],['wellen_kartonware','kartonware_order'],['wellen_einzelprodukte','einzelprodukt_order']]) {
    await db.query(`insert into ${table}(id,welle_id,name,target_number,item_value,picture_url,artikel_nr,ve,${order})
      values($1,$2,$3,10,12.75,$4,'TEST-334822',6,0)`,[testId(table.length),sourceId,`${table} Testartikel`,image]);
  }
  for (const [table,parent,order,count] of [['wellen_paletten','palette_id','palette_order',6],['wellen_schuetten','schuette_id','schuette_order',4]]) {
    for (let i=0;i<count;i++) {
      const item=(await db.query(`insert into ${table}(welle_id,name,picture_url,size,${order}) values($1,$2,$3,'1/4',${i}) returning id`,[sourceId,`${table} ${i+1}`,image])).rows[0];
      await db.query(`insert into ${table}_products(${parent},name,value_per_ve,ve,ean,product_order) values
        ($1,'Testprodukt A',24.5,8,'TEST-EAN-A',0),($1,'Testprodukt B',18.75,12,'TEST-EAN-B',1)`,[item.id]);
    }
  }
  await db.query(`insert into wellen_photo_tags(welle_id,tag_name,tag_type) values($1,'Aufbau','fixed'),($1,'Zusatz','optional');`,[sourceId]);
  await db.query(`insert into wellen_kw_days(welle_id,kw,days,kw_order) values($1,'44','{MO,DI,MI,DO,FR}',0),($1,'45','{MO,DI}',1)`,[sourceId]);
  await db.query(`insert into wellen_submissions(welle_id,gebietsleiter_id,market_id,item_type,item_id,quantity,value_per_unit)
    values($1,$2,'test-market-0','display',$3,3,10)`,[sourceId,testId(99),testId('wellen_displays'.length)]);
  await db.query('insert into wellen_photos(welle_id,photo_url) values($1,$2)',[sourceId,image]);

  const tables=(await db.query("select tablename from pg_tables where schemaname='public' order by tablename")).rows.map(r=>r.tablename);
  const snapshot = async () => Object.fromEntries(await Promise.all(tables.map(async table => [table,
    (await db.query(`select * from ${ident(table)} order by to_jsonb(${ident(table)})::text`)).rows])));
  const writes=[], errors=[], calls=[];
  const rest=express(); rest.use(express.json({limit:'2mb'}));
  rest.all('/rest/v1/:table',async(req,res)=>{
    try {
      const table=req.params.table;
      if(!tables.includes(table)) throw new Error(`Unexpected fixture table: ${table}`);
      const args=[], where=[];
      for (const [column,raw] of Object.entries(req.query)) {
        if(['select','order','limit','offset','columns'].includes(column))continue;
        const value=String(raw);
        if(value.startsWith('eq.')) { args.push(value.slice(3));where.push(`${ident(column)}=$${args.length}`); }
        else if(value.startsWith('in.(')) {
          const values=value.slice(4,-1).split(',').map(v=>v.replace(/^"|"$/g,''));
          where.push(`${ident(column)} in (${values.map(v=>{args.push(v);return `$${args.length}`;}).join(',')})`);
        } else if(value==='not.is.null')where.push(`${ident(column)} is not null`);
        else throw new Error(`Unexpected fixture filter: ${column}=${value}`);
      }
      const clause=where.length?` where ${where.join(' and ')}`:'';
      let rows;
      if(req.method==='GET') {
        const order=req.query.order?` order by ${String(req.query.order).split(',').map(v=>{const [column,direction]=v.split('.');return `${ident(column)} ${direction==='desc'?'desc':'asc'}`;}).join(',')}`:'';
        rows=(await db.query(`select * from ${ident(table)}${clause}${order}${req.query.limit?` limit ${Number(req.query.limit)}`:''}${req.query.offset?` offset ${Number(req.query.offset)}`:''}`,args)).rows;
      } else if(req.method==='POST') {
        const input=Array.isArray(req.body)?req.body:[req.body], columns=Object.keys(input[0]), parameters=[];
        const values=input.map(row=>`(${columns.map(column=>{parameters.push(row[column]);return `$${parameters.length}`;}).join(',')})`).join(',');
        rows=(await db.query(`insert into ${ident(table)}(${columns.map(ident).join(',')}) values ${values} returning *`,parameters)).rows;
        writes.push({table,method:req.method,rows});
      } else throw new Error(`Unexpected fixture mutation: ${req.method}`);
      // PostgREST emits SQL DATE as YYYY-MM-DD, whereas PGlite returns Date objects.
      rows=rows.map(row=>Object.fromEntries(Object.entries(row).map(([key,value])=>[
        key,['start_date','end_date'].includes(key)&&value instanceof Date?value.toISOString().slice(0,10):value
      ])));
      const single=req.headers.accept?.includes('application/vnd.pgrst.object');
      res.status(req.method==='POST'?201:200).json(single?rows[0]??null:rows);
    } catch(error){ errors.push(error.message);res.status(400).json({message:error.message,code:error.code}); }
  });
  const restApi=await listen(rest);
  process.env.SUPABASE_URL=restApi.origin;
  process.env.SUPABASE_SERVICE_KEY='sb_secret_isolated_wave_duplication_test';
  process.env.DISABLE_PRODUCT_UPDATE_SCHEDULER='true';
  const originalFetch=globalThis.fetch;
  globalThis.fetch=(input,init)=>{
    const url=new URL(typeof input==='string'?input:input.url||String(input));
    if(!['127.0.0.1','localhost'].includes(url.hostname))throw new Error(`Fixture blocked external request: ${url.origin}`);
    return originalFetch(input,init);
  };
  const {default:wellen}=await import('../../backend/src/routes/wellen.ts');
  const app=express();app.use(cors());app.use(express.json({limit:'2mb'}));
  const controls={failNextCreate:false,failList:false};
  app.use((req,res,next)=>{
    calls.push({method:req.method,path:req.path,body:req.body});
    if(req.headers['test-role']!=='none')req.user={id:testId(99),role:req.headers['test-role']||'admin'};
    if(controls.failNextCreate&&req.method==='POST'&&req.path==='/api/wellen') {
      controls.failNextCreate=false;return res.status(503).json({error:'Isolated test failure'});
    }
    if(controls.failList&&req.method==='GET'&&req.path==='/api/wellen')return res.status(503).json({error:'Isolated list failure'});
    next();
  });
  app.get('/api/products',(_req,res)=>res.json([]));
  app.use('/api/wellen',wellen);
  const api=await listen(app);
  return {db,origin:api.origin,writes,calls,errors,snapshot,controls,close:async()=>{
    await Promise.all([new Promise(r=>api.server.close(r)),new Promise(r=>restApi.server.close(r))]);
    globalThis.fetch=originalFetch;await db.close();
  }};
}
