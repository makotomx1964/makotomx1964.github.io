
//initCubeSolver();

// 初期化
function initCubeSolver(){
    console.log(`[initSolver]Start...`);    
    Cube.initSolver();

    const status = "OK";
    const solver = new Cube();
    const state = solver.asString();

    console.log(`[initSolver]OK`);    
    return { status,state };
}

// ランダム状態提供
function scramble2(){
    const scrambles = Cube.random();   
    const scramble = scrambles.asString();
    //console.log(`scramble ${scramble}`);    
    return { scramble };
}

// ランダム状態提供
function scramble(){
    //  ランダム生成
    const scrambles = Cube.random();   
    const scramble = scrambles.asString();

    //  Solve生成
    const state = Cube.fromString(scramble); 
    const solver = new Cube();
    solver.init(state);        

    const solution = solver.solve();
    return { state, scramble, solution };
}

// 解法生成
function solve(state){

    if (!state || state.length !== 54) {
        return { error: 'Invalid state' };
    }

    try {
        //  生成
        const solver = new Cube();
        solver.init(Cube.fromString(state));
        const solution = solver.solve();
        return { solution };
    } catch (err) {
        console.log(`Request Error ${err.message}`);
        return { error: err.message };
    }
}

// Cube更新
function move(state,move){
    if (!state || state.length !== 54) {
        return { error: 'Invalid state' };
    }

    try {
        //  生成
        const solver = new Cube();
        solver.init(Cube.fromString(state));

        if (move) {
            solver.move(move);
        }
        const new_state = solver.asString();
        return { new_state };
    } catch (err) {
        console.log(`Request Error ${err.message}`);
        return { error: err.message };
    }
}

//  Cube Check
function check(state){
  if (!state || typeof state !== 'string' || state.length !== 54) {
    return { valid: false, message: '54文字の状態を送ってください' };
  }

  try {
    let valid = false;

    //  生成
    const solver = new Cube();
    const initState = Cube.fromString(state);
    solver.init(initState);

    const solve_state = solver.asString(); 
    if(state === solve_state)
        valid = true;

    const solution = solver.solve();
    return { valid , message: valid === true ?'合法なキューブ状態です':'非合法な状態です', solution };
  } catch (err) {
    console.log(err.message)
    return { valid: false, message: '非合法な状態です: ' + err.message };
  }
}


