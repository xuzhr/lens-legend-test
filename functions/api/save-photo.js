// functions/api/save-photo.js

export async function onRequestPost(context) {
  try {
    // 1. 解析前端传来的 FormData (包含文件和字段)
    const formData = await context.request.formData();
    
    const file = formData.get('file');           // 图片文件
    const metadataStr = formData.get('metadata'); // EXIF 元数据 (JSON string)
    const aiResultStr = formData.get('aiResult'); // AI 分析结果 (JSON string)

    if (!file || !metadataStr || !aiResultStr) {
      return new Response("缺少必要数据 (file, metadata, aiResult)", { status: 400 });
    }

    // 2. 解析 JSON 数据
    const metadata = JSON.parse(metadataStr);
    const aiResult = JSON.parse(aiResultStr);

    // 3. 生成唯一的 R2 文件名 (UUID)
    // crypto.randomUUID() 是 Cloudflare Workers 自带的，不需要 npm install
    const fileExtension = file.name.split('.').pop() || 'webp';
    const r2Key = `${crypto.randomUUID()}.${fileExtension}`;

    // 4. 【入仓】将图片写入 R2 存储桶
    // context.env.lens_storage 就是我们在 wrangler.jsonc 里绑定的 R2
    await context.env.lens_storage.put(r2Key, file);

    // 5. 【记账】将信息写入 D1 数据库
    // 注意：ai_tags 是数组，SQLite 存不了数组，要转成 JSON 字符串存
    const tagsJson = JSON.stringify(aiResult.visual_analysis?.tags || []);

    const query = `
      INSERT INTO photos (
        r2_key, original_name, 
        taken_at, latitude, longitude,
        location_name, country, 
        short_description, historical_context, ai_tags_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await context.env.lens_db.prepare(query)
      .bind(
        r2Key, 
        file.name,
        metadata.date || new Date().toISOString(), // 拍摄时间
        metadata.lat || null,  // 纬度
        metadata.lng || null,  // 经度
        aiResult.location_info?.name_guess || '未知地点',
        aiResult.location_info?.country || '未知国家',
        aiResult.visual_analysis?.short_description || '',
        aiResult.story_elements?.historical_context || '',
        tagsJson
      )
      .run();

    // 6. 返回成功信号
    return new Response(JSON.stringify({ 
      success: true, 
      photoId: result.meta.last_row_id, // 返回新插入的 ID，方便前端跳转
      r2Key: r2Key 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("保存失败:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}