<script setup>
import { onMounted, onUnmounted } from 'vue'

const THREE = window.THREE;
const fractalRootOrigin = new THREE.Vector3(0, 1, 0);
let fractalTree = [];
let branchTriangles = new Map(); // array of lines: [ind, [orig-forward, orig-perp, forward-perp]]

AFRAME.registerComponent('pinch-listener', {
  init: function () {
    // Get the hand tracking controls entity
    const handTrackingControls = this.el.components['hand-tracking-controls'];

    // Listen for pinch events
    handTrackingControls.addEventListener('pinchstart', (event) => {
      console.log('Pinch start event:', event);
      // Handle pinch start event
    });

    handTrackingControls.addEventListener('pinchend', (event) => {
      console.log('Pinch end event:', event);
      // Handle pinch end event
    });
  }
});

AFRAME.registerComponent('branch-no-magnet', {
  init: function () {
    this.tempV3 = new THREE.Vector3();
    this.tempV32 = new THREE.Vector3();
    this.maxDistance = 0.05;
    this.squeezedEl = null;
    this.isForward = false;
    this.handEl = null;
    this.squeezedInd = null;

    this.selectstart = this.selectstart.bind(this);
    this.squeeze = this.squeeze.bind(this);
    this.squeezestart = this.squeezestart.bind(this);
    this.squeezeend = this.squeezeend.bind(this);

    this.el.addEventListener('selectstart', this.selectstart);
    this.el.addEventListener('squeeze', this.squeeze);
    this.el.addEventListener('squeezestart', this.squeezestart);
    this.el.addEventListener('squeezeend', this.squeezeend);

    this.onPinchedStart = this.onPinchStarted.bind(this);
    this.onPinchedMov = this.onPinchMoved.bind(this);
    this.onPinchedEnd = this.onPinchEnded.bind(this);

    this.el.sceneEl.addEventListener('pinchstarted', this.onPinchStarted);
    this.el.sceneEl.addEventListener('pinchmoved', this.onPinchMoved);
    this.el.sceneEl.addEventListener('pinchended', this.onPinchEnded);

    // TODO separate this
    this.redrawTriangle = () => {
      this.squeezedInd = parseInt(this.squeezedEl.getAttribute('ind'));
      let triangle = branchTriangles.get(this.squeezedInd);
      let forwardEntity = document.getElementById('branch_' + this.squeezedInd);
      let perpEntity = document.getElementById('branch_perp_' + this.squeezedInd);
      let forwardLine = triangle[0];

      forwardEntity.object3D.getWorldPosition(this.tempV32);
      forwardLine.geometry.attributes.position.setXYZ(1,
        this.tempV32.x, this.tempV32.y, this.tempV32.z);
      forwardLine.geometry.attributes.position.needsUpdate = true;
      let hipoLine = triangle[2];
      hipoLine.geometry.attributes.position.setXYZ(0,
        this.tempV32.x, this.tempV32.y, this.tempV32.z);

      perpEntity.object3D.getWorldPosition(this.tempV32);
      let perpLine = triangle[1];
      perpLine.geometry.attributes.position.setXYZ(1,
        this.tempV32.x, this.tempV32.y, this.tempV32.z);
      perpLine.geometry.attributes.position.needsUpdate = true;

      hipoLine.geometry.attributes.position.setXYZ(1,
        this.tempV32.x, this.tempV32.y, this.tempV32.z);
      hipoLine.geometry.attributes.position.needsUpdate = true;
    }
  },
  selectstart(event) {
    const yourPinchThreshold = 0.1;
    const xrHand = event.detail.inputSource.hand;

    const renderer = this.el.sceneEl.renderer;
    const referenceSpace = renderer.xr.getReferenceSpace();

    if (xrHand) {
      // Iterate through the entries of the Map
      const thumbJoint = xrHand.get('thumb-tip'); // Replace with the correct joint name
      const indexJoint = xrHand.get('index-finger-tip'); // Replace with the correct joint name

      if (thumbJoint && indexJoint) {
        const thumbJointPose = event.detail.frame.getJointPose(thumbJoint, referenceSpace);
        const indexJointPose = event.detail.frame.getJointPose(indexJoint, referenceSpace);
        // xrHand.getJointPose(indexJoint, indexJointPose);

        // Access the positions from the poses
        const thumbTipPosition = thumbJointPose.transform.position;
        const indexTipPosition = indexJointPose.transform.position;

        const tempV31 = new THREE.Vector3();
        const tempV32 = new THREE.Vector3();
        tempV31.set(thumbTipPosition.x,thumbTipPosition.y,thumbTipPosition.z);
        tempV32.set(indexTipPosition.x, indexTipPosition.y, indexTipPosition.z);
        // Calculate distance between thumb and index finger tips
        const distance = tempV31.distanceTo(tempV32);

        // Check if the distance is below a certain threshold to indicate pinch
        if (distance < yourPinchThreshold) {
          // Pinch gesture detected
          console.log('pinch detected');
        }
      }

    }
  },
  squeeze(event) {

  },
  squeezestart(event) {
    if (document.getElementsByClassName('branch').length < 2)
      return;

    this.handEl = event.target;
    this.startHolding();
    // let handPos = this.handEl.object3D.getWorldPosition(this.tempV32);

    // let elList = [];

    // let branches = document.getElementsByClassName('branch');
    // for (var i = 0; i < branches.length; i++) {
    //   elList.push(branches[i]);
    // }
    // for (let i = 0; i < elList.length; i++) {
    //   if (elList[i].object3D.position.distanceTo(handPos) < this.maxDistance) {
    //     this.squeezedEl = elList[i];
    //     this.isForward = true;
    //     return;
    //   }
    // }
    // elList = [];
    // let branches_perp = document.getElementsByClassName('branch_perp');
    // for (var i = 0; i < branches_perp.length; i++) {
    //   elList.push(branches_perp[i]);
    // }
    // for (let i = 0; i < elList.length; i++) {
    //   if (elList[i].object3D.getWorldPosition(this.tempV3).distanceTo(handPos) < this.maxDistance) {
    //     this.squeezedEl = elList[i];
    //     this.isForward = false;
    //     break;
    //   }
    // }
  },
  squeezeend(event) {
    this.squeezedEl = null;
  },
  onPinchStarted(event) {
    console.log('onPinchedStarted');
    this.handEl = event.target;
    this.startHolding();
  },
  onPinchMoved(event) {
    console.log('onPinchedMoved');
  },
  onPinchEnded(event) {
    console.log('onPinchedEnded');
    this.squeezedEl = null;
  },

  startHolding() {
    let handPos = this.handEl.object3D.getWorldPosition(this.tempV32);

    let elList = [];

    let branches = document.getElementsByClassName('branch');
    for (var i = 0; i < branches.length; i++) {
      elList.push(branches[i]);
    }
    for (let i = 0; i < elList.length; i++) {
      if (elList[i].object3D.position.distanceTo(handPos) < this.maxDistance) {
        this.squeezedEl = elList[i];
        this.isForward = true;
        return;
      }
    }
    elList = [];
    let branches_perp = document.getElementsByClassName('branch_perp');
    for (var i = 0; i < branches_perp.length; i++) {
      elList.push(branches_perp[i]);
    }
    for (let i = 0; i < elList.length; i++) {
      if (elList[i].object3D.getWorldPosition(this.tempV3).distanceTo(handPos) < this.maxDistance) {
        this.squeezedEl = elList[i];
        this.isForward = false;
        break;
      }
    }
  },


  tick() {
    if (this.squeezedEl) {
      if (this.isForward) {
        this.squeezedEl.object3D.position.copy(this.handEl.object3D.getWorldPosition(this.tempV32));
      } else {
        this.squeezedEl.object3D.position.copy(this.handEl.object3D.getWorldPosition(this.tempV32))
          .sub(this.squeezedEl.object3D.parent.position);
      }
      // redrawTriangle // TODO
      this.redrawTriangle();
    }
  }
});

