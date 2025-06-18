const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function checkEnvironment() {
  console.log('=== 环境检查工具 ===');
  console.log(`操作系统: ${os.platform()} ${os.arch()}`);
  console.log(`Node.js 进程版本: ${process.version}`);
  console.log('');
  
  // 检查Node.js版本
  exec('node --version', (err, stdout) => {
    if (err) {
      console.error(' Node.js 未安装或未添加到PATH');
    } else {
      console.log(` Node.js 版本: ${stdout.trim()}`);
    }
  });
  
  // 检查npm版本
  exec('npm --version', (err, stdout) => {
    if (err) {
      console.error(' npm 未安装或未添加到PATH');
    } else {
      console.log(` npm 版本: ${stdout.trim()}`);
    }
  });
  
  // 检查MongoDB
  exec('mongod --version', (err, stdout) => {
    if (err) {
      console.warn('  MongoDB 可能未安装或未添加到PATH');
      if (os.platform() === 'win32') {
        console.log('   Windows用户请检查: D:\\Program Files\\MongoDB\\Server\\4.0\\bin\\mongod.exe');
      } else {
        console.log('   Linux用户请安装: sudo apt-get install mongodb');
      }
    } else {
      console.log(` MongoDB 已安装`);
    }
  });
  
  // 检查项目依赖
  if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
    console.log(' 项目依赖已安装');
  } else {
    console.log('  项目依赖未安装，请运行: npm install');
  }
  
  // 检查配置文件
  const configFiles = ['config.js', 'package.json', 'index.js'];
  configFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
      console.log(` ${file} 存在`);
    } else {
      console.error(` ${file} 不存在`);
    }
  });
  
  // 检查数据库目录
  if (os.platform() === 'win32') {
    const winDbPath = 'D:\\WebstormProjects\\db';
    if (fs.existsSync(winDbPath)) {
      console.log(` Windows数据库目录存在: ${winDbPath}`);
    } else {
      console.log(`  Windows数据库目录不存在: ${winDbPath}`);
      console.log('   启动时会自动创建');
    }
  } else {
    const linuxDbPath = path.join(__dirname, 'db');
    if (fs.existsSync(linuxDbPath)) {
      console.log(` Linux数据库目录存在: ${linuxDbPath}`);
    } else {
      console.log(`  Linux数据库目录不存在: ${linuxDbPath}`);
      console.log('   启动时会自动创建');
    }
  }
  
  console.log('');
  console.log('=== 启动说明 ===');
  if (os.platform() === 'win32') {
    console.log('Windows用户请运行: start.bat 或 npm start');
  } else {
    console.log('Linux用户请运行: chmod +x start.sh && ./start.sh 或 npm start');
  }
}

checkEnvironment();