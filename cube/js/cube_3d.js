//  CUBE THREE.JS

//  CUBE初期状態
const CUBE_DEFAULT_FACE = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

//  cube-State
const cubeStates = {
    state: [],   
    rearrangeState:[],
    solution:[],
    solutionRVS:[]
};


/*
<初期値>
  yellow   Blue      Red       Green  Orange   White
<-face1-><-face2-><-face3-><-face4-><-face5-><-face6->
UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB

DDDDDDDDDRRRRRRRRRFFFFFFFFFLLLLLLLLLBBBBBBBBBUUUUUUUUU
<-UPPER-><-FACE--><-RIGHT-><-BACK--><-LEFT--><-DOWN-->
DDDDDDDDDRRRRRRRRRFFFFFFFFFLLLLLLLLLBBBBBBBBBUUUUUUUUU

<初期値>
　U colorY
  F colorB
  R colorR
  B colorG
  L colorO
  D colorW

<UP>      <Right>  <Front>   <DOWN>   <LEFT>  <BACK>
UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB
colorW　　　colorB　colorR　　　colorY　colorG　　colorO




*/

const colorY = 0xffff00;    //  黄
const colorB = 0x0000ff;    //  Blue
const colorR = 0xff0000;    //  RED
const colorG = 0x00ff00;    //  Green
const colorO = 0xff8000     //  オレンジ（0xff4400 --> 0xff8000)
const colorW = 0xffffff;    //  Wgite
const colorE = 0x000000;    //  Black(Edge用)

/*
    <UP>      colorW U
    <Right>   colorB R
    <Front>   colorR F
    <DOWN>    colorY D
    <LEFT>    colorG L
    <BACK>    colorO B
*/
//  Cubeカラー初期値
const colorMap = {
    U: colorW, // 白(TOP)
    R: colorB, // 青(RIGHT)
    F: colorR, // 赤(FRONT)
    D: colorY, // 黄(DOWN)
    L: colorG, // 緑(LEFT)
    B: colorO  // オレンジ(BACK)
};

const faces0 = [
    colorW, // 0 - 8(TOP)
    colorR, // 9 - 17(FRONT)
    colorB, // 18 - 26(RIGHT)
    colorO, // 27 - 35(BACK)
    colorG, // 36 - 44(LEFT)
    colorY, // 45 - 53(DOWN)
];


const inverseColorMap = Object.fromEntries(
    Object.entries(colorMap).map(([k, v]) => [v, k])
);

// X軸: 右方向
// Y軸: 上方向
// Z軸: 手前方向
const moveMap = {
    "R" :{axis: "x", direction: [ 0,  0, +1], speed: 1,basemove:"R"},
	"R'":{axis: "x", direction: [ 0,  0, -1], speed: 1,basemove:"R'"},
	"L" :{axis: "x", direction: [-1,  0,  0], speed: 1,basemove:"L"},
	"L'":{axis: "x", direction: [+1,  0,  0], speed: 1,basemove:"L'"},
	"U" :{axis: "y", direction: [ 0,  0, +1], speed: 1,basemove:"U"},
	"U'":{axis: "y", direction: [ 0,  0, -1], speed: 1,basemove:"U'"},
	"F" :{axis: "z", direction: [ 0,  0, +1], speed: 1,basemove:"F"},
	"F'":{axis: "z", direction: [ 0,  0, -1], speed: 1,basemove:"F'"},
	
	"D" :{axis: "y", direction: [-1,  0,  0], speed: 1,basemove:"D"},
	"D'":{axis: "y", direction: [+1,  0,  0], speed: 1,basemove:"D'"},
	"B" :{axis: "z", direction: [-1,  0,  0], speed: 1,basemove:"B"},
	"B'":{axis: "z", direction: [+1,  0,  0], speed: 1,basemove:"B'"},
	"M" :{axis: "x", direction: [ 0, -1,  0], speed: 1,basemove:"M"},
	"M'":{axis: "x", direction: [ 0, +1,  0], speed: 1,basemove:"M'"},
	
	"X" :{axis: "x", direction: [+1, +1, +1], speed: 1,basemove:"X"},
	"X'":{axis: "x", direction: [-1, -1, -1], speed: 1,basemove:"X'"},
	"Y" :{axis: "y", direction: [+1, +1, +1], speed: 1,basemove:"Y"},
	"Y'":{axis: "y", direction: [-1, -1, -1], speed: 1,basemove:"Y'"},
	"Z" :{axis: "z", direction: [+1, +1, +1], speed: 1,basemove:"Z"},
	"Z'":{axis: "z", direction: [-1, -1, -1], speed: 1,basemove:"Z'"}
};

