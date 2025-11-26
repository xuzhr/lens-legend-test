import OpenAI from 'openai';

export async function onRequestPost(context) {
  try {
    // 1. 获取前端传来的数据
    // 注意：这里我们还没处理图片上传逻辑，先假设前端传的是个 URL 或者 Base64
    // 下一步我们会把前端压缩好的图片接进来。
    const { imageUrl, userPrompt } = await context.request.json();

    // 2. 检查一下有没有 Key (老马的私房钱藏好没)
    if (!context.env.OPENROUTER_API_KEY) {
      throw new Error("缺少 OPENROUTER_API_KEY，请检查 .dev.vars 文件！");
    }

    // 3. 初始化 OpenAI 客户端 (指向 OpenRouter)
    // 🟢 关键修改点都在这里
    const openai = new OpenAI({
      apiKey: context.env.OPENROUTER_API_KEY, // 对应 .dev.vars 里的名字
      baseURL: "https://openrouter.ai/api/v1", // 指向 OpenRouter 接口
      defaultHeaders: {
        "HTTP-Referer": "https://lens-legend-test.com", // 填个你的域名(假的也行)
        "X-Title": "Lens & Legend Dev",            // 应用名称
      },
    });

    // 4. 准备 Prompt (让 AI 扮演历史学家)
    const systemPrompt = `
      你是一位精通“摄影美学”与“世界历史”的 AI 视觉专家。
      请分析图片，并返回严格的 JSON 格式数据（不要 markdown 标记）。
      JSON 结构如下：
      {
        "location_info": { "name_guess": "猜测地点", "country": "国家" },
        "visual_analysis": { "short_description": "简述", "tags": ["标签1", "标签2"] },
        "story_elements": { "historical_context": "一段50字的简短历史背景或氛围描述", "mood": "氛围" }
      }
    `;

    // 5. 发起请求
    const completion = await openai.chat.completions.create({
      // 🟢 模型选择：
      // 方案 A (省钱开发): "google/gemini-flash-1.5"
      // 方案 B (效果最好): "openai/gpt-4o"
      //model: "google/gemini-flash-1.5", 
      model: "openai/gpt-4o-mini",
      
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt || "请分析这张图片" },
            {
              type: "image_url",
              image_url: {
                url: imageUrl // 这里目前需要一个公网 URL，下一步咱们解决 Base64 问题
              },
            },
          ],
        },
      ],
      // 注意：Gemini 对 json_object 支持有时不稳定，如果你用 gpt-4o 加上这行，Gemini 可以先注释掉
      // response_format: { type: "json_object" }, 
    });

    // 6. 拿到结果
    const result = completion.choices[0].message.content;

    return new Response(result, {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI 出错:", error);
    return new Response(JSON.stringify({ 
      error: error.message, 
      stack: error.stack 
    }), { status: 500 });
  }
}