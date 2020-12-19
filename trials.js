
window.addEventListener('DOMContentLoaded', (event) => {
    const gamepadAPI = {
        controller: {},
        turbo: true,
        connect: function (evt) {
            if (navigator.getGamepads()[0] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[1] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[2] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            } else if (navigator.getGamepads()[3] != null) {
                gamepadAPI.controller = navigator.getGamepads()[0]
                gamepadAPI.turbo = true;
            }
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] === null) {
                    continue;
                }
                if (!gamepads[i].connected) {
                    continue;
                }
            }
        },
        disconnect: function (evt) {
            gamepadAPI.turbo = false;
            delete gamepadAPI.controller;
        },
        update: function () {
            gamepadAPI.controller = navigator.getGamepads()[0]
            gamepadAPI.buttonsCache = [];// clear the buttons cache
            for (var k = 0; k < gamepadAPI.buttonsStatus.length; k++) {// move the buttons status from the previous frame to the cache
                gamepadAPI.buttonsCache[k] = gamepadAPI.buttonsStatus[k];
            }
            gamepadAPI.buttonsStatus = [];// clear the buttons status
            var c = gamepadAPI.controller || {}; // get the gamepad object
            var pressed = [];
            if (c.buttons) {
                for (var b = 0, t = c.buttons.length; b < t; b++) {// loop through buttons and push the pressed ones to the array
                    if (c.buttons[b].pressed) {
                        pressed.push(gamepadAPI.buttons[b]);
                    }
                }
            }
            var axes = [];
            if (c.axes) {
                for (var a = 0, x = c.axes.length; a < x; a++) {// loop through axes and push their values to the array
                    axes.push(c.axes[a].toFixed(2));
                }
            }
            gamepadAPI.axesStatus = axes;// assign received values
            gamepadAPI.buttonsStatus = pressed;
            // console.log(pressed); // return buttons for debugging purposes
            return pressed;
        },
        buttonPressed: function (button, hold) {
            var newPress = false;
            for (var i = 0, s = gamepadAPI.buttonsStatus.length; i < s; i++) {// loop through pressed buttons
                if (gamepadAPI.buttonsStatus[i] == button) {// if we found the button we're looking for...
                    newPress = true;// set the boolean variable to true
                    if (!hold) {// if we want to check the single press
                        for (var j = 0, p = gamepadAPI.buttonsCache.length; j < p; j++) {// loop through the cached states from the previous frame
                            if (gamepadAPI.buttonsCache[j] == button) { // if the button was already pressed, ignore new press
                                newPress = false;
                            }
                        }
                    }
                }
            }
            return newPress;
        },
        buttons: [
            'A', 'B', 'X', 'Y', 'LB', 'RB', 'Left-Trigger', 'Right-Trigger', 'Back', 'Start', 'Axis-Left', 'Axis-Right', 'DPad-Up', 'DPad-Down', 'DPad-Left', 'DPad-Right', "Power"
        ],
        buttonsCache: [],
        buttonsStatus: [],
        axesStatus: []
    };
    let canvas
    let canvas_context
    let keysPressed = {}
    let FLEX_engine
    let TIP_engine = {}
    let XS_engine
    let YS_engine
    class Point {
        constructor(x, y) {
            this.x = x
            this.y = y
            this.radius = 0
        }
        pointDistance(point) {
            return (new LineOP(this, point, "transparent", 0)).hypotenuse()
        }
    }
    class Line {
        constructor(x, y, x2, y2, color, width) {
            this.x1 = x
            this.y1 = y
            this.x2 = x2
            this.y2 = y2
            this.color = color
            this.width = width
        }
        hypotenuse() {
            let xdif = this.x1 - this.x2
            let ydif = this.y1 - this.y2
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            return Math.sqrt(hypotenuse)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.x1, this.y1)
            canvas_context.lineTo(this.x2, this.y2)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class LineOP {
        constructor(object, target, color, width) {
            this.object = object
            this.target = target
            this.color = color
            this.width = width
        }
        hypotenuse() {
            let xdif = this.object.x - this.target.x
            let ydif = this.object.y - this.target.y
            let hypotenuse = (xdif * xdif) + (ydif * ydif)
            return Math.sqrt(hypotenuse)
        }
        draw() {
            let linewidthstorage = canvas_context.lineWidth
            canvas_context.strokeStyle = this.color
            canvas_context.lineWidth = this.width
            canvas_context.beginPath()
            canvas_context.moveTo(this.object.x, this.object.y)
            canvas_context.lineTo(this.target.x, this.target.y)
            canvas_context.stroke()
            canvas_context.lineWidth = linewidthstorage
        }
    }
    class Triangle {
        constructor(x, y, color, length, fill = 0, strokeWidth = 0, leg1Ratio = 1, leg2Ratio = 1, heightRatio = 1) {
            this.x = x
            this.y = y
            this.color = color
            this.length = length
            this.x1 = this.x + this.length * leg1Ratio
            this.x2 = this.x - this.length * leg2Ratio
            this.tip = this.y - this.length * heightRatio
            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
            this.fill = fill
            this.stroke = strokeWidth
        }
        draw() {
            canvas_context.strokeStyle = this.color
            canvas_context.stokeWidth = this.stroke
            canvas_context.beginPath()
            canvas_context.moveTo(this.x, this.y)
            canvas_context.lineTo(this.x1, this.y)
            canvas_context.lineTo(this.x, this.tip)
            canvas_context.lineTo(this.x2, this.y)
            canvas_context.lineTo(this.x, this.y)
            if (this.fill == 1) {
                canvas_context.fill()
            }
            canvas_context.stroke()
            canvas_context.closePath()
        }
        isPointInside(point) {
            if (point.x <= this.x1) {
                if (point.y >= this.tip) {
                    if (point.y <= this.y) {
                        if (point.x >= this.x2) {
                            this.accept1 = (this.y - this.tip) / (this.x1 - this.x)
                            this.accept2 = (this.y - this.tip) / (this.x2 - this.x)
                            this.basey = point.y - this.tip
                            this.basex = point.x - this.x
                            if (this.basex == 0) {
                                return true
                            }
                            this.slope = this.basey / this.basex
                            if (this.slope >= this.accept1) {
                                return true
                            } else if (this.slope <= this.accept2) {
                                return true
                            }
                        }
                    }
                }
            }
            return false
        }
    }
    class Rectangle {
        constructor(x, y, width, height, color, fill = 1, stroke = 0, strokeWidth = 1) {
            this.x = x
            this.y = y
            this.height = height
            this.width = width
            this.color = color
            this.xmom = 0
            this.ymom = 0
            this.stroke = stroke
            this.strokeWidth = strokeWidth
            this.fill = fill
        }
        draw() {
            canvas_context.fillStyle = this.color
            canvas_context.strokeStyle = "black"
            canvas_context.lineWidth = Math.max(this.strokeWidth, .00001)
            canvas_context.strokeRect(this.x, this.y, this.width, this.height)
            canvas_context.fillRect(this.x, this.y, this.width, this.height)
        }
        move() {
            this.x += this.xmom
            this.y += this.ymom
        }
        isPointInside(point) {
            if (point.x >= this.x) {
                if (point.y >= this.y) {
                    if (point.x <= this.x + this.width) {
                        if (point.y <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            if (point.x + point.radius >= this.x) {
                if (point.y + point.radius >= this.y) {
                    if (point.x - point.radius <= this.x + this.width) {
                        if (point.y - point.radius <= this.y + this.height) {
                            return true
                        }
                    }
                }
            }
            return false
        }
    }
    class Circle {
        constructor(x, y, radius, color, xmom = 0, ymom = 0, friction = 1, reflect = 0, strokeWidth = 0, strokeColor = "transparent") {
            this.x = x
            this.y = y
            this.radius = radius
            this.color = color
            this.xmom = xmom
            this.ymom = ymom
            this.friction = friction
            this.reflect = reflect
            this.strokeWidth = strokeWidth
            this.strokeColor = strokeColor
            this.locked = 0
        }
        draw() {
            canvas_context.lineWidth = this.strokeWidth
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath();
            if (this.radius > 0) {
                canvas_context.arc(this.x, this.y, this.radius, 0, (Math.PI * 2), true)
                canvas_context.fillStyle = this.color
                canvas_context.fill()
                canvas_context.stroke();
            } else {
                // console.log("The circle is below a radius of 0, and has not been drawn. The circle is:", this)
            }
        }
        move() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                        this.radius -= 2
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                        this.radius -= 2
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                        this.radius -= 2
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                        this.radius -= 2
                    }
                }
            }
            if (this.locked == 0) {
                this.x += this.xmom
                this.y += this.ymom
            }

            if (Math.abs(this.xmom) + Math.abs(this.ymom) > 14) {
                this.xmom *= .95
                this.ymom *= .95
            }
        }
        unmove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x -= this.xmom
            this.y -= this.ymom
        }
        frictiveMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.x += this.xmom
            this.y += this.ymom
            this.xmom *= this.friction
            this.ymom *= this.friction
        }
        frictiveunMove() {
            if (this.reflect == 1) {
                if (this.x + this.radius > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y + this.radius > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.x - this.radius < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.y - this.radius < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.xmom /= this.friction
            this.ymom /= this.friction
            this.x -= this.xmom
            this.y -= this.ymom
        }
        isPointInside(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.radius * this.radius)) {
                return true
            }
            return false
        }
        doesPerimeterTouch(point) {
            this.areaY = point.y - this.y
            this.areaX = point.x - this.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= ((this.radius + point.radius) * (this.radius + point.radius))) {
                return true
            }
            return false
        }
    } class Polygon {
        constructor(x, y, size, color, sides = 3, xmom = 0, ymom = 0, angle = 0, reflect = 0) {
            if (sides < 2) {
                sides = 2
            }
            this.reflect = reflect
            this.xmom = xmom
            this.ymom = ymom
            this.body = new Circle(x, y, size - (size * .293), "transparent")
            this.nodes = []
            this.angle = angle
            this.size = size
            this.color = color
            this.angleIncrement = (Math.PI * 2) / sides
            this.sides = sides
            for (let t = 0; t < sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
        }
        isPointInside(point) { // rough approximation
            this.body.radius = this.size - (this.size * .293)
            if (this.sides <= 2) {
                return false
            }
            this.areaY = point.y - this.body.y
            this.areaX = point.x - this.body.x
            if (((this.areaX * this.areaX) + (this.areaY * this.areaY)) <= (this.body.radius * this.body.radius)) {
                return true
            }
            return false
        }
        move() {
            if (this.reflect == 1) {
                if (this.body.x > canvas.width) {
                    if (this.xmom > 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y > canvas.height) {
                    if (this.ymom > 0) {
                        this.ymom *= -1
                    }
                }
                if (this.body.x < 0) {
                    if (this.xmom < 0) {
                        this.xmom *= -1
                    }
                }
                if (this.body.y < 0) {
                    if (this.ymom < 0) {
                        this.ymom *= -1
                    }
                }
            }
            this.body.x += this.xmom
            this.body.y += this.ymom
        }
        draw() {
            this.nodes = []
            this.angleIncrement = (Math.PI * 2) / this.sides
            this.body.radius = this.size - (this.size * .293)
            for (let t = 0; t < this.sides; t++) {
                let node = new Circle(this.body.x + (this.size * (Math.cos(this.angle))), this.body.y + (this.size * (Math.sin(this.angle))), 0, "transparent")
                this.nodes.push(node)
                this.angle += this.angleIncrement
            }
            canvas_context.strokeStyle = this.color
            canvas_context.fillStyle = this.color
            canvas_context.lineWidth = 0
            canvas_context.beginPath()
            canvas_context.moveTo(this.nodes[0].x, this.nodes[0].y)
            for (let t = 1; t < this.nodes.length; t++) {
                canvas_context.lineTo(this.nodes[t].x, this.nodes[t].y)
            }
            canvas_context.lineTo(this.nodes[0].x, this.nodes[0].y)
            canvas_context.fill()
            canvas_context.stroke()
            canvas_context.closePath()
        }
    }
    class Shape {
        constructor(shapes) {
            this.shapes = shapes
        }
        isPointInside(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].isPointInside(point)) {
                    return true
                }
            }
            return false
        }
        doesPerimeterTouch(point) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (this.shapes[t].doesPerimeterTouch(point)) {
                    return true
                }
            }
            return false
        }
        isInsideOf(box) {
            for (let t = 0; t < this.shapes.length; t++) {
                if (box.isPointInside(this.shapes[t])) {
                    return true
                }
            }
            return false
        }
        push(object) {
            this.shapes.push(object)
        }
    }
    class Spring {
        constructor(x, y, radius, color, body = 0, length = 1, gravity = 0, width = 1) {
            if (body == 0) {
                this.body = new Circle(x, y, radius, color)
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            } else {
                this.body = body
                this.anchor = new Circle(x, y, radius, color)
                this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", width)
                this.length = length
            }
            this.gravity = gravity
            this.width = width
        }
        balance() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            if (this.beam.hypotenuse() < this.length) {
                this.body.xmom += (this.body.x - this.anchor.x) / this.length
                this.body.ymom += (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom -= (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom -= (this.body.y - this.anchor.y) / this.length
            } else {
                this.body.xmom -= (this.body.x - this.anchor.x) / this.length
                this.body.ymom -= (this.body.y - this.anchor.y) / this.length
                this.anchor.xmom += (this.body.x - this.anchor.x) / this.length
                this.anchor.ymom += (this.body.y - this.anchor.y) / this.length
            }
            let xmomentumaverage = (this.body.xmom + this.anchor.xmom) / 2
            let ymomentumaverage = (this.body.ymom + this.anchor.ymom) / 2
            this.body.xmom = (this.body.xmom + xmomentumaverage) / 2
            this.body.ymom = (this.body.ymom + ymomentumaverage) / 2
            this.anchor.xmom = (this.anchor.xmom + xmomentumaverage) / 2
            this.anchor.ymom = (this.anchor.ymom + ymomentumaverage) / 2
        }
        draw() {
            this.beam = new Line(this.body.x, this.body.y, this.anchor.x, this.anchor.y, "yellow", this.width)
            this.beam.draw()
            this.body.draw()
            this.anchor.draw()
        }
        move() {
            this.anchor.ymom += this.gravity
            this.anchor.move()
        }

    }
    class Color {
        constructor(baseColor, red = -1, green = -1, blue = -1, alpha = 1) {
            this.hue = baseColor
            if (red != -1 && green != -1 && blue != -1) {
                this.r = red
                this.g = green
                this.b = blue
                if (alpha != 1) {
                    if (alpha < 1) {
                        this.alpha = alpha
                    } else {
                        this.alpha = alpha / 255
                        if (this.alpha > 1) {
                            this.alpha = 1
                        }
                    }
                }
                if (this.r > 255) {
                    this.r = 255
                }
                if (this.g > 255) {
                    this.g = 255
                }
                if (this.b > 255) {
                    this.b = 255
                }
                if (this.r < 0) {
                    this.r = 0
                }
                if (this.g < 0) {
                    this.g = 0
                }
                if (this.b < 0) {
                    this.b = 0
                }
            } else {
                this.r = 0
                this.g = 0
                this.b = 0
            }
        }
        normalize() {
            if (this.r > 255) {
                this.r = 255
            }
            if (this.g > 255) {
                this.g = 255
            }
            if (this.b > 255) {
                this.b = 255
            }
            if (this.r < 0) {
                this.r = 0
            }
            if (this.g < 0) {
                this.g = 0
            }
            if (this.b < 0) {
                this.b = 0
            }
        }
        randomLight() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12) + 4)];
            }
            var color = new Color(hash, 55 + Math.random() * 200, 55 + Math.random() * 200, 55 + Math.random() * 200)
            return color;
        }
        randomDark() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 12))];
            }
            var color = new Color(hash, Math.random() * 200, Math.random() * 200, Math.random() * 200)
            return color;
        }
        random() {
            var letters = '0123456789ABCDEF';
            var hash = '#';
            for (var i = 0; i < 6; i++) {
                hash += letters[(Math.floor(Math.random() * 16))];
            }
            var color = new Color(hash, Math.random() * 255, Math.random() * 255, Math.random() * 255)
            return color;
        }
    }
    class Softbody { //buggy, spins in place
        constructor(x, y, radius, color, members = 10, memberLength = 5, force = 10, gravity = 0) {
            this.springs = []
            this.pin = new Circle(x, y, radius, color)
            this.spring = new Spring(x, y, radius, color, this.pin, memberLength, gravity)
            this.springs.push(this.spring)
            for (let k = 0; k < members; k++) {
                this.spring = new Spring(x, y, radius, color, this.spring.anchor, memberLength, gravity)
                if (k < members - 1) {
                    this.springs.push(this.spring)
                } else {
                    this.spring.anchor = this.pin
                    this.springs.push(this.spring)
                }
            }
            this.forceConstant = force
            this.centroid = new Point(0, 0)
        }
        circularize() {
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            this.angle = 0
            this.angleIncrement = (Math.PI * 2) / this.springs.length
            for (let t = 0; t < this.springs.length; t++) {
                this.springs[t].body.x = this.centroid.x + (Math.cos(this.angle) * this.forceConstant)
                this.springs[t].body.y = this.centroid.y + (Math.sin(this.angle) * this.forceConstant)
                this.angle += this.angleIncrement
            }
        }
        balance() {
            for (let s = this.springs.length - 1; s >= 0; s--) {
                this.springs[s].balance()
            }
            this.xpoint = 0
            this.ypoint = 0
            for (let s = 0; s < this.springs.length; s++) {
                this.xpoint += (this.springs[s].anchor.x / this.springs.length)
                this.ypoint += (this.springs[s].anchor.y / this.springs.length)
            }
            this.centroid.x = this.xpoint
            this.centroid.y = this.ypoint
            for (let s = 0; s < this.springs.length; s++) {
                this.link = new Line(this.centroid.x, this.centroid.y, this.springs[s].anchor.x, this.springs[s].anchor.y, 0, "transparent")
                if (this.link.hypotenuse() != 0) {
                    this.springs[s].anchor.xmom += (((this.springs[s].anchor.x - this.centroid.x) / (this.link.hypotenuse()))) * this.forceConstant
                    this.springs[s].anchor.ymom += (((this.springs[s].anchor.y - this.centroid.y) / (this.link.hypotenuse()))) * this.forceConstant
                }
            }
            for (let s = 0; s < this.springs.length; s++) {
                this.springs[s].move()
            }
            for (let s = 0; s < this.springs.length; s++) {
                this.springs[s].draw()
            }
        }
    }
    class Observer {
        constructor(x, y, radius, color, range = 100, rays = 10, angle = (Math.PI * .125)) {
            this.body = new Circle(x, y, radius, color)
            this.color = color
            this.ray = []
            this.rayrange = range
            this.globalangle = Math.PI
            this.gapangle = angle
            this.currentangle = 0
            this.obstacles = []
            this.raymake = rays
        }
        beam() {
            this.currentangle = this.gapangle / 2
            for (let k = 0; k < this.raymake; k++) {
                this.currentangle += (this.gapangle / Math.ceil(this.raymake / 2))
                let ray = new Circle(this.body.x, this.body.y, 1, "white", (((Math.cos(this.globalangle + this.currentangle)))), (((Math.sin(this.globalangle + this.currentangle)))))
                ray.collided = 0
                ray.lifespan = this.rayrange - 1
                this.ray.push(ray)
            }
            for (let f = 0; f < this.rayrange; f++) {
                for (let t = 0; t < this.ray.length; t++) {
                    if (this.ray[t].collided < 1) {
                        this.ray[t].move()
                        for (let q = 0; q < this.obstacles.length; q++) {
                            if (this.obstacles[q].isPointInside(this.ray[t])) {
                                this.ray[t].collided = 1
                            }
                        }
                    }
                }
            }
        }
        draw() {
            this.beam()
            this.body.draw()
            canvas_context.lineWidth = 1
            canvas_context.fillStyle = this.color
            canvas_context.strokeStyle = this.color
            canvas_context.beginPath()
            canvas_context.moveTo(this.body.x, this.body.y)
            for (let y = 0; y < this.ray.length; y++) {
                canvas_context.lineTo(this.ray[y].x, this.ray[y].y)
                canvas_context.lineTo(this.body.x, this.body.y)
            }
            canvas_context.stroke()
            canvas_context.fill()
            this.ray = []
        }
    }
    function setUp(canvas_pass, style = "#000000") {
        canvas = canvas_pass
        canvas_context = canvas.getContext('2d');
        canvas.style.background = style
        window.setInterval(function () {
            main()
        }, 100)
        document.addEventListener('keydown', (event) => {
            keysPressed[event.key] = true;
        });
        document.addEventListener('keyup', (event) => {
            delete keysPressed[event.key];
        });
        window.addEventListener('pointerdown', e => {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine
            if(player.reward == 0){
                if (player.drawbutton.isPointInside(TIP_engine)) {
                    player.deck.pull()
                }
            }else{
                if (player.skipbutton.isPointInside(TIP_engine)) {
                    player.deck.reward = []
                    player.reward = 0
                    player.deck.softpull()
                    spawn()
                }
                if (player.cleanbutton.isPointInside(TIP_engine)) {
                    player.cleaning *= -1
                }

                if (player.indexdownbutton.isPointInside(TIP_engine)) {
                    player.displaycardindex -= 1
                    if(player.displaycardindex < 0){
                        player.displaycardindex = 0
                    }
                }
                if (player.indexupbutton.isPointInside(TIP_engine)) {
                    player.displaycardindex += 1
                    if(player.displaycardindex > player.deck.drawable.length-1){
                        player.displaycardindex = player.deck.drawable.length-1
                    }
                }
                
                if (player.removebutton.isPointInside(TIP_engine)) {
                    if(player.deck.drawable.length > 1){
                        player.deck.drawable.splice(player.displaycardindex,1)
                        player.displaycardindex-=1
                        if(player.displaycardindex < 0){
                            player.displaycardindex = 0
                        }
                    }
                }
                
            }
            for (let t = 0; t < player.deck.active.length; t++) {
                if (player.deck.active[t].body.isPointInside(TIP_engine)) {
                    player.deck.active[t].play()
                }
            }
            for (let t = 0; t < player.deck.reward.length; t++) {
                if (player.deck.reward[t].body.isPointInside(TIP_engine)) {
                    player.deck.drawable.push(player.deck.reward[t].clone())
                    player.deck.reward = []
                    player.reward = 0
                    player.deck.softpull()
                    spawn()
                }
            }
            for (let t = 0; t < enemies.length; t++) {
                if (enemies[t].body.body.isPointInside(TIP_engine)) {
                    player.selected = enemies[t]
                    tringle.x = player.selected.body.body.x
                    tringle.y = player.selected.body.body.y - 40
                }
            }
        });
        // window.addEventListener('pointerup', e => {
        //     window.removeEventListener("pointermove", continued_stimuli);
        // })

        canvas.addEventListener('pointermove', continued_stimuli);
        function continued_stimuli(e) {
            FLEX_engine = canvas.getBoundingClientRect();
            XS_engine = e.clientX - FLEX_engine.left;
            YS_engine = e.clientY - FLEX_engine.top;
            TIP_engine.x = XS_engine
            TIP_engine.y = YS_engine
            TIP_engine.body = TIP_engine


        }
    }
    function gamepad_control(object, speed = 1) { // basic control for objects using the controler
        console.log(gamepadAPI.axesStatus[1] * gamepadAPI.axesStatus[0])
        if (typeof object.body != 'undefined') {
            if (typeof (gamepadAPI.axesStatus[1]) != 'undefined') {
                if (typeof (gamepadAPI.axesStatus[0]) != 'undefined') {
                    object.body.x += (gamepadAPI.axesStatus[2] * speed)
                    object.body.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        } else if (typeof object != 'undefined') {
            if (typeof (gamepadAPI.axesStatus[1]) != 'undefined') {
                if (typeof (gamepadAPI.axesStatus[0]) != 'undefined') {
                    object.x += (gamepadAPI.axesStatus[0] * speed)
                    object.y += (gamepadAPI.axesStatus[1] * speed)
                }
            }
        }
    }
    function control(object, speed = 1) { // basic control for objects
        if (typeof object.body != 'undefined') {
            if (keysPressed['w']) {
                object.body.y -= speed * gamepadAPI.axesStatus[0]
            }
            if (keysPressed['d']) {
                object.body.x += speed
            }
            if (keysPressed['s']) {
                object.body.y += speed
            }
            if (keysPressed['a']) {
                object.body.x -= speed
            }
        } else if (typeof object != 'undefined') {
            if (keysPressed['w']) {
                object.y -= speed
            }
            if (keysPressed['d']) {
                object.x += speed
            }
            if (keysPressed['s']) {
                object.y += speed
            }
            if (keysPressed['a']) {
                object.x -= speed
            }
        }
    }
    function getRandomLightColor() { // random color that will be visible on  black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 12) + 4)];
        }
        return color;
    }
    function getRandomColor() { // random color
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 16) + 0)];
        }
        return color;
    }
    function getRandomDarkColor() {// color that will be visible on a black background
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[(Math.floor(Math.random() * 10))];
        }
        return color;
    }
    function castBetween(from, to, granularity = 10, radius = 1) { //creates a sort of beam hitbox between two points, with a granularity (number of members over distance), with a radius defined as well
        let limit = granularity
        let shape_array = []
        for (let t = 0; t < limit; t++) {
            let circ = new Circle((from.x * (t / limit)) + (to.x * ((limit - t) / limit)), (from.y * (t / limit)) + (to.y * ((limit - t) / limit)), radius, "red")
            shape_array.push(circ)
        }
        return (new Shape(shape_array))
    }


    class Pointer {
        constructor(x, y, color, length = 40) {
            this.x = x
            this.y = y
            this.color = color
            this.length = length
            this.radius = length
        }
        draw() {
            canvas_context.beginPath();
            canvas_context.moveTo(this.x, this.y + this.length / 2);
            canvas_context.lineTo(this.x + this.length, this.y + this.length / 2);
            canvas_context.lineTo(this.x, this.y + this.length * 1.41);
            canvas_context.lineTo(this.x - this.length, this.y + this.length / 2);
            canvas_context.lineTo(this.x, this.y + this.length / 2);
            canvas_context.stroke();
            canvas_context.fillStyle = this.color
            canvas_context.fill()
            canvas_context.closePath()
        }
    }

    class Player {
        constructor() {
            this.selected = {}
            this.selected.body = {}
            this.selected.body.body = {}
            this.selected.body.body.x = 100
            this.selected.body.body.y = 100
            this.deck = new Deck()
            let strangecard = new Card(5, 0)
            strangecard.block = 2
            strangecard.healing = 17
            strangecard.thorns = 9
            strangecard.energybonus = 3
            strangecard.poison = 10
            strangecard.body.color = "red"
            this.deck.push(strangecard)
            this.deck.push(strangecard.clone())
            this.deck.push(strangecard.clone())
            this.deck.push(strangecard.clone())
            this.deck.push(strangecard.clone())
            this.drawbutton = new Rectangle(580, 380, 220, 60, "purple")
            this.skipbutton = new Rectangle(580, 250, 220, 60, "white")
            this.cleanbutton = new Rectangle(580, 150, 220, 60, "green")
            this.removebutton = new Rectangle(100, 270, 160, 50, "white")
            this.indexupbutton = new Rectangle(280, 180, 50, 50, "#00FF00")
            this.indexdownbutton = new Rectangle(30, 180, 50, 50, "#FF0000")
            this.energymax = 5
            this.energy = 5
            this.maxhealth = 100
            this.health = 100
            this.block = 0
            this.thorns = 0
            this.reward = 0
            this.level = 0
            this.displaycardindex = 0
            this.cleaning = -1
        }
        draw() {
            if (this.reward == 0) {
                this.drawbutton.draw()
                canvas_context.font = "43px arial"
                canvas_context.fillStyle = "white"
                canvas_context.fillText("Draw", 590, 425)
                canvas_context.font = "43px arial"
                canvas_context.fillStyle = "white"
                canvas_context.fillText(`Health: ${this.health} Energy: ${this.energy}`, 10, 425)
                canvas_context.font = "23px arial"
                canvas_context.fillText(`Block: ${this.block} Thorns: ${this.thorns}`, 10, 465)
        
            } else {
                this.skipbutton.draw()
                this.cleanbutton.draw()
                canvas_context.font = "43px arial"
                canvas_context.fillStyle = "black"
                canvas_context.fillText("Skip", 590, 425)
                canvas_context.fillStyle = "white"
                canvas_context.fillText(`Select a reward card!`, 10, 425)
                if(this.cleaning == 1){
                    this.deck.drawable[this.displaycardindex].body.x = 100
                    this.deck.drawable[this.displaycardindex].body.y = 100
                    this.deck.drawable[this.displaycardindex].draw()
                    this.removebutton.draw()
                    this.indexdownbutton.draw()
                    this.indexupbutton.draw()
                    canvas_context.font = "43px arial"
                    canvas_context.fillStyle = "white"
                    canvas_context.fillText(`Cards: ${this.deck.drawable.length}`, 100, 50)
                }
            }
            this.deck.draw()
        }
    }
    class Deck {
        constructor() {
            this.active = []
            this.drawable = []
            this.discarded = []
            this.reward = []
            for (let t = 0; t < 0; t++) {
                this.push(new Card())
            }
        }
        makeprize() {
            for (let t = 0; t < 5; t++) {
                this.reward.push(new Card(player.level, Math.floor(Math.random() * 6)))
            }
            for (let t = 0; t < this.reward.length; t++) {
                this.reward[t].body.x = t * 160
            }
        }
        push(card) {
            this.drawable.push(card)
        }
        pull() {
            player.energy = player.energymax
            for (let t = 0; t < this.active.length; t++) {
                this.push(this.active[t].clone())
            }
            let pulllength = Math.min(this.drawable.length, 5)
            this.active = []
            for (let t = 0; t < pulllength; t++) {
                let index = Math.floor(Math.random() * this.drawable.length)
                this.active.push(this.drawable[index].clone())
                this.drawable.splice(index, 1)
            }

            for (let t = 0; t < this.active.length; t++) {
                this.active[t].body.x = t * 160
                this.active[t].body.y = 550
            }
            for (let t = 0; t < enemies.length; t++) {
                enemies[t].attack()
            }
        }
        softpull() {
            player.energy = player.energymax
            for (let t = 0; t < this.active.length; t++) {
                this.push(this.active[t].clone())
            }
            let pulllength = Math.min(this.drawable.length, 5)
            this.active = []
            for (let t = 0; t < pulllength; t++) {
                let index = Math.floor(Math.random() * this.drawable.length)
                this.active.push(this.drawable[index].clone())
                this.drawable.splice(index, 1)
            }

            for (let t = 0; t < this.active.length; t++) {
                this.active[t].body.x = t * 160
            }
        }
        draw() {
            if (player.reward == 0) {
                for (let t = 0; t < this.active.length; t++) {
                    this.active[t].draw()
                }
            } else {
                for (let t = 0; t < this.reward.length; t++) {
                    this.reward[t].draw()
                }
            }
        }
    }
    class Card {
        constructor(level = 0, type = 0) {
            this.level = level
            this.type = type
            this.body = new Rectangle(0, 550, 160, 150, "red")
            this.energy = Math.floor(Math.random() * 3)
            this.hits = Math.floor(Math.random() * 4*this.level) + 2
            this.played = 0
            if (this.type == 1) {
                this.healing = Math.ceil(Math.random() * 3) + Math.ceil(Math.random() * 3 * level)
                this.body.color = "green"
            }else{
                this.healing = 0
            }
            if (this.type == 2) {
                this.block = Math.ceil(Math.random() * 1) + Math.ceil(Math.random() * 1 * level)
                this.body.color = "gray"
            }else{
                this.block = 0
            }
            if (this.type == 3) {
                this.poison = Math.ceil(Math.random() * 1) + Math.ceil(Math.random() * 1 * level)
                this.body.color = "purple"
            }else{
                this.poison = 0
            }
            if (this.type == 4) {
                this.thorns = Math.ceil(Math.random() * 1) + Math.ceil(Math.random() * 1 * level)
                this.body.color = "#888800"
            }else{
                this.thorns = 0
            }
            if (this.type == 5) {
                this.energybonus = Math.ceil(Math.random() * 3) 
                this.body.color = "#00AAFF"
            }else{
                this.energybonus = 0
            }
        }
        stringmaker(){
            this.strings = []
            this.strings.push([`Damage: ${this.hits}`, "white"])
            this.strings.push([`Energy: ${this.energy}`, "white"]) 
            if(this.block > 0){
                this.strings.push([`Block: ${this.block}`, "black"]) 
            }
            if(this.thorns > 0){
                this.strings.push([`Thorns: ${this.thorns}`, "yellow"]) 
            }
            if(this.poison > 0){
                this.strings.push([`Poison: ${this.poison}`, "green"]) 
            }
            if(this.healing > 0){
                this.strings.push([`Heals: ${this.healing}`, "#00FF00"]) 
            }
            if(this.energybonus > 0){
                this.strings.push([`Recharge: ${this.energybonus}`, "Blue"]) 
            }
        }
        clone() {
            let clone = new Card()
            clone.energy = this.energy
            clone.level = this.level
            clone.hits = this.hits
            clone.type = this.type
                clone.healing = this.healing
                clone.block = this.block
                clone.poison = this.poison
                clone.thorns = this.thorns
                clone.energybonus = this.energybonus
            clone.body.color = this.body.color
            return clone
        }
        draw() {
            if (this.played == 0) {
                this.body.draw()
                this.stringmaker()
                canvas_context.font = "18px arial"
                for(let t =0;t<this.strings.length;t++){
                    canvas_context.fillStyle = this.strings[t][1]
                    canvas_context.fillText(this.strings[t][0], this.body.x + 10, this.body.y + 20+(t*20))
                }
            }
        }
        play() {
            if (this.played == 0) {
                if (player.energy >= this.energy) {
                    this.played = 1
                    player.thorns+=this.thorns
                    player.health-=player.selected.thorns
                    player.block+=this.block
                    player.health+=this.healing
                    player.energy -= this.energy
                    player.energy += this.energybonus
                    if(this.hits >= player.selected.blocks){
                        player.selected.health -= (this.hits-player.selected.blocks)
                    }
                    player.selected.poison += this.poison
                    if (player.selected.health < 0) {
                        player.selected.health = 0
                    }
                }
            }
        }
    }
    class Enemy {
        constructor(type = -1) {
            if (type == -1) {
                this.type = Math.floor(Math.random() * 4)
            } else {
                this.type = type
            }


            if(this.type == 1){
                this.blocks = Math.floor(Math.random() * (player.level + 2))
            }else{
                this.blocks = 0
            }
            if(this.type == 2){
                this.thorns = Math.floor(Math.random() * (player.level + 3))
            }else{
                this.thorns = 0
            }
            if(this.type == 3){
                this.thorns = Math.floor(Math.random() * (player.level + 3))
                this.blocks = Math.floor(Math.random() * (player.level + 2))
            }
            this.body = new Polygon(350, 200, 15, getRandomColor(), this.type)
            this.health = 10 +(Math.floor(Math.random()*player.level*10))
            this.maxhealth = this.health
            this.hits = Math.floor(Math.random() * (player.level + 3))
            // this.hits = 3
            this.poison = 0
            this.strings = []
            this.stringmaker()
        }
        stringmaker(){
            this.strings = []
            if(this.health < 0){
                this.health = 0
            }
            this.strings.push([`${this.health}/${this.maxhealth}`, "white"])
            this.strings.push([`Hits: ${this.hits}`, "white"]) 
            if(this.blocks > 0){
                this.strings.push([`Blocks: ${this.blocks}`, "gray"]) 
            }
            if(this.thorns > 0){
                this.strings.push([`Thorns: ${this.thorns}`, "yellow"]) 
            }
            if(this.poison > 0){
                this.strings.push([`Poisoned: ${this.poison}`, "green"]) 
            }
        }
        attack() {
            if(this.hits >= player.block){
                player.health -= (this.hits-player.block)
            }
            if(this.hits > 0){
                this.health-=player.thorns
            }
            this.health-=this.poison
        }
        draw() {

            this.stringmaker()
            this.body.draw()
            canvas_context.font = "12px arial"
            // canvas_context.fillStyle = "white"
            for(let t =0;t<this.strings.length;t++){
                canvas_context.fillStyle = this.strings[t][1]
                canvas_context.fillText(this.strings[t][0], this.body.body.x - 15, this.body.body.y + 60+(t*20))
            }
            // canvas_context.fillText(`${this.health}/${this.maxhealth}`, this.body.body.x - 15, this.body.body.y + 60)
            // canvas_context.fillText(`Hits: ${this.hits}`, this.body.body.x - 15, this.body.body.y + 80)
            // if(this.poison > 0){
            //     canvas_context.fillStyle = "green"
            //     canvas_context.fillText(`Poisoned: ${this.poison}`, this.body.body.x - 15, this.body.body.y + 100)
            // }
            if (this.health <= 0) {
                enemies.splice(enemies.indexOf(this), 1)
                if (enemies.length == 0) {
                    player.reward = 1
                    for (let t = 0; t < player.deck.active.length; t++) {
                        player.deck.push(player.deck.active[t].clone())
                    }
                    player.deck.active = []
                    player.deck.makeprize()
                } else if (!enemies.includes(player.selected)) {
                    player.selected = enemies[0]
                }
            }
        }


    }

    let player = new Player()
    let enemies = []

    let enenum = Math.floor(Math.random() * 8) + 1
    for (let t = 0; t < enenum; t++) {
        let enemy = new Enemy(-1 )
        enemies.push(enemy)
    }
    function spawn() {
        player.level+=1
        enenum = Math.floor(Math.random() * 8) + 1
        for (let t = 0; t < enenum; t++) {
            let enemy = new Enemy(-1)
            enemies.push(enemy)
        }
        player.health = player.maxhealth
        player.energy = player.energymax
        player.block = 0
        player.thorns = 0

        player.deck.softpull()
    }

    let setup_canvas = document.getElementById('canvas') //getting canvas from document
    setUp(setup_canvas) // setting up canvas refrences, starting timer. 

    let counter = 0

    let tringle = new Pointer(350, 350, "white", 10)

    player.deck.softpull()
    function main() {
        for(let k = 0;k<enemies.length;k++){
            for (let t = 0; t < enemies.length; t++) {
                enemies[t].body.body.x = ((canvas.width / enemies.length + 1) * (t)) + ((canvas.width / (enemies.length * 2)))
                enemies[t].draw()
            }
        }
        canvas_context.clearRect(0, 0, canvas.width, canvas.height) 
        gamepadAPI.update() 
        for (let t = 0; t < enemies.length; t++) {
            enemies[t].body.body.x = ((canvas.width / enemies.length + 1) * (t)) + ((canvas.width / (enemies.length * 2)))
            enemies[t].draw()
        }
        player.draw()
        if (player.reward == 0) {
            if (!enemies.includes(player.selected)) {
                player.selected = enemies[0]
            }else{
                tringle.x = player.selected.body.body.x
                tringle.y = player.selected.body.body.y - 40
                tringle.draw()
            }
        }
    }
})