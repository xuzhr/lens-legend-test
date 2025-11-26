// functions/api/get-photos.js

export async function onRequestGet(context) {
  try {
    // 执行 SQL：按 ID 倒序排列（最新的在最前面）
    const { results } = await context.env.lens_db.prepare(
      "SELECT * FROM photos ORDER BY id DESC"
    ).all();

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}