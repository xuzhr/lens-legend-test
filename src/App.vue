<script setup>
//import { ref } from 'vue';
import { ref, onMounted } from 'vue'; // 👈 把 onMounted 加进去！
import PhotoUploader from './components/PhotoUploader.vue';
import BrandLogo from './components/BrandLogo.vue'; // 引入 Logo

// 定义状态
const globalStatus = ref('等待指令...');
const isAnalyzing = ref(false);
const aiResult = ref(null);
const photoMeta = ref(null); // 🆕 新增：用来存照片的 EXIF 身份证

// 🆕 新增：是否正在保存中
const isSaving = ref(false);

// 🆕 新增：相册列表数据
const gallery = ref([]);

// 🆕 新增：加载相册函数
const loadGallery = async () => {
  try {
    const res = await fetch('/api/get-photos');
    const data = await res.json();
    if (Array.isArray(data)) {
      gallery.value = data;
      console.log('📚 画廊加载完毕，共', data.length, '张');
    }
  } catch (e) {
    console.error("加载画廊失败:", e);
  }
};

// 🆕 新增：保存照片到云端
const savePhoto = async () => {
  if (!aiResult.value || !photoMeta.value) return;
  
  isSaving.value = true;
  globalStatus.value = "💾 正在将记忆刻入永恒 (上传 R2 & D1)...";

  try {
    // 1. 构造 FormData (像填表一样)
    const formData = new FormData();
    // 这里的 data.compressedFile 需要从 handlePhotoProcessed 里存下来
    // 所以我们需要在外面定义一个变量存一下当前处理的图片
    formData.append('file', currentCompressedFile.value); 
    formData.append('metadata', JSON.stringify(photoMeta.value));
    formData.append('aiResult', JSON.stringify(aiResult.value));

    // 2. 调用后端
    const response = await fetch('/api/save-photo', {
      method: 'POST',
      body: formData // fetch 会自动设置 Content-Type 为 multipart/form-data
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    globalStatus.value = `🎉 保存成功！照片ID: ${data.photoId} (已安全存入 D1)`;
    alert("✅ 记忆已存档！");
    
    await loadGallery(); // 保存成功后，自动刷新列表，让你看到刚存的那张
    
  } catch (e) {
    console.error(e);
    globalStatus.value = `❌ 保存失败: ${e.message}`;
  } finally {
    isSaving.value = false;
  }
};

// ❗ 重要：为了让 savePhoto 能拿到文件，我们需要定义一个变量
const currentCompressedFile = ref(null);


// 工具函数：转 Base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

// 核心逻辑
const handlePhotoProcessed = async (data) => {
  try {

    currentCompressedFile.value = data.compressedFile; // 👈 加这一行！
    // 1. 存下元数据，准备展示 (🆕 这一步满足你的新需求)
    photoMeta.value = data.metadata;
    
    // 2. 状态更新
    globalStatus.value = `📸 照片压缩完毕 (${(data.compressedFile.size / 1024).toFixed(0)} KB)\n🚀 正在发送给 AI 历史学家...`;
    isAnalyzing.value = true;
    aiResult.value = null;

    // 3. 转码并发送
    const base64Image = await fileToBase64(data.compressedFile);

    const response = await fetch('/api/analyze-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: base64Image,
        userPrompt: "请挖掘这张照片背后的历史线索。"
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || `HTTP 错误 ${response.status}`);
    }

    // 4. 解析结果
    const resultData = await response.json();
    aiResult.value = typeof resultData === 'string' ? JSON.parse(resultData) : resultData;
    globalStatus.value = "✅ AI 分析完成！";

  } catch (error) {
    console.error(error);
    globalStatus.value = `❌ 发生错误: ${error.message}`;
  } finally {
    isAnalyzing.value = false;
  }
};

// 新增：删除照片函数
const deletePhoto = async (photo) => {
  // DBA 的双重确认：防止手滑
  if (!confirm(`老马，你确定要删除 "${photo.location_name}" 这段记忆吗？\n删除后不可恢复！`)) return;

  try {
    const res = await fetch(`/api/delete-photo?id=${photo.id}&key=${photo.r2_key}`, {
      method: 'DELETE'
    });
    
    if (res.ok) {
      // 成功后，直接在前端数组里把它踢出去，不用刷新页面
      gallery.value = gallery.value.filter(p => p.id !== photo.id);
      alert("🗑️ 脏数据已清理！");
    } else {
      alert("删除失败，请看控制台");
    }
  } catch (e) {
    console.error(e);
  }
};

// 新增：编辑故事函数
const editStory = async (photo) => {
  // 简单粗暴：用 prompt 弹窗让用户改字
  const newStory = prompt("🖊️ 修改这段历史回响：", photo.historical_context);
  
  // 如果用户点了取消，或者内容没变，就不发请求
  if (newStory === null || newStory === photo.historical_context) return;

  try {
    const res = await fetch('/api/update-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: photo.id, story: newStory })
    });

    if (res.ok) {
      // 前端立刻更新显示
      photo.historical_context = newStory;
    }
  } catch (e) {
    alert("修改失败：" + e.message);
  }
};


