<template>
  <div class="chat text-center">
    <div
      class="mx-auto mt-10 inline-block rounded-lg border-2 py-5 px-1 shadow-xl"
      style="width: 1100px; height: 750px"
    >
      <h2 class="text-2xl font-bold">
        连接状态:
        <span class="text-2xl">{{ wsStatusArr[wsStatus.connectStatus] }}</span>
        <span
          v-if="
            wsStatus.connectStatus == 'close' ||
            wsStatus.connectStatus == 'error' ||
            wsStatus.connectStatus == 'none'
          "
          class="mx-4 cursor-pointer text-blue-500 underline"
          @click="InitClient"
          >重连</span
        >
      </h2>
      <div class="flex h-full pb-3">
        <div class="relative w-36 text-left">
          <template v-for="user in users">
            <div
              class="cursor-pointer truncate bg-zinc-50 px-5 leading-10 hover:bg-zinc-100"
              :class="user.userId == userInfo.userId ? 'text-blue-500' : ''"
            >
              <span>{{ user.name }}</span>
            </div>
          </template>
          <div
            v-if="users.length <= 0"
            class="absolute top-0 left-0 flex h-full w-full items-center justify-center text-xl text-zinc-400"
            style="writing-mode: vertical-lr"
          >
            <span>聊天室暂空闲</span>
          </div>
        </div>
        <div class="flex flex-1 flex-col">
          <div
            style="height: 600px"
            ref="chatBox"
            class="myscroll box-border flex flex-col overflow-y-scroll rounded-lg border border-zinc-200 px-4 pb-10"
          >
            <div>
              <template v-for="data in soData" key="data.userInfo.id">
                <div
                  class="flex flex-col py-3"
                  :class="
                    data.userInfo.userId == userInfo.userId
                      ? 'text-right'
                      : 'text-left'
                  "
                >
                  <div
                    class="truncate text-lg font-bold"
                    :class="
                      data.userInfo.userId == userInfo.userId
                        ? 'text-blue-500'
                        : 'text-black'
                    "
                    style="maxwidth: 150px"
                  >
                    <span>{{ data.userInfo.name }}</span>
                  </div>
                  <div
                    class="flex-1 whitespace-pre-line text-xl"
                    :class="
                      data.userInfo.userId == userInfo.userId
                        ? 'pr-6 pl-20'
                        : 'pl-6 pr-20'
                    "
                  >
                    <div
                      class="inline-block break-all rounded-lg px-5 py-3 text-left"
                      :class="
                        data.userInfo.userId == userInfo.userId
                          ? 'bg-blue-300 text-white'
                          : 'bg-red-500 text-white'
                      "
                    >
                      {{ data.message.message }}
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
          <div class="flex flex-1 items-center justify-center">
            <textarea
              class="input_textarea mx-6 h-16 w-72 resize-none rounded"
              v-model="inputMsg"
              type="text"
              @keyup.enter="sendMessage"
            />
            <button
              type="primary"
              class="mx-6 cursor-pointer rounded-lg bg-blue-500 px-6 leading-10 text-white"
              @click="sendMessage"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
    <el-dialog
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      v-model="dialogVisible"
      title="请输入用户名"
    >
      <div>
        <span class="mx-2 text-lg">你的姓名：</span>
        <input
          v-model="youName"
          type="text"
          class="h-10 rounded-lg text-black transition-all duration-100"
          @keyup.enter="changeDialogVisible"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" size="large" @click="changeDialogVisible"
            >确定</el-button
          >
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, watch, nextTick } from "vue";
import { nanoid } from "nanoid";
import { ElMessage } from "element-plus";
import "element-plus/theme-chalk/el-message.css";

const host =
  process.env.NODE_ENV == "development"
    ? "ws://localhost:3000"
    : "ws://ip:3000";

const userInfo = reactive({
  id: 0,
  userId: 0,
  name: "",
});
const soData = ref([]);
const users = ref([]);
const wsStatusArr = {
  none: "未连接",
  pending: "连接中 . . .",
  run: "正常连接",
  close: "链接中断",
  error: "连接错误",
};
const wsStatus = reactive({
  connectStatus: "none",
});
let ws = null;
watch(
  () => wsStatus,
  () => {
    switch (wsStatus.connectStatus) {
      case "pending":
        return ElMessage.info("连接中");
      case "run":
        return ElMessage.success("连接成功");
      case "close":
        return ElMessage.warning("连接中断");
      case "error":
        return ElMessage.error("连接出错");
      default:
        return ElMessage.warning("系统错误");
    }
  },
  { deep: true }
);
const inputMsg = ref("");
const chatBox = ref(null);

function InitClient() {
  ws && ws?.close();
  wsStatus.connectStatus = "pending";
  soData.value = [];

  ws = new WebSocket(host);
  ws.addEventListener("open", (evt) => {
    wsStatus.connectStatus = "run";
    const WillSendMessage = JSON.stringify({
      type: "connection",
      data: {
        userInfo: userInfo,
      },
    });
    ws.send(WillSendMessage);
  });
  ws.addEventListener("message", (evt) => {
    const data = JSON.parse(evt.data);
    if (data.type == "message") {
      users.value = [...data.users];
      soData.value.push(data.data);
      nextTick(() => {
        if (data.data.userInfo.userId == userInfo.userId) backBottom();
      });
    } else if (data.type == "connection") {
      console.log(data.users);
      users.value = [...data.users];
    }
  });
  ws.addEventListener("close", (evt) => {
    wsStatus.connectStatus = "close";
  });
  ws.addEventListener("error", (error) => {
    wsStatus.connectStatus = "error";
    ElMessage.error("error:" + error);
  });
}

const sendMessage = () => {
  if (inputMsg.value.length <= 0) return;
  const inputMessage = inputMsg.value;
  const WillSendMessage = JSON.stringify({
    type: "message",
    data: {
      userInfo: userInfo,
      message: {
        sendTime: Date.now(),
        message: inputMessage,
      },
    },
  });
  ws.send(WillSendMessage);
  ElMessage.success("发送成功");
  inputMsg.value = "";
};

// 当是自己评论时，回到评论底部
function backBottom() {
  const scrollHeight = chatBox.value.scrollHeight;
  chatBox.value.scrollTo({
    top: scrollHeight,
  });
}

const youName = ref("");
const dialogVisible = ref(true);
const changeDialogVisible = () => {
  if (youName.value.length > 0) {
    dialogVisible.value = false;
    userInfo.id = nanoid();
    userInfo.userId = "x" + nanoid();
    userInfo.name = youName.value;
    InitClient();
  } else {
    ElMessage.error("必须有一个名字才能交流");
  }
};
</script>

<style scoped>
.chat /deep/ ::selection {
  @apply bg-green-500 text-white;
}
.myscroll::-webkit-scrollbar {
  width: 10px;
  @apply bg-zinc-50;
}
.myscroll::-webkit-scrollbar-thumb {
  @apply rounded-lg bg-gray-300;
}
.myscroll::-webkit-scrollbar-button {
  display: none;
}
.input_textarea {
  @apply overflow-y-scroll;
}
.input_textarea::-webkit-scrollbar {
  width: 1px;
  @apply bg-zinc-50;
}
.input_textarea::-webkit-scrollbar-thumb {
  @apply rounded-lg bg-zinc-400;
}
</style>