// Adding a next fractal branch to the root
const addBranch = (event, branchPos = new THREE.Vector3(0, 1.5, 0),
  branchPerpPos = new THREE.Vector3(0.25, -0.5, 0), perpAbs = false) => {

  const scene = document.querySelector('a-scene');
  const originalEntity = document.getElementById('branch_');

  const clonedEntity = cloneWithChildren(originalEntity);
  clonedEntity.setAttribute('ind', fractalTree.length + 1);
  clonedEntity.object3D.position.copy(branchPos);
  let perp = clonedEntity.getChildren().find((el) => el.id.startsWith('branch_perp_'));
  perp.setAttribute('ind', fractalTree.length + 1);
  if (perpAbs) {
    branchPerpPos.sub(branchPos);
  }
  perp.object3D.position.copy(branchPerpPos);
  perp.setAttribute('position',
    '' + branchPerpPos.x + ' ' + branchPerpPos.y + ' ' + branchPerpPos.z);
  clonedEntity.setAttribute('id', originalEntity.id + (fractalTree.length + 1));
  // clonedEntity.setAttribute('position', '0 1.5 0');

  fractalTree.push(clonedEntity);
  scene.appendChild(clonedEntity);
  addBranchTriangle(clonedEntity);
}

const cloneWithChildren = (originalEntity) => {
  const attrsToCopy = ['position', 'rotation'];
  const clonedEntity = originalEntity.cloneNode(true);
  for (const originalChild of originalEntity.children) {
    let clonedChild = [...clonedEntity.children].find((c) => c.getAttribute('id') == originalChild.getAttribute('id'));
    attrsToCopy.forEach((a) => clonedChild.setAttribute(a, originalChild.getAttribute(a)));
    clonedChild.id = clonedChild.id + (fractalTree.length + 1);
  }
  return clonedEntity;
}

