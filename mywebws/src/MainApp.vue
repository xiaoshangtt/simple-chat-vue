<template>
  <el-config-provider :locale="zhCn">
    <Chat />
  </el-config-provider>
</template>

<script setup>
import { ElConfigProvider } from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import Chat from "./components/Chat.vue";
</script>