//  THREE.JS 設定値
const cameraX = 240 + 0;    
const cameraY = 240 + 0;    
const cameraZ = 320 + 200;    

const width = 350 + 100;
const height = 250 +100;

const cubeWidth = 100 + 10;
const cubePadding = 20 + -10;
const faceDepth = 5 + 5;

const rubiksHalfWidth = (cubeWidth * 3 - faceDepth) * 0.5;
const actionQueue = [];
const nullRotationAction = {axis: "", direction: [0, 0, 0], speed: 1};
const btnActions = {};
const keyEventHandlers = {};


let  canvas;    //  canvas = document.querySelector('#rubiks');
let renderer ;  //  renderer = new THREE.WebGLRenderer({canvas, antialias: true});
let scene;      //  scene = new THREE.Scene();
let controls;   // = new THREE.OrbitControls(camera, canvas);
let camera;     // = new THREE.PerspectiveCamera(65, width / height, 1, 1000);
let rotationAction;
let rotationActionStartTime;

let faces;
let faces2;
let faces_original;

// 以降 your cube logic...
let moveQueue = [];
let currentMoveIndex = 0;
let isStepping = false;

let moveQueue2 = [];
let currentMoveIndex2 = 0;
let isStepping2 = false;

let spinerTimer;
let initTimer;

const stepMoves = {
    movetype:"forward",
    moveQueue: [],
    moveIndex:0,
    moveAuto: true,
    isMoving: false
};

/*
window.addEventListener("load", async function () {
    console.log(`❤️ window addEventListener load start`);
});

$(document).ready(async function () {
    console.log(`❤️ document ready start`);
});

$(document).on("mobileinit", function () {
    console.log("❤️ mobileinit start");
});
*/

$(document).on("pageinit", "#one", function () {
    startSpinner("Initializing...");
    $("#main-content").hide();
    console.log("❤️ page:one init start");
    setTimeout(initCube,1000);
});

function initCube(){
    init();
    stopSpinner();
    $("#main-content").show();
}

function startSpinner(msg){
    elapsedTime = 0; // 経過時間（秒）
    $(".spinner-msg").text(`${msg}`);
    $(".spinner-overlay").fadeIn(); // スピナー表示
}

function stopSpinner(){
    $(".spinner-overlay").fadeOut(); // スピナーを非表示
}


async function resetCube(state_new) 
{
    //  homeFaces再作成
    console.log(`resetCube:${state_new}`);
    faces = createHomeFacesByState(state_new);
    faces2 = copyFaces(faces);

    //  再描画
    rotationAction = nullRotationAction;
    rotationActionStartTime = new Date().getTime();
    replaceBoxes(0.0, 1.0, 0.0);
    resetCamera();

    const new_state = getStateFromHomeFaces(faces);
    document.getElementById('status').textContent = '初期値: ' + rearrangeStateForQUBEJS(new_state);

    return;
}