const addBranchTriangle = (newBranch) => {
  let tempV3 = new THREE.Vector3();
  let lines = [];
  const ind = newBranch.getAttribute('ind');
  let perpEntity = document.getElementById('branch_perp_' + ind);
  perpEntity.object3D.getWorldPosition(tempV3);
  lines.push(drawLine([fractalRootOrigin, newBranch.object3D.position], 'blue'));
  lines.push(drawLine([fractalRootOrigin, tempV3], 'green'));
  lines.push(drawLine([newBranch.object3D.position, tempV3], 'yellow'));
  branchTriangles.set(parseInt(newBranch.getAttribute('ind')), lines);
}

// Remove the last branch from the tree
const removeBranch = () => {
  const scene = document.querySelector('a-scene');
  var threeScene = scene.object3D;
  const indexOfLast = fractalTree.length;
  // remote lines of a branch triangle
  if (branchTriangles.has(indexOfLast)) {
    const triangle = branchTriangles.get(indexOfLast);
    triangle.forEach((line) => {
      threeScene.remove(line);
    });
    branchTriangles.delete(indexOfLast);
  }
  const entityToRemove = fractalTree.pop();
  if (entityToRemove)
    entityToRemove.remove();
}

const removeAllBranches = () => {
  const cnt = fractalTree.length;
  for (let i = 0; i < cnt; i++) {
    removeBranch();
  }
}


const handleKeyDown = (event) => {
  const cameraEntity = document.getElementById('cameraRig');
  // Access the key code of the pressed key
  const keyCode = event.keyCode;
  // console.log('key pressed: ' + keyCode);
  // Example: Check if 'Space' key is pressed (keyCode 32)
  if (keyCode === 32) {
    // Do something when the 'Space' key is pressed
  }

  // Z - camera down
  if (keyCode == 90) {
    cameraEntity.object3D.position.y -= 0.0125;
  }
  // Q - camera up
  if (keyCode == 81) {
    cameraEntity.object3D.position.y += 0.0125;
  }
};

