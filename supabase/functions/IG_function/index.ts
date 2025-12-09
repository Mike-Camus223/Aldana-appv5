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
    
    // Usar secrets de Supabase
    const igToken = Deno.env.get('TOKEN_IG_TEST')
    const igUserId = Deno.env.get('IG_USER_ID_TESTING')
    
    if (!igToken) {
      throw new Error('Falta TOKEN_IG_TEST en Supabase Secrets')
    }
    
    if (!igUserId) {
      throw new Error('Falta IG_USER_ID_TESTING en Supabase Secrets')
    }
    
    console.log('Token encontrado, longitud:', igToken.length)
    console.log('Usando User ID:', igUserId)
    
    // PASO 1: Verificar token y obtener info del usuario
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
    
    // PASO 2: Obtener media de Instagram (REELS E HISTORIAS)
    console.log('Obteniendo media de Instagram...')
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
    
    // PASO 3: Filtrar reels, historias y videos
    const videosAndStories = mediaData.data.filter((item: any) => 
      item.media_type === 'VIDEO' || item.media_type === 'REELS' || item.media_type === 'STORY'
    )
    
    console.log('Videos/Reels/Historias filtrados:', videosAndStories.length)
    
    if (videosAndStories.length === 0) {
      console.warn('No se encontraron videos en la cuenta')
      return new Response(
        JSON.stringify({ data: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    
    // PASO 4: Obtener foto de perfil y nombre de usuario
    console.log('Obteniendo foto de perfil...')
    const profileResponse = await fetch(
      `https://graph.facebook.com/v18.0/${igUserId}?fields=profile_picture_url,username&access_token=${igToken}`
    )
    
    let profilePictureUrl = ''
    let username = meData.name
    if (profileResponse.ok) {
      const profileData = await profileResponse.json()
      profilePictureUrl = profileData.profile_picture_url || ''
      username = profileData.username || meData.name
    }
    
    // PASO 5: Procesar cada video/historia con comentarios
    const reels = await Promise.all(
      videosAndStories.slice(0, 8).map(async (item: any) => {
        // Obtener comentarios reales con información de usuario
        let comments = []
        try {
          const commentsResponse = await fetch(
            `https://graph.facebook.com/v18.0/${item.id}/comments?fields=text,username,timestamp,user{id,name,profile_pic}&limit=10&access_token=${igToken}`
          )
          
          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json()
            comments = (commentsData.data || []).map((comment: any) => ({
              user: comment.username || comment.user?.name || 'Usuario',
              text: comment.text,
              time: formatTimeAgo(new Date(comment.timestamp)),
              profile_pic: comment.user?.profile_pic || null
            }))
          }
        } catch (e) {
          console.warn('Error obteniendo comentarios para', item.id, e)
        }
        
        return {
          id: item.id,
          image_url: item.thumbnail_url || item.media_url,
          caption: item.caption || '',
          hashtags: extractHashtags(item.caption || ''),
          post_url: item.permalink,
          media_type: item.media_type,
          media_url: item.media_url,
          like_count: item.like_count || 0,
          comments_count: item.comments_count || 0,
          timestamp: item.timestamp,
          comments: comments,
          media: [{
            url: item.media_url,
            type: item.media_type === 'VIDEO' || item.media_type === 'REELS' ? 'video' : 'image'
          }],
          profile_picture_url: profilePictureUrl,
          username: username,
          account_name: meData.name
        }
      })
    )
    
    console.log(`Exito! ${reels.length} items procesados`)
    
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
        hint: 'Verifica que TOKEN_IG_TEST y IG_USER_ID_TESTING estén en Supabase Secrets'
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