// 组件挂载时，自动读取数据
onMounted(() => {
  loadGallery();
});

</script>

<template>
  <div class="app-container">
     <header class="flex flex-col items-center mb-10 space-y-6">
        <BrandLogo 
          class="logo-wrapper"
          style="width: 12rem; height: 12rem; border-radius: 1rem; margin: 0 auto;" 
        /> 
  
        <div class="text-center" style="margin-top: 1.5rem;">
            <h1 class="brand" style="font-size: 2.5rem; font-weight: 800; letter-spacing: -0.05em; color: #1e293b;">
              LENS & LEGEND <span class="tag">Dev</span>
            </h1>
            <p class="slogan" style="color: #64748b; font-style: italic; font-family: serif;">
                Behind the lens, lies a legend.
            </p>
        </div>
    </header>

    <main>
      <PhotoUploader @photo-processed="handlePhotoProcessed" />

      <div v-if="photoMeta" class="metadata-dashboard">
        <div class="meta-item">
          <span class="meta-icon">📅</span>
          <div class="meta-content">
            <span class="meta-label">拍摄时间</span>
            <span class="meta-value">{{ photoMeta.date || '未知时间' }}</span>
          </div>
        </div>
        
        <div class="meta-item">
          <span class="meta-icon">📍</span>
          <div class="meta-content">
            <span class="meta-label">地理坐标</span>
            <span class="meta-value">
              {{ photoMeta.lat ? `${parseFloat(photoMeta.lat).toFixed(4)}` : 'N/A' }}, 
              {{ photoMeta.lng ? `${parseFloat(photoMeta.lng).toFixed(4)}` : 'N/A' }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="isAnalyzing" class="loading-box">
        ⏳ AI 正在翻阅史书...
      </div>

      <div v-if="aiResult" class="result-card">
        <div class="result-header">
          <h2>📍 {{ aiResult.location_info?.name_guess || '未知秘境' }}</h2>
          <span class="country-tag">{{ aiResult.location_info?.country || '地球' }}</span>
        </div>

     <div class="action-area" style="margin-top: 20px; text-align: center;">
        <button @click="savePhoto" :disabled="isSaving" class="save-btn">
             {{ isSaving ? '💾 正在归档...' : '✨ 永久保存这段记忆' }}
        </button>
     </div>

        <p class="description">
          <strong>👁️ 视觉速写：</strong> {{ aiResult.visual_analysis?.short_description }}
        </p>

        <div class="story-box">
          <h3>📜 历史回响</h3>
          <p>{{ aiResult.story_elements?.historical_context }}</p>
        </div>
        
        <details class="json-debug">
          <summary>查看 AI 原始返回 (DBA 专用)</summary>
          <pre>{{ JSON.stringify(aiResult, null, 2) }}</pre>
        </details>
      </div>

      <div class="log-box" v-if="globalStatus">
        <h3>📟 系统日志</h3>
        <pre>{{ globalStatus }}</pre>
      </div>

      <div class="gallery-section" v-if="gallery.length > 0">
        <div class="gallery-divider">
          <span>🏛️ 时光画廊 ({{ gallery.length }})</span>
        </div>

        <div class="gallery-grid">
          <div v-for="photo in gallery" :key="photo.id" class="gallery-card">
            <div class="card-image">
              <img :src="`/api/img?key=${photo.r2_key}`" loading="lazy" />
                <button class="delete-btn" @click.stop="deletePhoto(photo)" title="删除记忆">
                    ✕
                </button>
              <div class="card-overlay">
                <span class="card-date">{{ photo.taken_at ? photo.taken_at.split('T')[0] : '未知日期' }}</span>
              </div>
            </div>
            
            <div class="card-content">
              <h4>📍 {{ photo.location_name }}</h4>
                <p class="card-story" @click="editStory(photo)" title="点击修改文字" style="cursor: pointer;">
                    {{ photo.historical_context }}
                </p>
              <p class="card-story">{{ photo.historical_context }}</p>
            </div>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<style>
/* 保持之前的样式不变，新增 metadata-dashboard 样式 */

.metadata-dashboard {
  display: flex;
  justify-content: space-around;
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 15px;
  margin-top: 20px;
  font-family: monospace; /* DBA 喜欢的等宽字体 */
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.meta-icon { font-size: 1.5rem; }

.meta-content {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.meta-label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
.meta-value { font-size: 0.9rem; color: #1e293b; font-weight: bold; }

/* 其他样式保持之前的... */
body { margin: 0; background-color: #f8fafc; color: #334155; }
.app-container { max-width: 800px; margin: 0 auto; padding: 40px 20px; font-family: system-ui, sans-serif; }
header { text-align: center; margin-bottom: 40px; }
.brand { color: #0f172a; font-size: 2.5rem; margin: 0; font-weight: 800; }
.tag { font-size: 0.4em; background: #fbbf24; color: #fff; padding: 4px 8px; border-radius: 6px; vertical-align: middle; }
.slogan { color: #64748b; margin-top: 10px; }
.loading-box { text-align: center; margin: 20px 0; font-size: 1.2rem; color: #3b82f6; animation: pulse 1.5s infinite; }
@keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
.result-card { background: white; border-radius: 12px; padding: 25px; margin-top: 30px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
.result-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 15px; }
.result-header h2 { margin: 0; color: #1e293b; }
.country-tag { background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: bold; }
.description { color: #475569; line-height: 1.6; }
.story-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
.story-box h3 { margin-top: 0; color: #92400e; font-size: 1rem; }
.story-box p { margin: 0; color: #78350f; font-style: italic; }
.log-box { margin-top: 30px; background: #1e293b; color: #10b981; padding: 20px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; }
.json-debug { margin-top: 20px; color: #94a3b8; font-size: 0.8em; cursor: pointer; }

/* 画廊样式 */
.gallery-section { margin-top: 60px; }

.gallery-divider {
  display: flex; align-items: center; justify-content: center; margin-bottom: 30px;
  color: #94a3b8; font-weight: bold; letter-spacing: 2px; text-transform: uppercase;
}
.gallery-divider::before, .gallery-divider::after {
  content: ""; flex: 1; border-bottom: 1px solid #e2e8f0; margin: 0 20px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); /* 响应式网格 */
  gap: 25px;
}

.gallery-card {
  background: white; border-radius: 12px; overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #f1f5f9;
  transition: transform 0.2s;
}
.gallery-card:hover { transform: translateY(-5px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }

.card-image { position: relative; height: 200px; overflow: hidden; }
.card-image img { width: 100%; height: 100%; object-fit: cover; }
.card-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  padding: 10px; color: white; font-size: 0.8rem;
}

.card-content { padding: 15px; }
.card-content h4 { margin: 0 0 8px 0; color: #1e293b; font-size: 1.1rem; }
.card-story {
  color: #64748b; font-size: 0.9rem; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; /* 限制显示3行 */
}

/* 删除按钮样式 */
.delete-btn {
  position: absolute; top: 10px; right: 10px;
  background: rgba(0, 0, 0, 0.5); color: white;
  border: none; width: 30px; height: 30px; border-radius: 50%;
  cursor: pointer; opacity: 0; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold;
}
.gallery-card:hover .delete-btn { opacity: 1; } /* 鼠标悬停才显示，保持界面整洁 */
.delete-btn:hover { background: #ef4444; transform: scale(1.1); }


</style>

