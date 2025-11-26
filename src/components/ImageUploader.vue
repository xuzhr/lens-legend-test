<script setup>
import { ref } from 'vue';
import ExifReader from 'exifreader';

const photoData = ref(null);

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // 1. 读取 EXIF
  const tags = await ExifReader.load(file);
  
  // 2. 提取我们感兴趣的数据 (处理经纬度有点复杂，这里简化演示)
  const takenDate = tags['DateTimeOriginal']?.description;
  const lat = tags['GPSLatitude']?.description; 
  
  photoData.value = {
    name: file.name,
    date: takenDate,
    gps: lat ? '有地理位置信息' : '无地理位置信息' // 实际需要更复杂的解析逻辑
  };
  
  // 3. 这里后续会加上：压缩图片 -> 上传到 Cloudflare R2 -> 存入 D1
};
</script>

<template>
  <div class="upload-card">
    <input type="file" @change="handleFileUpload" accept="image/*" />
    
    <div v-if="photoData" class="info-box">
      <h3>📸 照片信息解析</h3>
      <p>文件名: {{ photoData.name }}</p>
      <p>拍摄时间: {{ photoData.date }}</p>
      <p>GPS: {{ photoData.gps }}</p>
    </div>
  </div>
</template>

<style scoped>
.upload-card { border: 2px dashed #ccc; padding: 20px; text-align: center; }
.info-box { margin-top: 20px; background: #f9f9f9; padding: 10px; text-align: left; }
</style>