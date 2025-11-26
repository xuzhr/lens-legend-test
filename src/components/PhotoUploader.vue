<script setup>
import { ref } from 'vue';
import ExifReader from 'exifreader';
import imageCompression from 'browser-image-compression';

// 定义组件抛出的事件，把处理好的数据扔给父组件
const emit = defineEmits(['photo-processed']);

const isProcessing = ref(false);
const previewUrl = ref(null);
const statusMsg = ref('请选择一张照片...');

// 🛠️ 核心处理逻辑
const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  isProcessing.value = true;
  statusMsg.value = `正在读取原图 (${(file.size / 1024 / 1024).toFixed(2)} MB)...`;

  try {
    // 1️⃣ 第一刀：先提取 EXIF (趁热乎)
    // 为什么要先提取？因为压缩过程就像把牛肉做成牛肉丸，原来的纹理（元数据）可能会丢。
    const tags = await ExifReader.load(file);
    
    // 提取 GPS 和 时间 (这里做了简单的防空判断)
    const gpsLat = tags['GPSLatitude']?.description; // 比如 39.9
    const gpsLng = tags['GPSLongitude']?.description; // 比如 116.4
    const takenDate = tags['DateTimeOriginal']?.description; // 比如 2023:10:01 12:00:00
    
    // 2️⃣ 第二刀：疯狂压缩
    statusMsg.value = '正在为照片瘦身...';
    
    const options = {
      maxSizeMB: 0.5,          // 目标：压到 0.5MB 以下
      maxWidthOrHeight: 1280,  // 限制长宽：最大 1280px (给 AI 看足够了)
      useWebWorker: true,      // 开启多线程，不卡顿主界面
      fileType: 'image/webp'   // 转成 WebP 格式，体积更小
    };

    const compressedFile = await imageCompression(file, options);
    
    // 3️⃣ 生成预览 & 汇报战果
    statusMsg.value = `处理完毕！体积从 ${(file.size / 1024 / 1024).toFixed(2)} MB ➔ ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`;
    previewUrl.value = URL.createObjectURL(compressedFile);

    // 4️⃣ 将战利品打包，通过 emit 发送给父组件去调用 AI
    emit('photo-processed', {
      originalFile: file,       // 原文件 (一般不存，除非你是土豪)
      compressedFile: compressedFile, // 压缩后的文件 (传给 R2 和 AI)
      metadata: {               // 提取出的元数据 (存给 D1)
        lat: gpsLat || null,
        lng: gpsLng || null,
        date: takenDate || new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('处理失败:', error);
    statusMsg.value = '哎呀，处理出错了：' + error.message;
  } finally {
    isProcessing.value = false;
  }
};
</script>

<template>
  <div class="uploader-card">
    <label class="custom-file-upload">
      <input type="file" @change="handleFileChange" accept="image/*" :disabled="isProcessing"/>
      📸 {{ isProcessing ? '正在暗房处理中...' : '上传照片 (启动时光机)' }}
    </label>

    <p class="status-text">{{ statusMsg }}</p>

    <div v-if="previewUrl" class="preview-box">
      <img :src="previewUrl" alt="Preview" />
    </div>
  </div>
</template>

<style scoped>
.uploader-card {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  background-color: #f8fafc;
  transition: all 0.3s ease;
}

.uploader-card:hover {
  border-color: #64748b;
  background-color: #f1f5f9;
}

.custom-file-upload {
  display: inline-block;
  padding: 12px 24px;
  cursor: pointer;
  background-color: #3b82f6;
  color: white;
  border-radius: 8px;
  font-weight: bold;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s;
}

.custom-file-upload:hover {
  background-color: #2563eb;
}

input[type="file"] {
  display: none;
}

.status-text {
  margin-top: 15px;
  color: #64748b;
  font-size: 0.9em;
  font-family: monospace; /* 既然是老码驹儿，用等宽字体看着亲切 */
}

.preview-box {
  margin-top: 20px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.preview-box img {
  max-width: 100%;
  display: block;
}
</style>