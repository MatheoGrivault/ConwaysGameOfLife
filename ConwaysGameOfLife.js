let viewport;
let movePoint;

let liveCells = [];
let lastTimestep;
let timestep = 1;

let configs = new Map();
let configBox;
let timestepInterval;
let paused;

function setup(){
    createCanvas(windowWidth, windowHeight);

    loadConfigs();

    configBox = createSelect();
    configBox.position(width-140, height-26);
    for(let name of configs.keys()) {
        configBox.option(name);
    }
    configBox.changed(function(){
        liveCells = configs.get(configBox.value());
        timestep = 0;
    });

    timestepInterval = createSlider(1, 500, 200);
    timestepInterval.position(100, height-21);

    let playPauseButton = createButton("Pause");
    playPauseButton.position(width-260, height-28);
    playPauseButton.mousePressed(function(){
        paused = !paused;
        playPauseButton.html(paused ? "Play" : "Pause");
    });

    let resetButton = createButton("Reset");
    resetButton.position(width-200, height-28);
    resetButton.mousePressed(function(){
        timestep = 0;
        liveCells = configs.get(configBox.value());
    });
    
    liveCells = Array.from(configs.values())[0];

    viewport = [createVector(-25, -25*height/width), createVector(25, 25*height/width)];

    lastTimestep = millis();
}

function draw(){
    background(0);
    fill(255);

    let timeElapsed = millis()-lastTimestep;
    if(!paused && timeElapsed >= timestepInterval.value()){
        timestep++;
        lastTimestep = millis();

        let liveCells_ = [];
        let alreadyChecked = [];
        for(let i = 0; i<liveCells.length; i++){
            let neighbors = getLiveNeighbors(liveCells[i]);
            let deadNeighbors = getDeadNeighbors(liveCells[i]);
            
            if(neighbors.length == 2 || neighbors.length == 3) liveCells_.push(liveCells[i]);

            for(let j = 0; j<deadNeighbors.length; j++){
                if(alreadyChecked.some(c => c+"" == deadNeighbors[j]+"")) continue;
                alreadyChecked.push(deadNeighbors[j]);

                if(getLiveNeighbors(deadNeighbors[j]).length == 3) liveCells_.push(deadNeighbors[j]);
            }
        }

        liveCells = liveCells_;
    }

    for(let i = 0; i<liveCells.length; i++){
        let cellX = map(liveCells[i].x, viewport[0].x, viewport[1].x, 0, width)-getCellSize()[0]/2;
        let cellY = height-map(liveCells[i].y, viewport[0].y, viewport[1].y, 0, height)-getCellSize()[1]/2;
        
        if(cellX+getCellSize()[0] < 0 || cellX > width) continue;
        if(cellY+getCellSize()[1] < 0 || cellY > height) continue;
        
        rect(cellX, cellY, getCellSize()[0], getCellSize()[1]);
    }

    text("Timestep: "+timestep, 5, 15);

    text("Timestep Interval", 5, height-7);
    text(timestepInterval.value()+" ms", 235, height-7)
}

function getLiveNeighbors(cell){
    let neighbors = [];
    if(isAlive(createVector(cell.x-1, cell.y-1))) neighbors.push(createVector(cell.x-1, cell.y-1));
    if(isAlive(createVector(cell.x, cell.y-1))) neighbors.push(createVector(cell.x, cell.y-1));
    if(isAlive(createVector(cell.x+1, cell.y-1))) neighbors.push(createVector(cell.x+1, cell.y-1));

    if(isAlive(createVector(cell.x-1, cell.y))) neighbors.push(createVector(cell.x-1, cell.y));
    if(isAlive(createVector(cell.x+1, cell.y))) neighbors.push(createVector(cell.x+1, cell.y));
    
    if(isAlive(createVector(cell.x-1, cell.y+1))) neighbors.push(createVector(cell.x-1, cell.y+1));
    if(isAlive(createVector(cell.x, cell.y+1))) neighbors.push(createVector(cell.x, cell.y+1));
    if(isAlive(createVector(cell.x+1, cell.y+1))) neighbors.push(createVector(cell.x+1, cell.y+1));

    return neighbors;
}

function getDeadNeighbors(cell){
    let neighbors = [];
    if(!isAlive(createVector(cell.x-1, cell.y-1))) neighbors.push(createVector(cell.x-1, cell.y-1));
    if(!isAlive(createVector(cell.x, cell.y-1))) neighbors.push(createVector(cell.x, cell.y-1));
    if(!isAlive(createVector(cell.x+1, cell.y-1))) neighbors.push(createVector(cell.x+1, cell.y-1));

    if(!isAlive(createVector(cell.x-1, cell.y))) neighbors.push(createVector(cell.x-1, cell.y));
    if(!isAlive(createVector(cell.x+1, cell.y))) neighbors.push(createVector(cell.x+1, cell.y));
    
    if(!isAlive(createVector(cell.x-1, cell.y+1))) neighbors.push(createVector(cell.x-1, cell.y+1));
    if(!isAlive(createVector(cell.x, cell.y+1))) neighbors.push(createVector(cell.x, cell.y+1));
    if(!isAlive(createVector(cell.x+1, cell.y+1))) neighbors.push(createVector(cell.x+1, cell.y+1));

    return neighbors;
}

