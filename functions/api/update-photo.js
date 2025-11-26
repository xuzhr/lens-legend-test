// functions/api/update-photo.js
export async function onRequestPost(context) {
  try {
    const { id, story } = await context.request.json();

    // 执行 Update 语句
    const result = await context.env.lens_db.prepare(
      "UPDATE photos SET historical_context = ? WHERE id = ?"
    ).bind(story, id).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}