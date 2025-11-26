// functions/api/delete-photo.js
export async function onRequestDelete(context) {
  try {
    // 获取 URL 参数
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');
    const r2Key = url.searchParams.get('key');

    if (!id || !r2Key) {
      return new Response("这就尴尬了，没给 ID 或 Key", { status: 400 });
    }

    // 1. 先斩首：从 R2 删除文件
    await context.env.lens_storage.delete(r2Key);

    // 2. 后除名：从 D1 删除记录
    await context.env.lens_db.prepare(
      "DELETE FROM photos WHERE id = ?"
    ).bind(id).run();

    return new Response(JSON.stringify({ success: true, msg: "已彻底抹除" }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}