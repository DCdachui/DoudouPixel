export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const pathname = url.pathname

    // 处理 API 路由
    if (pathname.startsWith('/api/')) {
      return handleApiRequest(request, env, pathname)
    }

    // 如果是静态资源（assets），直接返回
    if (pathname.startsWith('/assets/')) {
      return env.ASSETS.fetch(request)
    }

    // 如果请求的是文件（有扩展名），直接返回
    if (pathname.includes('.')) {
      return env.ASSETS.fetch(request)
    }

    // 对于所有其他路由，返回 index.html（SPA 路由）
    const indexRequest = new Request(new URL('/index.html', request.url), request)
    return env.ASSETS.fetch(indexRequest)
  }
}

async function handleApiRequest(request, env, pathname) {
  // 处理 /api/verify 端点
  if (pathname === '/api/verify' && request.method === 'POST') {
    try {
      const body = await request.json()
      const code = body.code?.trim()

      if (!code) {
        return new Response(
          JSON.stringify({ success: false, message: '卡密不能为空' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      // 从 KV 中验证卡密
      // 假设 KV 命名空间绑定名为 KEYS，如果不同请修改
      const kvNamespace = env.KEYS || env.ACCESS_CODES || env.KV
      
      if (!kvNamespace) {
        console.error('KV namespace not found. Available env keys:', Object.keys(env))
        return new Response(
          JSON.stringify({ success: false, message: '服务器配置错误' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      // 从 KV 中获取卡密对应的值
      const kvValue = await kvNamespace.get(code)
      
      if (kvValue !== null) {
        // 卡密有效
        return new Response(
          JSON.stringify({ success: true, message: '验证成功' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      } else {
        // 卡密无效
        return new Response(
          JSON.stringify({ success: false, message: '卡密错误或已失效' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    } catch (error) {
      console.error('Verify API error:', error)
      return new Response(
        JSON.stringify({ success: false, message: '服务器错误' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  // 其他 API 路由返回 404
  return new Response(
    JSON.stringify({ success: false, message: 'API endpoint not found' }),
    {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

