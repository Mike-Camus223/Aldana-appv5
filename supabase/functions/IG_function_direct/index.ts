import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('INSTAGRAM: Iniciando con ID directo...')
    
    // Usar secrets de testing
    const igToken = Deno.env.get('TOKEN_IG_TEST')
    const igUserId = Deno.env.get('IG_USER_ID_TESTING') || '17841444599332423'
    
    if (!igToken) {
      throw new Error('Falta TOKEN_IG_TEST en Supabase Secrets')
    }
    
    console.log('Token encontrado, longitud:', igToken.length)
    console.log('Usando User ID directo:', igUserId)
    
    // PASO 1: Verificar token
    console.log('Verificando token...')
    const meResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${igToken}&fields=id,name`
    )
    
    if (!meResponse.ok) {
      const meError = await meResponse.text()
      console.error('Token inválido:', meError)
      throw new Error(`Token inválido: ${meError}`)
    }
    
    const meData = await meResponse.json()
    console.log('Token válido. Usuario:', meData.name)
    
    // PASO 2: Obtener media directamente usando el ID de Instagram
    console.log('Obteniendo media de Instagram con ID directo...')
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=20&access_token=${igToken}`
    )
    
    if (!mediaResponse.ok) {
      const mediaError = await mediaResponse.text()
      console.error('Error obteniendo media:', mediaError)
      throw new Error(`Error obteniendo media: ${mediaError}`)
    }
    
    const mediaData = await mediaResponse.json()
    console.log('Posts obtenidos:', mediaData.data?.length || 0)
    
    // PASO 3: Filtrar solo videos
    const videos = mediaData.data.filter((item: any) => 
      item.media_type === 'VIDEO' || item.media_type === 'REELS'
    )
    
    console.log('Videos/Reels filtrados:', videos.length)
    
    if (videos.length === 0) {
      console.warn('No se encontraron videos en la cuenta')
      return new Response(
        JSON.stringify({ data: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    
    // PASO 4: Procesar cada video
    const reels = await Promise.all(
      videos.slice(0, 8).map(async (reel: any) => {
        // Intentar obtener comentarios
        let comments = []
        try {
          const commentsResponse = await fetch(
            `https://graph.facebook.com/v18.0/${reel.id}/comments?fields=text,username,timestamp&limit=5&access_token=${igToken}`
          )
          
          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json()
            comments = (commentsData.data || []).map((comment: any) => ({
              user: comment.username || 'Usuario',
              text: comment.text,
              time: formatTimeAgo(new Date(comment.timestamp))
            }))
          }
        } catch (e) {
          console.warn('Sin comentarios para', reel.id)
        }
        
        return {
          id: reel.id,
          image_url: reel.thumbnail_url || reel.media_url,
          caption: reel.caption || '',
          hashtags: extractHashtags(reel.caption || ''),
          post_url: reel.permalink,
          media_type: reel.media_type,
          media_url: reel.media_url,
          like_count: reel.like_count || 0,
          comments_count: reel.comments_count || 0,
          timestamp: reel.timestamp,
          comments: comments,
          media: [{
            url: reel.media_url,
            type: 'video'
          }]
        }
      })
    )
    
    console.log(`Exito! ${reels.length} reels procesados`)
    
    return new Response(
      JSON.stringify({ data: reels }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
    
  } catch (error: any) {
    console.error('ERROR:', error.message)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        hint: 'Verifica que TOKEN_IG_TEST esté en Supabase Secrets y que el ID de Instagram sea correcto'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

function extractHashtags(text: string): string {
  const hashtags = text.match(/#\w+/g)
  return hashtags ? hashtags.join(' ') : ''
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Hace menos de 1 hora'
  if (diffInHours < 24) return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) return `Hace ${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}`
  
  const diffInMonths = Math.floor(diffInDays / 30)
  return `Hace ${diffInMonths} ${diffInMonths === 1 ? 'mes' : 'meses'}`
}