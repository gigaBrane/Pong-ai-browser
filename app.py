from flask import Flask, render_template, jsonify, request 

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

# API route for AI processing, if neededç
@app.route("/ai-move", methods=['POST'])
def ai_move():
    data = request.json
    ball_y = data['ballY']
    right_paddle_y = data['rightPaddleY']
    paddle_height = 100  # Ensure this matches the paddle height in your script.js
    canvas_height = 500  # Ensure this matches the canvas height in your script.js

    # AI logic: move the paddle up or down to follow the ball
    if ball_y < right_paddle_y and right_paddle_y > 0:
        ai_decision = {"up": True}  # Move up if the ball is above and within bounds
    elif ball_y > right_paddle_y + paddle_height and right_paddle_y < canvas_height - paddle_height:
        ai_decision = {"up": False}  # Move down if the ball is below and within bounds
    else:
        ai_decision = {"up": None}  # Do not move if the paddle is aligned with the ball
    return jsonify(ai_decision)

if __name__ == "__main__":
    app.run(debug=True)
