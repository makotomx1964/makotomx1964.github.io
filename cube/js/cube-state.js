
//  cube-stats
const colors = ["white", "red", "blue", "orange", "green", "yellow"];
const colorCodes = {
    white: "U", yellow: "D", red: "F",
    orange: "B", green: "L", blue: "R"
};

//const faceOrder = ["U", "L", "F", "R", "B", "D"];
const faceOrder = ["U", "R", "F", "D", "L", "B"];
const faceMap = {
    U: 0,
    R: 9,
    F: 18,
    D: 27,
    L: 36,
    B: 45
};

const faceInit = {
    U: Array(9).fill("white"),
    R: Array(9).fill("blue"),
    F: Array(9).fill("red"),
    D: Array(9).fill("yellow"),
    L: Array(9).fill("green"),
    B: Array(9).fill("orange")
};

function showCubeState() {
    console.log('showCubeState');
    let state = "";
    faceOrder.forEach(face => {
    const stickers = document.getElementById(face).children;
    for (let s of stickers) {
        const color = colors[parseInt(s.dataset.colorIndex)];
        state += colorCodes[color];
    }
    });
    document.getElementById("output").textContent = `Cube state:\n${state}`;
    return state;
}

async function updateCubeState()
{
    const state = rearrangeStateForTHREE(showCubeState());
    await resetCube(state);

    //  解決方法Get
    await requestSolution();
}

//  面展開の初期化
async function resetCubeState()
{
    applyCubeState(CUBE_DEFAULT_FACE);
}

async function checkCube(state) {

    if (state.length !== 54) {
        console.log( "⚠️ 入力は54文字である必要があります。");
        return false;
    }

    try {
        /*
        const response = await fetch("/check", {
            method: "POST",
                headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ state })
        });
        const data = await response.json();
        */
        const data = check(state);

        if (data.valid) {
            console.log( `✅ 合法な状態です！ 解法:${data.solution}`);
            return true;
        } else {
            console.log(`❌ ${data.message}`);
            return false;
        }
    } catch (err) {
        console.log("❌ 通信エラー: " + err.message);
        return false;
    }
}


async function applyCubeStateTo3D()
{
/*
    if(!await checkCube(showCubeState())){
        alert("状態が正しくないです");
        return;
    }
*/
    const cubeState = showCubeState();
    const state = rearrangeStateForTHREE(showCubeState());
    await resetCube(state);
    console.log(`cubeState:${cubeState}`);
    console.log(`state_rag:${state}`);

    //  解決方法Get
    await requestSolution();

    // ページ切り替え
    $.mobile.changePage($("#one"));
}

function applyCubeState(state) {
    if (!state || state.length !== 54) {
        alert("不正な state です。54文字で指定してください。");
        return;
    }

    // colorCodes の逆引きマップ: U → white など
    const codeToColor = {};
        for (let color in colorCodes) {
            codeToColor[colorCodes[color]] = color;
    }

    faceOrder.forEach(face => {
        const baseIndex = faceMap[face];
        const container = document.getElementById(face);
        const stickers = container.children;

        for (let i = 0; i < 9; i++) {
            const code = state.charAt(baseIndex + i);
            const color = codeToColor[code];
            const idx = colors.indexOf(color);

            const sticker = stickers[i];
            sticker.dataset.colorIndex = idx;
            sticker.style.backgroundColor = color;
        }
    });
}    

//  For Qube_3d.js
async function loadCurrentState() {
    const new_state = getStateFromHomeFaces(faces);
    document.getElementById('status2').textContent = '現在値: ' + new_state;    
}


function createBox(color, axis) {
    const material1 = new THREE.MeshBasicMaterial({color: color,  opacity: 0.8, transparent: true});
    const material2 = new THREE.MeshBasicMaterial({color: colorE, opacity: 0.4, transparent: true});
    const materials = [material2, material2, material2, material2, material2, material2];
    let w, h, d;
    if (axis == "x") {
        materials[0] = material1;
        materials[1] = material1;
        w = faceDepth;
        h = cubeWidth - cubePadding;
        d = cubeWidth - cubePadding;
    } else if (axis == "y") {
        materials[2] = material1;
        materials[3] = material1;
        w = cubeWidth - cubePadding;
        h = faceDepth;
        d = cubeWidth - cubePadding;
    } else if (axis == "z") {
        materials[4] = material1;
        materials[5] = material1;
        w = cubeWidth - cubePadding;
        h = cubeWidth - cubePadding;
        d = faceDepth;
    }
    const geometry = new THREE.BoxGeometry(w, h, d);
    const box = new THREE.Mesh(geometry, materials);
    return box;
}