function isAlive(cell){
    return liveCells.some(c => c+"" == cell+"");
}

function getCellSize(){
    return [width/(viewport[1].x-viewport[0].x), height/(viewport[1].y-viewport[0].y)];
}

function screenPointToCell(x, y){
    let cellX = map(x, 0, width, viewport[0].x, viewport[1].x);
    let cellY = map(height-y, 0, height, viewport[0].y, viewport[1].y);

    return createVector(cellX, cellY);
}

function mousePressed(){
    if(mouseY > height-30) return;
    movePoint = screenPointToCell(mouseX, mouseY);
}

function mouseDragged(){
    if(movePoint == undefined) return;

    let newPoint = screenPointToCell(mouseX, mouseY);
    let delta = p5.Vector.sub(newPoint, movePoint);
    viewport[0].sub(delta);
    viewport[1].sub(delta);
    movePoint = screenPointToCell(mouseX, mouseY);
}

function mouseReleased(){
    movePoint = undefined;
}

function mouseWheel(e){
    let zoomPoint = screenPointToCell(mouseX, mouseY);
    //Translate viewport so that the zoom point is at the origin
    viewport[0].sub(zoomPoint);
    viewport[1].sub(zoomPoint);
    //Scale the viewport
    viewport[0].mult(1+e.delta/1000);
    viewport[1].mult(1+e.delta/1000);
    //Translate back to the original position
    viewport[0].add(zoomPoint);
    viewport[1].add(zoomPoint);
}

function loadConfigs(){
    configs.set("Blinker (period 2)", [createVector(-1, 0),
        createVector(0, 0),
        createVector(1, 0)]);

    configs.set("Toad (period 2)", [createVector(-1, 0),
        createVector(0, 1),
        createVector(1, 1),
        createVector(0, -2),
        createVector(1, -2),
        createVector(2, -1)]);
    
    configs.set("Pulsar (period 3)", [createVector(-2, 1),
        createVector(-3, 1),
        createVector(-4, 1),
        createVector(-6, 2),
        createVector(-6, 3),
        createVector(-6, 4),
        createVector(-4, 6),
        createVector(-3, 6),
        createVector(-2, 6),
        createVector(-1, 4),
        createVector(-1, 3),
        createVector(-1, 2),
    
        createVector(2, 1),
        createVector(3, 1),
        createVector(4, 1),
        createVector(6, 2),
        createVector(6, 3),
        createVector(6, 4),
        createVector(4, 6),
        createVector(3, 6),
        createVector(2, 6),
        createVector(1, 4),
        createVector(1, 3),
        createVector(1, 2),
    
        createVector(-2, -1),
        createVector(-3, -1),
        createVector(-4, -1),
        createVector(-6, -2),
        createVector(-6, -3),
        createVector(-6, -4),
        createVector(-4, -6),
        createVector(-3, -6),
        createVector(-2, -6),
        createVector(-1, -4),
        createVector(-1, -3),
        createVector(-1, -2),
    
        createVector(2, -1),
        createVector(3, -1),
        createVector(4, -1),
        createVector(6, -2),
        createVector(6, -3),
        createVector(6, -4),
        createVector(4, -6),
        createVector(3, -6),
        createVector(2, -6),
        createVector(1, -4),
        createVector(1, -3),
        createVector(1, -2)]);

    configs.set("Glider", [createVector(0, 1),
        createVector(1, 0),
        createVector(-1, -1),
        createVector(0, -1),
        createVector(1, -1)]);
        
    configs.set("LWSS", [createVector(-1, 1),
        createVector(-2, 0),
        createVector(-2, -1),
        createVector(-2, -2),
        createVector(-1, -2),
        createVector(0, -2),
        createVector(1, -2),
        createVector(2, -1),
        createVector(2, 1)]);

    configs.set("Gosper Glider gun", [createVector(-1, -1),
        createVector(-2, -1),
        createVector(-2, -2),
        createVector(-3, -3),
        createVector(-5, -4),
        createVector(-6, -4),
        createVector(-7, -3),
        createVector(-8, -2),
        createVector(-8, -1),
        createVector(-8, 0),
        createVector(-7, 1),
        createVector(-6, 2),
        createVector(-5, 2),
        createVector(-3, 1),
        createVector(-2, 0),
        createVector(-4, -1),
    
        createVector(2, 0),
        createVector(2, 1),
        createVector(2, 2),
        createVector(3, 0),
        createVector(3, 1),
        createVector(3, 2),
        createVector(4, 3),
        createVector(4, -1),
        createVector(6, -1),
        createVector(6, -2),
        createVector(6, 3),
        createVector(6, 4),
    
        createVector(16, 1),
        createVector(17, 1),
        createVector(16, 2),
        createVector(17, 2),
    
        createVector(-17, 0),
        createVector(-17, -1),
        createVector(-18, 0),
        createVector(-18, -1)]);
}