// Find the latest version by visiting https://cdn.skypack.dev/three.
//import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js';

import * as THREE from "https://cdn.skypack.dev/three@0.137.5";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as dat from "dat.gui";

var heatVertex = `
  uniform sampler2D heightMap;
  uniform float heightRatio;
  varying vec2 vUv;
  varying float hValue;
  void main() {
    vUv = uv;
    vec3 pos = position;
    hValue = texture2D(heightMap, vUv).r;
    pos.y = hValue * heightRatio;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
  }
`;

var heatFragment = `
  varying float hValue;
  
  // honestly stolen from https://www.shadertoy.com/view/4dsSzr
  
  //vec3 heatmapGradient(float t) {
  //return clamp((pow(t, 1.5) * 1.8 + 1.2) * vec3(smoothstep(1.0, 1.35, t) + t * 0.5, smoothstep(0.5, 1.0, t), max(1.0 - t * 1.7, t * 7.0 - 5.0)), 0.0, 1.0);
  //return  vec3(0.15,0.5,0.6);
  //}
 
  vec3 heatmapGradient(float t) {
    vec3 c = 1.0 - pow(abs(vec3(t) - vec3(0.65, 0.5, 0.2)) * vec3(3.0, 3.0, 5.0), vec3(1.5, 1.3, 1.7));
  //  c.r = max((0.15 - square(abs(t - 0.04) * 5.0)), c.r);
   c.r = (t > 0.5) ? smoothstep(0.32, 4.35, t  + 0.4) : c.r;
     c.g = (t < 0.5) ? smoothstep(0.04, 0.45, t) : c.g;
    return clamp(c, 0.0, 1.0);
      }
      
void main() {
    float v = abs(hValue - 1.);
    gl_FragColor = vec4(heatmapGradient(hValue), 1. - v * v) ;
  }
`;
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(
  830,
  window.innerWidth / window.innerHeight,
  1,
  1000
);
camera.position.set(0, -70, 0);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//var controls = new THREE.OrbitControls(camera, renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
//scene.add(new THREE.GridHelper(100, 200, 0x014000, 0x000040)); //(percent, number of squers in a row)
var planeGeometry = new THREE.PlaneGeometry(200, 200, 19, 19);
var geom = new THREE.BoxBufferGeometry();

var material = new THREE.ShaderMaterial({
  uniforms: {
    thickness: {
      value: 0.0,
    },
    color: {
      value: new THREE.Color(),
    },
  },

  extensions: { derivatives: true },
});
var changable = THREE.Math.randInt(1, 23);

function createGrid() {
  for (let i = 0.5; i <= 7.5; i++) {
    for (let j = 0.5; j <= 14.5; j++) {
      let box = new THREE.Mesh(geom, material);
      box.material.uniforms.color.value.set(0xffff00);
      // let rand = floatArray[THREE.Math.randInt(0, 7)];
      //     box.material.uniforms.color.value.set(rand* 0xffffff);
      // console.log("rand", n);
      box.scale.y = THREE.Math.randInt(1, 1);
      box.position.set(i + changable, 0, j + changable);
      scene.add(box);
    }
  }
}

planeGeometry.rotateX(-Math.PI * 1.5);
//var heightMap = createHeightMap();
function createHeightMap() {
  var canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 200;
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 200, 200);
  for (let i = 0.0; i <= 200.0; i++) {
    for (let j = 0.0; j <= 200.0; j++) {
      var x = i;
      var y = j;
      var radius = 1.000001;
      var grd = ctx.createRadialGradient(x, y, 1, x, y, radius);
      var h8 = Math.floor(Math.random() * 855);
      //   console.log(i,"rgb("+ h8 + "," + h8 + "," + h8 +")");
      grd.addColorStop(0, "rgb(149,349,349)");
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, 200, 200); //plane position
      // console.log("ctx ",ctx);
    }
  }
  //console.log("ctx ",ctx);
  return new THREE.CanvasTexture(canvas);
}
function createMap() {
  var heightMap = createHeightMap();

  //console.log(planeGeometry.parameters);
  var heat = new THREE.Mesh(
    planeGeometry,
    new THREE.ShaderMaterial({
      color: "blue",

      uniforms: {
        heightMap: { value: heightMap },
        heightRatio: { value: THREE.Math.randInt(0, 0) },
      },
      vertexShader: heatVertex,
      fragmentShader: heatFragment,
      transparent: true,
      wireframe: true,
    })
  );
  //console.log(heat);

  scene.add(heat);
  createGrid();
}

//var gui = new dat.GUI();
//gui.add(heat.material.uniforms.heightRatio, "value", 0, 15).name("heightRatio");
/*
var clock = new THREE.Clock();
renderer.createHeightMap(() => {
uniforms.time.value = clock.getElapsedTime() * 0.125;
renderer.render(scene, camera);
});

*/
render();
function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}

var state = {
  clock: new THREE.Clock(),
  frame: 0,
  maxFrame: 10,
  fps: 2,
  per: 0,
};

state.clock.start();
loop();
function loop() {
  // USING THE GET DELTA METHOD
  var secs = state.clock.getDelta();
  scene.clear();
  requestAnimationFrame(loop);

  // while(scene.children.length > 0){
  //   scene.remove(scene.children[0]);
  //}
  // createGrid();
  createMap();
  //console.log(' Two frame rendering interval ',secs*1000+' millisecond ');
  //console.log(' View rendering rate per second ',1/secs);
  renderer.render(scene, camera);
}

//https://jsfiddle.net/prisoner849/81rqxd20/