const switchLight = (mode) => {
  const dayEnvironment = "lighting:none;preset:yavapai;skyType:atmosphere;";
  const nightEnvironment = "lighting:none;preset:starry;skyType:atmosphere;";

  const dirlightEl = document.getElementById('dirlight');
  const environmentEl = document.getElementById('environment');
  if (mode == 'day') {
    dirlightEl.setAttribute('intensity', '1');
    environmentEl.setAttribute('environment', dayEnvironment);
  } else {
    dirlightEl.setAttribute('intensity', '0');
    environmentEl.setAttribute('environment', nightEnvironment);
  }

}

const exitVR = () => {
  AFRAME.scenes[0].exitVRBound();
}

const drawLine = (points, color) => {
  var aframeScene = document.querySelector("a-scene");

  // Access the THREE.js scene
  var threeScene = aframeScene.object3D;
  points = [points[0], points[1]];
  var lg = new THREE.BufferGeometry().setFromPoints(points);
  const lm = new THREE.LineBasicMaterial({ color: color });
  var line = new THREE.Line(lg, lm);
  threeScene.add(line);
  return line;
}

onMounted(() => {
  drawLine([new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0)], 'blue');
  drawLine([new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.5, 0, 0)], 'yellow');
  drawLine([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.5, 0, 0)], 'green');
  // Attach the keyboard event listener
  window.addEventListener('keydown', handleKeyDown);

});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

///// static fractal tree generation

const base = [
  new THREE.Vector3(0, 0, 0), // [0] - center of triangle
  new THREE.Vector3(0, 1, 0), // forward vector
  new THREE.Vector3(1, 0, 0), // right vector
  new THREE.Vector3(0, 0, 0)]; // close triangle

let lines = []; // lines of the tree

const clearTree = () => {
  var aframeScene = document.querySelector("a-scene");
  var threeScene = aframeScene.object3D;
  lines.forEach((l) => {
    threeScene.remove(l);
  });
}

const generateTree = () => {
  var aframeScene = document.querySelector("a-scene");
  var threeScene = aframeScene.object3D;
  lines.forEach((l) => {
    threeScene.remove(l);
  });
  let branches = [];
  fractalTree.forEach((branch) => {
    let forwarWorldPos = new THREE.Vector3();
    branch.object3D.getWorldPosition(forwarWorldPos);
    let perpWorldPos = new THREE.Vector3();
    branch.firstChild.object3D.getWorldPosition(perpWorldPos);
    branches.push([
      new THREE.Vector3(0, 1, 0),
      forwarWorldPos, // Y - forward vector 
      perpWorldPos, // X - right vector
      new THREE.Vector3(0, 1, 0)
    ]);
  })
  drawFractal(base, branches, 1);
}