function replaceBox(face, faceDirection, faceSign, i, j, rot, cos, sin) {
    if (face.rotated) {
        scene.remove(face.box);
        face.rotated = false;
        face.box = null;
    }
    const oldBox = face.box;
    if (oldBox == null) {
        face.box = createBox(face.color, faceDirection);
    }
    const box = face.box;
    let x, y, z;
    if (faceDirection == "x") {
        x = faceSign * rubiksHalfWidth;
        y = (1 - i) * cubeWidth;
        z = faceSign * (1 - j) * cubeWidth;
    } else if (faceDirection == "y") {
        x = (j - 1) * cubeWidth;
        y = faceSign * rubiksHalfWidth;
        z = faceSign * (i - 1) * cubeWidth;
    } else if (faceDirection == "z") {
        x = faceSign * (j - 1) * cubeWidth;
        y = (1 - i) * cubeWidth;
        z = faceSign * rubiksHalfWidth;
    }
    let [rx, ry, rz] = [0, 0, 0];
    if (rotationAction.axis == "x") {
        let directionIdx;
        if (faceDirection == "x") {
            directionIdx = faceSign + 1;
        } else if (faceDirection == "y") {
            directionIdx = j;
        } else if (faceDirection == "z") {
            directionIdx = faceSign * (j - 1) + 1
        }
        const sign = rotationAction.direction[directionIdx];
        if (sign != 0) {
            const y2 = y * cos + z * sin * sign;
            const z2 = z * cos - y * sin * sign;
            y = y2;
            z = z2;
            rx = -sign * rot;
        }
    } else if (rotationAction.axis == "y") {
        let directionIdx;
        if (faceDirection == "x") {
            directionIdx = 2 - i;
        } else if (faceDirection == "y") {
            directionIdx = faceSign + 1;
        } else if (faceDirection == "z") {
            directionIdx = 2 - i;
        }
        const sign = rotationAction.direction[directionIdx];
        if (sign != 0) {
            const z2 = z * cos + x * sin * sign;
            const x2 = x * cos - z * sin * sign;
            z = z2;
            x = x2;
            ry = -sign * rot;
        }
    } else if (rotationAction.axis == "z") {
        let directionIdx;
        if (faceDirection == "x") {
            directionIdx = faceSign * (1 - j) + 1
        } else if (faceDirection == "y") {
            directionIdx = faceSign * (i - 1) + 1
        } else if (faceDirection == "z") {
            directionIdx = faceSign + 1;
        }
        const sign = rotationAction.direction[directionIdx];
        if (sign != 0) {
            const x2 = x * cos + y * sin * sign;
            const y2 = y * cos - x * sin * sign;
            x = x2;
            y = y2;
            rz = -sign * rot;
        }
    }
    box.position.x = x;
    box.position.y = y;
    box.position.z = z;
    box.rotation.x = rx;
    box.rotation.y = ry;
    box.rotation.z = rz;
    if (oldBox == null) {
        scene.add(box);
    }
}


function replaceBoxes(rot, cos, sin) {
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const idx = 3 * i + j;
            replaceBox(faces[idx], "y", +1, i, j, rot, cos, sin);
        }
    }
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const idx = 9 + 3 * i + j;
            replaceBox(faces[idx], "z", +1, i, j, rot, cos, sin);
        }
    }
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const idx = 18 + 3 * i + j;
            replaceBox(faces[idx], "x", +1, i, j, rot, cos, sin);
        }
    }
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const idx = 27 + 3 * i + j;
            replaceBox(faces[idx], "z", -1, i, j, rot, cos, sin);
        }
    }
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const idx = 36 + 3 * i + j;
            replaceBox(faces[idx], "x", -1, i, j, rot, cos, sin);
        }
    }
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const idx = 45 + 3 * i + j;
            replaceBox(faces[idx], "y", -1, i, j, rot, cos, sin);
        }
    }
}
let playAnimation;

async function actRotation() {
    const [flag, rot, cos, sin] = calcRotationAngle();
    if (flag) {
        //  アニメーションが終わった
        rotateFaces(rotationAction, faces);
        if (actionQueue.length == 0) {
            //  キュー処理完了
            rotationAction = intervalAction(1);
            rotationActionStartTime = 0;
            if(playAnimation){
                console.log("actionQueue finished...");
            }
            playAnimation = false;

            //  Play Step?
            if(stepMoves.isMoving && stepMoves.moveAuto === true)
                await playMovesSingleNext();


        } else if (rotationAction.axis == "") {
            rotationAction = actionQueue.shift();
            rotationActionStartTime = new Date().getTime();
        } else {
            const speed = Math.min(rotationAction.speed, actionQueue[0].speed);
            rotationAction = intervalAction(speed);
            rotationActionStartTime = new Date().getTime();
        }
        replaceBoxes(rot, cos, sin);
    } else if (rotationAction.axis != "") {
        playAnimation = true;
        replaceBoxes(rot, cos, sin);
    }
}

function calcRotationAngle() {
    const now = new Date().getTime();
    let a = 0.001;

    if (actionQueue.length >= 53) {
        a = 0.013;
    } else if (actionQueue.length >= 17) {
        a = 0.008;
    } else if (actionQueue.length >= 5) {
        a = 0.005;
    } else if (actionQueue.length >= 1) {
        a = 0.003;
    } else {
        a = 0.002;
    }


    let d = (now - rotationActionStartTime) * rotationAction.speed * a;
    if (d >= 1.0) {
        return [true, 0.0, 1.0, 0.0];
    } else {
        d = d * 0.5 * Math.PI;
        return [false, d, Math.cos(d), Math.sin(d)];
    }
}

function intervalAction(speed) {
    return {axis: "", direction: [0, 0, 0], speed: speed};
}




function pushActionToQueue(action) {
    let flag = false;
    //console.log(`action:${action.axis}-(${action.direction[0]},${action.direction[1]},${action.direction[2]})-speed:${action.speed}`);

    if (actionQueue.length > 0) {
        const lastAction = actionQueue[actionQueue.length - 1];
        if (lastAction.axis == action.axis) {
            const direction = [
                lastAction.direction[0] + action.direction[0],
                lastAction.direction[1] + action.direction[1],
                lastAction.direction[2] + action.direction[2],
            ];
            const max = Math.max(...direction);
            const min = Math.min(...direction);
            if (max == 0 && min == 0) {
                actionQueue.pop();
                flag = true;
            } else if (max <= +1 && min >= -1) {
                lastAction.direction = direction;
                flag = true;
            }
        }
    }
    if (flag) {
        rotateFaces(action, faces2);
        return;
    }
    if (actionQueue.length > 200) {
        console.log("ERROR");
        return;
    }
    //console.log(`action:${JSON.stringify(action)}`);
    actionQueue.push(action);
    rotateFaces(action, faces2);
}

