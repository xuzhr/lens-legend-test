// functions/api/img.js
// 这是一个专门用来“搬运”图片的接口
// 用法: /api/img?key=xxxx-xxxx.blob

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const key = url.searchParams.get('key');

  if (!key) {
    return new Response("Key not found", { status: 400 });
  }

  // 去 R2 仓库取货
  const object = await context.env.lens_storage.get(key);

  if (!object) {
    return new Response("Image not found in R2", { status: 404 });
  }

  // 把取到的图片流 (Body) 直接返回给浏览器
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  // 强制告诉浏览器这是图片 (防止它变成了下载文件)
  headers.set('Content-Type', 'image/webp'); 

  return new Response(object.body, { headers });
}