const addRandomTree = () => {
  const presets = [
    // 0
    [[
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.3, 0.8, 0.2), // Y - forward vector 
      new THREE.Vector3(0.5, 0, 0.5), // X - right vector
      new THREE.Vector3(0, 0, 0)
    ],
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.3, 0.8, -0.2), // Y - forward vector 
      new THREE.Vector3(0.5, 0, 0.5), // X - right vector
      new THREE.Vector3(0, 0, 0)
    ],
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.3, 0.8, 0.2), // Y - forward vector 
      new THREE.Vector3(0.5, 0, 0.5), // X - right vector
      new THREE.Vector3(0, 0, 0)
    ],
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.3, 0.8, -0.2), // Y - forward vector 
      new THREE.Vector3(0.5, 0, 0.5), // X - right vector
      new THREE.Vector3(0, 0, 0)
    ]],
    // 1
    [[
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.3, -0.3, 0), // Y - forward vector 
      new THREE.Vector3(0.5, 0, 0), // X - right vector
      new THREE.Vector3(0, 0, 0)
    ],
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.6, 0), // Y - forward vector 
      new THREE.Vector3(0.5, 0, 0), // X - right vector
      new THREE.Vector3(0, 0, 0)
    ],
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.3, -0.3, 0), // Y - forward vector 
      new THREE.Vector3(0.5, 0, 0), // X - right vector
      new THREE.Vector3(0, 0, 0)
    ],
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.2, 0.2), // Y - forward vector 
      new THREE.Vector3(0, -0.5, 0.2), // X - right vector
      new THREE.Vector3(0, 0, 0)
    ],
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.2, -0.2), // Y - forward vector 
      new THREE.Vector3(0, -0.5, -0.2), // X - right vector
      new THREE.Vector3(0, 0, 0)
    ]
    ],
    // 2
    [[
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.5, 0.2), // Y - forward vector 
      new THREE.Vector3(0.5, 0, 0), // X - right vector
      new THREE.Vector3(0, 0, 0)
    ],
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.5, -0.2), // Y - forward vector 
      new THREE.Vector3(0.5, 0, 0), // X - right vector
      new THREE.Vector3(0, 0, 0)
    ],
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.4, 0.9, 0.3), // Y - forward vector 
      new THREE.Vector3(0.5, 0, 0), // X - right vector
      new THREE.Vector3(0, 0, 0)
    ],
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.4, 0.5, 0), // Y - forward vector 
      new THREE.Vector3(0.5, 0, 0), // X - right vector
      new THREE.Vector3(0, 0, 0)
    ]],
    // 3
    [[
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0.9, 0), // Y - forward vector 
      new THREE.Vector3(0.5, 0, 0), // X - right vector
      new THREE.Vector3(0, 0, 0)
    ],
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.4, 0.4, 0.4), // Y - forward vector 
      new THREE.Vector3(0.4, 0, 0.4), // X - right vector
      new THREE.Vector3(0, 0, 0)
    ],
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.4, 0.4, -0.4), // Y - forward vector 
      new THREE.Vector3(0.4, 0, -0.4), // X - right vector
      new THREE.Vector3(0, 0, 0)
    ],
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.4, 0.4, 0.4), // Y - forward vector 
      new THREE.Vector3(-0.4, 0, 0.4), // X - right vector
      new THREE.Vector3(0, 0, 0)
    ],
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.4, 0.4, -0.4), // Y - forward vector 
      new THREE.Vector3(-0.4, 0, 0.4), // X - right vector
      new THREE.Vector3(0, 0, 0)
    ]]
  ];

  presets[Math.floor(Math.random() * presets.length)].forEach((triangle) => {
    triangle.forEach((p) => {
      p.add(fractalRootOrigin);
    })
    addBranch(null, triangle[1], triangle[2], true);
  });

}

const drawFractal = (base, branches, level) => {
  if (level > 4)
    return;

  if (level > 1) {
    lines.push(drawLine(base, 'blue'));

    branches.forEach((b) => {
      lines.push(drawLine(b, 'blue'));
    });
  }

  // 1. Scale relative to base
  var scaledBranchesWithBase = scaleBranches(base, branches);

  // 2. Align with forward axis
  var alignedForwardBranches = alignForwardBranches(scaledBranchesWithBase); // function will change source data, no needs to return

  // 3. Align with plane
  var alignedPlaneBranches = alignPlaneBranches(alignedForwardBranches);

  // 4. Position in place
  var positioned = moveInPosition(alignedPlaneBranches);
  positioned.forEach((b) => {
    var l = b.length;
    for (var i = 1; i < l; i++) {
      lines.push(drawLine(b[i], 'white')); // new scaled base
    }
  });

  positioned.forEach((p) => {
    drawFractal(p[0], p.splice(1), level + 1);
  });
}


