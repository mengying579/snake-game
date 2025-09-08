document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('start-btn');
    const pauseButton = document.getElementById('pause-btn');
    const difficultySelect = document.getElementById('difficulty');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');

    // 游戏变量
    let snake = [];
    let food = {};
    let direction = '';
    let nextDirection = '';
    let gameInterval;
    let gameSpeed = 150; // 默认速度（中等难度）
    let gameRunning = false;
    let gamePaused = false;
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    
    // 网格大小和单元格大小
    const gridSize = 20;
    const cellSize = canvas.width / gridSize;

    // 更新高分显示
    highScoreElement.textContent = highScore;

    // 设置游戏难度
    difficultySelect.addEventListener('change', () => {
        const difficulty = difficultySelect.value;
        switch(difficulty) {
            case 'easy':
                gameSpeed = 200;
                break;
            case 'medium':
                gameSpeed = 150;
                break;
            case 'hard':
                gameSpeed = 100;
                break;
        }
        
        if (gameRunning && !gamePaused) {
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
    });

    // 初始化游戏
    function initGame() {
        // 初始化蛇（从中心开始，长度为3）
        snake = [
            {x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2)},
            {x: Math.floor(gridSize / 2) - 1, y: Math.floor(gridSize / 2)},
            {x: Math.floor(gridSize / 2) - 2, y: Math.floor(gridSize / 2)}
        ];
        
        // 初始方向向右
        direction = 'right';
        nextDirection = 'right';
        
        // 生成第一个食物
        generateFood();
        
        // 重置分数
        score = 0;
        scoreElement.textContent = score;
        
        // 绘制初始状态
        draw();
    }

    // 生成食物
    function generateFood() {
        // 随机位置
        let newFood;
        let foodOnSnake;
        
        do {
            foodOnSnake = false;
            newFood = {
                x: Math.floor(Math.random() * gridSize),
                y: Math.floor(Math.random() * gridSize)
            };
            
            // 检查食物是否在蛇身上
            for (let segment of snake) {
                if (segment.x === newFood.x && segment.y === newFood.y) {
                    foodOnSnake = true;
                    break;
                }
            }
        } while (foodOnSnake);
        
        food = newFood;
    }

    // 绘制游戏
    function draw() {
        // 清空画布
        ctx.fillStyle = '#e8f5e9';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制网格线（可选）
        ctx.strokeStyle = '#c8e6c9';
        ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= gridSize; i++) {
            // 垂直线
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, canvas.height);
            ctx.stroke();
            
            // 水平线
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(canvas.width, i * cellSize);
            ctx.stroke();
        }
        
        // 绘制食物
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.arc(
            food.x * cellSize + cellSize / 2,
            food.y * cellSize + cellSize / 2,
            cellSize / 2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // 绘制蛇
        snake.forEach((segment, index) => {
            // 蛇头和身体使用不同颜色
            if (index === 0) {
                ctx.fillStyle = '#388E3C'; // 蛇头颜色
            } else {
                ctx.fillStyle = '#4CAF50'; // 蛇身颜色
            }
            
            // 绘制圆角矩形作为蛇的身体
            roundRect(
                ctx,
                segment.x * cellSize + 1,
                segment.y * cellSize + 1,
                cellSize - 2,
                cellSize - 2,
                5
            );
            
            // 为蛇头添加眼睛
            if (index === 0) {
                ctx.fillStyle = 'white';
                
                // 根据方向确定眼睛位置
                let eyeX1, eyeY1, eyeX2, eyeY2;
                const eyeSize = cellSize / 6;
                const eyeOffset = cellSize / 4;
                
                switch(direction) {
                    case 'up':
                        eyeX1 = segment.x * cellSize + eyeOffset;
                        eyeY1 = segment.y * cellSize + eyeOffset;
                        eyeX2 = segment.x * cellSize + cellSize - eyeOffset - eyeSize;
                        eyeY2 = segment.y * cellSize + eyeOffset;
                        break;
                    case 'down':
                        eyeX1 = segment.x * cellSize + eyeOffset;
                        eyeY1 = segment.y * cellSize + cellSize - eyeOffset - eyeSize;
                        eyeX2 = segment.x * cellSize + cellSize - eyeOffset - eyeSize;
                        eyeY2 = segment.y * cellSize + cellSize - eyeOffset - eyeSize;
                        break;
                    case 'left':
                        eyeX1 = segment.x * cellSize + eyeOffset;
                        eyeY1 = segment.y * cellSize + eyeOffset;
                        eyeX2 = segment.x * cellSize + eyeOffset;
                        eyeY2 = segment.y * cellSize + cellSize - eyeOffset - eyeSize;
                        break;
                    case 'right':
                        eyeX1 = segment.x * cellSize + cellSize - eyeOffset - eyeSize;
                        eyeY1 = segment.y * cellSize + eyeOffset;
                        eyeX2 = segment.x * cellSize + cellSize - eyeOffset - eyeSize;
                        eyeY2 = segment.y * cellSize + cellSize - eyeOffset - eyeSize;
                        break;
                }
                
                // 绘制眼睛
                ctx.fillRect(eyeX1, eyeY1, eyeSize, eyeSize);
                ctx.fillRect(eyeX2, eyeY2, eyeSize, eyeSize);
            }
        });
    }

    // 辅助函数：绘制圆角矩形
    function roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }

    // 游戏主循环
    function gameLoop() {
        // 更新方向
        direction = nextDirection;
        
        // 移动蛇
        const head = {x: snake[0].x, y: snake[0].y};
        
        switch(direction) {
            case 'up':
                head.y--;
                break;
            case 'down':
                head.y++;
                break;
            case 'left':
                head.x--;
                break;
            case 'right':
                head.x++;
                break;
        }
        
        // 检查碰撞
        if (checkCollision(head)) {
            gameOver();
            return;
        }
        
        // 将新头部添加到蛇身体前面
        snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === food.x && head.y === food.y) {
            // 增加分数
            score += 10;
            scoreElement.textContent = score;
            
            // 更新最高分
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }
            
            // 生成新食物
            generateFood();
        } else {
            // 如果没吃到食物，移除尾部（保持长度不变）
            snake.pop();
        }
        
        // 重新绘制
        draw();
    }

    // 检查碰撞
    function checkCollision(head) {
        // 检查墙壁碰撞
        if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
            return true;
        }
        
        // 检查自身碰撞（从第二个身体部分开始检查，因为头部刚移动时可能与第一个身体部分重叠）
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        
        return false;
    }

    // 游戏结束
    function gameOver() {
        clearInterval(gameInterval);
        gameRunning = false;
        gamePaused = false;
        
        // 更新按钮状态
        startButton.textContent = '重新开始';
        startButton.disabled = false;
        pauseButton.disabled = true;
        
        // 显示游戏结束消息
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '30px Microsoft YaHei';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 30);
        
        ctx.font = '20px Microsoft YaHei';
        ctx.fillText(`最终得分: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText('按"开始"重新游戏', canvas.width / 2, canvas.height / 2 + 40);
    }

    // 开始游戏按钮
    startButton.addEventListener('click', () => {
        if (!gameRunning) {
            initGame();
            gameRunning = true;
            gamePaused = false;
            gameInterval = setInterval(gameLoop, gameSpeed);
            
            // 更新按钮状态
            startButton.textContent = '重新开始';
            pauseButton.textContent = '暂停';
            pauseButton.disabled = false;
        } else {
            // 如果游戏已经在运行，则重新开始
            clearInterval(gameInterval);
            initGame();
            gameRunning = true;
            gamePaused = false;
            gameInterval = setInterval(gameLoop, gameSpeed);
            
            // 更新按钮状态
            pauseButton.textContent = '暂停';
        }
    });

    // 暂停游戏按钮
    pauseButton.addEventListener('click', () => {
        if (!gameRunning) return;
        
        if (gamePaused) {
            // 恢复游戏
            gameInterval = setInterval(gameLoop, gameSpeed);
            gamePaused = false;
            pauseButton.textContent = '暂停';
        } else {
            // 暂停游戏
            clearInterval(gameInterval);
            gamePaused = true;
            pauseButton.textContent = '继续';
            
            // 显示暂停消息
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = '30px Microsoft YaHei';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText('游戏暂停', canvas.width / 2, canvas.height / 2);
        }
    });

    // 键盘控制
    document.addEventListener('keydown', (e) => {
        // 只有在游戏运行且未暂停时才响应键盘
        if (!gameRunning || gamePaused) return;
        
        switch(e.key) {
            case 'ArrowUp':
                if (direction !== 'down') nextDirection = 'up';
                break;
            case 'ArrowDown':
                if (direction !== 'up') nextDirection = 'down';
                break;
            case 'ArrowLeft':
                if (direction !== 'right') nextDirection = 'left';
                break;
            case 'ArrowRight':
                if (direction !== 'left') nextDirection = 'right';
                break;
        }
    });

    // 初始化游戏（但不自动开始）
    initGame();
    pauseButton.disabled = true;
});