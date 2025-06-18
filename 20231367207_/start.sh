#!/bin/bash

echo "正在启动项目..."
echo

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查MongoDB状态
echo "检查MongoDB状态..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "启动MongoDB..."
    node start-mongo.js &
    sleep 3
fi

# 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "安装项目依赖..."
    npm install
fi

# 启动项目
echo "启动Web服务器..."
node index.js