import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper functions for rotations
export const getRotations = async () => {
  const { data, error } = await supabase
    .from('rotations')
    .select('*')
    .order('created_at')
  
  if (error) throw error
  return data
}

export const getPlayersByRotation = async (rotationId) => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('rotation_id', rotationId)
    .order('name')
  
  if (error) throw error
  return data
}