function splitMove(cmd) {
    const match = cmd.match(/^([A-Z]'?)(2)?$/);
    if (match) {
        return [match[1], match[2] || "1"];  // match[2] が無ければ "1"
    } else {
        return [cmd, "1"];  // マッチしなければ本体 + "1" を返す
    }
}

//  シャッフルアクションの作成
function setContinuousActions(moves) {
    const actions = [];
    const actionList = [];
    const speed = 1;
    console.log(`❤️ setContinuousActions:[${moves}] size(${moves.length})`)

    // for (const move of moves) {
    for (const [scenario, move] of moves.entries()) {        
        const [baseMove, repeat] = splitMove(move);
        //console.log(`setContinuousActions move:${move} baseMove:${baseMove} repeat:${repeat}`);
        //console.log(`setContinuousActions:Action[${baseMove}]x[${repeat}]`);

        for (let i = 0; i < repeat; i++) {
            const action = moveMap[baseMove];
            //action.scenario = scenario;
            //action.basemove = move;
            if (action) {
                //console.log(`[${baseMove}-${i+1}] action:${action.axis}-(${action.direction[0]},${action.direction[1]},${action.direction[2]})-speed:${action.speed}`);
                //console.log(`${JSON.stringify(action)}`);
                actionList.push(action)
            }
        }
    }

    for (const act of actionList) {
        let axis = act.axis;
        let direction = act.direction;
        //const basemove = act.basemove
        //const scenario = act.scenario;

        //  let speed = act.speed;
         actions.push({axis, direction, speed});
    }

    for (const act of actions) {
        pushActionToQueue(act);
    }
    return;
}

/*
async function moveStep(dir) 
{
    console.log(`❤️ moveStep:${dir}`);
    let action = moveMap[dir];
 
    //  CUBE.JS状態を変更
    moveCube(dir);  
    if (action) {
        //  コマンドを実行しておしまい
        console.log(`[${dir}] action:${action.axis}-(${action.direction[0]},${action.direction[1]},${action.direction[2]})-speed:${action.speed}`);
        pushActionToQueue(action);
        return;
    }

    //Repeat確認
    console.log(`[${dir}]`);
    const baseMove = dir[0]; // "U"
    const repeat = dir.endsWith("2") ? 2 : 1;
    for (let i = 0; i < repeat; i++) {
        const action = moveMap[baseMove];
        if (action) {
            console.log(`[${baseMove}-${i+1}] action:${action.axis}-(${action.direction[0]},${action.direction[1]},${action.direction[2]})-speed:${action.speed}`);
            pushActionToQueue(action);
        }
    }
}
*/

async function init(){
    console.log("init start...");

    //  キャンバスの作成
    canvas = document.querySelector('#rubiks');

    //  Three.js生成
    renderer = new THREE.WebGLRenderer({canvas, antialias: true});
    scene = new THREE.Scene();

    //  カメラ作成
    camera = new THREE.PerspectiveCamera(65, width / height, 1, 1000);

    // 🚀 controls 設定
    controls = new THREE.OrbitControls(camera, canvas);

    renderer.setSize(width, height);
    scene.background = new THREE.Color('black');

    //  Cube生成
    await initSolver();

    //  解決方法Get
    await requestSolution();

    controls.rotateSpeed = 0.5;
    controls.update();
    renderer.render(scene, camera);
    animate();

    //  ボタンに処理を紐付け
    setButtonActions();

    console.log("Init End ////");


}
/*
    stepMoves.isMoving = true;
    stepMoves.movetype = "forward";
    stepMoves.moveIndex = 0;
    stepMoves.moveQueue = 0;
    stepMoves.moveAuto = true;
*/
async function playMovesSingle() {
    if (!stepMoves.isMoving || stepMoves.moveIndex >=stepMoves.moveQueue.length) {
        console.log(`playMovesSingle:No Actions[isStepping:${stepMoves.isMoving}]`)
        return;
    }
    const moveQue=[];
    const move = stepMoves.moveQueue[stepMoves.moveIndex];
    let moveText = "";

    for (const [index, move] of stepMoves.moveQueue.entries()) {
        moveText += index === stepMoves.moveIndex? ` <span style="color:red; font-weight:bold;">${move}</span> `:` ${move} `;       
    }
    if(stepMoves.movetype === "forward")
        $("#movestep").html(moveText);

    if(stepMoves.movetype === "backward") 
        $("#movestepRVS").html(moveText);

    moveQue.push(move);
    document.getElementById('move').textContent = `(${stepMoves.moveIndex + 1}) ${move}`;
    //console.log(`playMovesSingle cmd:${move}`);
    setContinuousActions(moveQue);

    stepMoves.moveIndex++;
    if (stepMoves.moveIndex >= stepMoves.moveQueue.length) {
        document.getElementById('move').textContent += ' ← 完了！';
        stepMoves.isMoving = false;
        console.log(`playFinish:${stepMoves.movetype} ${stepMoves.moveIndex}/${stepMoves.moveQueue.length}`);
    }
}

async function playMovesSingleNext()
{
    console.log(`action fin --> next ${stepMoves.movetype}`);

    if(stepMoves.movetype === "rotate"){
        //  roteteモード
        //  解決方法Get
        //  移動中 && Step再生中
        //  解決方法Get
        console.log(`action fin --> ${stepMoves.movetype}`);
        //  await requestSolution();

        //  終了
        stepMoves.isMoving = false;
    } else {
        console.log(`action fin : ${stepMoves.movetype}`);
    }
    await playMovesSingle();
}

async function playMoves(moves) {
    console.log(`playMoves:${moves}`);
    let move_txt = '実行: ';
 
    setContinuousActions(moves);
    move_txt = `${move_txt}${moves}`;
    document.getElementById('move').textContent = move_txt;

    console.log("playMoves fin:",move_txt);
}

function togglePrimeMarksAdvanced(sequence) {
    const moves = sequence.trim().split(/\s+/);

    const toggledMoves = moves.map(move => {
        // "X'2" → "X2"
        if (move.match(/^[A-Z]'2$/)) {
            return move[0] + "2";
        }
        // "X2" → "X'2"
        else if (move.match(/^[A-Z]2$/)) {
            return move[0] + "'2";
        }
        // "X'" → "X"
        else if (move.match(/^[A-Z]'$/)) {
            return move[0];
        }
        // "X" → "X'"
        else if (move.match(/^[A-Z]$/)) {
            return move + "'";
        }
        // その他（予期しない形式）はそのまま
        return move;
    });

    return toggledMoves.join(" ");
}

//  ページ切り替わり
$(document).on("pagebeforehide", "[data-role='page']", async function () {
    console.log(`ページ${this.id}が非表示になります（pagebeforehide）`);
    if(this.id == "one"){
        //
        //  one --> two
        //  3D表示を展開します
        //
        console.log("this is one");    
        const state_three = getStateFromHomeFaces(faces);
        const state = rearrangeStateForQUBEJS(state_three);

        applyCubeState(state);
    }
    if(this.id == "two"){
        //
        //  two --> one
        //  3D表示へ戻る
        // 
        /*  特に何もせず    */
        
        /* 
        console.log("this is two");    
        const state = rearrangeStateForTHREE(showCubeState());
        await resetCube(state);

        //  解決方法Get
        await requestSolution();
        */

    }


});

/*
$(document).on("pagebeforeshow", "[data-role='page']", function () {
  console.log(`ページ${this.id}が表示される直前です（pagebeforeshow）`);
});

$(document).on("pagehide", "[data-role='page']", function () {
  console.log(`ページ${this.id}が隠れました（pagehide）`);
});

$(document).on("pageshow", "[data-role='page']", function () {
  console.log(`ページ${this.id}が表示されました（pageshow）`);
});
*/

$(document).on('pagecreate', function () {
    /*
    $('#scales2').on('change', function () {
        if (this.checked) {
            console.log('チェックされました！');
            currentMoveIndex2 = 0;
            isStepping2 = false;
        } else {
            console.log('チェックが外されました。');
            currentMoveIndex2 = 0;
            isStepping2 = true;

            let cmdMove = $('#movestep').text();
            $("#movestep").data("cmd",reversed);

            moveQueue2 = cmdMove.trim().split(' ');
            console.log(`moveQueue2:${moveQueue2}`);
        }
    });

    $('#scales').on('change', function () {
        if (this.checked) {
            console.log('scalesチェックされました！');
            currentMoveIndex = 0;
            isStepping = false;
        } else {
            console.log('scalesチェックが外されました。');
            currentMoveIndex = 0;
            isStepping = true;
        }
    });
    */

});

$(document).on("click", "#resetSate", async function (e) {
    e.preventDefault(); // ← リンク飛び防止
    console.log("resetSate clicked!");

    //  cube-State
    /*
    const cubeStates = {
        state: [],   
        rearrangeState:[],
        solution:[],
        solutionRVS:[]
    };
    */

    stepMoves.isMoving =false;
    stepMoves.moveIndex =0;
    resetCube(rearrangeStateForTHREE(cubeStates.state));

    //  解決方法Get
    await requestSolution();
    

});

$(document).on("click", ".moveStepsReverse", function (e) {
    e.preventDefault(); // ← リンク飛び防止
    console.log("Reverse clicked!");
    const cmdMove = $("#movestepRVS").data("cmd");
    const cmdMoveQueue = cmdMove.trim().split(' ');
    move_txt = `実行:${cmdMoveQueue}`;
    document.getElementById('move').textContent = move_txt;
    setContinuousActions(cmdMoveQueue);
});

$(document).on("click", ".moveStepsReverseSolo", async function (e) {
    e.preventDefault(); // ← リンク飛び防止
    console.log(`Reverse Solo clicked:moving-${stepMoves.isMoving} moveType-${stepMoves.movetype}`);

    if(stepMoves.isMoving){
        //  動作中
        if(stepMoves.movetype === "backward"){
            //  ReverseMode中
            if(!stepMoves.moveAuto){
                //  移動中 && Step再生中
                await playMovesSingle();
                return;
            }
        } else {
            //  他モード動作中
            console.log("Reverse Solo clicked --> now anather mode moving:",stepMoves.movetype);
            return;
        }
    }
    //  コマンド取得
    //  let cmdMove = $("#movestepRVS").text();
    let cmdMove = $("#movestepRVS").data("cmd");
    if (!cmdMove || cmdMove == "") return;

    let cmdMoveQueue = cmdMove.trim().split(' ');
    stepMoves.isMoving = true;
    stepMoves.movetype = "backward";
    stepMoves.moveIndex = 0;
    stepMoves.moveQueue = cmdMoveQueue;
    console.log(`movestepRVS:${cmdMove}`);
    console.log(`cmdMoveQueue:${cmdMoveQueue}`);


    //  連続再生
    stepMoves.moveAuto = true;
    if (!$("#scales2").prop("checked")) {
        stepMoves.moveAuto = false;
    }
    await playMovesSingle();
});

$(document).on("click", ".moveStepsSolo", async function (e) {
    e.preventDefault(); // ← リンク飛び防止

    console.log(`moveStepsSolo clicked:moving-${stepMoves.isMoving} moveType-${stepMoves.movetype}`);
    if(stepMoves.isMoving){
        //  動作中
        if(stepMoves.movetype === "forward"){
            //  move forward中
            if(!stepMoves.moveAuto){
                //  移動中 && Step再生中
                await playMovesSingle();
                return;
            }
        } else {
            //  他モード動作中
            console.log("Reverse Solo clicked --> now anather mode moving:",stepMoves.movetype);
            return;
        }
    }




    //  コマンド取得
    //  let cmdMove = $("#movestepRVS").text();
    const cmdMove = $("#movestep").data("cmd");
    const cmdMoveQueue = cmdMove.trim().split(' ');
    stepMoves.isMoving = true;
    stepMoves.movetype = "forward";
    stepMoves.moveIndex = 0;
    stepMoves.moveQueue = cmdMoveQueue;

    //  連続再生
    stepMoves.moveAuto = true;
    if (!$("#scales").prop("checked")) {
        stepMoves.moveAuto = false;
    }

    await playMovesSingle();
});

$(document).on("click", ".moveSteps", async function (e) {
    console.log("moveSteps click");

    //  コマンド取得
    const cmdMove = $("#movestep").data("cmd");
    const cmdMoveQueue = cmdMove.trim().split(' ');
    await playMoves(cmdMoveQueue);
});

$(document).on("click", "#getSate", async function (e) {
    const new_state = getStateFromHomeFaces(faces);
    const rearrangeState = rearrangeStateForQUBEJS(new_state);

    console.log(`new_state:${new_state}`);
    console.log(`rea_State:${rearrangeState}`);
});

$(document).on("click", ".btn-rotate", async function (e) {
    const direction = $(this).data("dir");
    console.log("btn-rotate click:",direction);

    //  await moveStep(direction);  // ← await OK
    rotateSingle(direction);
});

async function rotateSingle(cmdMoveQueue=[])
{
    if(stepMoves.isMoving){
        //  動作中
        if(stepMoves.movetype === "rotate"){
            //  roteteモード
            //  解決方法Get
            if(stepMoves.moveAuto){
                //  移動中 && Step再生中
                //  解決方法Get
                //  await requestSolution();

                //  終了
                stepMoves.isMoving = false;
                return;
            }
        } else {
            //  他モード動作中
            console.log("Reverse Solo clicked --> now anather mode moving:",stepMoves.movetype);
            return;
        }
    }

    const cmdMove = `${cmdMoveQueue} `;
    //const rotateQue = cmdMove.trim().split(' ');
    const rotateQue = cmdMove.replace(/ +$/, ' ').split(' ');
    stepMoves.isMoving = true;
    stepMoves.movetype = "rotate";
    stepMoves.moveIndex = 0;
    stepMoves.moveQueue = rotateQue;

    //  連続再生
    stepMoves.moveAuto = true;
    await playMovesSingle();

}

function setButtonActions(){
 
    document.getElementById('scrambleBtn').onclick = async function () {
        //  Scaramble
        await loadStateFromServer();

        //  解決方法Get
        await requestSolution();

    };

    document.getElementById('solveBtn').onclick = async function () {
        await requestSolution();
    };

    document.getElementById('initBtn').onclick = async function () {
        await initSolver();

        //  解決方法Get
        await requestSolution();
    };

    document.getElementById("reset-camera").addEventListener("click", function(event) {
        resetCamera();
        event.preventDefault();
        return false;
    });

    document.getElementById("reset-camera-bottom").addEventListener("click", function(event) {
        resetCameraBottom();
        event.preventDefault();
        return false;
    });

    document.getElementById("reset-camera-reverse").addEventListener("click", function(event) {
        resetCameraReverse();
        event.preventDefault();
        return false;
    });

    document.body.addEventListener("keydown", function(event) {
        const handler = keyEventHandlers[event.key];
        if (handler) {
            handler();
        }
    });
}

//  THREE.JS-->CUBE.JS
function rearrangeStateForQUBEJS(state) {
    if (state.length !== 54) {
        throw new Error("state must be exactly 54 characters long");
    }

    const parts = {
        U: state.substring(0, 9),       // 0–8
        F: state.substring(9, 18),      // 9–17
        R: state.substring(18, 27),     // 18–26
        B: state.substring(27, 36),     // 27–35
        L: state.substring(36, 45),     // 36–44
        D: state.substring(45, 54),     // 45–53
    };

    // 再構成：U, F, R, B, L, D の順に並べ替え
    //  UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB
    return parts.U + parts.R + parts.F + parts.D + parts.L + parts.B;
}


//  Cube.JS-->THREE.JS
function rearrangeStateForTHREE(state) {
    if (state.length !== 54) {
        console.log(state);
        throw new Error("state must be exactly 54 characters long");
    }

    //  Cube.JS-->THREE.JS
    const parts = {
        U: state.substring(0, 9),       // 0–8
        R: state.substring(9, 18),      // 9–17
        F: state.substring(18, 27),     // 18–26
        D: state.substring(27, 36),     // 27–35
        L: state.substring(36, 45),     // 36–44
        B: state.substring(45, 54),     // 45–53
    };

    // 再構成：U, F, R, B, L, D の順に並べ替え
    const return_state = parts.U + parts.F + parts.R + parts.B + parts.L + parts.D;
    //  cube-State
    /*
    const cubeStates = {
        state: [],   
        rearrangeState:[],
        solution:[],
        solutionRVS:[]
    };
    */
    cubeStates.rearrangeState = return_state;
    cubeStates.state = state;
    console.log(`💾🎲 cubeStates update...`);
    return return_state;
}

function createHomeFacesByState(new_state) {
    //  Box初期化
    try{
        for (const element of faces) {
            if (element.box) {
                scene.remove(element.box);
                element.rotated = false;
                element.box = null;
            }
            //  console.log(`color: ${element.color}, box: ${element.box}, rotated: ${element.rotated}`);
        }
    } catch(e) {
        // face未生成の場合、skip
        console.log(e);
    }
    const new_faces = createHomeFaces();
    let faceindex = 0;

    const state = new_state;
    console.log("createHomeFacesByState:",state);

    for (const element of new_faces) {
        /*
        input : T-R-F-D-L-B
        const faces0 = [
            colorW, // 0 - 8(TOP)       00-09
            colorR, // 9 - 17(FRONT)    18-26
            colorB, // 18 - 26(RIGHT)   09-17
            colorO, // 27 - 35(BACK)    45-53
            colorG, // 36 - 44(LEFT)    36-44
            colorY, // 45 - 53(DOWN)    27-35
        ];
        */    
        const stickerChar = state[faceindex];
        element.color = colorMap[stickerChar]; 
        faceindex++;
    }
    return new_faces;
}

//  Face状態からCUBE状態を抽出
function getStateFromHomeFaces(face) {
    let new_state = "";

    for (const element of face) {
        const stickeChar = inverseColorMap[element.color];
        new_state += stickeChar;
        //console.log(`stickeChar:${stickeChar}`);
    }
    const state_for_cubejs = rearrangeStateForQUBEJS(new_state);
    console.log(`Current State:${new_state}`);
    console.log(`Current State(ForCubeJS):${state_for_cubejs}`);


    return new_state;
}

function createHomeFaces() {
    /*
        <Top>     colorW U
        <Front>   colorR R
        <Right>   colorB F
        <BACK>    colorO D
        <LEFT>    colorG L
        <DOWN>    colorY B
        const faces0 = [
            colorW, // 0 - 8(TOP)
            colorR, // 9 - 17(FRONT)
            colorB, // 18 - 26(RIGHT)
            colorO, // 27 - 35(BACK)
            colorG, // 36 - 44(LEFT)
            colorY, // 45 - 53(DOWN)
        ];
    */
    const new_faces = [];
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 9; j++) {
            new_faces.push({color: faces0[i], box: null, rotated: false});
        }
    }
    return new_faces;
}

function copyFaces(src_faces) {
    const dst = [];
    for (let i = 0; i < 54; i++) {
        const f = src_faces[i];
        dst.push({color: f.color});
    }
    return dst;
}

function resetCamera() {
    camera.position.set(cameraX, cameraY, cameraZ);
    camera.lookAt(scene.position);
}
function resetCameraBottom() {
    camera.position.set(cameraX, -cameraY, cameraZ);
    camera.lookAt(scene.position);
}
function resetCameraReverse() {
    camera.position.x = -camera.position.x;
    camera.position.y = -camera.position.y;
    camera.position.z = -camera.position.z;
    camera.lookAt(scene.position);
}

//  アニメーション表示
function animate() {
    //console.log("animate");

    // ここで自分自身を呼び出し、繰り返す
    requestAnimationFrame(animate);

    //  
    actRotation();
    controls.update();
    renderer.render(scene, camera);
}



// 
// スクランブル状態を取得し状態を表示（現時点ではビジュアル更新は省略）
//
async function loadStateFromServer() {
    /*
    const res = await fetch('/scramble');
    const { state, scramble } = await res.json();
    console.log(`scramble:state[${state}] scramble[${scramble}]`);
    */
    /*
    const res = await fetch('/scramble2');
    const { scramble } = await res.json();
    console.log(`scramble:${scramble}`);
    */
    const data = scramble2();
    const scramble = data.scramble;
    console.log(`scramble:${scramble}`);

    document.getElementById('status').textContent = 'スクランブル: ' + scramble;
    document.getElementById('move').textContent = '';
    document.getElementById('moves').textContent = '';
    // TODO: ステッカーを state に合わせて変更する処理


    resetCube(rearrangeStateForTHREE(scramble));

}

//
//  Cube.jsの初期化
//
async function initSolver() {
    let return_state;
    console.log("initSolver Start....");
    document.getElementById('moves').textContent = 'initSolver:初期化中....... ' ;

    try{
        /*
        const res = await fetch('/initSolver');
        const { status,state } = await res.json();
        console.log(`initSolver Fin : status[${status}] state[${state}]`);
        */
        const data = initCubeSolver();
        const status = data.status;
        const state = data.state;

        // TODO: ステッカーを state に合わせて変更する処理
        return_state=rearrangeStateForTHREE(state);
        resetCube(return_state);

        document.getElementById('moves').textContent = 'initSolver: ' + status;
        document.getElementById('move').textContent = '';
        document.getElementById('status').textContent = '初期値: ' + state;

        //  初期化
        /*
        const stepMoves = {
            movetype:"forward",
            moveQueue: [],
            moveIndex:0,
            moveAuto: true,
            isMoving: false
        };
        */
        stepMoves.isMoving =false;
        stepMoves.moveIndex =0;


    } catch (e){
        console.log(`error ${e}`);
        return_state=rearrangeStateForTHREE(CUBE_DEFAULT_FACE);
        resetCube(return_state);

        document.getElementById('moves').textContent = 'initSolver: Error';
        document.getElementById('move').textContent = '';
        document.getElementById('status').textContent = '初期値: ' + CUBE_DEFAULT_FACE;
    }
    return;
}

//
//  Cube.jsの再構築
//
async function resetSolver() {
    // TODO: ステッカーを state に合わせて変更する処理

}

//
//  Cube.js 解決方式取得
//
async function requestSolution() {
    const state_three = getStateFromHomeFaces(faces);
    const state = rearrangeStateForQUBEJS(state_three);

    //  答えを取得！
    /*
    const solveRes = await fetch('/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state })
    });
    const data = await solveRes.json();
    */
    const data = solve(state);

    actionQueue.length = 0;
    moveQueue = data.solution.trim().split(' ');
    currentMoveIndex = 0;
    isStepping = true;
    console.log(`moveQueue:${moveQueue}`);

    let cmdMove =  moveQueue.join(' ');
    console.log(`cmdMove:${cmdMove}`);

    document.getElementById('moves').textContent = '解法: ' + cmdMove;
    document.getElementById('move').textContent = '次の手を進めてください';

    //  逆再生
    const reversed = togglePrimeMarksAdvanced(cmdMove.split(" ").reverse().join(" "));

    console.log(`sollution:${cmdMove}`);
    console.log(`sollution reversed:${reversed}`);

    $("#movestepRVS").text(reversed);
    $("#movestep").text(cmdMove);
    //document.getElementById('movestep').value = cmdMove;

    $("#movestepRVS").data("cmd",reversed);
    $("#movestep").data("cmd",cmdMove);

}

//
// 解法ステップを実行
//
/*
async function moveCube(move) {
    const state_three = getStateFromHomeFaces(faces);
    const state = rearrangeStateForQUBEJS(state_three);
    console.log(`move:[${move}]${state}`);

    const solveRes = await fetch('/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state,move })
    });
    const data = await solveRes.json();

    //  更新
    //  await applyStateToCube(current_state);  // ← ステッカーに色を反映
    //  updateStickers(current_state);    
    document.getElementById('status2').textContent = '現在値: ' + data.new_state;
}
*/