const moveInPosition = (data) => {
  var result = [];
  data.forEach((branchData) => {
    var branch = branchData[0];
    var newBase = branchData[1];
    var deltaVector = branch[1].clone().sub(newBase[1]);

    var newBranches = branchData.splice(2); // take only new scaled branches
    newBranches.forEach((nb) => {
      nb.forEach((point) => {
        point.add(deltaVector);
      })
    });
    result.push([branch, ...newBranches]);
  });
  return result;
}


// rotate around newBase's forward vector to make planes of branch and scaled branch parallel
const alignPlaneBranches = (data) => {
  var result = [];
  data.forEach((branchData) => {
    var branch = branchData[0];
    var newBase = branchData[1];

    var branchPerp = getTrPerp(branch);
    var newBasePerp = getTrPerp(newBase);

    var alignAngle = branchPerp.angleTo(newBasePerp);
    const pa = newBase[0].clone();
    const perpsAxis = pa.crossVectors(branchPerp, newBasePerp).normalize();
    const qRotation = new THREE.Quaternion();
    qRotation.setFromAxisAngle(perpsAxis, -alignAngle);
    const alignMatrix = new THREE.Matrix4();
    alignMatrix.makeRotationFromQuaternion(qRotation);

    newBase.forEach((point) => {
      point.applyMatrix4(alignMatrix);
    })

    var newBranches = branchData.splice(2); // take only new scaled branches
    newBranches.forEach((nb) => {
      nb.forEach((point) => {
        point.applyMatrix4(alignMatrix);
      })
    });
    result.push([branch, newBase, ...newBranches]);
  });
  return result;

}

// [ [branch (previous), newBase (scaled), b1 (scaled), b2 (scaled), ...] ... ]
// align couples of [newBase,b1], [newBase:b2] relative branch forward axis
const alignForwardBranches = (data) => {
  var result = [];
  data.forEach((branchData) => {
    var branch = branchData[0];
    var newBase = branchData[1];


    var branchForwardAxis = branch[1].clone().sub(branch[0]);
    var newBaseForwardAxis = newBase[1].clone().sub(newBase[0]);

    var alignAngle = branchForwardAxis.angleTo(newBaseForwardAxis);

    const pa = newBase[1].clone();
    const perpsAxis = pa.crossVectors(branchForwardAxis, newBaseForwardAxis).normalize();
    const qRotation = new THREE.Quaternion();
    qRotation.setFromAxisAngle(perpsAxis, -alignAngle);
    const alignMatrix = new THREE.Matrix4();
    alignMatrix.makeRotationFromQuaternion(qRotation);

    newBase.forEach((point) => {
      point.applyMatrix4(alignMatrix);
    })

    var newBranches = branchData.splice(2); // take only new scaled branches
    newBranches.forEach((nb) => {
      nb.forEach((point) => {
        point.applyMatrix4(alignMatrix);
      })
    });
    result.push([branch, newBase, ...newBranches]);
  })
  return result;
}

const scaleBranches = (base, branches) => {

  var newBranchesWithBases = [];

  branches.forEach((branch) => {
    var newBrancheWithBase = [];
    var scaleVal = branch[0].distanceTo(branch[1]) / base[0].distanceTo(base[1]);
    const scaleVector = new THREE.Vector3(scaleVal, scaleVal, scaleVal);
    const m = new THREE.Matrix4();
    m.scale(scaleVector);
    var newBase = cloneAr(base);
    newBase.forEach((point) => {
      point.applyMatrix4(m);
    })

    newBrancheWithBase.push(branch);
    newBrancheWithBase.push(newBase);

    branches.forEach((b) => {
      var nb = cloneAr(b);
      nb.forEach((point) => {
        point.applyMatrix4(m);
      })

      newBrancheWithBase.push(nb);
      newBranchesWithBases.push(newBrancheWithBase);
    });



  });
  return newBranchesWithBases;
}

const cloneAr = (ar) => {
  if (Array.isArray(ar)) {
    return ar.map(el => cloneAr(el));
  }
  return ar.clone();
}

