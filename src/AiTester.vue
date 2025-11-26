<script setup>
import { ref } from 'vue'

const imageUrl = ref('https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Colosseo_2020.jpg/640px-Colosseo_2020.jpg') // 默认放一张罗马斗兽场的图
const aiResult = ref(null)
const isLoading = ref(false)
const errorMsg = ref('')

const analyzeImage = async () => {
  isLoading.value = true
  errorMsg.value = ''
  aiResult.value = null

  try {
    // 调用我们刚才写的后端 API
    const response = await fetch('/api/analyze-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: imageUrl.value,
        userPrompt: "这张照片是在哪里拍的？"
      })
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    aiResult.value = data
  } catch (e) {
    errorMsg.value = e.message
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="container">
    <h2>🤖 Lens & Legend AI 实验室</h2>
    
    <div class="input-section">
      <p>输入一张图片 URL (或使用默认):</p>
      <input v-model="imageUrl" type="text" style="width: 100%; padding: 8px;" />
      
      <div class="preview">
        <img :src="imageUrl" alt="Preview" style="max-height: 200px; margin-top: 10px;" />
      </div>

      <button @click="analyzeImage" :disabled="isLoading" style="margin-top: 10px; padding: 10px 20px;">
        {{ isLoading ? 'AI 正在观察...' : '启动视觉分析 ✨' }}
      </button>
    </div>

    <div v-if="errorMsg" class="error">{{ errorMsg }}</div>

    <div v-if="aiResult" class="result-box">
      <h3>分析报告:</h3>
      <p><strong>📍 猜测:</strong> {{ aiResult.historical_guess || '未知地点' }}</p>
      <p><strong>📝 描述:</strong> {{ aiResult.short_description }}</p>
      <p><strong>🎨 氛围:</strong> {{ aiResult.mood }}</p>
      <div class="tags">
        <span v-for="tag in aiResult.tags" :key="tag" class="tag">#{{ tag }}</span>
      </div>
      
      <details style="margin-top: 10px; color: #666;">
        <summary>查看原始 JSON</summary>
        <pre>{{ JSON.stringify(aiResult, null, 2) }}</pre>
      </details>
    </div>
  </div>
</template>

<style scoped>
.container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: sans-serif; }
.result-box { margin-top: 20px; padding: 20px; background: #f0f8ff; border-radius: 8px; border: 1px solid #b0d4ff; }
.error { color: red; margin-top: 10px; }
.tag { display: inline-block; background: #e0e0e0; padding: 2px 8px; border-radius: 4px; margin-right: 5px; font-size: 0.9em; }
</style>