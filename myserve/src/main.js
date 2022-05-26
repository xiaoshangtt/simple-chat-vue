const { WebSocketServer } = require("ws");

const server = new WebSocketServer({ port: 3000 });

const userArr = [];
const clientArr = [];
const messageArr = [];

server.on("connection", (client, req) => {
  console.log("有人连接了");
  client.on("message", (jsondata) => {
    const data = JSON.parse(jsondata);
    const userInfo = data.data.userInfo;
    if (!client?.userInfo) {
      client.userInfo = { ...userInfo };
      client.userInfo.messageArr = [];
      clientArr.push(client);
    }
    if (data.type == "connection") {
      userArr.push(userInfo);
      clientArr.forEach((everyClient) => {
        everyClient.send(
          JSON.stringify({
            type: "connection",
            users: getUsers(clientArr),
          })
        );
      });
      return;
    } else if (data.type == "message") {
      const message = data.data.message;
      const messageObj = {
        userInfo: {
          userId: client.userInfo.userId,
          name: client.userInfo.name,
        },
        message: message,
      };
      // 只发送当前数据
      // 一个人的发言
      // client.userInfo.messaegArr.push(message);
      client.userInfo.messageArr.push(message);
      // 全部人发言集合
      messageArr.push(messageObj);
      clientArr.forEach((client) => {
        client.send(
          JSON.stringify({
            type: "message",
            data: messageObj,
            users: getUsers(clientArr),
          })
        );
      });
    }
  });

  client.on("close", (evt) => {
    console.log("有人关闭了连接");
    const index = clientArr.findIndex((item) => item == client);
    clientArr.splice(index, 1);
    clientArr.forEach((everyClient) => {
      everyClient.send(
        JSON.stringify({
          type: "connection",
          users: getUsers(clientArr),
        })
      );
    });
  });

  client.on("error", (err) => {
    console.log("程序出错了");
    exitPro();
  });
});

function exitPro() {
  let n = 3;
  let timer = setInterval(() => {
    console.log(`程序将在${n}秒后退出`);
    n--;
    if (n <= 0) {
      clearInterval(timer);
      return process.exit(0);
    }
  }, 1000);
}

function getUsers(clientArr) {
  return clientArr.map((client) => ({
    userId: client.userInfo.userId,
    name: client.userInfo.name,
  }));
}
