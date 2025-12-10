// Vercel Serverless Function - Markets API
// File: api/markets.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''; // Service key, NOT anon key!

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method, query, body } = req;
    const { id } = query;

    switch (method) {
      case 'GET':
        if (id) {
          // Get single market
          const { data, error } = await supabase
            .from('markets')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;
          return res.status(200).json(data);
        } else {
          // Get all markets
          const { data, error } = await supabase
            .from('markets')
            .select('*')
            .order('name', { ascending: true });

          if (error) throw error;
          return res.status(200).json(data);
        }

      case 'POST':
        if (req.url?.includes('/import')) {
          // Bulk import
          const markets = body;
          const { data, error } = await supabase
            .from('markets')
            .upsert(markets, { onConflict: 'id' })
            .select();

          if (error) throw error;
          return res.status(200).json({
            success: data?.length || 0,
            failed: markets.length - (data?.length || 0),
          });
        } else {
          // Create single market
          const { data, error } = await supabase
            .from('markets')
            .insert(body)
            .select()
            .single();

          if (error) throw error;
          return res.status(201).json(data);
        }

      case 'PUT':
        if (!id) {
          return res.status(400).json({ error: 'Market ID required' });
        }
        // Update market
        const { data: updateData, error: updateError } = await supabase
          .from('markets')
          .update(body)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;
        return res.status(200).json(updateData);

      case 'DELETE':
        if (!id) {
          return res.status(400).json({ error: 'Market ID required' });
        }
        // Delete market
        const { error: deleteError } = await supabase
          .from('markets')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;
        return res.status(204).end();

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