function setActionBtnClickEvent(id, key, actions) {
    console.log(`id:${id} key:${id} actions:${actions}`);
    
    const handler = function(event) {
        let acts;

        if (typeof(actions) == "function") {
            acts = actions();
        } else {
            acts = actions;
        }
        if (acts != null) {
            for (const act of acts) {
                console.log(`id[${id}]-key[${key}][${act}]`);
                pushActionToQueue(act);
            }
            activateBtns();
        }
        if (event) {
            console.log(event);
            event.preventDefault();
        }
        return false;
    };

    document.getElementById(id).addEventListener("click", handler);
    btnActions[id] = actions;
    console.log(`id[${id}]-key[${key}][${btnActions[id]}]`);
    if (key != "") {
        keyEventHandlers[key] = handler;
    }
}

function activateBtns() {
    for (const id in btnActions) {
        const actions = btnActions[id];
        if (typeof(actions) == "function") {
            acts = actions();
            if (acts == null || acts.length == 0) {
                document.getElementById(id).classList.add("btn-inactive");
            } else {
                document.getElementById(id).classList.remove("btn-inactive");
            }
        }
    }
}

function isSolved(actions) {
    if (actions == null) {
        return false;
    } else if (actions.length > 0) {
        return false;
    } else {
        return true;
    }
}

//--------------------------------------------------------------------------------

function rotateFaces(rotationAction, faces) {
    function rotate1(i1, i2, i3, i4) {
        const tmp = faces[i1];
        faces[i1] = faces[i4];
        faces[i4] = faces[i3];
        faces[i3] = faces[i2];
        faces[i2] = tmp;
        faces[i1].rotated = true;
        faces[i2].rotated = true;
        faces[i3].rotated = true;
        faces[i4].rotated = true;
    }
    function rotate2(idx) {
        rotate1(idx    , idx + 2, idx + 8, idx + 6);
        rotate1(idx + 1, idx + 5, idx + 7, idx + 3);
    }
    function rotateFacesX(directionIdx) {
        rotate1(     directionIdx, 35 - directionIdx, 45 + directionIdx,  9 + directionIdx);
        rotate1( 3 + directionIdx, 32 - directionIdx, 48 + directionIdx, 12 + directionIdx);
        rotate1( 6 + directionIdx, 29 - directionIdx, 51 + directionIdx, 15 + directionIdx);
        if (directionIdx == 0) {
            rotate2(36);
            rotate2(36);
            rotate2(36);
        } else if (directionIdx == 2) {
            rotate2(18);
        }
    }
    function rotateFacesY(directionIdx) {
        rotate1(15 - 3 * directionIdx, 42 - 3 * directionIdx, 33 - 3 * directionIdx, 24 - 3 * directionIdx);
        rotate1(16 - 3 * directionIdx, 43 - 3 * directionIdx, 34 - 3 * directionIdx, 25 - 3 * directionIdx);
        rotate1(17 - 3 * directionIdx, 44 - 3 * directionIdx, 35 - 3 * directionIdx, 26 - 3 * directionIdx);
        if (directionIdx == 0) {
            rotate2(45);
            rotate2(45);
            rotate2(45);
        } else if (directionIdx == 2) {
            rotate2(0);
        }
    }
    function rotateFacesZ(directionIdx) {
        rotate1(     3 * directionIdx, 20 - directionIdx, 53 - 3 * directionIdx, 42 + directionIdx);
        rotate1( 1 + 3 * directionIdx, 23 - directionIdx, 52 - 3 * directionIdx, 39 + directionIdx);
        rotate1( 2 + 3 * directionIdx, 26 - directionIdx, 51 - 3 * directionIdx, 36 + directionIdx);
        if (directionIdx == 0) {
            rotate2(27);
            rotate2(27);
            rotate2(27);
        } else if (directionIdx == 2) {
            rotate2(9);
        }
    }
    let r = null;
    if (rotationAction.axis == "x") {
        r = rotateFacesX;
    } else if (rotationAction.axis == "y") {
        r = rotateFacesY;
    } else if (rotationAction.axis == "z") {
        r = rotateFacesZ;
    }
    if (r) {
        for (let i = 0; i < 3; i++) {
            if (rotationAction.direction[i] == +1) {
                r(i);
            } else if (rotationAction.direction[i] == -1) {
                r(i);
                r(i);
                r(i);
            }
        }
    }
}


