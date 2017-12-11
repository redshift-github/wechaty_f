
const { Wechaty, config, log, Room, Contact, MediaMessage } = require('wechaty');
const fs = require('fs');

module.exports = async(io) => {

  io.sockets.on('connection',(socket) => {
    console.log('开**********************************始');
    //初始化
    const bot = Wechaty.instance({ profile: config.default.DEFAULT_PROFILE });
    //url
    bot.on('scan', (url, code) => {
      socket.emit('url', url);
      console.log(url);
    })
    //登陆
    bot.on('login',       user => {
      socket.emit('login', user);
    })
    //消息
    bot.on('message', async (message) => {
      socket.emit('message', message);
      await dealOnMessage(message);
    })
    //start|init
    bot.start()

  });
}
async function dealOnMessage(message){
  const room = message.room();
  const sender  = message.from();
  const content = message.content();

  if(message.self()){
    //return;
    console.log(await getHelperContact());
  }else{
    if (message instanceof MediaMessage) {
      //saveMediaFile(message);
      //message.say(new MediaMessage(__dirname + '/9090104421211408847.jpg'));
      //message.say(message.obj.url);
      message.say('媒体功能暂未完善！');
    }
    try {
      //自动回复
      if(/^ping$/i.test(content)){//i 不区分大小写
        message.say('dong');
      }
      if(/^join$/i.test(content)){
        let join_room = await Room.find({ topic: /^wechaty/i });
        if(join_room){
          if(join_room.has(sender)){
            sender.say('你已经在' + room.topic() + '房间中了，无需再次加入');//单独发给申请者
          }else {
            sender.say('你还不在房间中，马上邀请您加入！');
            putInRoom(sender, join_room);
          }
        }else{
          await createRoom(sender);
          sender.say('你还不在房间中，马上邀请您加入！');
        }
      }
      if(/^leave$/i.test(content)){
        if(room){
          await getOutRoom(sender,room);
          sender.say('你已经离开群聊房间：' + room.topic() );
        }
      }
    }catch(e){
       log.error('Bot', 'on(message) exception: %s' , e);
    }
  }
}
//邀请加入房间
async function putInRoom(contact, room) {
  try {
    await room.add(contact);
    setTimeout(() => {
      room.say('欢迎加入群聊：' + room.topic(), contact);
    },1000);
  } catch (e) {
    log.error('Bot', 'putInRoom() exception: ' + e.stack);
  }
}
//离开房间
async function getOutRoom(contact, room) {
  try {
    await room.say('你将退出群聊：' + room.topic());//房间内发送
    await room.del(contact);
  } catch (e) {
    log.error('Bot', 'getOutRoom() exception: ' + e.stack);
  }
}
//自动建群(大于等于三个人才能建群)
function getHelperContact() {
  return Contact.find({ name: '吃饭.睡觉.打豆豆' }); //换成自己的帮助建群联系人
}
async function createRoom(contact) {
  try {
    const helperContact = await getHelperContact();
    if (!helperContact) {
      log.warn('Bot', 'getHelperContact() found nobody');
      return;
    }
    const contactList = [contact, helperContact];
    const room = await Room.create(contactList, 'wechaty');
    await room.topic('wechaty');
    await room.say('群聊：wechay 创建成功！');

    return room;
  } catch (e) {
    log.error('Bot', 'getHelperContact() exception:', e.stack);
    throw e;
  }
}

async function saveMediaFile(message) {
  const filename = message.filename();
  console.log('IMAGE local filename: ' + filename);

  const fileStream = fs.createWriteStream(filename);
  try {
    const netStream = await message.readyStream();
    netStream
      .pipe(fileStream)
      .on('close', _ => {
        const stat = fs.statSync(filename);
        console.log('finish readyStream() for ', filename, ' size: ', stat.size);
      })
  } catch (e) {
    console.error('stream error:', e)
  }
}
async function readFile(path){
  var rs = fs.createReadStream(__dirname + path, {start: 0, end: 2});
  rs.on('open', function (fd) {
    console.log('开始读取文件');
  });
  rs.on('data', function (data) {
    console.log(data.toString());
  });

  rs.on('end', function () {
    console.log('读取文件结束')
  });
  rs.on('close', function () {
    console.log('文件关闭');
  });

}
