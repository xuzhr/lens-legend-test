<script setup>
defineProps({
  size: {
    type: String,
    default: 'w-32'
  }
});

// 🟢 关键改动：把路径放在变量里
// Vite 的静态分析器通常不会去解析变量里的字符串
const logoPath = '/logo.jpg'; 
</script>

<template>
  <div :class="['relative overflow-hidden shadow-2xl border border-gray-800 bg-[#1A1A1D]']">
    <img 
      :src="logoPath" 
      alt="Lens & Legend Logo" 
      class="w-full h-full object-cover"
      style="width: 100%; height: 100%; object-fit: cover;" 
    />
    <div class="absolute inset-0 bg-gradient-to-tr from-yellow-900/20 to-transparent pointer-events-none"></div>
  </div>
</template>

<style scoped>
img {
  box-shadow: 0 0 20px rgba(197, 160, 89, 0.1);
}
</style>