function normalizeActions(actions) {
    let result = [...actions];
    let i = 0;
    function dirMul(direction, sign) {
        if (sign > 0) {
            return direction;
        } else {
            return [-direction[2], -direction[1], -direction[0]];
        }
    }
    while (i < result.length) {
        const acti = result[i];
        if (acti.direction[0] != 0 && acti.direction[0] == acti.direction[1] && acti.direction[0] == acti.direction[2]) {
            let j = i + 1;
            const sign = acti.direction[0];
            const axis = acti.axis;
            while (j < result.length) {
                const actj = result[j];
                if (actj.axis == axis) {
                    result[j - 1] = {axis: actj.axis, direction: actj.direction, speed: actj.speed};
                } else if (axis == "x") {
                    if (actj.axis == "y") {
                        result[j - 1] = {axis: "z", direction: dirMul(actj.direction, +sign), speed: actj.speed};
                    } else if (actj.axis == "z") {
                        result[j - 1] = {axis: "y", direction: dirMul(actj.direction, -sign), speed: actj.speed};
                    }
                } else if (axis == "y") {
                    if (actj.axis == "z") {
                        result[j - 1] = {axis: "x", direction: dirMul(actj.direction, +sign), speed: actj.speed};
                    } else if (actj.axis == "x") {
                        result[j - 1] = {axis: "z", direction: dirMul(actj.direction, -sign), speed: actj.speed};
                    }
                } else if (axis == "z") {
                    if (actj.axis == "x") {
                        result[j - 1] = {axis: "y", direction: dirMul(actj.direction, +sign), speed: actj.speed};
                    } else if (actj.axis == "y") {
                        result[j - 1] = {axis: "x", direction: dirMul(actj.direction, -sign), speed: actj.speed};
                    }
                }
                j++;
            }
            result.pop();
            continue;
        }
        i++;
    }
    return result;
}



    //  シャッフルアクションの作成
    function shuffleActions() {
        const actions = [];
        const speed = 3;
        for (let i = 0; i < 20; i++) {
            let axis = Math.floor(Math.random() * 3);
            if (axis == 0) {
                axis = "x";
            } else if (axis == 1) {
                axis = "y";
            } else {
                axis = "z";
            }
            const direction = [
                Math.floor(Math.random() * 3 - 1),
                Math.floor(Math.random() * 3 - 1),
                Math.floor(Math.random() * 3 - 1),
            ];
            actions.push({axis, direction, speed});
        }
        return actions;
    }

    function yellowToTopActions() {
        let futureFaces = copyFaces(faces2);
        const actions = [];
        const speed = 1;
        function pushAction(axis, direction) {
            const action = {axis, direction, speed};
            actions.push(action);
            rotateFaces(action, futureFaces);
        }
        for (let i = 0; i < 10; i++) {
            if (futureFaces[13].color == colorY) {
                pushAction("x", [+1, +1, +1]);
                continue;
            }
            if (futureFaces[22].color == colorY) {
                pushAction("z", [-1, -1, -1]);
                continue;
            }
            if (futureFaces[31].color == colorY) {
                pushAction("x", [-1, -1, -1]);
                continue;
            }
            if (futureFaces[40].color == colorY) {
                pushAction("z", [+1, +1, +1]);
                continue;
            }
            if (futureFaces[49].color == colorY) {
                pushAction("x", [+1, +1, +1]);
                continue;
            }

            if (futureFaces[13].color == colorB) {
                break;
            }
            if (futureFaces[22].color == colorB) {
                pushAction("y", [+1, +1, +1]);
                continue;
            }
            if (futureFaces[31].color == colorB) {
                pushAction("y", [+1, +1, +1]);
                continue;
            }
            if (futureFaces[40].color == colorB) {
                pushAction("y", [-1, -1, -1]);
                continue;
            }

            return null;
        }
        return actions;
    }

    function whiteEdgeActions(edgeColor) {
        let futureFaces = copyFaces(faces2);
        const actions = [];
        const speed = 1;
        function pushAction(axis, direction) {
            const action = {axis, direction, speed};
            actions.push(action);
            rotateFaces(action, futureFaces);
        }
        if (!isSolved(yellowToTopActions())) {
            return null;
        }
        if (edgeColor == colorR) {
            pushAction("y", [+1, +1, +1]);
        }
        if (edgeColor == colorG) {
            pushAction("y", [+1, +1, +1]);
            pushAction("y", [+1, +1, +1]);
        }
        if (edgeColor == colorO) {
            pushAction("y", [-1, -1, -1]);
        }
        for (let i = 0; i < 10; i++) {
            // 上層に白が上向き
            // 前
            if (futureFaces[7].color == colorW && futureFaces[10].color == edgeColor) {
                pushAction("z", [ 0,  0, +1]);
                continue;
            }
            // 右
            if (futureFaces[5].color == colorW && futureFaces[19].color == edgeColor) {
                pushAction("y", [ 0,  0, +1]);
                continue;
            }
            // 后
            if (futureFaces[1].color == colorW && futureFaces[28].color == edgeColor) {
                pushAction("y", [ 0,  0, +1]);
                continue;
            }
            // 左
            if (futureFaces[3].color == colorW && futureFaces[37].color == edgeColor) {
                pushAction("y", [ 0,  0, -1]);
                continue;
            }

            // 上層に白が側面
            // 前
            if (futureFaces[10].color == colorW && futureFaces[7].color == edgeColor) {
                pushAction("z", [ 0,  0, +1]);
                continue;
            }
            // 右
            if (futureFaces[19].color == colorW && futureFaces[5].color == edgeColor) {
                pushAction("y", [ 0,  0, +1]);
                continue;
            }
            // 后
            if (futureFaces[28].color == colorW && futureFaces[1].color == edgeColor) {
                pushAction("y", [ 0,  0, +1]);
                pushAction("y", [ 0,  0, +1]);
                continue;
            }
            // 左
            if (futureFaces[37].color == colorW && futureFaces[3].color == edgeColor) {
                pushAction("y", [ 0,  0, -1]);
                continue;
            }

            // 中間層
            // 白が右で、対象が前
            if (futureFaces[21].color == colorW && futureFaces[14].color == edgeColor) {
                pushAction("z", [ 0,  0, +1]);
                continue;
            }
            // 白が后で、対象が右
            if (futureFaces[30].color == colorW && futureFaces[23].color == edgeColor) {
                pushAction("y", [-1,  0,  0]);
                pushAction("x", [ 0,  0, +1]);
                pushAction("y", [+1,  0,  0]);
                continue;
            }
            // 白が左で、対象が后
            if (futureFaces[39].color == colorW && futureFaces[32].color == edgeColor) {
                pushAction("y", [-1,  0,  0]);
                pushAction("y", [-1,  0,  0]);
                pushAction("z", [-1,  0,  0]);
                pushAction("y", [+1,  0,  0]);
                pushAction("y", [+1,  0,  0]);
                continue;
            }
            // 白が前で、対象が左
            if (futureFaces[12].color == colorW && futureFaces[41].color == edgeColor) {
                pushAction("y", [+1,  0,  0]);
                pushAction("x", [-1,  0,  0]);
                pushAction("y", [-1,  0,  0]);
                continue;
            }
            // 白が前で、対象が右
            if (futureFaces[14].color == colorW && futureFaces[21].color == edgeColor) {
                pushAction("y", [-1,  0,  0]);
                pushAction("x", [ 0,  0, -1]);
                pushAction("y", [+1,  0,  0]);
                continue;
            }
            // 白が右で、対象が后
            if (futureFaces[23].color == colorW && futureFaces[30].color == edgeColor) {
                pushAction("y", [-1,  0,  0]);
                pushAction("y", [-1,  0,  0]);
                pushAction("z", [+1,  0,  0]);
                pushAction("y", [+1,  0,  0]);
                pushAction("y", [+1,  0,  0]);
                continue;
            }
            // 白が后で、対象が左
            if (futureFaces[32].color == colorW && futureFaces[39].color == edgeColor) {
                pushAction("y", [+1,  0,  0]);
                pushAction("x", [+1,  0,  0]);
                pushAction("y", [-1,  0,  0]);
                continue;
            }
            // 白が左で、対象が前
            if (futureFaces[41].color == colorW && futureFaces[12].color == edgeColor) {
                pushAction("z", [ 0,  0, -1]);
                continue;
            }

            // 下層に白が下向き
            // 前
            if (futureFaces[46].color == colorW && futureFaces[16].color == edgeColor) {
                break;
            }
            // 右
            if (futureFaces[50].color == colorW && futureFaces[25].color == edgeColor) {
                pushAction("x", [ 0,  0, -1]);
                continue;
            }
            // 后
            if (futureFaces[52].color == colorW && futureFaces[34].color == edgeColor) {
                pushAction("z", [+1,  0,  0]);
                continue;
            }
            // 左
            if (futureFaces[48].color == colorW && futureFaces[43].color == edgeColor) {
                pushAction("x", [+1,  0,  0]);
                continue;
            }

            // 下層に白が側面
            // 前
            if (futureFaces[16].color == colorW && futureFaces[46].color == edgeColor) {
                pushAction("z", [ 0,  0, -1]);
                continue;
            }
            // 右
            if (futureFaces[25].color == colorW && futureFaces[50].color == edgeColor) {
                pushAction("x", [ 0,  0, -1]);
                continue;
            }
            // 后
            if (futureFaces[34].color == colorW && futureFaces[52].color == edgeColor) {
                pushAction("z", [+1,  0,  0]);
                continue;
            }
            // 左
            if (futureFaces[43].color == colorW && futureFaces[48].color == edgeColor) {
                pushAction("x", [+1,  0,  0]);
                continue;
            }

            return null;
        }
        return normalizeActions(actions);
    }

    function whiteCornerActions(edgeColor1, edgeColor2) {
        let futureFaces = copyFaces(faces2);
        const actions = [];
        const speed = 1;
        function pushAction(axis, direction) {
            const action = {axis, direction, speed};
            actions.push(action);
            rotateFaces(action, futureFaces);
        }
        if (!isSolved(whiteEdgeActions(edgeColor1))) {
            return null;
        }
        if (!isSolved(whiteEdgeActions(edgeColor2))) {
            return null;
        }
        if (edgeColor1 == colorR) {
            pushAction("y", [+1, +1, +1]);
        }
        if (edgeColor1 == colorG) {
            pushAction("y", [+1, +1, +1]);
            pushAction("y", [+1, +1, +1]);
        }
        if (edgeColor1 == colorO) {
            pushAction("y", [-1, -1, -1]);
        }
        for (let i = 0; i < 10; i++) {
            // 上層
            if (futureFaces[11].color == colorW && futureFaces[8].color == edgeColor1 && futureFaces[18].color == edgeColor2) {
                pushAction("y", [ 0,  0, +1]);
                continue;
            }
            if (futureFaces[20].color == colorW && futureFaces[2].color == edgeColor1 && futureFaces[27].color == edgeColor2) {
                pushAction("y", [ 0,  0, +1]);
                continue;
            }
            if (futureFaces[29].color == colorW && futureFaces[0].color == edgeColor1 && futureFaces[36].color == edgeColor2) {
                pushAction("y", [ 0,  0, -1]);
                continue;
            }
            if (futureFaces[38].color == colorW && futureFaces[6].color == edgeColor1 && futureFaces[9].color == edgeColor2) {
                pushAction("x", [ 0,  0, +1]);
                pushAction("y", [ 0,  0, -1]);
                pushAction("x", [ 0,  0, -1]);
                continue;
            }
            if (futureFaces[18].color == colorW && futureFaces[11].color == edgeColor1 && futureFaces[8].color == edgeColor2) {
                pushAction("y", [ 0,  0, -1]);
                continue;
            }
            if (futureFaces[27].color == colorW && futureFaces[20].color == edgeColor1 && futureFaces[2].color == edgeColor2) {
                pushAction("z", [ 0,  0, -1]);
                pushAction("y", [ 0,  0, +1]);
                pushAction("z", [ 0,  0, +1]);
                continue;
            }
            if (futureFaces[36].color == colorW && futureFaces[29].color == edgeColor1 && futureFaces[0].color == edgeColor2) {
                pushAction("y", [ 0,  0, +1]);
                continue;
            }
            if (futureFaces[9].color == colorW && futureFaces[38].color == edgeColor1 && futureFaces[6].color == edgeColor2) {
                pushAction("y", [ 0,  0, -1]);
                continue;
            }
            if (futureFaces[8].color == colorW && futureFaces[18].color == edgeColor1 && futureFaces[11].color == edgeColor2) {
                pushAction("x", [ 0,  0, +1]);
                pushAction("y", [ 0,  0, -1]);
                pushAction("x", [ 0,  0, -1]);
                continue;
            }
            if (futureFaces[2].color == colorW && futureFaces[27].color == edgeColor1 && futureFaces[20].color == edgeColor2) {
                pushAction("y", [ 0,  0, +1]);
                continue;
            }
            if (futureFaces[0].color == colorW && futureFaces[36].color == edgeColor1 && futureFaces[29].color == edgeColor2) {
                pushAction("y", [ 0,  0, +1]);
                continue;
            }
            if (futureFaces[6].color == colorW && futureFaces[9].color == edgeColor1 && futureFaces[38].color == edgeColor2) {
                pushAction("y", [ 0,  0, -1]);
                continue;
            }

            // 下層
            if (futureFaces[47].color == colorW && futureFaces[17].color == edgeColor1 && futureFaces[24].color == edgeColor2) {
                break;
            }
            if (futureFaces[17].color == colorW && futureFaces[24].color == edgeColor1 && futureFaces[47].color == edgeColor2) {
                pushAction("z", [ 0,  0, -1]);
                pushAction("y", [ 0,  0, -1]);
                pushAction("z", [ 0,  0, +1]);
                continue;
            }
            if (futureFaces[24].color == colorW && futureFaces[47].color == edgeColor1 && futureFaces[17].color == edgeColor2) {
                pushAction("x", [ 0,  0, +1]);
                pushAction("y", [ 0,  0, -1]);
                pushAction("x", [ 0,  0, -1]);
                continue;
            }
            // いったん脱出のみ
            if (futureFaces[47].color == colorW || futureFaces[17].color == colorW || futureFaces[24].color == colorW) {
                pushAction("x", [ 0,  0, +1]);
                pushAction("y", [ 0,  0, -1]);
                pushAction("x", [ 0,  0, -1]);
                break;
            }

            return null;
        }
        return normalizeActions(actions);
    }




    function middleEdgeActions(edgeColor1, edgeColor2) {
        let futureFaces = copyFaces(faces2);
        const actions = [];
        const speed = 1;
        function pushAction(axis, direction) {
            const action = {axis, direction, speed};
            actions.push(action);
            rotateFaces(action, futureFaces);
        }
        if (!isSolved(whiteCornerActions(edgeColor1, edgeColor2))) {
            return null;
        }
        if (edgeColor1 == colorR) {
            pushAction("y", [+1, +1, +1]);
        }
        if (edgeColor1 == colorG) {
            pushAction("y", [+1, +1, +1]);
            pushAction("y", [+1, +1, +1]);
        }
        if (edgeColor1 == colorO) {
            pushAction("y", [-1, -1, -1]);
        }
        for (let i = 0; i < 10; i++) {
            // 上層
            if (futureFaces[10].color == edgeColor1 && futureFaces[7].color == edgeColor2) {
                pushAction("y", [ 0,  0, +1]);
                continue;
            }
            if (futureFaces[19].color == edgeColor1 && futureFaces[5].color == edgeColor2) {
                pushAction("y", [ 0,  0, +1]);
                continue;
            }
            if (futureFaces[28].color == edgeColor1 && futureFaces[1].color == edgeColor2) {
                pushAction("y", [ 0,  0, -1]);
                continue;
            }
            if (futureFaces[37].color == edgeColor1 && futureFaces[3].color == edgeColor2) {
                pushAction("x", [ 0,  0, +1]);
                pushAction("y", [ 0,  0, -1]);
                pushAction("x", [ 0,  0, -1]);
                pushAction("y", [ 0,  0, -1]);
                pushAction("z", [ 0,  0, -1]);
                pushAction("y", [ 0,  0, +1]);
                pushAction("z", [ 0,  0, +1]);
                continue;
            }

            if (futureFaces[7].color == edgeColor1 && futureFaces[10].color == edgeColor2) {
                pushAction("y", [ 0,  0, -1]);
                continue;
            }
            if (futureFaces[5].color == edgeColor1 && futureFaces[19].color == edgeColor2) {
                pushAction("y", [ 0,  0, -1]);
                continue;
            }
            if (futureFaces[1].color == edgeColor1 && futureFaces[28].color == edgeColor2) {
                pushAction("z", [ 0,  0, -1]);
                pushAction("y", [ 0,  0, +1]);
                pushAction("z", [ 0,  0, +1]);
                pushAction("y", [ 0,  0, +1]);
                pushAction("x", [ 0,  0, +1]);
                pushAction("y", [ 0,  0, -1]);
                pushAction("x", [ 0,  0, -1]);
                continue;
            }
            if (futureFaces[3].color == edgeColor1 && futureFaces[37].color == edgeColor2) {
                pushAction("y", [ 0,  0, +1]);
                continue;
            }

            // 中間層
            if (futureFaces[14].color == edgeColor1 && futureFaces[21].color == edgeColor2) {
                break;
            }
            // いったん脱出のみ
            if (futureFaces[21].color != colorW && futureFaces[21].color != colorY && futureFaces[14].color != colorW && futureFaces[14].color != colorY) {
                pushAction("x", [ 0,  0, +1]);
                pushAction("y", [ 0,  0, -1]);
                pushAction("x", [ 0,  0, -1]);
                pushAction("y", [ 0,  0, -1]);
                pushAction("z", [ 0,  0, -1]);
                pushAction("y", [ 0,  0, +1]);
                pushAction("z", [ 0,  0, +1]);
                break;
            }

            return null;
        }
        return normalizeActions(actions);
    }

    function yellowEdgeRotActions() {
        let futureFaces = copyFaces(faces2);
        const actions = [];
        const speed = 1;
        function pushAction(axis, direction) {
            const action = {axis, direction, speed};
            actions.push(action);
            rotateFaces(action, futureFaces);
        }
        if (!isSolved(middleEdgeActions(colorB, colorR))) {
            return null;
        }
        if (!isSolved(middleEdgeActions(colorR, colorG))) {
            return null;
        }
        if (!isSolved(middleEdgeActions(colorG, colorO))) {
            return null;
        }
        if (!isSolved(middleEdgeActions(colorO, colorB))) {
            return null;
        }
        for (let i = 0; i < 10; i++) {
            if (futureFaces[1].color == colorY &&
                futureFaces[3].color == colorY &&
                futureFaces[5].color == colorY &&
                futureFaces[7].color == colorY) {
                break;
            }
            if (futureFaces[3].color == colorY && futureFaces[5].color == colorY) {
                pushAction("z", [ 0,  0, +1]);
                pushAction("x", [ 0,  0, +1]);
                pushAction("y", [ 0,  0, +1]);
                pushAction("x", [ 0,  0, -1]);
                pushAction("y", [ 0,  0, -1]);
                pushAction("z", [ 0,  0, -1]);
                continue;
            }
            if (futureFaces[1].color == colorY && futureFaces[7].color == colorY) {
                pushAction("y", [+1, +1, +1]);
                continue;
            }

            if (futureFaces[1].color == colorY && futureFaces[3].color == colorY) {
                pushAction("z", [ 0,  0, +1]);
                pushAction("x", [ 0,  0, +1]);
                pushAction("y", [ 0,  0, +1]);
                pushAction("x", [ 0,  0, -1]);
                pushAction("y", [ 0,  0, -1]);
                pushAction("x", [ 0,  0, +1]);
                pushAction("y", [ 0,  0, +1]);
                pushAction("x", [ 0,  0, -1]);
                pushAction("y", [ 0,  0, -1]);
                pushAction("z", [ 0,  0, -1]);
                continue;
            }
            if (futureFaces[3].color == colorY && futureFaces[7].color == colorY) {
                pushAction("y", [+1, +1, +1]);
                continue;
            }
            if (futureFaces[5].color == colorY && futureFaces[7].color == colorY) {
                pushAction("y", [+1, +1, +1]);
                continue;
            }
            if (futureFaces[1].color == colorY && futureFaces[5].color == colorY) {
                pushAction("y", [-1, -1, -1]);
                continue;
            }
            if (true) {
                pushAction("z", [ 0,  0, +1]);
                pushAction("x", [ 0,  0, +1]);
                pushAction("y", [ 0,  0, +1]);
                pushAction("x", [ 0,  0, -1]);
                pushAction("y", [ 0,  0, -1]);
                pushAction("z", [ 0,  0, -1]);
                continue;
            }

            return null;
        }
        return normalizeActions(actions);
    }

    function yellowCornerRotActions() {
        let futureFaces = copyFaces(faces2);
        const actions = [];
        const speed = 1;
        function pushAction(axis, direction) {
            const action = {axis, direction, speed};
            actions.push(action);
            rotateFaces(action, futureFaces);
        }
        if (!isSolved(yellowEdgeRotActions())) {
            return null;
        }
        function pushActionSet() {
            pushAction("x", [ 0,  0, +1]);
            pushAction("y", [ 0,  0, +1]);
            pushAction("x", [ 0,  0, -1]);
            pushAction("y", [ 0,  0, +1]);
            pushAction("x", [ 0,  0, +1]);
            pushAction("y", [ 0,  0, +1]);
            pushAction("y", [ 0,  0, +1]);
            pushAction("x", [ 0,  0, -1]);
        }
        for (let i = 0; i < 10; i++) {
            if (futureFaces[0].color == colorY &&
                futureFaces[2].color == colorY &&
                futureFaces[6].color == colorY &&
                futureFaces[8].color == colorY) {
                break;
            }

            if (futureFaces[0].color == colorY && futureFaces[2].color == colorY) {
                if (futureFaces[18].color == colorY) {
                    pushActionSet();
                } else {
                    pushAction("y", [+1, +1, +1]);
                    pushActionSet();
                }
                continue;
            }
            if (futureFaces[0].color == colorY && futureFaces[6].color == colorY) {
                pushAction("y", [+1, +1, +1]);
                continue;
            }
            if (futureFaces[6].color == colorY && futureFaces[8].color == colorY) {
                pushAction("y", [+1, +1, +1]);
                continue;
            }
            if (futureFaces[8].color == colorY && futureFaces[2].color == colorY) {
                pushAction("y", [+1, +1, +1]);
                continue;
            }

            if (futureFaces[0].color == colorY && futureFaces[8].color == colorY) {
                if (futureFaces[27].color == colorY) {
                    pushActionSet();
                } else {
                    pushAction("y", [+1, +1, +1]);
                    pushAction("y", [+1, +1, +1]);
                    pushActionSet();
                }
                continue;
            }
            if (futureFaces[2].color == colorY && futureFaces[6].color == colorY) {
                pushAction("y", [+1, +1, +1]);
                continue;
            }

            if (futureFaces[0].color == colorY) {
                pushAction("y", [-1, -1, -1]);
                pushActionSet();
                continue;
            }

            if (futureFaces[9].color != colorY || futureFaces[11].color != colorY) {
                pushAction("y", [+1, +1, +1]);
                continue;
            }

            if (futureFaces[27].color == colorY) {
                pushAction("y", [-1, -1, -1]);
                pushActionSet();
                continue;
            }

            if (true) {
                pushAction("y", [+1, +1, +1]);
                pushActionSet();
                continue;
            }

            return null;
        }
        return normalizeActions(actions);
    }

    function yellowCornerPosActions() {
        let futureFaces = copyFaces(faces2);
        const actions = [];
        const speed = 1;
        function pushAction(axis, direction) {
            const action = {axis, direction, speed};
            actions.push(action);
            rotateFaces(action, futureFaces);
        }
        if (!isSolved(yellowCornerRotActions())) {
            return null;
        }
        function pushActionSet() {
            pushAction("x", [ 0,  0, -1]);
            pushAction("y", [ 0,  0, +1]);
            pushAction("x", [+1,  0,  0]);
            pushAction("y", [ 0,  0, +1]);
            pushAction("y", [ 0,  0, +1]);
            pushAction("x", [ 0,  0, +1]);
            pushAction("y", [ 0,  0, -1]);
            pushAction("x", [ 0,  0, -1]);
            pushAction("y", [ 0,  0, +1]);
            pushAction("y", [ 0,  0, +1]);
            pushAction("x", [-1,  0, +1]);
        }
        for (let i = 0; i < 10; i++) {
            if (futureFaces[9].color == futureFaces[11].color &&
                futureFaces[18].color == futureFaces[20].color &&
                futureFaces[27].color == futureFaces[29].color &&
                futureFaces[36].color == futureFaces[38].color) {
                if (futureFaces[13].color != colorB) {
                    pushAction("y", [+1, +1, +1]);
                    continue;
                }
                if (futureFaces[9].color == colorB && futureFaces[18].color == colorR) {
                    break;
                }
                if (futureFaces[9].color == colorR && futureFaces[18].color == colorG) {
                    pushAction("y", [ 0,  0, -1]);
                    continue;
                }
                if (futureFaces[9].color == colorG && futureFaces[18].color == colorO) {
                    pushAction("y", [ 0,  0, +1]);
                    pushAction("y", [ 0,  0, +1]);
                    continue;
                }
                if (futureFaces[9].color == colorO && futureFaces[18].color == colorB) {
                    pushAction("y", [ 0,  0, +1]);
                    continue;
                }
            }

            if (futureFaces[9].color == futureFaces[11].color && futureFaces[18].color == futureFaces[20].color) {
                pushActionSet();
                continue;
            }
            if (futureFaces[18].color == futureFaces[20].color && futureFaces[27].color == futureFaces[29].color) {
                pushAction("y", [+1, +1, +1]);
                continue;
            }
            if (futureFaces[27].color == futureFaces[29].color && futureFaces[36].color == futureFaces[38].color) {
                pushAction("y", [+1, +1, +1]);
                continue;
            }
            if (futureFaces[36].color == futureFaces[38].color && futureFaces[9].color == futureFaces[11].color) {
                pushAction("y", [-1, -1, -1]);
                continue;
            }

            if (futureFaces[9].color == futureFaces[11].color) {
                pushActionSet();
                continue;
            }
            if (futureFaces[18].color == futureFaces[20].color) {
                pushAction("y", [+1, +1, +1]);
                continue;
            }
            if (futureFaces[27].color == futureFaces[29].color) {
                pushAction("y", [+1, +1, +1]);
                continue;
            }
            if (futureFaces[36].color == futureFaces[38].color) {
                pushAction("y", [-1, -1, -1]);
                continue;
            }

            if (true) {
                pushActionSet();
                continue;
            }

            return null;
        }
        return normalizeActions(actions);
    }

    function yellowEdgePosActions() {
        let futureFaces = copyFaces(faces2);
        const actions = [];
        const speed = 1;

        function pushAction(axis, direction) {
            const action = {axis, direction, speed};
            actions.push(action);
            rotateFaces(action, futureFaces);
        }

        if (!isSolved(yellowCornerPosActions())) {
            return null;
        }

        function pushActionSet() {
            pushAction("x", [ 0, -1,  0]);
            pushAction("x", [ 0, -1,  0]);
            pushAction("y", [ 0,  0, +1]);
            pushAction("x", [ 0, -1,  0]);
            pushAction("y", [ 0,  0, +1]);
            pushAction("y", [ 0,  0, +1]);
            pushAction("x", [ 0, +1,  0]);
            pushAction("y", [ 0,  0, +1]);
            pushAction("x", [ 0, -1,  0]);
            pushAction("x", [ 0, -1,  0]);
        }

        for (let i = 0; i < 10; i++) {
            if (futureFaces[10].color == futureFaces[14].color &&
                futureFaces[19].color == futureFaces[23].color) {
                break;
            }

            if (futureFaces[10].color == futureFaces[14].color) {
                pushAction("y", [+1, +1, +1]);
                pushAction("y", [+1, +1, +1]);
                pushActionSet();
                continue;
            }

            if (futureFaces[19].color == futureFaces[23].color) {
                pushAction("y", [-1, -1, -1]);
                pushActionSet();
                continue;
            }

            if (futureFaces[28].color == futureFaces[32].color) {
                pushActionSet();
                continue;
            }

            if (futureFaces[37].color == futureFaces[41].color) {
                pushAction("y", [+1, +1, +1]);
                pushActionSet();
                continue;
            }

            if (true) {
                pushActionSet();
                continue;
            }

            return null;
        }
        return normalizeActions(actions);
    }

    function whiteEdgeHandler(id, edgeColor) {
        setActionBtnClickEvent(id, "", function() {
            return whiteEdgeActions(edgeColor);
        });
    }
    
    function whiteCornerHandler(id, edgeColor1, edgeColor2) {
        setActionBtnClickEvent(id, "", function() {
            return whiteCornerActions(edgeColor1, edgeColor2);
        });
    }

    function middleEdgeHandler(id, edgeColor1, edgeColor2) {
        setActionBtnClickEvent(id, "", function() {
            return middleEdgeActions(edgeColor1, edgeColor2);
        });
    }