const getTrPerp = (triangle) => {
  var trStartPoint = triangle[0];
  var v1 = triangle[1].clone().sub(trStartPoint);
  var v2 = triangle[2].clone().sub(trStartPoint);

  const perpendicularVector = new THREE.Vector3();
  const perp = perpendicularVector.crossVectors(v1, v2).normalize();

  return perp;
}





</script>

<template>
  <a-scene webxr="overlayElement:#dom-overlay;"
    gltf-model="dracoDecoderPath: https://cdn.jsdelivr.net/npm/three@0.129.0/examples/js/libs/draco/gltf/;"
    cursor="rayOrigin: mouse" raycaster="objects: [html],.clickable; interval:100;"
    render-order="background, menu, menubutton, menutext, foreground, hud">

    <a-assets>


      <a-sphere id="branch_" ind color="green" radius="0.025" data-pick-up data-magnet-range="0.2,0.1,360,180"
        class="branch clickable left-no-magnet right-no-magnet"
        animation__press="startEvents:press;property:components.material.material.color;type:color;to:green;dur:100;"
        animation__release="startEvents:release;property:components.material.material.color;type:color;to:grey;dur:100;">

        <a-sphere id="branch_perp_" ind color="red" radius="0.0125" data-pick-up data-magnet-range="0.2,0.1,360,180"
          class="branch_perp clickable left-no-magnet right-no-magnet" position="0.25 -0.5 0"
          animation__press="startEvents:press;property:components.material.material.color;type:color;to:green;dur:100;"
          animation__release="startEvents:release;property:components.material.material.color;type:color;to:grey;dur:100;"></a-sphere>

      </a-sphere>

      <a-asset-item id="right-gltf"
        src="https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/skeleton-right-hand-webxr/model.gltf"></a-asset-item>
      <a-asset-item id="left-gltf"
        src="https://vazxmixjsiawhamofees.supabase.co/storage/v1/object/public/models/skeleton-left-hand-webxr/model.gltf"></a-asset-item>


    </a-assets>

    <a-sphere color="red" radius="0.01" id="cursor" material="shader:flat"></a-sphere>

    <a-box id="box1" class="clickable magnet-left magnet-right" color="gray" position="0.5 1.5 0"
      scale="0.05 0.05 0.05"></a-box>
    <a-box id="box2" class="clickable magnet-left magnet-right" color="green" position="1 1.5 0"
      scale="0.05 0.05 0.05"></a-box>

    <!-- <a-box id="box3" hand-tracking-controls></a-box> -->

    <a-entity id="cameraRig" spawn-in-circle="radius:3" movement-controls="speed:0.15;camera:#head;" position="0 0 2"
      rotation="0 0 0">
      <!-- camera -->
      <a-entity class="head" camera="near:0.01;" look-controls="pointerLockEnabled: false" position="0 1.65 0"></a-entity>

      <!-- Hand tracking -->
      <a-entity handy-controls="materialOverride:both;" material="color:gold;metalness:1;roughness:0;">

        <!-- These also do teleportaion for Blink controls in VR -->
        <!-- These are present for hand tracking but hands don't have joysticks so do nothing -->
        <a-entity data-right="ray" cursor
          raycaster="showLine: true; far: 100; lineColor: red; objects: [html]; interval:100;"></a-entity>
        <a-entity data-left="ray" cursor
          raycaster="showLine: true; far: 100; lineColor: red; objects: [html]; interval:100;"></a-entity>

        <!-- These get drawn towards grabable objects, moving the whole hand and the attached elements -->
        <a-entity id="left-magnet" position="0 0.6 0" class="avatar-hand-left" data-left="grip" data-magnet="magnet-left"
          grab-magnet-target="startEvents:squeezestart,pose_fist;stopEvents:pose_flat_fuseShort,squeezeend;noMagnetEl:#left-no-magnet;">
        </a-entity>
        <a-entity id="right-magnet" position="0 0.6 0" class="avatar-hand-right" data-right="grip"
          data-magnet="magnet-right"
          grab-magnet-target="startEvents:squeezestart,pose_fist;stopEvents:pose_flat_fuseShort,squeezeend;noMagnetEl:#right-no-magnet;">
        </a-entity>

        <!-- markers to let us know the real location of the hands, you probably want to make them visible="false" or just make them empty <a-entities> -->
        <a-entity id="left-no-magnet" branch-no-magnet data-left="grip" radius="0.01">
          <a-entity html="cursor:#cursor;html:#my-interface" position="-0.142 -0.0166 -0.02928" rotation="-80 90 0"
            scale="0.5 0.5 0.5"></a-entity>
        </a-entity>
        <a-entity id="right-no-magnet" branch-no-magnet data-right="grip" radius="0.01"></a-entity>
      </a-entity>
    </a-entity>

    <a-light id="dirlight" intensity="1" light="castShadow:false;type:directional" position="40 80 0"></a-light>
    <a-light type="hemisphere" ground-color="orange" color="white" intensity="0"></a-light>
    <a-circle hide-on-enter-ar shadow="cast:false" class="navmesh" rotation="-90 0 0" radius="6"
      material="shader:phong;color:white;"></a-circle>
    <a-entity id="environment" hide-on-enter-ar position="0 -0.2 0"
      environment="lighting:none;preset:yavapai;skyType:atmosphere;">
    </a-entity>

    <!-- Fractal Base 
    <a-cylinder id="startStick" position="0 0.5 0" radius="0.01"
      height="1" color="red" material="shader:phong;color:white;">
    </a-cylinder> -->
  </a-scene>
  <div id="dom-overlay" class="a-dom-overlay">
    <header style="pointer-events: none; user-select: none;">
      <h1>
        Fractals 3D
      </h1>
      <div style="color: black">
        <p>Hints:</p>
        <ul>
          <li>Add a New Branch (or press Random). More branches more time for generation, be careful.</li>
          <li>Try to move the vertices of the triangles.</li>
          <li>Press Generate for Tree generation.</li>
        </ul>
      </div>
    </header>
    <section
      style="display: inline-block; background: lavenderblush; color: #333333; border-radius: 1em; padding: 1em; margin:0; accent-color: hotpink;"
      id="my-interface">
      <fieldset style="border-radius: 1em; margin-bottom: 5px;">
        <legend>Branches</legend>
        <button @click="addBranch" style="margin-right: 5px;">Add New</button>
        <button @click="removeBranch" style="margin-right: 5px;">Remove Last</button>
        <button @click="removeAllBranches">Clear All</button>
      </fieldset>
      <fieldset style="border-radius: 1em; margin-bottom: 5px;">
        <legend>Tree</legend>
        <button @click="generateTree" style="margin-right: 5px;">Generate</button>
        <button @click="addRandomTree" style="margin-right: 5px;">Random (preset)</button>
        <button @click="clearTree" style="margin-right: 5px;">Clear</button>
      </fieldset>
      <fieldset style="border:0 none;border-top: 1px solid grey;">
        <legend>Light</legend>
        <input @click="switchLight('day')" type="radio" id="light-day" name="light" value="day" checked="">
        <label>Day</label>
        <input @click="switchLight('night')" type="radio" id="light-night" name="light" value="night">
        <label>Night</label>
      </fieldset>
      <div style="display: flex; justify-content: center; margin-top: 1em;"><button @click="exitVR"
          style="display: block; border-radius: 1em;">Exit Immersive</button></div>
    </section>
  </div>
</template>

<style>
a-scene {
  height: 95vh;
}

body {
  font-size: 16px;
}

* {
  box-sizing: border-box;
}

#dom-overlay {
  font-family: Sans-Serif;
  color: white;
}

#dom-overlay .overlay-footer {
  background: #00000066;
  padding: 1em;
  margin: 0;
  position: absolute;
  inset: auto 0 0 0;
}
</style>
