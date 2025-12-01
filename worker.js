export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const pathname = url.pathname

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

