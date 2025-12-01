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
      // 添加 CORS 头部
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      }

      // 处理 OPTIONS 预检请求
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
      }

      // 解析请求体
      let body
      try {
        const text = await request.text()
        console.log('Request body text:', text)
        body = JSON.parse(text)
        console.log('Parsed body:', body)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        return new Response(
          JSON.stringify({ success: false, message: '请求格式错误' }),
          {
            status: 400,
            headers: corsHeaders
          }
        )
      }

      const code = body.code?.trim()
      console.log('Extracted code:', code)

      if (!code) {
        return new Response(
          JSON.stringify({ success: false, message: '卡密不能为空' }),
          {
            status: 400,
            headers: corsHeaders
          }
        )
      }

      // 从 KV 中验证卡密
      // 使用 wrangler.jsonc 中配置的绑定名称 KV_BINDING
      const kvNamespace = env.KV_BINDING
      
      console.log('Available env keys:', Object.keys(env))
      console.log('KV_BINDING exists:', !!kvNamespace)
      
      if (!kvNamespace) {
        console.error('KV namespace not found. Available env keys:', Object.keys(env))
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: '服务器配置错误：KV 命名空间未找到',
            debug: { envKeys: Object.keys(env) }
          }),
          {
            status: 500,
            headers: corsHeaders
          }
        )
      }

      // 从 KV 中获取卡密对应的值
      console.log('Verifying code:', code)
      let kvValue
      try {
        kvValue = await kvNamespace.get(code)
        console.log('KV lookup result:', kvValue !== null ? 'found' : 'not found')
        if (kvValue !== null) {
          console.log('KV value:', kvValue)
        }
      } catch (kvError) {
        console.error('KV access error:', kvError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'KV 访问错误',
            error: kvError.message 
          }),
          {
            status: 500,
            headers: corsHeaders
          }
        )
      }
      
      if (kvValue !== null) {
        // 卡密有效
        return new Response(
          JSON.stringify({ success: true, message: '验证成功' }),
          {
            status: 200,
            headers: corsHeaders
          }
        )
      } else {
        // 卡密无效
        return new Response(
          JSON.stringify({ success: false, message: '卡密错误或已失效' }),
          {
            status: 200,
            headers: corsHeaders
          }
        )
      }
    } catch (error) {
      console.error('Verify API error:', error)
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: '服务器错误',
          error: error.message,
          errorName: error.name
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
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

