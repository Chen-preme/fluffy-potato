const { exec } = require('child_process');
const os = require('os');

if (os.platform() === 'win32') {
  // Windows 配置路径（需要加双引号处理空格）
  const mongodPath = `"D:\\Program Files\\MongoDB\\Server\\4.0\\bin\\mongod.exe"`;
  const dbPath = `"D:\\WebstormProjects\\db"`;
  const port = 27018;

  // 构造命令
  const command = `${mongodPath} --dbpath ${dbPath} --port ${port}`;
  console.log(' 正在启动 MongoDB（Windows）...');

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(' 启动失败:', stderr);
    } else {
      console.log(' MongoDB 启动成功');
      console.log(stdout);
    }
  });

} else {
  // Linux / Ubuntu 启动
  console.log(' 正在启动 MongoDB（Linux）...');
  exec('sudo systemctl start mongod', (err, stdout, stderr) => {
    if (err) {
      console.error(' 启动失败:', stderr);
    } else {
      console.log(' MongoDB 启动成功');
    }
  });
}

