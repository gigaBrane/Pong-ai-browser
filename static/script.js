console.log('Script loaded');

const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameButtons = document.querySelectorAll('.gameButton');

let gameStarted = false;
let winningScore = 5;  // Default to 5 points

gameButtons.forEach(button => {
    button.addEventListener('click', function() {
        winningScore = parseInt(this.getAttribute('data-points'));
        startScreen.style.display = 'none';
        canvas.style.display = 'block';
        gameStarted = true;
        gameLoop();
    });
});

function checkWin() {
    if (leftScore >= winningScore || rightScore >= winningScore) {
        gameStarted = false;

        // Display winner on the start screen
        startScreen.innerHTML = `
            <h1>${leftScore >= winningScore ? "You Win!" : "AI Wins!"}</h1>
            <button id="playAgainButton" class="gameButton">Play Again</button>
        `;
        startScreen.style.display = 'block';
        canvas.style.display = 'none';

        // Add event listener to the "Play Again" button
        document.getElementById('playAgainButton').addEventListener('click', function() {
            location.reload();  // Reload the page to reset the game
        });
    }
}

let leftScore = 0;
let rightScore = 0;

// Ball properties
let ball = {
    x: canvas.width / 2, 
    y: canvas.height / 2, 
    dx: 4, // Adjusted for gameplay speed
    dy: 4, 
    radius: 10,
    reset: function() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.dx = -this.dx;  // Reverse ball direction on reset
        this.dy = (Math.random() > 0.5 ? 1 : -1) * 4;  // Randomize direction
    }
};

// Paddle properties
let leftPaddleY = canvas.height / 2 - 50;
let rightPaddleY = canvas.height / 2 - 50;
const paddleHeight = 100;
const paddleWidth = 10;
const paddleSpeed = 10; // Adjusted for gameplay speed

let leftPaddleMovingUp = false;
let leftPaddleMovingDown = false;
let rightPaddleMovingUp = false;
let rightPaddleMovingDown = false;

// Paddle controls
document.addEventListener('keydown', function(event) {
    if (event.key === 'w') leftPaddleMovingUp = true;
    if (event.key === 's') leftPaddleMovingDown = true;
    if (event.key === 'ArrowUp') rightPaddleMovingUp = true;
    if (event.key === 'ArrowDown') rightPaddleMovingDown = true;
});

document.addEventListener('keyup', function(event) {
    if (event.key === 'w') leftPaddleMovingUp = false;
    if (event.key === 's') leftPaddleMovingDown = false;
    if (event.key === 'ArrowUp') rightPaddleMovingUp = false;
    if (event.key === 'ArrowDown') rightPaddleMovingDown = false;
});

function movePaddles() {
    if (leftPaddleMovingUp && leftPaddleY > 0) leftPaddleY -= paddleSpeed;
    if (leftPaddleMovingDown && leftPaddleY < canvas.height - paddleHeight) leftPaddleY += paddleSpeed;
    if (rightPaddleMovingUp && rightPaddleY > 0) rightPaddleY -= paddleSpeed;
    if (rightPaddleMovingDown && rightPaddleY < canvas.height - paddleHeight) rightPaddleY += paddleSpeed;
}

// Draw the ball
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

// Draw the paddles
function drawPaddles() {
    // Left Paddle
    ctx.fillStyle = "#0095DD";
    ctx.fillRect(0, leftPaddleY, paddleWidth, paddleHeight);

    // Right Paddle
    ctx.fillStyle = "#0095DD";
    ctx.fillRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight);
}

// Detect collision between ball and paddles
function detectCollision() {
    // Collision with left paddle
    if (ball.x - ball.radius < paddleWidth && ball.y > leftPaddleY && ball.y < leftPaddleY + paddleHeight) {
        ball.dx = -ball.dx;
    }

    // Collision with right paddle
    if (ball.x + ball.radius > canvas.width - paddleWidth && ball.y > rightPaddleY && ball.y < rightPaddleY + paddleHeight) {
        ball.dx = -ball.dx;
    }

    // Wall collision
    if (ball.y + ball.dy > canvas.height || ball.y + ball.dy < 0) {
        ball.dy = -ball.dy;
    }
}

// Update game state and communicate with backend
function updateGame() {
    // Update ball position
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Handle collisions
    detectCollision();

    // Update scores if the ball goes out of bounds
    if (ball.x + ball.radius < 0) {  // Ball out on left side
        rightScore += 1;  // Right player scores
        ball.reset();
        checkWin();
    } else if (ball.x - ball.radius > canvas.width) {  // Ball out on right side
        leftScore += 1;  // Left player scores
        ball.reset();
        checkWin();
    }

    // Send game state to backend to get AI move
    fetch('/ai-move', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ballY: ball.y,
            rightPaddleY: rightPaddleY,
            leftPaddleY: leftPaddleY
        })
    })
    .then(response => response.json())
    .then(data => {
        // Adjust right paddle position based on AI decision
        if (data.up && rightPaddleY > 0) {
            rightPaddleY -= paddleSpeed;
        } else if (!data.up && rightPaddleY < canvas.height - paddleHeight) {
            rightPaddleY += paddleSpeed;
        }
    });
}

// Draw the scores
function drawScores() {
    ctx.font = "28px Helvetica";
    ctx.fillStyle = "#FFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(leftScore, canvas.width / 4, 50);
    ctx.fillText(rightScore, canvas.width * 3 / 4, 50);
}

// Main game loop
function gameLoop() {
    if (gameStarted) {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
        movePaddles();
        drawBall(); // Draw ball
        drawPaddles(); // Draw paddles
        drawScores(); // Draw scores
        updateGame(); // Update game state
        requestAnimationFrame(gameLoop); // Loop
    }
}

gameLoop(); // Start game
