// functions/api/test-db.js

// 这里的 context.env.DB 就是我们在 wrangler.toml 里配置的 binding
export async function onRequest(context) {
  try {
    // 1. 准备 SQL
    const stmt = context.env.DB.prepare("SELECT * FROM photos LIMIT 5");
    
    // 2. 执行查询 (D1 的 API 风格)
    const { results } = await stmt.all();

    // 3. 返回 JSON 给 Vue 前端
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}